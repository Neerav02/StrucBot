import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, Loader, ArrowRight, Eye, EyeOff, CheckCircle } from 'lucide-react';
import api from '../services/api';

const Particle = ({ delay, x, y, size }) => (
  <motion.div
    className="absolute rounded-full"
    style={{
      left: `${x}%`,
      top: `${y}%`,
      width: size,
      height: size,
      background: `radial-gradient(circle, rgba(34,211,238,0.25) 0%, transparent 70%)`,
    }}
    animate={{
      y: [-20, 20, -20],
      x: [-10, 10, -10],
      opacity: [0.2, 0.5, 0.2],
      scale: [1, 1.15, 1],
    }}
    transition={{
      duration: 7 + Math.random() * 3,
      repeat: Infinity,
      delay,
      ease: 'easeInOut',
    }}
  />
);

const RegisterForm = () => {
  const [formData, setFormData] = useState({ username: '', email: '', password: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const particles = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      size: 50 + Math.random() * 70,
      delay: Math.random() * 2,
    }))
  ).current;

  const passwordStrength = formData.password.length >= 8 ? 'strong' : formData.password.length >= 6 ? 'medium' : formData.password.length > 0 ? 'weak' : '';

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }
    setIsLoading(true);
    setError('');
    setSuccess('');

    try {
      await api.post('/auth/register', formData);
      setSuccess('Account created successfully!');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.response?.data?.error || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex items-center justify-center auth-bg noise-overlay relative overflow-hidden">
      {particles.map(p => <Particle key={p.id} {...p} />)}

      <div className="absolute inset-0 opacity-[0.03]" style={{
        backgroundImage: `linear-gradient(rgba(34,211,238,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.5) 1px, transparent 1px)`,
        backgroundSize: '60px 60px',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.95 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
        className="relative z-10 w-full max-w-md mx-4"
      >
        {/* Logo */}
        <motion.div className="text-center mb-8" initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <motion.div
            className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-cyan-400 via-indigo-500 to-purple-500 shadow-2xl mb-4"
            animate={{ rotate: [0, -5, 5, 0] }}
            transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles size={30} className="text-white" />
          </motion.div>
          <h1 className="text-3xl font-bold text-white mb-1">Create account</h1>
          <p className="text-[var(--sb-text-muted)] text-sm">Start building schemas with AI</p>
        </motion.div>

        {/* Card */}
        <div className="glass-card p-8 shadow-2xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-red-500/10 border border-red-500/30 text-red-300 px-4 py-3 rounded-xl text-sm text-center"
              >{error}</motion.div>
            )}
            {success && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
                className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 px-4 py-3 rounded-xl text-sm text-center flex items-center justify-center gap-2"
              ><CheckCircle size={16} />{success}</motion.div>
            )}

            {/* Username */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--sb-text-muted)] uppercase tracking-wider">Username</label>
              <div className="gradient-border">
                <input id="register-username" type="text" required
                  className="w-full px-4 py-3 bg-[var(--sb-bg-card)] border border-[var(--sb-border)] rounded-2xl text-white placeholder-[var(--sb-text-muted)] focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                  placeholder="Choose a username" value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                />
              </div>
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--sb-text-muted)] uppercase tracking-wider">Email</label>
              <div className="gradient-border">
                <input id="register-email" type="email" required
                  className="w-full px-4 py-3 bg-[var(--sb-bg-card)] border border-[var(--sb-border)] rounded-2xl text-white placeholder-[var(--sb-text-muted)] focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                  placeholder="your@email.com" value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                />
              </div>
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-[var(--sb-text-muted)] uppercase tracking-wider">Password</label>
              <div className="gradient-border relative">
                <input id="register-password" type={showPassword ? 'text' : 'password'} required
                  className="w-full px-4 py-3 pr-12 bg-[var(--sb-bg-card)] border border-[var(--sb-border)] rounded-2xl text-white placeholder-[var(--sb-text-muted)] focus:outline-none focus:border-indigo-500/50 transition-all text-sm"
                  placeholder="Min. 6 characters" value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
                <button type="button" onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1.5 text-[var(--sb-text-muted)] hover:text-white transition-colors bg-transparent"
                >
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              {/* Password strength indicator */}
              {passwordStrength && (
                <div className="flex items-center gap-2 mt-1.5">
                  <div className="flex-1 h-1 rounded-full bg-white/10 overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: passwordStrength === 'strong' ? '100%' : passwordStrength === 'medium' ? '60%' : '30%' }}
                      className={`h-full rounded-full ${passwordStrength === 'strong' ? 'bg-emerald-400' : passwordStrength === 'medium' ? 'bg-amber-400' : 'bg-red-400'}`}
                    />
                  </div>
                  <span className={`text-[10px] font-medium ${passwordStrength === 'strong' ? 'text-emerald-400' : passwordStrength === 'medium' ? 'text-amber-400' : 'text-red-400'}`}>
                    {passwordStrength}
                  </span>
                </div>
              )}
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ scale: 1.01, y: -1 }}
              whileTap={{ scale: 0.98 }}
              type="submit" disabled={isLoading}
              id="register-submit"
              className="w-full flex items-center justify-center gap-2 py-3.5 px-4 rounded-2xl text-sm font-semibold text-white shadow-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              style={{ background: 'linear-gradient(135deg, #22d3ee 0%, #6366f1 100%)' }}
            >
              {isLoading ? <Loader className="animate-spin" size={18} /> : (<>Create Account<ArrowRight size={16} /></>)}
            </motion.button>

            <p className="text-center text-sm text-[var(--sb-text-muted)]">
              Already have an account?{' '}
              <Link to="/login" className="text-indigo-400 hover:text-indigo-300 font-medium transition-colors">Sign in</Link>
            </p>
          </form>
        </div>
      </motion.div>
    </div>
  );
};

export default RegisterForm;