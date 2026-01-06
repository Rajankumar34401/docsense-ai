# DocSens-AI – Intelligent Document Analysis System (RAG Based)

DocSens-AI is a **Context-Aware Document Intelligence Platform** that processes PDF documents and enables semantic search, AI-powered Q&A, and actionable insights.  
The system is built using a **Retrieval-Augmented Generation (RAG)** architecture powered by **Google Gemini AI** for embeddings and **Groq Cloud (LLaMA 3 / Mixtral)** for high-speed inference, with **MongoDB Atlas Vector Search** as the backbone.

This project is developed as a **company-oriented academic project**, demonstrating real-world application of **AI + Full-Stack Development**.

---

## 🎯 Project Objective
- Convert static PDF documents into a **searchable knowledge base**
- Provide **accurate, citation-based AI answers**
- Prevent hallucinations using **strict document grounding**
- Demonstrate a **production-grade RAG pipeline**

---

## 👥 Team Members & Roles

| Name | Role | Responsibilities |
|---|---|---|
| **Munish Rajan (Leader)** | **Lead Integrator & System Architect** | System Architecture, Master Admin Logic (`canInvite`), MongoDB Vector Search Aggregation Pipeline, Context Window Logic, SSE Streaming, Groq Integration |
| Suzzan Naaz | AI Logic Developer | Prompt Engineering, Gemini Embedding Integration, RAG Logic Optimization, Zero-Hallucination Enforcement |
| Heni Patel | Frontend & Auth Developer | JWT Authentication, Login / Signup / Reset Password UI, Frontend State Management |
| Gagan | Database & DevOps Specialist | MongoDB Atlas Vector Indexing, Schema Design, Git Branching Strategy, Knowledge Base Storage |

---

## 🧠 System Architecture Overview

DocSens-AI follows a **multi-layered RAG architecture**:

1. **Document Ingestion**
   - PDF upload
   - Text extraction
   - Page-aware chunking

2. **Vectorization**
   - Embeddings generated using **Gemini AI**
   - Stored in **MongoDB Atlas Vector Index**

3. **Retrieval**
   - MongoDB Aggregation Pipeline
   - Top relevant chunks retrieved via semantic similarity

4. **Generation**
   - Query + context merged
   - Answer generated using **Groq LLM**
   - Source citation attached

---

## 📁 Project Structure

```text
DOCSENS_LEADER/
├── frontend/                 # React.js (Vite)
│   ├── src/
│   │   ├── components/       # Navbar, Sidebar, UI components
│   │   ├── pages/            # Login, ResetPassword, UserChat
│   │   └── App.jsx           # Routing
│   ├── package.json
│   └── vite.config.js
│
├── backend/                  # Node.js + Express AI Server
│   ├── src/
│   │   ├── controllers/      # Auth + AI logic
│   │   ├── models/           # MongoDB schemas
│   │   ├── routes/           # API routes (Gemini & Groq)
│   │   └── utils/            # RAG, chunking, vector search
│   ├── server.js
│   └── package.json
│
├── .env                      # API Keys (Ignored by Git)
├── .env.example              # Setup reference for examiner
├── .gitignore
└── README.md

```
### 📂 Directory Details
* **src/**: Contains core application logic, controllers, and API routes.
* **.env**: Stores sensitive API keys and database credentials (Security priority).
* **.env.example**: A template file provided for the examiner to setup their environment.

## 🛠️ Tech Stack
* **Backend:** Node.js, Express.js
* **AI Engine:** Groq Cloud (Llama 3 / Mixtral) & Google Gemini AI
* **Database:** MongoDB Atlas (Vector Search Enabled)
* **Embeddings:** Google Generative AI Embeddings
* **Environment:** Dotenv

## 📈 Development Roadmap

### ✅ Completed: Core Engine
* **Vector Search Pipeline:** Fully implemented aggregation pipeline in MongoDB.
* **Context Window Logic:** Optimized merging of queries with SOP chunks to prevent context loss.
* **Source Citation Engine:** AI now cites the exact document and section for every answer.

### 🚧 In-Progress: User Experience
* **Real-time Streaming:** Implementing Server-Sent Events (SSE) in React for a smooth chat experience.
* **Admin Knowledge Base:** Interface for authorized users to manage SOP documents.
* **Persistence:** Full chat history storage and retrieval.

---

## 🚀 Setup & Installation (Instructions for Sir)

Follow these steps:

1. **Clone the Project:**
   ```bash
   git clone <repository-url>

2. **Install Dependencies:**  
   ```bash
   npm install

3. **Environment Setup (Important):**
  1.Create a new .env file in the project folder.
  2.Copy the format from .env.example.
  3.Add your Gemini API Key, Groq API Key, and Mongo URI
  4.Security note: The .env file is ignored by GitHub, so your keys stay private.
  
4. **Run the Server:**
   ```bash
   npm run dev


## Environment Variables Table
 | Variable | Description |
| :--- | :--- |
| **PORT** | The port where the server runs (e.g., 5002) |
| **MONGO_URI** | Your MongoDB Atlas connection string |
| **GEMINI_API_KEY** | Your Google AI Studio API Key |
| **GROQ_API_KEY** | Your Groq Cloud API Key (for Fast Q&A) |
| **VECTOR_INDEX_NAME** | The name of your MongoDB Vector Search Index |

## How to Test with Postman
     Download Postman Extension for VS-Code.
     
**Phase 1: Upload & Process**​ follow these steps:
1. ​**Start the Server: Run npm run dev in your terminal.**
​2. **Open Postman: Create a New HTTP Request.**
3. **​Set Method & URL: * Choose POST from the dropdown.**
   ​Enter URL: http://localhost:5002/api/sops/upload.
4. ​**Configure Body:**
   ​Go to the Body tab.
   ​Select form-data.
   ​In the Key field, type file and change the key type from 'Text' to 'File'.
5. **​Upload & Send:**
   ​Select your PDF file in the Value column.
   ​Click Send.
6. ​**Expected Result:** - You will receive a JSON response with the extracted SOP data from the Gemini AI.

### ## Project Output & Verification
       Below are the visual proofs of successful API testing and data storage:

### 1. API Response (Postman)

![Postman Test Result](https://github.com/user-attachments/assets/804762d1-8523-46ea-9993-57f746c4424f)

### 2. Database Entry (MongoDB Atlas)

![MongoDB Storage Proof](https://github.com/user-attachments/assets/48498951-b18f-41dc-ba40-d8d870e14a59)

**Phase 2: AI Chat & Retrieval**
1. ​**Open a New Request: Choose POST from the dropdown.**
   Enter URL: http://localhost:5002/api/sops/ask
​2. **Configure Body:**
   Go to the Body tab. Select raw and choose JSON from the dropdown
3. **​Enter Question:**
   Example: {"question": "What is the security protocol mentioned?"}
4. ​**Expected Result:**
   You will receive a response with the AI answer and the source document name.
5. ### 3. Retrieval & AI Q&A (Postman)
*Demonstration of Groq LLM providing accurate answers based on retrieved document context.*
![AI Chat Response](https://github.com/user-attachments/assets/7cdfa251-5ec8-440b-8d24-170193b74803)

## Challenges & Solutions (Leadership Insights)
   ​During the integration phase, we faced and resolved the following technical challenges. 
* **Security & Data Privacy:** Initially, sensitive configuration files (.env) were tracked by Git. We successfully implemented professional security practices using .gitignore and cleared the Git cache to ensure no private API keys were exposed.
* **Vector Search Accuracy** Fine-tuning the MongoDB Atlas Vector Search aggregation pipeline was challenging to ensure that only the most relevant document chunks are retrieved for the LLM.
* **Context Window Management:** Optimized the merging of user queries with 5-6 retrieved text chunks to stay within LLM token limits while maintaining high answer accuracy.
* **API Integration:** Mapping the JSON response from Gemini AI to our MongoDB schema required precise logic to ensure data accuracy.
* **Large Commits:** Handled large repository sync issues and optimized the project structure by excluding heavy folders like node_modules from the remote repository.

## ⚠️ Limitations
​While the core system is stable, we have identified the following limitations during testing:
* **Strict Document Context:** The AI is currently restricted to answering only from the retrieved chunks; if information is missing in the PDF, it may decline to answer.
* **Single File Focus:** The current version is optimized for processing and querying one PDF at a time.
* **Text-Only Extraction:** It cannot currently read text from images or handwritten notes inside PDFs (requires OCR).
* **API Rate Limits:** Performance depends on the free tier limits of both Gemini (for embeddings) and Groq (for inference).
* **Cold Start:** Since we are using free cloud tiers (MongoDB Atlas), the first query might face a slight delay while the connection wakes up.

  ## 🏁 Conclusion
The DocSens-AI project successfully demonstrates the integration of Generative AI (Gemini/Groq) with Vector Databases (MongoDB Atlas) to create a functional RAG pipeline. Our team managed to build a system that can extract, embed, and query PDF data with high accuracy, ensuring a seamless user experience for document-based chat.

