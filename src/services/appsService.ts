/**
 * AERIX ONE - AI Apps Catalog & User Usage Service
 * Manages the central AI Apps Hub, categorizations, status tracking,
 * user favorites, recently used tracking, and coming-soon alert preferences.
 * 
 * Supports both Cloud Firestore isolation and resilient local caching.
 */

import { doc, getDoc, setDoc, collection, getDocs, query, orderBy, limit } from 'firebase/firestore';
import { db, isFirebaseConfigured, sanitizeForFirestore, handleFirestoreError, OperationType } from './firebase';
import { AppId, NavigationTab } from '../types';

export type AppCategory = 
  | 'All' 
  | 'Video' 
  | 'Image' 
  | 'Audio' 
  | 'Writing' 
  | 'Productivity' 
  | 'Lifestyle' 
  | 'AI Tools';

export type AppStatus = 'Active' | 'Beta' | 'Coming Soon' | 'Maintenance';

export type AppPlan = 'Free' | 'Pro' | 'Premium';

export interface AppRecentProject {
  id: string;
  title: string;
  date: string;
  tag: string;
}

export interface AppDefinition {
  id: string;
  name: string;
  tagline: string;
  description: string;
  category: Exclude<AppCategory, 'All'>;
  features: string[];
  status: AppStatus;
  version: string;
  actionType: 'open_app' | 'navigate_tab' | 'coming_soon';
  targetApp?: AppId;
  targetTab?: NavigationTab;
  createdAt: string;
  lastUpdated: string;
  featured: boolean;
  gradient: string;
  badge?: string;
  requiredPlan: AppPlan;
  rating: number;
  usersCount: string;
  iconName: string;
  recentProjects?: AppRecentProject[];
}

export interface AppUsageRecord {
  appId: string;
  lastOpenedTime: string;
  usageCount: number;
}

// Initial 10 AI Apps from Specification + System Apps
export const DEFAULT_AI_APPS: AppDefinition[] = [
  {
    id: 'aerix_shorts',
    name: 'AERIX SHORTS',
    tagline: 'Create cinematic AI videos in seconds.',
    description: 'Autonomous AI short video creation engine with neural script synthesis, procedural cinematography, dynamic subtitle pacing, and multi-track audio mastering.',
    category: 'Video',
    features: [
      'Text to Cinematic Short',
      'Autonomous Script & Storyboard',
      'Dynamic Subtitles & Pacing',
      'Multi-Format Viral Framing (9:16, 16:9)',
      'Neural Voiceover Dubbing'
    ],
    status: 'Active',
    version: '2.4.0',
    actionType: 'navigate_tab',
    targetTab: 'shorts',
    createdAt: '2026-01-10',
    lastUpdated: '2026-09-28',
    featured: true,
    gradient: 'from-purple-500/20 via-pink-500/20 to-rose-500/20 border-purple-500/40 text-purple-400',
    badge: 'Popular',
    requiredPlan: 'Free',
    rating: 4.9,
    usersCount: '48.2k',
    iconName: 'Film',
    recentProjects: [
      { id: 'p1', title: 'Cyberpunk Tokyo Drone Run', date: '2 hours ago', tag: '9:16 Video' },
      { id: 'p2', title: 'Deep Sea Bioluminescence', date: 'Yesterday', tag: 'Cinematic' }
    ]
  },
  {
    id: 'aerix_image',
    name: 'AERIX IMAGE',
    tagline: 'AI image generation and high-fidelity editing.',
    description: 'Next-generation neural rendering suite capable of photorealistic synthesis, contextual inpainting, multi-layer style transfer, and lossless resolution scaling.',
    category: 'Image',
    features: [
      'Text to Image Synthesis',
      'Contextual Image Editing',
      'Background Removal & Cutout',
      'Neural Enhancement & Sharpening',
      'Artistic Style Transfer'
    ],
    status: 'Active',
    version: '3.1.0',
    actionType: 'open_app',
    targetApp: 'aerix_image',
    createdAt: '2026-02-15',
    lastUpdated: '2026-10-01',
    featured: true,
    gradient: 'from-cyan-500/20 via-blue-500/20 to-indigo-500/20 border-cyan-500/40 text-cyan-400',
    badge: 'Featured',
    requiredPlan: 'Free',
    rating: 4.95,
    usersCount: '62.4k',
    iconName: 'Image',
    recentProjects: [
      { id: 'img-1', title: 'Neural Hologram Portrait', date: 'Today', tag: 'Flux Art' },
      { id: 'img-2', title: 'Desert Solar Ark Concept', date: '3 days ago', tag: 'Concept Art' }
    ]
  },
  {
    id: 'aerix_video',
    name: 'AERIX VIDEO',
    tagline: 'Long-form AI video creation and timeline editing.',
    description: 'Studio-grade video generation environment for directors and creators. Generate coherent scenes, maintain character consistency across shots, and control 3D virtual camera motions.',
    category: 'Video',
    features: [
      'Storyboard to Video Pipeline',
      'Cinematic Camera Motion Controls',
      'Multi-Scene Continuity Engine',
      '4K Timeline Render & Export',
      'Consistent AI Actor Synthesis'
    ],
    status: 'Beta',
    version: '0.9.4',
    actionType: 'open_app',
    targetApp: 'aerix_video',
    createdAt: '2026-05-20',
    lastUpdated: '2026-10-03',
    featured: true,
    gradient: 'from-amber-500/20 via-orange-500/20 to-rose-500/20 border-amber-500/40 text-amber-400',
    badge: 'Beta',
    requiredPlan: 'Pro',
    rating: 4.8,
    usersCount: '19.8k',
    iconName: 'Video',
    recentProjects: [
      { id: 'vid-1', title: 'Nebula Horizon Episode 1', date: 'Active Draft', tag: 'Storyboard' }
    ]
  },
  {
    id: 'aerix_chat',
    name: 'AERIX CHAT',
    tagline: 'AI conversational assistant with persistent multi-turn history.',
    description: 'Cognitive assistant running on Gemini 2.5 architecture. Handles deep reasoning, multi-language dialogue, live code execution, document attachments, and system device commands.',
    category: 'AI Tools',
    features: [
      'Multi-turn Contextual Memory',
      'Live Code Execution & Debugging',
      'Multi-Modal File Analysis',
      'AERIX OS Command Navigation',
      'Real-Time Web Knowledge Grounding'
    ],
    status: 'Active',
    version: '4.0.2',
    actionType: 'navigate_tab',
    targetTab: 'ai',
    createdAt: '2025-11-01',
    lastUpdated: '2026-10-05',
    featured: true,
    gradient: 'from-emerald-500/20 via-teal-500/20 to-cyan-500/20 border-emerald-500/40 text-emerald-400',
    badge: 'Core AI',
    requiredPlan: 'Free',
    rating: 4.98,
    usersCount: '120k',
    iconName: 'MessageSquare',
    recentProjects: [
      { id: 'chat-1', title: 'Operational Architecture Review', date: 'Just now', tag: 'Session' }
    ]
  },
  {
    id: 'smart_kitchen',
    name: 'SMART KITCHEN',
    tagline: 'AI-powered recipe and kitchen assistant.',
    description: 'Transform your pantry into culinary masterpieces. Scans available ingredients, generates customized recipes matching macro goals, and guides prep with step-by-step instructions.',
    category: 'Lifestyle',
    features: [
      'Pantry Inventory Ingredient Matcher',
      'Macro & Calorie Nutritional Breakdown',
      'Dietary Constraint & Allergy Shield',
      'Step-by-Step Interactive Cook Timer',
      'Chef Pairing & Flavor Suggestions'
    ],
    status: 'Active',
    version: '1.8.0',
    actionType: 'open_app',
    targetApp: 'smart_kitchen',
    createdAt: '2026-03-12',
    lastUpdated: '2026-09-30',
    featured: false,
    gradient: 'from-lime-500/20 via-emerald-500/20 to-teal-500/20 border-lime-500/40 text-lime-400',
    badge: 'Lifestyle',
    requiredPlan: 'Free',
    rating: 4.85,
    usersCount: '34.1k',
    iconName: 'UtensilsCrossed',
    recentProjects: [
      { id: 'rec-1', title: 'High-Protein Mediterranean Bowl', date: 'Yesterday', tag: 'Recipe' },
      { id: 'rec-2', title: 'Quick 15-Minute Stir-fry', date: '3 days ago', tag: 'Dinner' }
    ]
  },
  {
    id: 'aerix_voice',
    name: 'AERIX VOICE',
    tagline: 'AI voice generation and expressive speech tools.',
    description: 'Synthesize hyper-natural human voices across 30+ languages. Adjust pitch, cadences, emotional intensity, and generate audio stems for voiceovers and podcasts.',
    category: 'Audio',
    features: [
      'Neural Text to Natural Speech',
      'Emotion & Pacing Modulation',
      'Studio Quality Stem Mastering',
      'Multi-Language Accent Support',
      'Instant Web Audio Synthesizer'
    ],
    status: 'Active',
    version: '2.1.0',
    actionType: 'open_app',
    targetApp: 'aerix_voice',
    createdAt: '2026-04-05',
    lastUpdated: '2026-10-02',
    featured: false,
    gradient: 'from-violet-500/20 via-purple-500/20 to-fuchsia-500/20 border-violet-500/40 text-violet-400',
    badge: 'Audio',
    requiredPlan: 'Free',
    rating: 4.78,
    usersCount: '27.5k',
    iconName: 'Mic',
    recentProjects: [
      { id: 'v-1', title: 'Documentary Narration Track', date: '4 days ago', tag: 'Voiceover' }
    ]
  },
  {
    id: 'aerix_write',
    name: 'AERIX WRITE',
    tagline: 'AI writing and structured content generation.',
    description: 'High-impact writing assistant designed for articles, executive summaries, marketing copy, and documentation. Features style shaping, tone matching, and instant structural revisions.',
    category: 'Writing',
    features: [
      'Long-form Article Drafting',
      'High-Conversion Ad & Email Copy',
      'Tone Modulation (Formal, Punchy, Casual)',
      'Grammar & Clarity Polishing',
      'Live Word & Readability Metrics'
    ],
    status: 'Active',
    version: '2.5.0',
    actionType: 'open_app',
    targetApp: 'aerix_write',
    createdAt: '2026-02-01',
    lastUpdated: '2026-09-25',
    featured: false,
    gradient: 'from-amber-400/20 via-yellow-500/20 to-orange-500/20 border-amber-400/40 text-amber-400',
    badge: 'Productivity',
    requiredPlan: 'Free',
    rating: 4.88,
    usersCount: '51.3k',
    iconName: 'PenTool',
    recentProjects: [
      { id: 'w-1', title: 'Q4 Strategic Executive Brief', date: 'Yesterday', tag: 'Memo' }
    ]
  },
  {
    id: 'aerix_enhance',
    name: 'AERIX ENHANCE',
    tagline: 'AI image and video enhancement.',
    description: 'Restore compressed visuals, eliminate sensor noise, and upscale low-resolution imagery to crisp 4K fidelity using deep convolutional neural super-resolution models.',
    category: 'Image',
    features: [
      '4x Neural Resolution Upscaling',
      'Face Feature Restoration',
      'Low-Light Noise Reduction',
      'Chromatic Aberration Removal',
      'Interactive Split-Screen Inspector'
    ],
    status: 'Beta',
    version: '1.2.0',
    actionType: 'open_app',
    targetApp: 'aerix_enhance',
    createdAt: '2026-06-15',
    lastUpdated: '2026-10-04',
    featured: false,
    gradient: 'from-blue-500/20 via-cyan-500/20 to-teal-500/20 border-blue-500/40 text-blue-400',
    badge: 'Enhancer',
    requiredPlan: 'Pro',
    rating: 4.82,
    usersCount: '15.9k',
    iconName: 'Sliders',
    recentProjects: [
      { id: 'enh-1', title: 'Archive Flight Telemetry Photo', date: '3 days ago', tag: '4K Upscale' }
    ]
  },
  {
    id: 'aerix_remove',
    name: 'AERIX REMOVE',
    tagline: 'Background and unwanted object removal.',
    description: 'Intelligent semantic segmentation tool. Isolate subjects in one tap, erase photobombers and watermarks with generative inpainting, and export transparent production assets.',
    category: 'AI Tools',
    features: [
      'Single-Click Subject Isolation',
      'Generative Inpainting Eraser',
      'Transparent PNG & Alpha Stems',
      'Edge Feathering & Matte Tuning',
      'Batch Canvas Export'
    ],
    status: 'Active',
    version: '1.9.2',
    actionType: 'open_app',
    targetApp: 'aerix_remove',
    createdAt: '2026-03-01',
    lastUpdated: '2026-10-03',
    featured: false,
    gradient: 'from-rose-500/20 via-pink-500/20 to-purple-500/20 border-rose-500/40 text-rose-400',
    badge: 'Utility',
    requiredPlan: 'Free',
    rating: 4.91,
    usersCount: '44.8k',
    iconName: 'Scissors',
    recentProjects: [
      { id: 'rem-1', title: 'Product Isolation Stems', date: '2 days ago', tag: 'Cutout' }
    ]
  },
  {
    id: 'aerix_tools',
    name: 'AERIX TOOLS',
    tagline: 'A collection of useful AI utilities.',
    description: 'The Swiss-army knife for builders. Includes LLM token calculators, prompt engineering enhancers, regex synthesizers, JSON structure validators, and data formatters.',
    category: 'AI Tools',
    features: [
      'LLM Token Counter & Cost Estimator',
      'Prompt Optimizer & System Tuner',
      'Natural Language to Regex Synthesizer',
      'JSON Schema Validator & Beautifier',
      'Unit & Data Matrix Converter'
    ],
    status: 'Active',
    version: '2.0.0',
    actionType: 'open_app',
    targetApp: 'aerix_tools',
    createdAt: '2026-04-18',
    lastUpdated: '2026-10-05',
    featured: false,
    gradient: 'from-slate-600/30 via-slate-700/30 to-slate-800/30 border-slate-600 text-slate-300',
    badge: 'Toolbox',
    requiredPlan: 'Free',
    rating: 4.87,
    usersCount: '38.6k',
    iconName: 'Wrench',
    recentProjects: [
      { id: 'tool-1', title: 'System Prompt Optimizer Run', date: 'Today', tag: 'Prompt' }
    ]
  },

  // Future / Coming Soon AI Applications
  {
    id: 'aerix_3d',
    name: 'AERIX 3D',
    tagline: 'Text to interactive 3D spatial models.',
    description: 'Transform prompts into low-poly and high-poly 3D meshes ready for Three.js, game engines, and spatial spatial computing viewports.',
    category: 'Productivity',
    features: [
      'Text to GLB / OBJ Model',
      'PBR Texture Baking',
      'Auto-Rigging Simulator',
      'AR QuickLook Preview'
    ],
    status: 'Coming Soon',
    version: '1.0.0-alpha',
    actionType: 'coming_soon',
    createdAt: '2026-09-01',
    lastUpdated: '2026-10-05',
    featured: false,
    gradient: 'from-indigo-600/20 via-blue-600/20 to-cyan-600/20 border-indigo-500/40 text-indigo-400',
    badge: 'Coming Soon',
    requiredPlan: 'Pro',
    rating: 5.0,
    usersCount: 'Waitlist',
    iconName: 'Box'
  },
  {
    id: 'aerix_music_ai',
    name: 'AERIX MUSIC AI',
    tagline: 'Neural stem generator and beat synthesizers.',
    description: 'Compose full-length adaptive soundtracks, lo-fi beats, and cinematic atmospheric pads directly from descriptive mood prompts.',
    category: 'Audio',
    features: [
      'Mood-Driven Instrumental Generation',
      'BPM & Key Adaptive Matching',
      'Stem Isolation (Drums, Bass, Synths)',
      'Lossless WAV Master Export'
    ],
    status: 'Coming Soon',
    version: '0.8.0',
    actionType: 'coming_soon',
    createdAt: '2026-08-15',
    lastUpdated: '2026-10-05',
    featured: false,
    gradient: 'from-fuchsia-500/20 via-purple-600/20 to-indigo-600/20 border-fuchsia-500/40 text-fuchsia-400',
    badge: 'Coming Soon',
    requiredPlan: 'Premium',
    rating: 5.0,
    usersCount: 'Waitlist',
    iconName: 'Music'
  },

  // System & Workspace Integrations (Maintained seamlessly so no features break!)
  {
    id: 'google_forms',
    name: 'Google Forms',
    tagline: 'Create surveys, polls, and monitor real-time submissions.',
    description: 'Google Workspace integration for creating and managing Forms in Google Drive, inspecting question structures, and reading respondent answers.',
    category: 'Productivity',
    features: [
      'Google Drive Forms Listing',
      'Interactive Survey Builder',
      'Live Submissions & Responses',
      'Direct Google Forms Share Link',
      'Drive Safe Deletion Confirmation'
    ],
    status: 'Active',
    version: '1.0.0',
    actionType: 'open_app',
    targetApp: 'forms',
    createdAt: '2026-10-05',
    lastUpdated: '2026-10-05',
    featured: false,
    gradient: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40 text-purple-400',
    badge: 'Workspace',
    requiredPlan: 'Free',
    rating: 4.89,
    usersCount: '12.4k',
    iconName: 'FileText'
  },
  {
    id: 'google_slides',
    name: 'Google Slides',
    tagline: 'Google Slides viewer, AI decks, and presentation creator.',
    description: 'Browse presentations from Google Drive, preview slides, or synthesize AI presentation decks with custom visual layouts.',
    category: 'Productivity',
    features: [
      'Google Drive Presentation Sync',
      'AI Slide Outline Generation',
      'Slide Presentation Mode',
      'Drive Export & Sharing'
    ],
    status: 'Active',
    version: '1.0.0',
    actionType: 'open_app',
    targetApp: 'slides',
    createdAt: '2026-10-01',
    lastUpdated: '2026-10-05',
    featured: false,
    gradient: 'from-amber-500/20 to-orange-500/20 border-amber-500/40 text-amber-400',
    badge: 'Workspace',
    requiredPlan: 'Free',
    rating: 4.79,
    usersCount: '9.2k',
    iconName: 'Presentation'
  }
];

export const appsService = {
  /**
   * Get all registered apps
   */
  getAllApps(): AppDefinition[] {
    return DEFAULT_AI_APPS;
  },

  /**
   * Get an app definition by ID
   */
  getAppById(id: string): AppDefinition | undefined {
    return DEFAULT_AI_APPS.find((app) => app.id === id);
  },

  // --- USER FAVORITES ---
  async getFavorites(userId: string): Promise<string[]> {
    const localKey = `aerix_app_favorites_${userId || 'guest'}`;
    const local = localStorage.getItem(localKey);
    let favorites: string[] = local ? JSON.parse(local) : ['aerix_shorts', 'aerix_image', 'aerix_chat'];

    if (isFirebaseConfigured && userId && userId !== 'local-guest-node' && navigator.onLine) {
      try {
        const snap = await getDoc(doc(db, 'users', userId, 'appPreferences', 'favorites'));
        if (snap.exists() && Array.isArray(snap.data()?.appIds)) {
          favorites = snap.data()?.appIds;
          localStorage.setItem(localKey, JSON.stringify(favorites));
        }
      } catch (err) {
        // Fallback silently to local cache
      }
    }

    return favorites;
  },

  async toggleFavorite(userId: string, appId: string): Promise<string[]> {
    const current = await this.getFavorites(userId);
    const updated = current.includes(appId)
      ? current.filter((id) => id !== appId)
      : [...current, appId];

    const localKey = `aerix_app_favorites_${userId || 'guest'}`;
    try {
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (isFirebaseConfigured && userId && userId !== 'local-guest-node' && navigator.onLine) {
      try {
        await setDoc(
          doc(db, 'users', userId, 'appPreferences', 'favorites'),
          sanitizeForFirestore({ appIds: updated, updatedAt: new Date().toISOString() }),
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}/appPreferences/favorites`);
      }
    }

    return updated;
  },

  // --- RECENTLY USED TRACKING ---
  async getRecentlyUsed(userId: string): Promise<AppUsageRecord[]> {
    const localKey = `aerix_app_recent_${userId || 'guest'}`;
    const local = localStorage.getItem(localKey);
    let list: AppUsageRecord[] = local
      ? JSON.parse(local)
      : [
          { appId: 'aerix_chat', lastOpenedTime: new Date(Date.now() - 3600000).toISOString(), usageCount: 15 },
          { appId: 'aerix_image', lastOpenedTime: new Date(Date.now() - 7200000).toISOString(), usageCount: 8 },
          { appId: 'aerix_shorts', lastOpenedTime: new Date(Date.now() - 14400000).toISOString(), usageCount: 12 }
        ];

    if (isFirebaseConfigured && userId && userId !== 'local-guest-node' && navigator.onLine) {
      try {
        const q = query(collection(db, 'users', userId, 'appUsage'), orderBy('lastOpenedTime', 'desc'), limit(10));
        const snap = await getDocs(q);
        if (!snap.empty) {
          const cloudList: AppUsageRecord[] = [];
          snap.forEach((d) => {
            const data = d.data();
            cloudList.push({
              appId: d.id,
              lastOpenedTime: data.lastOpenedTime,
              usageCount: data.usageCount || 1
            });
          });
          list = cloudList;
          localStorage.setItem(localKey, JSON.stringify(list));
        }
      } catch (err) {
        // Fallback to local cache
      }
    }

    return list.sort((a, b) => new Date(b.lastOpenedTime).getTime() - new Date(a.lastOpenedTime).getTime());
  },

  async recordAppUsage(userId: string, appId: string): Promise<void> {
    const list = await this.getRecentlyUsed(userId);
    const existing = list.find((item) => item.appId === appId);
    const updatedRecord: AppUsageRecord = {
      appId,
      lastOpenedTime: new Date().toISOString(),
      usageCount: (existing?.usageCount || 0) + 1
    };

    const updatedList = [updatedRecord, ...list.filter((x) => x.appId !== appId)].slice(0, 10);
    const localKey = `aerix_app_recent_${userId || 'guest'}`;
    try {
      localStorage.setItem(localKey, JSON.stringify(updatedList));
    } catch {
      // ignore
    }

    if (isFirebaseConfigured && userId && userId !== 'local-guest-node' && navigator.onLine) {
      try {
        await setDoc(
          doc(db, 'users', userId, 'appUsage', appId),
          sanitizeForFirestore(updatedRecord),
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}/appUsage/${appId}`);
      }
    }
  },

  // --- COMING SOON NOTIFICATION PREFERENCES ---
  async getNotificationPreferences(userId: string): Promise<string[]> {
    const localKey = `aerix_app_alerts_${userId || 'guest'}`;
    const local = localStorage.getItem(localKey);
    let alerts: string[] = local ? JSON.parse(local) : [];

    if (isFirebaseConfigured && userId && userId !== 'local-guest-node' && navigator.onLine) {
      try {
        const snap = await getDoc(doc(db, 'users', userId, 'appPreferences', 'notifications'));
        if (snap.exists() && Array.isArray(snap.data()?.notifyAppIds)) {
          alerts = snap.data()?.notifyAppIds;
          localStorage.setItem(localKey, JSON.stringify(alerts));
        }
      } catch {
        // ignore
      }
    }

    return alerts;
  },

  async toggleNotificationPreference(userId: string, appId: string): Promise<boolean> {
    const current = await this.getNotificationPreferences(userId);
    const hasAlert = current.includes(appId);
    const updated = hasAlert ? current.filter((id) => id !== appId) : [...current, appId];

    const localKey = `aerix_app_alerts_${userId || 'guest'}`;
    try {
      localStorage.setItem(localKey, JSON.stringify(updated));
    } catch {
      // ignore
    }

    if (isFirebaseConfigured && userId && userId !== 'local-guest-node' && navigator.onLine) {
      try {
        await setDoc(
          doc(db, 'users', userId, 'appPreferences', 'notifications'),
          sanitizeForFirestore({ notifyAppIds: updated, updatedAt: new Date().toISOString() }),
          { merge: true }
        );
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `users/${userId}/appPreferences/notifications`);
      }
    }

    return !hasAlert;
  }
};
