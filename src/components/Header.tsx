import React from 'react';
import { Upload, Sparkles, Gamepad2 } from 'lucide-react';

interface Props {
  onOpenUpload: () => void;
  onSelectNav: (tab: 'library' | 'engines' | 'assets' | 'console') => void;
  activeNav: string;
}

export const Header: React.FC<Props> = ({ onOpenUpload, onSelectNav, activeNav }) => {
  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/90 backdrop-blur-md px-6 py-3.5 flex items-center justify-between">
      {/* Zone 1: Wordmark */}
      <div className="flex items-center gap-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            onSelectNav('library');
          }}
          className="flex items-center gap-2.5 text-lg font-bold tracking-tight text-white hover:text-sky-400 transition-colors"
        >
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
            <Gamepad2 className="w-4 h-4" />
          </div>
          <span>ArcadeZip</span>
        </a>
        <span className="hidden sm:inline-block text-xs text-slate-500 font-mono">
          Émulateur Multi-Moteurs
        </span>
      </div>

      {/* Zone 2: Navigation Links */}
      <nav className="hidden md:flex items-center gap-7 text-sm font-medium text-slate-400">
        <button
          onClick={() => onSelectNav('library')}
          className={`hover:text-white transition-colors cursor-pointer ${
            activeNav === 'library' ? 'text-white border-b-2 border-sky-500 py-1' : ''
          }`}
        >
          Bibliothèque
        </button>
        <button
          onClick={() => onSelectNav('engines')}
          className={`hover:text-white transition-colors cursor-pointer ${
            activeNav === 'engines' ? 'text-white border-b-2 border-sky-500 py-1' : ''
          }`}
        >
          Moteurs Supportés
        </button>
        <button
          onClick={() => onSelectNav('assets')}
          className={`hover:text-white transition-colors cursor-pointer ${
            activeNav === 'assets' ? 'text-white border-b-2 border-sky-500 py-1' : ''
          }`}
        >
          Assets 3D &amp; Médias
        </button>
        <button
          onClick={() => onSelectNav('console')}
          className={`hover:text-white transition-colors cursor-pointer ${
            activeNav === 'console' ? 'text-white border-b-2 border-sky-500 py-1' : ''
          }`}
        >
          Journal &amp; Diagnostic
        </button>
      </nav>

      {/* Zone 3: Primary Actions */}
      <div className="flex items-center gap-3">
        <button
          onClick={onOpenUpload}
          className="px-4 py-2 text-xs font-semibold text-slate-950 bg-sky-400 hover:bg-sky-300 rounded-lg shadow-sm hover:shadow transition-colors flex items-center gap-2 whitespace-nowrap cursor-pointer"
        >
          <Upload className="w-3.5 h-3.5" />
          <span>Déposer un ZIP</span>
        </button>
      </div>
    </header>
  );
};
