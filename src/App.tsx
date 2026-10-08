/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { DropZone } from './components/DropZone';
import { GameCard } from './components/GameCard';
import { GamePlayer } from './components/GamePlayer';
import { Model3DViewer } from './components/Model3DViewer';
import { AudioPlayerModal } from './components/AudioPlayerModal';
import { EnginesGuide } from './components/EnginesGuide';
import { AssetsGuide } from './components/AssetsGuide';
import { ConsoleViewer } from './components/ConsoleViewer';
import { getAllSampleGames } from './data/sampleGames';
import { processZipFile, exportGameAsZip } from './utils/zipHandler';
import { LoadedGame, LogMessage, SupportedEngine, VirtualFile } from './types/game';
import { Sparkles, Gamepad2, Search, SlidersHorizontal, UploadCloud } from 'lucide-react';

export default function App() {
  const [games, setGames] = useState<LoadedGame[]>([]);
  const [activeGame, setActiveGame] = useState<LoadedGame | null>(null);
  const [activeNav, setActiveNav] = useState<'library' | 'engines' | 'assets' | 'console'>('library');
  const [selectedEngineFilter, setSelectedEngineFilter] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Asset Modals
  const [preview3DFile, setPreview3DFile] = useState<VirtualFile | null>(null);
  const [previewAudioFile, setPreviewAudioFile] = useState<VirtualFile | null>(null);

  // Global console logs
  const [globalLogs, setGlobalLogs] = useState<LogMessage[]>([
    {
      id: 'init_sys',
      timestamp: new Date().toLocaleTimeString(),
      level: 'info',
      message: 'Moteur ArcadeZip initialisé avec succès. Prêt à recevoir des archives ZIP.',
    },
  ]);

  // Load sample games on startup
  useEffect(() => {
    const samples = getAllSampleGames();
    setGames(samples);
  }, []);

  const handleZipFile = async (file: File) => {
    setIsUploading(true);
    setUploadError(null);

    try {
      const loaded = await processZipFile(file);
      setGames((prev) => [loaded, ...prev]);
      setActiveGame(loaded);
      setActiveNav('library');

      setGlobalLogs((prev) => [
        ...prev,
        {
          id: 'zip_' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          level: 'info',
          message: `Archive ZIP "${file.name}" extraite avec succès (${loaded.fileList.length} fichiers montés, moteur détecté : [${loaded.metadata.engine.toUpperCase()}]).`,
        },
      ]);
    } catch (err: any) {
      console.error(err);
      setUploadError(
        'Impossible de décompresser le fichier ZIP. Vérifiez que l\'archive n\'est pas corrompue ou protégée par mot de passe.'
      );
      setGlobalLogs((prev) => [
        ...prev,
        {
          id: 'zip_err_' + Date.now(),
          timestamp: new Date().toLocaleTimeString(),
          level: 'error',
          message: `Erreur décompression ZIP : ${err.message || String(err)}`,
        },
      ]);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDownloadZip = async (game: LoadedGame) => {
    try {
      const blob = await exportGameAsZip(game);
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${game.metadata.title.toLowerCase().replace(/[^a-z0-9_-]/g, '_')}.zip`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (err: any) {
      console.error('Erreur export ZIP:', err);
    }
  };

  const filteredGames = games.filter((g) => {
    const matchesSearch =
      g.metadata.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      g.metadata.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesEngine =
      selectedEngineFilter === 'all' || g.metadata.engine === selectedEngineFilter;
    return matchesSearch && matchesEngine;
  });

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-sky-500 selection:text-white">
      {/* Top Bar Contract (3 zones) */}
      <Header
        onOpenUpload={() => {
          setActiveGame(null);
          setActiveNav('library');
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }}
        onSelectNav={(nav) => {
          setActiveNav(nav);
          if (nav !== 'library') {
            setActiveGame(null);
          }
        }}
        activeNav={activeNav}
      />

      {/* Main Content Area */}
      <main className="flex-1">
        {/* If Game is actively running */}
        {activeGame ? (
          <GamePlayer
            game={activeGame}
            onBack={() => setActiveGame(null)}
            onDownloadZip={handleDownloadZip}
            onPreview3D={(file) => setPreview3DFile(file)}
            onPreviewAudio={(file) => setPreviewAudioFile(file)}
          />
        ) : (
          <>
            {/* View: Library */}
            {activeNav === 'library' && (
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8 space-y-10">
                {/* Hero / Dropzone area */}
                <div className="space-y-4">
                  <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
                    <div>
                      <div className="flex items-center gap-2 text-xs font-mono text-sky-400 mb-2">
                        <span>ÉMULATION &amp; SANDBOX WEB</span>
                        <span aria-hidden="true">·</span>
                        <span>ZERO-SERVEUR</span>
                      </div>
                      <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
                        Lancez vos jeux ZIP instantanément
                      </h1>
                      <p className="text-sm text-slate-400 mt-2 max-w-2xl leading-relaxed">
                        Exécutez directement dans votre navigateur des jeux en{' '}
                        <strong className="text-white">JS, HTML, Python, Lua, C#, C++, WebAssembly</strong> avec gestion transparente des assets{' '}
                        <strong className="text-white">PNG, JPEG, GLB, GLTF, OBJ, MP3, WAV, JSON</strong>.
                      </p>
                    </div>
                  </div>

                  {/* Drop Zone */}
                  <DropZone onFileSelect={handleZipFile} isLoading={isUploading} />

                  {uploadError && (
                    <div className="p-4 rounded-xl bg-rose-950/40 border border-rose-900/60 text-xs text-rose-300">
                      {uploadError}
                    </div>
                  )}
                </div>

                {/* Game Library Collection */}
                <div className="space-y-6 pt-4 border-t border-slate-800/80">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <h2 className="text-xl font-bold text-white tracking-tight">
                        Bibliothèque de Jeux &amp; Démonstrateurs
                      </h2>
                      <p className="text-xs text-slate-400 mt-1">
                        Sélectionnez un jeu prêt à l'emploi ou glissez votre propre archive ZIP ci-dessus.
                      </p>
                    </div>

                    {/* Filter and Search Bar */}
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
                        <input
                          type="text"
                          placeholder="Rechercher..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500 w-44 sm:w-56"
                        />
                      </div>

                      {/* Interactive engine segmented tabs */}
                      <div className="flex items-center gap-1 p-0.5 bg-slate-900 border border-slate-800 rounded-lg text-xs overflow-x-auto">
                        {[
                          { id: 'all', label: 'Tous' },
                          { id: 'html', label: 'HTML5/JS' },
                          { id: 'wasm', label: 'Wasm/C++' },
                          { id: 'python', label: 'Python' },
                          { id: 'lua', label: 'Lua' },
                          { id: 'csharp', label: 'C#' },
                        ].map((btn) => (
                          <button
                            key={btn.id}
                            onClick={() => setSelectedEngineFilter(btn.id)}
                            className={`px-2.5 py-1 rounded transition-colors whitespace-nowrap cursor-pointer ${
                              selectedEngineFilter === btn.id
                                ? 'bg-slate-800 text-white font-medium'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            {btn.label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Games Grid */}
                  {filteredGames.length > 0 ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                      {filteredGames.map((game) => (
                        <GameCard
                          key={game.metadata.id}
                          game={game}
                          onPlay={(g) => setActiveGame(g)}
                          onDownloadZip={handleDownloadZip}
                          onInspectAssets={(g) => {
                            setActiveGame(g);
                          }}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center rounded-2xl border border-slate-800 bg-slate-900/30">
                      <Gamepad2 className="w-12 h-12 mx-auto text-slate-600 mb-3" />
                      <h4 className="text-sm font-semibold text-white mb-1">Aucun jeu trouvé</h4>
                      <p className="text-xs text-slate-400 max-w-sm mx-auto">
                        Essayez de réinitialiser vos filtres de recherche ou déposez un nouveau fichier ZIP dans la boîte de téléchargement.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* View: Engines Guide */}
            {activeNav === 'engines' && <EnginesGuide />}

            {/* View: Assets Guide */}
            {activeNav === 'assets' && <AssetsGuide />}

            {/* View: Console Logs */}
            {activeNav === 'console' && (
              <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-8">
                <div className="h-[650px]">
                  <ConsoleViewer logs={globalLogs} onClear={() => setGlobalLogs([])} />
                </div>
              </div>
            )}
          </>
        )}
      </main>

      {/* 3D Model Viewer Modal */}
      {preview3DFile && (
        <Model3DViewer file={preview3DFile} onClose={() => setPreview3DFile(null)} />
      )}

      {/* Audio Player Modal */}
      {previewAudioFile && (
        <AudioPlayerModal file={previewAudioFile} onClose={() => setPreviewAudioFile(null)} />
      )}

      {/* Subtle Footer conforming to Anti-Slop (quiet copyright & technical spec) */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-6 mt-12">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">ArcadeZip</span>
            <span aria-hidden="true">·</span>
            <span>Bac à sable d'exécution multi-moteurs Web &amp; VFS</span>
          </div>
          <div className="flex items-center gap-4 text-[11px] font-mono">
            <span>JS / HTML / CSS / WASM / PYTHON / LUA / C# / C++</span>
            <span aria-hidden="true">·</span>
            <span>GLB · GLTF · OBJ · MP3 · WAV</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
