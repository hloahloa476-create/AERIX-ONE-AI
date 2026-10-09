/**
 * AERIX ONE - Maps Service (Phase 4 Full Google Maps Platform Integration)
 * Integrates with Firebase Firestore for private user saved places,
 * and manages geocoding, coordinates, and place markers.
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  orderBy
} from 'firebase/firestore';
import { db, auth, OperationType, handleFirestoreError, sanitizeForFirestore } from './firebase';

export interface MapCoordinates {
  lat: number;
  lng: number;
  zoom?: number;
  label?: string;
}

export interface MapPlace {
  id: string;
  name: string;
  category: 'landmark' | 'transit' | 'tech' | 'leisure' | 'restaurant' | 'airport' | 'school' | 'commercial';
  lat: number;
  lng: number;
  address: string;
  rating?: number;
  userRatingCount?: number;
  websiteURI?: string;
  savedAt?: string;
  isCustom?: boolean;
}

// Default prominent locations for AERIX ONE
export const DEFAULT_PLACES: MapPlace[] = [
  {
    id: 'riyadh-kingdom-centre',
    name: 'Kingdom Centre',
    category: 'landmark',
    lat: 24.7114,
    lng: 46.6744,
    address: 'King Fahd Rd, Al Olaya, Riyadh, Saudi Arabia',
    rating: 4.6,
    userRatingCount: 28400
  },
  {
    id: 'riyadh-al-faisaliah',
    name: 'Al Faisaliah Tower',
    category: 'landmark',
    lat: 24.6901,
    lng: 46.6853,
    address: 'King Fahd Rd, Al Olaya, Riyadh, Saudi Arabia',
    rating: 4.5,
    userRatingCount: 15300
  },
  {
    id: 'riyadh-airport',
    name: 'King Khalid International Airport (RUH)',
    category: 'airport',
    lat: 24.9576,
    lng: 46.6988,
    address: 'Airport Road, Riyadh, Saudi Arabia',
    rating: 4.4,
    userRatingCount: 42100
  },
  {
    id: 'aerix-quantum-hub',
    name: 'AERIX Quantum Innovation Hub',
    category: 'tech',
    lat: 24.7258,
    lng: 46.6385,
    address: 'Digital City, Al Nakheel, Riyadh, Saudi Arabia',
    rating: 4.9,
    userRatingCount: 1250
  }
];

const LOCAL_STORAGE_SAVED_KEY = 'aerix_saved_places_v1';

export const mapsService = {
  defaultCenter: {
    lat: 24.7136,
    lng: 46.6753, // Riyadh center
    zoom: 12,
    label: 'Riyadh Central District'
  } as MapCoordinates,

  /**
   * Fetch saved places for current user from Firestore with fallback to LocalStorage
   */
  async getSavedPlaces(userId?: string): Promise<MapPlace[]> {
    const uid = userId || auth.currentUser?.uid;

    if (uid && db) {
      try {
        const placesRef = collection(db, 'users', uid, 'savedPlaces');
        const q = query(placesRef, orderBy('savedAt', 'desc'));
        const snapshot = await getDocs(q);

        if (!snapshot.empty) {
          const list: MapPlace[] = [];
          snapshot.forEach((d) => {
            const data = d.data();
            list.push({
              id: d.id,
              name: data.name || 'Saved Place',
              category: data.category || 'landmark',
              lat: Number(data.lat),
              lng: Number(data.lng),
              address: data.address || '',
              rating: data.rating ? Number(data.rating) : undefined,
              savedAt: data.savedAt
            });
          });
          return list;
        }
      } catch (err) {
        console.warn('Could not read Firestore saved places, falling back to local storage:', err);
      }
    }

    // Local storage fallback
    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
      if (raw) {
        return JSON.parse(raw);
      }
    } catch {
      // ignore
    }

    return DEFAULT_PLACES;
  },

  /**
   * Save a place to user's private Firestore collection
   */
  async savePlace(place: Omit<MapPlace, 'savedAt'>, userId?: string): Promise<MapPlace> {
    const uid = userId || auth.currentUser?.uid;
    const placeId = place.id.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 100) || `place_${Date.now()}`;
    const savedAt = new Date().toISOString();

    const savedPlace: MapPlace = {
      ...place,
      id: placeId,
      savedAt
    };

    if (uid && db) {
      try {
        const placeRef = doc(db, 'users', uid, 'savedPlaces', placeId);
        await setDoc(placeRef, sanitizeForFirestore({
          id: placeId,
          userId: uid,
          name: savedPlace.name,
          category: savedPlace.category || 'landmark',
          address: savedPlace.address || '',
          lat: savedPlace.lat,
          lng: savedPlace.lng,
          rating: savedPlace.rating || null,
          savedAt
        }));
      } catch (err) {
        handleFirestoreError(err, OperationType.CREATE, `users/${uid}/savedPlaces/${placeId}`);
      }
    }

    // Always mirror to localStorage for offline cache
    try {
      const current = await this.getSavedPlaces(uid);
      const updated = [savedPlace, ...current.filter((p) => p.id !== placeId)];
      localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }

    return savedPlace;
  },

  /**
   * Remove a saved place from user's private Firestore collection
   */
  async removeSavedPlace(placeId: string, userId?: string): Promise<void> {
    const uid = userId || auth.currentUser?.uid;

    if (uid && db) {
      try {
        const placeRef = doc(db, 'users', uid, 'savedPlaces', placeId);
        await deleteDoc(placeRef);
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `users/${uid}/savedPlaces/${placeId}`);
      }
    }

    try {
      const raw = localStorage.getItem(LOCAL_STORAGE_SAVED_KEY);
      if (raw) {
        const current: MapPlace[] = JSON.parse(raw);
        const filtered = current.filter((p) => p.id !== placeId);
        localStorage.setItem(LOCAL_STORAGE_SAVED_KEY, JSON.stringify(filtered));
      }
    } catch {
      // ignore
    }
  }
};
