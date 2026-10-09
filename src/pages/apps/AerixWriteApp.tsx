import React, { useState } from 'react';
import {
  PenTool,
  Sparkles,
  Copy,
  Check,
  RefreshCw,
  ChevronLeft,
  X,
  Sliders,
  AlignLeft,
  BookOpen,
  FileText
} from 'lucide-react';
import { soundEffects } from '../../utils/sound';

interface AerixWriteAppProps {
  onClose: () => void;
}

export const AerixWriteApp: React.FC<AerixWriteAppProps> = ({ onClose }) => {
  const [topic, setTopic] = useState('Executive summary of decentralized edge intelligence for aerospace telematics');
  const [format, setFormat] = useState<'Article' | 'Email' | 'Ad Hook' | 'Documentation'>('Article');
  const [tone, setTone] = useState<'Executive' | 'Persuasive' | 'Technical' | 'Creative'>('Executive');
  const [isGenerating, setIsGenerating] = useState(false);
  const [copied, setCopied] = useState(false);

  const [output, setOutput] = useState(`### Executive Brief: Decentralized Edge Intelligence in Aerospace Telematics

**Strategic Overview**
As next-generation orbital platforms and suborbital vehicles transition toward autonomous station-keeping, centralized cloud telemetry manifests latency and bandwidth bottlenecks. AERIX ONE edge neural clusters enable localized sub-millisecond inference directly within on-board telemetry controllers.

**Key Technical Pillars:**
1. **Zero-Latency Telemetry Triaging:** On-device fault detection isolates anomalous sensor drift in under 1.2ms without uplink roundtrips.
2. **Resilient Offline Autonomy:** Continues self-healing navigation during ground station signal occlusion.
3. **Adaptive Cryptographic Tunneling:** Dynamic telemetry hashing enforces quantum-resistant node authorization.

**Implementation Roadmap:**
Deploy phase-one micro-models to avionics flight computers by Q4, with fleet-wide telemetry consensus slated for subsequent rollout.`);

  const handleGenerate = () => {
    if (!topic.trim()) return;
    soundEffects.playHapticClick();
    setIsGenerating(true);

    setTimeout(() => {
      setIsGenerating(false);
      soundEffects.playSuccess();
    }, 1200);
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const wordCount = output.split(/\s+/).filter(Boolean).length;

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
              <PenTool className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-white">AERIX WRITE</h1>
              <p className="text-[10px] font-mono text-amber-400">Cognitive Writing Engine v2.5</p>
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
        {/* Topic Input Box */}
        <div className="p-4 rounded-3xl aerix-glass border border-slate-800 space-y-3">
          <label className="text-[11px] font-mono text-amber-400 uppercase tracking-wider block">
            What do you want to write?
          </label>
          <textarea
            value={topic}
            onChange={(e) => setTopic(e.target.value)}
            rows={2}
            placeholder="Enter a topic, thesis, or outline prompt..."
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
          />

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1">Format</span>
              <select
                value={format}
                onChange={(e) => setFormat(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Article">Long-Form Article</option>
                <option value="Email">High-Impact Email</option>
                <option value="Ad Hook">Marketing Hook & Copy</option>
                <option value="Documentation">Technical Documentation</option>
              </select>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1">Tone of Voice</span>
              <select
                value={tone}
                onChange={(e) => setTone(e.target.value as any)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-white focus:outline-none focus:border-amber-500"
              >
                <option value="Executive">Executive & Authoritative</option>
                <option value="Persuasive">Persuasive & Engaging</option>
                <option value="Technical">Technical & Rigorous</option>
                <option value="Creative">Creative & Evocative</option>
              </select>
            </div>
          </div>

          <button
            onClick={handleGenerate}
            disabled={isGenerating || !topic.trim()}
            className="w-full py-2.5 rounded-2xl bg-gradient-to-r from-amber-500 to-yellow-600 hover:from-amber-400 hover:to-yellow-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-amber-500/20 active:scale-98 transition-all disabled:opacity-50"
          >
            {isGenerating ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            <span>Synthesize Content Draft</span>
          </button>
        </div>

        {/* Output Document Area */}
        <div className="p-5 rounded-3xl aerix-glass border border-amber-500/30 bg-slate-950/80 space-y-3 shadow-xl">
          <div className="flex items-center justify-between border-b border-slate-850 pb-2.5">
            <div className="flex items-center gap-3 text-[11px] font-mono text-slate-400">
              <span className="text-amber-400 font-bold">{format}</span>
              <span>•</span>
              <span>{tone} Tone</span>
              <span>•</span>
              <span>{wordCount} words</span>
            </div>

            <button
              onClick={handleCopy}
              className="py-1 px-3 rounded-xl bg-slate-900 border border-slate-800 hover:border-amber-500/40 text-xs font-semibold text-slate-200 hover:text-white flex items-center gap-1.5 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied' : 'Copy Draft'}</span>
            </button>
          </div>

          <div className="text-xs text-slate-300 leading-relaxed font-sans whitespace-pre-line select-text">
            {output}
          </div>
        </div>
      </div>
    </div>
  );
};
