import React from 'react';
import { Play, Download, FolderArchive, Layers, Sparkles } from 'lucide-react';
import { LoadedGame } from '../types/game';
import { formatBytes } from '../utils/zipHandler';

interface Props {
  game: LoadedGame;
  onPlay: (game: LoadedGame) => void;
  onDownloadZip: (game: LoadedGame) => void;
  onInspectAssets: (game: LoadedGame) => void;
}

export const GameCard: React.FC<Props> = ({ game, onPlay, onDownloadZip, onInspectAssets }) => {
  const { metadata } = game;

  return (
    <div className="group relative rounded-xl border border-slate-800 bg-slate-900/50 hover:bg-slate-900/80 transition-all duration-200 overflow-hidden flex flex-col justify-between">
      {/* Cover / Visual Anchor */}
      <div className="relative aspect-video w-full bg-slate-950 overflow-hidden border-b border-slate-800/80">
        {metadata.coverImage ? (
          <img
            src={metadata.coverImage}
            alt={metadata.title}
            referrerPolicy="no-referrer"
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center bg-gradient-to-br from-slate-900 to-slate-950 text-slate-600">
            <FolderArchive className="w-10 h-10 mb-2 opacity-50 text-sky-400" />
            <span className="text-xs font-mono uppercase tracking-wider">{metadata.engine}</span>
          </div>
        )}

        {/* Hover overlay quick play */}
        <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-3">
          <button
            onClick={() => onPlay(game)}
            className="px-4 py-2 bg-sky-400 hover:bg-sky-300 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-2 shadow-lg transition-transform active:scale-95 cursor-pointer"
          >
            <Play className="w-4 h-4 fill-current" />
            <span>Jouer</span>
          </button>
          <button
            onClick={() => onInspectAssets(game)}
            className="px-3 py-2 bg-slate-800/90 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Fichiers</span>
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="p-5 flex-1 flex flex-col justify-between">
        <div>
          {/* Metadata strictly unboxed with typographic separators (Rule 1A Zero-Pill) */}
          <div className="flex items-center gap-2 text-xs text-slate-400 font-mono mb-2">
            <span className="uppercase text-sky-400 font-semibold">{metadata.engine}</span>
            <span aria-hidden="true">·</span>
            <span>{metadata.filesCount} fichiers</span>
            <span aria-hidden="true">·</span>
            <span>{formatBytes(metadata.totalSize)}</span>
          </div>

          <h4 className="text-base font-semibold text-white tracking-tight mb-1.5 line-clamp-1">
            {metadata.title}
          </h4>

          <p className="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            {metadata.description}
          </p>
        </div>

        {/* Footer actions */}
        <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
          <div className="text-[11px] text-slate-500 font-mono truncate max-w-[150px]">
            {metadata.entryFile}
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => onDownloadZip(game)}
              title="Télécharger l'archive ZIP"
              className="p-1.5 text-slate-400 hover:text-white rounded hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
            </button>
            <button
              onClick={() => onPlay(game)}
              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Play className="w-3 h-3 fill-current text-sky-400" />
              <span>Lancer</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
