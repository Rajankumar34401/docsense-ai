import SOPChunk, { QueryLog } from "../models/SOPChunk.js";
import { parsePDF } from "../utils/pdfUtils.js";
import { getEmbedding } from "../utils/embeddings.js";
import Groq from "groq-sdk";

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

// 1. UNIVERSAL UPLOAD LOGIC
export const uploadSOP = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: "No file uploaded" });
        
        const { originalname, buffer } = req.file;
        const targetRole = req.body.role || 'employee'; 

        // 1. PDF ko chunks mein thoda
        const chunks = await parsePDF(buffer, originalname);
        
        // 2. Purana data saaf kiya
        await SOPChunk.deleteMany({ documentName: originalname });

        const docs = [];
        
        // --- BATCH PROCESSING START ---
        // Gemini Free Tier ke liye delay function
        const delay = (ms) => new Promise(res => setTimeout(res, ms));

        console.log(`Starting upload for ${chunks.length} chunks...`);

        for (const c of chunks) {
            const embedding = await getEmbedding(c.chunkText);
            
            if (embedding) {
                docs.push({ 
                    ...c, 
                    embedding,
                    allowedRoles: targetRole === 'admin' ? ['admin'] : ['admin', 'employee']
                });
                
                // 3. IMPORTANT: Har call ke baad 2 second ka gap (Safety for Free Tier)
                // 15 chunks per min = 1 chunk every 4 seconds theoretically, 
                // par 2-3 seconds ka delay safe rehta hai.
                await delay(2500); 
                console.log(`Chunk processed. Remaining: ${chunks.length - docs.length}`);
            }
        }
        // --- BATCH PROCESSING END ---

        // 4. Sab embeddings milne ke baad DB mein save karein
        if (docs.length > 0) {
            await SOPChunk.insertMany(docs);
        }

        res.json({ 
            success: true, 
            message: `Successfully uploaded ${docs.length} chunks for ${originalname}.` 
        });

    } catch (e) {
        console.error("Upload Error:", e);
        res.status(500).json({ error: e.message });
    }
};

// 2. GEMINI-STYLE CHAT AGENT (UNIVERSAL LOGIC)
export const askQuestion = async (req, res) => {
    try {
        const { question, history = [], userName = "User", userRole = "employee" } = req.body;
        if (!question) return res.status(400).json({ error: "Question is required" });

        res.setHeader("Content-Type", "text/event-stream");
        res.setHeader("Cache-Control", "no-cache");

        const queryEmbedding = await getEmbedding(question);
        
        console.log(`Searching for: "${question}"`);

        // FIX: Saara aggregation ek hi array [] ke andar hona chahiye
        const results = await SOPChunk.aggregate([
            {
                $vectorSearch: {
                    index: "vector_index",
                    path: "embedding",
                    queryVector: queryEmbedding,
                    numCandidates: 150,
                    limit: 10
                    // Filter abhi band hai testing ke liye
                }
            },
            {
                $project: {
                    documentName: 1,
                    chunkText: 1,
                    score: { $meta: "vectorSearchScore" }
                }
            }
        ]);

        console.log("Chunks found in search:", results.length);

        let context = "";
        if (results && results.length > 0) {
            context = results.map(r => `[File: ${r.documentName}]\n${r.chunkText}`).join("\n\n---\n\n");
        } else {
            context = "NO_CONTEXT_FOUND_IN_DATABASE";
        }

        const systemPrompt = `
        You are an advanced AI Assistant.
        RULES:
        1. If context is "NO_CONTEXT_FOUND_IN_DATABASE", say: "I'm sorry, I don't have this record in the current knowledge base."
        2. Otherwise, answer using ONLY the provided context.
        3. End with "SOURCE_FOUND" if you found the answer.
        
        CONTEXT:
        ${context}`;

        const stream = await groq.chat.completions.create({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: systemPrompt },
                ...history.slice(-4).map(msg => ({ role: msg.role, content: msg.content })),
                { role: "user", content: question }
            ],
            temperature: 0.1,
            stream: true,
        });

        let fullAIResponse = "";
        for await (const chunk of stream) {
            const content = chunk.choices[0]?.delta?.content || "";
            if (content) {
                fullAIResponse += content;
                if (!content.includes("SOURCE_FOUND")) {
                    res.write(`data: ${JSON.stringify({ text: content })}\n\n`);
                }
            }
        }

        const success = fullAIResponse.includes("SOURCE_FOUND") && results.length > 0;
        const accuracy = success ? (results[0].score * 100).toFixed(2) : 0;

        try {
            await QueryLog.create({
                userName,
                question,
                hasSource: success, 
                accuracyScore: accuracy,
                sourceName: success ? results[0].documentName : "N/A",
                timestamp: new Date()
            });
        } catch (logError) { console.error("Log Error:", logError); }

        res.write(`data: ${JSON.stringify({ 
            sourceName: success ? results[0].documentName : null, 
            done: true 
        })}\n\n`);
        res.end();

    } catch (e) {
        console.error("Backend Error:", e);
        if (!res.headersSent) res.end();
    }
};

// 3. ADMIN TOOLS (KEEPING IT CLEAN)
export const listSOPs = async (req, res) => {
    try {
        const docs = await SOPChunk.aggregate([
            { $group: { _id: "$documentName", roles: { $first: "$allowedRoles" } } }
        ]);
        res.json(docs.map(d => ({ filename: d._id, role: d.roles[0] })));
    } catch (e) { res.status(500).json([]); }
};

export const getAdminLogs = async (req, res) => {
    try {
        const logs = await QueryLog.find().sort({ timestamp: -1 }).limit(50).lean();
        res.json(logs || []);
    } catch (e) { res.status(500).json([]); }
};

export const deleteSOP = async (req, res) => {
    try {
        await SOPChunk.deleteMany({ documentName: req.params.name });
        res.json({ success: true, message: "File removed from knowledge base" });
    } catch (e) { res.status(500).json({ error: e.message }); }
};