import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, RefreshCw, Loader, ZoomIn, ZoomOut, Download, Table2 } from 'lucide-react';
import mermaid from 'mermaid';
import api from '../services/api';
import { useProjectStore } from '../stores/projectStore';
import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';

mermaid.initialize({
  startOnLoad: false,
  theme: 'dark',
  themeVariables: {
    primaryColor: '#6366f1',
    primaryTextColor: '#f1f5f9',
    primaryBorderColor: '#6366f1',
    lineColor: '#22d3ee',
    secondaryColor: '#161d2b',
    tertiaryColor: '#0d1017',
    fontFamily: 'JetBrains Mono, monospace',
  },
  er: {
    diagramPadding: 20,
    layoutDirection: 'TB',
    minEntityWidth: 100,
    minEntityHeight: 75,
    entityPadding: 15,
    fontSize: 12,
  },
});

const ERDiagram = () => {
  const [schemas, setSchemas] = useState([]);
  const [mermaidCode, setMermaidCode] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [svgContent, setSvgContent] = useState('');
  const [error, setError] = useState('');
  const diagramRef = useRef(null);
  const { activeProject } = useProjectStore();
  const { token } = useAuthStore();
  const navigate = useNavigate();

  const loadDiagram = useCallback(async () => {
    if (!token) return;
    setIsLoading(true);
    setError('');
    try {
      const url = activeProject ? `/schemas/er-diagram?project_id=${activeProject.id}` : '/schemas/er-diagram';
      const res = await api.get(url);
      setSchemas(res.data.schemas);
      
      if (res.data.schemas.length === 0) {
        setMermaidCode('');
        setSvgContent('');
        setIsLoading(false);
        return;
      }

      // Build Mermaid ER code
      let code = 'erDiagram\n';
      res.data.schemas.forEach(schema => {
        code += `  ${schema.table_name} {\n`;
        schema.columns.forEach(col => {
          const type = col.data_type.replace(/\(.*\)/, '').toLowerCase();
          const pk = (col.constraints || []).includes('PRIMARY KEY') ? 'PK' : '';
          const fk = col.name.endsWith('_id') && col.name !== 'id' ? 'FK' : '';
          const label = pk || fk || '';
          code += `    ${type} ${col.name}${label ? ' ' + JSON.stringify(label) : ''}\n`;
        });
        code += '  }\n';
      });

      // Detect relationships
      res.data.schemas.forEach(schema => {
        schema.columns.forEach(col => {
          if (col.name.endsWith('_id') && col.name !== 'id') {
            const refTable = col.name.replace('_id', '') + 's';
            if (res.data.schemas.find(s => s.table_name === refTable)) {
              code += `  ${refTable} ||--o{ ${schema.table_name} : "has"\n`;
            }
          }
        });
      });

      setMermaidCode(code);

      // Render
      try {
        const { svg } = await mermaid.render('er-diagram-svg', code);
        setSvgContent(svg);
      } catch (renderErr) {
        console.error('Mermaid render error:', renderErr);
        setError('Could not render diagram. Try generating more schemas with relationships.');
      }
    } catch (err) {
      console.error('Failed to load schemas:', err);
      setError('Failed to load schemas');
    } finally {
      setIsLoading(false);
    }
  }, [activeProject, token]);

  useEffect(() => { loadDiagram(); }, [loadDiagram]);

  const handleDownloadSVG = () => {
    if (!svgContent) return;
    const blob = new Blob([svgContent], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'er-diagram.svg';
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-8 space-y-6">
        {/* Header */}
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">ER Diagram</h1>
            <p className="text-sm text-[var(--sb-text-muted)] mt-1">Visual entity-relationship diagram of your schemas</p>
          </div>
          <div className="flex items-center gap-2">
            {svgContent && (
              <button onClick={handleDownloadSVG}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 transition-all"
              >
                <Download size={14} /> Download SVG
              </button>
            )}
            <button onClick={loadDiagram}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium bg-white/5 hover:bg-white/10 text-[var(--sb-text-secondary)] hover:text-white border border-[var(--sb-border)] transition-all"
            >
              <RefreshCw size={14} /> Refresh
            </button>
          </div>
        </motion.div>

        {/* Stats */}
        {schemas.length > 0 && (
          <div className="flex gap-4">
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500/10 border border-amber-500/20">
              <Table2 size={14} className="text-amber-400" />
              <span className="text-xs font-medium text-amber-300">{schemas.length} tables</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <GitBranch size={14} className="text-amber-400/80" />
              <span className="text-xs font-medium text-cyan-300">
                {schemas.reduce((acc, s) => acc + s.columns.filter(c => c.name.endsWith('_id') && c.name !== 'id').length, 0)} relationships
              </span>
            </div>
          </div>
        )}

        {/* Main Content Area */}
        <div className="flex-1 min-h-[500px] flex items-center justify-center relative z-10 w-full overflow-hidden p-4 sm:p-8">
          {!token ? (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-[var(--sb-border)]">
                <GitBranch className="text-amber-400" size={28} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">Login Required</h2>
              <p className="text-[var(--sb-text-muted)] text-sm max-w-[280px] mx-auto mb-6">
                You must sign in to generate and view relationship diagrams.
              </p>
              <button onClick={() => navigate('/login')} className="bg-amber-500 hover:bg-amber-600 text-white font-semibold py-2 px-6 rounded-lg transition-colors">
                Sign In
              </button>
            </motion.div>
          ) : isLoading ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-[var(--sb-text-muted)] gap-3">
              <Loader className="animate-spin text-amber-500" size={32} />
              <span className="text-sm font-medium tracking-wide">Rendering diagram...</span>
            </motion.div>
          ) : error ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center justify-center text-red-400/80 max-w-sm text-center">
              <GitBranch size={32} className="mb-3 opacity-50" />
              <p className="text-sm">{error}</p>
            </motion.div>
          ) : !schemas.length ? (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center">
              <div className="w-16 h-16 bg-amber-500/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <GitBranch className="text-amber-400" size={28} />
              </div>
              <h2 className="text-xl font-bold text-white mb-2">No schemas to visualize</h2>
              <p className="text-[var(--sb-text-muted)] text-sm max-w-[280px] mx-auto">
                Generate some schemas in <span className="text-amber-400 font-medium">Schema Chat</span> first, then come back to see the ER diagram.
              </p>
            </motion.div>
          ) : null}
        </div>

        {/* Diagram */}
        {!isLoading && svgContent && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-6 overflow-auto">
            <div
              ref={diagramRef}
              className="w-full flex justify-center"
              dangerouslySetInnerHTML={{ __html: svgContent }}
              style={{ minHeight: '300px' }}
            />
          </motion.div>
        )}

        {/* Mermaid source code */}
        {!isLoading && mermaidCode && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="glass-card overflow-hidden">
            <div className="px-4 py-2.5 border-b border-[var(--sb-border)] flex items-center justify-between">
              <span className="text-[10px] text-[var(--sb-text-muted)] uppercase tracking-wider font-semibold">Mermaid Source</span>
              <button
                onClick={() => navigator.clipboard.writeText(mermaidCode)}
                className="text-[10px] text-[var(--sb-text-muted)] hover:text-white transition-colors"
              >
                Copy
              </button>
            </div>
            <pre className="px-4 py-3 text-xs font-mono text-emerald-300 overflow-x-auto whitespace-pre max-h-48 overflow-y-auto">{mermaidCode}</pre>
          </motion.div>
        )}
      </div>
    </div>
  );
};

export default ERDiagram;
