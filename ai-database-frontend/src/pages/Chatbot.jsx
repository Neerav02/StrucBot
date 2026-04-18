import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Send, Bot, User, Trash2, CheckCircle, AlertTriangle, Copy, Check, Code, Database, ArrowDown } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';
import api from '../services/api';

// ---- Toast notification ----
const Toast = ({ message, type, onClear }) => {
  useEffect(() => {
    const timer = setTimeout(onClear, 4000);
    return () => clearTimeout(timer);
  }, [onClear]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 30, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: 10, scale: 0.95 }}
      className={`fixed bottom-5 right-5 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium shadow-2xl z-50 backdrop-blur-xl border ${
        type === 'success'
          ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
          : 'bg-red-500/15 border-red-500/30 text-red-300'
      }`}
    >
      {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      {message}
    </motion.div>
  );
};

// ---- Copy button ----
const CopyButton = ({ text, label = 'Copy' }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <button
      onClick={handleCopy}
      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-[var(--sb-text-secondary)] hover:text-white transition-all border border-[var(--sb-border)]"
    >
      {copied ? <><Check size={12} className="text-emerald-400" />Copied!</> : <><Copy size={12} />{label}</>}
    </button>
  );
};

// ---- Schema Card ----
const SchemaCard = ({ schema, onDelete, schemaId }) => {
  const [showSQL, setShowSQL] = useState(false);
  const [sqlCode, setSqlCode] = useState('');
  const [loadingSQL, setLoadingSQL] = useState(false);

  const handleViewSQL = async () => {
    if (showSQL) { setShowSQL(false); return; }
    setLoadingSQL(true);
    try {
      const res = await api.get(`/schemas/${schemaId}/sql`);
      setSqlCode(res.data.sql);
      setShowSQL(true);
    } catch {
      const cols = schema.columns.map(c => {
        const constraints = (c.constraints || []).join(' ');
        return `  ${c.name} ${c.data_type}${constraints ? ' ' + constraints : ''}`;
      });
      setSqlCode(`CREATE TABLE ${schema.table_name} (\n${cols.join(',\n')}\n);`);
      setShowSQL(true);
    } finally { setLoadingSQL(false); }
  };

  const schemaJSON = JSON.stringify({ table_name: schema.table_name, columns: schema.columns }, null, 2);

  return (
    <div className="w-full text-left space-y-3">
      <p className="text-sm text-[var(--sb-text-secondary)]">Here's your schema:</p>

      <div className="bg-[var(--sb-bg-primary)]/60 border border-[var(--sb-border)] rounded-xl overflow-hidden">
        <div className="flex items-center justify-between px-4 py-2.5 border-b border-[var(--sb-border)] bg-indigo-500/5">
          <div className="flex items-center gap-2">
            <Database size={14} className="text-indigo-400" />
            <span className="font-mono text-sm font-semibold text-indigo-300">{schema.table_name}</span>
          </div>
          <span className="text-[10px] text-[var(--sb-text-muted)] bg-white/5 px-2 py-0.5 rounded-full">
            {schema.columns.length} columns
          </span>
        </div>

        <div className="divide-y divide-[var(--sb-border)]">
          {schema.columns.map((col, idx) => (
            <motion.div
              key={idx}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: idx * 0.05 }}
              className="flex items-center justify-between px-4 py-2 text-xs font-mono hover:bg-white/[0.02] transition-colors"
            >
              <div className="flex items-center gap-2">
                <span className="text-[var(--sb-text-primary)]">{col.name}</span>
                {col.constraints && col.constraints.includes('PRIMARY KEY') && (
                  <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-sans font-bold uppercase">PK</span>
                )}
              </div>
              <div className="flex items-center gap-2">
                <span className="text-cyan-400">{col.data_type}</span>
                {col.constraints && col.constraints.filter(c => c !== 'PRIMARY KEY').map((c, i) => (
                  <span key={i} className="text-[8px] bg-white/5 text-[var(--sb-text-muted)] px-1.5 py-0.5 rounded font-sans">{c}</span>
                ))}
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <AnimatePresence>
        {showSQL && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} className="overflow-hidden">
            <div className="bg-[var(--sb-bg-primary)] border border-[var(--sb-border)] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--sb-border)]">
                <span className="text-[10px] text-[var(--sb-text-muted)] uppercase tracking-wider font-semibold">SQL (PostgreSQL)</span>
                <CopyButton text={sqlCode} label="Copy SQL" />
              </div>
              <pre className="px-4 py-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">{sqlCode}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-center gap-2">
        <button onClick={handleViewSQL} className="flex-1 flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl bg-indigo-500/10 hover:bg-indigo-500/20 text-indigo-300 border border-indigo-500/20 transition-all">
          <Code size={14} /> {showSQL ? 'Hide SQL' : 'View SQL'}
        </button>
        <CopyButton text={schemaJSON} label="Copy JSON" />
        <button onClick={() => onDelete(schemaId)} className="flex items-center justify-center gap-1.5 text-xs font-medium py-2 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 transition-all">
          <Trash2 size={14} /> Delete
        </button>
      </div>
    </div>
  );
};

// ---- Chat Message ----
const ChatMessage = ({ message, onDelete }) => {
  const { sender, type, content, id } = message;
  const isUser = sender === 'user';

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: 'easeOut' }}
      className={`flex items-start gap-3 ${isUser ? 'justify-end' : ''}`}
    >
      {!isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg mt-1">
          <Bot size={16} className="text-white" />
        </div>
      )}
      <div className={`max-w-[75%]`}>
        <div className={`px-4 py-3 rounded-2xl text-sm leading-relaxed ${
          isUser
            ? 'bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-br-md shadow-lg shadow-indigo-600/20'
            : 'bg-[var(--sb-bg-elevated)] border border-[var(--sb-border)] text-[var(--sb-text-primary)] rounded-bl-md'
        }`}>
          {type === 'text' && <p className="whitespace-pre-wrap">{content}</p>}
          {type === 'schema' && <SchemaCard schema={content} onDelete={onDelete} schemaId={id} />}
        </div>
      </div>
      {isUser && (
        <div className="flex-shrink-0 w-8 h-8 rounded-xl bg-[var(--sb-bg-elevated)] border border-[var(--sb-border)] flex items-center justify-center mt-1">
          <User size={14} className="text-[var(--sb-text-secondary)]" />
        </div>
      )}
    </motion.div>
  );
};

// ---- Chat Input ----
const ChatInput = ({ onSend, isLoading }) => {
  const [input, setInput] = useState('');
  const inputRef = useRef(null);

  const handleSend = () => {
    if (input.trim() && !isLoading) {
      onSend(input.trim());
      setInput('');
    }
  };

  const suggestions = [
    'Create a users table with email and role',
    'Design a products table for e-commerce',
    'Make an orders table with customer references',
  ];

  return (
    <div className="p-4 border-t border-[var(--sb-border)] bg-[var(--sb-bg-secondary)]/80 backdrop-blur-xl">
      {!input && !isLoading && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1">
          {suggestions.map((s, i) => (
            <button key={i} onClick={() => setInput(s)}
              className="flex-shrink-0 text-[11px] px-3 py-1.5 rounded-full bg-white/5 hover:bg-indigo-500/10 text-[var(--sb-text-muted)] hover:text-indigo-300 border border-[var(--sb-border)] hover:border-indigo-500/30 transition-all"
            >{s}</button>
          ))}
        </div>
      )}
      <div className="relative gradient-border">
        <input
          ref={inputRef} id="chat-input" type="text" value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
          placeholder="Describe your database schema..."
          className="w-full bg-[var(--sb-bg-card)] border border-[var(--sb-border)] rounded-2xl py-3.5 pl-4 pr-14 text-sm text-white placeholder-[var(--sb-text-muted)] focus:outline-none transition-all"
          disabled={isLoading}
        />
        <button onClick={handleSend} disabled={isLoading || !input.trim()} id="chat-send"
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2.5 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
          style={{ background: input.trim() ? 'var(--sb-gradient-accent)' : 'transparent' }}
        >
          {isLoading ? (
            <div className="flex gap-1">
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot" />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot" />
              <div className="w-1.5 h-1.5 bg-indigo-400 rounded-full typing-dot" />
            </div>
          ) : (
            <Send size={16} className={input.trim() ? 'text-white' : 'text-[var(--sb-text-muted)]'} />
          )}
        </button>
      </div>
    </div>
  );
};

// ---- MAIN CHATBOT PAGE ----
const Chatbot = () => {
  const [messages, setMessages] = useState([
    {
      sender: 'bot', type: 'text',
      content: "Welcome to StrucBot! 🤖 I'm your AI database architect.\n\nDescribe the database you need in plain English, and I'll generate a complete schema with proper data types, constraints, and keys.\n\nTry: \"Create a blog database with posts, authors, and comments\"",
      id: 'welcome',
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [notification, setNotification] = useState({ text: '', type: 'success' });
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  const handleScroll = (e) => {
    const { scrollTop, scrollHeight, clientHeight } = e.target;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const scrollToBottom = () => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Load existing schemas with their prompts
  useEffect(() => {
    const loadHistory = async () => {
      try {
        const response = await api.get('/schemas');
        const historyMessages = [];
        response.data.forEach(schema => {
          // Add the user's original prompt as a message
          if (schema.prompt) {
            historyMessages.push({
              sender: 'user', type: 'text',
              content: schema.prompt,
              id: `prompt-${schema.id}`,
            });
          }
          // Add the schema response
          historyMessages.push({
            sender: 'bot', type: 'schema',
            content: schema, id: schema.id,
          });
        });
        if (historyMessages.length > 0) {
          setMessages(prev => [prev[0], ...historyMessages]);
        }
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    };
    loadHistory();
  }, []);

  const handleSend = async (prompt) => {
    const userMessage = { sender: 'user', type: 'text', content: prompt, id: uuidv4() };
    setMessages(prev => [...prev, userMessage]);
    setIsLoading(true);
    try {
      const aiResponse = await api.post('/generate-schema', { prompt });
      setMessages(prev => [
        ...prev,
        { sender: 'bot', type: 'schema', content: aiResponse.data, id: aiResponse.data.id },
      ]);
      setNotification({ text: `Schema "${aiResponse.data.table_name}" generated!`, type: 'success' });
    } catch (error) {
      const errorMsg = error.response?.data?.error || 'Something went wrong. Please try again.';
      setMessages(prev => [
        ...prev,
        { sender: 'bot', type: 'text', content: `Sorry, I couldn't generate that schema.\n\n${errorMsg}`, id: uuidv4() },
      ]);
      setNotification({ text: 'Schema generation failed.', type: 'error' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/schemas/${id}`);
      // Remove both the schema and its prompt message
      setMessages(prev => prev.filter(msg => msg.id !== id && msg.id !== `prompt-${id}`));
      setNotification({ text: 'Schema deleted.', type: 'success' });
    } catch {
      setNotification({ text: 'Could not delete schema.', type: 'error' });
    }
  };

  return (
    <div className="h-full flex flex-col relative">
      {/* Header — no "Powered by" branding */}
      <div className="px-6 py-3.5 border-b border-[var(--sb-border)] flex items-center justify-between bg-[var(--sb-bg-secondary)]/60 backdrop-blur-xl">
        <div className="flex items-center gap-3">
          <div className="w-2 h-2 rounded-full bg-emerald-400 shadow-lg shadow-emerald-400/50" />
          <h2 className="text-sm font-semibold text-white">Schema Chat</h2>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-[var(--sb-text-muted)]">
          <span>AI-Powered Schema Generation</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 px-6 py-4 overflow-y-auto space-y-5" onScroll={handleScroll}>
        {messages.map((msg) => (
          <ChatMessage key={msg.id} message={msg} onDelete={handleDelete} />
        ))}
        <AnimatePresence>
          {isLoading && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg">
                <Bot size={16} className="text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-[var(--sb-bg-elevated)] border border-[var(--sb-border)]">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <div className="w-2 h-2 bg-indigo-400 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full typing-dot" />
                    <div className="w-2 h-2 bg-indigo-400 rounded-full typing-dot" />
                  </div>
                  <span className="text-xs text-[var(--sb-text-muted)] ml-1">Generating schema...</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={chatEndRef} />
      </div>

      <AnimatePresence>
        {showScrollBtn && (
          <motion.button initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }}
            onClick={scrollToBottom}
            className="absolute bottom-24 right-6 w-8 h-8 rounded-full bg-[var(--sb-bg-elevated)] border border-[var(--sb-border)] flex items-center justify-center text-[var(--sb-text-muted)] hover:text-white shadow-lg transition-colors"
          >
            <ArrowDown size={14} />
          </motion.button>
        )}
      </AnimatePresence>

      <ChatInput onSend={handleSend} isLoading={isLoading} />

      <AnimatePresence>
        {notification.text && (
          <Toast message={notification.text} type={notification.type} onClear={() => setNotification({ text: '', type: 'success' })} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Chatbot;