import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import {
  ShoppingCart, FileText, Users, Phone, CreditCard, Loader,
  CheckCircle, AlertTriangle, Database, ArrowRight, Layers
} from 'lucide-react';
import api from '../services/api';
import { useProjectStore } from '../stores/projectStore';

const CATEGORY_ICONS = {
  'E-Commerce': ShoppingCart,
  'Blog': FileText,
  'Auth': Users,
  'CRM': Phone,
  'SaaS': CreditCard,
};

const CATEGORY_COLORS = {
  'E-Commerce': { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-300' },
  'Blog': { bg: 'bg-purple-500/10', border: 'border-purple-500/20', text: 'text-purple-300' },
  'Auth': { bg: 'bg-emerald-500/10', border: 'border-emerald-500/20', text: 'text-emerald-300' },
  'CRM': { bg: 'bg-cyan-500/10', border: 'border-cyan-500/20', text: 'text-cyan-300' },
  'SaaS': { bg: 'bg-rose-500/10', border: 'border-rose-500/20', text: 'text-rose-300' },
};

// Toast
const Toast = ({ message, type, onClear }) => {
  useEffect(() => {
    const timer = setTimeout(onClear, 3000);
    return () => clearTimeout(timer);
  }, [onClear]);
  return (
    <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      className={`fixed bottom-5 right-5 flex items-center gap-3 px-5 py-3.5 rounded-2xl text-sm font-medium shadow-2xl z-50 backdrop-blur-xl border ${
        type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border-red-500/30 text-red-300'
      }`}
    >
      {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      {message}
    </motion.div>
  );
};

const TemplateCard = ({ template, onApply, isApplying }) => {
  const Icon = CATEGORY_ICONS[template.category] || Database;
  const colors = CATEGORY_COLORS[template.category] || { bg: 'bg-amber-500/10', border: 'border-amber-500/20', text: 'text-amber-300' };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ y: -4 }}
      className="glass-card glass-card-hover overflow-hidden flex flex-col"
    >
      <div className="p-5 flex-1">
        {/* Category badge */}
        <div className="flex items-center justify-between mb-3">
          <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-semibold uppercase tracking-wider ${colors.bg} ${colors.border} ${colors.text} border`}>
            <Icon size={12} />
            {template.category}
          </div>
          <span className="text-[10px] text-[var(--sb-text-muted)]">{template.schema.columns.length} columns</span>
        </div>

        {/* Title & description */}
        <h3 className="text-sm font-bold text-white mb-1">{template.name}</h3>
        <p className="text-xs text-[var(--sb-text-muted)] leading-relaxed mb-4">{template.description}</p>

        {/* Column preview */}
        <div className="space-y-1">
          {template.schema.columns.slice(0, 5).map((col, i) => (
            <div key={i} className="flex items-center justify-between text-[10px] font-mono">
              <span className="text-[var(--sb-text-secondary)]">{col.name}</span>
              <span className="text-amber-400/80/60">{col.data_type}</span>
            </div>
          ))}
          {template.schema.columns.length > 5 && (
            <p className="text-[10px] text-[var(--sb-text-muted)]">+{template.schema.columns.length - 5} more columns</p>
          )}
        </div>
      </div>

      {/* Apply button */}
      <div className="px-5 pb-5">
        <button
          onClick={() => onApply(template.id)}
          disabled={isApplying}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-semibold text-white transition-all disabled:opacity-50"
          style={{ background: 'var(--sb-gradient-accent)' }}
        >
          {isApplying ? (
            <Loader size={14} className="animate-spin" />
          ) : (
            <>
              Use Template <ArrowRight size={12} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
};

const Templates = () => {
  const [templates, setTemplates] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [applyingId, setApplyingId] = useState(null);
  const [notification, setNotification] = useState({ text: '', type: 'success' });
  const [activeCategory, setActiveCategory] = useState('All');
  const navigate = useNavigate();
  const { activeProject } = useProjectStore();

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get('/templates');
        setTemplates(res.data);
      } catch (err) {
        console.error('Failed to load templates:', err);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleApply = async (templateId) => {
    setApplyingId(templateId);
    try {
      const payload = {};
      if (activeProject) payload.project_id = activeProject.id;
      const res = await api.post(`/templates/${templateId}/apply`, payload);
      setNotification({ text: `Template "${res.data.table_name}" applied! Redirecting to editor...`, type: 'success' });
      setTimeout(() => navigate('/editor'), 1500);
    } catch (err) {
      setNotification({ text: 'Failed to apply template.', type: 'error' });
    } finally {
      setApplyingId(null);
    }
  };

  const categories = ['All', ...new Set(templates.map(t => t.category))];
  const filtered = activeCategory === 'All' ? templates : templates.filter(t => t.category === activeCategory);

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-2xl font-bold text-white">Schema Templates</h1>
          <p className="text-sm text-[var(--sb-text-muted)] mt-1">
            Start with a pre-built schema and customize it for your needs
          </p>
        </motion.div>

        {/* Category filter */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={`flex-shrink-0 px-4 py-2 rounded-xl text-xs font-medium transition-all border ${
                activeCategory === cat
                  ? 'bg-amber-500/15 border-amber-500/30 text-amber-300'
                  : 'bg-white/5 border-[var(--sb-border)] text-[var(--sb-text-muted)] hover:text-white hover:bg-white/10'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-amber-400" size={24} />
          </div>
        )}

        {/* Template grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {filtered.map((template, i) => (
            <TemplateCard
              key={template.id}
              template={template}
              onApply={handleApply}
              isApplying={applyingId === template.id}
            />
          ))}
        </div>
      </div>

      <AnimatePresence>
        {notification.text && (
          <Toast message={notification.text} type={notification.type} onClear={() => setNotification({ text: '', type: 'success' })} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default Templates;
