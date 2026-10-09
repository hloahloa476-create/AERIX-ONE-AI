import React from 'react';
import {
  Sparkles,
  Map,
  Film,
  LayoutGrid,
  Zap,
  PenSquare,
  Camera,
  Music,
  Gamepad2,
  ChevronRight,
  ShieldCheck,
  HardDrive,
  Activity,
  ArrowUpRight,
  User
} from 'lucide-react';
import { NavigationTab, AppId } from '../types';
import { soundEffects } from '../utils/sound';

interface HomePageProps {
  onNavigateTab: (tab: NavigationTab) => void;
  onOpenApp: (app: AppId) => void;
  onOpenLaterPhase: (title: string, desc: string, feat?: string) => void;
  onOpenNotifications: () => void;
  onOpenProfile?: () => void;
  userDisplayName?: string;
  userEmail?: string;
  userPhotoURL?: string;
  isEmailVerified?: boolean;
}

export const HomePage: React.FC<HomePageProps> = ({
  onNavigateTab,
  onOpenApp,
  onOpenLaterPhase,
  onOpenNotifications,
  onOpenProfile,
  userDisplayName = 'Commander Nova',
  userEmail = 'node@aerix.local',
  userPhotoURL,
  isEmailVerified = false,
}) => {
  const primaryShortcuts = [
    {
      tab: 'ai' as NavigationTab,
      title: 'AERIX Intelligence',
      subtitle: 'Neural chat & local reasoning',
      icon: Sparkles,
      accent: 'from-cyan-500/20 to-blue-500/10 border-cyan-500/30 text-cyan-400',
    },
    {
      tab: 'maps' as NavigationTab,
      title: 'Vector Cartography',
      subtitle: 'Metropolitan spatial mesh',
      icon: Map,
      accent: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    },
    {
      tab: 'shorts' as NavigationTab,
      title: 'AERIX Shorts',
      subtitle: 'Procedural vertical stream',
      icon: Film,
      accent: 'from-purple-500/20 to-pink-500/10 border-purple-500/30 text-purple-400',
    },
    {
      tab: 'apps' as NavigationTab,
      title: 'App Ecosystem',
      subtitle: '10 integrated system tools',
      icon: LayoutGrid,
      accent: 'from-blue-500/20 to-indigo-500/10 border-blue-500/30 text-blue-400',
    },
  ];

  const quickActions = [
    {
      id: 'quick-profile',
      label: 'Account',
      icon: User,
      action: () => (onOpenProfile ? onOpenProfile() : onOpenApp('settings')),
    },
    {
      id: 'quick-ai',
      label: 'Ask AI',
      icon: Sparkles,
      action: () => onNavigateTab('ai'),
    },
    {
      id: 'quick-games',
      label: 'Games',
      icon: Gamepad2,
      action: () => onOpenApp('games'),
    },
    {
      id: 'quick-notes',
      label: 'Notes',
      icon: PenSquare,
      action: () => onOpenApp('notes'),
    },
    {
      id: 'quick-cam',
      label: 'Camera',
      icon: Camera,
      action: () => onOpenApp('camera'),
    },
    {
      id: 'quick-music',
      label: 'Music',
      icon: Music,
      action: () => onOpenApp('music'),
    },
    {
      id: 'quick-mail',
      label: 'Mail',
      icon: Zap,
      action: () => onOpenApp('mail'),
    },
    {
      id: 'quick-apps',
      label: 'All Apps',
      icon: LayoutGrid,
      action: () => onNavigateTab('apps'),
    },
  ];

  const recentActivity = [
    {
      id: 'act1',
      title: 'Arcade Hi-Score Recorded',
      subtitle: 'Electric Car Racing · 1,420 pts',
      time: '12m ago',
      icon: Gamepad2,
      onClick: () => onOpenApp('games')
    },
    {
      id: 'act2',
      title: 'Vector Map Pin Synced',
      subtitle: 'Skyline Hyperloop Terminal · Sector 4',
      time: '45m ago',
      icon: Map,
      onClick: () => onNavigateTab('maps')
    },
    {
      id: 'act3',
      title: 'Local Note Secured',
      subtitle: 'Architectural Philosophy · System Folder',
      time: '2h ago',
      icon: PenSquare,
      onClick: () => onOpenApp('notes')
    }
  ];

  return (
    <div className="w-full max-w-md mx-auto px-4 py-5 space-y-6 pb-24">
      {/* Welcome Hero Card */}
      <section className="relative overflow-hidden aerix-glass-card rounded-3xl p-5 border border-cyan-500/20 shadow-xl">
        <div className="absolute top-0 right-0 w-44 h-44 bg-gradient-to-bl from-cyan-500/15 via-blue-500/5 to-transparent rounded-full blur-2xl pointer-events-none" />

        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1">
            <span className="text-[11px] font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping inline-block" />
              Everything. One Intelligence.
            </span>
            <h2 className="text-2xl font-bold font-display text-white tracking-tight">
              Welcome, {userDisplayName}
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed max-w-xs mt-1">
              Node authorization active · {userEmail}
            </p>
          </div>

          {/* Profile Trigger Button on Home */}
          {onOpenProfile && (
            <button
              onClick={() => {
                soundEffects.playHapticClick();
                onOpenProfile();
              }}
              className="p-2 rounded-2xl aerix-glass-card hover:bg-slate-800/80 border border-slate-700 flex flex-col items-center gap-1 active:scale-95 transition-all shrink-0"
              title="Open User Profile"
            >
              <div className="w-10 h-10 rounded-xl bg-cyan-500/20 border border-cyan-400 flex items-center justify-center text-cyan-400 font-bold text-xs overflow-hidden">
                {userPhotoURL ? (
                  <img src={userPhotoURL} alt="User" className="w-full h-full object-cover" />
                ) : (
                  userDisplayName.slice(0, 2).toUpperCase()
                )}
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-medium">Account</span>
            </button>
          )}
        </div>

        {/* Real-time system diagnostics meter */}
        <div className="grid grid-cols-3 gap-2 mt-4 pt-4 border-t border-slate-800/80 text-[11px]">
          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col">
            <span className="text-slate-400 font-mono flex items-center gap-1">
              <Activity className="w-3 h-3 text-cyan-400" />
              Neural
            </span>
            <span className="font-semibold text-white mt-0.5">Local 100%</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col">
            <span className="text-slate-400 font-mono flex items-center gap-1">
              <HardDrive className="w-3 h-3 text-emerald-400" />
              Storage
            </span>
            <span className="font-semibold text-white mt-0.5">Sandboxed</span>
          </div>

          <div className="p-2 rounded-xl bg-slate-900/60 border border-slate-800 flex flex-col">
            <span className="text-slate-400 font-mono flex items-center gap-1">
              <ShieldCheck className="w-3 h-3 text-purple-400" />
              Security
            </span>
            <span className="font-semibold text-white mt-0.5">Tier 2 Valid</span>
          </div>
        </div>
      </section>

      {/* Quick Action Scroller */}
      <section className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Fast Launch
          </h3>
          <span className="text-[11px] text-slate-500">Tap to engage</span>
        </div>

        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {quickActions.map((qa) => {
            const Icon = qa.icon;
            return (
              <button
                key={qa.id}
                onClick={() => {
                  soundEffects.playHapticClick();
                  qa.action();
                }}
                className="min-h-[44px] px-3.5 py-2 rounded-2xl aerix-glass-card hover:bg-slate-800/80 border border-slate-800 hover:border-cyan-500/40 flex items-center gap-2 text-xs font-medium text-slate-200 whitespace-nowrap active:scale-95 transition-all shadow-sm shrink-0"
              >
                <Icon className="w-3.5 h-3.5 text-cyan-400" />
                <span>{qa.label}</span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Primary Section Shortcuts (Grid) */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Core Modules
          </h3>
          <span className="text-[11px] text-slate-500">Navigation Hub</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          {primaryShortcuts.map((item) => {
            const Icon = item.icon;
            return (
              <button
                key={item.tab}
                onClick={() => {
                  soundEffects.playHapticClick();
                  onNavigateTab(item.tab);
                }}
                className="group p-4 rounded-3xl aerix-glass-card border hover:border-cyan-500/40 flex flex-col justify-between text-left h-36 transition-all hover:shadow-lg hover:shadow-cyan-500/5 active:scale-[0.98]"
              >
                <div className="flex items-center justify-between w-full">
                  <div
                    className={`w-10 h-10 rounded-2xl bg-gradient-to-tr ${item.accent} border flex items-center justify-center`}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <ArrowUpRight className="w-4 h-4 text-slate-500 group-hover:text-cyan-400 transition-colors" />
                </div>

                <div className="space-y-0.5">
                  <h4 className="font-semibold text-sm text-white group-hover:text-cyan-300 transition-colors">
                    {item.title}
                  </h4>
                  <p className="text-[11px] text-slate-400 truncate">
                    {item.subtitle}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Recent System Activity */}
      <section className="space-y-2.5">
        <div className="flex items-center justify-between px-1">
          <h3 className="text-xs font-semibold text-slate-300 uppercase tracking-wider font-mono">
            Recent System Activity
          </h3>
          <button
            onClick={onOpenNotifications}
            className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-0.5 transition-colors"
          >
            <span>View feed</span>
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>

        <div className="aerix-glass rounded-3xl border border-slate-800/80 divide-y divide-slate-800/60 overflow-hidden">
          {recentActivity.map((act) => {
            const Icon = act.icon;
            return (
              <button
                key={act.id}
                onClick={() => {
                  soundEffects.playHapticClick();
                  act.onClick();
                }}
                className="w-full p-3.5 flex items-center justify-between gap-3 text-left hover:bg-slate-800/40 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-xl bg-slate-800/80 border border-slate-700/60 flex items-center justify-center text-slate-300">
                    <Icon className="w-4 h-4 text-cyan-400" />
                  </div>
                  <div>
                    <h5 className="font-semibold text-xs text-white">
                      {act.title}
                    </h5>
                    <p className="text-[11px] text-slate-400">
                      {act.subtitle}
                    </p>
                  </div>
                </div>

                <span className="text-[10px] font-mono text-slate-500 shrink-0">
                  {act.time}
                </span>
              </button>
            );
          })}
        </div>
      </section>

      {/* Phase 1 Advisory Notice Box */}
      <section className="p-4 rounded-2xl bg-cyan-950/20 border border-cyan-800/30 flex items-start gap-3 text-xs text-slate-300">
        <Zap className="w-4 h-4 text-cyan-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <div className="font-semibold text-white text-xs">
            Offline Autonomy Protocol
          </div>
          <p className="text-[11px] text-slate-400 leading-relaxed">
            All user data, notes, cartography vectors, and synthesizer loops run locally. External API bridges will become available in Phase 2.
          </p>
          <button
            onClick={() =>
              onOpenLaterPhase(
                'Phase 2 Architecture & External Bridges',
                'Phase 2 will integrate the Gemini Multimodal API, Google Maps Live Satellite Imagery, WebRTC Cellular Gateways, and Cloud Sync.',
                'Phase 2 Roadmap'
              )
            }
            className="text-[11px] font-semibold text-cyan-400 hover:text-cyan-300 flex items-center gap-1 pt-1"
          >
            Review Roadmap Spec
            <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </section>
    </div>
  );
};
