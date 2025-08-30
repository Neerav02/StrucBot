import React from 'react';
import { motion } from 'framer-motion';
import { Bell, Shield, Palette } from 'lucide-react';

const Settings = () => {
    // Dummy state for settings
    const [settings, setSettings] = React.useState({
        notifications: true,
        twoFactorAuth: false,
        theme: 'dark'
    });
    
    const handleToggle = (key) => {
        setSettings(prev => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <div className="p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white mb-8">Application Settings</h1>
            </motion.div>

            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl shadow-2xl divide-y divide-gray-800"
            >
                {/* Notifications Setting */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Bell className="text-indigo-400" size={24}/>
                        <div>
                            <h3 className="font-semibold text-white">Email Notifications</h3>
                            <p className="text-sm text-gray-400">Receive updates and alerts in your inbox.</p>
                        </div>
                    </div>
                    <button onClick={() => handleToggle('notifications')} className={`w-12 h-6 rounded-full flex items-center transition-colors ${settings.notifications ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                        <motion.div layout className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${settings.notifications ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>
                
                {/* Security Setting */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Shield className="text-indigo-400" size={24}/>
                        <div>
                            <h3 className="font-semibold text-white">Two-Factor Authentication</h3>
                            <p className="text-sm text-gray-400">Add an extra layer of security to your account.</p>
                        </div>
                    </div>
                     <button onClick={() => handleToggle('twoFactorAuth')} className={`w-12 h-6 rounded-full flex items-center transition-colors ${settings.twoFactorAuth ? 'bg-indigo-600' : 'bg-gray-700'}`}>
                        <motion.div layout className={`w-5 h-5 bg-white rounded-full shadow-lg transform transition-transform ${settings.twoFactorAuth ? 'translate-x-6' : 'translate-x-1'}`}/>
                    </button>
                </div>
                
                {/* Theme Setting */}
                <div className="p-6 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                         <Palette className="text-indigo-400" size={24}/>
                        <div>
                            <h3 className="font-semibold text-white">Theme</h3>
                            <p className="text-sm text-gray-400">Current theme: Dark Mode</p>
                        </div>
                    </div>
                    <p className="text-sm font-medium text-gray-500">Light mode coming soon</p>
                </div>
            </motion.div>
        </div>
    );
};

export default Settings;