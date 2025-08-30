import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, CornerDownLeft, Eye, Edit, Trash2, CheckCircle, AlertTriangle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import api from '../services/api';

// --- Reusable UI Components specific to this page ---
const ChatMessage = ({ message, onAction }) => {
  const { sender, type, content, id } = message;
  const isUser = sender === 'user';
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: "easeOut" }} className={`flex items-start gap-4 my-6 ${isUser ? 'justify-end' : ''}`}>
      {!isUser && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white shadow-lg"><Bot size={24} /></div>}
      <div className={`max-w-2xl p-4 rounded-xl shadow-md ${isUser ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-800 text-gray-200 rounded-bl-none'}`}>
        {type === 'text' && <p className="whitespace-pre-wrap">{content}</p>}
        {type === 'schema' && <SchemaCard schema={content} onAction={onAction} id={id} />}
      </div>
      {isUser && <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gray-700 flex items-center justify-center text-white shadow-lg"><User size={24} /></div>}
    </motion.div>
  );
};

const SchemaCard = ({ schema, onAction, id }) => (
  <div className="w-full text-left">
    <p className="mb-3 text-gray-300">I've created a schema for you:</p>
    <div className="bg-gray-900/50 border border-gray-700 rounded-lg p-4">
      <h3 className="font-bold text-lg text-indigo-400 mb-2">{schema.table_name}</h3>
      <div className="space-y-2">
        {schema.columns.map((col, index) => (
          <div key={index} className="flex justify-between items-center text-sm font-mono border-b border-gray-700/50 pb-1 last:border-b-0">
            <span className="text-gray-300">{col.name}</span><span className="text-cyan-400">{col.data_type}</span>
          </div>
        ))}
      </div>
    </div>
    <div className="flex items-center gap-2 mt-4">
      <button onClick={() => alert("View functionality not implemented yet.")} className="flex-1 text-sm bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-2"><Eye size={16}/> View</button>
      <button onClick={() => alert("Edit functionality not implemented yet.")} className="flex-1 text-sm bg-gray-700 hover:bg-gray-600 text-white py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-2"><Edit size={16}/> Edit</button>
      <button onClick={() => onAction('delete', id)} className="flex-1 text-sm bg-red-600 hover:bg-red-500 text-white py-2 px-3 rounded-md transition-colors flex items-center justify-center gap-2"><Trash2 size={16}/> Delete</button>
    </div>
  </div>
);

const ChatInput = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const handleSend = () => { if (input.trim()) { onSend(input); setInput(''); } };
  return (
    <div className="p-4 bg-gray-900 border-t border-gray-800">
      <div className="relative">
        <input type="text" value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && handleSend()} placeholder="Ask Strucbot to create a database..." className="w-full bg-gray-800 border-2 border-gray-700 rounded-lg py-3 pl-4 pr-12 text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-colors" disabled={isLoading} />
        <button onClick={handleSend} disabled={isLoading} className="absolute right-3 top-1/2 -translate-y-1/2 p-2 bg-indigo-600 text-white rounded-md hover:bg-indigo-500 transition-colors disabled:bg-gray-600 disabled:cursor-not-allowed">
          {isLoading ? <CornerDownLeft size={20} className="animate-ping"/> : <Send size={20} />}
        </button>
      </div>
    </div>
  );
};

const MessageBox = ({ message, type, onClear }) => {
    useEffect(() => {
        const timer = setTimeout(() => onClear(), 4000);
        return () => clearTimeout(timer);
    }, [onClear]);
    
    const icon = type === 'success' ? <CheckCircle className="w-6 h-6 mr-3 text-green-300" /> : <AlertTriangle className="w-6 h-6 mr-3 text-red-300" />;
    const bgColor = type === 'success' ? 'bg-green-500/20 border-green-500' : 'bg-red-500/20 border-red-500';

    return (
        <motion.div initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }} className={`fixed bottom-5 right-5 flex items-center p-4 rounded-lg text-white shadow-lg max-w-sm z-50 border ${bgColor}`}>
            {icon}
            <span className="font-medium text-sm">{message}</span>
        </motion.div>
    );
};

// --- MAIN CHATBOT PAGE ---
const Chatbot = () => {
  const [messages, setMessages] = useState([{ sender: 'bot', type: 'text', content: 'Welcome! I can help you create database schemas. Try asking: "Create a table for users".'}]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ text: '', type: 'success' });
  const chatEndRef = useRef(null);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);
  
  useEffect(() => {
    const loadHistory = async () => {
        try {
            const response = await api.get('/schemas');
            // Transform the backend schema object to match the frontend message structure
            const historyMessages = response.data.map(schema => ({ 
                sender: 'bot', 
                type: 'schema', 
                content: schema, // The whole schema object is the content
                id: schema.id 
            }));
            if (historyMessages.length > 0) setMessages(prev => [prev[0], ...historyMessages]);
        } catch (error) { console.error("Failed to load schema history:", error); }
    };
    loadHistory();
  }, []);

  const handleSend = async (prompt) => {
    const userMessage = { sender: 'user', type: 'text', content: prompt, id: uuidv4() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    try {
        const aiResponse = await api.post('/generate-schema', { prompt });
        setMessages(prev => [...prev, { sender: 'bot', type: 'schema', content: aiResponse.data, id: aiResponse.data.id }]);
        setNotification({ text: 'Schema generated successfully!', type: 'success' });
    } catch (error) {
        setMessages(prev => [...prev, { sender: 'bot', type: 'text', content: `Sorry, an error occurred: ${error.response?.data?.error || 'Please try again.'}`, id: uuidv4() }]);
        setNotification({ text: 'Failed to generate schema.', type: 'error' });
    } finally { setIsLoading(false); }
  };

  const handleAction = async (action, id) => {
    if (action === 'delete') {
      try {
        await api.delete(`/schemas/${id}`);
        setMessages(prev => prev.filter(msg => msg.id !== id));
        setNotification({ text: 'Schema deleted.', type: 'success' });
      } catch (error) {
        console.error("Failed to delete schema:", error);
        setNotification({ text: 'Could not delete schema.', type: 'error' });
      }
    }
  };

  return (
    <div className="h-full flex flex-col relative">
        <div className="p-4 border-b border-gray-800 text-center">
            <h2 className="text-xl font-semibold">AI Schema Chat</h2>
        </div>
        <div className="flex-1 p-6 overflow-y-auto">
          {messages.map((msg, index) => <ChatMessage key={msg.id || index} message={msg} onAction={handleAction} />)}
          <AnimatePresence>
            {isLoading && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex items-center gap-4 my-6">
                <div className="flex-shrink-0 w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center text-white"><Bot size={24} /></div>
                <div className="p-4 bg-gray-800 rounded-xl"><div className="flex items-center gap-2 text-gray-400">
                    <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity }} />
                    <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.2 }} />
                    <motion.div className="w-2 h-2 bg-gray-400 rounded-full" animate={{ scale: [1, 1.2, 1], opacity: [0.5, 1, 0.5] }} transition={{ duration: 1, repeat: Infinity, delay: 0.4 }} />
                </div></div>
              </motion.div>
            )}
          </AnimatePresence>
          <div ref={chatEndRef} />
        </div>
        <ChatInput onSend={handleSend} isLoading={isLoading} />
         <AnimatePresence>
            {notification.text && <MessageBox message={notification.text} type={notification.type} onClear={() => setNotification({ text: '', type: 'success' })} />}
        </AnimatePresence>
    </div>
  );
};

export default Chatbot;