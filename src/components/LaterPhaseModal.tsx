import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { AlertCircle, X, CheckCircle2, ArrowRight } from 'lucide-react';

interface LaterPhaseModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  feature?: string;
  onClose: () => void;
}

export const LaterPhaseModal: React.FC<LaterPhaseModalProps> = ({
  isOpen,
  title,
  description,
  feature,
  onClose,
}) => {
  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md">
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 12 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.94, y: 12 }}
          transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="relative w-full max-w-sm aerix-glass-elevated rounded-3xl p-6 border border-cyan-500/20 text-slate-100 shadow-2xl overflow-hidden"
        >
          {/* Subtle Ambient Glow */}
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-5 right-5 p-2 rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Header Icon */}
          <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4">
            <AlertCircle className="w-6 h-6" />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2 text-xs font-mono text-cyan-400 uppercase tracking-wider">
              <span>Phase 2 Roadmap</span>
              {feature && (
                <>
                  <span>·</span>
                  <span className="text-slate-400">{feature}</span>
                </>
              )}
            </div>

            <h3 className="text-lg font-bold font-display text-white">
              {title}
            </h3>

            <p className="text-sm text-slate-300 leading-relaxed">
              {description}
            </p>
          </div>

          {/* Phase 1 vs Phase 2 clarity points */}
          <div className="mt-5 p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2 text-xs text-slate-300">
            <div className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                <strong>Phase 1 active:</strong> Stable tactile shell, local sandboxes, interactive vectors, and playable offline engines.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowRight className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
              <span>
                <strong>Phase 2 planned:</strong> External server API integration, cloud sync, WebRTC cellular gateways & live satellite streams.
              </span>
            </div>
          </div>

          {/* Action button */}
          <button
            onClick={onClose}
            className="mt-6 w-full py-3 px-4 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-semibold text-sm transition-all shadow-lg shadow-cyan-500/20 active:scale-[0.98]"
          >
            Acknowledge & Continue
          </button>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
