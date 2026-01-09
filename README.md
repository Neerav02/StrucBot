Strucbot AI 🤖
Your personal database robot.
Strucbot is a full-stack web application that redefines database creation. It features an intelligent chatbot that allows users to generate, view, and manage database schemas using simple, natural language commands. No SQL knowledge required—just tell the bot what you need, and it builds it for you.

This repository contains the complete source code for both the React frontend and the Node.js backend.
✨ Core Features
AI-Powered Schema Generation: Leverages the Google Gemini API to understand user prompts and generate accurate database schemas.

Interactive Chat Interface: A modern, intuitive chat UI for conversing with the AI, viewing history, and managing schemas.

Full User Authentication: Secure user registration and login system using JWT for session management.

Complete User Dashboard: Includes dedicated pages for the Chatbot, User Profile, and Application Settings.

Schema Management: Users can view and delete the schemas they've created directly within the chat interface.

Responsive Design: A polished and fully responsive interface that works beautifully on all screen sizes.

Demo Mode Backend: The Node.js server runs with in-memory storage out-of-the-box, so no database configuration is needed to get started.

🛠️ Tech Stack:-
Frontend - 
React 18, Vite, Tailwind CSS, Framer Motion
Zustand (State Management)
React Router (Routing)
Axios (API Requests), Lucide React (Icons)

Backend -
Node.js, Express.js
Google Gemini API (AI Model)
JSON Web Tokens (JWT for Authentication)
Bcrypt.js (Password Hashing)
In-Memory Storage (for Demo Mode)

🚀 Getting Started
Follow these instructions to get the project up and running on your local machine for development and testing.

Prerequisites
Node.js (version 20.x or higher)

npm (usually comes with Node.js)

A free Google Gemini API Key. You can get one from Google AI Studio.

Installation
Clone the repository:

git clone - https://github.com/Neerav02/StrucBot.git
cd strucbot-ai

Setup the Backend:
Navigate to the backend directory:
cd ai-database-backend

Install the dependencies:
npm install

Create a .env file by copying the example:
cp .env.example .env

Open the .env file and add your secret keys (see Configuration below).

Start the backend server:
npm start
The server will be running at http://localhost:4000.

Setup the Frontend:
Open a new terminal and navigate to the frontend directory:
cd ai-database-frontend

Install the dependencies:
npm install

Start the frontend development server:
npm run dev

Your application will be available at http://localhost:5174.

⚙️ Configuration
Your backend server requires a .env file with the following variables:

# Get a free API key from Google AI Studio for the Gemini model
GEMINI_API_KEY=your_google_gemini_api_key_here

# Generate a long, random string for security (you can use an online generator)
JWT_SECRET=your_super_secret_random_string_for_jwt_here

# The URL where your frontend application is running
FRONTEND_URL=http://localhost:5174

kullanım
Once the application is running, you can:

Register a new account or use the pre-configured admin account to log in:

Username: admin

Password: admin123

Navigate to the Chatbot page.

Start a conversation with the AI. Try prompts like:

"Create a table for my products with name, price, and a description."

"Make a schema for customer orders that includes order_id, customer_id, and order_date."

View, and delete your generated schemas from the chat history.

Visit the Profile and Settings pages from the sidebar.

📁 Project Structure
strucbot-ai/
├── ai-database-backend/     # Node.js Express Backend
│   ├── .env                 # Environment variables
│   ├── package.json
│   └── server.js            # Main server file
│
└── ai-database-frontend/    # React Vite Frontend
    ├── public/
    ├── src/
    │   ├── components/      # Reusable UI components (Layout, ProtectedRoute)
    │   ├── pages/           # Page components (Login, Chatbot, Profile, etc.)
    │   ├── services/        # API connection logic
    │   ├── stores/          # Zustand state management
    │   ├── App.jsx          # Main router
    │   ├── main.jsx         # App entry point
    │   └── index.css        # Global styles
    ├── package.json
    └── vite.config.js

🔮 Future Enhancements
Real Database Integration: Connect the backend to a real database like PostgreSQL or MySQL.

Schema Editing: Allow users to edit the columns of a generated schema.

File Uploads: Implement file uploads (e.g., CSV) to populate the created tables.

WebSockets: Add real-time notifications for multi-user collaboration.

📜 License
This project is licensed under the MIT License. See the LICENSE file for details.
