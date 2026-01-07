import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import connectDB from './src/config/db.js';
import sopRoutes from './src/routes/sopRoutes.js';
import ChatHistory from './src/models/ChatHistory.js'; 
import authRoutes from './src/routes/authRoutes.js'; 

process.setMaxListeners(15);
const app = express();

// Middleware
app.use(cors({
  origin: "*", 
  methods: ["GET", "POST", "PUT", "DELETE"],
  credentials: true
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Connect DB
await connectDB();

// --- AUTH ROUTES ---
app.use('/api/auth', authRoutes);

// --- CHAT HISTORY & ANALYTICS ROUTES ---

// 1. Save Message (With Analytics Logging)
app.post("/api/chats/save", async (req, res) => {
  const { userId, chatId, message } = req.body;

  try {
    let chat;
    if (chatId && chatId !== "null" && chatId !== "undefined") {
      chat = await ChatHistory.findByIdAndUpdate(
        chatId,
        { 
          $push: { messages: message },
          $set: { lastActivity: new Date() } // Tracker for admin
        },
        { new: true }
      );
    } else {
      chat = new ChatHistory({
        userId: userId || "guest_user",
        title: message.content.substring(0, 40) + "...", 
        messages: [message]
      });
      await chat.save();
    }
    res.json(chat);
  } catch (err) {
    console.error("DB Save Error:", err);
    res.status(500).json({ error: "Database error" });
  }
});

// --- ADMIN SPECIFIC ANALYTICS ---
// Ye route Admin Dashboard mein "Users & Logs" ke liye kaam aayega
app.get("/api/admin/all-logs", async (req, res) => {
  try {
    // Sabhi users ki chat history uthake admin ko dikhana
    const allChats = await ChatHistory.find()
      .populate('userId', 'name email role') // User ki details ke sath
      .sort({ updatedAt: -1 })
      .limit(100);
    res.json(allChats);
  } catch (err) {
    res.status(500).json({ error: "Admin access error" });
  }
});

// --- EXISTING CHAT ROUTES ---
app.get("/api/chats/recent/:userId", async (req, res) => {
  try {
    const chats = await ChatHistory.find({ userId: req.params.userId })
      .sort({ updatedAt: -1 })
      .select('title createdAt');
    res.json(chats);
  } catch (err) {
    res.status(500).json({ error: "Error fetching recent" });
  }
});

app.get("/api/chats/:id", async (req, res) => {
  try {
    const chat = await ChatHistory.findById(req.params.id);
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Error details" });
  }
});

app.put("/api/chats/rename/:id", async (req, res) => {
  try {
    const chat = await ChatHistory.findByIdAndUpdate(req.params.id, { title: req.body.title }, { new: true });
    res.json(chat);
  } catch (err) {
    res.status(500).json({ error: "Rename failed" });
  }
});

app.delete("/api/chats/delete/:id", async (req, res) => {
  try {
    await ChatHistory.findByIdAndDelete(req.params.id);
    res.json({ message: "Deleted" });
  } catch (err) {
    res.status(500).json({ error: "Delete failed" });
  }
});

// --- SOP & VECTOR DB ROUTES ---
app.use('/api/sops', sopRoutes);

// Health Check
app.get('/health', (req, res) => res.json({ status: 'OK', time: new Date() }));

// Error Handler
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') return res.status(400).json({ error: 'Max 10MB.' });
  }
  res.status(500).json({ error: error.message || 'Server Error' });
});

export default app;