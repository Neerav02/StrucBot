import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { useProjectStore } from '../stores/projectStore';
import api from '../services/api';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Pencil, GitBranch, Layers, User, Settings, LogOut, ChevronLeft, ChevronRight, Flame, Plus, ChevronDown, LogIn, Menu, X } from 'lucide-react';

const Layout = () => {
  const { user, logout } = useAuthStore();
  const { projects, setProjects, activeProject, setActiveProject, addProject } = useProjectStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileOpen(false);
  }, [location.pathname]);

  // Lock body scroll when mobile sidebar is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [mobileOpen]);

  React.useEffect(() => {
    const fetchProjects = async () => {
      try {
        const res = await api.get('/projects');
        setProjects(res.data);
        if (res.data.length > 0 && !activeProject) {
          setActiveProject(res.data[0]);
        }
      } catch (err) {
        console.error('Failed to load projects', err);
      }
    };
    if (user) fetchProjects();
  }, [user, setProjects, activeProject, setActiveProject]);

  const handleCreateProject = async () => {
    const name = window.prompt('Enter new workspace name:');
    if (!name || !name.trim()) return;
    try {
      const res = await api.post('/projects', { name: name.trim() });
      addProject(res.data);
      setActiveProject(res.data);
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to create workspace');
    }
  };

  const handleLogout = () => {
    logout();
    setProjects([]);
    setActiveProject(null);
    navigate('/login');
  };

  const navItems = [
    { to: '/chatbot', icon: Database, label: 'Schema Chat', public: true },
    { to: '/editor', icon: Pencil, label: 'Schema Editor', public: false },
    { to: '/diagram', icon: GitBranch, label: 'ER Diagram', public: false },
    { to: '/templates', icon: Layers, label: 'Templates', public: false },
    { to: '/profile', icon: User, label: 'Profile', public: false },
    { to: '/settings', icon: Settings, label: 'Settings', public: false },
  ];

  const visibleNavItems = user ? navItems : navItems.filter(item => item.public);

  // Sidebar content — shared between mobile & desktop
  const SidebarContent = ({ isMobile = false }) => {
    const showLabels = isMobile ? true : !collapsed;

    return (
      <>
        {/* Logo — Neural Ember Branding */}
        <div className="p-4 flex items-center gap-3 border-b border-[var(--sb-border)] h-[68px]">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg"
            style={{ background: 'linear-gradient(135deg, #d4a017, #dc2626)', boxShadow: '0 0 20px rgba(212,160,23,0.3)' }}
          >
            <Flame size={20} className="text-white" />
          </div>
          <AnimatePresence>
            {showLabels && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
              >
                <h1 className="text-lg font-bold tracking-tight gradient-text-gold">StrucBot</h1>
                <p className="text-[10px] text-[var(--sb-text-muted)] -mt-0.5 font-medium uppercase tracking-widest">Neural Schema AI</p>
              </motion.div>
            )}
          </AnimatePresence>
          {/* Mobile close button */}
          {isMobile && (
            <button
              onClick={() => setMobileOpen(false)}
              className="ml-auto p-1.5 rounded-lg text-[var(--sb-text-muted)] hover:text-white hover:bg-white/10 transition-all"
            >
              <X size={20} />
            </button>
          )}
        </div>

        {/* Workspace / Projects Selector — only when logged in */}
        {user && (
        <div className="px-4 py-3 border-b border-[var(--sb-border)] relative">
          <div className={`flex items-center justify-between text-[10px] font-bold text-[var(--sb-text-muted)] tracking-widest uppercase mb-1.5 ${!showLabels ? 'justify-center mx-auto' : ''}`}>
            {showLabels && <span>Workspace</span>}
            <button onClick={handleCreateProject} title="New Workspace" className="hover:text-amber-400 transition-colors p-0.5">
              <Plus size={12} />
            </button>
          </div>
          {showLabels && (
            <div className="relative">
              <select
                value={activeProject?.id || ''}
                onChange={(e) => {
                  const proj = projects.find(p => p.id === parseInt(e.target.value));
                  if (proj) setActiveProject(proj);
                }}
                className="w-full bg-[var(--sb-bg-elevated)] border border-[var(--sb-border)] rounded-lg text-xs text-white font-medium px-2.5 py-1.5 focus:outline-none focus:border-amber-500/50 cursor-pointer appearance-none shadow-inner"
              >
                {projects.length === 0 && <option value="">Default Workspace</option>}
                {projects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
              <ChevronDown size={12} className="absolute right-2.5 top-[8px] text-[var(--sb-text-muted)] pointer-events-none" />
            </div>
          )}
        </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 p-3 space-y-1 mt-2 overflow-y-auto">
          {visibleNavItems.map((item, idx) => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `group flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 text-sm font-medium relative overflow-hidden ${
                  isActive
                    ? 'bg-gradient-to-r from-amber-600/20 to-amber-600/5 text-white border border-amber-500/25'
                    : 'text-[var(--sb-text-secondary)] hover:text-white hover:bg-white/5'
                }`
              }
              style={{ animationDelay: `${idx * 50}ms` }}
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId={isMobile ? "activeTabMobile" : "activeTab"}
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full"
                      style={{ background: 'linear-gradient(180deg, #d4a017, #dc2626)' }}
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <item.icon size={20} className={`flex-shrink-0 ${isActive ? 'text-amber-400' : 'group-hover:text-amber-300'}`} />
                  <AnimatePresence>
                    {showLabels && (
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

        {/* User section */}
        <div className="p-3 border-t border-[var(--sb-border)]">
          {user ? (
            <>
              <div className={`flex items-center gap-3 px-3 py-2 mb-2 rounded-xl bg-white/[0.03] ${!showLabels ? 'justify-center' : ''}`}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white flex-shrink-0"
                  style={{ background: 'linear-gradient(135deg, #d4a017, #dc2626)' }}
                >
                  {user?.username?.charAt(0).toUpperCase() || 'U'}
                </div>
                <AnimatePresence>
                  {showLabels && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="overflow-hidden min-w-0"
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
                className={`flex items-center gap-3 px-3 py-2 rounded-xl w-full text-left text-[var(--sb-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all text-sm ${!showLabels ? 'justify-center' : ''}`}
              >
                <LogOut size={18} className="flex-shrink-0" />
                <AnimatePresence>
                  {showLabels && (
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
            </>
          ) : (
            <div className="space-y-2">
              <button
                onClick={() => navigate('/login')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left text-sm font-medium text-white transition-all hover:opacity-90 ${!showLabels ? 'justify-center' : ''}`}
                style={{ background: 'var(--sb-gradient-accent)' }}
              >
                <LogIn size={18} className="flex-shrink-0" />
                <AnimatePresence>
                  {showLabels && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Sign in
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
              <button
                onClick={() => navigate('/register')}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl w-full text-left text-sm font-medium text-[var(--sb-text-secondary)] hover:text-white hover:bg-white/5 border border-[var(--sb-border)] transition-all ${!showLabels ? 'justify-center' : ''}`}
              >
                <User size={18} className="flex-shrink-0" />
                <AnimatePresence>
                  {showLabels && (
                    <motion.span initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                      Create account
                    </motion.span>
                  )}
                </AnimatePresence>
              </button>
            </div>
          )}
        </div>
      </>
    );
  };

  return (
    <div className="h-screen w-screen flex overflow-hidden bg-mesh noise-overlay">
      {/* ===== MOBILE TOP BAR (visible only on small screens) ===== */}
      <div className="fixed top-0 left-0 right-0 h-14 bg-[var(--sb-bg-secondary)]/95 backdrop-blur-xl border-b border-[var(--sb-border)] flex items-center justify-between px-4 z-30 md:hidden">
        <button
          onClick={() => setMobileOpen(true)}
          className="p-2 rounded-xl text-[var(--sb-text-secondary)] hover:text-white hover:bg-white/10 transition-all"
        >
          <Menu size={22} />
        </button>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #d4a017, #dc2626)' }}
          >
            <Flame size={16} className="text-white" />
          </div>
          <span className="text-sm font-bold gradient-text-gold">StrucBot</span>
        </div>
        <div className="w-10" /> {/* Spacer for centering */}
      </div>

      {/* ===== MOBILE SIDEBAR OVERLAY ===== */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40 md:hidden"
            />
            {/* Slide-in sidebar */}
            <motion.aside
              initial={{ x: -280 }}
              animate={{ x: 0 }}
              exit={{ x: -280 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
              className="fixed top-0 left-0 bottom-0 w-[280px] flex flex-col bg-[var(--sb-bg-secondary)] border-r border-[var(--sb-border)] z-50 md:hidden"
            >
              <SidebarContent isMobile={true} />
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* ===== DESKTOP SIDEBAR (hidden on mobile) ===== */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 260 }}
        transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
        className="relative flex-col border-r border-[var(--sb-border)] bg-[var(--sb-bg-secondary)] z-10 hidden md:flex"
        style={{ minWidth: collapsed ? 72 : 260 }}
      >
        <SidebarContent isMobile={false} />

        {/* Collapse toggle */}
        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-[var(--sb-bg-elevated)] border border-[var(--sb-border)] flex items-center justify-center text-[var(--sb-text-muted)] hover:text-white hover:border-amber-500/50 transition-all z-20 shadow-md"
        >
          {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
        </button>
      </motion.aside>

      {/* Ember background orbs */}
      <div className="ember-orb ember-orb-gold w-64 h-64 -top-20 -right-20 hidden md:block" />
      <div className="ember-orb ember-orb-crimson w-48 h-48 bottom-10 left-1/2 hidden md:block" style={{ animationDelay: '2s' }} />

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative z-[1] pt-14 md:pt-0">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;