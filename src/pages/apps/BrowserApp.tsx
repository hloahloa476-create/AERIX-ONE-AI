import React, { useState } from 'react';
import {
  Globe,
  Search,
  Lock,
  RotateCw,
  Plus,
  X,
  Bookmark,
  History,
  Download,
  Shield,
  ArrowLeft,
  ArrowRight,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { BrowserTab } from '../../types';
import { INITIAL_BOOKMARKS } from '../../data/mockData';
import { soundEffects } from '../../utils/sound';

interface BrowserAppProps {
  onClose: () => void;
}

export const BrowserApp: React.FC<BrowserAppProps> = ({ onClose }) => {
  const [tabs, setTabs] = useState<BrowserTab[]>([
    {
      id: 'tab-1',
      title: 'AERIX Documentation',
      url: 'https://docs.aerix.local',
      history: ['https://docs.aerix.local'],
    },
    {
      id: 'tab-2',
      title: 'Orbital Weather Network',
      url: 'https://spaceweather.orbital',
      history: ['https://spaceweather.orbital'],
    },
  ]);

  const [activeTabId, setActiveTabId] = useState<string>('tab-1');
  const [urlInput, setUrlInput] = useState('https://docs.aerix.local');
  const [isPrivateMode, setIsPrivateMode] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'bookmarks' | 'history' | 'downloads' | null>(null);

  const [historyItems, setHistoryItems] = useState<{ id: string; title: string; url: string; time: string }[]>([
    { id: 'h1', title: 'AERIX Documentation', url: 'https://docs.aerix.local', time: '10:14 AM' },
    { id: 'h2', title: 'Orbital Weather Network', url: 'https://spaceweather.orbital', time: '09:45 AM' },
    { id: 'h3', title: 'Quantum Computing Consortium', url: 'https://quantum.org', time: 'Yesterday' },
  ]);

  const [downloadItems] = useState([
    { id: 'd1', name: 'aerix_core_schematic.svg', size: '1.4 MB', date: 'Today' },
    { id: 'd2', name: 'quantum_whitepaper.pdf', size: '4.8 MB', date: 'Oct 02' },
  ]);

  const activeTab = tabs.find((t) => t.id === activeTabId) || tabs[0];

  const handleNavigate = (targetUrl: string) => {
    soundEffects.playHapticClick();
    let formatted = targetUrl.trim();
    if (!formatted.startsWith('http://') && !formatted.startsWith('https://')) {
      formatted = `https://search.aerix.local/?q=${encodeURIComponent(formatted)}`;
    }

    setUrlInput(formatted);
    setTabs((prev) =>
      prev.map((t) =>
        t.id === activeTabId
          ? {
              ...t,
              title: formatted.replace('https://', '').split('/')[0],
              url: formatted,
              history: [...t.history, formatted],
            }
          : t
      )
    );

    if (!isPrivateMode) {
      setHistoryItems((prev) => [
        {
          id: `h-${Date.now()}`,
          title: formatted.replace('https://', '').split('/')[0],
          url: formatted,
          time: 'Just now',
        },
        ...prev,
      ]);
    }
  };

  const handleAddTab = () => {
    soundEffects.playHapticClick();
    const newId = `tab-${Date.now()}`;
    const newTab: BrowserTab = {
      id: newId,
      title: 'New Tab',
      url: 'https://home.aerix.local',
      history: ['https://home.aerix.local'],
    };
    setTabs((prev) => [...prev, newTab]);
    setActiveTabId(newId);
    setUrlInput('https://home.aerix.local');
  };

  const handleCloseTab = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    soundEffects.playHapticClick();
    if (tabs.length === 1) return;
    const remaining = tabs.filter((t) => t.id !== id);
    setTabs(remaining);
    if (activeTabId === id) {
      setActiveTabId(remaining[0].id);
      setUrlInput(remaining[0].url);
    }
  };

  return (
    <div className={`fixed inset-0 z-40 flex flex-col overflow-hidden select-none pb-16 transition-colors ${
      isPrivateMode ? 'bg-[#090714] text-purple-100' : 'bg-[#040711] text-slate-100'
    }`}>
      {/* Top App Bar & Tabs */}
      <div className="p-2 aerix-glass border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar max-w-[70%]">
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            return (
              <div
                key={tab.id}
                onClick={() => {
                  soundEffects.playHapticClick();
                  setActiveTabId(tab.id);
                  setUrlInput(tab.url);
                }}
                className={`min-h-[34px] px-3 rounded-xl flex items-center gap-2 cursor-pointer border text-xs transition-all ${
                  isActive
                    ? isPrivateMode
                      ? 'bg-purple-950/80 border-purple-500/60 text-purple-200 shadow'
                      : 'bg-cyan-950/80 border-cyan-500/60 text-white shadow'
                    : 'aerix-glass-card border-slate-800/80 text-slate-400 hover:text-white'
                }`}
              >
                <Globe className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
                <span className="truncate max-w-[100px] font-mono text-[11px]">
                  {tab.title}
                </span>
                {tabs.length > 1 && (
                  <button
                    onClick={(e) => handleCloseTab(tab.id, e)}
                    className="p-0.5 text-slate-400 hover:text-rose-400"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            );
          })}

          <button
            onClick={handleAddTab}
            className="p-2 rounded-xl aerix-glass-card hover:bg-slate-800 text-slate-400 hover:text-white"
            title="New Tab"
          >
            <Plus className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Private Mode Toggle */}
          <button
            onClick={() => {
              soundEffects.playHapticClick();
              setIsPrivateMode(!isPrivateMode);
            }}
            className={`px-2.5 py-1 rounded-xl text-[11px] font-mono border flex items-center gap-1 transition-colors ${
              isPrivateMode
                ? 'bg-purple-600 text-white border-purple-400 shadow-lg shadow-purple-600/30'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            <Shield className="w-3 h-3" />
            <span>{isPrivateMode ? 'Private' : 'Normal'}</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Address & Navigation Bar */}
      <div className="p-2.5 border-b border-slate-800/80 aerix-glass flex items-center gap-2 shrink-0">
        <button
          onClick={() => soundEffects.playHapticClick()}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          title="Back"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>
        <button
          onClick={() => soundEffects.playHapticClick()}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          title="Forward"
        >
          <ArrowRight className="w-4 h-4" />
        </button>
        <button
          onClick={() => soundEffects.playHapticClick()}
          className="p-1.5 text-slate-400 hover:text-white rounded-lg"
          title="Refresh"
        >
          <RotateCw className="w-4 h-4" />
        </button>

        {/* URL Input Form */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleNavigate(urlInput);
          }}
          className="flex-1 flex items-center bg-slate-900/90 border border-slate-800 rounded-xl px-3 py-1.5 gap-2"
        >
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <input
            type="text"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="flex-1 bg-transparent text-xs text-white placeholder-slate-500 font-mono focus:outline-none"
            placeholder="Search web or enter address..."
          />
          <button type="submit" className="text-slate-400 hover:text-cyan-400">
            <Search className="w-3.5 h-3.5" />
          </button>
        </form>

        {/* Drawer triggers */}
        <button
          onClick={() => {
            soundEffects.playHapticClick();
            setDrawerMode(drawerMode === 'bookmarks' ? null : 'bookmarks');
          }}
          className="p-2 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800"
          title="Bookmarks"
        >
          <Bookmark className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            soundEffects.playHapticClick();
            setDrawerMode(drawerMode === 'history' ? null : 'history');
          }}
          className="p-2 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800"
          title="History"
        >
          <History className="w-4 h-4" />
        </button>
        <button
          onClick={() => {
            soundEffects.playHapticClick();
            setDrawerMode(drawerMode === 'downloads' ? null : 'downloads');
          }}
          className="p-2 text-slate-400 hover:text-cyan-400 rounded-lg hover:bg-slate-800"
          title="Downloads"
        >
          <Download className="w-4 h-4" />
        </button>
      </div>

      {/* Main Simulated Browser Content Canvas */}
      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full relative">
        {/* Private Mode Banner */}
        {isPrivateMode && (
          <div className="mb-4 p-3 rounded-2xl bg-purple-950/40 border border-purple-500/40 text-xs text-purple-200 flex items-center gap-2">
            <Shield className="w-4 h-4 text-purple-400 shrink-0" />
            <span>Private Navigation Active · Zero cookies or telemetry cached</span>
          </div>
        )}

        {/* Simulated Webpage Content */}
        <div className="p-6 rounded-3xl aerix-glass border border-slate-800/80 space-y-4">
          <div className="flex items-center gap-2 text-xs font-mono text-cyan-400">
            <Globe className="w-4 h-4" />
            <span className="truncate">{activeTab.url}</span>
          </div>

          <h3 className="text-xl font-bold font-display text-white">
            {activeTab.title}
          </h3>

          <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
            <p>
              Welcome to the simulated internal web gateway for <strong>{activeTab.title}</strong>. All rendering is sandboxed within the AERIX ONE local node runtime.
            </p>

            <div className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
              <span className="font-mono text-cyan-400 text-[11px] block font-semibold">
                SYSTEM VERIFICATION REPORT
              </span>
              <p className="text-[11px] text-slate-400">
                SSL Handshake: TLS 1.3 Certified · Content-Security-Policy: Enforced · Latency: 0.8ms (Local Cache).
              </p>
            </div>
          </div>
        </div>

        {/* Quick Links on Page */}
        <div className="mt-4 space-y-2">
          <span className="text-xs font-mono text-slate-400 block px-1 uppercase tracking-wider">
            Featured Destinations
          </span>
          <div className="grid grid-cols-2 gap-2">
            {INITIAL_BOOKMARKS.map((bm) => (
              <button
                key={bm.id}
                onClick={() => handleNavigate(bm.url)}
                className="p-3 rounded-2xl aerix-glass-card border border-slate-800/80 hover:border-cyan-500/40 flex flex-col text-left group"
              >
                <span className="font-semibold text-xs text-white group-hover:text-cyan-300 truncate">
                  {bm.title}
                </span>
                <span className="text-[10px] font-mono text-slate-500 truncate mt-0.5">
                  {bm.url}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Slide-over Drawers (Bookmarks, History, Downloads) */}
      {drawerMode && (
        <div className="absolute inset-0 z-40 bg-black/70 backdrop-blur-sm flex justify-end">
          <div className="w-full max-w-sm h-full bg-[#090d16] border-l border-slate-800 p-4 flex flex-col shadow-2xl animate-in slide-in-from-right duration-200">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <h3 className="font-display font-bold text-sm text-white capitalize flex items-center gap-2">
                {drawerMode === 'bookmarks' && <Bookmark className="w-4 h-4 text-cyan-400" />}
                {drawerMode === 'history' && <History className="w-4 h-4 text-cyan-400" />}
                {drawerMode === 'downloads' && <Download className="w-4 h-4 text-cyan-400" />}
                {drawerMode}
              </h3>
              <button
                onClick={() => setDrawerMode(null)}
                className="p-1.5 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto py-3 space-y-2">
              {drawerMode === 'bookmarks' &&
                INITIAL_BOOKMARKS.map((bm) => (
                  <div
                    key={bm.id}
                    onClick={() => {
                      handleNavigate(bm.url);
                      setDrawerMode(null);
                    }}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-semibold text-xs text-white">{bm.title}</h5>
                      <span className="text-[10px] font-mono text-slate-400">{bm.url}</span>
                    </div>
                    <ExternalLink className="w-3.5 h-3.5 text-cyan-400" />
                  </div>
                ))}

              {drawerMode === 'history' &&
                historyItems.map((h) => (
                  <div
                    key={h.id}
                    onClick={() => {
                      handleNavigate(h.url);
                      setDrawerMode(null);
                    }}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-cyan-500/40 cursor-pointer flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-semibold text-xs text-white">{h.title}</h5>
                      <span className="text-[10px] font-mono text-slate-400">{h.time}</span>
                    </div>
                    <ChevronRight className="w-3.5 h-3.5 text-slate-500" />
                  </div>
                ))}

              {drawerMode === 'downloads' &&
                downloadItems.map((d) => (
                  <div
                    key={d.id}
                    className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between"
                  >
                    <div>
                      <h5 className="font-semibold text-xs text-white">{d.name}</h5>
                      <span className="text-[10px] font-mono text-slate-400">{d.size} · {d.date}</span>
                    </div>
                    <Download className="w-3.5 h-3.5 text-emerald-400" />
                  </div>
                ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
