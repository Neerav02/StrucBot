import React, { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Pencil, GitBranch, Layers, User, Settings, LogOut, ChevronLeft, ChevronRight, Sparkles } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/chatbot', icon: Database, label: 'Schema Chat' },
    { to: '/editor', icon: Pencil, label: 'Schema Editor' },
    { to: '/diagram', icon: GitBranch, label: 'ER Diagram' },
    { to: '/templates', icon: Layers, label: 'Templates' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-mesh noise-overlay">
      {/* Sidebar */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex flex-col border-r border-[var(--sb-border)] bg-[var(--sb-bg-secondary)] z-10"
        style={{ minWidth: collapsed ? 72 : 260 }}
      >
        {/* Logo */}
        <div className="p-4 flex items-center gap-3 border-b border-[var(--sb-border)] h-[68px]">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-cyan-400 flex items-center justify-center flex-shrink-0 shadow-lg">
            <Sparkles size={20} className="text-white" />
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-lg font-bold text-white tracking-tight">StrucBot</h1>
                <p className="text-[10px] text-[var(--sb-text-muted)] -mt-0.5 font-medium uppercase tracking-widest">AI Schema Engine</p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1 mt-2">
          {navItems.map((item, idx) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-indigo-600/20 to-indigo-600/5 text-white border border-indigo-500/30'
                    : 'text-[var(--sb-text-secondary)] hover:text-white hover:bg-white/5'
                }`
              }
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="activeTab"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-indigo-400"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon size={20} className={`flex-shrink-0 ${isActive ? 'text-indigo-400' : 'group-hover:text-indigo-300'}`} />
                  <AnimatePresence>
                    {!collapsed && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[var(--sb-bg-elevated)] border border-[var(--sb-border)] flex items-center justify-center text-[var(--sb-text-muted)] hover:text-white hover:border-indigo-500/50 transition-all z-20 shadow-md"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>

        {/* User section */}
        <div className="p-3 border-t border-[var(--sb-border)]">
          {/* User info */}
          <div className={`flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-white/[0.03] ${collapsed ? 'justify-center' : ''}`}>
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
              {user?.username?.charAt(0).toUpperCase() || 'U'}
            </div>
            <AnimatePresence>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="overflow-hidden"
                >
                  <p className="text-sm font-medium text-white truncate">{user?.username || 'User'}</p>
                  <p className="text-[10px] text-[var(--sb-text-muted)] truncate">{user?.email || ''}</p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
          
          {/* Logout */}
          <button
            onClick={handleLogout}
            className={`flex items-center gap-3 px-3 py-2 rounded-xl w-full text-left text-[var(--sb-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all text-sm ${collapsed ? 'justify-center' : ''}`}
          >
            <LogOut size={18} className="flex-shrink-0" />
            <AnimatePresence>
              {!collapsed && (
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                >
                  Logout
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </motion.aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-[1]">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;