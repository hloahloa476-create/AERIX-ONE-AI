import React from 'react';
import { Home, Sparkles, Map, Film, LayoutGrid } from 'lucide-react';
import { NavigationTab } from '../types';
import { soundEffects } from '../utils/sound';

interface NavigationProps {
  activeTab: NavigationTab;
  onTabChange: (tab: NavigationTab) => void;
}

export const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'home' as NavigationTab, label: 'Home', icon: Home },
    { id: 'ai' as NavigationTab, label: 'AI', icon: Sparkles },
    { id: 'maps' as NavigationTab, label: 'Maps', icon: Map },
    { id: 'shorts' as NavigationTab, label: 'Shorts', icon: Film },
    { id: 'apps' as NavigationTab, label: 'Apps', icon: LayoutGrid },
  ];

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50 aerix-glass-elevated border-t border-slate-800/80 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-1.5 transition-all shadow-2xl"
      aria-label="Main Navigation"
    >
      <div className="max-w-md mx-auto grid grid-cols-5 items-center px-2">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              onClick={() => {
                soundEffects.playHapticClick();
                onTabChange(tab.id);
              }}
              className={`min-h-[48px] py-1 flex flex-col items-center justify-center relative rounded-xl transition-all duration-150 select-none ${
                isActive
                  ? 'text-cyan-400'
                  : 'text-slate-400 hover:text-slate-200 active:scale-95'
              }`}
              aria-current={isActive ? 'page' : undefined}
            >
              {/* Active ambient glow pill */}
              {isActive && (
                <div className="absolute inset-0 bg-cyan-500/10 rounded-xl -z-10 border border-cyan-500/20" />
              )}

              <div className="relative">
                <Icon
                  className={`w-5 h-5 transition-transform duration-150 ${
                    isActive ? 'scale-110' : 'group-hover:scale-105'
                  }`}
                  strokeWidth={isActive ? 2.3 : 1.8}
                />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
                )}
              </div>

              <span
                className={`text-[10px] tracking-tight mt-1 whitespace-nowrap font-medium ${
                  isActive ? 'text-cyan-300 font-semibold' : 'text-slate-400'
                }`}
              >
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
