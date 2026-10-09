import React, { useState } from 'react';
import {
  Video,
  Play,
  Pause,
  Sparkles,
  Sliders,
  Camera,
  ChevronLeft,
  X,
  Layers,
  Clock,
  Film,
  Download,
  RefreshCw,
  Plus
} from 'lucide-react';
import { soundEffects } from '../../utils/sound';

interface AerixVideoAppProps {
  onClose: () => void;
}

export const AerixVideoApp: React.FC<AerixVideoAppProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('An ethereal glass observatory descending through clouds over Mount Fuji during sunrise, slow zoom-out');
  const [cameraMotion, setCameraMotion] = useState<'Dolly Out' | 'Pan Right' | 'Orbit 360' | 'FPV Dive'>('Dolly Out');
  const [duration, setDuration] = useState<number>(5);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  const [storyboardShots, setStoryboardShots] = useState([
    { id: 1, title: 'Shot 1: Atmospheric Entry', motion: 'FPV Dive', duration: '3.5s' },
    { id: 2, title: 'Shot 2: Observatory Establishing', motion: 'Orbit 360', duration: '4.0s' },
    { id: 3, title: 'Shot 3: Interior Hologram Beacon', motion: 'Dolly In', duration: '5.0s' }
  ]);

  const handleGenerate = () => {
    soundEffects.playHapticClick();
    setIsGenerating(true);
    setTimeout(() => {
      setIsGenerating(false);
      soundEffects.playSuccess();
    }, 2200);
  };

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] text-slate-100 flex flex-col font-sans select-none overflow-hidden animate-fadeIn">
      {/* Header */}
      <header className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl aerix-glass border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-400 flex items-center justify-center">
              <Video className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold font-display text-white">AERIX VIDEO</h1>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Beta
                </span>
              </div>
              <p className="text-[10px] font-mono text-slate-400">Cinematic Sequencer v0.9.4</p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl aerix-glass border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Main Studio View */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 max-w-4xl mx-auto w-full space-y-4 pb-24">
        {/* Cinematic Video Player */}
        <div className="relative rounded-3xl overflow-hidden aerix-glass border border-amber-500/30 bg-slate-950 aspect-video flex items-center justify-center shadow-2xl">
          <img
            src="https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80"
            alt="Preview"
            className="w-full h-full object-cover filter brightness-75"
          />

          {isGenerating ? (
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm flex flex-col items-center justify-center space-y-3">
              <RefreshCw className="w-10 h-10 text-amber-400 animate-spin" />
              <p className="text-xs font-mono text-amber-300">Rendering neural 3D video keyframes (4K)...</p>
            </div>
          ) : (
            <button
              onClick={() => setIsPlaying(!isPlaying)}
              className="absolute w-14 h-14 rounded-2xl bg-amber-500/90 hover:bg-amber-400 text-slate-950 flex items-center justify-center shadow-xl shadow-amber-500/30 transition-transform active:scale-95"
            >
              {isPlaying ? <Pause className="w-6 h-6 fill-current" /> : <Play className="w-6 h-6 fill-current ml-0.5" />}
            </button>
          )}

          {/* Timeline scrub overlay */}
          <div className="absolute bottom-0 inset-x-0 p-3 bg-gradient-to-t from-black/90 to-transparent flex items-center justify-between text-[11px] font-mono text-amber-200">
            <span>00:03.20</span>
            <div className="flex-1 mx-4 h-1 bg-slate-800 rounded-full overflow-hidden">
              <div className="h-full bg-amber-400 w-1/3 rounded-full" />
            </div>
            <span>00:05.00</span>
          </div>
        </div>

        {/* Video Prompt & Storyboard Controls */}
        <div className="p-4 rounded-3xl aerix-glass border border-slate-800 space-y-3">
          <label className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">
            Scene Description Prompt
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={2}
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
          />

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1">Camera Motion</span>
              <select
                value={cameraMotion}
                onChange={(e) => setCameraMotion(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Dolly Out">Dolly Out (Smooth)</option>
                <option value="Pan Right">Pan Right (Cinematic)</option>
                <option value="Orbit 360">Orbit 360° (Volumetric)</option>
                <option value="FPV Dive">FPV Dynamic Dive</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1">
                Duration: {duration}s
              </span>
              <input
                type="range"
                min="3"
                max="15"
                value={duration}
                onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-amber-500 cursor-pointer mt-1"
              />
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin text-slate-950" /> : <Sparkles className="w-4 h-4" />}
            <span>Render AI Video Scene</span>
          </button>
        </div>

        {/* Storyboard Shots Sequence */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
              Sequence Storyboard ({storyboardShots.length} Shots)
            </h3>
            <button
              onClick={() => {
                setStoryboardShots((prev) => [
                  ...prev,
                  { id: prev.length + 1, title: `Shot ${prev.length + 1}: Final Climax`, motion: 'Pan Right', duration: '4.0s' }
                ]);
              }}
              className="text-[11px] font-semibold text-amber-400 hover:underline flex items-center gap-1"
            >
              <Plus className="w-3 h-3" />
              <span>Add Shot</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
            {storyboardShots.map((shot) => (
              <div key={shot.id} className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 space-y-1">
                <span className="text-[10px] font-mono text-amber-400 block font-bold">
                  {shot.duration} • {shot.motion}
                </span>
                <p className="text-xs text-white font-medium truncate">{shot.title}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
