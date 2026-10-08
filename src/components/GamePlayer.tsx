import React, { useEffect, useRef, useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Maximize2,
  Minimize2,
  Volume2,
  VolumeX,
  Download,
  Terminal,
  Layers,
  Gamepad2,
  HelpCircle,
  ExternalLink
} from 'lucide-react';
import { LoadedGame, LogMessage, VirtualFile } from '../types/game';
import { prepareHtmlRunner } from '../engines/htmlEngine';
import { preparePythonRunner } from '../engines/pythonEngine';
import { prepareLuaRunner } from '../engines/luaEngine';
import { prepareCppWasmRunner } from '../engines/cppWasmEngine';
import { prepareCSharpRunner } from '../engines/csharpEngine';
import { AssetExplorer } from './AssetExplorer';
import { ConsoleViewer } from './ConsoleViewer';
import { formatBytes } from '../utils/zipHandler';

interface Props {
  game: LoadedGame;
  onBack: () => void;
  onDownloadZip: (game: LoadedGame) => void;
  onPreview3D: (file: VirtualFile) => void;
  onPreviewAudio: (file: VirtualFile) => void;
}

export const GamePlayer: React.FC<Props> = ({
  game,
  onBack,
  onDownloadZip,
  onPreview3D,
  onPreviewAudio,
}) => {
  const [activeTab, setActiveTab] = useState<'game' | 'assets' | 'console' | 'docs'>('game');
  const [runnerHtml, setRunnerHtml] = useState<string>('');
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [logs, setLogs] = useState<LogMessage[]>([]);
  const [reloadKey, setReloadKey] = useState(0);

  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Generate sandbox HTML based on engine
  useEffect(() => {
    let html = '';
    const { engine, entryFile } = game.metadata;

    switch (engine) {
      case 'html':
      case 'js':
        html = prepareHtmlRunner(game.fileList, entryFile);
        break;
      case 'python':
        html = preparePythonRunner(game.fileList, entryFile);
        break;
      case 'lua':
        html = prepareLuaRunner(game.fileList, entryFile);
        break;
      case 'wasm':
      case 'cpp':
        html = prepareCppWasmRunner(game.fileList, entryFile);
        break;
      case 'csharp':
        html = prepareCSharpRunner(game.fileList, entryFile);
        break;
      default:
        html = prepareHtmlRunner(game.fileList, entryFile);
        break;
    }

    setRunnerHtml(html);

    // Initial log
    setLogs([
      {
        id: 'init_1',
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: `Moteur initialisé : [${engine.toUpperCase()}] avec le point d'entrée "${entryFile}" (${game.fileList.length} assets montés dans le VFS).`,
      },
    ]);
  }, [game, reloadKey]);

  // Listen to postMessage from iframe
  useEffect(() => {
    const handleMessage = (e: MessageEvent) => {
      if (e.data && e.data.type === 'ARCADE_CONSOLE') {
        setLogs((prev) => [
          ...prev.slice(-150),
          {
            id: 'log_' + Math.random().toString(36).substring(2, 9),
            timestamp: e.data.timestamp || new Date().toLocaleTimeString(),
            level: e.data.level || 'info',
            message: e.data.message || '',
          },
        ]);
      } else if (e.data && e.data.type === 'ARCADE_READY') {
        setLogs((prev) => [
          ...prev,
          {
            id: 'ready_' + Date.now(),
            timestamp: new Date().toLocaleTimeString(),
            level: 'info',
            message: 'Bac à sable prêt : les intercepteurs VFS (Fetch, XHR, Image, Audio) sont actifs.',
          },
        ]);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, []);

  const handleRestart = () => {
    setReloadKey((k) => k + 1);
  };

  const handleToggleFullscreen = () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      containerRef.current.requestFullscreen().then(() => setIsFullscreen(true)).catch(() => {});
    } else {
      document.exitFullscreen().then(() => setIsFullscreen(false)).catch(() => {});
    }
  };

  const handleFileUpdated = (path: string, newText: string) => {
    const file = game.files.get(path);
    if (file) {
      file.text = newText;
      file.rawBytes = new TextEncoder().encode(newText);
      const blob = new Blob([file.rawBytes as any], { type: file.mimeType });
      file.blobUrl = URL.createObjectURL(blob);
    }
    // Hot reload
    setLogs((prev) => [
      ...prev,
      {
        id: 'reload_' + Date.now(),
        timestamp: new Date().toLocaleTimeString(),
        level: 'info',
        message: `Fichier ${path} sauvegardé. Redémarrage du sandbox...`,
      },
    ]);
    handleRestart();
  };

  return (
    <div className="w-full max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-6">
      {/* Top Bar Navigation & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Retour à la bibliothèque"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
              <span className="uppercase text-sky-400 font-semibold">{game.metadata.engine}</span>
              <span aria-hidden="true">·</span>
              <span>{game.metadata.filesCount} fichiers</span>
              <span aria-hidden="true">·</span>
              <span>{formatBytes(game.metadata.totalSize)}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{game.metadata.title}</h2>
          </div>
        </div>

        {/* Player action buttons */}
        <div className="flex items-center gap-2">
          <button
            onClick={handleRestart}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Redémarrer le jeu"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Relancer</span>
          </button>
          <button
            onClick={() => onDownloadZip(game)}
            className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
            title="Télécharger l'archive ZIP"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Télécharger ZIP</span>
          </button>
          <button
            onClick={handleToggleFullscreen}
            className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
            title="Plein écran"
          >
            {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Main Player Container */}
      <div
        ref={containerRef}
        className={`relative w-full rounded-2xl border border-slate-800 bg-slate-950 overflow-hidden shadow-2xl flex flex-col ${
          isFullscreen ? 'h-screen p-0 border-0 rounded-none' : 'min-h-[560px]'
        }`}
      >
        {/* Sub-header Tabs (Interactive filter / view switch) */}
        {!isFullscreen && (
          <div className="flex items-center justify-between px-4 py-2.5 bg-slate-900/60 border-b border-slate-800">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setActiveTab('game')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'game' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Gamepad2 className="w-3.5 h-3.5 text-sky-400" />
                <span>Vue Jeu</span>
              </button>
              <button
                onClick={() => setActiveTab('assets')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'assets' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Layers className="w-3.5 h-3.5 text-purple-400" />
                <span>Assets &amp; Fichiers ({game.fileList.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('console')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'console' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <Terminal className="w-3.5 h-3.5 text-emerald-400" />
                <span>Console ({logs.length})</span>
              </button>
              <button
                onClick={() => setActiveTab('docs')}
                className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
                  activeTab === 'docs' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                <span>Architecture VFS</span>
              </button>
            </div>

            <div className="hidden sm:flex items-center gap-2 text-xs font-mono text-slate-500">
              <span>Bac à sable 60 FPS</span>
              <span aria-hidden="true">·</span>
              <span className="text-sky-400">{game.metadata.entryFile}</span>
            </div>
          </div>
        )}

        {/* Tab 1: Live Game Sandbox */}
        <div className={`relative flex-1 ${activeTab === 'game' || isFullscreen ? 'block' : 'hidden'}`}>
          {runnerHtml ? (
            <iframe
              ref={iframeRef}
              key={reloadKey}
              srcDoc={runnerHtml}
              title={game.metadata.title}
              sandbox="allow-scripts allow-pointer-lock"
              className="w-full h-[620px] sm:h-[680px] border-0 bg-slate-950"
            />
          ) : (
            <div className="h-[600px] flex items-center justify-center text-slate-500 text-sm">
              Chargement du bac à sable...
            </div>
          )}
        </div>

        {/* Tab 2: Assets & Files Explorer */}
        {!isFullscreen && activeTab === 'assets' && (
          <div className="p-4 flex-1">
            <AssetExplorer
              game={game}
              onPreview3D={onPreview3D}
              onPreviewAudio={onPreviewAudio}
              onFileUpdated={handleFileUpdated}
            />
          </div>
        )}

        {/* Tab 3: Console Logs */}
        {!isFullscreen && activeTab === 'console' && (
          <div className="p-4 flex-1 h-[620px]">
            <ConsoleViewer logs={logs} onClear={() => setLogs([])} />
          </div>
        )}

        {/* Tab 4: VFS Architecture Docs */}
        {!isFullscreen && activeTab === 'docs' && (
          <div className="p-6 flex-1 bg-slate-950/60 overflow-y-auto space-y-6 text-sm text-slate-300">
            <div>
              <h3 className="text-base font-semibold text-white mb-2">Comment fonctionne le moteur ArcadeZip ?</h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Lorsque vous déposez une archive ZIP contenant un jeu, ArcadeZip déploie un système de virtualisation de fichiers ultra-rapide directement en mémoire sans envoyer vos fichiers sur un serveur distant.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-sky-400 uppercase tracking-wider font-mono">
                  1. Intercepteur de requêtes (VFS)
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Toutes les requêtes <code className="text-sky-300">fetch()</code>, <code className="text-sky-300">XMLHttpRequest</code>, les balises <code className="text-sky-300">&lt;img&gt;</code>, les objets <code className="text-sky-300">new Audio()</code> et les chargeurs 3D Three.js (<code className="text-sky-300">GLTFLoader</code>, <code className="text-sky-300">OBJLoader</code>) sont interceptés à la volée. Les chemins relatifs (ex: <code className="text-slate-300">./assets/hero.png</code> ou <code className="text-slate-300">models/player.glb</code>) sont automatiquement résolus vers les Blobs mémoire du ZIP.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-purple-400 uppercase tracking-wider font-mono">
                  2. Support Multi-Moteurs
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Le système détecte automatiquement si votre ZIP contient du HTML5/JS classique, des modules WebAssembly natifs (.wasm), des scripts Python 3 (.py), du code Lua Love2D/Pico-8 (.lua), du C# Unity-style (.cs) ou du C++ Raylib (.cpp).
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider font-mono">
                  3. Gestion des Médias &amp; 3D
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Les formats <strong className="text-white">PNG, JPEG, GLB, GLTF, OBJ, FBX, MP3, WAV, JSON</strong> sont nativement supportés et prévisualisables avec rotation 3D orbitale, affichage filaire, et spectre audio.
                </p>
              </div>

              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-2">
                <h4 className="text-xs font-semibold text-amber-400 uppercase tracking-wider font-mono">
                  4. Modification en direct &amp; Exportation
                </h4>
                <p className="text-xs text-slate-400 leading-relaxed">
                  Dans l'onglet "Assets &amp; Fichiers", vous pouvez éditer n'importe quel fichier de configuration ou script de jeu, appliquer les changements en temps réel sans recharger la page, et réexporter votre jeu complet en ZIP avec le bouton "Télécharger ZIP".
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
