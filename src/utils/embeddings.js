// src/utils/embeddings.js
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

// CORRECT MODEL NAME
const model = genAI.getGenerativeModel({
  model: "models/text-embedding-004", // This is the correct name (not "models/gemini-embedding-001")
});

export const getEmbedding = async (text) => {
  try {
    if (!text?.trim()) throw new Error("Empty text for embedding");

    const result = await model.embedContent(text);
    return result.embedding.values;
  } catch (err) {
    console.error("[Embedding Error]:", err.message);
    throw err;
  }
};