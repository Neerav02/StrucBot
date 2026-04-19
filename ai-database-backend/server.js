import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import OpenAI from 'openai';
import { v4 as uuidv4 } from 'uuid';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import pool, { initDatabase, seedAdminUser } from './db/index.js';

// --- INITIAL SETUP ---
dotenv.config();
const app = express();
const server = createServer(app);

// Environment variables check
if (!process.env.GROQ_API_KEY) {
  console.error("❌ FATAL ERROR: GROQ_API_KEY is not defined in .env file.");
  console.error("   Get a free key at https://console.groq.com");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.warn("⚠️ WARNING: JWT_SECRET is not defined. Using a default, insecure secret.");
}

const port = process.env.PORT || 4000;
const jwtSecret = process.env.JWT_SECRET || 'default-insecure-secret-key';
const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5174";

// Initialize Groq AI (OpenAI-compatible SDK)
const groq = new OpenAI({
  apiKey: process.env.GROQ_API_KEY,
  baseURL: 'https://api.groq.com/openai/v1',
});

// --- MIDDLEWARE ---
app.use(helmet({ crossOriginResourcePolicy: false, contentSecurityPolicy: false }));

// CORS: support multiple origins for production
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(express.json({ limit: '1mb' }));

// Rate limiting
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests. Please try again later.' },
});
app.use('/api/', apiLimiter);

const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  message: { error: 'Too many AI requests. Please wait a moment.' },
});

// --- DATABASE INITIALIZATION (PostgreSQL) ---
// Tables are auto-created on startup via initDatabase()
// Admin user is auto-seeded via seedAdminUser()

// --- AUTH MIDDLEWARE ---
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'Access denied. Token required.' });

  jwt.verify(token, jwtSecret, async (err, user) => {
    if (err) return res.status(403).json({ error: 'Invalid or expired token.' });
    try {
      const result = await pool.query('SELECT id, username, email, role FROM users WHERE id = $1', [user.userId]);
      if (result.rows.length === 0) return res.status(403).json({ error: 'User not found' });
      req.user = result.rows[0];
      next();
    } catch (dbErr) {
      console.error('Auth DB error:', dbErr.message);
      return res.status(500).json({ error: 'Authentication error' });
    }
  });
};

// --- API ROUTES ---

// Health Check
app.get('/api/health', async (req, res) => {
  try {
    const userCount = await pool.query('SELECT COUNT(*) FROM users');
    res.json({
      status: 'ok',
      mode: 'PostgreSQL',
      ai: 'Groq (Llama 3.3 70B)',
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
      users: parseInt(userCount.rows[0].count),
    });
  } catch {
    res.json({ status: 'ok', mode: 'PostgreSQL', ai: 'Groq (Llama 3.3 70B)', uptime: process.uptime() });
  }
});

// 1. Authentication
app.post('/api/auth/register', async (req, res) => {
  const { username, email, password } = req.body;
  if (!username || !email || !password) return res.status(400).json({ error: 'All fields are required' });
  if (typeof username !== 'string' || username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
  if (typeof password !== 'string' || password.length < 6) return res.status(400).json({ error: 'Password must be at least 6 characters' });
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });

  try {
    const existing = await pool.query('SELECT id FROM users WHERE username = $1 OR email = $2', [username, email]);
    if (existing.rows.length > 0) return res.status(400).json({ error: 'Username or email already exists' });

    const passwordHash = await bcrypt.hash(password, 10);
    await pool.query(
      'INSERT INTO users (username, email, password_hash, role) VALUES ($1, $2, $3, $4)',
      [username, email, passwordHash, 'user']
    );
    console.log(`✅ New user registered: ${username}`);
    res.status(201).json({ message: 'User created successfully' });
  } catch (err) {
    console.error('Register error:', err.message);
    res.status(500).json({ error: 'Registration failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ error: 'Username and password are required' });

  try {
    const result = await pool.query('SELECT * FROM users WHERE username = $1 OR email = $1', [username]);
    const user = result.rows[0];
    if (!user) return res.status(401).json({ error: 'Invalid credentials' });

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) return res.status(401).json({ error: 'Invalid credentials' });

    const token = jwt.sign({ userId: user.id, username: user.username }, jwtSecret, { expiresIn: '24h' });
    console.log(`✅ User logged in: ${user.username}`);
    res.json({
      message: 'Login successful',
      token,
      user: { id: user.id, username: user.username, email: user.email, role: user.role }
    });
  } catch (err) {
    console.error('Login error:', err.message);
    res.status(500).json({ error: 'Login failed' });
  }
});

// 2. User Profile
app.get('/api/auth/profile', authenticateToken, (req, res) => {
  res.json(req.user);
});

app.put('/api/auth/profile', authenticateToken, async (req, res) => {
  const { username, email } = req.body;

  try {
    if (username) {
      if (typeof username !== 'string' || username.length < 3) return res.status(400).json({ error: 'Username must be at least 3 characters' });
      const taken = await pool.query('SELECT id FROM users WHERE username = $1 AND id != $2', [username, req.user.id]);
      if (taken.rows.length > 0) return res.status(400).json({ error: 'Username already taken' });
    }
    if (email) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(400).json({ error: 'Invalid email format' });
      const taken = await pool.query('SELECT id FROM users WHERE email = $1 AND id != $2', [email, req.user.id]);
      if (taken.rows.length > 0) return res.status(400).json({ error: 'Email already taken' });
    }

    const updates = [];
    const values = [];
    let paramIdx = 1;
    if (username) { updates.push(`username = $${paramIdx++}`); values.push(username); }
    if (email) { updates.push(`email = $${paramIdx++}`); values.push(email); }

    if (updates.length === 0) return res.status(400).json({ error: 'No fields to update' });

    values.push(req.user.id);
    const result = await pool.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = $${paramIdx} RETURNING id, username, email, role`,
      values
    );
    const updatedUser = result.rows[0];
    console.log(`✅ Profile updated: ${updatedUser.username}`);
    res.json({ message: 'Profile updated successfully', user: updatedUser });
  } catch (err) {
    console.error('Profile update error:', err.message);
    res.status(500).json({ error: 'Profile update failed' });
  }
});

// 2.5 Projects
app.get('/api/projects', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM projects WHERE user_id = $1 ORDER BY created_at ASC', [req.user.id]);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Failed to fetch projects' });
  }
});

app.post('/api/projects', authenticateToken, async (req, res) => {
  const { name, description } = req.body;
  if (!name) return res.status(400).json({ error: 'Project name is required' });
  try {
    const result = await pool.query(
      'INSERT INTO projects (user_id, name, description) VALUES ($1, $2, $3) RETURNING *',
      [req.user.id, name, description || '']
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Project name already exists' });
    res.status(500).json({ error: 'Failed to create project' });
  }
});

// 3. AI Schema Generation (Groq / Llama 3.3 70B)

// Smart fallback generator
function generateFallbackSchema(prompt) {
  const promptLower = prompt.toLowerCase();
  let tableName = 'items';
  const tablePatterns = [
    /(?:table|schema|database)\s+(?:for\s+)?(?:my\s+)?(\w+)/i,
    /(?:create|make|design|build)\s+(?:a\s+)?(\w+)\s+(?:table|schema)/i,
    /(\w+)\s+(?:table|schema|database)/i,
  ];
  for (const pattern of tablePatterns) {
    const match = prompt.match(pattern);
    if (match) { tableName = match[1].toLowerCase().replace(/s$/, '') + 's'; break; }
  }

  const columnMap = {
    'name': { name: 'name', data_type: 'VARCHAR(255)', constraints: ['NOT NULL'] },
    'title': { name: 'title', data_type: 'VARCHAR(255)', constraints: ['NOT NULL'] },
    'email': { name: 'email', data_type: 'VARCHAR(255)', constraints: ['NOT NULL', 'UNIQUE'] },
    'password': { name: 'password_hash', data_type: 'VARCHAR(255)', constraints: ['NOT NULL'] },
    'phone': { name: 'phone', data_type: 'VARCHAR(20)', constraints: [] },
    'price': { name: 'price', data_type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] },
    'quantity': { name: 'quantity', data_type: 'INTEGER', constraints: ['DEFAULT 0'] },
    'stock': { name: 'stock_quantity', data_type: 'INTEGER', constraints: ['DEFAULT 0'] },
    'description': { name: 'description', data_type: 'TEXT', constraints: [] },
    'content': { name: 'content', data_type: 'TEXT', constraints: [] },
    'status': { name: 'status', data_type: 'VARCHAR(50)', constraints: ["DEFAULT 'active'"] },
    'role': { name: 'role', data_type: 'VARCHAR(50)', constraints: ["DEFAULT 'user'"] },
    'category': { name: 'category', data_type: 'VARCHAR(100)', constraints: [] },
    'address': { name: 'address', data_type: 'TEXT', constraints: [] },
    'image': { name: 'image_url', data_type: 'VARCHAR(500)', constraints: [] },
    'url': { name: 'url', data_type: 'VARCHAR(500)', constraints: [] },
    'rating': { name: 'rating', data_type: 'DECIMAL(3,2)', constraints: [] },
    'age': { name: 'age', data_type: 'INTEGER', constraints: [] },
    'active': { name: 'is_active', data_type: 'BOOLEAN', constraints: ['DEFAULT true'] },
    'username': { name: 'username', data_type: 'VARCHAR(100)', constraints: ['NOT NULL', 'UNIQUE'] },
    'order': { name: 'order_number', data_type: 'VARCHAR(50)', constraints: ['NOT NULL', 'UNIQUE'] },
    'customer': { name: 'customer_id', data_type: 'INTEGER', constraints: ['NOT NULL'] },
    'user': { name: 'user_id', data_type: 'INTEGER', constraints: ['NOT NULL'] },
    'product': { name: 'product_id', data_type: 'INTEGER', constraints: ['NOT NULL'] },
  };

  const columns = [{ name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] }];
  let foundColumns = false;
  for (const [keyword, column] of Object.entries(columnMap)) {
    if (promptLower.includes(keyword) && !columns.find(c => c.name === column.name)) {
      columns.push({ ...column });
      foundColumns = true;
    }
  }
  if (!foundColumns) {
    columns.push(
      { name: 'name', data_type: 'VARCHAR(255)', constraints: ['NOT NULL'] },
      { name: 'description', data_type: 'TEXT', constraints: [] },
      { name: 'status', data_type: 'VARCHAR(50)', constraints: ["DEFAULT 'active'"] },
    );
  }
  columns.push(
    { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] },
    { name: 'updated_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] },
  );
  return { table_name: tableName, columns };
}

// Smart Chat endpoint — detects intent (schema request vs conversation)
app.post('/api/chat', authenticateToken, aiLimiter, async (req, res) => {
  const { prompt } = req.body;
  const userId = req.user.id;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });
  if (typeof prompt !== 'string' || prompt.length > 2000) return res.status(400).json({ error: 'Prompt must be under 2000 characters' });

  console.log(`💬 Chat from ${req.user.username}: "${prompt}"`);

  // Intent detection — keywords that indicate schema generation
  const schemaKeywords = [
    'create', 'make', 'build', 'design', 'generate', 'table', 'schema',
    'database', 'columns', 'fields', 'entity', 'model', 'with columns',
    'add table', 'new table', 'define', 'structure'
  ];
  const promptLower = prompt.toLowerCase().trim();
  const isSchemaRequest = schemaKeywords.some(kw => promptLower.includes(kw));

  // --- Conversational response ---
  if (!isSchemaRequest) {
    try {
      const completion = await groq.chat.completions.create({
        model: 'llama-3.3-70b-versatile',
        messages: [
          {
            role: 'system',
            content: `You are StrucBot, a friendly and professional AI database architect assistant. 
You help users design database schemas. When users greet you or ask general questions, respond warmly and helpfully.
Keep responses concise (2-4 sentences). Be professional but friendly.
If the user seems to be asking about databases but hasn't specified what to create, guide them with suggestions.
Never generate JSON or SQL unless explicitly asked to create/design/build a table or schema.
Sign off as "StrucBot" when appropriate.`
          },
          { role: 'user', content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 300,
      });
      const reply = completion.choices[0].message.content.trim();
      console.log(`💬 (Chat) Reply to ${req.user.username}`);
      return res.json({ type: 'text', content: reply });
    } catch (error) {
      console.warn(`⚠️ Chat AI failed: ${error.message}`);
      // Friendly fallback responses
      const greetings = ['hi', 'hello', 'hey', 'hii', 'hiii', 'sup', 'yo', 'good morning', 'good evening', 'good afternoon'];
      const helpWords = ['help', 'what', 'how', 'can you', 'who'];
      
      let fallbackReply;
      if (greetings.some(g => promptLower.startsWith(g))) {
        fallbackReply = `Hey there! 👋 Welcome to StrucBot — I'm your AI database architect.\n\nI can help you design complete database schemas from natural language descriptions.\n\nTry something like:\n• "Create a users table with name, email, and role"\n• "Design a blog database with posts and comments"\n• "Build an e-commerce products table"`;
      } else if (helpWords.some(w => promptLower.includes(w))) {
        fallbackReply = `I'm StrucBot, your AI database architect! 🤖\n\nHere's what I can do:\n• Generate database schemas from descriptions\n• Export as PostgreSQL, MySQL, or SQLite\n• Generate Prisma & TypeORM code\n• Visualize ER diagrams\n\nJust describe the table you need, and I'll create it!`;
      } else {
        fallbackReply = `Thanks for your message! I'm best at designing database schemas.\n\nTry describing a table you need, like: "Create a products table with name, price, and category"`;
      }
      return res.json({ type: 'text', content: fallbackReply });
    }
  }

  // --- Schema generation ---
  let schema;
  let usedFallback = false;

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        {
          role: 'system',
          content: `You are an expert database architect. Generate a JSON object for a database schema.
RULES:
1. Return ONLY a raw JSON object, no markdown, no backticks, no text.
2. The JSON must have "table_name" (lowercase, plural, underscore-separated) and "columns" (array of objects).
3. Each column: "name" (snake_case), "data_type" (SQL type), "constraints" (array of strings like "PRIMARY KEY", "NOT NULL", "UNIQUE", "DEFAULT value").
4. Always include 'id' column (SERIAL PRIMARY KEY) first.
5. Always include 'created_at' (TIMESTAMP DEFAULT CURRENT_TIMESTAMP) last.
6. Use appropriate types: VARCHAR(255), TEXT, INTEGER, DECIMAL(10,2), BOOLEAN, TIMESTAMP, DATE.
7. Add NOT NULL for required fields, UNIQUE where appropriate.`
        },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });

    const jsonText = completion.choices[0].message.content.replace(/```json|```/g, '').trim();

    try {
      schema = JSON.parse(jsonText);
    } catch {
      console.warn('⚠️ AI response was not valid JSON, using fallback.');
      schema = generateFallbackSchema(prompt);
      usedFallback = true;
    }

    if (!schema.table_name || !Array.isArray(schema.columns)) {
      schema = generateFallbackSchema(prompt);
      usedFallback = true;
    }
  } catch (error) {
    console.warn(`⚠️ AI unavailable (${error.status || error.message}), using fallback.`);
    schema = generateFallbackSchema(prompt);
    usedFallback = true;
  }

  const schemaId = uuidv4();
  const projectId = req.body.project_id || null;
  try {
    await pool.query(
      'INSERT INTO schemas (id, user_id, project_id, table_name, columns, prompt, ai_generated) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [schemaId, userId, projectId, schema.table_name, JSON.stringify(schema.columns), prompt, !usedFallback]
    );
  } catch (dbErr) {
    console.error('DB save error:', dbErr.message);
  }

  const newSchema = { id: schemaId, ...schema, created_at: new Date().toISOString(), prompt, ai_generated: !usedFallback };
  console.log(`✅ ${usedFallback ? '(Fallback)' : '(AI)'} Schema "${newSchema.table_name}" for ${req.user.username}`);
  res.json({ type: 'schema', content: newSchema });
});

// Legacy endpoint (backward compatibility)
app.post('/api/generate-schema', authenticateToken, aiLimiter, async (req, res) => {
  const { prompt } = req.body;
  const userId = req.user.id;
  if (!prompt) return res.status(400).json({ error: 'Prompt is required' });

  let schema;
  let usedFallback = false;
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: `You are an expert database architect. Generate a JSON object for a database schema. Return ONLY raw JSON with "table_name" and "columns" array. Each column has "name", "data_type", "constraints".` },
        { role: 'user', content: prompt }
      ],
      temperature: 0.3,
      max_tokens: 1024,
    });
    const jsonText = completion.choices[0].message.content.replace(/```json|```/g, '').trim();
    try { schema = JSON.parse(jsonText); } catch { schema = generateFallbackSchema(prompt); usedFallback = true; }
    if (!schema.table_name || !Array.isArray(schema.columns)) { schema = generateFallbackSchema(prompt); usedFallback = true; }
  } catch { schema = generateFallbackSchema(prompt); usedFallback = true; }

  const schemaId = uuidv4();
  const projectId = req.body.project_id || null;
  try {
    await pool.query(
      'INSERT INTO schemas (id, user_id, project_id, table_name, columns, prompt, ai_generated) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [schemaId, userId, projectId, schema.table_name, JSON.stringify(schema.columns), prompt, !usedFallback]
    );
  } catch (dbErr) {
    console.error('DB save error:', dbErr.message);
  }

  const newSchema = { id: schemaId, ...schema, created_at: new Date().toISOString(), prompt, ai_generated: !usedFallback };
  res.json(newSchema);
});

// 4. Schema Management
app.get('/api/schemas', authenticateToken, async (req, res) => {
  const { project_id } = req.query;
  try {
    let query = 'SELECT id, project_id, table_name, columns, prompt, ai_generated, created_at, updated_at FROM schemas WHERE user_id = $1';
    let params = [req.user.id];
    if (project_id && project_id !== 'null' && project_id !== 'undefined' && project_id !== '') {
      query += ' AND project_id = $2';
      params.push(parseInt(project_id, 10));
    }
    query += ' ORDER BY created_at ASC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    console.error('Get schemas error:', err.message);
    res.status(500).json({ error: 'Failed to fetch schemas' });
  }
});

// 8. ER Diagram Data (must be BEFORE /api/schemas/:id to avoid Express treating 'er-diagram' as :id)
app.get('/api/schemas/er-diagram', authenticateToken, async (req, res) => {
  const { project_id } = req.query;
  try {
    let query = 'SELECT id, table_name, columns FROM schemas WHERE user_id = $1';
    let params = [req.user.id];
    if (project_id && project_id !== 'null' && project_id !== 'undefined' && project_id !== '') {
      query += ' AND project_id = $2';
      params.push(parseInt(project_id, 10));
    }
    query += ' ORDER BY created_at ASC';
    const result = await pool.query(query, params);
    const schemas = result.rows;
    if (schemas.length === 0) return res.json({ mermaid: '', schemas: [] });

    let mermaid = 'erDiagram\n';
    schemas.forEach(schema => {
      if (!Array.isArray(schema.columns)) return;
      
      mermaid += `  ${schema.table_name} {\n`;
      schema.columns.forEach(col => {
        if (!col || !col.name) return;
        const type = (col.data_type || 'VARCHAR').replace(/\(.*\)/, '').toLowerCase();
        const pk = (col.constraints || []).includes('PRIMARY KEY') ? 'PK' : '';
        const fk = col.name.endsWith('_id') && col.name !== 'id' ? 'FK' : '';
        const label = pk || fk || '';
        mermaid += `    ${type} ${col.name}${label ? ' ' + label : ''}\n`;
      });
      mermaid += `  }\n`;
    });

    schemas.forEach(schema => {
      if (!Array.isArray(schema.columns)) return;
      schema.columns.forEach(col => {
        if (!col || !col.name) return;
        if (col.name.endsWith('_id') && col.name !== 'id') {
          const refTable = col.name.replace('_id', '') + 's';
          const hasRef = schemas.find(s => s.table_name === refTable);
          if (hasRef) {
            mermaid += `  ${refTable} ||--o{ ${schema.table_name} : "has"\n`;
          }
        }
      });
    });

    res.json({ mermaid, schemas: schemas.map(s => ({ id: s.id, table_name: s.table_name, columns: s.columns })) });
  } catch (err) {
    console.error('ER diagram error:', err.message);
    res.status(500).json({ error: 'Failed to generate ER diagram' });
  }
});

app.get('/api/schemas/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, table_name, columns, prompt, ai_generated, created_at, updated_at FROM schemas WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Schema not found' });
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Get schema error:', err.message);
    res.status(500).json({ error: 'Failed to fetch schema' });
  }
});

app.put('/api/schemas/:id', authenticateToken, async (req, res) => {
  const { table_name, columns } = req.body;
  try {
    const updates = [];
    const values = [];
    let idx = 1;
    if (table_name) { updates.push(`table_name = $${idx++}`); values.push(table_name); }
    if (columns && Array.isArray(columns)) { updates.push(`columns = $${idx++}`); values.push(JSON.stringify(columns)); }
    updates.push(`updated_at = CURRENT_TIMESTAMP`);

    values.push(req.params.id, req.user.id);
    const result = await pool.query(
      `UPDATE schemas SET ${updates.join(', ')} WHERE id = $${idx++} AND user_id = $${idx} RETURNING *`,
      values
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Schema not found' });

    console.log(`✏️ Schema "${req.params.id}" updated by ${req.user.username}`);
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Update schema error:', err.message);
    res.status(500).json({ error: 'Failed to update schema' });
  }
});

app.delete('/api/schemas/:id', authenticateToken, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM schemas WHERE id = $1 AND user_id = $2 RETURNING id',
      [req.params.id, req.user.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Schema not found' });
    console.log(`🗑️ Schema ${req.params.id} deleted by ${req.user.username}`);
    res.json({ message: 'Schema deleted successfully' });
  } catch (err) {
    console.error('Delete schema error:', err.message);
    res.status(500).json({ error: 'Failed to delete schema' });
  }
});


// 5. SQL Export (Multi-dialect)
app.get('/api/schemas/:id/sql', authenticateToken, async (req, res) => {
  const { dialect } = req.query;
  try {
    const result = await pool.query('SELECT * FROM schemas WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Schema not found' });
    const schema = result.rows[0];

  const sqlDialect = dialect || 'postgresql';
  const columns = schema.columns.map(col => {
    let dataType = col.data_type;
    let constraintStr = (col.constraints || []).join(' ');

    if (sqlDialect === 'mysql') {
      dataType = dataType.replace('SERIAL', 'INT AUTO_INCREMENT');
      dataType = dataType.replace('BOOLEAN', 'TINYINT(1)');
      dataType = dataType.replace('TEXT', 'LONGTEXT');
      constraintStr = constraintStr.replace('DEFAULT CURRENT_TIMESTAMP', 'DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP');
    } else if (sqlDialect === 'sqlite') {
      dataType = dataType.replace('SERIAL', 'INTEGER');
      dataType = dataType.replace(/VARCHAR\(\d+\)/g, 'TEXT');
      dataType = dataType.replace(/DECIMAL\(\d+,\d+\)/g, 'REAL');
    }

    return `  ${col.name} ${dataType}${constraintStr ? ' ' + constraintStr : ''}`;
  });

  let sql;
  if (sqlDialect === 'mysql') {
    sql = `CREATE TABLE ${schema.table_name} (\n${columns.join(',\n')}\n) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;`;
  } else {
    sql = `CREATE TABLE ${schema.table_name} (\n${columns.join(',\n')}\n);`;
  }

  res.json({ sql, dialect: sqlDialect, table_name: schema.table_name });
  } catch (err) {
    console.error('SQL export error:', err.message);
    res.status(500).json({ error: 'Failed to generate SQL' });
  }
});

// 6. ORM Export
app.get('/api/schemas/:id/export', authenticateToken, async (req, res) => {
  const { format } = req.query;
  try {
    const result = await pool.query('SELECT * FROM schemas WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Schema not found' });
    const schema = result.rows[0];

  const typeMap = {
    prisma: {
      'SERIAL': 'Int @id @default(autoincrement())',
      'INTEGER': 'Int',
      'BIGINT': 'BigInt',
      'VARCHAR': 'String',
      'TEXT': 'String',
      'BOOLEAN': 'Boolean',
      'DECIMAL': 'Decimal',
      'FLOAT': 'Float',
      'TIMESTAMP': 'DateTime',
      'DATE': 'DateTime',
      'JSON': 'Json',
      'JSONB': 'Json',
      'UUID': 'String @default(uuid())',
    },
    typeorm: {
      'SERIAL': "'int', { primary: true, generated: true }",
      'INTEGER': "'int'",
      'BIGINT': "'bigint'",
      'VARCHAR': "'varchar'",
      'TEXT': "'text'",
      'BOOLEAN': "'boolean'",
      'DECIMAL': "'decimal'",
      'FLOAT': "'float'",
      'TIMESTAMP': "'timestamp'",
      'DATE': "'date'",
      'JSON': "'json'",
      'JSONB': "'jsonb'",
      'UUID': "'uuid'",
    }
  };

  const pascalCase = (str) => str.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join('');
  const camelCase = (str) => { const p = pascalCase(str); return p.charAt(0).toLowerCase() + p.slice(1); };
  const singular = (str) => str.replace(/s$/, '');
  const modelName = pascalCase(singular(schema.table_name));

  const getBaseType = (dataType) => dataType.replace(/\(.*\)/, '');

  if (format === 'prisma') {
    const fields = schema.columns.map(col => {
      const baseType = getBaseType(col.data_type);
      let prismaType = typeMap.prisma[baseType] || 'String';
      const isPK = (col.constraints || []).includes('PRIMARY KEY');
      const isUnique = (col.constraints || []).includes('UNIQUE');
      const isNotNull = (col.constraints || []).includes('NOT NULL');
      const hasDefault = (col.constraints || []).find(c => c.startsWith('DEFAULT'));

      if (baseType === 'SERIAL') return `  ${camelCase(col.name)}  ${prismaType}`;
      
      let line = `  ${camelCase(col.name)}  ${prismaType}`;
      if (!isNotNull && !isPK) line += '?';
      if (isUnique) line += ' @unique';
      if (hasDefault) {
        if (hasDefault.includes('CURRENT_TIMESTAMP')) line += ' @default(now())';
        else if (hasDefault.includes('true')) line += ' @default(true)';
        else if (hasDefault.includes('false')) line += ' @default(false)';
        else if (hasDefault.includes('0')) line += ' @default(0)';
      }
      return line;
    });

    const code = `model ${modelName} {\n${fields.join('\n')}\n\n  @@map("${schema.table_name}")\n}`;
    return res.json({ code, format: 'prisma', table_name: schema.table_name });
  }

  if (format === 'typeorm') {
    const fields = schema.columns.map(col => {
      const baseType = getBaseType(col.data_type);
      const isPK = (col.constraints || []).includes('PRIMARY KEY');
      const isUnique = (col.constraints || []).includes('UNIQUE');
      const isNotNull = (col.constraints || []).includes('NOT NULL');

      let decorator;
      if (isPK && baseType === 'SERIAL') {
        decorator = '@PrimaryGeneratedColumn()';
      } else if (isPK) {
        decorator = '@PrimaryColumn()';
      } else {
        const opts = [];
        if (isUnique) opts.push('unique: true');
        if (!isNotNull) opts.push('nullable: true');
        const typeOrmType = typeMap.typeorm[baseType] || "'varchar'";
        decorator = `@Column({ type: ${typeOrmType}${opts.length ? ', ' + opts.join(', ') : ''} })`;
      }

      const tsType = ['INTEGER', 'SERIAL', 'BIGINT', 'FLOAT', 'DECIMAL'].includes(baseType) ? 'number'
        : baseType === 'BOOLEAN' ? 'boolean'
        : ['TIMESTAMP', 'DATE'].includes(baseType) ? 'Date' : 'string';

      return `  ${decorator}\n  ${camelCase(col.name)}: ${tsType};`;
    });

    const code = `@Entity('${schema.table_name}')\nexport class ${modelName} {\n${fields.join('\n\n')}\n}`;
    return res.json({ code, format: 'typeorm', table_name: schema.table_name });
  }

  res.status(400).json({ error: 'Supported formats: prisma, typeorm' });
  } catch (err) {
    console.error('ORM export error:', err.message);
    res.status(500).json({ error: 'Failed to generate ORM export' });
  }
});

// 6.5 Mock Data Generation
app.get('/api/schemas/:id/mock-data', authenticateToken, aiLimiter, async (req, res) => {
  const { format = 'sql' } = req.query; // sql | json
  try {
    const result = await pool.query('SELECT * FROM schemas WHERE id = $1 AND user_id = $2', [req.params.id, req.user.id]);
    if (result.rows.length === 0) return res.status(404).json({ error: 'Schema not found' });
    const schema = result.rows[0];

    const promptText = `You are a data engineer. Generate EXACTLY 10 rows of highly realistic mock data for a table named "${schema.table_name}".
The schema has these columns:
${JSON.stringify(schema.columns)}

Format required: ${format === 'json' ? 'JSON Array of objects' : 'Standard SQL INSERT statements'}

RULES:
1. ONLY return the raw ${format.toUpperCase()} data. No intro, no explanations, no markdown blocks like \`\`\`sql. Just the raw string!
2. The data MUST perfectly match the data types and sizes in the schema.
3. Produce extremely realistic, non-gibberish data. E.g. coherent addresses, standard prices, valid emails.
4. For foreign keys (e.g., user_id), pick random integers between 1 and 20.
5. If SQL format: Output a SINGLE or MULTIPLE \`INSERT INTO ${schema.table_name}\` statements valid for PostgreSQL/MySQL.
6. If JSON format: Output a strictly valid JSON array [] and nothing else.`;

    const completion = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'system', content: promptText }],
      temperature: 0.5,
      max_tokens: 1500,
    });

    let mockData = completion.choices[0].message.content.replace(/```(?:sql|json|)?\n?|\n?```/gi, '').trim();

    if (format === 'json') {
      try {
        JSON.parse(mockData);
      } catch (e) {
        console.warn('AI JSON was slightly malformed, returning raw text anyway');
      }
    }

    res.json({ data: mockData, format, table_name: schema.table_name });
  } catch (err) {
    console.error('Mock data generation error:', err.message);
    res.status(500).json({ error: 'Failed to generate mock data' });
  }
});

// 7. Schema Templates
app.get('/api/templates', authenticateToken, (req, res) => {
  const templates = [
    {
      id: 'ecommerce-products',
      name: 'E-Commerce Products',
      category: 'E-Commerce',
      description: 'Product catalog with pricing, inventory, and categories',
      schema: {
        table_name: 'products',
        columns: [
          { name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] },
          { name: 'name', data_type: 'VARCHAR(255)', constraints: ['NOT NULL'] },
          { name: 'slug', data_type: 'VARCHAR(255)', constraints: ['NOT NULL', 'UNIQUE'] },
          { name: 'description', data_type: 'TEXT', constraints: [] },
          { name: 'price', data_type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] },
          { name: 'compare_at_price', data_type: 'DECIMAL(10,2)', constraints: [] },
          { name: 'sku', data_type: 'VARCHAR(100)', constraints: ['UNIQUE'] },
          { name: 'stock_quantity', data_type: 'INTEGER', constraints: ['NOT NULL', 'DEFAULT 0'] },
          { name: 'category_id', data_type: 'INTEGER', constraints: [] },
          { name: 'image_url', data_type: 'VARCHAR(500)', constraints: [] },
          { name: 'is_active', data_type: 'BOOLEAN', constraints: ['DEFAULT true'] },
          { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] },
        ]
      }
    },
    {
      id: 'ecommerce-orders',
      name: 'E-Commerce Orders',
      category: 'E-Commerce',
      description: 'Order management with status tracking and totals',
      schema: {
        table_name: 'orders',
        columns: [
          { name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] },
          { name: 'order_number', data_type: 'VARCHAR(50)', constraints: ['NOT NULL', 'UNIQUE'] },
          { name: 'customer_id', data_type: 'INTEGER', constraints: ['NOT NULL'] },
          { name: 'status', data_type: 'VARCHAR(50)', constraints: ['NOT NULL', "DEFAULT 'pending'"] },
          { name: 'subtotal', data_type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] },
          { name: 'tax', data_type: 'DECIMAL(10,2)', constraints: ['DEFAULT 0'] },
          { name: 'total', data_type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] },
          { name: 'shipping_address', data_type: 'TEXT', constraints: [] },
          { name: 'notes', data_type: 'TEXT', constraints: [] },
          { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] },
          { name: 'updated_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] },
        ]
      }
    },
    {
      id: 'blog-posts',
      name: 'Blog Posts',
      category: 'Blog',
      description: 'Blog post content with SEO and publishing workflow',
      schema: {
        table_name: 'posts',
        columns: [
          { name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] },
          { name: 'title', data_type: 'VARCHAR(255)', constraints: ['NOT NULL'] },
          { name: 'slug', data_type: 'VARCHAR(255)', constraints: ['NOT NULL', 'UNIQUE'] },
          { name: 'content', data_type: 'TEXT', constraints: ['NOT NULL'] },
          { name: 'excerpt', data_type: 'TEXT', constraints: [] },
          { name: 'author_id', data_type: 'INTEGER', constraints: ['NOT NULL'] },
          { name: 'category', data_type: 'VARCHAR(100)', constraints: [] },
          { name: 'tags', data_type: 'TEXT', constraints: [] },
          { name: 'featured_image', data_type: 'VARCHAR(500)', constraints: [] },
          { name: 'is_published', data_type: 'BOOLEAN', constraints: ['DEFAULT false'] },
          { name: 'published_at', data_type: 'TIMESTAMP', constraints: [] },
          { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] },
        ]
      }
    },
    {
      id: 'auth-users',
      name: 'User Authentication',
      category: 'Auth',
      description: 'User accounts with roles and secure password storage',
      schema: {
        table_name: 'users',
        columns: [
          { name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] },
          { name: 'username', data_type: 'VARCHAR(100)', constraints: ['NOT NULL', 'UNIQUE'] },
          { name: 'email', data_type: 'VARCHAR(255)', constraints: ['NOT NULL', 'UNIQUE'] },
          { name: 'password_hash', data_type: 'VARCHAR(255)', constraints: ['NOT NULL'] },
          { name: 'full_name', data_type: 'VARCHAR(255)', constraints: [] },
          { name: 'avatar_url', data_type: 'VARCHAR(500)', constraints: [] },
          { name: 'role', data_type: 'VARCHAR(50)', constraints: ['NOT NULL', "DEFAULT 'user'"] },
          { name: 'is_active', data_type: 'BOOLEAN', constraints: ['DEFAULT true'] },
          { name: 'last_login_at', data_type: 'TIMESTAMP', constraints: [] },
          { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] },
        ]
      }
    },
    {
      id: 'crm-contacts',
      name: 'CRM Contacts',
      category: 'CRM',
      description: 'Customer relationship management with lead tracking',
      schema: {
        table_name: 'contacts',
        columns: [
          { name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] },
          { name: 'first_name', data_type: 'VARCHAR(100)', constraints: ['NOT NULL'] },
          { name: 'last_name', data_type: 'VARCHAR(100)', constraints: ['NOT NULL'] },
          { name: 'email', data_type: 'VARCHAR(255)', constraints: ['UNIQUE'] },
          { name: 'phone', data_type: 'VARCHAR(20)', constraints: [] },
          { name: 'company', data_type: 'VARCHAR(255)', constraints: [] },
          { name: 'job_title', data_type: 'VARCHAR(255)', constraints: [] },
          { name: 'status', data_type: 'VARCHAR(50)', constraints: ["DEFAULT 'lead'"] },
          { name: 'source', data_type: 'VARCHAR(100)', constraints: [] },
          { name: 'notes', data_type: 'TEXT', constraints: [] },
          { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] },
        ]
      }
    },
    {
      id: 'saas-subscriptions',
      name: 'SaaS Subscriptions',
      category: 'SaaS',
      description: 'Subscription management with billing and plan tiers',
      schema: {
        table_name: 'subscriptions',
        columns: [
          { name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] },
          { name: 'user_id', data_type: 'INTEGER', constraints: ['NOT NULL'] },
          { name: 'plan', data_type: 'VARCHAR(50)', constraints: ['NOT NULL'] },
          { name: 'status', data_type: 'VARCHAR(50)', constraints: ['NOT NULL', "DEFAULT 'active'"] },
          { name: 'price_monthly', data_type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] },
          { name: 'billing_cycle', data_type: 'VARCHAR(20)', constraints: ["DEFAULT 'monthly'"] },
          { name: 'trial_ends_at', data_type: 'TIMESTAMP', constraints: [] },
          { name: 'current_period_start', data_type: 'TIMESTAMP', constraints: [] },
          { name: 'current_period_end', data_type: 'TIMESTAMP', constraints: [] },
          { name: 'cancelled_at', data_type: 'TIMESTAMP', constraints: [] },
          { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] },
        ]
      }
    },
  ];

  res.json(templates);
});

// Apply a template (creates a new schema from a template)
app.post('/api/templates/:id/apply', authenticateToken, async (req, res) => {
  const templates = [
    // Inline references — the GET endpoint above holds the full data
    // We'll just fetch the same template definitions
  ];
  // Re-fetch templates from the GET handler's data
  // For simplicity, we duplicate here
  const allTemplates = {
    'ecommerce-products': { table_name: 'products', columns: [{ name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] }, { name: 'name', data_type: 'VARCHAR(255)', constraints: ['NOT NULL'] }, { name: 'slug', data_type: 'VARCHAR(255)', constraints: ['NOT NULL', 'UNIQUE'] }, { name: 'description', data_type: 'TEXT', constraints: [] }, { name: 'price', data_type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] }, { name: 'compare_at_price', data_type: 'DECIMAL(10,2)', constraints: [] }, { name: 'sku', data_type: 'VARCHAR(100)', constraints: ['UNIQUE'] }, { name: 'stock_quantity', data_type: 'INTEGER', constraints: ['NOT NULL', 'DEFAULT 0'] }, { name: 'category_id', data_type: 'INTEGER', constraints: [] }, { name: 'image_url', data_type: 'VARCHAR(500)', constraints: [] }, { name: 'is_active', data_type: 'BOOLEAN', constraints: ['DEFAULT true'] }, { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] }] },
    'ecommerce-orders': { table_name: 'orders', columns: [{ name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] }, { name: 'order_number', data_type: 'VARCHAR(50)', constraints: ['NOT NULL', 'UNIQUE'] }, { name: 'customer_id', data_type: 'INTEGER', constraints: ['NOT NULL'] }, { name: 'status', data_type: 'VARCHAR(50)', constraints: ['NOT NULL', "DEFAULT 'pending'"] }, { name: 'subtotal', data_type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] }, { name: 'tax', data_type: 'DECIMAL(10,2)', constraints: ['DEFAULT 0'] }, { name: 'total', data_type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] }, { name: 'shipping_address', data_type: 'TEXT', constraints: [] }, { name: 'notes', data_type: 'TEXT', constraints: [] }, { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] }, { name: 'updated_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] }] },
    'blog-posts': { table_name: 'posts', columns: [{ name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] }, { name: 'title', data_type: 'VARCHAR(255)', constraints: ['NOT NULL'] }, { name: 'slug', data_type: 'VARCHAR(255)', constraints: ['NOT NULL', 'UNIQUE'] }, { name: 'content', data_type: 'TEXT', constraints: ['NOT NULL'] }, { name: 'excerpt', data_type: 'TEXT', constraints: [] }, { name: 'author_id', data_type: 'INTEGER', constraints: ['NOT NULL'] }, { name: 'category', data_type: 'VARCHAR(100)', constraints: [] }, { name: 'tags', data_type: 'TEXT', constraints: [] }, { name: 'featured_image', data_type: 'VARCHAR(500)', constraints: [] }, { name: 'is_published', data_type: 'BOOLEAN', constraints: ['DEFAULT false'] }, { name: 'published_at', data_type: 'TIMESTAMP', constraints: [] }, { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] }] },
    'auth-users': { table_name: 'users', columns: [{ name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] }, { name: 'username', data_type: 'VARCHAR(100)', constraints: ['NOT NULL', 'UNIQUE'] }, { name: 'email', data_type: 'VARCHAR(255)', constraints: ['NOT NULL', 'UNIQUE'] }, { name: 'password_hash', data_type: 'VARCHAR(255)', constraints: ['NOT NULL'] }, { name: 'full_name', data_type: 'VARCHAR(255)', constraints: [] }, { name: 'avatar_url', data_type: 'VARCHAR(500)', constraints: [] }, { name: 'role', data_type: 'VARCHAR(50)', constraints: ['NOT NULL', "DEFAULT 'user'"] }, { name: 'is_active', data_type: 'BOOLEAN', constraints: ['DEFAULT true'] }, { name: 'last_login_at', data_type: 'TIMESTAMP', constraints: [] }, { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] }] },
    'crm-contacts': { table_name: 'contacts', columns: [{ name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] }, { name: 'first_name', data_type: 'VARCHAR(100)', constraints: ['NOT NULL'] }, { name: 'last_name', data_type: 'VARCHAR(100)', constraints: ['NOT NULL'] }, { name: 'email', data_type: 'VARCHAR(255)', constraints: ['UNIQUE'] }, { name: 'phone', data_type: 'VARCHAR(20)', constraints: [] }, { name: 'company', data_type: 'VARCHAR(255)', constraints: [] }, { name: 'job_title', data_type: 'VARCHAR(255)', constraints: [] }, { name: 'status', data_type: 'VARCHAR(50)', constraints: ["DEFAULT 'lead'"] }, { name: 'source', data_type: 'VARCHAR(100)', constraints: [] }, { name: 'notes', data_type: 'TEXT', constraints: [] }, { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] }] },
    'saas-subscriptions': { table_name: 'subscriptions', columns: [{ name: 'id', data_type: 'SERIAL', constraints: ['PRIMARY KEY'] }, { name: 'user_id', data_type: 'INTEGER', constraints: ['NOT NULL'] }, { name: 'plan', data_type: 'VARCHAR(50)', constraints: ['NOT NULL'] }, { name: 'status', data_type: 'VARCHAR(50)', constraints: ['NOT NULL', "DEFAULT 'active'"] }, { name: 'price_monthly', data_type: 'DECIMAL(10,2)', constraints: ['NOT NULL'] }, { name: 'billing_cycle', data_type: 'VARCHAR(20)', constraints: ["DEFAULT 'monthly'"] }, { name: 'trial_ends_at', data_type: 'TIMESTAMP', constraints: [] }, { name: 'current_period_start', data_type: 'TIMESTAMP', constraints: [] }, { name: 'current_period_end', data_type: 'TIMESTAMP', constraints: [] }, { name: 'cancelled_at', data_type: 'TIMESTAMP', constraints: [] }, { name: 'created_at', data_type: 'TIMESTAMP', constraints: ['DEFAULT CURRENT_TIMESTAMP'] }] },
  };

  const template = allTemplates[req.params.id];
  if (!template) return res.status(404).json({ error: 'Template not found' });

  const userId = req.user.id;
  const schemaId = uuidv4();
  const projectId = req.body.project_id || null;

  try {
    await pool.query(
      'INSERT INTO schemas (id, user_id, project_id, table_name, columns, prompt, ai_generated) VALUES ($1, $2, $3, $4, $5, $6, $7)',
      [schemaId, userId, projectId, template.table_name, JSON.stringify(template.columns), `Template: ${req.params.id}`, false]
    );
    const newSchema = { id: schemaId, ...template, created_at: new Date().toISOString(), prompt: `Template: ${req.params.id}`, ai_generated: false };
    console.log(`📋 Template "${req.params.id}" applied for ${req.user.username}`);
    res.json(newSchema);
  } catch (err) {
    console.error('Template apply error:', err.message);
    res.status(500).json({ error: 'Failed to apply template' });
  }
});

// --- SERVER STARTUP ---
async function startServer() {
  try {
    // Initialize database tables
    await initDatabase();
    // Seed admin user
    await seedAdminUser(bcrypt);

    server.listen(port, () => {
      console.log('');
      console.log('╔══════════════════════════════════════╗');
      console.log('║     🤖 StrucBot Backend Server        ║');
      console.log('╠══════════════════════════════════════╣');
      console.log(`║  🚀 Running on http://localhost:${port}  ║`);
      console.log('║  📊 Mode: PostgreSQL                 ║');
      console.log('║  🔐 Auth: JWT                        ║');
      console.log('║  🧠 AI: Groq (Llama 3.3 70B)        ║');
      console.log('╚══════════════════════════════════════╝');
      console.log('');
    });
  } catch (err) {
    console.error('❌ Failed to start server:', err.message);
    console.error('   Make sure PostgreSQL is running and DATABASE_URL is correct in .env');
    process.exit(1);
  }
}

startServer();
