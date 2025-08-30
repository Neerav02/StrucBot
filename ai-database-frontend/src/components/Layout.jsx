import React from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuthStore } from '../stores/authStore';
import { Database, User, Settings, LogOut } from 'lucide-react';

const Layout = () => {
  const { logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const navItems = [
    { to: '/chatbot', icon: Database, label: 'Chatbot' },
    { to: '/profile', icon: User, label: 'Profile' },
    { to: '/settings', icon: Settings, label: 'Settings' },
  ];

  return (
    <div className="h-screen w-screen bg-gray-950 text-gray-200 flex overflow-hidden font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-gray-900 flex flex-col border-r border-gray-800 p-4">
        <div className="p-4 border-b border-gray-800 flex items-center gap-2">
          <Database className="text-indigo-400" size={28} />
          <h1 className="text-2xl font-bold text-white">Strucbot</h1>
        </div>
        <nav className="flex-1 mt-6 space-y-2">
          {navItems.map(item => (
            <NavLink
              key={item.label}
              to={item.to}
              className={({ isActive }) =>
                `flex items-center gap-3 p-3 rounded-lg transition-colors text-sm font-medium ${
                  isActive ? 'bg-indigo-600 text-white shadow-lg' : 'hover:bg-gray-800 text-gray-300'
                }`
              }
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        <div className="p-4 border-t border-gray-800">
          <button
            onClick={handleLogout}
            className="flex items-center gap-3 p-3 rounded-lg w-full text-left hover:bg-red-800/50 text-red-400 transition-colors text-sm font-medium"
          >
            <LogOut size={20} />
            <span>Logout</span>
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col bg-gray-900 overflow-y-auto">
        <Outlet />
      </main>
    </div>
  );
};

export default Layout;