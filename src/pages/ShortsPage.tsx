import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Plus,
  Play,
  Pause,
  RotateCcw,
  Download,
  Share2,
  Bookmark,
  BookmarkCheck,
  Edit3,
  Sliders,
  Film,
  Camera,
  Sun,
  Music2,
  Ratio,
  Maximize2,
  ChevronLeft,
  Clock,
  CheckCircle2,
  RefreshCw,
  Trash2,
  Wand2,
  Volume2,
  VolumeX,
  AlertCircle,
  FileVideo,
  Layers,
  Zap,
  Gauge
} from 'lucide-react';
import { GeneratedShort } from '../types';
import { aiVideoService, ShortGenerationParams, INITIAL_RECENT_SHORTS } from '../services/aiVideoService';
import { useAuth } from '../contexts/AuthContext';
import { soundEffects } from '../utils/sound';

interface ShortsPageProps {
  onOpenLaterPhase: (title: string, desc: string, feat?: string) => void;
}

type ViewState = 'main' | 'create' | 'generating' | 'result' | 'edit';

export const ShortsPage: React.FC<ShortsPageProps> = ({ onOpenLaterPhase }) => {
  const { currentUser } = useAuth();

  // Navigation View State
  const [view, setView] = useState<ViewState>('main');
  const [recentShorts, setRecentShorts] = useState<GeneratedShort[]>(INITIAL_RECENT_SHORTS);
  const [activeShort, setActiveShort] = useState<GeneratedShort | null>(INITIAL_RECENT_SHORTS[0]);
  const [isLoadingRecent, setIsLoadingRecent] = useState(false);

  // Create Form State
  const [prompt, setPrompt] = useState('');
  const [enhancedPrompt, setEnhancedPrompt] = useState('');
  const [isEnhancing, setIsEnhancing] = useState(false);
  const [style, setStyle] = useState<ShortGenerationParams['style']>('Cinematic');
  const [duration, setDuration] = useState<ShortGenerationParams['duration']>(10);
  const [aspectRatio, setAspectRatio] = useState<ShortGenerationParams['aspectRatio']>('9:16');
  const [quality, setQuality] = useState<ShortGenerationParams['quality']>('4K');
  const [cameraStyle, setCameraStyle] = useState<ShortGenerationParams['cameraStyle']>('Cinematic');
  const [lighting, setLighting] = useState<ShortGenerationParams['lighting']>('Neon');
  const [includeMusic, setIncludeMusic] = useState(true);
  const [musicChoice, setMusicChoice] = useState('Quantum Cyber Synths');

  // Generation Pipeline State
  const [generationStage, setGenerationStage] = useState('Analyzing Prompt & Semantics');
  const [generationStep, setGenerationStep] = useState(1);

  // Playback State
  const [isPlaying, setIsPlaying] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [textOverlay, setTextOverlay] = useState('');
  const [trimRange, setTrimRange] = useState({ start: 0, end: 10 });

  // Notifications
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load recent shorts on mount & when user changes
  useEffect(() => {
    let mounted = true;
    setIsLoadingRecent(true);
    aiVideoService
      .getRecentShorts(currentUser?.uid)
      .then((shorts) => {
        if (mounted) {
          setRecentShorts(shorts);
          if (shorts.length > 0 && !activeShort) {
            setActiveShort(shorts[0]);
          }
        }
      })
      .finally(() => {
        if (mounted) setIsLoadingRecent(false);
      });

    return () => {
      mounted = false;
    };
  }, [currentUser]);

  // Handle Prompt Enhancement
  const handleEnhancePrompt = async () => {
    if (!prompt.trim()) {
      showToast('Enter a video prompt first');
      return;
    }
    soundEffects.playHapticClick();
    setIsEnhancing(true);
    try {
      const enhanced = await aiVideoService.enhancePrompt(prompt, style);
      setEnhancedPrompt(enhanced);
      setPrompt(enhanced);
      soundEffects.playSuccessBeep();
      showToast('Prompt enhanced with cinematic direction');
    } catch {
      showToast('Could not enhance prompt');
    } finally {
      setIsEnhancing(false);
    }
  };

  // Handle Video Generation Trigger
  const handleStartGeneration = async () => {
    if (!prompt.trim()) {
      showToast('Please enter a description for your short');
      return;
    }
    soundEffects.playHapticClick();
    setView('generating');
    setGenerationStep(1);
    setGenerationStage('Analyzing Prompt & Semantics');

    try {
      const generated = await aiVideoService.generateShort(
        {
          prompt: prompt.trim(),
          enhancedPrompt,
          style,
          duration,
          aspectRatio,
          quality,
          cameraStyle,
          lighting,
          music: includeMusic ? musicChoice : 'No Audio'
        },
        (stageName, step) => {
          setGenerationStage(stageName);
          setGenerationStep(step);
        }
      );

      setActiveShort(generated);
      setRecentShorts((prev) => [generated, ...prev]);
      setTrimRange({ start: 0, end: generated.duration });
      setView('result');
      setIsPlaying(true);
      soundEffects.playSuccessBeep();
      showToast('Short rendered successfully');
    } catch (err) {
      console.error('Generation error:', err);
      showToast('Generation failed. Please try again.');
      setView('create');
    }
  };

  // Handle Share
  const handleShare = async () => {
    if (!activeShort) return;
    soundEffects.playHapticClick();

    const shareData = {
      title: activeShort.prompt,
      text: `Watch my AI-generated short "${activeShort.prompt}" on AERIX ONE.`,
      url: window.location.href
    };

    if (navigator.share && navigator.canShare && navigator.canShare(shareData)) {
      try {
        await navigator.share(shareData);
        showToast('Shared successfully');
      } catch (err: any) {
        if (err.name !== 'AbortError') showToast('Sharing cancelled');
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        showToast('Direct link copied to clipboard');
      } catch {
        showToast('Could not copy link');
      }
    }
  };

  // Handle Mock Download
  const handleDownload = () => {
    if (!activeShort) return;
    soundEffects.playSuccessBeep();
    showToast(`Downloading ${activeShort.style}_Short_${activeShort.quality}.mp4 (${activeShort.fileSize})`);
  };

  // Handle Apply Changes in Edit Screen
  const handleApplyEdit = async () => {
    if (!activeShort) return;
    soundEffects.playSuccessBeep();

    const updated: GeneratedShort = {
      ...activeShort,
      style,
      duration: Math.max(5, trimRange.end - trimRange.start) as any,
      aspectRatio,
      quality,
      music: musicChoice,
      speed: playbackSpeed,
      textOverlay: textOverlay.trim() || undefined
    };

    setActiveShort(updated);
    await aiVideoService.updateShort(updated, currentUser?.uid);
    setRecentShorts((prev) => prev.map((s) => (s.id === updated.id ? updated : s)));
    setView('result');
    showToast('Video edits saved to AERIX Vault');
  };

  return (
    <div className="w-full max-w-md mx-auto flex flex-col h-[calc(100vh-130px)] text-slate-100 relative overflow-hidden select-none bg-[#030712]">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-cyan-950/95 border border-cyan-500/60 text-cyan-200 text-xs shadow-2xl backdrop-blur-md font-mono flex items-center gap-2 max-w-[90%]">
          <AlertCircle className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 1. MAIN SHORTS LANDING PAGE */}
      {/* ========================================================================= */}
      {view === 'main' && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-5 pb-6">
          {/* Header Identity */}
          <div className="flex items-center justify-between pt-1">
            <div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-lg bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center overflow-hidden">
                  <img
                    src="/src/assets/images/aerix_one_logo_1791197135811.jpg"
                    alt="AERIX"
                    className="w-full h-full object-cover"
                  />
                </div>
                <h1 className="font-display font-extrabold text-xl tracking-tight text-white">
                  AERIX SHORTS
                </h1>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Create cinematic AI videos in seconds.
              </p>
            </div>

            <button
              onClick={() => {
                soundEffects.playHapticClick();
                setView('create');
              }}
              className="px-4 py-2 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/25 active:scale-95 transition-all"
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>Create Short</span>
            </button>
          </div>

          {/* Hero Action Card */}
          <div
            onClick={() => {
              soundEffects.playHapticClick();
              setView('create');
            }}
            className="p-5 rounded-3xl bg-gradient-to-br from-cyan-950/40 via-slate-900/80 to-[#070e1c] border border-cyan-500/30 hover:border-cyan-400/60 cursor-pointer transition-all shadow-xl group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl group-hover:bg-cyan-500/20 transition-all pointer-events-none" />
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/20 border border-cyan-400/40 flex items-center justify-center text-cyan-300 shadow-md">
                <Wand2 className="w-6 h-6 animate-pulse" />
              </div>
              <div className="flex-1">
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                  Generative Engine v2
                </span>
                <h3 className="font-bold text-sm text-white mt-0.5">
                  Generate High-Fidelity Short
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Turn text prompts into 4K cinematic scenes with custom camera motion.
                </p>
              </div>
            </div>
          </div>

          {/* Recent Shorts Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-bold text-sm text-white flex items-center gap-1.5">
                <Film className="w-4 h-4 text-cyan-400" />
                <span>Recent Shorts</span>
              </h3>
              <span className="text-[11px] font-mono text-slate-400">
                {recentShorts.length} Videos
              </span>
            </div>

            {isLoadingRecent ? (
              <div className="py-12 flex flex-col items-center justify-center space-y-2 text-center">
                <RefreshCw className="w-6 h-6 animate-spin text-cyan-400" />
                <span className="text-xs font-mono text-slate-400">Loading library...</span>
              </div>
            ) : recentShorts.length === 0 ? (
              <div className="py-12 p-6 rounded-3xl bg-slate-900/40 border border-slate-800 text-center space-y-2">
                <Film className="w-8 h-8 text-slate-600 mx-auto" />
                <h4 className="font-bold text-sm text-white">No Shorts Generated Yet</h4>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  Describe any scene and click Create Short to generate your first AI video.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {recentShorts.map((short) => (
                  <div
                    key={short.id}
                    onClick={() => {
                      soundEffects.playHapticClick();
                      setActiveShort(short);
                      setView('result');
                    }}
                    className="rounded-3xl bg-slate-900/80 border border-slate-800 hover:border-cyan-500/40 overflow-hidden cursor-pointer transition-all group flex flex-col"
                  >
                    {/* Thumbnail Viewport */}
                    <div className="aspect-[9/12] w-full bg-slate-950 relative overflow-hidden flex items-center justify-center">
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent z-10" />

                      {/* Ambient Glowing Preset Visual */}
                      <div className="w-16 h-16 rounded-full border border-cyan-500/30 group-hover:scale-125 transition-transform" />
                      <div className="absolute w-8 h-8 rounded-full bg-cyan-500/20 blur-md" />

                      {/* Play Button Overlay */}
                      <div className="w-10 h-10 rounded-full bg-black/60 border border-white/20 flex items-center justify-center text-white z-20 group-hover:scale-110 transition-transform">
                        <Play className="w-4 h-4 fill-current ml-0.5" />
                      </div>

                      {/* Top Badges */}
                      <div className="absolute top-2 left-2 z-20 flex items-center gap-1">
                        <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/20 text-[9px] font-mono text-cyan-300">
                          {short.style}
                        </span>
                      </div>

                      <div className="absolute top-2 right-2 z-20">
                        <span className="px-1.5 py-0.5 rounded bg-cyan-950/80 border border-cyan-500/50 text-[9px] font-mono text-cyan-300">
                          {short.quality}
                        </span>
                      </div>

                      {/* Duration Tag */}
                      <div className="absolute bottom-2 left-2 z-20 flex items-center gap-1 text-[10px] font-mono text-slate-300">
                        <Clock className="w-3 h-3 text-cyan-400" />
                        <span>{short.duration}s</span>
                      </div>
                    </div>

                    {/* Meta info */}
                    <div className="p-3 space-y-1">
                      <h4 className="font-bold text-xs text-white line-clamp-1 group-hover:text-cyan-300 transition-colors">
                        {short.prompt}
                      </h4>
                      <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono">
                        <span>{short.createdAt}</span>
                        <span>{short.aspectRatio}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 2. CREATE SHORT PAGE */}
      {/* ========================================================================= */}
      {view === 'create' && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <button
              onClick={() => {
                soundEffects.playHapticClick();
                setView('main');
              }}
              className="p-2 rounded-xl aerix-glass-elevated hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-display font-bold text-sm text-white">New AI Short</h2>
            <div className="w-9" />
          </div>

          {/* Prompt Input & Enhance Button */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Prompt Description
              </label>
              <button
                type="button"
                onClick={handleEnhancePrompt}
                disabled={isEnhancing}
                className="px-2.5 py-1 rounded-xl bg-cyan-950/80 border border-cyan-500/50 hover:bg-cyan-900 text-cyan-300 text-[10px] font-bold font-mono flex items-center gap-1 active:scale-95 transition-all"
              >
                <Sparkles className={`w-3 h-3 text-cyan-400 ${isEnhancing ? 'animate-spin' : ''}`} />
                <span>{isEnhancing ? 'Enhancing...' : 'Enhance Prompt'}</span>
              </button>
            </div>

            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Describe the video you want to create... (e.g. Flying through a cyberpunk neon rain city at Mach 2)"
              rows={3}
              className="w-full bg-slate-900/90 border border-slate-800 focus:border-cyan-500 rounded-2xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none resize-none font-sans leading-relaxed shadow-inner"
            />

            {/* Quick Inspiration Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
              {[
                'Cyberpunk speeder racing at dusk',
                'Orbital Earth view from spinning habitat ring',
                'Hyperloop capsule entering neon tunnel',
                'Bioluminescent deep-sea robotic explorer'
              ].map((idea, i) => (
                <button
                  key={i}
                  type="button"
                  onClick={() => setPrompt(idea)}
                  className="px-2.5 py-1 rounded-lg bg-slate-900 border border-slate-800 text-[10px] text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 shrink-0"
                >
                  {idea}
                </button>
              ))}
            </div>
          </div>

          {/* Video Style Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Video Style
            </label>
            <div className="grid grid-cols-4 gap-1.5">
              {[
                'Cinematic',
                'Realistic',
                'Anime',
                '3D',
                'Horror',
                'Action',
                'Fantasy',
                'Comedy'
              ].map((s) => {
                const isSelected = style === s;
                return (
                  <button
                    key={s}
                    type="button"
                    onClick={() => {
                      soundEffects.playHapticClick();
                      setStyle(s as any);
                    }}
                    className={`py-2 px-1 rounded-xl border text-[11px] font-semibold transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {s}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Video Duration Selector */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Duration
            </label>
            <div className="grid grid-cols-4 gap-2">
              {([5, 10, 15, 30] as const).map((d) => {
                const isSelected = duration === d;
                return (
                  <button
                    key={d}
                    type="button"
                    onClick={() => {
                      soundEffects.playHapticClick();
                      setDuration(d);
                    }}
                    className={`py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                      isSelected
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:border-slate-700'
                    }`}
                  >
                    {d}s
                  </button>
                );
              })}
            </div>
          </div>

          {/* Aspect Ratio & Quality */}
          <div className="grid grid-cols-2 gap-3">
            {/* Aspect Ratio */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Aspect Ratio
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {(['9:16', '16:9', '1:1'] as const).map((r) => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => {
                      soundEffects.playHapticClick();
                      setAspectRatio(r);
                    }}
                    className={`py-2 rounded-xl border text-[11px] font-mono font-bold ${
                      aspectRatio === r
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    {r}
                  </button>
                ))}
              </div>
            </div>

            {/* Quality */}
            <div className="space-y-1.5">
              <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
                Quality
              </label>
              <div className="grid grid-cols-2 gap-1.5">
                {(['HD', '4K'] as const).map((q) => (
                  <button
                    key={q}
                    type="button"
                    onClick={() => {
                      soundEffects.playHapticClick();
                      setQuality(q);
                    }}
                    className={`py-2 rounded-xl border text-[11px] font-mono font-bold ${
                      quality === q
                        ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Camera Style & Lighting */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Camera Motion
            </label>
            <div className="grid grid-cols-3 gap-1.5">
              {['Handheld', 'Cinematic', 'Drone', 'Close-up', 'Tracking Shot', 'Slow Motion'].map(
                (c) => (
                  <button
                    key={c}
                    type="button"
                    onClick={() => {
                      soundEffects.playHapticClick();
                      setCameraStyle(c as any);
                    }}
                    className={`py-1.5 rounded-xl border text-[10px] font-semibold truncate px-1 ${
                      cameraStyle === c
                        ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                        : 'bg-slate-900/80 border-slate-800 text-slate-300'
                    }`}
                  >
                    {c}
                  </button>
                )
              )}
            </div>
          </div>

          {/* Lighting */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider font-semibold">
              Lighting Environment
            </label>
            <div className="grid grid-cols-5 gap-1">
              {['Natural', 'Dark', 'Neon', 'Studio', 'Sunset'].map((l) => (
                <button
                  key={l}
                  type="button"
                  onClick={() => {
                    soundEffects.playHapticClick();
                    setLighting(l as any);
                  }}
                  className={`py-1.5 rounded-xl border text-[10px] font-semibold truncate px-1 ${
                    lighting === l
                      ? 'bg-cyan-500 text-slate-950 font-bold border-cyan-400'
                      : 'bg-slate-900/80 border-slate-800 text-slate-300'
                  }`}
                >
                  {l}
                </button>
              ))}
            </div>
          </div>

          {/* Sound / Music Option */}
          <div className="p-3 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              <Music2 className="w-4 h-4 text-cyan-400" />
              <div>
                <span className="text-xs font-semibold text-white block">Background Sound</span>
                <span className="text-[10px] text-slate-400 font-mono">{musicChoice}</span>
              </div>
            </div>
            <input
              type="checkbox"
              checked={includeMusic}
              onChange={(e) => setIncludeMusic(e.target.checked)}
              className="accent-cyan-400 w-4 h-4 rounded cursor-pointer"
            />
          </div>

          {/* Primary Submit Button */}
          <button
            type="button"
            onClick={handleStartGeneration}
            className="w-full py-3.5 rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold text-sm flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/25 active:scale-95 transition-all mt-2"
          >
            <Sparkles className="w-4 h-4 stroke-[2.5]" />
            <span>Generate Short</span>
          </button>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 3. GENERATION SCREEN (Stages Progress) */}
      {/* ========================================================================= */}
      {view === 'generating' && (
        <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-6">
          {/* Smooth Neural Core Pulse Animation */}
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-cyan-500/20 border-t-cyan-400 animate-spin" />
            <div className="absolute inset-3 rounded-full border-4 border-blue-500/30 border-b-blue-400 animate-spin" style={{ animationDirection: 'reverse', animationDuration: '3s' }} />
            <div className="absolute inset-0 flex items-center justify-center text-cyan-300">
              <Wand2 className="w-10 h-10 animate-pulse" />
            </div>
          </div>

          <div className="space-y-1">
            <h3 className="font-display font-extrabold text-lg text-white">
              AERIX AI is creating your short...
            </h3>
            <p className="text-xs text-slate-400 font-mono max-w-xs truncate mx-auto">
              "{prompt}"
            </p>
          </div>

          {/* 5 Generation Stages */}
          <div className="w-full max-w-xs p-4 rounded-3xl bg-slate-900/90 border border-slate-800 space-y-2.5 text-left text-xs font-mono shadow-xl">
            {[
              { step: 1, name: '1. Analyzing Prompt' },
              { step: 2, name: '2. Creating Scene' },
              { step: 3, name: '3. Generating Motion' },
              { step: 4, name: '4. Rendering Video' },
              { step: 5, name: '5. Finalizing Short' }
            ].map((st) => {
              const isDone = generationStep > st.step;
              const isCurrent = generationStep === st.step;
              return (
                <div
                  key={st.step}
                  className={`flex items-center justify-between transition-colors ${
                    isDone
                      ? 'text-emerald-400'
                      : isCurrent
                      ? 'text-cyan-300 font-bold'
                      : 'text-slate-600'
                  }`}
                >
                  <span>{st.name}</span>
                  {isDone ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  ) : isCurrent ? (
                    <RefreshCw className="w-3.5 h-3.5 animate-spin text-cyan-400" />
                  ) : (
                    <span className="w-2 h-2 rounded-full bg-slate-800" />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. RESULT / PREVIEW PAGE */}
      {/* ========================================================================= */}
      {view === 'result' && activeShort && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <button
              onClick={() => {
                soundEffects.playHapticClick();
                setView('main');
              }}
              className="p-2 rounded-xl aerix-glass-elevated hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-display font-bold text-sm text-white">Rendered Short</h2>
            <div className="w-9" />
          </div>

          {/* Large Video Player */}
          <div
            onClick={() => setIsPlaying(!isPlaying)}
            className="w-full aspect-[9/14] bg-slate-950 rounded-3xl border border-cyan-500/40 relative overflow-hidden flex items-center justify-center cursor-pointer shadow-2xl group"
          >
            {/* Visual simulation engine */}
            <div className="absolute inset-0 bg-gradient-to-b from-[#060a14] via-[#091124] to-[#040711]">
              <div className="w-full h-full relative flex items-center justify-center overflow-hidden">
                <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-cyan-900/30 via-slate-950 to-black" />
                <div className={`w-72 h-72 rounded-full border border-cyan-500/30 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '20s' }} />
                <div className={`absolute w-48 h-48 rounded-full border border-blue-500/40 ${isPlaying ? 'animate-spin' : ''}`} style={{ animationDuration: '10s' }} />
                <div className="absolute top-1/3 w-full h-0.5 bg-gradient-to-r from-transparent via-cyan-400 to-transparent shadow-lg shadow-cyan-400/50 animate-pulse" />
              </div>
            </div>

            {/* Custom Text Overlay if configured */}
            {activeShort.textOverlay && (
              <div className="absolute top-10 px-4 py-1.5 rounded-xl bg-black/70 border border-white/20 text-white font-display font-bold text-sm tracking-wide z-20 shadow-xl">
                {activeShort.textOverlay}
              </div>
            )}

            {/* Center Pause/Play toggle indicator */}
            {!isPlaying && (
              <div className="w-16 h-16 rounded-full bg-black/70 border border-white/30 flex items-center justify-center text-white z-20 backdrop-blur-sm">
                <Play className="w-8 h-8 fill-current ml-1" />
              </div>
            )}

            {/* Top controls (Mute / Aspect tag) */}
            <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between">
              <span className="px-2 py-0.5 rounded-full bg-black/60 border border-white/20 text-[10px] font-mono text-cyan-300">
                {activeShort.quality} · {activeShort.aspectRatio}
              </span>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMuted(!isMuted);
                }}
                className="p-2 rounded-full bg-black/60 border border-white/20 text-white"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Bottom track bar */}
            <div className="absolute bottom-3 left-3 right-3 z-20 flex items-center justify-between text-[11px] font-mono text-slate-300">
              <span className="truncate max-w-[200px]">{activeShort.prompt}</span>
              <span className="text-cyan-400">{activeShort.duration}s</span>
            </div>
          </div>

          {/* Action Rail: Edit, Regenerate, Download, Save, Share */}
          <div className="grid grid-cols-5 gap-1.5">
            <button
              onClick={() => {
                soundEffects.playHapticClick();
                setTrimRange({ start: 0, end: activeShort.duration });
                setView('edit');
              }}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 flex flex-col items-center gap-1 active:scale-95 transition-all"
            >
              <Edit3 className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-semibold">Edit</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playHapticClick();
                handleStartGeneration();
              }}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 flex flex-col items-center gap-1 active:scale-95 transition-all"
            >
              <RotateCcw className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-semibold">Redo</span>
            </button>

            <button
              onClick={handleDownload}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 flex flex-col items-center gap-1 active:scale-95 transition-all"
            >
              <Download className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-semibold">Export</span>
            </button>

            <button
              onClick={() => {
                soundEffects.playSuccessBeep();
                showToast('Short archived in AERIX Vault');
              }}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 flex flex-col items-center gap-1 active:scale-95 transition-all"
            >
              <Bookmark className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-semibold">Save</span>
            </button>

            <button
              onClick={handleShare}
              className="p-2.5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 text-slate-200 flex flex-col items-center gap-1 active:scale-95 transition-all"
            >
              <Share2 className="w-4 h-4 text-cyan-400" />
              <span className="text-[10px] font-semibold">Share</span>
            </button>
          </div>

          {/* Video Metadata Card */}
          <div className="p-4 rounded-3xl bg-slate-900/80 border border-slate-800 space-y-3">
            <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider font-semibold block">
              Video Specifications
            </span>
            <div className="grid grid-cols-2 gap-3 text-xs font-mono">
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block">RESOLUTION</span>
                <span className="font-bold text-white mt-0.5 block">{activeShort.quality} (2160×3840)</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block">DURATION</span>
                <span className="font-bold text-white mt-0.5 block">{activeShort.duration} Seconds</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block">STYLE & LIGHTING</span>
                <span className="font-bold text-white mt-0.5 block">{activeShort.style} · {activeShort.lighting}</span>
              </div>
              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-slate-500 text-[10px] block">ASPECT RATIO</span>
                <span className="font-bold text-white mt-0.5 block">{activeShort.aspectRatio}</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 5. EDIT PAGE */}
      {/* ========================================================================= */}
      {view === 'edit' && activeShort && (
        <div className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4 pb-6">
          {/* Header */}
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <button
              onClick={() => {
                soundEffects.playHapticClick();
                setView('result');
              }}
              className="p-2 rounded-xl aerix-glass-elevated hover:bg-slate-800 text-slate-400 hover:text-white"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <h2 className="font-display font-bold text-sm text-white">Video Studio Editor</h2>
            <div className="w-9" />
          </div>

          {/* Video Preview thumbnail strip */}
          <div className="h-28 w-full rounded-2xl bg-slate-950 border border-slate-800 flex items-center justify-center p-3 relative overflow-hidden">
            <div className="text-center">
              <Film className="w-6 h-6 text-cyan-400 mx-auto mb-1 animate-pulse" />
              <span className="text-[11px] font-mono text-slate-300">
                Trim: {trimRange.start}s - {trimRange.end}s (Duration: {trimRange.end - trimRange.start}s)
              </span>
            </div>
          </div>

          {/* 1. Trim Controls */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-cyan-400 uppercase font-semibold">Trim Video Range</span>
              <span className="text-white">{trimRange.start}s - {trimRange.end}s</span>
            </div>
            <input
              type="range"
              min="0"
              max={activeShort.duration}
              value={trimRange.end}
              onChange={(e) =>
                setTrimRange((prev) => ({ ...prev, end: Math.max(prev.start + 5, Number(e.target.value)) }))
              }
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* 2. Change Playback Speed */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-mono text-cyan-400 uppercase font-semibold block">
              Playback Speed
            </span>
            <div className="grid grid-cols-5 gap-1.5">
              {[0.5, 1, 1.25, 1.5, 2].map((sp) => (
                <button
                  key={sp}
                  onClick={() => {
                    soundEffects.playHapticClick();
                    setPlaybackSpeed(sp);
                  }}
                  className={`py-1.5 rounded-xl border text-[11px] font-mono font-bold ${
                    playbackSpeed === sp
                      ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow'
                      : 'bg-slate-950 border-slate-800 text-slate-300'
                  }`}
                >
                  {sp}x
                </button>
              ))}
            </div>
          </div>

          {/* 3. Add Text Overlay */}
          <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
            <span className="text-xs font-mono text-cyan-400 uppercase font-semibold block">
              Text Overlay
            </span>
            <input
              type="text"
              value={textOverlay}
              onChange={(e) => setTextOverlay(e.target.value)}
              placeholder="e.g. AERIX ONE • 2099 REVELATION"
              className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* 4. Change Visual Style & Aspect Ratio */}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 uppercase font-semibold block">
                Visual Style
              </span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
              >
                {['Cinematic', 'Realistic', 'Anime', '3D', 'Horror', 'Action', 'Fantasy', 'Comedy'].map(
                  (st) => (
                    <option key={st} value={st}>
                      {st}
                    </option>
                  )
                )}
              </select>
            </div>

            <div className="space-y-1.5 p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800">
              <span className="text-xs font-mono text-cyan-400 uppercase font-semibold block">
                Aspect Ratio
              </span >
              <select
                value={aspectRatio}
                onChange={(e) => setAspectRatio(e.target.value as any)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-2.5 py-2 text-xs text-white focus:outline-none"
              >
                {['9:16', '16:9', '1:1'].map((r) => (
                  <option key={r} value={r}>
                    {r}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* 5. Improve Video Quality */}
          <div className="p-3.5 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between">
            <div>
              <span className="text-xs font-semibold text-white block">Super-Resolution 4K Upscale</span>
              <span className="text-[10px] text-slate-400 font-mono">Neural frame enhancement</span>
            </div>
            <button
              onClick={() => {
                soundEffects.playHapticClick();
                setQuality(quality === '4K' ? 'HD' : '4K');
              }}
              className={`px-3 py-1 rounded-xl text-xs font-mono font-bold border ${
                quality === '4K'
                  ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {quality}
            </button>
          </div>

          {/* Apply Changes Button */}
          <button
            onClick={handleApplyEdit}
            className="w-full py-3.5 rounded-2xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-sm shadow-xl shadow-cyan-500/25 active:scale-95 transition-all mt-2"
          >
            Apply Changes
          </button>
        </div>
      )}
    </div>
  );
};
