import React, { useEffect, useRef, useState } from 'react';
import { Volume2, VolumeX, Play, Pause, RotateCcw, Music } from 'lucide-react';
import { VirtualFile } from '../types/game';

interface Props {
  file: VirtualFile;
  onClose: () => void;
}

export const AudioPlayerModal: React.FC<Props> = ({ file, onClose }) => {
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(0.8);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoop, setIsLoop] = useState(false);

  useEffect(() => {
    const audio = new Audio(file.blobUrl);
    audioRef.current = audio;
    audio.volume = volume;

    audio.onloadedmetadata = () => {
      setDuration(audio.duration);
    };

    audio.ontimeupdate = () => {
      setCurrentTime(audio.currentTime);
    };

    audio.onended = () => {
      if (!isLoop) setIsPlaying(false);
    };

    audio.play().then(() => setIsPlaying(true)).catch(() => {});

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, [file]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play();
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const time = parseFloat(e.target.value);
    setCurrentTime(time);
    if (audioRef.current) audioRef.current.currentTime = time;
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const vol = parseFloat(e.target.value);
    setVolume(vol);
    if (audioRef.current) audioRef.current.volume = vol;
    if (vol === 0) setIsMuted(true);
    else setIsMuted(false);
  };

  const toggleMute = () => {
    if (!audioRef.current) return;
    if (isMuted) {
      audioRef.current.muted = false;
      setIsMuted(false);
    } else {
      audioRef.current.muted = true;
      setIsMuted(true);
    }
  };

  const formatTime = (secs: number) => {
    if (isNaN(secs)) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-xl overflow-hidden shadow-2xl p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Music className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-white truncate max-w-xs">{file.name}</h3>
              <p className="text-xs text-slate-400 font-mono">
                {file.extension.toUpperCase()} · {(file.size / 1024).toFixed(1)} Ko
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-xs text-slate-400 hover:text-white px-2 py-1 rounded hover:bg-slate-800 transition-colors"
          >
            Fermer
          </button>
        </div>

        {/* Animated Waveform Simulation */}
        <div className="h-20 bg-slate-950 rounded-lg border border-slate-800/80 mb-6 flex items-center justify-center gap-1.5 px-4 overflow-hidden">
          {Array.from({ length: 36 }).map((_, i) => {
            const height = isPlaying
              ? Math.sin(i * 0.4 + currentTime * 8) * 24 + 30
              : 8 + (i % 5) * 4;
            return (
              <div
                key={i}
                className="w-1.5 rounded-full transition-all duration-75"
                style={{
                  height: `${height}px`,
                  backgroundColor: isPlaying ? '#818cf8' : '#334155',
                }}
              />
            );
          })}
        </div>

        {/* Scrubber */}
        <div className="space-y-1 mb-6">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeek}
            className="w-full accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[11px] font-mono text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(duration)}</span>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                if (audioRef.current) audioRef.current.currentTime = 0;
              }}
              className="p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Recommencer"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
            <button
              onClick={togglePlay}
              className="w-12 h-12 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white flex items-center justify-center shadow-lg transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5 ml-0.5" />}
            </button>
            <button
              onClick={() => {
                const next = !isLoop;
                setIsLoop(next);
                if (audioRef.current) audioRef.current.loop = next;
              }}
              className={`px-3 py-1.5 text-xs font-mono rounded-lg transition-colors ${
                isLoop ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30' : 'text-slate-400 hover:text-white'
              }`}
            >
              Boucle
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggleMute} className="text-slate-400 hover:text-white">
              {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
            </button>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={isMuted ? 0 : volume}
              onChange={handleVolumeChange}
              className="w-20 accent-indigo-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
