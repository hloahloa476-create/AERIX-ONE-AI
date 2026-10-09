import React, { useState } from 'react';
import {
  Scissors,
  Download,
  Sparkles,
  RefreshCw,
  ChevronLeft,
  X,
  Layers,
  Wand2,
  Check
} from 'lucide-react';
import { soundEffects } from '../../utils/sound';

interface AerixRemoveAppProps {
  onClose: () => void;
}

export const AerixRemoveApp: React.FC<AerixRemoveAppProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'Cutout' | 'Original' | 'Mask'>('Cutout');
  const [isProcessing, setIsProcessing] = useState(false);

  const handleProcess = () => {
    soundEffects.playHapticClick();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      soundEffects.playSuccess();
    }, 1200);
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
            <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/40 text-rose-400 flex items-center justify-center">
              <Scissors className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-white">AERIX REMOVE</h1>
              <p className="text-[10px] font-mono text-rose-400">Semantic Segmentation & Matting v1.9</p>
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
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 max-w-3xl mx-auto w-full space-y-4 pb-24">
        {/* Preview Viewport with Checkerboard Background */}
        <div className="relative rounded-3xl overflow-hidden aerix-glass border border-rose-500/30 aspect-square md:aspect-video flex items-center justify-center shadow-2xl bg-[radial-gradient(#334155_1px,transparent_1px)] [background-size:16px_16px] bg-slate-950">
          {isProcessing ? (
            <div className="text-center space-y-2">
              <RefreshCw className="w-8 h-8 text-rose-400 animate-spin mx-auto" />
              <p className="text-xs font-mono text-rose-300">Detecting subject alpha matte boundaries...</p>
            </div>
          ) : (
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=1000&q=80"
              alt="Cutout Subject"
              className={`max-h-[85%] object-contain transition-all duration-300 ${
                mode === 'Cutout'
                  ? 'drop-shadow-[0_20px_30px_rgba(0,0,0,0.8)]'
                  : mode === 'Mask'
                  ? 'filter invert contrast-200'
                  : ''
              }`}
            />
          )}

          {/* Mode Switcher floating pills */}
          <div className="absolute top-3 inset-x-0 flex justify-center gap-2">
            {(['Cutout', 'Original', 'Mask'] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`py-1 px-3 rounded-xl text-[10px] font-mono font-bold backdrop-blur-md transition-all ${
                  mode === m
                    ? 'bg-rose-500 text-white shadow-lg shadow-rose-500/30'
                    : 'bg-black/60 text-slate-300 hover:text-white border border-slate-700'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        {/* Action Controls */}
        <div className="p-4 rounded-3xl aerix-glass border border-slate-800 space-y-3">
          <div className="flex items-center justify-between text-xs text-slate-300">
            <span>Subject Detection Confidence</span>
            <span className="text-rose-400 font-mono font-bold">99.4% (Fine Hair Edge)</span>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={handleProcess}
              disabled={isProcessing}
              className="py-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-rose-500/40 text-xs font-bold text-white flex items-center justify-center gap-2 active:scale-95 transition-all"
            >
              <Wand2 className="w-3.5 h-3.5 text-rose-400" />
              <span>Re-analyze Edges</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playSuccess();
              }}
              className="py-2.5 rounded-2xl bg-gradient-to-r from-rose-500 to-pink-600 hover:from-rose-400 hover:to-pink-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-rose-500/20 active:scale-95 transition-all"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download Transparent PNG</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
