import React, { useState } from 'react';
import {
  Image,
  Sparkles,
  Download,
  Copy,
  Wand2,
  RefreshCw,
  Sliders,
  ChevronLeft,
  X,
  Layers,
  Crop,
  Check,
  Share2,
  Maximize2
} from 'lucide-react';
import { soundEffects } from '../../utils/sound';

interface AerixImageAppProps {
  onClose: () => void;
}

export const AerixImageApp: React.FC<AerixImageAppProps> = ({ onClose }) => {
  const [prompt, setPrompt] = useState('Futuristic bio-luminescent greenhouse on a titanium orbital space station, volumetric lighting, 8k render');
  const [aspectRatio, setAspectRatio] = useState<'1:1' | '16:9' | '9:16' | '4:3'>('1:1');
  const [style, setStyle] = useState('Cinematic');
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedImages, setGeneratedImages] = useState<Array<{ id: string; url: string; prompt: string; ratio: string }>>([
    {
      id: 'img-1',
      url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=1000&q=80',
      prompt: 'Neon cybernetic landscape with holographic auroras',
      ratio: '1:1'
    },
    {
      id: 'img-2',
      url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=1000&q=80',
      prompt: 'Abstract liquid chrome fluid art with prismatic refractions',
      ratio: '16:9'
    }
  ]);
  const [activeImage, setActiveImage] = useState<string>(generatedImages[0].url);
  const [copied, setCopied] = useState(false);

  const samplePrompts = [
    'Deep oceanic crystal cathedral illuminated by glowing jellyfish',
    'Cyberpunk Tokyo alleyway during rainy midnight with neon reflections',
    'Solar ark soaring past Mars rings, 70mm anamorphic lens'
  ];

  const handleGenerate = () => {
    if (!prompt.trim()) return;
    soundEffects.playHapticClick();
    setIsGenerating(true);

    setTimeout(() => {
      const demoImages = [
        'https://images.unsplash.com/photo-1634017839464-5c339ebe3cb4?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=1000&q=80',
        'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1000&q=80'
      ];
      const randomUrl = demoImages[Math.floor(Math.random() * demoImages.length)];
      const newImg = {
        id: `gen-${Date.now()}`,
        url: randomUrl,
        prompt,
        ratio: aspectRatio
      };
      setGeneratedImages((prev) => [newImg, ...prev]);
      setActiveImage(randomUrl);
      setIsGenerating(false);
      soundEffects.playSuccess();
    }, 1800);
  };

  const handleCopyPrompt = () => {
    navigator.clipboard.writeText(prompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
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
            <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 text-cyan-400 flex items-center justify-center">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-white">AERIX IMAGE</h1>
              <p className="text-[10px] font-mono text-cyan-400">Neural Image Studio v3.1</p>
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
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 max-w-4xl mx-auto w-full space-y-4 pb-24">
        {/* Main Canvas / Viewport */}
        <div className="relative rounded-3xl overflow-hidden aerix-glass border border-cyan-500/30 bg-slate-950 aspect-square md:aspect-video flex items-center justify-center group shadow-2xl">
          {isGenerating ? (
            <div className="text-center space-y-3 p-6">
              <div className="relative w-12 h-12 mx-auto">
                <RefreshCw className="w-12 h-12 text-cyan-400 animate-spin" />
                <Sparkles className="w-5 h-5 text-cyan-200 absolute inset-0 m-auto animate-pulse" />
              </div>
              <p className="text-xs font-mono text-cyan-300">Synthesizing latent diffusion tensors...</p>
              <div className="w-48 h-1 bg-slate-800 rounded-full mx-auto overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-400 to-indigo-500 animate-pulse w-3/4 rounded-full" />
              </div>
            </div>
          ) : (
            <>
              <img
                src={activeImage}
                alt="AI Generated"
                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity p-4 flex flex-col justify-end">
                <div className="flex items-center justify-between">
                  <span className="text-xs text-slate-300 font-mono line-clamp-1">{prompt}</span>
                  <div className="flex items-center gap-2">
                    <a
                      href={activeImage}
                      target="_blank"
                      rel="noreferrer"
                      download="aerix-image.jpg"
                      className="p-2 rounded-xl bg-white/20 backdrop-blur-md text-white hover:bg-white/30"
                    >
                      <Download className="w-4 h-4" />
                    </a>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>

        {/* Prompt Input Box */}
        <div className="p-4 rounded-3xl aerix-glass border border-slate-800 space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-mono text-cyan-400 uppercase tracking-wider flex items-center gap-1.5">
              <Wand2 className="w-3.5 h-3.5" />
              <span>Prompt Description</span>
            </label>
            <button
              onClick={handleCopyPrompt}
              className="text-[10px] font-mono text-slate-400 hover:text-white flex items-center gap-1"
            >
              {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
              <span>{copied ? 'Copied' : 'Copy'}</span>
            </button>
          </div>

          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            placeholder="Describe the image you want AERIX AI to create..."
            className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 resize-none"
          />

          {/* Quick Inspiration Pills */}
          <div className="flex flex-wrap gap-1.5 pt-1">
            {samplePrompts.map((sp, idx) => (
              <button
                key={idx}
                onClick={() => setPrompt(sp)}
                className="text-[10px] font-mono py-1 px-2.5 rounded-xl bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-cyan-300 hover:border-cyan-500/40 truncate max-w-xs transition-colors"
              >
                + {sp}
              </button>
            ))}
          </div>

          {/* Controls: Aspect Ratio & Style */}
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1">Aspect Ratio</span>
              <div className="grid grid-cols-4 gap-1">
                {(['1:1', '16:9', '9:16', '4:3'] as const).map((ratio) => (
                  <button
                    key={ratio}
                    onClick={() => setAspectRatio(ratio)}
                    className={`py-1 rounded-xl text-[10px] font-mono font-bold transition-all ${
                      aspectRatio === ratio
                        ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-500/20'
                        : 'bg-slate-900 border border-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {ratio}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <span className="text-[10px] font-mono text-slate-400 block mb-1">Aesthetic Style</span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full px-3 py-1.5 bg-slate-900 border border-slate-800 rounded-xl text-[11px] text-white focus:outline-none focus:border-cyan-500"
              >
                <option value="Cinematic">Cinematic 35mm</option>
                <option value="Photorealistic">Photorealistic</option>
                <option value="Anime">Anime Studio</option>
                <option value="Digital Art">Digital Concept Art</option>
                <option value="Cyberpunk">Cyberpunk Neon</option>
              </select>
            </div>
          </div>

          {/* Generate Button */}
          <button
            onClick={handleGenerate}
            disabled={isGenerating || !prompt.trim()}
            className="w-full py-3 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 shadow-xl shadow-cyan-500/20 active:scale-98 transition-all disabled:opacity-50"
          >
            {isGenerating ? (
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
            ) : (
              <Sparkles className="w-4 h-4 text-slate-950" />
            )}
            <span>Generate Neural Image</span>
          </button>
        </div>

        {/* Gallery of Recent Generations */}
        <div className="space-y-2">
          <h3 className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
            Recent Generations
          </h3>
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {generatedImages.map((img) => (
              <button
                key={img.id}
                onClick={() => {
                  soundEffects.playHapticClick();
                  setActiveImage(img.url);
                  setPrompt(img.prompt);
                }}
                className={`relative rounded-2xl overflow-hidden aspect-square border transition-all ${
                  activeImage === img.url
                    ? 'border-cyan-400 ring-2 ring-cyan-400/40 scale-95'
                    : 'border-slate-800 opacity-70 hover:opacity-100'
                }`}
              >
                <img src={img.url} alt="Thumbnail" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
