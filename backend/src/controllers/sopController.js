import SOPChunk from "../models/SOPChunk.js";
import { parsePDF } from "../utils/pdfUtils.js";
import { getEmbedding } from "../utils/embeddings.js";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

/* ---------------- PDF UPLOAD ---------------- */
export const uploadSOP = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });
    const { originalname, buffer } = req.file;

    const chunks = await parsePDF(buffer, originalname);
    await SOPChunk.deleteMany({ documentName: originalname });

    const docs = [];
    for (const c of chunks) {
      const embedding = await getEmbedding(c.chunkText);
      if (embedding) docs.push({ ...c, embedding });
    }

    await SOPChunk.insertMany(docs);
    res.json({ success: true, message:`Successfully ingested ${docs.length} chunks from ${originalname}.`  });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

/* ---------------- CHAT ASK (FIXED) ---------------- */
export const askQuestion = async (req, res) => {
  try {
    const { question, history = [] } = req.body;

    if (!question) return res.status(400).json({ error: "Question is required" });

    const queryEmbedding = await getEmbedding(question);

    // 🔹 Retrieve ~35 best chunks (RAG spec)
    const results = await SOPChunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 200,
          limit: 15
        }
      }
    ]);

    if (results.length === 0)
      return res.json({ answer: "No relevant info found.", sources: [] });

    // 🔹 Build context, but keep it safe (max 9–10k characters)
    let context = "";
    for (const r of results) {
      const line = `[${r.documentName} | Page ${r.page}${r.section ? ` | Section ${r.section}` : ""}]\n${r.chunkText}\n\n`;
      if ((context + line).length > 9000) break;
      context += line;
    }

    // 🔹 Strong hallucination guardrails
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        {
          role: "system",
          content:
           "You are a document Q&A assistant. Answer ONLY using the provided context. Cite page and section exactly as shown. " +
           "If the answer is missing or unclear, say: 'I don’t know based on the current context.' Do NOT invent details."

        },
        ...history.slice(-4),
        { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` }
      ],
      max_tokens: 1024,
      temperature: 0.2
    });

    const answer = completion.choices[0].message.content.trim();

    // 🔹 Only cite pages that actually appeared in retrieval
    const uniqueSources = [
      ...new Map(
        results.map(r => [
          `${r.documentName}-${r.page}-${r.section || ""}`,
          {
            document: r.documentName,
            page: r.page,
            section: r.section || null
          }
        ])
      ).values()
    ];

    res.json({ answer, sources: uniqueSources });

  } catch (e) {
    console.error("Ask Error:", e.message);
    res.status(500).json({ error: e.message });
  }
};


   
// ... baaki upload aur askQuestion wala code ...

// 1. Delete SOP Logic
export const deleteSOP = async (req, res) => {
  try {
    const { name } = req.params;
    const result = await SOPChunk.deleteMany({ documentName: name });
    res.json({ success: true, message: `Deleted ${result.deletedCount} chunks of ${name}` });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};

// 2. List SOPs Logic
export const listSOPs = async (req, res) => {
  try {
    const docs = await SOPChunk.distinct("documentName");
    res.json(docs);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
};