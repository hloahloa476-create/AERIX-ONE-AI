import React, { useState, useRef, useEffect } from 'react';
import {
  Camera,
  RotateCw,
  Image as ImageIcon,
  ScanText,
  Sparkles,
  X,
  CheckCircle2,
  Copy,
  Sliders,
  Maximize2
} from 'lucide-react';
import { soundEffects } from '../../utils/sound';

interface CameraAppProps {
  onClose: () => void;
}

export const CameraApp: React.FC<CameraAppProps> = ({ onClose }) => {
  const [mode, setMode] = useState<'photo' | 'ocr' | 'analysis'>('photo');
  const [capturedPhotos, setCapturedPhotos] = useState<string[]>([]);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [isFlashActive, setIsFlashActive] = useState(false);
  const [webcamActive, setWebcamActive] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Analysis / OCR states
  const [ocrText, setOcrText] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<{
    scene: string;
    exposure: string;
    dominantHues: string[];
    confidence: string;
  } | null>(null);

  const videoRef = useRef<HTMLVideoElement>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2400);
  };

  // Attempt real webcam access with fallback to simulated digital sensor
  useEffect(() => {
    let stream: MediaStream | null = null;
    const startCamera = async () => {
      try {
        if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
          stream = await navigator.mediaDevices.getUserMedia({
            video: { facingMode: 'environment' },
          });
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            setWebcamActive(true);
          }
        }
      } catch {
        // Fallback to simulated viewfinder if user denies camera or no device present
        setWebcamActive(false);
      }
    };

    startCamera();

    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  const handleCapture = () => {
    soundEffects.playCameraShutter();
    setIsFlashActive(true);
    setTimeout(() => setIsFlashActive(false), 120);

    // Save capture to roll
    const dummyCanvas = document.createElement('canvas');
    dummyCanvas.width = 320;
    dummyCanvas.height = 320;
    const ctx = dummyCanvas.getContext('2d');
    if (ctx) {
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, 320, 320);
      ctx.fillStyle = '#06b6d4';
      ctx.font = '14px monospace';
      ctx.fillText('AERIX OPTICAL CAPTURE', 20, 160);
      ctx.fillText(new Date().toLocaleTimeString(), 20, 190);
    }
    const dataUrl = dummyCanvas.toDataURL();
    setCapturedPhotos((prev) => [dataUrl, ...prev]);

    if (mode === 'photo') {
      showToast('Image archived in AERIX Gallery');
    } else if (mode === 'ocr') {
      setOcrText(
        'AERIX ONE // SYSTEM SPECIFICATION\nNODE ID: 0x9F4B-ALPHA\nCORE FREQUENCY: 4.8 GHz QUANTUM SYNAPSE\nSTATUS: AIR-GAPPED & SECURED'
      );
      showToast('Text extracted from visual buffer');
    } else if (mode === 'analysis') {
      setAnalysisResult({
        scene: 'Metropolitan Architectural Interface',
        exposure: 'Dynamic ISO 100 · 1/250s f/1.8',
        dominantHues: ['#06b6d4', '#0f172a', '#3b82f6'],
        confidence: '99.4% Neural Match',
      });
      showToast('Multimodal scene telemetry generated');
    }
  };

  return (
    <div className="fixed inset-0 z-40 bg-black text-slate-100 flex flex-col overflow-hidden select-none pb-16">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 text-xs shadow-2xl backdrop-blur-md font-mono flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Shutter White Flash Effect */}
      {isFlashActive && (
        <div className="absolute inset-0 bg-white z-50 transition-opacity duration-100" />
      )}

      {/* Top Controls Overlay */}
      <div className="p-3 bg-gradient-to-b from-black/80 to-transparent flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-cyan-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
            <Camera className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-display text-white">
              AERIX OPTICS
            </h2>
            <span className="text-[10px] font-mono text-cyan-400">
              {webcamActive ? 'Sensor: Live Video' : 'Sensor: Neural Viewfinder'}
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white bg-black/40 border border-white/10"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Main Viewfinder Screen */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#060913]">
        {/* Real Video or Simulated HUD */}
        {webcamActive ? (
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="w-full h-full flex flex-col items-center justify-center relative p-6">
            {/* Viewfinder crosshairs */}
            <div className="w-64 h-64 border border-cyan-500/30 rounded-3xl relative flex items-center justify-center">
              {/* Corner brackets */}
              <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-400 rounded-tl-lg" />
              <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-400 rounded-tr-lg" />
              <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-400 rounded-bl-lg" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-400 rounded-br-lg" />

              {/* Center crosshair */}
              <div className="w-8 h-8 rounded-full border border-cyan-400/50 flex items-center justify-center">
                <div className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
              </div>

              <span className="absolute bottom-3 font-mono text-[10px] text-cyan-400">
                AUTO FOCUS · 4K UHD
              </span>
            </div>

            <div className="absolute bottom-6 font-mono text-[11px] text-slate-500">
              Optical Sensor Standby · Tap Shutter to Sample
            </div>
          </div>
        )}

        {/* OCR Result Overlay Sheet */}
        {ocrText && (
          <div className="absolute inset-x-4 bottom-24 z-30 aerix-glass-elevated rounded-2xl p-4 border border-cyan-500/40 shadow-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-cyan-400">
              <span className="flex items-center gap-1.5">
                <ScanText className="w-3.5 h-3.5" />
                OCR Text Extracted
              </span>
              <button
                onClick={() => setOcrText(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <pre className="text-xs text-white font-mono bg-slate-900/80 p-2.5 rounded-xl whitespace-pre-wrap leading-relaxed">
              {ocrText}
            </pre>
            <button
              onClick={() => {
                navigator.clipboard?.writeText(ocrText);
                showToast('Copied OCR text to clipboard');
              }}
              className="w-full py-1.5 bg-cyan-500 text-slate-950 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 shadow"
            >
              <Copy className="w-3.5 h-3.5" />
              Copy Extracted Text
            </button>
          </div>
        )}

        {/* Image Analysis Overlay Sheet */}
        {analysisResult && (
          <div className="absolute inset-x-4 bottom-24 z-30 aerix-glass-elevated rounded-2xl p-4 border border-purple-500/40 shadow-2xl space-y-2">
            <div className="flex items-center justify-between text-xs font-mono text-purple-400">
              <span className="flex items-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Neural Scene Analysis
              </span>
              <button
                onClick={() => setAnalysisResult(null)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
            <div className="text-xs text-slate-200 space-y-1">
              <div>
                <span className="text-slate-400 font-mono text-[10px]">SCENE:</span>{' '}
                <span className="font-semibold text-white">{analysisResult.scene}</span>
              </div>
              <div>
                <span className="text-slate-400 font-mono text-[10px]">EXPOSURE:</span>{' '}
                <span className="font-mono text-cyan-400">{analysisResult.exposure}</span>
              </div>
              <div className="flex items-center gap-2 pt-1">
                <span className="text-slate-400 font-mono text-[10px]">PALETTE:</span>
                {analysisResult.dominantHues.map((hue, i) => (
                  <span
                    key={i}
                    className="w-4 h-4 rounded-full border border-white/20"
                    style={{ backgroundColor: hue }}
                  />
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mode Switcher (Photo / OCR / Analysis) */}
      <div className="bg-black/90 p-2 flex items-center justify-center gap-3 text-xs font-semibold shrink-0 border-t border-slate-900">
        {[
          { id: 'photo', label: 'Photo' },
          { id: 'ocr', label: 'OCR Scanner' },
          { id: 'analysis', label: 'Neural Vision' },
        ].map((m) => {
          const isActive = mode === m.id;
          return (
            <button
              key={m.id}
              onClick={() => {
                soundEffects.playHapticClick();
                setMode(m.id as typeof mode);
                setOcrText(null);
                setAnalysisResult(null);
              }}
              className={`px-3 py-1.5 rounded-full transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {m.label}
            </button>
          );
        })}
      </div>

      {/* Bottom Shutter & Gallery Bar */}
      <div className="p-4 bg-black flex items-center justify-around z-20 shrink-0">
        {/* Gallery Thumb Trigger */}
        <button
          onClick={() => {
            soundEffects.playHapticClick();
            setGalleryOpen(true);
          }}
          className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300 relative"
          title="Gallery Roll"
        >
          <ImageIcon className="w-5 h-5 text-cyan-400" />
          {capturedPhotos.length > 0 && (
            <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-cyan-400 text-slate-950 text-[10px] font-bold flex items-center justify-center">
              {capturedPhotos.length}
            </span>
          )}
        </button>

        {/* Big Shutter Button */}
        <button
          onClick={handleCapture}
          className="w-18 h-18 rounded-full border-4 border-white/80 p-1 flex items-center justify-center active:scale-90 transition-transform"
        >
          <div className="w-full h-full rounded-full bg-white hover:bg-cyan-200 transition-colors shadow-lg" />
        </button>

        {/* Lens Flip / Camera Switcher */}
        <button
          onClick={() => {
            soundEffects.playHapticClick();
            showToast('Sensor orientation locked in Phase 1');
          }}
          className="w-11 h-11 rounded-2xl bg-slate-900 border border-slate-700 flex items-center justify-center text-slate-300"
          title="Switch Lens"
        >
          <RotateCw className="w-5 h-5" />
        </button>
      </div>

      {/* Gallery Modal */}
      {galleryOpen && (
        <div className="absolute inset-0 z-40 bg-[#040711] flex flex-col p-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <h3 className="font-display font-bold text-sm text-white flex items-center gap-2">
              <ImageIcon className="w-4 h-4 text-cyan-400" />
              Optics Roll ({capturedPhotos.length})
            </h3>
            <button
              onClick={() => setGalleryOpen(false)}
              className="p-1.5 rounded-lg text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1 overflow-y-auto py-4">
            {capturedPhotos.length === 0 ? (
              <div className="text-center py-20 text-slate-500 text-xs">
                No optical captures yet. Tap the shutter to take shots.
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                {capturedPhotos.map((photo, idx) => (
                  <div
                    key={idx}
                    className="aspect-square rounded-2xl bg-slate-900 border border-slate-800 overflow-hidden relative"
                  >
                    <img
                      src={photo}
                      alt="Capture"
                      className="w-full h-full object-cover"
                    />
                    <span className="absolute bottom-2 left-2 text-[9px] font-mono text-cyan-400 bg-black/60 px-1.5 py-0.5 rounded">
                      Shot #{capturedPhotos.length - idx}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
