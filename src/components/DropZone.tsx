import React, { useRef, useState } from 'react';
import { UploadCloud, FolderArchive, Cpu, Box, Music, Code2 } from 'lucide-react';

interface Props {
  onFileSelect: (file: File) => void;
  isLoading?: boolean;
}

export const DropZone: React.FC<Props> = ({ onFileSelect, isLoading }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const file = e.dataTransfer.files[0];
      if (file.name.toLowerCase().endsWith('.zip') || file.type.includes('zip')) {
        onFileSelect(file);
      } else {
        // Still accept if dropped archive or custom zip
        onFileSelect(file);
      }
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      onFileSelect(e.target.files[0]);
    }
  };

  return (
    <div
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`relative w-full rounded-2xl border-2 border-dashed transition-all duration-200 cursor-pointer overflow-hidden p-8 sm:p-12 text-center ${
        isDragOver
          ? 'border-sky-400 bg-sky-500/10 scale-[1.005]'
          : 'border-slate-800 bg-slate-900/40 hover:border-slate-700 hover:bg-slate-900/60'
      }`}
    >
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleInputChange}
        accept=".zip,application/zip,application/x-zip-compressed"
        className="hidden"
      />

      <div className="max-w-xl mx-auto flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-5">
          <UploadCloud className={`w-8 h-8 ${isLoading ? 'animate-bounce' : ''}`} />
        </div>

        <h3 className="text-xl font-bold text-white mb-2">
          {isLoading ? 'Extraction et virtualisation de l\'archive...' : 'Glissez-déposez votre archive ZIP de jeu ici'}
        </h3>
        <p className="text-sm text-slate-400 mb-6 max-w-md">
          Ou cliquez pour parcourir vos fichiers locaux. Le bac à sable extrait l'arborescence, résout les chemins relatifs et lance le moteur adapté.
        </p>

        {/* Feature grid with zero-pill unboxed metadata */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-lg text-left text-xs text-slate-400">
          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-sky-400 font-semibold mb-1">
              <Cpu className="w-3.5 h-3.5" />
              <span>Moteurs</span>
            </div>
            <p className="text-[11px] text-slate-500">JS · HTML · Wasm · Python · Lua · C# · C++</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-purple-400 font-semibold mb-1">
              <Box className="w-3.5 h-3.5" />
              <span>Modèles 3D</span>
            </div>
            <p className="text-[11px] text-slate-500">GLB · GLTF · OBJ · FBX</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold mb-1">
              <Code2 className="w-3.5 h-3.5" />
              <span>Images &amp; Données</span>
            </div>
            <p className="text-[11px] text-slate-500">PNG · JPEG · JSON · XML</p>
          </div>

          <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800/80">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold mb-1">
              <Music className="w-3.5 h-3.5" />
              <span>Audio</span>
            </div>
            <p className="text-[11px] text-slate-500">MP3 · WAV · OGG</p>
          </div>
        </div>
      </div>
    </div>
  );
};
