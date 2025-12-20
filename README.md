# DocSens-AI - Document Analysis System

DocSens-AI* is an intelligent platform designed to process PDF documents and provide automated summaries and insights using *Gemini AI* integration.

---

## 👥 Team Members & Roles
| Name | Role | Responsibility |
| :--- | :--- | :--- |
| **Member 1 (Leader)** | **Lead Integrator** | **System Setup, Final AI Logic, & Merging.** |
| Member 2 | Feature Developer | PDF Processing Module. |
| Member 3 | Feature Developer | AI Interaction Logic. |
| Member 4 | Feature Developer | MongoDB Database Integration. |

---

## 🛠️ Tech Stack
* **Backend:** Node.js, Express.js
* **AI Engine:** Google Gemini AI
* **Database:** MongoDB (Mongoose)
* **Environment:** Dotenv

---

## 🚀 Setup & Installation (Instructions for Sir)

Sir, project ko run karne ke liye niche diye gaye steps follow karein:

1. **Clone the Project:**
   ```bash
   git clone <repository-url>

2. **Install Dependencies:**  
   ```bash
   npm install

3. **Environment Setup (Important):**
   ​Project folder mein ek nayi .env file banayein.
   ​.env.example se format copy karein aur apni Gemini API Key aur Mongo URI enter karein.
   ​Security Note: Humne personal .env file GitHub par ignore ki hai. 

4. **Run the Server:**
   ```bash
   npm run dev
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

    ```text
### Challenges & Solutions (Leadership Insights)**
      ​During the integration phase, we faced and resolved the following technical challenges:
 **​Security & Data Privacy:**
      Initially, sensitive configuration files (.env) were tracked by Git. We successfully implemented professional security practices using .gitignore and cleared the Git cache to ensure no private API keys were       exposed.
**​API Integration:**
     Mapping the JSON response from Gemini AI to our MongoDB schema required precise logic to ensure data accuracy.
**​Large Commits:**
   Handled large repository sync issues and optimized the project structure by excluding heavy folders like node_modules from the remote repository.
