import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  Sparkles,
  Star,
  Clock,
  Flame,
  ArrowUpRight,
  Filter,
  X,
  RefreshCw,
  AlertCircle,
  ShieldCheck,
  ChevronRight,
  Lock,
  Bell,
  BellRing,
  Layers,
  Wrench,
  SlidersHorizontal
} from 'lucide-react';
import {
  appsService,
  AppDefinition,
  AppCategory,
  AppStatus,
  AppUsageRecord
} from '../services/appsService';
import { AppId, NavigationTab } from '../types';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { soundEffects } from '../utils/sound';
import { AppDetailsModal, getAppIconComponent } from '../components/apps/AppDetailsModal';

interface AppsPageProps {
  onOpenApp: (app: AppId) => void;
  onOpenLaterPhase: (title: string, desc: string, feat?: string) => void;
  onNavigateTab?: (tab: NavigationTab) => void;
}

export const AppsPage: React.FC<AppsPageProps> = ({
  onOpenApp,
  onOpenLaterPhase,
  onNavigateTab
}) => {
  const { currentUser, userProfile } = useAuth();
  const { language, isRtl } = useLanguage();
  const userId = currentUser?.uid || 'guest';

  // Catalog & Filter States
  const [apps, setApps] = useState<AppDefinition[]>(() => appsService.getAllApps());
  const [selectedCategory, setSelectedCategory] = useState<AppCategory>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStatusFilter, setSelectedStatusFilter] = useState<'All' | AppStatus>('All');

  // User State
  const [favorites, setFavorites] = useState<string[]>([]);
  const [recentlyUsed, setRecentlyUsed] = useState<AppUsageRecord[]>([]);
  const [notificationAlerts, setNotificationAlerts] = useState<string[]>([]);
  const [isLoadingUserData, setIsLoadingUserData] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  // App Detail View
  const [activeDetailApp, setActiveDetailApp] = useState<AppDefinition | null>(null);

  // Load User Data (Favorites, Recents, Notifications)
  const loadUserData = async () => {
    setIsLoadingUserData(true);
    setLoadError(null);
    try {
      const [favs, recents, alerts] = await Promise.all([
        appsService.getFavorites(userId),
        appsService.getRecentlyUsed(userId),
        appsService.getNotificationPreferences(userId)
      ]);
      setFavorites(favs);
      setRecentlyUsed(recents);
      setNotificationAlerts(alerts);
    } catch (err: any) {
      console.warn('Failed to load user app data:', err);
      setLoadError('Could not sync user app preferences with cloud.');
    } finally {
      setIsLoadingUserData(false);
    }
  };

  useEffect(() => {
    loadUserData();
  }, [userId]);

  // Categories list per specification
  const categories: AppCategory[] = [
    'All',
    'Video',
    'Image',
    'Audio',
    'Writing',
    'Productivity',
    'Lifestyle',
    'AI Tools'
  ];

  // Instant Filter & Search logic
  const filteredApps = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    return apps.filter((app) => {
      // Category filter
      if (selectedCategory !== 'All' && app.category !== selectedCategory) {
        return false;
      }

      // Status filter
      if (selectedStatusFilter !== 'All' && app.status !== selectedStatusFilter) {
        return false;
      }

      // Search query over: name, description, category, features
      if (q) {
        const matchesName = app.name.toLowerCase().includes(q);
        const matchesDesc = app.description.toLowerCase().includes(q) || app.tagline.toLowerCase().includes(q);
        const matchesCat = app.category.toLowerCase().includes(q);
        const matchesFeatures = app.features.some((f) => f.toLowerCase().includes(q));

        if (!matchesName && !matchesDesc && !matchesCat && !matchesFeatures) {
          return false;
        }
      }

      return true;
    });
  }, [apps, selectedCategory, selectedStatusFilter, searchQuery]);

  // Favorites list mapped to app definitions
  const favoriteApps = useMemo(() => {
    return apps.filter((a) => favorites.includes(a.id));
  }, [apps, favorites]);

  // Recently used list mapped to app definitions
  const recentApps = useMemo(() => {
    return recentlyUsed
      .map((record) => {
        const found = apps.find((a) => a.id === record.appId);
        return found ? { app: found, record } : null;
      })
      .filter(Boolean) as Array<{ app: AppDefinition; record: AppUsageRecord }>;
  }, [apps, recentlyUsed]);

  // Featured apps list
  const featuredApps = useMemo(() => {
    return apps.filter((a) => a.featured);
  }, [apps]);

  // Handlers
  const handleToggleFavorite = async (appId: string) => {
    soundEffects.playHapticClick();
    // Optimistic UI update
    setFavorites((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
    try {
      const updated = await appsService.toggleFavorite(userId, appId);
      setFavorites(updated);
    } catch {
      // ignore
    }
  };

  const handleToggleNotification = async (appId: string) => {
    soundEffects.playHapticClick();
    setNotificationAlerts((prev) =>
      prev.includes(appId) ? prev.filter((id) => id !== appId) : [...prev, appId]
    );
    try {
      await appsService.toggleNotificationPreference(userId, appId);
    } catch {
      // ignore
    }
  };

  const handleLaunchApp = (app: AppDefinition) => {
    soundEffects.playHapticClick();

    // Track usage
    appsService.recordAppUsage(userId, app.id);
    setRecentlyUsed((prev) => {
      const filtered = prev.filter((x) => x.appId !== app.id);
      return [
        { appId: app.id, lastOpenedTime: new Date().toISOString(), usageCount: 1 },
        ...filtered
      ];
    });

    if (activeDetailApp) {
      setActiveDetailApp(null);
    }

    if (app.actionType === 'navigate_tab' && app.targetTab && onNavigateTab) {
      onNavigateTab(app.targetTab);
      return;
    }

    if (app.actionType === 'open_app' && app.targetApp) {
      onOpenApp(app.targetApp);
      return;
    }

    if (app.status === 'Coming Soon') {
      setActiveDetailApp(app);
      return;
    }

    onOpenLaterPhase(app.name, app.description, app.category);
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden pb-24 animate-fadeIn"
    >
      {/* 1. SECTION HERO & HEADER */}
      <div className="relative pt-6 pb-4 px-4 max-w-5xl mx-auto w-full space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
              <span className="text-[11px] font-mono uppercase tracking-widest text-cyan-400 font-bold">
                CENTRAL INTELLIGENCE HUB
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold font-display tracking-tight text-white mt-1">
              AERIX APPS
            </h1>
            <p className="text-xs md:text-sm text-slate-400 font-medium">
              Your AI tools, all in one place.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="px-3 py-1.5 rounded-2xl aerix-glass border border-slate-800 text-[11px] font-mono text-slate-400 hidden sm:flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
              <span>{apps.length} AI Engines</span>
            </span>
          </div>
        </div>

        {/* 2. SEARCH BAR */}
        <div className="relative">
          <Search className="w-4 h-4 text-slate-400 absolute left-4 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search AI apps by name, description, category, or features..."
            className="w-full pl-11 pr-10 py-3.5 bg-slate-900/90 border border-slate-800 hover:border-slate-700 rounded-2xl text-xs md:text-sm text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500 shadow-xl backdrop-blur-md transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-white"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* 3. CATEGORY FILTERS (Instant) */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar py-1">
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => {
                  soundEffects.playHapticClick();
                  setSelectedCategory(cat);
                }}
                className={`py-2 px-3.5 rounded-2xl text-xs font-mono font-semibold whitespace-nowrap transition-all duration-200 active:scale-95 ${
                  isSelected
                    ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                    : 'bg-slate-900/80 border border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Error notification banner if any */}
        {loadError && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-400" />
              <span>{loadError}</span>
            </div>
            <button
              onClick={loadUserData}
              className="px-2.5 py-1 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-mono text-[10px] flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          </div>
        )}
      </div>

      {/* 4. MAIN SCROLLABLE CONTENT */}
      <div className="max-w-5xl mx-auto w-full px-4 space-y-7 flex-1">
        {/* SECTION: FEATURED APPS (Shown when not filtering search) */}
        {!searchQuery && selectedCategory === 'All' && featuredApps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold font-mono text-cyan-400 uppercase tracking-widest flex items-center gap-2">
                <Flame className="w-3.5 h-3.5 text-cyan-400" />
                <span>Featured AI Engines</span>
              </h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
              {featuredApps.slice(0, 4).map((app) => {
                const Icon = getAppIconComponent(app.iconName);
                const isFav = favorites.includes(app.id);

                return (
                  <div
                    key={app.id}
                    onClick={() => setActiveDetailApp(app)}
                    className="p-5 rounded-3xl aerix-glass border border-slate-800 hover:border-cyan-500/50 bg-gradient-to-br from-slate-900/90 via-slate-900/60 to-slate-950 transition-all duration-300 cursor-pointer flex flex-col justify-between group shadow-xl hover:shadow-cyan-500/5 relative overflow-hidden"
                  >
                    {/* Ambient subtle glow */}
                    <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/5 rounded-full blur-2xl pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />

                    <div className="space-y-3">
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${app.gradient} border flex items-center justify-center shrink-0 shadow-lg group-hover:scale-105 transition-transform`}
                          >
                            <Icon className="w-6 h-6" />
                          </div>

                          <div>
                            <div className="flex items-center gap-1.5">
                              <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                                {app.name}
                              </h3>
                              {app.badge && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 border border-cyan-500/30">
                                  {app.badge}
                                </span>
                              )}
                            </div>
                            <span className="text-[10px] font-mono text-slate-400 block mt-0.5">
                              {app.category}
                            </span>
                          </div>
                        </div>

                        {/* Favorite button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(app.id);
                          }}
                          className="p-2 rounded-xl text-slate-500 hover:text-amber-400 hover:bg-slate-800/60 transition-colors"
                          title={isFav ? 'Remove from favorites' : 'Add to favorites'}
                        >
                          <Star className={`w-4 h-4 ${isFav ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                      </div>

                      <p className="text-xs text-slate-300 line-clamp-2 leading-relaxed">
                        {app.tagline}
                      </p>
                    </div>

                    {/* Card Bottom: Features & Open button */}
                    <div className="pt-4 border-t border-slate-850 flex items-center justify-between gap-2 mt-2">
                      <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                        <span>{app.status}</span>
                      </div>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunchApp(app);
                        }}
                        className="py-1.5 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1 shadow-md shadow-cyan-500/20 active:scale-95 transition-all"
                      >
                        <span>Open</span>
                        <ArrowUpRight className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: RECENTLY USED (Shown when available and not filtering search) */}
        {!searchQuery && selectedCategory === 'All' && recentApps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold font-mono text-slate-400 uppercase tracking-widest flex items-center gap-2">
                <Clock className="w-3.5 h-3.5 text-slate-400" />
                <span>Recently Used</span>
              </h2>
            </div>

            <div className="flex gap-3 overflow-x-auto no-scrollbar py-1">
              {recentApps.map(({ app, record }) => {
                const Icon = getAppIconComponent(app.iconName);

                return (
                  <div
                    key={app.id}
                    onClick={() => handleLaunchApp(app)}
                    className="p-3.5 min-w-[200px] max-w-[220px] rounded-2xl aerix-glass border border-slate-800 hover:border-slate-700 bg-slate-900/60 cursor-pointer shrink-0 transition-all space-y-2 group"
                  >
                    <div className="flex items-center justify-between">
                      <div
                        className={`w-9 h-9 rounded-xl bg-gradient-to-br ${app.gradient} border flex items-center justify-center shrink-0`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="text-[9px] font-mono text-slate-500">
                        {record.usageCount} launches
                      </span>
                    </div>

                    <div>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
                        {app.name}
                      </h4>
                      <p className="text-[10px] text-slate-400 truncate mt-0.5">{app.category}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: FAVORITES (Shown when user has favorites) */}
        {!searchQuery && selectedCategory === 'All' && favoriteApps.length > 0 && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="text-xs font-bold font-mono text-amber-400 uppercase tracking-widest flex items-center gap-2">
                <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                <span>Favorites</span>
              </h2>
              <span className="text-[10px] font-mono text-slate-500">
                {favoriteApps.length} pinned
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2.5">
              {favoriteApps.map((app) => {
                const Icon = getAppIconComponent(app.iconName);

                return (
                  <div
                    key={app.id}
                    onClick={() => setActiveDetailApp(app)}
                    className="p-3.5 rounded-2xl aerix-glass border border-slate-800 hover:border-amber-400/40 bg-slate-900/50 cursor-pointer transition-all flex flex-col justify-between group"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div
                          className={`w-8 h-8 rounded-xl bg-gradient-to-br ${app.gradient} border flex items-center justify-center`}
                        >
                          <Icon className="w-4 h-4" />
                        </div>
                        <Star className="w-3.5 h-3.5 text-amber-400 fill-amber-400" />
                      </div>
                      <h4 className="text-xs font-bold text-white truncate group-hover:text-amber-300">
                        {app.name}
                      </h4>
                    </div>

                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleLaunchApp(app);
                      }}
                      className="mt-2 py-1 px-2.5 rounded-lg bg-slate-850 hover:bg-amber-400/20 text-slate-300 hover:text-amber-300 text-[10px] font-semibold flex items-center justify-center gap-1 transition-colors"
                    >
                      <span>Open</span>
                      <ArrowUpRight className="w-2.5 h-2.5" />
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* SECTION: ALL APPS / FILTERED GRID */}
        <div className="space-y-3 pt-2">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-bold font-mono text-slate-300 uppercase tracking-widest flex items-center gap-2">
              <Layers className="w-3.5 h-3.5 text-cyan-400" />
              <span>
                {selectedCategory === 'All' ? 'All Applications' : `${selectedCategory} Tools`}
              </span>
              <span className="text-[10px] text-slate-500">({filteredApps.length})</span>
            </h2>
          </div>

          {filteredApps.length === 0 ? (
            <div className="p-12 rounded-3xl aerix-glass border border-slate-800 text-center space-y-3">
              <Search className="w-8 h-8 text-slate-600 mx-auto" />
              <h3 className="text-sm font-bold text-white">No AI apps found.</h3>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                No tools matched "{searchQuery}" in category "{selectedCategory}".
              </p>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategory('All');
                }}
                className="mt-2 py-2 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-xs font-semibold text-white"
              >
                Clear Search & Filters
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              {filteredApps.map((app) => {
                const Icon = getAppIconComponent(app.iconName);
                const isFav = favorites.includes(app.id);

                return (
                  <div
                    key={app.id}
                    onClick={() => setActiveDetailApp(app)}
                    className="p-4 rounded-3xl aerix-glass border border-slate-800 hover:border-slate-700 bg-slate-900/60 transition-all duration-200 cursor-pointer flex flex-col justify-between group shadow-lg"
                  >
                    <div className="space-y-2.5">
                      <div className="flex items-start justify-between gap-2">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${app.gradient} border flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}
                          >
                            <Icon className="w-5 h-5" />
                          </div>

                          <div>
                            <h3 className="text-xs font-bold text-white group-hover:text-cyan-300 transition-colors truncate max-w-[150px]">
                              {app.name}
                            </h3>
                            <span className="text-[10px] font-mono text-slate-400 block">
                              {app.category}
                            </span>
                          </div>
                        </div>

                        {/* Favorite button */}
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleToggleFavorite(app.id);
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-amber-400 transition-colors"
                        >
                          <Star className={`w-3.5 h-3.5 ${isFav ? 'text-amber-400 fill-amber-400' : ''}`} />
                        </button>
                      </div>

                      <p className="text-[11px] text-slate-400 line-clamp-2 leading-relaxed">
                        {app.tagline}
                      </p>
                    </div>

                    {/* Card Actions */}
                    <div className="pt-3 border-t border-slate-850 flex items-center justify-between gap-2 mt-3">
                      <span
                        className={`text-[9px] font-mono px-2 py-0.5 rounded-full border ${
                          app.status === 'Active'
                            ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                            : app.status === 'Beta'
                            ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                            : app.status === 'Coming Soon'
                            ? 'bg-purple-500/10 text-purple-300 border-purple-500/30'
                            : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
                        }`}
                      >
                        {app.status}
                      </span>

                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleLaunchApp(app);
                        }}
                        className={`py-1 px-3 rounded-xl text-xs font-bold flex items-center gap-1 active:scale-95 transition-all ${
                          app.status === 'Coming Soon'
                            ? 'bg-slate-800 text-slate-300 hover:text-white'
                            : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-md shadow-cyan-500/10'
                        }`}
                      >
                        <span>{app.status === 'Coming Soon' ? 'Notify' : 'Open'}</span>
                        <ArrowUpRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* 5. APP DETAILS MODAL */}
      {activeDetailApp && (
        <AppDetailsModal
          app={activeDetailApp}
          isFavorite={favorites.includes(activeDetailApp.id)}
          hasNotificationAlert={notificationAlerts.includes(activeDetailApp.id)}
          userPlan="Free"
          onClose={() => setActiveDetailApp(null)}
          onOpenApp={handleLaunchApp}
          onToggleFavorite={handleToggleFavorite}
          onToggleNotificationAlert={handleToggleNotification}
        />
      )}
    </div>
  );
};
