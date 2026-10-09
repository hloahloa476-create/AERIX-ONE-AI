import React, { useState } from 'react';
import {
  Wrench,
  Calculator,
  Wand2,
  Code2,
  FileCode,
  Copy,
  Check,
  ChevronLeft,
  X,
  Sparkles,
  ArrowRight
} from 'lucide-react';
import { soundEffects } from '../../utils/sound';

interface AerixToolsAppProps {
  onClose: () => void;
}

export const AerixToolsApp: React.FC<AerixToolsAppProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'tokens' | 'prompts' | 'regex' | 'json'>('tokens');

  // Token counter state
  const [tokenText, setTokenText] = useState('Build an enterprise-grade AI applications hub with dark glassmorphism, responsive touch cards, and seamless multi-modal state isolation.');

  // Prompt optimizer state
  const [rawPrompt, setRawPrompt] = useState('Write an email explaining our new product');
  const [refinedPrompt, setRefinedPrompt] = useState(`You are an elite product marketing lead. Draft a high-conversion announcement email for our new product launch with the following structure:
- Compelling hook addressing customer pain points
- 3 clear value propositions with bold highlights
- A prominent call-to-action button
- A concise postscript (P.S.) reinforcing urgency.
Tone: Confident, visionary, yet accessible.`);

  // Regex generator state
  const [regexReq, setRegexReq] = useState('Match valid international phone numbers with optional country code');
  const [regexResult, setRegexResult] = useState('^\\+?[1-9]\\d{1,14}$');

  // JSON validator state
  const [jsonInput, setJsonInput] = useState('{\n  "service": "AERIX ONE",\n  "status": "operational",\n  "latencyMs": 14\n}');
  const [jsonValid, setJsonValid] = useState<boolean>(true);

  const [copied, setCopied] = useState(false);

  const estimatedTokens = Math.ceil(tokenText.length / 4);
  const estimatedCost = ((estimatedTokens / 1000000) * 0.15).toFixed(6);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleRefinePrompt = () => {
    soundEffects.playHapticClick();
    setRefinedPrompt(`You are an expert specialist. Optimize the following request with structured guardrails:
Context: "${rawPrompt}"
Requirements:
1. Provide a step-by-step breakdown.
2. Include concrete real-world edge cases.
3. Keep the output actionable and scannable.`);
    soundEffects.playSuccess();
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonInput);
      setJsonInput(JSON.stringify(parsed, null, 2));
      setJsonValid(true);
      soundEffects.playSuccess();
    } catch {
      setJsonValid(false);
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
            <div className="w-8 h-8 rounded-xl bg-slate-700/40 border border-slate-600 text-slate-200 flex items-center justify-center">
              <Wrench className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-white">AERIX TOOLS</h1>
              <p className="text-[10px] font-mono text-slate-400">AI Utility & Engineering Suite v2.0</p>
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

      {/* Sub Tabs */}
      <div className="bg-slate-900/60 border-b border-slate-800 px-4 py-2 flex items-center gap-2 overflow-x-auto no-scrollbar shrink-0">
        {[
          { id: 'tokens', label: 'Token Calculator', icon: Calculator },
          { id: 'prompts', label: 'Prompt Tuner', icon: Wand2 },
          { id: 'regex', label: 'Regex Synthesizer', icon: Code2 },
          { id: 'json', label: 'JSON Formatter', icon: FileCode }
        ].map((t) => {
          const Icon = t.icon;
          const isActive = activeTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => {
                soundEffects.playHapticClick();
                setActiveTab(t.id as any);
              }}
              className={`py-1.5 px-3 rounded-xl text-xs font-mono flex items-center gap-1.5 whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
                  : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{t.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Studio Viewport */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 max-w-3xl mx-auto w-full space-y-4 pb-24">
        {/* TAB 1: Token Calculator */}
        {activeTab === 'tokens' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl aerix-glass border border-slate-800 space-y-3">
              <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
                Input Text to Estimate Tokens
              </label>
              <textarea
                value={tokenText}
                onChange={(e) => setTokenText(e.target.value)}
                rows={5}
                className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none font-mono"
              />
            </div>

            <div className="grid grid-cols-3 gap-3">
              <div className="p-4 rounded-3xl aerix-glass border border-cyan-500/30 text-center">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">Estimated Tokens</span>
                <span className="text-xl font-bold font-mono text-cyan-400">~{estimatedTokens}</span>
              </div>
              <div className="p-4 rounded-3xl aerix-glass border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">Characters</span>
                <span className="text-xl font-bold font-mono text-white">{tokenText.length}</span>
              </div>
              <div className="p-4 rounded-3xl aerix-glass border border-slate-800 text-center">
                <span className="text-[10px] font-mono text-slate-400 block mb-1">Est. Inference Cost</span>
                <span className="text-xl font-bold font-mono text-emerald-400">${estimatedCost}</span>
              </div>
            </div>
          </div>
        )}

        {/* TAB 2: Prompt Tuner */}
        {activeTab === 'prompts' && (
          <div className="space-y-4">
            <div className="p-4 rounded-3xl aerix-glass border border-slate-800 space-y-3">
              <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block">
                Basic Prompt Idea
              </label>
              <input
                type="text"
                value={rawPrompt}
                onChange={(e) => setRawPrompt(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
              <button
                onClick={handleRefinePrompt}
                className="py-2 px-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5"
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>Optimize Prompt Structure</span>
              </button>
            </div>

            <div className="p-4 rounded-3xl aerix-glass border border-cyan-500/30 bg-slate-950 space-y-2">
              <div className="flex items-center justify-between border-b border-slate-850 pb-2">
                <span className="text-[10px] font-mono text-cyan-400 uppercase font-bold">
                  System-Tuned Prompt
                </span>
                <button
                  onClick={() => handleCopy(refinedPrompt)}
                  className="text-xs text-slate-400 hover:text-white flex items-center gap-1"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-300 font-mono leading-relaxed whitespace-pre-line select-text">
                {refinedPrompt}
              </p>
            </div>
          </div>
        )}

        {/* TAB 3: Regex Synthesizer */}
        {activeTab === 'regex' && (
          <div className="p-4 rounded-3xl aerix-glass border border-slate-800 space-y-4">
            <div>
              <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider block mb-1">
                Describe What You Want to Match
              </label>
              <input
                type="text"
                value={regexReq}
                onChange={(e) => setRegexReq(e.target.value)}
                className="w-full px-3.5 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div className="p-4 rounded-2xl bg-slate-950 border border-cyan-500/30 flex items-center justify-between">
              <div>
                <span className="text-[10px] font-mono text-slate-500 block">Generated Regular Expression</span>
                <span className="text-sm font-mono text-cyan-400 font-bold">{regexResult}</span>
              </div>
              <button
                onClick={() => handleCopy(regexResult)}
                className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300"
              >
                <Copy className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* TAB 4: JSON Formatter */}
        {activeTab === 'json' && (
          <div className="p-4 rounded-3xl aerix-glass border border-slate-800 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider">
                JSON Validator & Beautifier
              </label>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded-lg border ${
                  jsonValid
                    ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                }`}
              >
                {jsonValid ? 'Valid JSON' : 'Syntax Error'}
              </span>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              rows={8}
              className="w-full px-3.5 py-2.5 bg-slate-950 border border-slate-800 rounded-2xl text-xs text-cyan-300 font-mono focus:outline-none focus:border-cyan-500 resize-none leading-relaxed"
            />

            <button
              onClick={handleFormatJson}
              className="py-2 px-4 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs"
            >
              Format & Indent JSON
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
