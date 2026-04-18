import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Palette, Monitor, Moon, Sun, Info, ChevronRight, Zap } from 'lucide-react';

const SettingToggle = ({ enabled, onToggle }) => (
  <button
    onClick={onToggle}
    className={`relative w-11 h-6 rounded-full transition-all duration-300 ${
      enabled ? 'bg-indigo-600 shadow-lg shadow-indigo-600/30' : 'bg-white/10'
    }`}
  >
    <motion.div
      layout
      transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow-md ${
        enabled ? 'left-[22px]' : 'left-0.5'
      }`}
    />
  </button>
);

const SettingRow = ({ icon: Icon, title, description, children, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, x: -10 }}
    animate={{ opacity: 1, x: 0 }}
    transition={{ delay }}
    className="flex items-center justify-between p-5 hover:bg-white/[0.02] transition-colors"
  >
    <div className="flex items-center gap-4">
      <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
        <Icon size={18} className="text-indigo-400" />
      </div>
      <div>
        <h3 className="text-sm font-semibold text-white">{title}</h3>
        <p className="text-xs text-[var(--sb-text-muted)] mt-0.5 max-w-xs">{description}</p>
      </div>
    </div>
    {children}
  </motion.div>
);

const Settings = () => {
  const [settings, setSettings] = useState({
    notifications: true,
    twoFactorAuth: false,
    theme: 'dark',
    aiModel: 'gemini-1.5-flash',
  });

  const handleToggle = (key) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  const themes = [
    { value: 'dark', icon: Moon, label: 'Dark' },
    { value: 'system', icon: Monitor, label: 'System' },
    { value: 'light', icon: Sun, label: 'Light' },
  ];

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-3xl mx-auto p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Settings</h1>
          <p className="text-sm text-[var(--sb-text-muted)] mt-1">Customize your StrucBot experience</p>
        </motion.div>

        {/* General Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-[var(--sb-border)]">
            <h2 className="text-xs font-semibold text-[var(--sb-text-muted)] uppercase tracking-wider">General</h2>
          </div>

          <div className="divide-y divide-[var(--sb-border)]">
            <SettingRow
              icon={Bell}
              title="Email Notifications"
              description="Receive updates and alerts in your inbox"
              delay={0.1}
            >
              <SettingToggle enabled={settings.notifications} onToggle={() => handleToggle('notifications')} />
            </SettingRow>

            <SettingRow
              icon={Shield}
              title="Two-Factor Authentication"
              description="Add an extra layer of security"
              delay={0.15}
            >
              <SettingToggle enabled={settings.twoFactorAuth} onToggle={() => handleToggle('twoFactorAuth')} />
            </SettingRow>
          </div>
        </motion.div>

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-[var(--sb-border)]">
            <h2 className="text-xs font-semibold text-[var(--sb-text-muted)] uppercase tracking-wider">Appearance</h2>
          </div>

          <div className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Palette size={18} className="text-indigo-400" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-white">Theme</h3>
                <p className="text-xs text-[var(--sb-text-muted)]">Select your preferred appearance</p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3 ml-14">
              {themes.map(t => (
                <button
                  key={t.value}
                  onClick={() => setSettings(prev => ({ ...prev, theme: t.value }))}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border transition-all ${
                    settings.theme === t.value
                      ? 'border-indigo-500/50 bg-indigo-500/10 text-indigo-300'
                      : 'border-[var(--sb-border)] bg-white/[0.02] text-[var(--sb-text-muted)] hover:bg-white/5'
                  }`}
                >
                  <t.icon size={20} />
                  <span className="text-xs font-medium">{t.label}</span>
                  {settings.theme === t.value && (
                    <motion.div layoutId="theme-active" className="w-1.5 h-1.5 rounded-full bg-indigo-400" />
                  )}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* AI Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="glass-card overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-[var(--sb-border)]">
            <h2 className="text-xs font-semibold text-[var(--sb-text-muted)] uppercase tracking-wider">AI Engine</h2>
          </div>

          <SettingRow
            icon={Zap}
            title="AI Model"
            description="Current model powering schema generation"
            delay={0.25}
          >
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/20">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
              <span className="text-xs font-mono font-medium text-emerald-300">llama-3.3-70b</span>
            </div>
          </SettingRow>
        </motion.div>

        {/* About */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="glass-card overflow-hidden"
        >
          <div className="px-5 py-3 border-b border-[var(--sb-border)]">
            <h2 className="text-xs font-semibold text-[var(--sb-text-muted)] uppercase tracking-wider">About</h2>
          </div>
          <div className="divide-y divide-[var(--sb-border)]">
            <SettingRow icon={Info} title="Version" description="Current application version" delay={0.3}>
              <span className="text-xs font-mono text-[var(--sb-text-muted)] bg-white/5 px-2.5 py-1 rounded-lg">v1.0.0</span>
            </SettingRow>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Settings;