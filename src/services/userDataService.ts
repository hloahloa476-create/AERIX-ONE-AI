/**
 * AERIX ONE - User Data Service
 * Manages persistent user collections (projects, media, settings, usage, locations)
 * with strict User ID isolation.
 */

import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  deleteDoc,
  query,
  where,
  orderBy
} from 'firebase/firestore';
import { db, isFirebaseConfigured, handleFirestoreError, sanitizeForFirestore, OperationType } from './firebase';

export interface UserLocationRecord {
  id: string;
  userId: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  category?: string;
  savedAt: string;
}

export interface UserProjectRecord {
  id: string;
  userId: string;
  title: string;
  description?: string;
  category?: string;
  updatedAt: string;
}

export interface UserMediaRecord {
  id: string;
  userId: string;
  title: string;
  type: string;
  url: string;
  createdAt: string;
}

export interface UserSettingsRecord {
  userId: string;
  language: 'en' | 'ar';
  theme: string;
  notifications: boolean;
  aiLanguage: 'auto' | 'en' | 'ar';
  saveHistory: boolean;
  conversationMemory: boolean;
  responseStyle: 'fast' | 'creative' | 'analytical';
  locationPermission: 'granted' | 'denied' | 'prompt' | 'unknown';
  updatedAt: string;
}

export const userDataService = {
  // --- LOCATIONS ---
  async getLocations(userId: string): Promise<UserLocationRecord[]> {
    if (!isFirebaseConfigured || !userId || userId === 'local-guest-node') {
      const local = localStorage.getItem(`aerix_locations_${userId}`);
      return local ? JSON.parse(local) : [];
    }

    try {
      const q = query(collection(db, 'locations'), where('userId', '==', userId));
      const snap = await getDocs(q);
      const records: UserLocationRecord[] = [];
      snap.forEach((d) => records.push(d.data() as UserLocationRecord));
      localStorage.setItem(`aerix_locations_${userId}`, JSON.stringify(records));
      return records;
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'locations');
      const local = localStorage.getItem(`aerix_locations_${userId}`);
      return local ? JSON.parse(local) : [];
    }
  },

  async saveLocation(userId: string, loc: Omit<UserLocationRecord, 'userId'>): Promise<UserLocationRecord> {
    const record: UserLocationRecord = {
      ...loc,
      userId,
      savedAt: loc.savedAt || new Date().toISOString()
    };

    // Save locally
    const current = await this.getLocations(userId);
    const updated = [record, ...current.filter((x) => x.id !== record.id)];
    localStorage.setItem(`aerix_locations_${userId}`, JSON.stringify(updated));

    if (isFirebaseConfigured && userId && userId !== 'local-guest-node') {
      try {
        await setDoc(doc(db, 'locations', record.id), sanitizeForFirestore(record));
      } catch (err) {
        handleFirestoreError(err, OperationType.WRITE, `locations/${record.id}`);
      }
    }

    return record;
  },

  async deleteLocation(userId: string, locationId: string): Promise<void> {
    const current = await this.getLocations(userId);
    const filtered = current.filter((x) => x.id !== locationId);
    localStorage.setItem(`aerix_locations_${userId}`, JSON.stringify(filtered));

    if (isFirebaseConfigured && userId && userId !== 'local-guest-node') {
      try {
        await deleteDoc(doc(db, 'locations', locationId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `locations/${locationId}`);
      }
    }
  },

  // --- SETTINGS ---
  async getSettings(userId: string): Promise<UserSettingsRecord> {
    const defaultSettings: UserSettingsRecord = {
      userId,
      language: 'en',
      theme: 'dark',
      notifications: true,
      aiLanguage: 'auto',
      saveHistory: true,
      conversationMemory: true,
      responseStyle: 'fast',
      locationPermission: 'unknown',
      updatedAt: new Date().toISOString()
    };

    const localKey = `aerix_settings_${userId}`;
    const local = localStorage.getItem(localKey);
    let current = local ? { ...defaultSettings, ...JSON.parse(local) } : defaultSettings;

    if (isFirebaseConfigured && userId && userId !== 'local-guest-node') {
      try {
        const snap = await getDoc(doc(db, 'settings', userId));
        if (snap.exists()) {
          current = { ...current, ...(snap.data() as UserSettingsRecord) };
          localStorage.setItem(localKey, JSON.stringify(current));
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `settings/${userId}`);
      }
    }

    return current;
  },

  async updateSettings(userId: string, updates: Partial<UserSettingsRecord>): Promise<UserSettingsRecord> {
    const current = await this.getSettings(userId);
    const updated: UserSettingsRecord = {
      ...current,
      ...updates,
      updatedAt: new Date().toISOString()
    };

    localStorage.setItem(`aerix_settings_${userId}`, JSON.stringify(updated));

    if (isFirebaseConfigured && userId && userId !== 'local-guest-node') {
      try {
        await setDoc(doc(db, 'settings', userId), sanitizeForFirestore(updated), { merge: true });
      } catch (err) {
        handleFirestoreError(err, OperationType.UPDATE, `settings/${userId}`);
      }
    }

    return updated;
  },

  // --- DELETE ALL ACCOUNT DATA ---
  async deleteAllUserData(userId: string): Promise<void> {
    // Clear local storage items
    const keys = [
      `aerix_settings_${userId}`,
      `aerix_locations_${userId}`,
      `aerix_conversations_${userId}`,
      `aerix_profile_${userId}`,
      `aerix_notes_${userId}`
    ];
    keys.forEach((k) => localStorage.removeItem(k));

    if (isFirebaseConfigured && userId && userId !== 'local-guest-node') {
      try {
        // Delete settings doc
        await deleteDoc(doc(db, 'settings', userId));
        // Delete profile doc
        await deleteDoc(doc(db, 'users', userId));
        await deleteDoc(doc(db, 'profiles', userId));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${userId}`);
      }
    }
  }
};
