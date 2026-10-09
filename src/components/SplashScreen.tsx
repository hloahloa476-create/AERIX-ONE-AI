import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Cpu, ChevronRight } from 'lucide-react';

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [progress, setProgress] = useState(0);
  const [bootText, setBootText] = useState('Initializing AERIX Microkernel...');

  const handleFinish = () => {
    try {
      sessionStorage.setItem('aerix_booted', 'true');
    } catch {
      // ignore
    }
    onComplete();
  };

  useEffect(() => {
    const steps = [
      { at: 20, text: 'Mounting Local Sandboxes & Storage...' },
      { at: 50, text: 'Calibrating Vector Cartography Mesh...' },
      { at: 75, text: 'Synchronizing Neural Cognitive Cache...' },
      { at: 95, text: 'Readying Tactile Interface...' },
      { at: 100, text: 'System Operational' }
    ];

    const timer = setInterval(() => {
      setProgress((prev) => {
        const next = prev + 10;
        const currentStep = steps.find((s) => s.at <= next);
        if (currentStep) {
          setBootText(currentStep.text);
        }
        if (next >= 100) {
          clearInterval(timer);
          setTimeout(handleFinish, 200);
          return 100;
        }
        return next;
      });
    }, 35);

    return () => clearInterval(timer);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0, scale: 1.02 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        onClick={handleFinish}
        className="fixed inset-0 z-50 flex flex-col items-center justify-between p-8 bg-[#030712] text-slate-100 overflow-hidden select-none cursor-pointer"
      >
        {/* Futuristic Background Glow */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-1/3 left-1/2 -translate-x-1/2 w-80 h-80 bg-blue-600/10 rounded-full blur-[90px] pointer-events-none" />

        {/* Top Header metadata */}
        <div className="w-full max-w-sm flex items-center justify-between text-xs text-slate-400">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="font-mono uppercase tracking-wider text-[11px] text-cyan-400">Node Alpha · Standalone</span>
          </div>
          <span className="font-mono text-[11px] text-slate-400">Phase 1</span>
        </div>

        {/* Center Hero Identity */}
        <div className="flex flex-col items-center text-center my-auto">
          {/* Emblem Icon */}
          <div className="relative mb-6">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-500/20 via-blue-500/20 to-indigo-500/10 border border-cyan-500/30 flex items-center justify-center shadow-lg shadow-cyan-500/20 backdrop-blur-md overflow-hidden">
              <img
                src="/src/assets/images/aerix_one_logo_1791197135811.jpg"
                alt="AERIX ONE Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div className="absolute -inset-1 rounded-2xl bg-cyan-400/20 filter blur-sm -z-10" />
          </div>

          <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight font-display bg-clip-text text-transparent bg-gradient-to-b from-white via-slate-100 to-slate-400">
            AERIX ONE
          </h1>

          <p className="mt-3 text-base text-cyan-300 font-medium tracking-wide">
            Everything. One Intelligence.
          </p>

          <p className="mt-2 text-xs text-slate-400 max-w-xs font-mono">
            Next-Generation Futuristic Mobile OS Foundation
          </p>
        </div>

        {/* Bottom Loading Bar & Skip Button */}
        <div className="w-full max-w-sm flex flex-col items-center gap-4">
          <div className="w-full flex items-center justify-between text-xs font-mono text-slate-400">
            <span className="truncate max-w-[240px] text-slate-300">{bootText}</span>
            <span className="text-cyan-400 font-semibold">{progress}%</span>
          </div>

          {/* Progress track */}
          <div className="w-full h-1.5 bg-slate-800/80 rounded-full overflow-hidden border border-slate-700/50">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full transition-all duration-75"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Skip CTA */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              handleFinish();
            }}
            className="mt-2 text-xs font-medium text-slate-400 hover:text-cyan-300 flex items-center gap-1 transition-colors px-3 py-1.5 rounded-lg border border-transparent hover:border-slate-800"
          >
            Enter Dashboard Directly
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </motion.div>
    </AnimatePresence>
  );
};
