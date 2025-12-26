# DocSens-AI - Document Analysis System

DocSens-AI is an intelligent platform that processes PDF documents using Gemini AI. It extracts text, splits it into chunks, creates embeddings, and stores them in a MongoDB vector database for fast search, summaries, and actionable insights.

---

## 👥 Team Members & Roles
| Name | Role | Responsibility |
| :--- | :--- | :--- |
| **1 Munish Rajan (Leader)** | **Lead Integrator** | **System Setup, Final AI Logic, Vector Search Pipeline, Context Logic & Groq Integration.** |
| 2 Suzzan Naaz | Feature Developer | PDF Processing Module & Text Extraction. |
| 3 Heni Patel | Feature Developer | Initial AI Interaction Logic & Prompting. |
| 4 Gagan | Feature Developer | MongoDB Database Integration & Schema Design. |

---
 **Project Structure**
  ```text
   DOCSENS_LEADER/
├── docsense-ai/        # Sub-project directory
│   ├── src/            # Core source code (AI & Logic)
│   └── node_modules/   # Sub-folder dependencies (Ignored)
├── .env                # Private API Keys & URI
├── .env.example        # Template for Sir/Examiner
├── .gitignore          # Git security file
├── server.js           # Main Entry Point (Express)
├── app.js              # Route & Middleware setup
├── package.json        # Main dependencies
└── README.md           # Project Documentation   
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

 ## 🚀 Future Roadmap
* **Multi-Format Support**: Adding OCR for scanned PDFs and Word document processing (DOCX).
* **Cross-Document Chat**: Enabling the AI to retrieve and compare information from multiple uploaded PDFs simultaneously.
* **Frontend UI**: Developing a React-based dashboard for a seamless user experience, including file drag-and-drop and a chat interface.
* **Conversational Memory**: Implementing persistent chat history so the AI remembers previous questions in a session.
* **Advanced Analytics**: Generating automated summaries and key-insight reports for every uploaded document.

  ## 🏁 Conclusion
The DocSens-AI project successfully demonstrates the integration of Generative AI (Gemini/Groq) with Vector Databases (MongoDB Atlas) to create a functional RAG pipeline. Our team managed to build a system that can extract, embed, and query PDF data with high accuracy, ensuring a seamless user experience for document-based chat.

