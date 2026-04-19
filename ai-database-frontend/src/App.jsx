import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Import Pages and Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './pages/Login';
import RegisterForm from './pages/Register';
import Chatbot from './pages/Chatbot';
import SchemaEditor from './pages/SchemaEditor';
import ERDiagram from './pages/ERDiagram';
import Templates from './pages/Templates';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function App() {
  const { token } = useAuthStore();

  return (
    <Routes>
      {/* Public routes for login and register */}
      <Route path="/login" element={token ? <Navigate to="/chatbot" replace /> : <LoginForm />} />
      <Route path="/register" element={token ? <Navigate to="/chatbot" replace /> : <RegisterForm />} />
      
      {/* Chatbot is publicly accessible (ChatGPT-style: view without login, prompt on action) */}
      <Route element={<Layout />}>
        <Route path="/chatbot" element={<Chatbot />} />
      </Route>

      {/* Protected routes — require login */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/editor" element={<SchemaEditor />} />
          <Route path="/diagram" element={<ERDiagram />} />
          <Route path="/templates" element={<Templates />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
      </Route>
      
      {/* Default: go to chatbot (public dashboard) */}
      <Route path="*" element={<Navigate to="/chatbot" replace />} />
    </Routes>
  );
}

export default App;