/**
 * AERIX ONE - AI Video Generation Service (AERIX SHORTS)
 * Separates the AI video generation layer from the UI.
 * Connects to AI models for prompt enhancement and manages video rendering pipelines,
 * generation stages, video customization, and Firestore persistence.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth } from './firebase';
import { GeneratedShort } from '../types';

export interface ShortGenerationParams {
  prompt: string;
  style: 'Cinematic' | 'Realistic' | 'Anime' | '3D' | 'Horror' | 'Action' | 'Fantasy' | 'Comedy';
  duration: 5 | 10 | 15 | 30;
  aspectRatio: '9:16' | '16:9' | '1:1';
  quality: 'HD' | '4K';
  cameraStyle: 'Handheld' | 'Cinematic' | 'Drone' | 'Close-up' | 'Tracking Shot' | 'Slow Motion';
  lighting: 'Natural' | 'Dark' | 'Neon' | 'Studio' | 'Sunset';
  music: string;
  enhancedPrompt?: string;
}

export const INITIAL_RECENT_SHORTS: GeneratedShort[] = [
  {
    id: 'short-neon-odyssey',
    prompt: 'Hyper-speed flight across the neon canyon of Neo-Riyadh 2099',
    enhancedPrompt: 'Cinematic 8K drone shot sweeping through skyscraper light columns in Neo-Riyadh, wet asphalt reflecting holographic towers, atmospheric blue mist, anamorphic lens flare.',
    style: 'Cinematic',
    duration: 10,
    aspectRatio: '9:16',
    quality: '4K',
    cameraStyle: 'Drone',
    lighting: 'Neon',
    music: 'Quantum Cyber Synths',
    speed: 1,
    videoUrl: 'neon-city',
    thumbnailUrl: '/src/assets/images/aerix_one_logo_1791197135811.jpg',
    createdAt: '2 hours ago',
    fileSize: '14.2 MB'
  },
  {
    id: 'short-orbital-dawn',
    prompt: 'Earth orbital sunrise view from a spinning quantum habitat ring',
    enhancedPrompt: 'Hyperrealistic slow-motion vista of the sun breaking over Earth curvature, golden solar rays catching solar array structures, 0.92G rotational mechanics.',
    style: 'Realistic',
    duration: 15,
    aspectRatio: '9:16',
    quality: '4K',
    cameraStyle: 'Cinematic',
    lighting: 'Sunset',
    music: 'Cosmic Ambient Echo',
    speed: 1,
    videoUrl: 'orbital-station',
    thumbnailUrl: '/src/assets/images/aerix_one_logo_1791197135811.jpg',
    createdAt: 'Yesterday',
    fileSize: '22.8 MB'
  },
  {
    id: 'short-synapse-drift',
    prompt: 'Formula Zero quantum drift vehicle taking a sharp magnetic corner',
    enhancedPrompt: 'Close-up tracking shot of glowing magnetic levitation thrusters generating electric arcs on a titanium speedway, neon motion trails, high octane.',
    style: 'Action',
    duration: 5,
    aspectRatio: '9:16',
    quality: 'HD',
    cameraStyle: 'Tracking Shot',
    lighting: 'Dark',
    music: 'High Voltage Overdrive',
    speed: 1,
    videoUrl: 'speed-racer',
    thumbnailUrl: '/src/assets/images/aerix_one_logo_1791197135811.jpg',
    createdAt: '3 days ago',
    fileSize: '8.4 MB'
  },
  {
    id: 'short-neural-lattice',
    prompt: 'Bioluminescent neural AI network learning human emotions',
    enhancedPrompt: '3D micro-photography of glowing photonic synapses transmitting thought impulses through an ethereal crystalline lattice, vivid violet and cyan luminescence.',
    style: '3D',
    duration: 10,
    aspectRatio: '1:1',
    quality: '4K',
    cameraStyle: 'Close-up',
    lighting: 'Studio',
    music: 'Sub-harmonic Theta Waves',
    speed: 1,
    videoUrl: 'quantum-ai',
    thumbnailUrl: '/src/assets/images/aerix_one_logo_1791197135811.jpg',
    createdAt: '5 days ago',
    fileSize: '16.1 MB'
  }
];

const LOCAL_STORAGE_KEY = 'aerix_generated_shorts_v1';

export const aiVideoService = {
  /**
   * Intelligently enhance prompt for cinematic video generation
   */
  async enhancePrompt(prompt: string, style: string): Promise<string> {
    const trimmed = prompt.trim();
    if (!trimmed) return prompt;

    try {
      // Call server-side Gemini endpoint for prompt enhancement
      const res = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          prompt: `You are a Hollywood director and expert video prompt engineer. Enhance this video generation prompt into a concise, vivid cinematic prompt (maximum 35 words) with rich camera movement, lighting, textures, and atmosphere for a ${style} video style: "${trimmed}". Output only the enhanced prompt without quotes or preamble.`,
          stream: false
        })
      });

      if (res.ok) {
        const data = await res.json();
        if (data?.content && data.content.trim()) {
          return data.content.trim();
        }
      }
    } catch {
      // Fallback below
    }

    // Built-in intelligent prompt enhancement fallback
    const styleEnhancers: Record<string, string> = {
      Cinematic: 'Cinematic 8K film look, anamorphic lens flare, shallow depth of field, dramatic atmospheric haze, hyper-detailed textures',
      Realistic: 'Photorealistic high-fidelity 4K capture, natural dynamic range, lifelike physics, tactile textures, 35mm lens clarity',
      Anime: 'Makoto Shinkai aesthetic, hand-drawn anime keyframes, vibrant glowing skies, emotional lighting, high-energy particle effects',
      '3D': 'Next-gen Unreal Engine 5 render, raytraced subsurface scattering, volumetric micro-details, octane materials',
      Horror: 'Eerie low-key lighting, desaturated cold tones, unsettling shadows, suspenseful slow drift camera, atmospheric dread',
      Action: 'Fast-paced kinetic camera motion, motion blur, explosive lighting contrasts, visceral impact angles',
      Fantasy: 'Enchanted ethereal glow, floating bioluminescent spores, mythical golden hour radiance, dreamlike grandeur',
      Comedy: 'Bright vibrant palette, playful dynamic framing, exaggerated expressive motion, punchy comedic timing'
    };

    const modifier = styleEnhancers[style] || 'Ultra-detailed cinematic 4K video, volumetric lighting, fluid motion, master composition';
    return `${trimmed}, ${modifier}.`;
  },

  /**
   * Run multi-stage AI video generation pipeline
   */
  async generateShort(
    params: ShortGenerationParams,
    onStageUpdate?: (stageName: string, stepNumber: number) => void
  ): Promise<GeneratedShort> {
    const stages = [
      { step: 1, name: 'Analyzing Prompt & Semantics' },
      { step: 2, name: 'Creating Scene Geometry & Composition' },
      { step: 3, name: 'Generating Temporal Motion Vectors' },
      { step: 4, name: 'Rendering Video Frames & Volumetrics' },
      { step: 5, name: 'Finalizing Audio & Short Encoding' }
    ];

    for (const stage of stages) {
      if (onStageUpdate) {
        onStageUpdate(stage.name, stage.step);
      }
      // Realistic simulation delay for each stage
      await new Promise((resolve) => setTimeout(resolve, 850));
    }

    // Select procedural visual preset based on style
    let visualType: GeneratedShort['videoUrl'] = 'neon-city';
    if (params.style === '3D') visualType = 'quantum-ai';
    else if (params.style === 'Action') visualType = 'speed-racer';
    else if (params.style === 'Realistic' || params.style === 'Cinematic') visualType = 'orbital-station';

    const shortId = `short_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newShort: GeneratedShort = {
      id: shortId,
      prompt: params.prompt,
      enhancedPrompt: params.enhancedPrompt || params.prompt,
      style: params.style,
      duration: params.duration,
      aspectRatio: params.aspectRatio,
      quality: params.quality,
      cameraStyle: params.cameraStyle,
      lighting: params.lighting,
      music: params.music || 'AERIX Quantum Soundscape',
      speed: 1,
      videoUrl: visualType,
      thumbnailUrl: '/src/assets/images/aerix_one_logo_1791197135811.jpg',
      createdAt: 'Just now',
      fileSize: params.quality === '4K' ? '24.6 MB' : '11.8 MB'
    };

    // Save to library
    await this.saveShort(newShort);

    return newShort;
  },

  /**
   * Retrieve list of recent shorts from Firestore and local storage
   */
  async getRecentShorts(userId?: string): Promise<GeneratedShort[]> {
    const uid = userId || auth.currentUser?.uid;

    if (uid && db) {
      try {
        const colRef = collection(db, 'users', uid, 'generatedShorts');
        const q = query(colRef, orderBy('createdAt', 'desc'), limit(30));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const list: GeneratedShort[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              prompt: data.prompt || 'Untitled Short',
              enhancedPrompt: data.enhancedPrompt,
              style: data.style || 'Cinematic',
              duration: data.duration || 10,
              aspectRatio: data.aspectRatio || '9:16',
              quality: data.quality || 'HD',
              cameraStyle: data.cameraStyle || 'Cinematic',
              lighting: data.lighting || 'Neon',
              music: data.music || 'Default Audio',
              speed: data.speed || 1,
              textOverlay: data.textOverlay,
              videoUrl: data.videoUrl || 'neon-city',
              thumbnailUrl: data.thumbnailUrl || '/src/assets/images/aerix_one_logo_1791197135811.jpg',
              createdAt: data.createdAt ? new Date(data.createdAt).toLocaleDateString() : 'Recent',
              fileSize: data.fileSize || '14.0 MB'
            });
          });
          return list;
        }
      } catch (err) {
        console.warn('Could not load generated shorts from Firestore, using local fallback:', err);
      }
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }

    return INITIAL_RECENT_SHORTS;
  },

  /**
   * Save or update a short
   */
  async saveShort(short: GeneratedShort, userId?: string): Promise<void> {
    const uid = userId || auth.currentUser?.uid;

    if (uid && db) {
      try {
        const docRef = doc(db, 'users', uid, 'generatedShorts', short.id);
        await setDoc(docRef, {
          ...short,
          createdAt: new Date().toISOString()
        });
      } catch (err) {
        console.warn('Could not save short to Firestore:', err);
      }
    }

    try {
      const current = await this.getRecentShorts(uid);
      const updated = [short, ...current.filter((s) => s.id !== short.id)];
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  },

  /**
   * Update video parameters on edit
   */
  async updateShort(updatedShort: GeneratedShort, userId?: string): Promise<GeneratedShort> {
    await this.saveShort(updatedShort, userId);
    return updatedShort;
  },

  /**
   * Delete a short
   */
  async deleteShort(shortId: string, userId?: string): Promise<void> {
    const uid = userId || auth.currentUser?.uid;

    if (uid && db) {
      try {
        const docRef = doc(db, 'users', uid, 'generatedShorts', shortId);
        await deleteDoc(docRef);
      } catch (err) {
        console.warn('Could not delete short from Firestore:', err);
      }
    }

    try {
      const current = await this.getRecentShorts(uid);
      const filtered = current.filter((s) => s.id !== shortId);
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(filtered));
    } catch {
      // ignore
    }
  }
};
