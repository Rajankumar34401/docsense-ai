# DocSens-AI - Document Analysis System

DocSens-AI ek intelligent platform hai jo PDF documents ko process karke Gemini AI ke zariye unka summary aur answers # DocSens-AI - Document Analysis System

DocSens-AI ek intelligent platform hai jo PDF documents ko process karke Gemini AI ke zariye unka summary aur answers provide karta hai.

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


 **Project Structure**

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