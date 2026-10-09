/**
 * AERIX ONE - Authentication Service (Phase 1 Stub)
 * Provides local device session security. Multi-device cloud sync auth scheduled for Phase 2.
 */

export interface AerixUser {
  id: string;
  name: string;
  handle: string;
  avatar: string;
  securityTier: 'Level 1 Local Node' | 'Level 2 Biometric Verified';
  status: 'Online' | 'Offline';
}

export const authService = {
  currentUser: {
    id: 'usr_aerix_primary',
    name: 'Commander Nova',
    handle: '@nova.aerix',
    avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
    securityTier: 'Level 2 Biometric Verified',
    status: 'Online'
  } as AerixUser,

  getUser(): AerixUser {
    return this.currentUser;
  },

  updateProfile(updates: Partial<AerixUser>) {
    this.currentUser = { ...this.currentUser, ...updates };
    return this.currentUser;
  }
};
