import React, { useState, useEffect } from 'react';
import {
  Presentation,
  Plus,
  Trash2,
  ExternalLink,
  RefreshCw,
  Search,
  Sparkles,
  ChevronLeft,
  Tv,
  FileText,
  AlertTriangle,
  X,
  Play,
  CheckCircle2,
  LogOut,
  Layers,
  Sliders,
  Calendar,
  Eye
} from 'lucide-react';
import { GoogleSlidePresentationSummary, GoogleSlidePresentationDetail } from '../../types';
import { slidesService } from '../../services/slidesService';
import { soundEffects } from '../../utils/sound';

interface SlidesAppProps {
  onClose: () => void;
}

export const SlidesApp: React.FC<SlidesAppProps> = ({ onClose }) => {
  const [isConnected, setIsConnected] = useState(slidesService.isConnected());
  const [userEmail, setUserEmail] = useState<string | null>(slidesService.getConnectedEmail());
  const [loading, setLoading] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const [presentations, setPresentations] = useState<GoogleSlidePresentationSummary[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Selected Presentation for viewing
  const [selectedDeck, setSelectedDeck] = useState<GoogleSlidePresentationSummary | null>(null);
  const [deckDetail, setDeckDetail] = useState<GoogleSlidePresentationDetail | null>(null);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Modals
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [creatingDeck, setCreatingDeck] = useState(false);

  const [showAiModal, setShowAiModal] = useState(false);
  const [aiTopic, setAiTopic] = useState('');
  const [aiTheme, setAiTheme] = useState('Cinematic AI');
  const [generatingAi, setGeneratingAi] = useState(false);

  const [showAddSlideModal, setShowAddSlideModal] = useState(false);
  const [slideTitle, setSlideTitle] = useState('');
  const [slideContent, setSlideContent] = useState('');
  const [addingSlide, setAddingSlide] = useState(false);

  // Confirmation Modal for Destructive Delete (MANDATORY Google Workspace requirement)
  const [deckToDelete, setDeckToDelete] = useState<GoogleSlidePresentationSummary | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Initial load
  useEffect(() => {
    if (isConnected) {
      loadPresentations();
    }
  }, [isConnected]);

  const loadPresentations = async () => {
    setLoading(true);
    setError(null);
    try {
      const list = await slidesService.listPresentations();
      setPresentations(list);
    } catch (err: any) {
      console.error('Failed to load presentations:', err);
      setError(err.message || 'Unable to fetch presentations from Google Workspace.');
      if (err.message?.includes('session expired') || err.message?.includes('authenticate')) {
        setIsConnected(false);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleConnect = async () => {
    setConnecting(true);
    setError(null);
    soundEffects.playHapticClick();
    try {
      await slidesService.connectSlides();
      setIsConnected(true);
      setUserEmail(slidesService.getConnectedEmail());
      await loadPresentations();
    } catch (err: any) {
      console.error('Google Slides connection error:', err);
      setError(err.message || 'Google authentication was cancelled or could not be completed.');
    } finally {
      setConnecting(false);
    }
  };

  const handleDisconnect = () => {
    soundEffects.playHapticClick();
    slidesService.disconnectSlides();
    setIsConnected(false);
    setUserEmail(null);
    setPresentations([]);
    setSelectedDeck(null);
    setDeckDetail(null);
  };

  const handleSelectDeck = async (deck: GoogleSlidePresentationSummary) => {
    soundEffects.playHapticClick();
    setSelectedDeck(deck);
    setLoadingDetail(true);
    try {
      const detail = await slidesService.getPresentation(deck.id);
      setDeckDetail(detail);
    } catch (err: any) {
      console.error('Failed to load presentation detail:', err);
      setDeckDetail(null);
    } finally {
      setLoadingDetail(false);
    }
  };

  const handleCreateDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim()) return;
    setCreatingDeck(true);
    soundEffects.playHapticClick();
    try {
      const created = await slidesService.createPresentation(newTitle.trim());
      setShowCreateModal(false);
      setNewTitle('');
      await loadPresentations();
      // Select the new presentation
      const summary: GoogleSlidePresentationSummary = {
        id: created.presentationId,
        title: created.title || newTitle.trim(),
        modifiedTime: new Date().toISOString()
      };
      handleSelectDeck(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to create presentation.');
    } finally {
      setCreatingDeck(false);
    }
  };

  const handleGenerateAiDeck = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiTopic.trim()) return;
    setGeneratingAi(true);
    soundEffects.playHapticClick();
    try {
      const created = await slidesService.generateAiDeck(aiTopic.trim(), aiTheme);
      setShowAiModal(false);
      setAiTopic('');
      await loadPresentations();
      const summary: GoogleSlidePresentationSummary = {
        id: created.presentationId,
        title: created.title || aiTopic.trim(),
        modifiedTime: new Date().toISOString()
      };
      handleSelectDeck(summary);
    } catch (err: any) {
      setError(err.message || 'Failed to generate AI deck.');
    } finally {
      setGeneratingAi(false);
    }
  };

  const handleAddSlide = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeck) return;
    setAddingSlide(true);
    soundEffects.playHapticClick();
    try {
      await slidesService.addSlide(selectedDeck.id, slideTitle.trim(), slideContent.trim());
      setShowAddSlideModal(false);
      setSlideTitle('');
      setSlideContent('');
      // Reload deck detail
      const detail = await slidesService.getPresentation(selectedDeck.id);
      setDeckDetail(detail);
    } catch (err: any) {
      setError(err.message || 'Failed to add slide.');
    } finally {
      setAddingSlide(false);
    }
  };

  const handleConfirmDelete = async () => {
    if (!deckToDelete) return;
    setDeleting(true);
    soundEffects.playHapticClick();
    try {
      await slidesService.deletePresentation(deckToDelete.id);
      setPresentations((prev) => prev.filter((p) => p.id !== deckToDelete.id));
      if (selectedDeck?.id === deckToDelete.id) {
        setSelectedDeck(null);
        setDeckDetail(null);
      }
      setDeckToDelete(null);
    } catch (err: any) {
      setError(err.message || 'Failed to delete presentation.');
    } finally {
      setDeleting(false);
    }
  };

  const filteredDecks = presentations.filter((deck) =>
    deck.title.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="fixed inset-0 z-50 bg-[#030712] text-slate-100 flex flex-col font-sans select-none overflow-hidden animate-fadeIn">
      {/* Top Header */}
      <header className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEffects.playHapticClick();
              if (selectedDeck) {
                setSelectedDeck(null);
                setDeckDetail(null);
              } else {
                onClose();
              }
            }}
            className="w-8 h-8 rounded-xl aerix-glass border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500/20 to-orange-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shadow-sm shadow-amber-500/10">
              <Presentation className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-white flex items-center gap-1.5">
                Google Slides
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  Workspace
                </span>
              </h1>
              <p className="text-[10px] font-mono text-slate-400">
                {selectedDeck ? selectedDeck.title : 'Presentations & AI Pitch Decks'}
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {isConnected && (
            <button
              onClick={() => {
                soundEffects.playHapticClick();
                loadPresentations();
              }}
              disabled={loading}
              className="w-8 h-8 rounded-xl aerix-glass border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors disabled:opacity-50"
              title="Refresh presentations"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-amber-400' : ''}`} />
            </button>
          )}

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-xl aerix-glass border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Body */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 space-y-4 max-w-5xl mx-auto w-full">
        {/* Error notification banner */}
        {error && (
          <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-center justify-between text-xs text-rose-300">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{error}</span>
            </div>
            <button
              onClick={() => setError(null)}
              className="text-rose-400 hover:text-rose-200 text-xs px-2 py-1"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* NOT CONNECTED STATE */}
        {!isConnected ? (
          <div className="max-w-md mx-auto py-10 px-4 text-center space-y-6">
            <div className="w-20 h-20 rounded-3xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400 mx-auto shadow-xl shadow-amber-500/10">
              <Presentation className="w-10 h-10" />
            </div>

            <div className="space-y-2">
              <h2 className="text-xl font-bold font-display text-white">
                Connect Google Slides
              </h2>
              <p className="text-xs text-slate-400 leading-relaxed">
                Seamlessly browse, preview, create, and present your Google Slides presentations directly from AERIX ONE with Google Workspace integration.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-2 text-left">
              <div className="p-3 rounded-2xl aerix-glass border border-slate-800">
                <div className="text-amber-400 text-xs font-bold mb-1 flex items-center gap-1.5">
                  <Tv className="w-3.5 h-3.5" />
                  Presentation Viewer
                </div>
                <p className="text-[11px] text-slate-400">
                  Full embedded presentation mode with interactive slide switching.
                </p>
              </div>

              <div className="p-3 rounded-2xl aerix-glass border border-slate-800">
                <div className="text-cyan-400 text-xs font-bold mb-1 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5" />
                  AI Pitch Decks
                </div>
                <p className="text-[11px] text-slate-400">
                  Generate instant slide structures, roadmaps, and executive decks.
                </p>
              </div>
            </div>

            {/* Official Google Sign-In Button as mandated by Workspace skill */}
            <div className="pt-2 flex justify-center">
              <button
                onClick={handleConnect}
                disabled={connecting}
                className="w-full max-w-xs py-3 px-5 bg-white text-slate-900 font-semibold rounded-2xl shadow-lg hover:bg-slate-100 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-50"
              >
                {connecting ? (
                  <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
                ) : (
                  <svg className="w-4 h-4" viewBox="0 0 48 48">
                    <path
                      fill="#EA4335"
                      d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                    />
                    <path
                      fill="#4285F4"
                      d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                    />
                    <path
                      fill="#34A853"
                      d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                    />
                  </svg>
                )}
                <span className="text-xs font-semibold">
                  {connecting ? 'Authorizing Google...' : 'Sign in with Google'}
                </span>
              </button>
            </div>

            <p className="text-[10px] text-slate-500 font-mono">
              Direct client-side OAuth connection with Google Slides & Drive APIs.
            </p>
          </div>
        ) : selectedDeck ? (
          /* SINGLE DECK VIEW & PRESENTATION MODE */
          <div className="space-y-4">
            {/* Deck Header & Controls */}
            <div className="p-4 rounded-2xl aerix-glass border border-slate-800 flex flex-wrap items-center justify-between gap-3">
              <div>
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-wider block">
                  Active Presentation Deck
                </span>
                <h2 className="text-lg font-bold font-display text-white mt-0.5">
                  {selectedDeck.title}
                </h2>
                {deckDetail?.slides && (
                  <p className="text-[11px] font-mono text-slate-400">
                    {deckDetail.slides.length} {deckDetail.slides.length === 1 ? 'Slide' : 'Slides'} in deck
                  </p>
                )}
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => {
                    soundEffects.playHapticClick();
                    setShowAddSlideModal(true);
                  }}
                  className="px-3 py-1.5 rounded-xl bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-semibold flex items-center gap-1.5 hover:bg-amber-500/30 transition-all"
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Slide
                </button>

                <a
                  href={`https://docs.google.com/presentation/d/${selectedDeck.id}/edit`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 rounded-xl aerix-glass border border-slate-700 text-slate-300 text-xs font-semibold flex items-center gap-1.5 hover:text-white hover:border-slate-600 transition-all"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  Edit in Google Slides
                </a>

                <button
                  onClick={() => setDeckToDelete(selectedDeck)}
                  className="p-2 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-400 hover:bg-rose-500/20 transition-all"
                  title="Delete presentation"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Embedded Presentation Frame */}
            <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-950 aspect-[16/9] w-full shadow-2xl">
              <iframe
                src={`https://docs.google.com/presentation/d/${selectedDeck.id}/embed?start=false&loop=false&delayms=3000`}
                className="w-full h-full border-0"
                allowFullScreen
                title={selectedDeck.title}
              />
            </div>

            {/* Slides Content Preview Cards */}
            {loadingDetail ? (
              <div className="p-8 text-center text-xs text-slate-400 font-mono flex items-center justify-center gap-2">
                <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                Reading presentation outline...
              </div>
            ) : deckDetail?.slides && deckDetail.slides.length > 0 ? (
              <div className="space-y-3">
                <h3 className="text-xs font-mono text-slate-400 uppercase tracking-wider px-1">
                  Deck Slides ({deckDetail.slides.length})
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {deckDetail.slides.map((slide, index) => {
                    // Extract text elements from slide shapes
                    const textChunks: string[] = [];
                    slide.pageElements?.forEach((pe) => {
                      pe.shape?.text?.textElements?.forEach((te) => {
                        const str = te.textRun?.content?.trim();
                        if (str) textChunks.push(str);
                      });
                    });

                    const heading = textChunks[0] || `Slide ${index + 1}`;
                    const contentSnippet = textChunks.slice(1).join(' ') || 'Visual or template content';

                    return (
                      <div
                        key={slide.objectId || index}
                        className="p-3.5 rounded-2xl aerix-glass border border-slate-800/80 hover:border-amber-500/30 transition-all space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-amber-500/20 text-amber-300 border border-amber-500/30">
                            Slide {index + 1}
                          </span>
                        </div>
                        <h4 className="text-xs font-bold text-white line-clamp-1">
                          {heading}
                        </h4>
                        <p className="text-[11px] text-slate-400 line-clamp-3 leading-relaxed">
                          {contentSnippet}
                        </p>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          /* DECK LISTING / DASHBOARD */
          <div className="space-y-5">
            {/* Account Status bar */}
            <div className="p-3 rounded-2xl aerix-glass border border-slate-800 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse" />
                <span className="text-xs font-medium text-slate-300">
                  {userEmail}
                </span>
                <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  Workspace Connected
                </span>
              </div>

              <button
                onClick={handleDisconnect}
                className="px-2.5 py-1 rounded-xl aerix-glass border border-slate-800 text-[11px] text-slate-400 hover:text-rose-400 flex items-center gap-1 transition-colors"
              >
                <LogOut className="w-3 h-3" />
                Disconnect
              </button>
            </div>

            {/* Quick Actions (Create / AI Generate) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <button
                onClick={() => {
                  soundEffects.playHapticClick();
                  setShowCreateModal(true);
                }}
                className="p-4 rounded-2xl bg-gradient-to-r from-amber-500/10 to-orange-500/10 border border-amber-500/30 hover:border-amber-500/60 text-left transition-all group shadow-sm hover:shadow-amber-500/10"
              >
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Plus className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-amber-300 transition-colors">
                  Create Blank Presentation
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Start fresh with an empty Google Slides deck.
                </p>
              </button>

              <button
                onClick={() => {
                  soundEffects.playHapticClick();
                  setShowAiModal(true);
                }}
                className="p-4 rounded-2xl bg-gradient-to-r from-cyan-500/10 to-blue-500/10 border border-cyan-500/30 hover:border-cyan-500/60 text-left transition-all group shadow-sm hover:shadow-cyan-500/10"
              >
                <div className="w-9 h-9 rounded-xl bg-cyan-500/20 text-cyan-400 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                  <Sparkles className="w-5 h-5" />
                </div>
                <h3 className="text-sm font-bold text-white group-hover:text-cyan-300 transition-colors">
                  AI Pitch Deck Generator
                </h3>
                <p className="text-xs text-slate-400 mt-1">
                  Auto-generate structured slides from any topic or concept.
                </p>
              </button>
            </div>

            {/* Search and Filters */}
            <div className="flex items-center justify-between gap-3">
              <div className="relative flex-1">
                <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search Google Slides decks..."
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900/90 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500/50 shadow-sm"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery('')}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              <div className="text-xs font-mono text-slate-400 px-3 py-2 rounded-xl aerix-glass border border-slate-800 shrink-0">
                {presentations.length} Decks
              </div>
            </div>

            {/* Decks Grid */}
            {loading ? (
              <div className="py-16 text-center space-y-3 font-mono text-xs text-slate-400">
                <RefreshCw className="w-6 h-6 animate-spin text-amber-400 mx-auto" />
                <p>Loading your Google Slides from Drive...</p>
              </div>
            ) : filteredDecks.length === 0 ? (
              <div className="py-16 text-center space-y-3 p-6 rounded-2xl aerix-glass border border-slate-800">
                <Presentation className="w-8 h-8 text-slate-500 mx-auto" />
                <p className="text-sm font-bold text-white">No presentations found</p>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {searchQuery
                    ? 'No presentation matches your search query.'
                    : 'Create your first Google Slides presentation or generate an AI deck above.'}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                {filteredDecks.map((deck) => (
                  <div
                    key={deck.id}
                    className="p-3.5 rounded-2xl aerix-glass border border-slate-800 hover:border-amber-500/40 transition-all flex flex-col justify-between group shadow-sm"
                  >
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="w-7 h-7 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
                          <Presentation className="w-3.5 h-3.5" />
                        </div>
                        <div className="flex items-center gap-1">
                          <a
                            href={deck.webViewLink || `https://docs.google.com/presentation/d/${deck.id}/edit`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                            title="Open directly in Google Slides"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                          </a>
                          <button
                            onClick={() => setDeckToDelete(deck)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                            title="Delete presentation"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>

                      <h4 className="text-xs font-bold text-white line-clamp-2 group-hover:text-amber-300 transition-colors">
                        {deck.title}
                      </h4>

                      {deck.modifiedTime && (
                        <p className="text-[10px] font-mono text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(deck.modifiedTime).toLocaleDateString(undefined, {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </p>
                      )}
                    </div>

                    <div className="pt-3 mt-3 border-t border-slate-800/80 flex items-center justify-between">
                      <button
                        onClick={() => handleSelectDeck(deck)}
                        className="w-full py-1.5 px-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-300 text-xs font-semibold flex items-center justify-center gap-1.5 hover:bg-amber-500/25 transition-all"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        View / Present
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* MODAL: CREATE BLANK DECK */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl aerix-glass border border-slate-700 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Presentation className="w-4 h-4 text-amber-400" />
                New Google Slides Deck
              </h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateDeck} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Presentation Title
                </label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="e.g., AERIX Architecture Overview"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingDeck || !newTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {creatingDeck && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Create Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: AI DECK GENERATOR */}
      {showAiModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-md rounded-3xl aerix-glass border border-cyan-500/40 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                AI Pitch Deck Generator
              </h3>
              <button
                onClick={() => setShowAiModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              Enter a topic or business concept. AERIX will design structured slides directly in your Google Slides account.
            </p>

            <form onSubmit={handleGenerateAiDeck} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Presentation Topic
                </label>
                <input
                  type="text"
                  value={aiTopic}
                  onChange={(e) => setAiTopic(e.target.value)}
                  placeholder="e.g., Quantum Computing in Logistics"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Presentation Style
                </label>
                <select
                  value={aiTheme}
                  onChange={(e) => setAiTheme(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                >
                  <option value="Cinematic AI">Cinematic AI Tech Pitch</option>
                  <option value="Executive Brief">Executive Boardroom Brief</option>
                  <option value="Product Launch">Product Launch Keynote</option>
                  <option value="Developer Workshop">Technical Deep Dive</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAiModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={generatingAi || !aiTopic.trim()}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {generatingAi && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Generate AI Deck
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD SLIDE TO ACTIVE DECK */}
      {showAddSlideModal && selectedDeck && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl aerix-glass border border-slate-700 p-5 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-amber-400" />
                Add Slide to Deck
              </h3>
              <button
                onClick={() => setShowAddSlideModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleAddSlide} className="space-y-4">
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Slide Title
                </label>
                <input
                  type="text"
                  value={slideTitle}
                  onChange={(e) => setSlideTitle(e.target.value)}
                  placeholder="e.g., Target Market & Traction"
                  required
                  autoFocus
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  Slide Content / Bullet Points
                </label>
                <textarea
                  value={slideContent}
                  onChange={(e) => setSlideContent(e.target.value)}
                  rows={4}
                  placeholder="• 45% month-over-month growth&#10;• Global enterprise partnerships&#10;• High margin operational unit economics"
                  className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-750 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddSlideModal(false)}
                  className="px-3 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={addingSlide || !slideTitle.trim()}
                  className="px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                >
                  {addingSlide && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                  Append Slide
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MANDATORY CONFIRMATION DIALOG FOR DESTRUCTIVE DELETE */}
      {deckToDelete && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl aerix-glass border border-rose-500/40 p-5 space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <AlertTriangle className="w-5 h-5" />
            </div>

            <div className="space-y-1">
              <h3 className="text-sm font-bold font-display text-white">
                Delete Presentation?
              </h3>
              <p className="text-xs text-slate-300 leading-relaxed">
                Are you sure you want to delete <span className="font-semibold text-rose-300">"{deckToDelete.title}"</span> from your Google Drive? This action will permanently remove the presentation file.
              </p>
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeckToDelete(null)}
                disabled={deleting}
                className="px-3.5 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                disabled={deleting}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
              >
                {deleting && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                Delete Presentation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
