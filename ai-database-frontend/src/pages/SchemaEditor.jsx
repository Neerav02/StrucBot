import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Database, Plus, Trash2, Save, Loader, Edit3, Check, X,
  ChevronDown, ChevronUp, Code, Copy, CheckCircle, AlertTriangle,
  GripVertical, RefreshCw, Download, FileCode
} from 'lucide-react';
import api from '../services/api';
import { useProjectStore } from '../stores/projectStore';

// SQL Data Type options
const DATA_TYPES = [
  'SERIAL', 'INTEGER', 'BIGINT', 'SMALLINT',
  'VARCHAR(50)', 'VARCHAR(100)', 'VARCHAR(255)', 'VARCHAR(500)',
  'TEXT', 'CHAR(1)',
  'BOOLEAN',
  'DECIMAL(10,2)', 'DECIMAL(8,2)', 'DECIMAL(3,2)', 'FLOAT', 'DOUBLE',
  'DATE', 'TIMESTAMP', 'TIME',
  'JSON', 'JSONB', 'UUID',
];

const CONSTRAINT_OPTIONS = [
  'PRIMARY KEY', 'NOT NULL', 'UNIQUE',
  'DEFAULT CURRENT_TIMESTAMP', "DEFAULT 'active'",
  'DEFAULT 0', 'DEFAULT true', 'DEFAULT false',
];

// Toast
const Toast = ({ message, type, onClear }) => {
  useEffect(() => {
    const timer = setTimeout(onClear, 3000);
    return () => clearTimeout(timer);
  }, [onClear]);
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 10 }}
      className={`fixed bottom-5 left-4 right-4 md:left-auto md:right-5 md:w-auto flex items-center gap-3 px-4 py-3 md:px-5 md:py-3.5 rounded-2xl text-sm font-medium shadow-2xl z-50 backdrop-blur-xl border ${
        type === 'success' ? 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300' : 'bg-red-500/15 border-red-500/30 text-red-300'
      }`}
    >
      {type === 'success' ? <CheckCircle size={18} /> : <AlertTriangle size={18} />}
      {message}
    </motion.div>
  );
};

// Column Editor Row
const ColumnRow = ({ column, index, onChange, onRemove, isFirst }) => {
  const [showConstraints, setShowConstraints] = useState(false);

  const toggleConstraint = (constraint) => {
    const current = column.constraints || [];
    const updated = current.includes(constraint)
      ? current.filter(c => c !== constraint)
      : [...current, constraint];
    onChange(index, { ...column, constraints: updated });
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10, height: 0 }}
      transition={{ duration: 0.2 }}
      className="group border border-[var(--sb-border)] rounded-xl p-3 md:p-4 hover:border-[var(--sb-border-hover)] transition-all bg-[var(--sb-bg-primary)]/40"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 sm:gap-3">
        {/* Drag handle */}
        <div className="text-[var(--sb-text-muted)] opacity-0 group-hover:opacity-100 transition-opacity cursor-grab hidden sm:block">
          <GripVertical size={14} />
        </div>

        {/* Column name */}
        <div className="flex-1 min-w-0">
          <input
            type="text"
            value={column.name}
            onChange={(e) => onChange(index, { ...column, name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
            className="w-full bg-transparent border-b border-[var(--sb-border)] focus:border-amber-500/50 text-sm text-white font-mono py-1 px-0 focus:outline-none transition-colors"
            placeholder="column_name"
          />
        </div>

        {/* Data type dropdown */}
        <div className="relative">
          <select
            value={column.data_type}
            onChange={(e) => onChange(index, { ...column, data_type: e.target.value })}
            className="appearance-none bg-[var(--sb-bg-card)] border border-[var(--sb-border)] rounded-lg text-xs text-amber-400/80 font-mono px-3 py-1.5 pr-8 focus:outline-none focus:border-amber-500/50 cursor-pointer"
          >
            {DATA_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 text-[var(--sb-text-muted)] pointer-events-none" />
        </div>

        {/* Constraint toggle */}
        <button
          onClick={() => setShowConstraints(!showConstraints)}
          className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all font-medium ${
            (column.constraints || []).length > 0
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
              : 'border-[var(--sb-border)] bg-white/5 text-[var(--sb-text-muted)] hover:text-white'
          }`}
        >
          {(column.constraints || []).length} constraints
        </button>

        {/* Remove */}
        {!isFirst && (
          <button
            onClick={() => onRemove(index)}
            className="p-1.5 rounded-lg text-[var(--sb-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all sm:opacity-0 sm:group-hover:opacity-100"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>

      {/* Constraint badges (always visible) */}
      {(column.constraints || []).length > 0 && !showConstraints && (
        <div className="flex flex-wrap gap-1.5 mt-2 ml-7">
          {column.constraints.map((c, i) => (
            <span key={i} className="text-[9px] bg-amber-500/10 text-amber-300 px-2 py-0.5 rounded-md font-medium border border-amber-500/20">
              {c}
            </span>
          ))}
        </div>
      )}

      {/* Constraint picker */}
      <AnimatePresence>
        {showConstraints && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="mt-3 ml-7 overflow-hidden"
          >
            <p className="text-[10px] text-[var(--sb-text-muted)] uppercase tracking-wider font-semibold mb-2">Toggle Constraints</p>
            <div className="flex flex-wrap gap-2">
              {CONSTRAINT_OPTIONS.map(c => (
                <button
                  key={c}
                  onClick={() => toggleConstraint(c)}
                  className={`text-[10px] px-2.5 py-1 rounded-lg border transition-all font-medium ${
                    (column.constraints || []).includes(c)
                      ? 'border-amber-500/50 bg-amber-500/15 text-amber-300'
                      : 'border-[var(--sb-border)] bg-white/5 text-[var(--sb-text-muted)] hover:text-white hover:bg-white/10'
                  }`}
                >
                  {(column.constraints || []).includes(c) ? <Check size={8} className="inline mr-1" /> : null}
                  {c}
                </button>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// Schema Editor Card
const SchemaEditorCard = ({ schema, onUpdate, onDelete, onNotify }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editData, setEditData] = useState({ table_name: schema.table_name, columns: schema.columns });
  const [isSaving, setIsSaving] = useState(false);
  const [showSQL, setShowSQL] = useState(false);
  const [sqlCode, setSqlCode] = useState('');
  const [sqlDialect, setSqlDialect] = useState('postgresql');
  const [showExport, setShowExport] = useState(false);
  const [exportCode, setExportCode] = useState('');
  const [exportFormat, setExportFormat] = useState('');
  const [showMockData, setShowMockData] = useState(false);
  const [mockDataContent, setMockDataContent] = useState('');
  const [mockDataFormat, setMockDataFormat] = useState('sql');
  const [isGeneratingMockData, setIsGeneratingMockData] = useState(false);

  const handleColumnChange = (index, updatedColumn) => {
    const newColumns = [...editData.columns];
    newColumns[index] = updatedColumn;
    setEditData({ ...editData, columns: newColumns });
  };

  const handleRemoveColumn = (index) => {
    setEditData({ ...editData, columns: editData.columns.filter((_, i) => i !== index) });
  };

  const handleAddColumn = () => {
    setEditData({
      ...editData,
      columns: [...editData.columns, { name: 'new_column', data_type: 'VARCHAR(255)', constraints: [] }]
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const updated = await api.put(`/schemas/${schema.id}`, editData);
      onUpdate(updated.data);
      setIsEditing(false);
    } catch (err) {
      console.error('Save failed:', err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setEditData({ table_name: schema.table_name, columns: schema.columns });
    setIsEditing(false);
  };

  const handleViewSQL = async (dialect = 'postgresql') => {
    setSqlDialect(dialect);
    try {
      const res = await api.get(`/schemas/${schema.id}/sql?dialect=${dialect}`);
      setSqlCode(res.data.sql);
    } catch {
      const cols = schema.columns.map(c => {
        const constraints = (c.constraints || []).join(' ');
        return `  ${c.name} ${c.data_type}${constraints ? ' ' + constraints : ''}`;
      });
      setSqlCode(`CREATE TABLE ${schema.table_name} (\n${cols.join(',\n')}\n);`);
    }
    setShowSQL(true);
    setShowExport(false);
  };

  const handleExport = async (format) => {
    try {
      const res = await api.get(`/schemas/${schema.id}/export?format=${format}`);
      setExportCode(res.data.code);
      setExportFormat(format);
      setShowExport(true);
      setShowSQL(false);
    } catch (err) {
      console.error('Export failed:', err);
    }
  };

  const handleGenerateMockData = async (format = 'sql') => {
    setIsGeneratingMockData(true);
    setMockDataFormat(format);
    try {
      const res = await api.get(`/schemas/${schema.id}/mock-data?format=${format}`);
      setMockDataContent(res.data.data);
      setShowMockData(true);
      setShowSQL(false);
      setShowExport(false);
    } catch (err) {
      console.error('Mock data failed:', err);
    } finally {
      setIsGeneratingMockData(false);
    }
  };

  const handleCopySQL = async () => {
    await navigator.clipboard.writeText(sqlCode);
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card overflow-hidden"
    >
      {/* Header */}
      <div
      className="flex flex-col sm:flex-row items-start sm:items-center justify-between px-4 py-3 md:px-5 md:py-4 cursor-pointer hover:bg-white/[0.02] transition-colors gap-3 sm:gap-0"
        onClick={() => !isEditing && setIsExpanded(!isExpanded)}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Database size={18} className="text-amber-400" />
          </div>
          <div>
            {isEditing ? (
              <input
                type="text"
                value={editData.table_name}
                onChange={(e) => setEditData({ ...editData, table_name: e.target.value.toLowerCase().replace(/\s+/g, '_') })}
                onClick={(e) => e.stopPropagation()}
                className="bg-[var(--sb-bg-primary)] border border-[var(--sb-border)] rounded-lg text-sm text-amber-300 font-mono px-3 py-1.5 focus:outline-none focus:border-amber-500/50"
              />
            ) : (
              <h3 className="text-sm font-bold font-mono text-amber-300">{schema.table_name}</h3>
            )}
            <p className="text-[10px] text-[var(--sb-text-muted)] mt-0.5">
              {schema.columns.length} columns · {schema.ai_generated !== false ? 'AI Generated' : 'Fallback'} · {new Date(schema.created_at).toLocaleDateString()}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 flex-wrap w-full sm:w-auto">
          {isEditing ? (
            <>
              <button onClick={(e) => { e.stopPropagation(); handleSave(); }}
                disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-300 border border-emerald-500/30 transition-all"
              >
                {isSaving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />} Save
              </button>
              <button onClick={(e) => { e.stopPropagation(); handleCancel(); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 hover:bg-white/10 text-[var(--sb-text-muted)] border border-[var(--sb-border)] transition-all"
              >
                <X size={12} /> Cancel
              </button>
            </>
          ) : (
            <>
              <button onClick={(e) => { e.stopPropagation(); setIsEditing(true); setIsExpanded(true); }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/20 transition-all"
              >
                <Edit3 size={12} /> Edit
              </button>
              <button onClick={(e) => { e.stopPropagation(); showSQL ? setShowSQL(false) : handleViewSQL(); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  showSQL ? 'bg-amber-500/15 border-amber-500/30 text-amber-300' : 'bg-white/5 hover:bg-white/10 text-[var(--sb-text-secondary)] border-[var(--sb-border)]'
                }`}
              >
                <Code size={12} /> SQL
              </button>
              <button onClick={(e) => { e.stopPropagation(); showExport ? setShowExport(false) : handleExport('prisma'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  showExport ? 'bg-purple-500/15 border-purple-500/30 text-purple-300' : 'bg-white/5 hover:bg-white/10 text-[var(--sb-text-secondary)] border-[var(--sb-border)]'
                }`}
              >
                <FileCode size={12} /> Export
              </button>
              <button disabled={isGeneratingMockData} onClick={(e) => { e.stopPropagation(); showMockData ? setShowMockData(false) : handleGenerateMockData('sql'); }}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                  showMockData ? 'bg-sky-500/15 border-sky-500/30 text-sky-300' : 'bg-white/5 hover:bg-white/10 text-[var(--sb-text-secondary)] border-[var(--sb-border)]'
                }`}
              >
                {isGeneratingMockData ? <Loader size={12} className="animate-spin" /> : <Database size={12} />} Data
              </button>
              <button onClick={(e) => { e.stopPropagation(); onDelete(schema.id); }}
                className="p-1.5 rounded-lg text-[var(--sb-text-muted)] hover:text-red-400 hover:bg-red-500/10 transition-all"
              >
                <Trash2 size={14} />
              </button>
              {isExpanded ? <ChevronUp size={16} className="text-[var(--sb-text-muted)]" /> : <ChevronDown size={16} className="text-[var(--sb-text-muted)]" />}
            </>
          )}
        </div>
      </div>

      {/* SQL Preview with dialect tabs */}
      <AnimatePresence>
        {showSQL && !isEditing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-5 mb-4 bg-[var(--sb-bg-primary)] border border-[var(--sb-border)] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--sb-border)]">
                <div className="flex gap-1">
                  {['postgresql', 'mysql', 'sqlite'].map(d => (
                    <button key={d} onClick={(e) => { e.stopPropagation(); handleViewSQL(d); }}
                      className={`text-[10px] px-2.5 py-1 rounded-md font-semibold uppercase tracking-wider transition-all ${
                        sqlDialect === d ? 'bg-amber-500/15 text-amber-300' : 'text-[var(--sb-text-muted)] hover:text-white'
                      }`}
                    >{d}</button>
                  ))}
                </div>
                <button onClick={handleCopySQL} className="flex items-center gap-1 text-[10px] text-[var(--sb-text-muted)] hover:text-white transition-colors">
                  <Copy size={10} /> Copy
                </button>
              </div>
              <pre className="px-4 py-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre">{sqlCode}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ORM Export */}
      <AnimatePresence>
        {showExport && !isEditing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-5 mb-4 bg-[var(--sb-bg-primary)] border border-[var(--sb-border)] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--sb-border)]">
                <div className="flex gap-1">
                  {['prisma', 'typeorm'].map(f => (
                    <button key={f} onClick={(e) => { e.stopPropagation(); handleExport(f); }}
                      className={`text-[10px] px-2.5 py-1 rounded-md font-semibold uppercase tracking-wider transition-all ${
                        exportFormat === f ? 'bg-purple-500/15 text-purple-300' : 'text-[var(--sb-text-muted)] hover:text-white'
                      }`}
                    >{f}</button>
                  ))}
                </div>
                <button onClick={() => navigator.clipboard.writeText(exportCode)} className="flex items-center gap-1 text-[10px] text-[var(--sb-text-muted)] hover:text-white transition-colors">
                  <Copy size={10} /> Copy
                </button>
              </div>
              <pre className="px-4 py-3 text-xs font-mono text-purple-300 overflow-x-auto whitespace-pre">{exportCode}</pre>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mock Data Output */}
      <AnimatePresence>
        {showMockData && !isEditing && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} className="overflow-hidden">
            <div className="mx-5 mb-4 bg-[var(--sb-bg-primary)] border border-[var(--sb-border)] rounded-xl overflow-hidden">
              <div className="flex items-center justify-between px-4 py-2 border-b border-[var(--sb-border)]">
                <div className="flex gap-1">
                  {['sql', 'json'].map(f => (
                    <button key={f} onClick={(e) => { e.stopPropagation(); handleGenerateMockData(f); }}
                      disabled={isGeneratingMockData}
                      className={`text-[10px] px-2.5 py-1 rounded-md font-semibold uppercase tracking-wider transition-all ${
                        mockDataFormat === f ? 'bg-sky-500/15 text-sky-300' : 'text-[var(--sb-text-muted)] hover:text-white'
                      }`}
                    >{f}</button>
                  ))}
                </div>
                <button onClick={(e) => { e.stopPropagation(); navigator.clipboard.writeText(mockDataContent); }} className="flex items-center gap-1 text-[10px] text-[var(--sb-text-muted)] hover:text-white transition-colors">
                  <Copy size={10} /> Copy
                </button>
              </div>
              <div className="relative">
                {isGeneratingMockData && (
                  <div className="absolute inset-0 bg-[var(--sb-bg-primary)]/80 backdrop-blur-sm flex items-center justify-center z-10">
                    <Loader size={20} className="text-sky-400 animate-spin" />
                  </div>
                )}
                <pre className="px-4 py-3 text-xs font-mono text-sky-300 overflow-x-auto whitespace-pre min-h-[100px]">{mockDataContent}</pre>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Expanded columns */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden"
          >
            <div className="px-5 pb-5 space-y-2">
              {(isEditing ? editData.columns : schema.columns).map((col, idx) => (
                isEditing ? (
                  <ColumnRow
                    key={`${col.name}-${idx}`}
                    column={col}
                    index={idx}
                    onChange={handleColumnChange}
                    onRemove={handleRemoveColumn}
                    isFirst={idx === 0}
                  />
                ) : (
                  <div key={idx} className="flex items-center justify-between px-4 py-2 text-xs font-mono border border-[var(--sb-border)] rounded-lg bg-[var(--sb-bg-primary)]/30">
                    <div className="flex items-center gap-2">
                      <span className="text-white">{col.name}</span>
                      {col.constraints?.includes('PRIMARY KEY') && (
                        <span className="text-[8px] bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded font-sans font-bold uppercase">PK</span>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-amber-400/80">{col.data_type}</span>
                      {col.constraints?.filter(c => c !== 'PRIMARY KEY').map((c, i) => (
                        <span key={i} className="text-[8px] bg-white/5 text-[var(--sb-text-muted)] px-1.5 py-0.5 rounded font-sans">{c}</span>
                      ))}
                    </div>
                  </div>
                )
              ))}

              {isEditing && (
                <button
                  onClick={handleAddColumn}
                  className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-dashed border-[var(--sb-border)] hover:border-amber-500/30 text-[var(--sb-text-muted)] hover:text-amber-300 transition-all text-xs font-medium"
                >
                  <Plus size={14} /> Add Column
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

// ---- MAIN SCHEMA EDITOR PAGE ----
const SchemaEditor = () => {
  const { activeProject } = useProjectStore();
  const [schemas, setSchemas] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [notification, setNotification] = useState({ text: '', type: 'success' });

  const loadSchemas = async () => {
    setIsLoading(true);
    try {
      const url = activeProject ? `/schemas?project_id=${activeProject.id}` : '/schemas';
      const res = await api.get(url);
      setSchemas(res.data);
    } catch (err) {
      console.error('Failed to load schemas:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { loadSchemas(); }, [activeProject]);

  const handleUpdate = (updatedSchema) => {
    setSchemas(prev => prev.map(s => s.id === updatedSchema.id ? updatedSchema : s));
    setNotification({ text: `Schema "${updatedSchema.table_name}" updated!`, type: 'success' });
  };

  const handleDelete = async (id) => {
    try {
      await api.delete(`/schemas/${id}`);
      setSchemas(prev => prev.filter(s => s.id !== id));
      setNotification({ text: 'Schema deleted.', type: 'success' });
    } catch {
      setNotification({ text: 'Failed to delete schema.', type: 'error' });
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-4 md:p-8 space-y-4 md:space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 sm:gap-0">
          <div>
            <h1 className="text-xl md:text-2xl font-bold text-white">Schema Editor</h1>
            <p className="text-sm text-[var(--sb-text-muted)] mt-1">Edit, modify, and manage your database schemas</p>
          </div>
          <button
            onClick={loadSchemas}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-[var(--sb-text-secondary)] hover:text-white border border-[var(--sb-border)] transition-all"
          >
            <RefreshCw size={14} /> Refresh
          </button>
        </motion.div>

        {/* Loading */}
        {isLoading && (
          <div className="flex items-center justify-center py-20">
            <Loader className="animate-spin text-amber-400" size={24} />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && schemas.length === 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-card p-12 text-center"
          >
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 flex items-center justify-center mx-auto mb-4">
              <Database size={28} className="text-amber-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No schemas yet</h3>
            <p className="text-sm text-[var(--sb-text-muted)] max-w-sm mx-auto">
              Head to <span className="text-amber-400">Schema Chat</span> and describe a database to generate your first schema!
            </p>
          </motion.div>
        )}

        {/* Schema list */}
        <div className="space-y-4">
          {schemas.map((schema, i) => (
            <SchemaEditorCard
              key={schema.id}
              schema={schema}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
            />
          ))}
        </div>
      </div>

      {/* Toast */}
      <AnimatePresence>
        {notification.text && (
          <Toast message={notification.text} type={notification.type} onClear={() => setNotification({ text: '', type: 'success' })} />
        )}
      </AnimatePresence>
    </div>
  );
};

export default SchemaEditor;
