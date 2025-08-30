import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { GoogleGenerativeAI } from '@google/generative-ai';
import { v4 as uuidv4 } from 'uuid';

// --- INITIAL SETUP ---
dotenv.config();
const app = express();
const server = createServer(app);

// Environment variables check
if (!process.env.GEMINI_API_KEY) {
  console.error("❌ FATAL ERROR: GEMINI_API_KEY is not defined in .env file.");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
    console.warn("⚠️ WARNING: JWT_SECRET is not defined in .env file. Using a default, insecure secret.");
}

const port = process.env.PORT || 4000;
const jwtSecret = process.env.JWT_SECRET || 'default-insecure-secret-key';
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";

// Initialize Google Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

// --- MIDDLEWARE ---
app.use(cors({ origin: frontendUrl }));
app.use(express.json());

// --- DEMO MODE IN-MEMORY STORAGE ---
const db = {
  users: [],
  schemas: {}, // Keyed by userId
};

// Pre-create an admin user for easy testing
const salt = bcrypt.genSaltSync(10);
const adminPasswordHash = bcrypt.hashSync('admin123', salt);
db.users.push({
  id: 1,
  username: 'admin',
  email: 'admin@strucbot.com',
  password_hash: adminPasswordHash,
  role: 'admin'
});
db.schemas[1] = [];


// --- AUTHENTICATION MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access token required' });

  jwt.verify(token, jwtSecret, (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token' });
    const dbUser = db.users.find(u => u.id === user.userId);
    if (!dbUser) return res.status(403).json({ error: 'User not found' });
    req.user = { id: dbUser.id, username: dbUser.username, role: dbUser.role, email: dbUser.email };
    next();
  });
};

// --- API ROUTES ---

// 1. Authentication
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;
    if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });
    if (db.users.some(u => u.username === username || u.email === email)) return res.status(400).json({ error: 'Username or email already exists' });
    
    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = { id: Date.now(), username, email, password_hash: passwordHash, role: 'user' };
    db.users.push(newUser);
    db.schemas[newUser.id] = [];
    console.log(`New user registered: ${username}`);
    res.status(201).json({ message: 'User created successfully' });
});

app.post('/api/auth/login', async (req, res) => {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username === username || u.email === username);
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, username: user.username }, jwtSecret, { expiresIn: '24h' });
    console.log(`User logged in: ${user.username}`);
    res.json({
        message: 'Login successful',
        token,
        user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
});

// 2. User Profile & Settings
app.get('/api/auth/profile', authenticateToken, (req, res) => {
    res.json(req.user);
});

app.put('/api/auth/profile', authenticateToken, (req, res) => {
    const { username, email } = req.body;
    const userIndex = db.users.findIndex(u => u.id === req.user.id);
    if (userIndex === -1) return res.status(404).json({ error: 'User not found' });

    if (username) db.users[userIndex].username = username;
    if (email) db.users[userIndex].email = email;
    
    console.log(`User profile updated: ${db.users[userIndex].username}`);
    const updatedUser = db.users[userIndex];
    res.json({ message: 'Profile updated successfully', user: {id: updatedUser.id, username: updatedUser.username, email: updatedUser.email, role: updatedUser.role } });
});

// 3. AI Schema Generation
app.post('/api/generate-schema', authenticateToken, async (req, res) => {
    const { prompt } = req.body;
    const userId = req.user.id;
    if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
    
    console.log(`Received prompt from ${req.user.username}: "${prompt}"`);

    const systemPrompt = `You are an expert database architect. Your task is to generate a JSON object representing a database schema based on a user's request. The JSON object must have "table_name" (a lowercase, plural string) and "columns" (an array of objects). Each column object must have "name" (snake_case) and "data_type" (SQL type like VARCHAR(255), INTEGER, TEXT). Always include an 'id' column as 'SERIAL PRIMARY KEY'. Respond ONLY with the raw JSON object, no markdown or text.`;

    try {
        const result = await model.generateContent(`${systemPrompt}\n\nUser request: "${prompt}"`);
        const response = await result.response;
        const jsonText = response.text().replace(/```json|```/g, '').trim();
        const schema = JSON.parse(jsonText);
        
        const newSchema = { id: uuidv4(), ...schema, created_at: new Date().toISOString(), prompt };
        
        db.schemas[userId].push(newSchema);
        console.log(`Generated and saved schema "${newSchema.table_name}" for user ${userId}`);
        res.json(newSchema);
    } catch (error) {
        console.error('Error generating schema with AI:', error);
        res.status(500).json({ error: 'Failed to generate schema from AI' });
    }
});

// 4. Schema Management
app.get('/api/schemas', authenticateToken, (req, res) => {
    res.json(db.schemas[req.user.id] || []);
});

app.delete('/api/schemas/:id', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const schemaId = req.params.id;
    const initialLength = db.schemas[userId].length;
    db.schemas[userId] = db.schemas[userId].filter(s => s.id !== schemaId);
    
    if (db.schemas[userId].length < initialLength) {
        console.log(`Deleted schema ${schemaId} for user ${userId}`);
        res.status(200).json({ message: 'Schema deleted successfully' });
    } else {
        res.status(404).json({ error: 'Schema not found' });
    }
});

// --- SERVER STARTUP ---
server.listen(port, () => {
  console.log('--- Strucbot Backend Server ---');
  console.log(`🚀 Server (Demo Mode) running on http://localhost:${port}`);
  console.log('---------------------------------');
});
