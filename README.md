# DocSens-AI - Document Analysis System

DocSens-AI is an intelligent platform that processes PDF documents using Gemini AI. It extracts text, splits it into chunks, creates embeddings, and stores them in a MongoDB vector database for fast search, summaries, and actionable insights.

---

## 👥 Team Members & Roles
| Name | Role | Responsibility |
| :--- | :--- | :--- |
| **1  Munish Rajan  (Leader)** | **Lead Integrator** | **System Setup, Final AI Logic, & Merging.** |
| 2  Suzzan Naaz  | Feature Developer | PDF Processing Module. |
| 3  Heni Patel  | Feature Developer | AI Interaction Logic. |
| 4  Gagan  | Feature Developer | MongoDB Database Integration. |

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
* **AI Engine:** Google Gemini AI
* **Database:** MongoDB (Mongoose)
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
  3.Add your Gemini API Key and Mongo URI.
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

## How to Test with Postman
 Download Extension for VS-Code.
 ​To verify the PDF upload and AI processing, follow these steps:
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
  
## Challenges & Solutions (Leadership Insights)
   ​During the integration phase, we faced and resolved the following technical challenges. 
* **Security & Data Privacy:** Initially, sensitive configuration files (.env) were tracked by Git. We successfully implemented professional security practices using .gitignore and cleared the Git cache to ensure no private API keys were exposed.
* **API Integration:** Mapping the JSON response from Gemini AI to our MongoDB schema required precise logic to ensure data accuracy.
* **Large Commits:** Handled large repository sync issues and optimized the project structure by excluding heavy folders like node_modules from the remote repository.

## ⚠️ Limitations
​While the core system is stable, we have identified the following limitations during testing:
*  ​Single File Focus: The current version is optimized for processing one PDF at a time.
*  ​Text-Only Extraction: It cannot currently read text from images or handwritten notes inside PDFs (requires OCR).
*  ​API Rate Limits: Performance depends on the free tier limits of the Gemini API.
*  ​Cold Start: Since we are using free cloud tiers (MongoDB Atlas), the first query might face a slight delay.

 ## 🚀 Future Roadmap
* **Multi-Format Support**: Adding OCR for scanned PDFs and Word document processing.
* **Frontend UI**: Developing a React-based dashboard for easy file uploads and chat.
* **Advanced Analytics**: Implementing chat history and summary generation features.

  ## 🏁 Conclusion
​The DocSens-AI project successfully demonstrates the integration of Generative AI (Gemini) with Vector Databases (MongoDB Atlas) to create a functional RAG (Retrieval-Augmented Generation) pipeline. Our team managed to build a system that can extract, embed, and query PDF data with high accuracy, ensuring a seamless user experience for document-based chat.


