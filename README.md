<div align="center">

# 🤖 StrucBot AI

### AI-Powered Database Schema Generator

*Describe your database in plain English → Get production-ready schemas with SQL, Prisma & TypeORM exports*

[![React](https://img.shields.io/badge/React-18.3-61DAFB?style=flat-square&logo=react&logoColor=white)](https://react.dev)
[![Node.js](https://img.shields.io/badge/Node.js-18+-339933?style=flat-square&logo=node.js&logoColor=white)](https://nodejs.org)
[![Groq](https://img.shields.io/badge/Groq-Llama_3.3_70B-F55036?style=flat-square&logo=meta&logoColor=white)](https://groq.com)
[![Vite](https://img.shields.io/badge/Vite-5.4-646CFF?style=flat-square&logo=vite&logoColor=white)](https://vitejs.dev)
[![License](https://img.shields.io/badge/License-MIT-22d3ee?style=flat-square)](LICENSE)

---

[Features](#-features) · [Architecture](#-system-architecture) · [Getting Started](#-getting-started) · [API Reference](#-api-reference) · [Deployment](#-deployment) · [Screenshots](#-screenshots)

</div>

---

## ✨ Features

<table>
<tr>
<td width="50%">

### 🧠 AI Schema Generation
Describe any database in natural language and get a complete, production-ready schema with proper data types, constraints, and relationships — powered by **Groq's Llama 3.3 70B**.

### ✏️ Visual Schema Editor
Full CRUD editing interface — rename tables, add/remove columns, change data types, toggle constraints (PK, NOT NULL, UNIQUE, DEFAULT) with a beautiful inline editor.

### 🔀 ER Diagram Visualization
Auto-generated **Mermaid.js** entity-relationship diagrams that detect foreign key relationships from `_id` columns. Download as SVG or copy Mermaid source.

</td>
<td width="50%">

### 🗄️ Multi-Dialect SQL Export
Export schemas as **PostgreSQL**, **MySQL**, or **SQLite** — each with proper dialect-specific syntax (AUTO_INCREMENT, InnoDB, TEXT conversions).

### 📦 ORM Code Generation
Generate **Prisma** models (`@id`, `@unique`, `@@map`) and **TypeORM** entity classes (`@Entity`, `@Column`, `@PrimaryGeneratedColumn`) with one click.

### 📋 Schema Template Library
**6 production-ready templates** — E-Commerce Products, Orders, Blog Posts, User Auth, CRM Contacts, SaaS Subscriptions. One-click apply with category filtering.

</td>
</tr>
</table>

### Additional Features

| Feature | Description |
|---------|-------------|
| 🔐 **JWT Authentication** | Secure register/login with bcrypt password hashing |
| 🎨 **Premium Dark UI** | Glassmorphic design, Framer Motion animations, gradient accents |
| 🛡️ **Security Hardened** | Helmet headers, CORS, rate limiting (100 req/15min), input validation |
| 🔄 **Smart Fallback** | Keyword-based schema generation when AI is unavailable |
| 📊 **User Dashboard** | Profile stats, schema count, generation history |
| ⚙️ **Settings Panel** | Theme selector, AI model info, notification preferences |

---

## 🏗️ System Architecture

```mermaid
graph TB
    subgraph Frontend ["🖥️ Frontend (React + Vite)"]
        UI["UI Components<br/>Framer Motion"]
        Pages["6 Pages<br/>Chat · Editor · ER Diagram<br/>Templates · Profile · Settings"]
        Store["Zustand Store<br/>Auth State"]
        API_Client["Axios Client<br/>JWT Interceptors"]
    end

    subgraph Backend ["⚙️ Backend (Express.js)"]
        Auth["Auth Module<br/>JWT + bcrypt"]
        Schema["Schema Engine<br/>CRUD + Export"]
        AI["AI Generator<br/>Groq SDK"]
        Templates_BE["Template Engine<br/>6 Pre-built Schemas"]
        Export["Export Module<br/>SQL · Prisma · TypeORM"]
        Security["Security Layer<br/>Helmet · CORS · Rate Limit"]
    end

    subgraph External ["☁️ External Services"]
        Groq["Groq Cloud API<br/>Llama 3.3 70B"]
        Vercel["Vercel<br/>Frontend Hosting"]
        Render["Render<br/>Backend Hosting"]
    end

    UI --> Pages
    Pages --> Store
    Pages --> API_Client
    API_Client -->|HTTPS /api| Security
    Security --> Auth
    Security --> Schema
    Schema --> AI
    AI -->|OpenAI SDK| Groq
    Schema --> Export
    Schema --> Templates_BE

    Frontend -->|Deploy| Vercel
    Backend -->|Deploy| Render

    style Frontend fill:#1e1b4b,stroke:#6366f1,color:#e0e7ff
    style Backend fill:#0c1222,stroke:#22d3ee,color:#e0f2fe
    style External fill:#1a0d2e,stroke:#a855f7,color:#f3e8ff
```

### Data Flow

```mermaid
sequenceDiagram
    participant U as 👤 User
    participant F as 🖥️ Frontend
    participant B as ⚙️ Backend
    participant G as 🤖 Groq AI

    U->>F: "Create a users table with email and role"
    F->>B: POST /api/generate-schema
    B->>G: Chat Completion (Llama 3.3 70B)
    G-->>B: JSON Schema Response
    B-->>F: Schema + Metadata
    F-->>U: Render Schema Card

    U->>F: Click "Export → Prisma"
    F->>B: GET /api/schemas/:id/export?format=prisma
    B-->>F: Prisma Model Code
    F-->>U: Display with Copy Button
```

---

## 📁 Project Structure

```
StrucBot/
│
├── 📄 README.md                         # This file
├── 📄 .gitignore                        # Root ignore rules
│
├── 🔧 ai-database-backend/             # Express.js API Server
│   ├── 📄 server.js                     # Main server (700+ lines)
│   │   ├── Auth routes                  # Register, Login, Profile
│   │   ├── Schema CRUD                  # Generate, Read, Update, Delete
│   │   ├── SQL Export                   # PostgreSQL, MySQL, SQLite
│   │   ├── ORM Export                   # Prisma, TypeORM
│   │   ├── Templates                   # 6 pre-built schemas
│   │   └── ER Diagram data             # Mermaid syntax generator
│   ├── 📄 package.json                  # Dependencies & scripts
│   ├── 📄 .env.example                  # Environment variable template
│   ├── 🐳 Dockerfile                    # Docker deployment (Alpine Node 20)
│   ├── 📄 .dockerignore                 # Docker build exclusions
│   └── 📄 render.yaml                   # Render.com deploy blueprint
│
├── 🎨 ai-database-frontend/            # React + Vite SPA
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── Layout.jsx               # Sidebar navigation + main layout
│   │   │   └── ProtectedRoute.jsx       # JWT auth guard
│   │   │
│   │   ├── 📂 pages/
│   │   │   ├── Login.jsx                # 🔐 Auth login (particles bg)
│   │   │   ├── Register.jsx             # 🔐 Auth register (password strength)
│   │   │   ├── Chatbot.jsx              # 🤖 AI schema chat interface
│   │   │   ├── SchemaEditor.jsx         # ✏️ Edit schemas + SQL/ORM export
│   │   │   ├── ERDiagram.jsx            # 🔀 Mermaid.js ER visualization
│   │   │   ├── Templates.jsx            # 📋 Pre-built schema templates
│   │   │   ├── Profile.jsx              # 👤 User profile & stats
│   │   │   └── Settings.jsx             # ⚙️ Theme & AI engine info
│   │   │
│   │   ├── 📂 services/
│   │   │   └── api.js                   # Axios instance + JWT interceptors
│   │   │
│   │   ├── 📂 stores/
│   │   │   └── authStore.js             # Zustand auth state management
│   │   │
│   │   ├── App.jsx                      # React Router (8 routes)
│   │   ├── main.jsx                     # App entry point
│   │   └── index.css                    # Design system (CSS variables)
│   │
│   ├── 📄 vercel.json                   # Vercel SPA routing config
│   ├── 📄 .env.production               # Production API URL
│   ├── 📄 vite.config.js                # Build config + code splitting
│   └── 📄 package.json                  # Dependencies & scripts
```

---

## 🚀 Getting Started

### Prerequisites

| Tool | Version | Purpose |
|------|---------|---------|
| [Node.js](https://nodejs.org) | 18+ | Runtime |
| [npm](https://npmjs.com) | 9+ | Package manager |
| [Groq API Key](https://console.groq.com) | Free | AI model access |

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/Neerav02/StrucBot.git
cd StrucBot

# 2. Setup Backend
cd ai-database-backend
npm install
cp .env.example .env
# Edit .env with your keys (see below)

# 3. Setup Frontend
cd ../ai-database-frontend
npm install
```

### Environment Variables

Create `ai-database-backend/.env`:

```env
# 🤖 AI — Get free key at https://console.groq.com
GROQ_API_KEY=gsk_your_api_key_here

# 🔐 Auth — Generate: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
JWT_SECRET=your_random_64_char_hex_string

# 🌐 CORS — Frontend URL
FRONTEND_URL=http://localhost:5174

# 🚀 Server
PORT=4000
```

### Run Development Servers

```bash
# Terminal 1 — Backend (http://localhost:4000)
cd ai-database-backend
npm run dev

# Terminal 2 — Frontend (http://localhost:5174)
cd ai-database-frontend
npm run dev
```

> 💡 **Default login**: `admin` / `admin123`

---

## 📡 API Reference

### Authentication

| Method | Endpoint | Body | Description |
|--------|----------|------|-------------|
| `POST` | `/api/auth/register` | `{ username, email, password }` | Create account |
| `POST` | `/api/auth/login` | `{ username, password }` | Login → JWT |
| `GET` | `/api/auth/profile` | — | Get profile |
| `PUT` | `/api/auth/profile` | `{ username?, email? }` | Update profile |

### Schema Operations

| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/generate-schema` | AI schema generation from prompt |
| `GET` | `/api/schemas` | List all user schemas |
| `GET` | `/api/schemas/:id` | Get single schema |
| `PUT` | `/api/schemas/:id` | Update schema (table name, columns) |
| `DELETE` | `/api/schemas/:id` | Delete schema |

### Export & Tools

| Method | Endpoint | Params | Description |
|--------|----------|--------|-------------|
| `GET` | `/api/schemas/:id/sql` | `?dialect=postgresql\|mysql\|sqlite` | SQL export |
| `GET` | `/api/schemas/:id/export` | `?format=prisma\|typeorm` | ORM code export |
| `GET` | `/api/schemas/er-diagram` | — | Mermaid ER diagram data |
| `GET` | `/api/templates` | — | List all templates |
| `POST` | `/api/templates/:id/apply` | — | Apply template to user |
| `GET` | `/api/health` | — | Server health check |

> 🔒 All endpoints except `/auth/login`, `/auth/register`, and `/health` require `Authorization: Bearer <token>` header.

---

## 🌐 Deployment

### Frontend → Vercel (Free)

| Step | Action |
|------|--------|
| 1 | Push repo to GitHub |
| 2 | Import project on [vercel.com](https://vercel.com) |
| 3 | Set root directory: `ai-database-frontend` |
| 4 | Add env: `VITE_API_URL = https://your-backend.onrender.com/api` |
| 5 | Deploy ✅ |

### Backend → Render (Free)

| Step | Action |
|------|--------|
| 1 | Create Web Service on [render.com](https://render.com) |
| 2 | Connect GitHub repo |
| 3 | Set root directory: `ai-database-backend` |
| 4 | Build: `npm install` · Start: `node server.js` |
| 5 | Add env vars: `GROQ_API_KEY`, `JWT_SECRET`, `FRONTEND_URL`, `PORT` |
| 6 | Deploy ✅ |

### Backend → Docker

```bash
cd ai-database-backend
docker build -t strucbot-api .
docker run -p 4000:4000 --env-file .env strucbot-api
```

---

## 🛠️ Tech Stack

<table>
<tr>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=react" width="48" height="48" alt="React" />
<br><sub>React 18</sub>
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=vite" width="48" height="48" alt="Vite" />
<br><sub>Vite 5</sub>
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=nodejs" width="48" height="48" alt="Node.js" />
<br><sub>Node.js</sub>
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=express" width="48" height="48" alt="Express" />
<br><sub>Express</sub>
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=tailwind" width="48" height="48" alt="Tailwind" />
<br><sub>Tailwind</sub>
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=docker" width="48" height="48" alt="Docker" />
<br><sub>Docker</sub>
</td>
<td align="center" width="96">
<img src="https://skillicons.dev/icons?i=vercel" width="48" height="48" alt="Vercel" />
<br><sub>Vercel</sub>
</td>
</tr>
</table>

| Layer | Technology | Purpose |
|-------|-----------|---------|
| **Frontend** | React 18, Vite, Framer Motion | Reactive UI with animations |
| **Styling** | Tailwind CSS, CSS Variables | Glassmorphic dark design |
| **State** | Zustand | Lightweight auth state |
| **HTTP** | Axios | API calls with interceptors |
| **Backend** | Express.js, Node.js | RESTful API server |
| **AI** | Groq SDK (OpenAI-compatible) | Llama 3.3 70B inference |
| **Auth** | JWT, bcryptjs | Token-based authentication |
| **Security** | Helmet, CORS, express-rate-limit | Production hardening |
| **Diagrams** | Mermaid.js | ER diagram visualization |
| **Deploy** | Vercel, Render, Docker | Free-tier hosting |

---

## 🔮 What Makes StrucBot Unique

| # | Feature | Why It Matters |
|---|---------|---------------|
| 1 | **AI + Manual Editing** | Generate with AI, fine-tune every column by hand |
| 2 | **Multi-Format Export** | 3 SQL dialects + 2 ORM formats = 5 export options |
| 3 | **Visual ER Diagrams** | See relationships across your entire database |
| 4 | **Template Library** | Start from proven patterns, not from scratch |
| 5 | **Smart Fallback** | Works even without AI (keyword-based generation) |
| 6 | **Zero Cost** | Groq API is free, deploy on free tiers everywhere |

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<div align="center">

**Built with ❤️ by [Neerav](https://github.com/Neerav02)**

⭐ Star this repo if you found it useful!

</div>
