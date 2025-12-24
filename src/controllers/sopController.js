// src/controllers/sopController.js
import axios from 'axios';
import SOPChunk from "../models/SOPChunk.js";
import { parsePDF } from "../utils/pdfUtils.js";
import { getEmbedding } from "../utils/embeddings.js";

export const uploadSOP = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { originalname, buffer } = req.file;
    const documentName = originalname;

    
    const chunks = await parsePDF(buffer, documentName);

    if (!Array.isArray(chunks) || chunks.length === 0) {
      return res.status(400).json({ error: "No text extracted from PDF" });
    }

    // delete existing chunks for this document (idempotent)
    await SOPChunk.deleteMany({ documentName });

    // compute embeddings in parallel but limited concurrency is better in production
    const chunksWithEmbeddings = await Promise.all(
      chunks.map(async (c) => {
        const embedding = await getEmbedding(c.chunkText);
        return {
          ...c,
          embedding,
        };
      })
    );

    await SOPChunk.insertMany(chunksWithEmbeddings);

    return res.json({
      message: "SOP indexed successfully!",
      document: documentName,
      chunks: chunksWithEmbeddings.length,
    });
  } catch (err) {
    console.error("[uploadSOP] ERROR:", err);
    return res.status(500).json({ error: err?.message ?? String(err) });
  }
};

export const deleteSOP = async (req, res) => {
  try {
    const { name } = req.params;
    const result = await SOPChunk.deleteMany({ documentName: name });
    res.json({ message: `Deleted ${result.deletedCount} chunks` });
  } catch (err) {
    res.status(500).json({ error: err?.message ?? String(err) });
  }
};

export const listSOPs = async (req, res) => {
  try {
    const docs = await SOPChunk.aggregate([
      { $group: { _id: "$documentName", chunks: { $sum: 1 } } },
      { $project: { name: "$_id", chunks: 1, _id: 0 } },
    ]);
    res.json(docs);
  } catch (err) {
    res.status(500).json({ error: err?.message ?? String(err) });
  }
};
export const askQuestion = async (req, res) => {
  try {
    const { question } = req.body;
    if (!question) return res.status(400).json({ error: "Please provide a question" });

    // A. Vector Search (Retrieval)
    const queryEmbedding = await getEmbedding(question);
    const results = await SOPChunk.aggregate([
      {
        $vectorSearch: {
          index: "vector_index", 
          path: "embedding",
          queryVector: queryEmbedding,
          numCandidates: 10,
          limit: 3,
        },
      },
    ]);

    // B. Context Preparation
    const contextText = results.map(r => r.chunkText).join("\n\n");
    if (!contextText) {
      return res.json({ success: false, answer: "PDF mein iska jawab nahi mila." });
    }

    // C. Generation via REST API (Using the model you see in your list)
    const apiKey = process.env.GEMINI_API_KEY;
    // Purana wala URL (2.0-flash) hata kar ye wala dalo:
// Purani URL ko isse replace karo (1.5 Flash bahut zyada stable hai)
const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`;
// Note: Google API mein 2.5 ko aksar backend mein 2.0-flash-exp hi kaha jata hai.
    const payload = {
      contents: [{
        parts: [{
          text: `Use this context to answer the question.\n\nContext: ${contextText}\n\nQuestion: ${question}`
        }]
      }]
    };

    const apiResponse = await axios.post(url, payload, {
        headers: { 'Content-Type': 'application/json' }
    });

    // D. Extract Answer
    if (apiResponse.data.candidates && apiResponse.data.candidates[0].content) {
      const finalAnswer = apiResponse.data.candidates[0].content.parts[0].text;
      
      res.json({
        success: true,
        answer: finalAnswer,
        sources: results.map(r => r.documentName)
      });
    } else {
      throw new Error("AI ne response format galat bheja hai.");
    }

  } catch (err) {
    // Ye line aapko terminal mein clear error dikhayegi
    console.error("DEBUG ERROR:", err.response?.data || err.message);
    res.status(500).json({ 
      error: "AI Generation failed", 
      details: err.response?.data?.error?.message || err.message 
    });
  }
};