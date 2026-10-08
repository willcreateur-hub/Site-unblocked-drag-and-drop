import React, { useState } from 'react';
import { Terminal, Trash2, AlertCircle, AlertTriangle, Info } from 'lucide-react';
import { LogMessage } from '../types/game';

interface Props {
  logs: LogMessage[];
  onClear: () => void;
}

export const ConsoleViewer: React.FC<Props> = ({ logs, onClear }) => {
  const [filter, setFilter] = useState<'all' | 'info' | 'warn' | 'error'>('all');

  const filtered = logs.filter(l => {
    if (filter === 'all') return true;
    return l.level === filter;
  });

  return (
    <div className="flex flex-col h-full bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
      {/* Header Controls */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800 bg-slate-900/60">
        <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
          <Terminal className="w-4 h-4 text-sky-400" />
          <span className="font-semibold text-slate-200">Sortie Console &amp; Diagnostics</span>
          <span className="text-slate-600">({logs.length})</span>
        </div>

        {/* Filter buttons (Interactive segmented control) */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs">
            <button
              onClick={() => setFilter('all')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === 'all' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
              }`}
            >
              Tous
            </button>
            <button
              onClick={() => setFilter('info')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === 'info' ? 'bg-slate-800 text-sky-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Infos
            </button>
            <button
              onClick={() => setFilter('warn')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === 'warn' ? 'bg-slate-800 text-amber-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Alertes
            </button>
            <button
              onClick={() => setFilter('error')}
              className={`px-2.5 py-1 rounded transition-colors ${
                filter === 'error' ? 'bg-slate-800 text-rose-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              Erreurs
            </button>
          </div>

          <button
            onClick={onClear}
            className="p-1.5 text-slate-400 hover:text-rose-400 rounded hover:bg-slate-800 transition-colors"
            title="Effacer la console"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Log list */}
      <div className="flex-1 overflow-y-auto p-4 space-y-1.5 font-mono text-xs select-text">
        {filtered.length === 0 ? (
          <div className="h-full flex flex-col items-center justify-center text-slate-600 text-center py-12">
            <Terminal className="w-8 h-8 mb-2 opacity-40" />
            <p>Aucun message de journalisation pour le moment.</p>
            <p className="text-[11px] text-slate-700 mt-1">Les appels à console.log(), les alertes et les erreurs runtime s'affichent ici.</p>
          </div>
        ) : (
          filtered.map((log) => (
            <div
              key={log.id}
              className={`flex items-start gap-2.5 p-2 rounded border transition-colors ${
                log.level === 'error'
                  ? 'bg-rose-950/20 border-rose-900/40 text-rose-300'
                  : log.level === 'warn'
                  ? 'bg-amber-950/20 border-amber-900/40 text-amber-300'
                  : 'bg-slate-900/40 border-slate-800/40 text-slate-300'
              }`}
            >
              <span className="text-[10px] text-slate-500 shrink-0 tabular-nums pt-0.5">
                {log.timestamp}
              </span>
              <div className="shrink-0 pt-0.5">
                {log.level === 'error' && <AlertCircle className="w-3.5 h-3.5 text-rose-400" />}
                {log.level === 'warn' && <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />}
                {log.level === 'info' && <Info className="w-3.5 h-3.5 text-sky-400" />}
              </div>
              <span className="flex-1 break-all leading-relaxed whitespace-pre-wrap">{log.message}</span>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
