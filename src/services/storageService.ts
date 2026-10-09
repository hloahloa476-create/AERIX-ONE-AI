/**
 * AERIX ONE - Storage Service
 * Phase 1 uses IndexedDB/localStorage client sandbox.
 * Cloud sync bucket integration planned for Phase 2.
 */

export const storageService = {
  isCloudSyncEnabled: false,
  phase: 'Phase 1 - Client Sandbox',

  getItem<T>(key: string, defaultValue: T): T {
    try {
      const data = localStorage.getItem(`aerix_${key}`);
      return data ? JSON.parse(data) : defaultValue;
    } catch {
      return defaultValue;
    }
  },

  setItem<T>(key: string, value: T): void {
    try {
      localStorage.setItem(`aerix_${key}`, JSON.stringify(value));
    } catch (e) {
      console.warn('Storage quota exceeded or private mode error', e);
    }
  }
};
