import React, { useState, useEffect } from 'react';
import { Cpu, Bell, Wifi, WifiOff, User } from 'lucide-react';
import { soundEffects } from '../utils/sound';

interface TopBarProps {
  onOpenNotifications: () => void;
  unreadNotificationsCount: number;
  onNavigateHome: () => void;
  onOpenProfile?: () => void;
  userDisplayName?: string;
  userPhotoURL?: string;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenNotifications,
  unreadNotificationsCount,
  onNavigateHome,
  onOpenProfile,
  userDisplayName,
  userPhotoURL,
}) => {
  const [isOnline, setIsOnline] = useState(true);
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    setIsOnline(navigator.onLine);
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const updateClock = () => {
      const d = new Date();
      setCurrentTime(
        d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      );
    };
    updateClock();
    const timer = setInterval(updateClock, 1000);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      clearInterval(timer);
    };
  }, []);

  return (
    <>
      {/* Offline Alert Strip */}
      {!isOnline && (
        <div className="w-full bg-amber-950/90 border-b border-amber-600/50 py-1 px-4 text-center text-[11px] font-mono text-amber-200 flex items-center justify-center gap-1.5 z-40 sticky top-0">
          <WifiOff className="w-3.5 h-3.5 text-amber-400" />
          <span>You're offline · Operating in local node mode · Cloud sync paused</span>
        </div>
      )}

      <header className="sticky top-0 z-30 w-full aerix-glass border-b border-slate-800/80 px-4 py-2.5 transition-all">
        <div className="max-w-md mx-auto flex items-center justify-between gap-3">
          {/* Zone 1: Brand Wordmark */}
          <button
            onClick={() => {
              soundEffects.playHapticClick();
              onNavigateHome();
            }}
            className="flex items-center gap-2 group text-left focus:outline-none"
          >
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400 group-hover:border-cyan-400 transition-colors overflow-hidden">
              <img
                src="/src/assets/images/aerix_one_logo_1791197135811.jpg"
                alt="AERIX ONE Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-display font-bold text-sm tracking-tight text-white group-hover:text-cyan-300 transition-colors">
                  AERIX ONE
                </span>
                <span className="text-[10px] font-mono text-cyan-400 px-1 py-0.2 bg-cyan-950/60 rounded border border-cyan-800/50">
                  P5
                </span>
              </div>
              <div className="text-[10px] text-slate-400 font-mono flex items-center gap-1 leading-none mt-0.5">
                <span>{currentTime || '09:41'}</span>
                <span>·</span>
                <span className="text-slate-400">Node Alpha</span>
              </div>
            </div>
          </button>

          {/* Zone 2: Status & Mode */}
          <div className="flex items-center gap-2">
            {/* Online / Offline Status Badge */}
            <div
              className={`flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-mono border transition-colors ${
                isOnline
                  ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/40'
                  : 'bg-amber-950/40 text-amber-300 border-amber-800/40 animate-pulse'
              }`}
            >
              {isOnline ? (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                  <Wifi className="w-3 h-3 text-emerald-400" />
                  <span className="hidden sm:inline">Online</span>
                </>
              ) : (
                <>
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                  <WifiOff className="w-3 h-3 text-amber-400" />
                  <span>Offline</span>
                </>
              )}
            </div>
          </div>

          {/* Zone 3: Actions (Notifications & User Profile) */}
          <div className="flex items-center gap-1.5">
            {/* Notifications Button */}
            <button
              onClick={() => {
                soundEffects.playHapticClick();
                onOpenNotifications();
              }}
              className="relative w-9 h-9 rounded-xl aerix-glass-card hover:bg-slate-800 flex items-center justify-center text-slate-300 hover:text-white transition-colors"
              aria-label="Open notifications"
            >
              <Bell className="w-4 h-4" />
              {unreadNotificationsCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-cyan-400 animate-pulse ring-2 ring-[#030712]" />
              )}
            </button>

            {/* Profile Button */}
            {onOpenProfile && (
              <button
                onClick={() => {
                  soundEffects.playHapticClick();
                  onOpenProfile();
                }}
                className="w-9 h-9 rounded-xl aerix-glass-card hover:bg-slate-800 border border-slate-700/80 flex items-center justify-center text-cyan-400 hover:text-white transition-colors overflow-hidden"
                aria-label="Open profile"
                title={userDisplayName || 'Account Profile'}
              >
                {userPhotoURL ? (
                  <img
                    src={userPhotoURL}
                    alt="User"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
              </button>
            )}
          </div>
        </div>
      </header>
    </>
  );
};
