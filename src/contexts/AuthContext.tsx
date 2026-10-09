import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import {
  User,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  signInWithPopup,
  updateProfile as updateAuthProfile,
  updatePassword,
  deleteUser,
  OAuthProvider,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db, googleProvider, isFirebaseConfigured, handleFirestoreError, sanitizeForFirestore, OperationType } from '../services/firebase';
import { userDataService } from '../services/userDataService';
import { googleFormsService } from '../services/googleFormsService';

export interface UserProfile {
  userId: string;
  displayName: string;
  email: string;
  photoURL?: string;
  handle?: string;
  bio?: string;
  securityTier: string;
  createdAt: string;
  updatedAt: string;
}

interface AuthContextType {
  currentUser: User | null;
  userProfile: UserProfile | null;
  loading: boolean;
  isOffline: boolean;
  isConfigured: boolean;
  signInWithEmail: (email: string, pass: string) => Promise<void>;
  signUpWithEmail: (email: string, pass: string, name: string) => Promise<void>;
  signInWithGoogle: () => Promise<void>;
  signInWithApple: () => Promise<void>;
  signOutUser: () => Promise<void>;
  resetPassword: (email: string) => Promise<void>;
  changePassword: (newPass: string) => Promise<void>;
  deleteAccount: () => Promise<void>;
  resendVerificationEmail: () => Promise<void>;
  updateProfileData: (updates: Partial<UserProfile>) => Promise<void>;
  authError: string | null;
  clearAuthError: () => void;
  continueOfflineDemo: () => void;
  isOfflineDemoMode: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isOfflineDemoMode, setIsOfflineDemoMode] = useState(() => {
    try {
      return localStorage.getItem('aerix_guest_mode') === 'true';
    } catch {
      return false;
    }
  });

  const clearAuthError = () => setAuthError(null);

  // Monitor network connectivity
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Fetch or create user profile from Firestore
  const syncUserProfile = async (user: User) => {
    if (!isFirebaseConfigured || !navigator.onLine) {
      // Local fallback profile
      const cached = localStorage.getItem(`aerix_profile_${user.uid}`);
      if (cached) {
        setUserProfile(JSON.parse(cached));
      } else {
        const fallback: UserProfile = {
          userId: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Commander Nova',
          email: user.email || '',
          photoURL: user.photoURL || '',
          handle: `@${(user.displayName || user.email?.split('@')[0] || 'commander').toLowerCase().replace(/\s+/g, '')}`,
          securityTier: 'Level 2 Biometric Verified',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        setUserProfile(fallback);
      }
      return;
    }

    const userDocRef = doc(db, 'users', user.uid);
    try {
      const snap = await getDoc(userDocRef);
      if (snap.exists()) {
        const data = snap.data() as UserProfile;
        setUserProfile(data);
        localStorage.setItem(`aerix_profile_${user.uid}`, JSON.stringify(data));
      } else {
        // Initialize user document in Firestore
        const newProfile: UserProfile = {
          userId: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Commander Nova',
          email: user.email || '',
          photoURL: user.photoURL || '',
          handle: `@${(user.displayName || user.email?.split('@')[0] || 'commander').toLowerCase().replace(/\s+/g, '')}`,
          bio: 'AERIX ONE Operational Node Operator.',
          securityTier: 'Level 2 Biometric Verified',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        await setDoc(userDocRef, sanitizeForFirestore(newProfile));
        setUserProfile(newProfile);
        localStorage.setItem(`aerix_profile_${user.uid}`, JSON.stringify(newProfile));
      }
    } catch (err) {
      console.warn('Could not read user profile from cloud, falling back to local state:', err);
      const fallback: UserProfile = {
        userId: user.uid,
        displayName: user.displayName || user.email?.split('@')[0] || 'Commander Nova',
        email: user.email || '',
        photoURL: user.photoURL || '',
        handle: `@${(user.displayName || user.email?.split('@')[0] || 'commander').toLowerCase().replace(/\s+/g, '')}`,
        securityTier: 'Level 2 Biometric Verified',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      setUserProfile(fallback);
    }
  };

  // Auth state listener
  useEffect(() => {
    if (!isFirebaseConfigured) {
      setLoading(false);
      return;
    }

    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        setIsOfflineDemoMode(false);
        try {
          localStorage.removeItem('aerix_guest_mode');
        } catch {
          // ignore
        }
        await syncUserProfile(user);
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const translateError = (error: unknown): string => {
    const code = (error as { code?: string })?.code || '';
    switch (code) {
      case 'auth/invalid-email':
        return 'Please enter a valid email address.';
      case 'auth/user-not-found':
        return 'No account exists with this email. Please create an account first.';
      case 'auth/wrong-password':
        return 'Incorrect password. Please verify and try again.';
      case 'auth/invalid-credential':
        return 'Invalid credentials. Please double-check your email and password.';
      case 'auth/email-already-in-use':
        return 'This email address is already registered. Try signing in instead.';
      case 'auth/weak-password':
        return 'Password is too weak. Please use at least 6 characters.';
      case 'auth/network-request-failed':
        return 'Network connection failed. Please check your internet connection.';
      case 'auth/operation-not-allowed':
        return 'This authentication method is currently being initialized in the cloud.';
      case 'auth/popup-closed-by-user':
        return 'The sign-in popup window was closed before completion.';
      case 'auth/cancelled-popup-request':
        return 'Authentication request was replaced by another popup.';
      case 'auth/too-many-requests':
        return 'Access to this account has been temporarily disabled due to many failed login attempts. Try again later.';
      case 'auth/requires-recent-login':
        return 'Please log out and log back in to perform this sensitive security action.';
      default:
        return (error as Error)?.message || 'An error occurred during authentication.';
    }
  };

  const signInWithEmail = async (email: string, pass: string) => {
    setAuthError(null);
    try {
      await signInWithEmailAndPassword(auth, email.trim(), pass);
    } catch (err) {
      const msg = translateError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signUpWithEmail = async (email: string, pass: string, name: string) => {
    setAuthError(null);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), pass);
      if (name.trim()) {
        await updateAuthProfile(cred.user, { displayName: name.trim() });
      }
      try {
        await sendEmailVerification(cred.user);
      } catch (e) {
        console.warn('Could not send email verification immediately:', e);
      }
      await syncUserProfile(cred.user);
    } catch (err) {
      const msg = translateError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signInWithGoogle = async () => {
    setAuthError(null);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const credential = GoogleAuthProvider.credentialFromResult(result);
      if (credential?.accessToken) {
        googleFormsService.setAccessToken(credential.accessToken);
      }
      await syncUserProfile(result.user);
    } catch (err) {
      const msg = translateError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signInWithApple = async () => {
    setAuthError(null);
    try {
      const appleProvider = new OAuthProvider('apple.com');
      appleProvider.addScope('email');
      appleProvider.addScope('name');
      const result = await signInWithPopup(auth, appleProvider);
      await syncUserProfile(result.user);
    } catch (err: any) {
      console.warn('Apple sign in popup notice:', err);
      const msg = translateError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const signOutUser = async () => {
    setAuthError(null);
    try {
      await signOut(auth);
      googleFormsService.clearAccessToken();
      setCurrentUser(null);
      setUserProfile(null);
      setIsOfflineDemoMode(false);
      try {
        localStorage.removeItem('aerix_guest_mode');
      } catch {
        // ignore
      }
    } catch (err) {
      const msg = translateError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const resetPassword = async (email: string) => {
    setAuthError(null);
    try {
      await sendPasswordResetEmail(auth, email.trim());
    } catch (err) {
      const msg = translateError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const changePassword = async (newPass: string) => {
    if (!currentUser) throw new Error('No user is currently signed in.');
    setAuthError(null);
    try {
      await updatePassword(currentUser, newPass);
    } catch (err) {
      const msg = translateError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const deleteAccount = async () => {
    if (!currentUser) return;
    setAuthError(null);
    const uid = currentUser.uid;
    try {
      await userDataService.deleteAllUserData(uid);
      await deleteUser(currentUser);
      setCurrentUser(null);
      setUserProfile(null);
    } catch (err) {
      const msg = translateError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const resendVerificationEmail = async () => {
    if (!currentUser) return;
    try {
      await sendEmailVerification(currentUser);
    } catch (err) {
      const msg = translateError(err);
      setAuthError(msg);
      throw new Error(msg);
    }
  };

  const updateProfileData = async (updates: Partial<UserProfile>) => {
    if (!currentUser) return;
    const userDocRef = doc(db, 'users', currentUser.uid);
    const updated = {
      ...userProfile,
      ...updates,
      updatedAt: new Date().toISOString(),
    } as UserProfile;

    try {
      if (updates.displayName && currentUser) {
        await updateAuthProfile(currentUser, { displayName: updates.displayName });
      }
      if (updates.photoURL && currentUser) {
        await updateAuthProfile(currentUser, { photoURL: updates.photoURL });
      }
      if (isFirebaseConfigured && navigator.onLine) {
        await updateDoc(userDocRef, sanitizeForFirestore({ ...updates, updatedAt: new Date().toISOString() }));
      }
      setUserProfile(updated);
      localStorage.setItem(`aerix_profile_${currentUser.uid}`, JSON.stringify(updated));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${currentUser.uid}`);
    }
  };

  const continueOfflineDemo = () => {
    setIsOfflineDemoMode(true);
    try {
      localStorage.setItem('aerix_guest_mode', 'true');
    } catch {
      // ignore
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isOffline,
        isConfigured: isFirebaseConfigured,
        signInWithEmail,
        signUpWithEmail,
        signInWithGoogle,
        signInWithApple,
        signOutUser,
        resetPassword,
        changePassword,
        deleteAccount,
        resendVerificationEmail,
        updateProfileData,
        authError,
        clearAuthError,
        continueOfflineDemo,
        isOfflineDemoMode,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
