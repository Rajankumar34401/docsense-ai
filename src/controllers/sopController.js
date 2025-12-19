// src/controllers/sopController.js
import SOPChunk from "../models/SOPChunk.js";
import { parsePDF } from "../utils/pdfUtils.js";
import { getEmbedding } from "../utils/embeddings.js";

export const uploadSOP = async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    const { originalname, buffer } = req.file;
    const documentName = originalname;

    // parsePDF returns array of chunks { documentName, page, section, chunkText }
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