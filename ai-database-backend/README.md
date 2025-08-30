# AI Database Builder Backend

A full-stack AI-powered database schema generator with MySQL, Redis, WebSockets, and role-based authentication.

## 🚀 Tech Stack

- **Backend**: Node.js, Express.js
- **Database**: MySQL with connection pooling
- **Cache**: Redis for schema caching
- **Real-time**: Socket.io for WebSocket connections
- **Authentication**: JWT with bcrypt password hashing
- **File Upload**: Multer with file validation
- **AI Integration**: OpenAI GPT-4 for schema generation
- **Security**: Helmet, CORS, rate limiting, input validation

## 📋 Prerequisites

- Node.js 18+ 
- MySQL 8.0+
- Redis 6.0+
- OpenAI API key

## 🛠️ Installation

1. **Clone and install dependencies:**
   ```bash
   cd ai-database-backend
   npm install
   ```

2. **Create environment file:**
   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

3. **Environment variables (.env):**
   ```env
   # Database Configuration
   DB_HOST=localhost
   DB_USER=root
   DB_PASSWORD=your_mysql_password
   DB_NAME=ai_database_builder

   # Redis Configuration
   REDIS_URL=redis://localhost:6379

   # OpenAI Configuration
   OPENAI_API_KEY=your_openai_api_key_here

   # JWT Configuration
   JWT_SECRET=your_jwt_secret_key_here

   # Server Configuration
   PORT=4000
   NODE_ENV=development

   # Frontend URL (for CORS)
   FRONTEND_URL=http://localhost:5174
   ```

4. **Setup MySQL database:**
   ```sql
   CREATE DATABASE ai_database_builder;
   CREATE USER 'dbuser'@'localhost' IDENTIFIED BY 'your_password';
   GRANT ALL PRIVILEGES ON ai_database_builder.* TO 'dbuser'@'localhost';
   FLUSH PRIVILEGES;
   ```

5. **Start Redis server:**
   ```bash
   # Windows
   redis-server

   # macOS/Linux
   sudo systemctl start redis
   ```

## 🚀 Running the Application

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm start
```

The server will start on http://localhost:4000

## 📊 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login

### Schemas
- `POST /api/generate-schema` - Generate AI schema (authenticated)
- `GET /api/schemas` - Get user's schemas (authenticated)

### File Management
- `POST /api/upload` - Upload files (authenticated)
- `GET /api/files` - Get user's files (authenticated)

### Admin (Admin role required)
- `GET /api/admin/users` - Get all users
- `GET /api/admin/schemas` - Get all schemas

### Health Check
- `GET /api/health` - Server health status

## 🔐 Role-Based Access

- **User**: Generate schemas, upload files, view own data
- **Moderator**: View all schemas, moderate content
- **Admin**: Full access to all features and user management

## 🌐 WebSocket Events

- `user-registered` - New user registration
- `schema-generated` - New schema created
- `file-uploaded` - New file uploaded

## 📁 File Upload

Supported file types:
- Images: JPEG, PNG, GIF
- Documents: PDF, DOC, DOCX
- Text files: TXT

Maximum file size: 10MB

## 🔒 Security Features

- JWT authentication with refresh tokens
- Password hashing with bcrypt
- Rate limiting (100 requests per 15 minutes)
- Input validation and sanitization
- CORS protection
- Helmet security headers
- File type validation

## 🗄️ Database Schema

The application automatically creates these tables:
- `users` - User accounts and roles
- `schemas` - Generated database schemas
- `files` - Uploaded file metadata

## 🚨 Troubleshooting

**MySQL connection failed:**
- Verify MySQL is running
- Check credentials in .env
- Ensure database exists

**Redis connection failed:**
- Verify Redis server is running
- Check Redis URL in .env

**OpenAI API errors:**
- Verify API key is valid
- Check API quota and billing

**Port already in use:**
- Change PORT in .env
- Kill existing process: `lsof -ti:4000 | xargs kill -9`

## 📝 Development

**Adding new endpoints:**
1. Add route in server.js
2. Implement authentication middleware if needed
3. Add input validation
4. Handle errors gracefully

**Database migrations:**
- Add new table creation SQL in `createTables()` function
- Restart server to apply changes

## 🚀 Deployment

**Production considerations:**
- Use environment-specific .env files
- Set NODE_ENV=production
- Use strong JWT_SECRET
- Configure proper CORS origins
- Set up SSL/TLS
- Use PM2 or similar process manager
- Configure logging and monitoring
