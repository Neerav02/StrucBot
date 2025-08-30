# Backend Setup Instructions

## 🚀 **Quick Start (Demo Mode)**

The backend is now configured to run in **demo mode** without requiring MySQL or Redis! This means you can test the application immediately.

### 1. **Start the Backend**
```bash
cd ai-database-backend
npm start
```

You should see:
```
⚠️  Database credentials not provided. Running in demo mode with in-memory storage.
⚠️  Running without Redis caching.
🚀 Server running on http://localhost:4000
📊 Database: Demo Mode (In-Memory)
🔴 Redis: Disconnected
🤖 OpenAI: Available (Mock Mode)
```

### 2. **Test the API**
- **Health Check**: `GET http://localhost:4000/api/health`
- **Register**: `POST http://localhost:4000/api/auth/register`
- **Login**: `POST http://localhost:4000/api/auth/login`

## 🗄️ **Full Database Setup (Optional)**

If you want to use a real MySQL database:

### 1. **Install MySQL**
- **Windows**: Download from [MySQL Downloads](https://dev.mysql.com/downloads/)
- **macOS**: `brew install mysql`
- **Linux**: `sudo apt-get install mysql-server`

### 2. **Start MySQL Service**
```bash
# Windows
net start mysql

# macOS
brew services start mysql

# Linux
sudo systemctl start mysql
```

### 3. **Create Database**
```sql
CREATE DATABASE ai_database_builder;
```

### 4. **Create .env File**
Create a `.env` file in the `ai-database-backend` folder:

```env
# Server Configuration
PORT=4000
NODE_ENV=development
FRONTEND_URL=http://localhost:5173

# Database Configuration (MySQL)
DB_HOST=localhost
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=ai_database_builder

# Redis Configuration (Optional)
REDIS_URL=redis://localhost:6379

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# OpenAI Configuration
OPENAI_API_KEY=your-openai-api-key-here

# Feature Flags
ENABLE_MOCK_RESPONSES=true
```

### 5. **Install Redis (Optional)**
```bash
# Windows: Use WSL or Docker
# macOS
brew install redis

# Linux
sudo apt-get install redis-server
```

## 🔧 **Current Status**

✅ **Backend**: Running in demo mode  
✅ **Frontend**: Fixed router issues  
✅ **Authentication**: Working with in-memory storage  
✅ **API Endpoints**: All functional  
✅ **Mock Responses**: Enabled for OpenAI  

## 🧪 **Testing the Application**

1. **Start Backend**: `npm start` (in demo mode)
2. **Start Frontend**: `npm run dev`
3. **Open Browser**: Navigate to `http://localhost:5173`
4. **Register/Login**: Create an account and test all features

## 📝 **Demo Mode Features**

- ✅ User registration and login
- ✅ JWT authentication
- ✅ Schema generation (with mock AI responses)
- ✅ File upload and management
- ✅ Admin panel
- ✅ Real-time updates via WebSocket
- ✅ All data stored in memory (resets on restart)

## 🚨 **Troubleshooting**

### **Port Already in Use**
```bash
# Kill process on port 4000
kill-port 4000
npm start
```

### **Frontend Router Issues**
- ✅ Fixed: Removed nested routers
- ✅ Fixed: Centralized routing in main.jsx

### **Database Connection Issues**
- ✅ Fixed: Graceful fallback to demo mode
- ✅ Fixed: In-memory storage for testing

The application is now fully functional in demo mode! 🎉
