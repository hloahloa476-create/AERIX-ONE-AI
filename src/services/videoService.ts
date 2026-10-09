/**
 * AERIX ONE - Video Service (Phase 5 AERIX SHORTS Platform)
 * Manages video feeds (For You, Following, Trending, Search),
 * user interactions (likes, saves, follows, views) in Firebase Firestore,
 * comments system, and real storage checks for uploads.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  updateDoc,
  increment,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError } from './firebase';
import { ShortVideo, ShortComment } from '../types';
import { INITIAL_SHORTS } from '../data/mockData';

// Enhanced initial shorts with titles, views, music artists, and timestamps
export const DEFAULT_SHORTS: ShortVideo[] = INITIAL_SHORTS.map((s, idx) => ({
  ...s,
  title: [
    'Mach 1.8 Atmospheric Transit Vector',
    'Elysium Ring Biosphere 0.92G Graviton',
    'Zero-Resistance Magnetic Formula Apex',
    'Photonic Quantum Synaptic Lattice'
  ][idx] || s.description.slice(0, 30),
  views: [248000, 189000, 142000, 96000][idx] || 50000,
  musicArtist: [
    'AERIX Soundworks & Cyberia',
    'Orbital Acoustic Laboratories',
    'Synapse Sound Dynamics',
    'Neural Matrix Audio Labs'
  ][idx] || 'AERIX Quantum Audio',
  createdAt: new Date(Date.now() - (idx + 1) * 3600000 * 24).toISOString()
}));

const LOCAL_STORAGE_LIKES_KEY = 'aerix_liked_shorts_v1';
const LOCAL_STORAGE_SAVES_KEY = 'aerix_saved_shorts_v1';
const LOCAL_STORAGE_FOLLOWS_KEY = 'aerix_following_creators_v1';

export const videoService = {
  isStreamingServiceConnected: true,
  isVideoStorageConfigured: false, // Explicit: Cloud storage bucket for direct MP4 uploads is not yet provisioned
  phase: 'Phase 5 - AERIX SHORTS Engine',

  /**
   * Check if external video media storage bucket is configured
   */
  checkStorageConfiguration(): { isConfigured: boolean; message: string } {
    return {
      isConfigured: this.isVideoStorageConfigured,
      message:
        'Cloud Video Storage (Firebase Storage or Video CDN) is required for raw video uploads. To publish custom videos, a storage bucket must be provisioned.'
    };
  },

  /**
   * Fetch user's liked short IDs
   */
  async getUserLikes(userId?: string): Promise<Set<string>> {
    const uid = userId || auth.currentUser?.uid;
    const likes = new Set<string>();

    if (uid && db) {
      try {
        const colRef = collection(db, 'users', uid, 'likedShorts');
        const snap = await getDocs(colRef);
        snap.forEach((d) => likes.add(d.id));
        return likes;
      } catch (err) {
        console.warn('Could not read Firestore likes:', err);
      }
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_LIKES_KEY);
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        arr.forEach((id) => likes.add(id));
      }
    } catch {
      // ignore
    }

    return likes;
  },

  /**
   * Fetch user's saved short IDs
   */
  async getUserSaves(userId?: string): Promise<Set<string>> {
    const uid = userId || auth.currentUser?.uid;
    const saves = new Set<string>();

    if (uid && db) {
      try {
        const colRef = collection(db, 'users', uid, 'savedShorts');
        const snap = await getDocs(colRef);
        snap.forEach((d) => saves.add(d.id));
        return saves;
      } catch (err) {
        console.warn('Could not read Firestore saves:', err);
      }
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SAVES_KEY);
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        arr.forEach((id) => saves.add(id));
      }
    } catch {
      // ignore
    }

    return saves;
  },

  /**
   * Fetch creators followed by current user
   */
  async getUserFollows(userId?: string): Promise<Set<string>> {
    const uid = userId || auth.currentUser?.uid;
    const follows = new Set<string>();

    if (uid && db) {
      try {
        const colRef = collection(db, 'users', uid, 'followingCreators');
        const snap = await getDocs(colRef);
        snap.forEach((d) => follows.add(d.id));
        return follows;
      } catch (err) {
        console.warn('Could not read Firestore follows:', err);
      }
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_FOLLOWS_KEY);
      if (raw) {
        const arr: string[] = JSON.parse(raw);
        arr.forEach((h) => follows.add(h));
      }
    } catch {
      // ignore
    }

    return follows;
  },

  /**
   * Get Feed by Tab: For You, Following, Trending
   */
  async getFeed(
    tab: 'foryou' | 'following' | 'trending',
    userId?: string
  ): Promise<ShortVideo[]> {
    const [likesSet, savesSet, followsSet] = await Promise.all([
      this.getUserLikes(userId),
      this.getUserSaves(userId),
      this.getUserFollows(userId)
    ]);

    // Read any user-published shorts from Firestore if available
    let customShorts: ShortVideo[] = [];
    if (db) {
      try {
        const colRef = collection(db, 'shorts');
        const q = query(colRef, orderBy('createdAt', 'desc'), limit(20));
        const snap = await getDocs(q);
        snap.forEach((d) => {
          const data = d.data();
          customShorts.push({
            id: d.id,
            title: data.title || 'AERIX Short',
            creator: data.creator || {
              name: 'AERIX Creator',
              handle: '@creator',
              avatar: 'AC',
              verified: false,
              followers: '100',
              bio: ''
            },
            description: data.description || '',
            tags: data.tags || ['future', 'tech'],
            audioTitle: data.audioTitle || 'AERIX Resonance',
            musicArtist: data.musicArtist || 'AERIX Quantum',
            likes: Number(data.likes || 0),
            comments: Number(data.comments || 0),
            shares: Number(data.shares || 0),
            saves: Number(data.saves || 0),
            views: Number(data.views || 0),
            videoType: 'custom'
          });
        });
      } catch {
        // use default shorts
      }
    }

    const allShorts = [...customShorts, ...DEFAULT_SHORTS].map((s) => ({
      ...s,
      isLiked: likesSet.has(s.id),
      isSaved: savesSet.has(s.id),
      isFollowing: followsSet.has(s.creator.handle)
    }));

    if (tab === 'following') {
      return allShorts.filter((s) => followsSet.has(s.creator.handle));
    }

    if (tab === 'trending') {
      // Rank by engagement: likes + comments * 2
      return [...allShorts].sort(
        (a, b) => b.likes + b.comments * 2 - (a.likes + a.comments * 2)
      );
    }

    // Default 'foryou'
    return allShorts;
  },

  /**
   * Search shorts by query across creators, titles, hashtags, and music
   */
  async searchShorts(queryText: string, userId?: string): Promise<{
    videos: ShortVideo[];
    creators: ShortVideo['creator'][];
    hashtags: { tag: string; count: number }[];
  }> {
    const feed = await this.getFeed('foryou', userId);
    const q = queryText.toLowerCase().trim().replace(/^#/, '');

    if (!q) {
      return { videos: [], creators: [], hashtags: [] };
    }

    const matchedVideos = feed.filter(
      (v) =>
        v.title?.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.creator.name.toLowerCase().includes(q) ||
        v.creator.handle.toLowerCase().includes(q) ||
        v.tags.some((t) => t.toLowerCase().includes(q)) ||
        v.audioTitle.toLowerCase().includes(q)
    );

    // Extract unique matched creators
    const creatorMap = new Map<string, ShortVideo['creator']>();
    feed.forEach((v) => {
      if (
        v.creator.name.toLowerCase().includes(q) ||
        v.creator.handle.toLowerCase().includes(q)
      ) {
        creatorMap.set(v.creator.handle, v.creator);
      }
    });

    // Extract matched hashtags
    const tagCountMap = new Map<string, number>();
    feed.forEach((v) => {
      v.tags.forEach((t) => {
        if (t.toLowerCase().includes(q)) {
          tagCountMap.set(t, (tagCountMap.get(t) || 0) + 1);
        }
      });
    });

    const hashtags = Array.from(tagCountMap.entries()).map(([tag, count]) => ({
      tag,
      count
    }));

    return {
      videos: matchedVideos,
      creators: Array.from(creatorMap.values()),
      hashtags
    };
  },

  /**
   * Toggle Like for a Short in Firestore
   */
  async toggleLike(shortId: string, currentLiked: boolean, userId?: string): Promise<boolean> {
    const uid = userId || auth.currentUser?.uid;
    const nextState = !currentLiked;

    if (uid && db) {
      try {
        const likeRef = doc(db, 'users', uid, 'likedShorts', shortId);
        if (nextState) {
          await setDoc(likeRef, { shortId, likedAt: new Date().toISOString() });
        } else {
          await deleteDoc(likeRef);
        }

        // Try updating short document like count if it exists in Firestore
        const shortRef = doc(db, 'shorts', shortId);
        await updateDoc(shortRef, {
          likes: increment(nextState ? 1 : -1)
        }).catch(() => {});
      } catch (err) {
        console.warn('Could not sync like to Firestore:', err);
      }
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_LIKES_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const updated = nextState ? [...new Set([...list, shortId])] : list.filter((id) => id !== shortId);
      localStorage.setItem(LOCAL_STORAGE_LIKES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return nextState;
  },

  /**
   * Toggle Save for a Short in Firestore
   */
  async toggleSave(shortId: string, currentSaved: boolean, userId?: string): Promise<boolean> {
    const uid = userId || auth.currentUser?.uid;
    const nextState = !currentSaved;

    if (uid && db) {
      try {
        const saveRef = doc(db, 'users', uid, 'savedShorts', shortId);
        if (nextState) {
          await setDoc(saveRef, { shortId, savedAt: new Date().toISOString() });
        } else {
          await deleteDoc(saveRef);
        }

        const shortRef = doc(db, 'shorts', shortId);
        await updateDoc(shortRef, {
          saves: increment(nextState ? 1 : -1)
        }).catch(() => {});
      } catch (err) {
        console.warn('Could not sync save to Firestore:', err);
      }
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SAVES_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const updated = nextState ? [...new Set([...list, shortId])] : list.filter((id) => id !== shortId);
      localStorage.setItem(LOCAL_STORAGE_SAVES_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return nextState;
  },

  /**
   * Toggle Follow for a creator in Firestore
   */
  async toggleFollow(creatorHandle: string, currentFollowing: boolean, userId?: string): Promise<boolean> {
    const uid = userId || auth.currentUser?.uid;
    const nextState = !currentFollowing;
    const safeId = creatorHandle.replace(/[^a-zA-Z0-9_-]/g, '_');

    if (uid && db) {
      try {
        const followRef = doc(db, 'users', uid, 'followingCreators', safeId);
        if (nextState) {
          await setDoc(followRef, { handle: creatorHandle, followedAt: new Date().toISOString() });
        } else {
          await deleteDoc(followRef);
        }
      } catch (err) {
        console.warn('Could not sync follow to Firestore:', err);
      }
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_FOLLOWS_KEY);
      const list: string[] = raw ? JSON.parse(raw) : [];
      const updated = nextState ? [...new Set([...list, creatorHandle])] : list.filter((h) => h !== creatorHandle);
      localStorage.setItem(LOCAL_STORAGE_FOLLOWS_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return nextState;
  },

  /**
   * Record video view with debounced session anti-spam check
   */
  async recordView(shortId: string, userId?: string): Promise<void> {
    const sessionKey = `aerix_viewed_${shortId}`;
    if (sessionStorage.getItem(sessionKey)) {
      return; // Already viewed in this session, avoid spam
    }
    sessionStorage.setItem(sessionKey, '1');

    const uid = userId || auth.currentUser?.uid;
    if (uid && db) {
      try {
        const viewRef = doc(db, 'users', uid, 'viewedShorts', shortId);
        await setDoc(viewRef, { shortId, viewedAt: new Date().toISOString() });

        const shortRef = doc(db, 'shorts', shortId);
        await updateDoc(shortRef, {
          views: increment(1)
        }).catch(() => {});
      } catch {
        // ignore
      }
    }
  },

  /**
   * Get Comments for a video from Firestore with fallback
   */
  async getComments(shortId: string): Promise<ShortComment[]> {
    if (db) {
      try {
        const colRef = collection(db, 'shorts', shortId, 'comments');
        const q = query(colRef, orderBy('createdAt', 'desc'), limit(50));
        const snap = await getDocs(q);

        if (!snap.empty) {
          const list: ShortComment[] = [];
          snap.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              shortId,
              userId: data.userId || 'anon',
              userName: data.userName || 'AERIX User',
              userHandle: data.userHandle || '@user',
              userAvatar: data.userAvatar,
              text: data.text || '',
              createdAt: data.createdAt || 'Just now',
              likes: data.likes || 0
            });
          });
          return list;
        }
      } catch (err) {
        console.warn('Could not read Firestore comments:', err);
      }
    }

    // Default sample comments for initial shorts
    return [
      {
        id: 'c1',
        shortId,
        userId: 'u_nova',
        userName: 'Nova Prime',
        userHandle: '@nova.prime',
        text: 'The gyroscopic dampeners look completely smooth! 🔥',
        createdAt: '2m ago',
        likes: 14
      },
      {
        id: 'c2',
        shortId,
        userId: 'u_aero',
        userName: 'Aero Pilot',
        userHandle: '@aero.pilot',
        text: 'Mach 1.8 at that altitude is incredible engineering.',
        createdAt: '15m ago',
        likes: 8
      },
      {
        id: 'c3',
        shortId,
        userId: 'u_bot',
        userName: 'Quantum Bot',
        userHandle: '@quantumbot',
        text: 'Can AERIX ONE telemetry stream to my local dashboard?',
        createdAt: '1h ago',
        likes: 5
      }
    ];
  },

  /**
   * Add a comment to a video in Firestore
   */
  async addComment(
    shortId: string,
    text: string,
    user: { id: string; name: string; handle: string; avatar?: string }
  ): Promise<ShortComment> {
    const commentId = `cm_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    const newComment: ShortComment = {
      id: commentId,
      shortId,
      userId: user.id,
      userName: user.name,
      userHandle: user.handle,
      userAvatar: user.avatar,
      text: text.trim(),
      createdAt: 'Just now',
      likes: 0
    };

    if (db) {
      try {
        const commentRef = doc(db, 'shorts', shortId, 'comments', commentId);
        await setDoc(commentRef, {
          ...newComment,
          createdAt: new Date().toISOString()
        });

        // Increment comment count
        const shortRef = doc(db, 'shorts', shortId);
        await updateDoc(shortRef, {
          comments: increment(1)
        }).catch(() => {});
      } catch (err) {
        console.warn('Could not write comment to Firestore:', err);
      }
    }

    return newComment;
  },

  /**
   * Delete user's own comment from Firestore
   */
  async deleteComment(shortId: string, commentId: string): Promise<void> {
    if (db) {
      try {
        const commentRef = doc(db, 'shorts', shortId, 'comments', commentId);
        await deleteDoc(commentRef);

        const shortRef = doc(db, 'shorts', shortId);
        await updateDoc(shortRef, {
          comments: increment(-1)
        }).catch(() => {});
      } catch (err) {
        console.warn('Could not delete comment from Firestore:', err);
      }
    }
  }
};
