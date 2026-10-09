import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Star,
  ExternalLink,
  CheckCircle2,
  Clock,
  Layers,
  ShieldAlert,
  ArrowUpRight,
  Bell,
  BellRing,
  Film,
  Image,
  Video,
  MessageSquare,
  UtensilsCrossed,
  Mic,
  PenTool,
  Sliders,
  Scissors,
  Wrench,
  FileText,
  Presentation,
  Gamepad2,
  Mail,
  Phone,
  Folder,
  Camera,
  Music,
  PenSquare,
  Globe,
  Settings,
  Lock,
  Box
} from 'lucide-react';
import { AppDefinition, AppPlan, appsService } from '../../services/appsService';
import { soundEffects } from '../../utils/sound';

interface AppDetailsModalProps {
  app: AppDefinition;
  isFavorite: boolean;
  hasNotificationAlert: boolean;
  userPlan?: AppPlan;
  onClose: () => void;
  onOpenApp: (app: AppDefinition) => void;
  onToggleFavorite: (appId: string) => void;
  onToggleNotificationAlert: (appId: string) => void;
}

// Icon mapper for dynamic string icon names
export const getAppIconComponent = (iconName: string): React.ElementType => {
  switch (iconName) {
    case 'Film':
      return Film;
    case 'Image':
      return Image;
    case 'Video':
      return Video;
    case 'MessageSquare':
      return MessageSquare;
    case 'UtensilsCrossed':
      return UtensilsCrossed;
    case 'Mic':
      return Mic;
    case 'PenTool':
      return PenTool;
    case 'Sliders':
      return Sliders;
    case 'Scissors':
      return Scissors;
    case 'Wrench':
      return Wrench;
    case 'FileText':
      return FileText;
    case 'Presentation':
      return Presentation;
    case 'Gamepad2':
      return Gamepad2;
    case 'Mail':
      return Mail;
    case 'Phone':
      return Phone;
    case 'Folder':
      return Folder;
    case 'Camera':
      return Camera;
    case 'Music':
      return Music;
    case 'PenSquare':
      return PenSquare;
    case 'Globe':
      return Globe;
    case 'Settings':
      return Settings;
    case 'Box':
      return Box;
    default:
      return Sparkles;
  }
};

export const AppDetailsModal: React.FC<AppDetailsModalProps> = ({
  app,
  isFavorite,
  hasNotificationAlert,
  userPlan = 'Free',
  onClose,
  onOpenApp,
  onToggleFavorite,
  onToggleNotificationAlert
}) => {
  const Icon = getAppIconComponent(app.iconName);
  const [showUpgradeNotice, setShowUpgradeNotice] = useState(false);

  const isPlanLocked = 
    (app.requiredPlan === 'Pro' && userPlan === 'Free') ||
    (app.requiredPlan === 'Premium' && (userPlan === 'Free' || userPlan === 'Pro'));

  const handleAction = () => {
    soundEffects.playHapticClick();
    if (app.status === 'Coming Soon') {
      onToggleNotificationAlert(app.id);
      return;
    }

    if (isPlanLocked) {
      setShowUpgradeNotice(true);
      return;
    }

    onOpenApp(app);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4 animate-fadeIn">
      <div className="w-full max-w-xl max-h-[90vh] rounded-3xl aerix-glass border border-slate-700 bg-slate-950 flex flex-col shadow-2xl overflow-hidden">
        {/* Modal Top Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center justify-between shrink-0 bg-slate-900/60">
          <div className="flex items-center gap-2 text-xs font-mono text-slate-400">
            <span>AERIX APPS HUB</span>
            <span>•</span>
            <span className="text-cyan-400">{app.category}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => onToggleFavorite(app.id)}
              className="p-1.5 rounded-xl aerix-glass border border-slate-800 text-slate-400 hover:text-amber-400 transition-colors"
              title="Favorite"
            >
              <Star className={`w-4 h-4 ${isFavorite ? 'text-amber-400 fill-amber-400' : ''}`} />
            </button>
            <button
              onClick={onClose}
              className="p-1.5 rounded-xl aerix-glass border border-slate-800 text-slate-400 hover:text-white transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-6 overflow-y-auto no-scrollbar space-y-6">
          {/* Header Card */}
          <div className="flex items-start gap-4">
            <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${app.gradient} border flex items-center justify-center shrink-0 shadow-xl`}>
              <Icon className="w-8 h-8" />
            </div>

            <div className="space-y-1 flex-1">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 className="text-lg font-bold font-display text-white">{app.name}</h2>
                <span
                  className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    app.status === 'Active'
                      ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'
                      : app.status === 'Beta'
                      ? 'bg-amber-500/20 text-amber-300 border-amber-500/30'
                      : app.status === 'Coming Soon'
                      ? 'bg-purple-500/20 text-purple-300 border-purple-500/30'
                      : 'bg-rose-500/20 text-rose-300 border-rose-500/30'
                  }`}
                >
                  {app.status}
                </span>

                {app.requiredPlan !== 'Free' && (
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    <span>{app.requiredPlan}</span>
                  </span>
                )}
              </div>

              <p className="text-xs text-slate-300 font-medium">{app.tagline}</p>

              <div className="flex items-center gap-3 text-[10px] font-mono text-slate-400 pt-1">
                <span>v{app.version}</span>
                <span>•</span>
                <span>★ {app.rating}</span>
                <span>•</span>
                <span>{app.usersCount} users</span>
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="p-4 rounded-2xl bg-slate-900/90 border border-slate-800 text-xs text-slate-300 leading-relaxed">
            {app.description}
          </div>

          {/* Upgrade Plan Notice (Architecture prepared for Free / Pro / Premium) */}
          {showUpgradeNotice && (
            <div className="p-4 rounded-2xl bg-cyan-950/40 border border-cyan-500/40 space-y-2 animate-fadeIn">
              <div className="flex items-center gap-2 text-xs font-bold text-cyan-300">
                <Lock className="w-4 h-4 text-cyan-400" />
                <span>Upgrade to access {app.name}</span>
              </div>
              <p className="text-xs text-slate-300">
                This AI tool requires the <strong>{app.requiredPlan}</strong> tier. You are currently on the Free tier.
              </p>
              <div className="flex items-center gap-2 pt-1 text-[11px] font-mono text-cyan-400">
                <span>Pro & Premium tier integration architecture ready</span>
              </div>
            </div>
          )}

          {/* Main Features */}
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
              Main Capabilities & Features
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {app.features.map((feat, idx) => (
                <div
                  key={idx}
                  className="p-3 rounded-2xl bg-slate-900 border border-slate-800/80 flex items-center gap-2.5 text-xs text-slate-200"
                >
                  <CheckCircle2 className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span>{feat}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Recent Projects / Templates */}
          {app.recentProjects && app.recentProjects.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-xs font-bold text-slate-200 uppercase font-mono tracking-wider">
                Recent Projects & Quick Start
              </h3>
              <div className="space-y-2">
                {app.recentProjects.map((p) => (
                  <div
                    key={p.id}
                    className="p-3 rounded-2xl bg-slate-900/60 border border-slate-800 flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-semibold text-white block">{p.title}</span>
                      <span className="text-[10px] font-mono text-slate-400">{p.date}</span>
                    </div>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-lg bg-slate-800 text-slate-300">
                      {p.tag}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Modal Action Bar */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/80 flex items-center justify-between shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white"
          >
            Back to Apps
          </button>

          {app.status === 'Coming Soon' ? (
            <button
              onClick={handleAction}
              className={`py-2 px-5 rounded-2xl font-bold text-xs flex items-center gap-2 transition-all ${
                hasNotificationAlert
                  ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40'
                  : 'bg-purple-600 hover:bg-purple-500 text-white shadow-lg shadow-purple-500/20'
              }`}
            >
              {hasNotificationAlert ? <BellRing className="w-4 h-4 text-purple-400" /> : <Bell className="w-4 h-4" />}
              <span>{hasNotificationAlert ? 'Notification Active' : 'Notify Me'}</span>
            </button>
          ) : (
            <button
              onClick={handleAction}
              className="py-2.5 px-6 rounded-2xl bg-gradient-to-r from-cyan-500 via-blue-600 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-xl shadow-cyan-500/20 active:scale-95 transition-all"
            >
              <span>Open {app.name}</span>
              <ArrowUpRight className="w-4 h-4 text-slate-950" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};
