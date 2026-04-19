import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Flame, Loader, ArrowRight, Eye, EyeOff } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

// Floating particle component
const Particle = ({ delay, x, y, size }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      background: `radial-gradient(circle, rgba(212,160,23,0.25) 0%, transparent 70%)`,
    }}
    animate={{
      y: [-20, 20, -20],
      x: [-10, 10, -10],
      opacity: [0.2, 0.6, 0.2],
      scale: [1, 1.2, 1],
    }}
    transition={{
      duration: 6 + Math.random() * 4,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  />
);

const LoginForm = () => {
  const [formData, setFormData] = useState({ username: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const login = useAuthStore((state) => state.login);
  const navigate = useNavigate();

  // Generate particles
  const particles = useRef(
    Array.from({ length: 15 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 40 + Math.random() * 80,
      delay: Math.random() * 3,
    }))
  ).current;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await api.post('/auth/login', formData);
      login(response.data.user, response.data.token);
      // Small delay to let zustand persist flush to localStorage
      setTimeout(() => navigate('/chatbot'), 100);
    } catch (err) {
      setError(err.response?.data?.error || 'Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center auth-bg noise-overlay relative overflow-hidden">
      {/* Background particles */}
      {particles.map(p => (
        <Particle key={p.id} {...p} />
      ))}

      {/* Grid overlay */}
      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(212,160,23,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(212,160,23,0.4) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 w-full max-w-md mx-4 px-1"
      >
        {/* Logo + Title */}
        <motion.div 
          className="text-center mb-6 md:mb-8"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2, duration: 0.5 }}
        >
          <motion.div 
            className="inline-flex items-center justify-center w-14 h-14 md:w-16 md:h-16 rounded-2xl shadow-2xl mb-4"
            style={{ background: 'linear-gradient(135deg, #d4a017, #dc2626, #e87a1e)', boxShadow: '0 0 40px rgba(212,160,23,0.3), 0 8px 32px rgba(0,0,0,0.4)' }}
            animate={{ rotate: [0, 5, -5, 0] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Flame size={26} className="text-white" />
          </motion.div>
          <h1 className="text-2xl md:text-3xl font-bold text-white mb-1">Welcome back</h1>
          <p className="text-[var(--sb-text-muted)] text-sm">Sign in to your StrucBot account</p>
        </motion.div>

        {/* Card */}
        <div className="glass-card p-6 md:p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Error */}
            {error && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm text-center"
              >
                {error}
              </motion.div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--sb-text-muted)] uppercase tracking-wider">
                Username or Email
              </label>
              <div className="gradient-border">
                <input
                  id="login-username"
                  type="text"
                  required
                  className="w-full px-4 py-3 bg-[var(--sb-bg-card)] border border-[var(--sb-border)] rounded-2xl text-white placeholder-[var(--sb-text-muted)] focus:outline-none focus:border-amber-500/50 transition-all text-sm"
                  placeholder="Enter your username"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--sb-text-muted)] uppercase tracking-wider">
                Password
              </label>
              <div className="gradient-border relative">
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full px-4 py-3 pr-12 bg-[var(--sb-bg-card)] border border-[var(--sb-border)] rounded-2xl text-white placeholder-[var(--sb-text-muted)] focus:outline-none focus:border-amber-500/50 transition-all text-sm"
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--sb-text-muted)] hover:text-white transition-colors bg-transparent"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit"
              disabled={isLoading}
              id="login-submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'var(--sb-gradient-accent)' }}
            >
              {isLoading ? (
                <Loader className="animate-spin" size={18} />
              ) : (
                <>
                  Sign in
                  <ArrowRight size={16} />
                </>
              )}
            </motion.button>

            {/* Register link */}
            <p className="text-center text-sm text-[var(--sb-text-muted)]">
              Don't have an account?{' '}
              <Link to="/register" className="text-amber-400 hover:text-amber-300 font-medium transition-colors">
                Create one
              </Link>
            </p>
          </form>
        </div>

        {/* Footer hint */}
        <motion.p 
          className="text-center text-xs text-[var(--sb-text-muted)] mt-6 opacity-60"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ delay: 0.8 }}
        >
          Demo: admin / admin123
        </motion.p>
      </motion.div>
    </div>
  );
};

export default LoginForm;