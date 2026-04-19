import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Edit3, Save, Loader, CheckCircle, Shield, Calendar, Database } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

const StatCard = ({ icon: Icon, label, value, color }) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    className="bg-[var(--sb-bg-card)] border border-[var(--sb-border)] rounded-2xl p-5 flex items-center gap-4 hover:border-[var(--sb-border-hover)] transition-all"
  >
    <div className={`w-11 h-11 rounded-xl flex items-center justify-center ${color}`}>
      <Icon size={20} />
    </div>
    <div>
      <p className="text-xs text-[var(--sb-text-muted)] font-medium uppercase tracking-wider">{label}</p>
      <p className="text-lg font-bold text-white mt-0.5">{value}</p>
    </div>
  </motion.div>
);

const Profile = () => {
  const { user, setUser } = useAuthStore();
  const [formData, setFormData] = useState({ username: '', email: '' });
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });
  const [schemaCount, setSchemaCount] = useState(0);

  useEffect(() => {
    if (user) {
      setFormData({ username: user.username, email: user.email });
    }
  }, [user]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        const res = await api.get('/schemas');
        setSchemaCount(res.data.length);
      } catch {}
    };
    loadStats();
  }, []);

  useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => setMessage({ text: '', type: '' }), 3000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setMessage({ text: '', type: '' });
    try {
      const response = await api.put('/auth/profile', formData);
      setUser(response.data.user);
      setMessage({ text: 'Profile updated successfully!', type: 'success' });
      setIsEditing(false);
    } catch (error) {
      setMessage({ text: error.response?.data?.error || 'Failed to update profile.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  if (!user) return (
    <div className="flex-1 flex items-center justify-center">
      <Loader className="animate-spin text-amber-400" size={24} />
    </div>
  );

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-4 md:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-xl md:text-2xl font-bold text-white">Profile</h1>
          <p className="text-sm text-[var(--sb-text-muted)] mt-1">Manage your account information</p>
        </motion.div>

        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4 md:p-6"
        >
          <form onSubmit={handleUpdate}>
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-6 gap-4">
              <div className="flex items-center gap-4">
                {/* Avatar */}
                <div className="relative">
                  <div className="w-12 h-12 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-amber-500 via-purple-500 to-cyan-400 flex items-center justify-center text-xl md:text-2xl font-bold text-white shadow-lg">
                    {user.username.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-emerald-400 border-2 border-[var(--sb-bg-card)] flex items-center justify-center">
                    <CheckCircle size={10} className="text-white" />
                  </div>
                </div>
                <div>
                  <h2 className="text-lg md:text-xl font-bold text-white">{user.username}</h2>
                  <p className="text-sm text-[var(--sb-text-muted)]">{user.email}</p>
                  <span className="inline-flex items-center gap-1 mt-1 text-[10px] font-semibold uppercase tracking-wider text-amber-300 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                    <Shield size={10} />
                    {user.role}
                  </span>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsEditing(!isEditing); if (isEditing) setFormData({ username: user.username, email: user.email }); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all bg-white/5 hover:bg-white/10 text-[var(--sb-text-secondary)] hover:text-white border border-[var(--sb-border)]"
              >
                <Edit3 size={14} /> {isEditing ? 'Cancel' : 'Edit'}
              </button>
            </div>

            {/* Success / Error message */}
            <AnimatePresence>
              {message.text && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className={`mb-4 px-4 py-3 rounded-xl text-sm text-center flex items-center justify-center gap-2 ${
                    message.type === 'success'
                      ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                      : 'bg-red-500/10 border border-red-500/30 text-red-300'
                  }`}
                >
                  <CheckCircle size={14} />
                  {message.text}
                </motion.div>
              )}
            </AnimatePresence>

            {/* Edit form */}
            <AnimatePresence>
              {isEditing && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="space-y-4 overflow-hidden"
                >
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--sb-text-muted)] uppercase tracking-wider">Username</label>
                    <div className="relative">
                      <User className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--sb-text-muted)]" size={16} />
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData({ ...formData, username: e.target.value })}
                        className="w-full bg-[var(--sb-bg-primary)] border border-[var(--sb-border)] rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-medium text-[var(--sb-text-muted)] uppercase tracking-wider">Email</label>
                    <div className="relative">
                      <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-[var(--sb-text-muted)]" size={16} />
                      <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full bg-[var(--sb-bg-primary)] border border-[var(--sb-border)] rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-amber-500/50 transition-all"
                      />
                    </div>
                  </div>
                  <motion.button
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    type="submit"
                    disabled={isLoading}
                    className="w-full flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white disabled:opacity-50 transition-all"
                    style={{ background: 'var(--sb-gradient-accent)' }}
                  >
                    {isLoading ? <Loader className="animate-spin" size={16} /> : <Save size={16} />}
                    Save Changes
                  </motion.button>
                </motion.div>
              )}
            </AnimatePresence>
          </form>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          <StatCard icon={Database} label="Schemas Created" value={schemaCount} color="bg-amber-500/15 text-amber-400" />
          <StatCard icon={Shield} label="Account Type" value={user.role === 'admin' ? 'Admin' : 'Free'} color="bg-cyan-500/15 text-amber-400/80" />
          <StatCard icon={Calendar} label="Member Since" value="Today" color="bg-purple-500/15 text-purple-400" />
        </div>
      </div>
    </div>
  );
};

export default Profile;
