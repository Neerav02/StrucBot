import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { User, Mail, Edit, Save, Loader, CheckCircle } from 'lucide-react';
import { useAuthStore } from '../stores/authStore';
import api from '../services/api';

const Profile = () => {
    const { user, setUser } = useAuthStore();
    const [formData, setFormData] = useState({ username: '', email: '' });
    const [isEditing, setIsEditing] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [message, setMessage] = useState('');

    useEffect(() => {
        if (user) {
            setFormData({ username: user.username, email: user.email });
        }
    }, [user]);

    useEffect(() => {
        if (message) {
            const timer = setTimeout(() => setMessage(''), 3000);
            return () => clearTimeout(timer);
        }
    }, [message]);

    const handleUpdate = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        setMessage('');
        try {
            const response = await api.put('/auth/profile', formData);
            setUser(response.data.user);
            setMessage('Profile updated successfully!');
            setIsEditing(false);
        } catch (error) {
            setMessage(error.response?.data?.error || 'Failed to update profile.');
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!user) return <div className="p-8 text-center">Loading profile...</div>

    return (
        <div className="p-8">
            <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
                <h1 className="text-3xl font-bold text-white mb-8">Your Profile</h1>
            </motion.div>
            
            <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="max-w-2xl mx-auto bg-gray-900 border border-gray-800 rounded-2xl p-8 shadow-2xl"
            >
                <form onSubmit={handleUpdate}>
                    <div className="flex items-center justify-between mb-6">
                        <div className="flex items-center gap-4">
                            <div className="w-20 h-20 bg-indigo-600 rounded-full flex items-center justify-center text-4xl font-bold">
                                {user.username.charAt(0).toUpperCase()}
                            </div>
                            <div>
                                <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                                <p className="text-gray-400">{user.email}</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2 px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm font-medium transition-colors">
                            <Edit size={16} /> {isEditing ? 'Cancel' : 'Edit Profile'}
                        </button>
                    </div>

                    {message && <p className="text-center text-sm mb-4 text-green-400 flex items-center justify-center gap-2"><CheckCircle size={16}/>{message}</p>}

                    {isEditing && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="space-y-6 overflow-hidden">
                             <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input type="text" value={formData.username} onChange={(e) => setFormData({...formData, username: e.target.value})} className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                                <input type="email" value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})} className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg py-3 pl-12 pr-4 text-white focus:outline-none focus:ring-2 focus:ring-indigo-500"/>
                            </div>
                            <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }} type="submit" disabled={isLoading} className="w-full flex justify-center items-center gap-2 py-3 px-4 bg-indigo-600 hover:bg-indigo-700 rounded-lg font-medium transition-colors disabled:opacity-50">
                                {isLoading ? <Loader className="animate-spin" size={20}/> : <Save size={20} />} Save Changes
                            </motion.button>
                        </motion.div>
                    )}
                </form>
            </motion.div>
        </div>
    );
};

export default Profile;
