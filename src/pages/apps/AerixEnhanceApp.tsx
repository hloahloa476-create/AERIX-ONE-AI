import React, { useState } from 'react';
import {
  Sliders,
  Sparkles,
  Download,
  RefreshCw,
  ChevronLeft,
  X,
  Eye,
  Check,
  Zap,
  ShieldCheck
} from 'lucide-react';
import { soundEffects } from '../../utils/sound';

interface AerixEnhanceAppProps {
  onClose: () => void;
}

export const AerixEnhanceApp: React.FC<AerixEnhanceAppProps> = ({ onClose }) => {
  const [sliderPos, setSliderPos] = useState<number>(50);
  const [scale, setScale] = useState<'2x' | '4x' | '8x'>('4x');
  const [faceRestore, setFaceRestore] = useState<boolean>(true);
  const [denoise, setDenoise] = useState<boolean>(true);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  const handleEnhance = () => {
    soundEffects.playHapticClick();
    setIsProcessing(true);
    setTimeout(() => {
      setIsProcessing(false);
      soundEffects.playSuccess();
    }, 1600);
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
            <div className="w-8 h-8 rounded-xl bg-blue-500/20 border border-blue-500/40 text-blue-400 flex items-center justify-center">
              <Sliders className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h1 className="text-sm font-bold font-display text-white">AERIX ENHANCE</h1>
                <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Beta
                </span>
              </div>
              <p className="text-[10px] font-mono text-blue-400">Neural Super-Resolution v1.2</p>
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

      {/* Main Studio Viewport */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 max-w-3xl mx-auto w-full space-y-4 pb-24">
        {/* Interactive Before/After Split Viewer */}
        <div className="relative rounded-3xl overflow-hidden aerix-glass border border-blue-500/30 bg-slate-950 aspect-video shadow-2xl select-none">
          {/* Enhanced Image (Background) */}
          <img
            src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=100"
            alt="Enhanced"
            className="absolute inset-0 w-full h-full object-cover filter contrast-125 saturate-110"
          />

          {/* Original Unenhanced Image (Clipped Left) */}
          <div
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <img
              src="https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=1200&q=20"
              alt="Original"
              className="absolute inset-0 w-full h-full object-cover filter blur-[2px] brightness-90 max-w-none"
              style={{ width: '100%', height: '100%' }}
            />
          </div>

          {/* Divider Line */}
          <div
            className="absolute inset-y-0 w-0.5 bg-blue-400 shadow-[0_0_12px_rgba(59,130,246,0.8)] pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-6 h-6 rounded-full bg-blue-500 border-2 border-white shadow-xl flex items-center justify-center">
              <span className="text-[10px] text-white font-bold">⇄</span>
            </div>
          </div>

          {/* Slider input overlaid */}
          <input
            type="range"
            min="0"
            max="100"
            value={sliderPos}
            onChange={(e) => setSliderPos(Number(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-20"
          />

          {/* Labels */}
          <div className="absolute top-3 left-3 px-2 py-1 rounded-lg bg-black/60 backdrop-blur-md text-[10px] font-mono text-slate-300">
            Original (Compressed)
          </div>
          <div className="absolute top-3 right-3 px-2 py-1 rounded-lg bg-blue-600/80 backdrop-blur-md text-[10px] font-mono text-white font-bold">
            AERIX 4K Neural
          </div>
        </div>

        {/* Enhancement Controls */}
        <div className="p-4 rounded-3xl aerix-glass border border-slate-800 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1">Target Upscale</span>
              <div className="grid grid-cols-3 gap-1">
                {(['2x', '4x', '8x'] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => setScale(s)}
                    className={`py-1.5 rounded-xl text-xs font-mono font-bold transition-all ${
                      scale === s
                        ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <span className="text-[10px] font-mono text-slate-400 block mb-1">Neural Modules</span>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={faceRestore}
                  onChange={(e) => setFaceRestore(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-500"
                />
                <span>Facial Detail Restoration</span>
              </label>
              <label className="flex items-center gap-2 text-xs text-slate-300 cursor-pointer">
                <input
                  type="checkbox"
                  checked={denoise}
                  onChange={(e) => setDenoise(e.target.checked)}
                  className="w-3.5 h-3.5 accent-blue-500"
                />
                <span>Sensor Noise Reduction</span>
              </label>
            </div>
          </div>

          <button
            onClick={handleEnhance}
            disabled={isProcessing}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-400 hover:to-indigo-500 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-blue-500/20 active:scale-98 transition-all disabled:opacity-50"
          >
            {isProcessing ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Enhance to Ultra-HD Resolution</span>
          </button>
        </div>
      </div>
    </div>
  );
};
