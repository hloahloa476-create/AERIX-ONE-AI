import React, { useState } from 'react';
import {
  Mic,
  Play,
  Pause,
  Download,
  Volume2,
  RefreshCw,
  ChevronLeft,
  X,
  Sliders,
  Sparkles,
  Share2
} from 'lucide-react';
import { soundEffects } from '../../utils/sound';

interface AerixVoiceAppProps {
  onClose: () => void;
}

export const AerixVoiceApp: React.FC<AerixVoiceAppProps> = ({ onClose }) => {
  const [text, setText] = useState('Welcome to AERIX ONE. All cognitive modules and operational nodes are functioning at maximum efficiency.');
  const [voice, setVoice] = useState<'Nova' | 'Atlas' | 'Eclipse' | 'Aurora'>('Nova');
  const [speed, setSpeed] = useState<number>(1.0);
  const [pitch, setPitch] = useState<number>(1.0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [isSynthesizing, setIsSynthesizing] = useState<boolean>(false);

  const handleSpeak = () => {
    if (!text.trim()) return;
    soundEffects.playHapticClick();

    if ('speechSynthesis' in window) {
      if (isPlaying) {
        window.speechSynthesis.cancel();
        setIsPlaying(false);
        return;
      }

      setIsSynthesizing(true);
      window.speechSynthesis.cancel();

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = speed;
      utterance.pitch = pitch;

      // Select voice if available
      const voices = window.speechSynthesis.getVoices();
      if (voices.length > 0) {
        const preferred = voices.find((v) => v.lang.startsWith('en')) || voices[0];
        utterance.voice = preferred;
      }

      utterance.onstart = () => {
        setIsSynthesizing(false);
        setIsPlaying(true);
      };

      utterance.onend = () => {
        setIsPlaying(false);
      };

      utterance.onerror = () => {
        setIsSynthesizing(false);
        setIsPlaying(false);
      };

      window.speechSynthesis.speak(utterance);
    } else {
      // Fallback
      setIsPlaying(!isPlaying);
    }
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
            <div className="w-8 h-8 rounded-xl bg-violet-500/20 border border-violet-500/40 text-violet-400 flex items-center justify-center">
              <Mic className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-white">AERIX VOICE</h1>
              <p className="text-[10px] font-mono text-violet-400">Neural Speech Engine v2.1</p>
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
        {/* Waveform Visualization Box */}
        <div className="p-6 rounded-3xl aerix-glass border border-violet-500/40 bg-slate-950 flex flex-col items-center justify-center space-y-4 shadow-xl">
          <div className="w-full flex items-center justify-center gap-1.5 h-16">
            {[20, 45, 80, 60, 30, 90, 75, 40, 95, 60, 35, 85, 50, 70, 40, 65, 80, 30].map((h, i) => (
              <div
                key={i}
                style={{ height: isPlaying ? `${Math.max(15, (h * Math.random()).toFixed(0))}%` : '20%' }}
                className={`w-1.5 rounded-full transition-all duration-150 ${
                  isPlaying
                    ? 'bg-gradient-to-t from-violet-500 to-fuchsia-400'
                    : 'bg-slate-800'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={handleSpeak}
              disabled={isSynthesizing || !text.trim()}
              className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-violet-500 to-fuchsia-600 hover:from-violet-400 hover:to-fuchsia-500 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-violet-500/20 active:scale-95 transition-all"
            >
              {isSynthesizing ? (
                <RefreshCw className="w-4 h-4 animate-spin" />
              ) : isPlaying ? (
                <Pause className="w-4 h-4 fill-current" />
              ) : (
                <Play className="w-4 h-4 fill-current" />
              )}
              <span>{isPlaying ? 'Pause Audio' : 'Synthesize & Play'}</span>
            </button>
          </div>
        </div>

        {/* Text Input Box */}
        <div className="p-4 rounded-3xl aerix-glass border border-slate-800 space-y-3">
          <label className="text-[11px] font-mono text-violet-400 uppercase tracking-wider block">
            Text to Convert to Speech
          </label>
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            rows={4}
            placeholder="Type or paste text to synthesize with neural voice..."
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-violet-500 resize-none leading-relaxed"
          />

          {/* Neural Persona Selection */}
          <div>
            <span className="text-[10px] font-mono text-slate-400 block mb-1.5">Voice Model Persona</span>
            <div className="grid grid-cols-4 gap-2">
              {(['Nova', 'Atlas', 'Eclipse', 'Aurora'] as const).map((v) => (
                <button
                  key={v}
                  onClick={() => setVoice(v)}
                  className={`py-2 px-3 rounded-2xl text-xs font-mono font-bold transition-all ${
                    voice === v
                      ? 'bg-violet-500 text-white shadow-md shadow-violet-500/20'
                      : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>

          {/* Controls: Speed & Pitch */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Speed</span>
                <span className="text-violet-400">{speed}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={speed}
                onChange={(e) => setSpeed(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
            </div>

            <div>
              <div className="flex justify-between text-[10px] font-mono text-slate-400 mb-1">
                <span>Pitch</span>
                <span className="text-violet-400">{pitch}x</span>
              </div>
              <input
                type="range"
                min="0.5"
                max="1.5"
                step="0.1"
                value={pitch}
                onChange={(e) => setPitch(Number(e.target.value))}
                className="w-full accent-violet-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
