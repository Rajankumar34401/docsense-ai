// src/models/SOPChunk.js
import mongoose from 'mongoose';

const sopChunkSchema = new mongoose.Schema({
  documentName: { type: String, required: true },
  page: { 
    type: String,           // Changed from Number to String
    required: false,        // No longer required
    default: "multi"        // Default for vision-extracted chunks
  },
  section: { type: String },
  chunkText: { type: String, required: true },
  embedding: { type: [Number], required: true }
});

// Keep your vector search index name
// In MongoDB Atlas → Search Indexes:
// Name: vector_index
// Type: Vector Search
// Field: embedding → knnVector, dimensions: 768, similarity: cosine

export default mongoose.model('SOPChunk', sopChunkSchema);