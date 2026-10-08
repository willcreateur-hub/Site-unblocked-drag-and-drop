import React, { useState } from 'react';
import {
  FileText,
  Image as ImageIcon,
  Box,
  Music,
  Code,
  FileCode,
  Search,
  ExternalLink,
  Edit3,
  Check,
  RotateCcw
} from 'lucide-react';
import { AssetCategory, LoadedGame, VirtualFile } from '../types/game';
import { formatBytes } from '../utils/zipHandler';

interface Props {
  game: LoadedGame;
  onPreview3D: (file: VirtualFile) => void;
  onPreviewAudio: (file: VirtualFile) => void;
  onFileUpdated?: (path: string, newText: string) => void;
}

export const AssetExplorer: React.FC<Props> = ({ game, onPreview3D, onPreviewAudio, onFileUpdated }) => {
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedFile, setSelectedFile] = useState<VirtualFile | null>(game.fileList[0] || null);
  const [editingText, setEditingText] = useState<string>('');
  const [isEditing, setIsEditing] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  const getCategoryIcon = (category: AssetCategory) => {
    switch (category) {
      case 'image':
        return <ImageIcon className="w-4 h-4 text-emerald-400" />;
      case '3d':
        return <Box className="w-4 h-4 text-purple-400" />;
      case 'audio':
        return <Music className="w-4 h-4 text-amber-400" />;
      case 'code':
        return <Code className="w-4 h-4 text-sky-400" />;
      case 'data':
        return <FileCode className="w-4 h-4 text-blue-400" />;
      default:
        return <FileText className="w-4 h-4 text-slate-400" />;
    }
  };

  const filteredFiles = game.fileList.filter((f) => {
    const matchesSearch = f.path.toLowerCase().includes(search.toLowerCase());
    const matchesCat = selectedCategory === 'all' || f.category === selectedCategory;
    return matchesSearch && matchesCat;
  });

  const handleSelectFile = (file: VirtualFile) => {
    setSelectedFile(file);
    setIsEditing(false);
    if (file.text !== undefined) {
      setEditingText(file.text);
    }
  };

  const handleSaveEdit = () => {
    if (!selectedFile || onFileUpdated === undefined) return;
    onFileUpdated(selectedFile.path, editingText);
    selectedFile.text = editingText;
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2000);
  };

  return (
    <div className="flex flex-col lg:flex-row h-full min-h-[550px] bg-slate-950 rounded-xl border border-slate-800 overflow-hidden">
      {/* Left panel: File tree & search */}
      <div className="w-full lg:w-72 border-r border-slate-800 flex flex-col bg-slate-900/30">
        {/* Search & Filter Header */}
        <div className="p-3 border-b border-slate-800 space-y-2">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              placeholder="Filtrer les assets..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-white placeholder-slate-500 focus:outline-none focus:border-sky-500"
            />
          </div>

          {/* Category Tabs */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 text-[11px] scrollbar-none">
            {['all', '3d', 'audio', 'image', 'code', 'data'].map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2 py-0.5 rounded capitalize whitespace-nowrap transition-colors ${
                  selectedCategory === cat
                    ? 'bg-slate-800 text-sky-400 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat === 'all' ? 'Tous' : cat}
              </button>
            ))}
          </div>
        </div>

        {/* Files list */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/40">
          {filteredFiles.map((file) => {
            const isSelected = selectedFile?.path === file.path;
            return (
              <div
                key={file.path}
                onClick={() => handleSelectFile(file)}
                className={`px-3 py-2.5 flex items-center justify-between cursor-pointer transition-colors ${
                  isSelected ? 'bg-sky-500/10 border-l-2 border-sky-400' : 'hover:bg-slate-900/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  {getCategoryIcon(file.category)}
                  <div className="truncate">
                    <p className={`text-xs truncate ${isSelected ? 'text-white font-medium' : 'text-slate-300'}`}>
                      {file.name}
                    </p>
                    <p className="text-[10px] text-slate-500 font-mono truncate">{file.path}</p>
                  </div>
                </div>
                <span className="text-[10px] text-slate-500 font-mono shrink-0 ml-2">
                  {formatBytes(file.size)}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Right panel: File preview / editor */}
      <div className="flex-1 flex flex-col bg-slate-950 p-4">
        {selectedFile ? (
          <div className="flex-1 flex flex-col h-full">
            {/* Header info */}
            <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800">
              <div className="flex items-center gap-2">
                {getCategoryIcon(selectedFile.category)}
                <div>
                  <h4 className="text-sm font-semibold text-white">{selectedFile.name}</h4>
                  <div className="flex items-center gap-2 text-xs text-slate-500 font-mono">
                    <span>{selectedFile.mimeType}</span>
                    <span aria-hidden="true">·</span>
                    <span>{formatBytes(selectedFile.size)}</span>
                  </div>
                </div>
              </div>

              {/* Action buttons depending on file type */}
              <div className="flex items-center gap-2">
                {selectedFile.category === '3d' && (
                  <button
                    onClick={() => onPreview3D(selectedFile)}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Box className="w-3.5 h-3.5" />
                    <span>Ouvrir dans le visualiseur 3D</span>
                  </button>
                )}

                {selectedFile.category === 'audio' && (
                  <button
                    onClick={() => onPreviewAudio(selectedFile)}
                    className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                  >
                    <Music className="w-3.5 h-3.5" />
                    <span>Écouter le son</span>
                  </button>
                )}

                {selectedFile.text !== undefined && (
                  <>
                    {!isEditing ? (
                      <button
                        onClick={() => {
                          setIsEditing(true);
                          setEditingText(selectedFile.text || '');
                        }}
                        className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                        <span>Modifier le code</span>
                      </button>
                    ) : (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={handleSaveEdit}
                          className="px-3 py-1.5 bg-sky-500 hover:bg-sky-400 text-slate-950 font-semibold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
                        >
                          {savedSuccess ? <Check className="w-3.5 h-3.5" /> : <RotateCcw className="w-3.5 h-3.5" />}
                          <span>{savedSuccess ? 'Modifié !' : 'Appliquer &amp; Relancer'}</span>
                        </button>
                        <button
                          onClick={() => setIsEditing(false)}
                          className="px-2.5 py-1.5 text-xs text-slate-400 hover:text-white"
                        >
                          Annuler
                        </button>
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Preview Content */}
            <div className="flex-1 overflow-auto rounded-lg border border-slate-800 bg-slate-900/40 p-4">
              {selectedFile.category === 'image' && (
                <div className="h-full flex flex-col items-center justify-center p-6 bg-slate-950/60 rounded">
                  <img
                    src={selectedFile.blobUrl}
                    alt={selectedFile.name}
                    className="max-h-[380px] max-w-full object-contain rounded border border-slate-800 shadow-md"
                  />
                  <p className="mt-4 text-xs font-mono text-slate-400">{selectedFile.path}</p>
                </div>
              )}

              {selectedFile.category === 'audio' && (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 mb-4">
                    <Music className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-2">{selectedFile.name}</h4>
                  <p className="text-xs text-slate-400 mb-6">Fichier audio prêt pour l'intégration in-game</p>
                  <button
                    onClick={() => onPreviewAudio(selectedFile)}
                    className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
                  >
                    <Music className="w-4 h-4" />
                    <span>Lancer le lecteur audio</span>
                  </button>
                </div>
              )}

              {selectedFile.category === '3d' && (
                <div className="h-full flex flex-col items-center justify-center p-8 text-center">
                  <div className="w-16 h-16 rounded-2xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-4">
                    <Box className="w-8 h-8" />
                  </div>
                  <h4 className="text-base font-semibold text-white mb-2">{selectedFile.name}</h4>
                  <p className="text-xs text-slate-400 mb-6">
                    Maillage 3D compatible avec le moteur WebGL Three.js
                  </p>
                  <button
                    onClick={() => onPreview3D(selectedFile)}
                    className="px-5 py-2.5 bg-purple-500 hover:bg-purple-400 text-white font-bold rounded-xl text-xs flex items-center gap-2 shadow-lg"
                  >
                    <Box className="w-4 h-4" />
                    <span>Explorer le modèle 3D interactif</span>
                  </button>
                </div>
              )}

              {selectedFile.text !== undefined && selectedFile.category !== 'image' && selectedFile.category !== 'audio' && (
                <div className="h-full flex flex-col">
                  {isEditing ? (
                    <textarea
                      value={editingText}
                      onChange={(e) => setEditingText(e.target.value)}
                      className="w-full h-full p-3 bg-slate-950 font-mono text-xs text-slate-200 border border-slate-800 rounded resize-none focus:outline-none focus:border-sky-500 leading-relaxed"
                      spellCheck={false}
                    />
                  ) : (
                    <pre className="font-mono text-xs text-slate-300 whitespace-pre-wrap break-all leading-relaxed p-2 select-text">
                      {selectedFile.text}
                    </pre>
                  )}
                </div>
              )}

              {selectedFile.text === undefined && selectedFile.category === 'other' && (
                <div className="h-full flex flex-col items-center justify-center text-slate-500 text-xs">
                  <p>Aperçu non disponible pour ce binaire.</p>
                  <p className="mt-1 font-mono text-[11px] text-slate-600">{selectedFile.mimeType}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="h-full flex items-center justify-center text-slate-500 text-xs">
            Sélectionnez un fichier dans la liste de gauche pour l'inspecter.
          </div>
        )}
      </div>
    </div>
  );
};
