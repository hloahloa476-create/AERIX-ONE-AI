import React, { useState } from 'react';
import { NavigationTab, AppId, AerixNotification } from './types';
import { INITIAL_NOTIFICATIONS } from './data/mockData';
import { SplashScreen } from './components/SplashScreen';
import { TopBar } from './components/TopBar';
import { Navigation } from './components/Navigation';
import { LaterPhaseModal } from './components/LaterPhaseModal';
import { NotificationsDrawer } from './components/NotificationsDrawer';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { LanguageProvider, useLanguage } from './contexts/LanguageContext';
import { AuthPage } from './pages/AuthPage';
import { ProfilePage } from './pages/ProfilePage';

// Pages
import { HomePage } from './pages/HomePage';
import { AiPage } from './pages/AiPage';
import { MapsPage } from './pages/MapsPage';
import { ShortsPage } from './pages/ShortsPage';
import { AppsPage } from './pages/AppsPage';

// Sub-Applications
import { ArcadeApp } from './pages/apps/ArcadeApp';
import { MailApp } from './pages/apps/MailApp';
import { CallsApp } from './pages/apps/CallsApp';
import { FilesApp } from './pages/apps/FilesApp';
import { CameraApp } from './pages/apps/CameraApp';
import { MusicApp } from './pages/apps/MusicApp';
import { NotesApp } from './pages/apps/NotesApp';
import { BrowserApp } from './pages/apps/BrowserApp';
import { SettingsApp } from './pages/apps/SettingsApp';
import { SlidesApp } from './pages/apps/SlidesApp';
import { FormsApp } from './pages/apps/FormsApp';
import { Cpu, RefreshCw } from 'lucide-react';

function AppContent() {
  const { currentUser, userProfile, loading, isOfflineDemoMode } = useAuth();
  const { isRtl } = useLanguage();

  const [showSplash, setShowSplash] = useState(() => {
    try {
      return sessionStorage.getItem('aerix_booted') !== 'true';
    } catch {
      return false;
    }
  });

  const [activeTab, setActiveTab] = useState<NavigationTab>('home');
  const [activeApp, setActiveApp] = useState<AppId | null>(null);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifications, setNotifications] = useState<AerixNotification[]>(INITIAL_NOTIFICATIONS);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [gmpQuotaExceeded, setGmpQuotaExceeded] = useState(false);

  React.useEffect(() => {
    const handleQuotaExceeded = () => setGmpQuotaExceeded(true);
    window.addEventListener('gmp-quota-exceeded', handleQuotaExceeded);
    return () => window.removeEventListener('gmp-quota-exceeded', handleQuotaExceeded);
  }, []);

  // Later Phase Modal state
  const [laterPhaseModal, setLaterPhaseModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    feature?: string;
  }>({
    isOpen: false,
    title: '',
    description: '',
  });

  const handleTabChange = (tab: NavigationTab) => {
    setActiveApp(null);
    setProfileOpen(false);
    setActiveTab(tab);
  };

  const handleOpenApp = (app: AppId) => {
    setProfileOpen(false);
    setActiveTab('apps');
    setActiveApp(app);
  };

  const handleOpenLaterPhase = (title: string, description: string, feature?: string) => {
    setLaterPhaseModal({
      isOpen: true,
      title,
      description,
      feature,
    });
  };

  const handleCloseLaterPhase = () => {
    setLaterPhaseModal((prev) => ({ ...prev, isOpen: false }));
  };

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleClearNotifications = () => {
    setNotifications([]);
  };

  // Loading state while checking Firebase credentials
  if (loading) {
    return (
      <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-6 text-center select-none">
        <div className="w-16 h-16 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 mb-4 animate-pulse shadow-xl shadow-cyan-500/20">
          <Cpu className="w-8 h-8" />
        </div>
        <div className="flex items-center gap-2 text-cyan-300 font-mono text-xs">
          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
          <span>Verifying AERIX Node Authorization...</span>
        </div>
      </div>
    );
  }

  // Not signed in and not offline guest -> render AuthPage
  if (!currentUser && !isOfflineDemoMode) {
    return <AuthPage />;
  }

  const unreadCount = notifications.filter((n) => !n.read).length;
  const displayName = userProfile?.displayName || currentUser?.displayName || 'Commander Nova';
  const email = currentUser?.email || 'guest@aerix.local';
  const photoURL = userProfile?.photoURL || currentUser?.photoURL || '';

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#030712] text-slate-100 flex flex-col font-sans select-none overflow-x-hidden"
    >
      {/* Google Maps Quota Reached Banner (Tier 1 & 2 Defense) */}
      {gmpQuotaExceeded && (
        <div className="bg-amber-50 border-b border-amber-200 text-amber-900 px-4 py-2.5 text-xs md:text-sm text-center sticky top-0 z-50 shadow-sm">
          <span>
            Google Maps Platform quota reached. If you are the app owner, visit{' '}
            <a
              href="https://developers.google.com/maps/ai/ai-studio?utm_campaign=gmp_mcp_codeassist_v1_aistudio#quota_exceeded_errors"
              target="_blank"
              rel="noopener noreferrer"
              className="underline font-semibold text-amber-950 hover:text-amber-800"
            >
              maps developer site
            </a>{' '}
            for instructions to update your account.
          </span>
        </div>
      )}

      {/* 1. First Launch Splash Screen */}
      {showSplash && <SplashScreen onComplete={() => setShowSplash(false)} />}

      {/* 2. Top Header Bar */}
      <TopBar
        onOpenNotifications={() => setNotificationsOpen(true)}
        unreadNotificationsCount={unreadCount}
        onNavigateHome={() => {
          setActiveTab('home');
          setActiveApp(null);
          setProfileOpen(false);
        }}
        onOpenProfile={() => setProfileOpen(true)}
        userDisplayName={displayName}
        userPhotoURL={photoURL}
      />

      {/* 3. Main Viewport Container */}
      <main className="flex-1 w-full relative">
        {activeTab === 'home' && (
          <HomePage
            onNavigateTab={handleTabChange}
            onOpenApp={handleOpenApp}
            onOpenLaterPhase={handleOpenLaterPhase}
            onOpenNotifications={() => setNotificationsOpen(true)}
            onOpenProfile={() => setProfileOpen(true)}
            userDisplayName={displayName}
            userEmail={email}
            userPhotoURL={photoURL}
            isEmailVerified={currentUser?.emailVerified}
          />
        )}

        {activeTab === 'ai' && (
          <AiPage
            onOpenLaterPhase={handleOpenLaterPhase}
            onNavigateTab={handleTabChange}
            onOpenApp={handleOpenApp}
          />
        )}

        {activeTab === 'maps' && (
          <MapsPage onOpenLaterPhase={handleOpenLaterPhase} />
        )}

        {activeTab === 'shorts' && (
          <ShortsPage onOpenLaterPhase={handleOpenLaterPhase} />
        )}

        {activeTab === 'apps' && (
          <AppsPage
            onOpenApp={handleOpenApp}
            onOpenLaterPhase={handleOpenLaterPhase}
          />
        )}
      </main>

      {/* 4. Sub-Applications (Launched from Apps or Quick Actions) */}
      {activeApp === 'games' && <ArcadeApp onClose={() => setActiveApp(null)} />}
      {activeApp === 'mail' && <MailApp onClose={() => setActiveApp(null)} />}
      {activeApp === 'calls' && <CallsApp onClose={() => setActiveApp(null)} />}
      {activeApp === 'files' && <FilesApp onClose={() => setActiveApp(null)} />}
      {activeApp === 'camera' && <CameraApp onClose={() => setActiveApp(null)} />}
      {activeApp === 'music' && <MusicApp onClose={() => setActiveApp(null)} />}
      {activeApp === 'notes' && <NotesApp onClose={() => setActiveApp(null)} />}
      {activeApp === 'browser' && <BrowserApp onClose={() => setActiveApp(null)} />}
      {activeApp === 'slides' && <SlidesApp onClose={() => setActiveApp(null)} />}
      {activeApp === 'forms' && <FormsApp onClose={() => setActiveApp(null)} />}
      {activeApp === 'settings' && (
        <SettingsApp
          onClose={() => setActiveApp(null)}
          onOpenLaterPhase={handleOpenLaterPhase}
        />
      )}

      {/* Profile Page Overlay */}
      {profileOpen && (
        <ProfilePage onClose={() => setProfileOpen(false)} />
      )}

      {/* 5. Fixed Bottom Navigation */}
      <Navigation activeTab={activeApp ? 'apps' : activeTab} onTabChange={handleTabChange} />

      {/* 6. Notifications Drawer */}
      <NotificationsDrawer
        isOpen={notificationsOpen}
        onClose={() => setNotificationsOpen(false)}
        notifications={notifications}
        onMarkAllAsRead={handleMarkAllRead}
        onClearAll={handleClearNotifications}
      />

      {/* 7. "Coming in a Later Phase" Modal (Guarantees Zero Dead Buttons) */}
      <LaterPhaseModal
        isOpen={laterPhaseModal.isOpen}
        title={laterPhaseModal.title}
        description={laterPhaseModal.description}
        feature={laterPhaseModal.feature}
        onClose={handleCloseLaterPhase}
      />
    </div>
  );
}

export default function App() {
  return (
    <LanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </LanguageProvider>
  );
}
