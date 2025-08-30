import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';

// Import Pages and Components
import Layout from './components/Layout';
import ProtectedRoute from './components/ProtectedRoute';
import LoginForm from './pages/login';
import RegisterForm from './pages/register';
import Chatbot from './pages/chatbot';
import Profile from './pages/Profile';
import Settings from './pages/Settings';

function App() {
  const { token } = useAuthStore();

  return (
    <Routes>
      {/* Public routes for login and register */}
      <Route path="/login" element={<LoginForm />} />
      <Route path="/register" element={<RegisterForm />} />
      
      {/* Protected routes are nested inside here. They will only be accessible if the user is logged in. */}
      <Route element={<ProtectedRoute />}>
        <Route element={<Layout />}>
          <Route path="/chatbot" element={<Chatbot />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
        </Route>
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