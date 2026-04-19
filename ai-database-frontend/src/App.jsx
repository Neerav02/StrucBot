import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Import Pages and Components
import Layout from './components/Layout';
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
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      
      {/* Dashboard routes are now accessible to guests. Components will handle auth. */}
      <Route element={<Layout />}>
        <Route path="/chatbot" element={<Chatbot />} />
        <Route path="/editor" element={<SchemaEditor />} />
        <Route path="/diagram" element={<ERDiagram />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
      </Route>
      
      {/* This is the default route handler.
          If the user is logged in (has a token), it redirects them to the /chatbot page.
          If they are not logged in, it redirects them to the /login page. */}
      <Route 
        path="*" 
        element={<Navigate to={token ? "/chatbot" : "/login"} replace />} 
      />
    </Routes>
  );
}

export default App;