import React, { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GitBranch, RefreshCw, Loader, ZoomIn, ZoomOut, Download, Table2 } from 'lucide-react';
import mermaid from 'mermaid';
import api from '../services/api';

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

  const loadDiagram = useCallback(async () => {
    setIsLoading(true);
    setError('');
    try {
      const res = await api.get('/schemas');
      setSchemas(res.data);
      
      if (res.data.length === 0) {
        setMermaidCode('');
        setSvgContent('');
        setIsLoading(false);
        return;
      }

      // Build Mermaid ER code
      let code = 'erDiagram\n';
      res.data.forEach(schema => {
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
      res.data.forEach(schema => {
        schema.columns.forEach(col => {
          if (col.name.endsWith('_id') && col.name !== 'id') {
            const refTable = col.name.replace('_id', '') + 's';
            if (res.data.find(s => s.table_name === refTable)) {
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
  }, []);

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
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-indigo-500/10 border border-indigo-500/20">
              <Table2 size={14} className="text-indigo-400" />
              <span className="text-xs font-medium text-indigo-300">{schemas.length} tables</span>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20">
              <GitBranch size={14} className="text-cyan-400" />
              <span className="text-xs font-medium text-cyan-300">
                {schemas.reduce((acc, s) => acc + s.columns.filter(c => c.name.endsWith('_id') && c.name !== 'id').length, 0)} relationships
              </span>
            </div>
          </div>
        )}

        {/* Loading */}
        {isLoading && (
          <div className="glass-card p-20 flex items-center justify-center">
            <Loader className="animate-spin text-indigo-400" size={24} />
          </div>
        )}

        {/* Empty state */}
        {!isLoading && schemas.length === 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card p-12 text-center">
            <div className="w-16 h-16 rounded-2xl bg-indigo-500/10 flex items-center justify-center mx-auto mb-4">
              <GitBranch size={28} className="text-indigo-400" />
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">No schemas to visualize</h3>
            <p className="text-sm text-[var(--sb-text-muted)] max-w-sm mx-auto">
              Generate some schemas in <span className="text-indigo-400">Schema Chat</span> first, then come back to see the ER diagram.
            </p>
          </motion.div>
        )}

        {/* Error */}
        {error && (
          <div className="glass-card p-8 text-center text-red-300 text-sm">{error}</div>
        )}

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
