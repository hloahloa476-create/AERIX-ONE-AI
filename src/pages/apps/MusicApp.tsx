import React, { useState, useEffect } from 'react';
import {
  Music,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Volume2,
  VolumeX,
  Disc,
  Radio,
  ListMusic,
  X,
  Sparkles,
  Heart
} from 'lucide-react';
import { MusicTrack } from '../../types';
import { INITIAL_TRACKS } from '../../data/mockData';
import { musicSynth, soundEffects } from '../../utils/sound';

interface MusicAppProps {
  onClose: () => void;
}

export const MusicApp: React.FC<MusicAppProps> = ({ onClose }) => {
  const [activeTab, setActiveTab] = useState<'tracks' | 'albums' | 'artists' | 'playlists'>('tracks');
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [volume, setVolume] = useState(80);
  const [isFavorite, setIsFavorite] = useState(false);

  const currentTrack = INITIAL_TRACKS[currentTrackIndex] || INITIAL_TRACKS[0];

  // Track timer
  useEffect(() => {
    let timer: number;
    if (isPlaying) {
      timer = window.setInterval(() => {
        setCurrentTime((t) => (t >= currentTrack.duration ? 0 : t + 1));
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [isPlaying, currentTrack.duration]);

  // Clean stop on unmount
  useEffect(() => {
    return () => {
      musicSynth.stop();
    };
  }, []);

  const togglePlay = () => {
    soundEffects.playHapticClick();
    if (!isPlaying) {
      musicSynth.start(currentTrack.frequencies);
      setIsPlaying(true);
    } else {
      musicSynth.stop();
      setIsPlaying(false);
    }
  };

  const nextTrack = () => {
    soundEffects.playHapticClick();
    const nextIdx = (currentTrackIndex + 1) % INITIAL_TRACKS.length;
    setCurrentTrackIndex(nextIdx);
    setCurrentTime(0);
    if (isPlaying) {
      musicSynth.stop();
      musicSynth.start(INITIAL_TRACKS[nextIdx].frequencies);
    }
  };

  const prevTrack = () => {
    soundEffects.playHapticClick();
    const prevIdx = (currentTrackIndex - 1 + INITIAL_TRACKS.length) % INITIAL_TRACKS.length;
    setCurrentTrackIndex(prevIdx);
    setCurrentTime(0);
    if (isPlaying) {
      musicSynth.stop();
      musicSynth.start(INITIAL_TRACKS[prevIdx].frequencies);
    }
  };

  const selectTrack = (index: number) => {
    soundEffects.playHapticClick();
    setCurrentTrackIndex(index);
    setCurrentTime(0);
    musicSynth.stop();
    musicSynth.start(INITIAL_TRACKS[index].frequencies);
    setIsPlaying(true);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${mins}:${s.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 z-40 bg-[#040711] text-slate-100 flex flex-col overflow-hidden select-none pb-16">
      {/* Top Header */}
      <div className="p-3 aerix-glass border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-purple-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Music className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-display text-white">
              AERIX ACOUSTICS
            </h2>
            <span className="text-[10px] font-mono text-cyan-400">
              Procedural Synthesizer Active
            </span>
          </div>
        </div>

        <button
          onClick={() => {
            musicSynth.stop();
            onClose();
          }}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Tabs Switcher */}
      <div className="p-2 border-b border-slate-800/80 aerix-glass flex items-center justify-center gap-2 shrink-0">
        {[
          { id: 'tracks', label: 'Tracks', icon: Music },
          { id: 'albums', label: 'Albums', icon: Disc },
          { id: 'artists', label: 'Artists', icon: Radio },
          { id: 'playlists', label: 'Playlists', icon: ListMusic },
        ].map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => {
                soundEffects.playHapticClick();
                setActiveTab(tab.id as typeof activeTab);
              }}
              className={`min-h-[36px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all ${
                isActive
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Icon className="w-3.5 h-3.5" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-4">
        {/* Track List */}
        {activeTab === 'tracks' && (
          <div className="space-y-2">
            <span className="text-xs font-mono text-slate-400 uppercase tracking-wider block mb-1">
              Synthesizer Soundscape Library
            </span>
            {INITIAL_TRACKS.map((t, idx) => {
              const isSelected = idx === currentTrackIndex;
              return (
                <div
                  key={t.id}
                  onClick={() => selectTrack(idx)}
                  className={`p-3 rounded-2xl border cursor-pointer flex items-center justify-between transition-all ${
                    isSelected
                      ? 'bg-cyan-950/40 border-cyan-500/50 shadow-md'
                      : 'aerix-glass-card border-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs ${
                        isSelected
                          ? 'bg-cyan-500 text-slate-950 shadow'
                          : 'bg-slate-800 text-slate-400'
                      }`}
                    >
                      {isSelected && isPlaying ? (
                        <div className="flex items-end gap-0.5 h-3">
                          <span className="w-1 bg-slate-950 h-3 animate-bounce" />
                          <span className="w-1 bg-slate-950 h-2 animate-bounce" style={{ animationDelay: '0.1s' }} />
                          <span className="w-1 bg-slate-950 h-3 animate-bounce" style={{ animationDelay: '0.2s' }} />
                        </div>
                      ) : (
                        `0${idx + 1}`
                      )}
                    </div>
                    <div>
                      <h4 className="font-semibold text-xs text-white">
                        {t.title}
                      </h4>
                      <p className="text-[10px] text-slate-400">
                        {t.album} · {t.genre}
                      </p>
                    </div>
                  </div>

                  <span className="text-[10px] font-mono text-slate-500">
                    {formatTime(t.duration)}
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Albums Tab */}
        {activeTab === 'albums' && (
          <div className="grid grid-cols-2 gap-3">
            {['Zero Gravity Vol. 1', 'Deep Space Reverie', 'Atmospheric Layers'].map((alb, i) => (
              <div
                key={alb}
                onClick={() => selectTrack(i % INITIAL_TRACKS.length)}
                className="p-4 rounded-3xl aerix-glass-card border border-slate-800 flex flex-col items-center text-center cursor-pointer group"
              >
                <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-3 shadow-lg">
                  <Disc className="w-10 h-10 group-hover:rotate-45 transition-transform" />
                </div>
                <h4 className="font-bold text-xs text-white group-hover:text-cyan-300 truncate w-full">
                  {alb}
                </h4>
                <p className="text-[10px] text-slate-400 mt-0.5">AERIX Acoustic Engine</p>
              </div>
            ))}
          </div>
        )}

        {/* Artists Tab */}
        {activeTab === 'artists' && (
          <div className="space-y-2">
            <div className="p-4 rounded-3xl aerix-glass border border-slate-800 flex items-center gap-4">
              <div className="w-14 h-14 rounded-full bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 font-bold text-base">
                ASE
              </div>
              <div>
                <h4 className="font-bold text-sm text-white">AERIX Sound Engine</h4>
                <p className="text-xs text-slate-400">Procedural Mathematical Harmonizer</p>
                <span className="text-[10px] font-mono text-cyan-400 mt-1 inline-block">
                  4 Active Synthesized Master Tracks
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Playlists Tab */}
        {activeTab === 'playlists' && (
          <div className="space-y-2">
            {[
              { title: 'Suborbital Focus Flow', tracks: 4, desc: 'Binaural drone & relaxing sine frequencies.' },
              { title: 'Cybernetic High Drive', tracks: 2, desc: '128 BPM electro-synaptic pulses.' },
            ].map((p, i) => (
              <div
                key={p.title}
                onClick={() => selectTrack(i)}
                className="p-4 rounded-3xl aerix-glass-card border border-slate-800 cursor-pointer flex items-center justify-between"
              >
                <div>
                  <h4 className="font-bold text-xs text-white">{p.title}</h4>
                  <p className="text-[11px] text-slate-400 mt-0.5">{p.desc}</p>
                </div>
                <ListMusic className="w-5 h-5 text-cyan-400" />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Floating Audio Player Deck */}
      <div className="p-4 aerix-glass-elevated border-t border-slate-800 max-w-md mx-auto w-full space-y-3 shrink-0">
        <div className="flex items-center justify-between">
          <div className="truncate">
            <h4 className="font-bold text-sm text-white truncate">
              {currentTrack.title}
            </h4>
            <p className="text-xs text-slate-400 font-mono truncate">
              {currentTrack.artist} · {currentTrack.bpm} BPM
            </p>
          </div>

          <button
            onClick={() => {
              soundEffects.playHapticClick();
              setIsFavorite(!isFavorite);
            }}
            className="p-2 text-slate-400 hover:text-rose-500"
          >
            <Heart
              className={`w-5 h-5 ${isFavorite ? 'fill-rose-500 text-rose-500' : ''}`}
            />
          </button>
        </div>

        {/* Progress Timeline */}
        <div className="space-y-1">
          <div className="w-full h-1.5 bg-slate-800 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 transition-all duration-300"
              style={{
                width: `${(currentTime / currentTrack.duration) * 100}%`,
              }}
            />
          </div>
          <div className="flex justify-between text-[10px] font-mono text-slate-500">
            <span>{formatTime(currentTime)}</span>
            <span>{formatTime(currentTrack.duration)}</span>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center justify-center gap-6">
          <button
            onClick={prevTrack}
            className="p-2 text-slate-300 hover:text-white"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          <button
            onClick={togglePlay}
            className="w-14 h-14 rounded-full bg-cyan-500 hover:bg-cyan-400 text-slate-950 flex items-center justify-center shadow-lg shadow-cyan-500/30 active:scale-95 transition-transform"
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          <button
            onClick={nextTrack}
            className="p-2 text-slate-300 hover:text-white"
          >
            <SkipForward className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
};
