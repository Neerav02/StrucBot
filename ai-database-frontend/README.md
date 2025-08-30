# AI Database Builder Frontend

A modern React-based frontend for the AI Database Builder with TanStack Table, Uppy.js file uploads, offline storage, and WebSocket integration.

## 🚀 Tech Stack

- **Framework**: React 19 with Vite
- **State Management**: Zustand
- **Routing**: React Router DOM v6
- **Tables**: TanStack Table (React Table v8)
- **File Uploads**: Uppy.js with drag & drop
- **Styling**: Tailwind CSS
- **Animations**: Framer Motion
- **Offline Storage**: IndexedDB
- **Real-time**: Socket.io Client
- **HTTP Client**: Axios with interceptors

## 📋 Prerequisites

- Node.js 18+
- Backend server running (see backend README)
- Modern browser with IndexedDB support

## 🛠️ Installation

1. **Install dependencies:**
   ```bash
   cd ai-database-frontend
   npm install
   ```

2. **Start development server:**
   ```bash
   npm run dev
   ```

The frontend will start on http://localhost:5174

## 🎯 Features

### 🔐 Authentication
- User registration and login
- JWT token management
- Protected routes
- Role-based access control

### 🗄️ Schema Management
- AI-powered database schema generation
- Natural language to SQL conversion
- Schema visualization with TanStack Table
- SQL script export
- Schema history and management

### 📁 File Management
- Drag & drop file uploads with Uppy.js
- Multiple file type support
- File preview and download
- File organization and deletion

### 👥 User Management
- User profiles and settings
- Role-based permissions
- Admin panel for user management
- Activity tracking

### 🌐 Real-time Features
- WebSocket integration
- Live notifications
- Real-time updates
- Collaborative features

### 💾 Offline Capabilities
- IndexedDB for offline storage
- Offline schema viewing
- Sync when online
- Progressive Web App features

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── LoginForm.jsx   # Authentication form
│   ├── RegisterForm.jsx # User registration
│   ├── Dashboard.jsx   # Main dashboard
│   ├── SchemaManager.jsx # Schema management
│   ├── SchemaViewer.jsx # Schema display
│   ├── FileUpload.jsx  # File upload with Uppy
│   ├── FileManager.jsx # File management
│   └── AdminPanel.jsx  # Admin interface
├── stores/             # Zustand state stores
│   ├── authStore.js    # Authentication state
│   └── schemaStore.js  # Schema management state
├── services/           # API services
│   └── api.js         # HTTP client with auth
├── App.jsx            # Main app component
└── main.jsx           # App entry point
```

## 🎨 UI Components

### TanStack Table Integration
- Sortable and filterable columns
- Responsive design
- Custom cell renderers
- Pagination support

### Uppy.js File Upload
- Drag & drop interface
- File type validation
- Progress indicators
- Error handling

### Framer Motion Animations
- Smooth page transitions
- Component animations
- Loading states
- Interactive feedback

## 🔧 Configuration

### Vite Configuration
- Proxy setup for API calls
- React plugin
- Development server on port 5174

### Tailwind CSS
- Custom color scheme
- Responsive utilities
- Dark theme support
- Component classes

## 📱 Responsive Design

- Mobile-first approach
- Tablet and desktop optimization
- Touch-friendly interactions
- Adaptive layouts

## 🔒 Security Features

- JWT token storage
- Secure API communication
- Input validation
- XSS protection
- CSRF protection

## 🚀 Development

### Adding New Components
1. Create component in `src/components/`
2. Add to appropriate route in `App.jsx`
3. Import required dependencies
4. Follow component patterns

### State Management
- Use Zustand stores for global state
- Local state for component-specific data
- Follow React hooks best practices

### Styling
- Use Tailwind CSS classes
- Follow design system patterns
- Maintain consistency with existing components

## 🧪 Testing

```bash
# Run linting
npm run lint

# Build for production
npm run build

# Preview production build
npm run preview
```

## 🚨 Troubleshooting

**Build errors:**
- Check Node.js version (18+ required)
- Clear node_modules and reinstall
- Verify all dependencies are installed

**API connection issues:**
- Ensure backend is running
- Check CORS configuration
- Verify API endpoints

**File upload issues:**
- Check file size limits
- Verify file type restrictions
- Ensure authentication token is valid

## 📦 Production Build

```bash
npm run build
```

The build output will be in `dist/` directory.

## 🌐 Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## 🔄 Updates and Maintenance

- Regular dependency updates
- Security patches
- Performance optimizations
- Feature enhancements

## 📄 License

This project is licensed under the ISC License.
