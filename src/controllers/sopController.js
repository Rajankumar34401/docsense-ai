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
    // 1. History ko yahan define karein (destructure from req.body)
    const { question, history = [] } = req.body; 

    if (!question) return res.status(400).json({ error: "Question is required" });

    const queryEmbedding = await getEmbedding(question);

    // 2. Vector Search
    const results = await SOPChunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index",
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 100,
          limit: 3 // Speed ke liye limit 3 rakhi hai
        }
      }
    ]);

    if (results.length === 0) return res.json({ answer: "No relevant info found.", sources: []  });

    const context = results.map(r => `[Page ${r.page}]: ${r.chunkText}`).join("\n");

    // 3. Groq AI logic with History
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [
        { role: "system", content: "Answer strictly based on the provided text. Mention page numbers." },
        ...history.slice(-4), // Sirf aakhri 4 baatein yaad rakhega (Atakna band hoga)
        { role: "user", content: `Context:\n${context}\n\nQuestion: ${question}` }
      ],
      max_tokens: 1024,
      temperature: 0.5
    });

     const answer = completion.choices[0].message.content.trim();

    // Only return sources if the answer is not a negative/no-info response
    const negativeIndicators = [
  "no relevant info",
  "not mentioned",
  "not found",
  "no information",
  "no info"
];

    const hasAnswer = !negativeIndicators.some(neg => answer.toLowerCase().includes(neg));

    const sourceDocs = hasAnswer
      ? [...new Map(results.map(r => [`${r.documentName}-${r.page}`, { 
          document: r.documentName, 
          page: r.page 
        }])).values()]
      : [];

    res.json({ answer, sources: sourceDocs });
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