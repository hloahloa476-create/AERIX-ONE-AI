import React, { useState } from 'react';
import {
  User,
  Mail,
  Shield,
  Clock,
  Calendar,
  Edit2,
  LogOut,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  Camera,
  ChevronLeft
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { soundEffects } from '../utils/sound';

interface ProfilePageProps {
  onClose: () => void;
}

export const ProfilePage: React.FC<ProfilePageProps> = ({ onClose }) => {
  const {
    currentUser,
    userProfile,
    signOutUser,
    updateProfileData,
    resendVerificationEmail,
    isOffline
  } = useAuth();

  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(userProfile?.displayName || currentUser?.displayName || 'Commander');
  const [bio, setBio] = useState(userProfile?.bio || 'AERIX ONE Operational Node Operator.');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || currentUser?.photoURL || '');
  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 2500);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    soundEffects.playHapticClick();
    setIsSaving(true);
    try {
      await updateProfileData({
        displayName: name.trim(),
        bio: bio.trim(),
        photoURL: photoURL.trim(),
      });
      setIsEditing(false);
      soundEffects.playSuccessBeep();
      showToast('Profile synchronized with secure cloud');
    } catch {
      showToast('Profile updated locally');
    } finally {
      setIsSaving(false);
    }
  };

  const handleSignOut = async () => {
    soundEffects.playHapticClick();
    try {
      await signOutUser();
      onClose();
    } catch {
      // error handled by context
    }
  };

  const handleResendVerification = async () => {
    soundEffects.playHapticClick();
    try {
      await resendVerificationEmail();
      soundEffects.playSuccessBeep();
      showToast('Verification email dispatched to inbox');
    } catch {
      showToast('Could not send verification email right now');
    }
  };

  const creationDate = currentUser?.metadata?.creationTime
    ? new Date(currentUser.metadata.creationTime).toLocaleDateString([], {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
      })
    : 'Oct 04, 2026';

  const lastSignIn = currentUser?.metadata?.lastSignInTime
    ? new Date(currentUser.metadata.lastSignInTime).toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
      })
    : 'Active Session';

  return (
    <div className="fixed inset-0 z-50 bg-[#040711] text-slate-100 flex flex-col overflow-hidden select-none">
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 text-xs shadow-2xl backdrop-blur-md font-mono flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <div className="p-3 aerix-glass border-b border-slate-800 flex items-center justify-between z-10 shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 mr-1"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <User className="w-4 h-4" />
          </div>
          <div>
            <h2 className="text-xs font-bold font-display text-white">
              AERIX PROFILE
            </h2>
            <span className="text-[10px] font-mono text-cyan-400">
              Account Node Dossier
            </span>
          </div>
        </div>

        <button
          onClick={onClose}
          className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800"
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      {/* Profile Content Body */}
      <div className="flex-1 overflow-y-auto p-4 max-w-md mx-auto w-full space-y-4">
        {/* Email Verification Banner if applicable */}
        {currentUser && !currentUser.emailVerified && !isOffline && (
          <div className="p-3.5 rounded-2xl bg-amber-950/40 border border-amber-500/40 text-xs text-amber-200 space-y-2">
            <div className="flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
              <span className="font-semibold text-white">Email Verification Required</span>
            </div>
            <p className="text-[11px] text-slate-300">
              Please verify your email address to enable high-tier cloud operations.
            </p>
            <button
              onClick={handleResendVerification}
              className="text-[11px] font-semibold text-cyan-400 hover:underline block"
            >
              Resend Verification Email →
            </button>
          </div>
        )}

        {/* Profile Card */}
        <div className="p-5 rounded-3xl aerix-glass border border-cyan-500/20 relative overflow-hidden text-center space-y-3">
          <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 rounded-full blur-2xl pointer-events-none" />

          {/* Profile Picture */}
          <div className="relative w-20 h-20 mx-auto">
            {userProfile?.photoURL || currentUser?.photoURL ? (
              <img
                src={userProfile?.photoURL || currentUser?.photoURL || ''}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover border-2 border-cyan-400 shadow-xl shadow-cyan-500/20"
              />
            ) : (
              <div className="w-20 h-20 rounded-full bg-gradient-to-tr from-cyan-600/30 to-blue-600/30 border-2 border-cyan-400 flex items-center justify-center font-bold text-2xl text-white shadow-xl shadow-cyan-500/20">
                {(userProfile?.displayName || currentUser?.displayName || currentUser?.email || 'CN').slice(0, 2).toUpperCase()}
              </div>
            )}
            <button
              onClick={() => setIsEditing(true)}
              className="absolute bottom-0 right-0 p-1.5 rounded-full bg-cyan-500 text-slate-950 shadow-md hover:bg-cyan-400 transition-colors"
              title="Edit Profile Avatar"
            >
              <Camera className="w-3.5 h-3.5" />
            </button>
          </div>

          <div>
            <div className="flex items-center justify-center gap-1.5">
              <h3 className="font-bold text-lg text-white">
                {userProfile?.displayName || currentUser?.displayName || 'Commander'}
              </h3>
              {currentUser?.emailVerified && (
                <span className="w-4 h-4 rounded-full bg-cyan-400 text-slate-950 flex items-center justify-center text-[10px] font-bold" title="Verified Account">
                  ✓
                </span>
              )}
            </div>
            <div className="text-xs text-slate-400 font-mono mt-0.5">
              {currentUser?.email || 'guest@aerix.local'}
            </div>
            <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-950/80 border border-cyan-800 mt-2 inline-block">
              {userProfile?.securityTier || 'Level 2 Biometric Verified'}
            </span>
          </div>

          <p className="text-xs text-slate-300 max-w-xs mx-auto leading-relaxed pt-1">
            {userProfile?.bio || 'AERIX ONE Operational Node Operator.'}
          </p>

          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto transition-colors"
          >
            <Edit2 className="w-3.5 h-3.5 text-cyan-400" />
            <span>Edit Profile</span>
          </button>
        </div>

        {/* Account Details Specs */}
        <div className="p-4 rounded-3xl aerix-glass border border-slate-800/80 space-y-3 text-xs">
          <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-wider block font-semibold">
            Account Specifications
          </span>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-slate-500" />
              Member Since
            </span>
            <span className="font-mono text-white font-medium">{creationDate}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-slate-500" />
              Last Authorization
            </span>
            <span className="font-mono text-white font-medium">{lastSignIn}</span>
          </div>

          <div className="flex items-center justify-between py-1.5 border-b border-slate-800/60">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-slate-500" />
              Email Status
            </span>
            <span className={`font-mono text-[11px] font-semibold ${
              currentUser?.emailVerified ? 'text-emerald-400' : 'text-amber-400'
            }`}>
              {currentUser?.emailVerified ? 'Verified' : 'Pending Verification'}
            </span>
          </div>

          <div className="flex items-center justify-between py-1.5">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5 text-slate-500" />
              Security Node ID
            </span>
            <span className="font-mono text-[10px] text-slate-400 truncate max-w-[150px]">
              {currentUser?.uid || 'local-guest-node'}
            </span>
          </div>
        </div>

        {/* Sign Out CTA */}
        <button
          onClick={handleSignOut}
          className="w-full py-3 bg-rose-950/30 hover:bg-rose-950/50 border border-rose-900/60 text-rose-300 font-bold rounded-2xl text-xs flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <LogOut className="w-4 h-4 text-rose-400" />
          <span>Sign Out of AERIX ONE</span>
        </button>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="absolute inset-0 z-50 bg-black/75 backdrop-blur-sm flex flex-col justify-end">
          <form
            onSubmit={handleSave}
            className="w-full max-w-md mx-auto bg-[#090d16] rounded-t-3xl border-t border-slate-800 p-5 space-y-3.5 shadow-2xl animate-in slide-in-from-bottom duration-200"
          >
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="font-bold text-xs text-white font-mono uppercase tracking-wider">
                Edit Profile Dossier
              </span>
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="p-1 text-slate-400 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase">
                Display Name
              </label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase">
                Profile Avatar Image URL (optional)
              </label>
              <input
                type="url"
                value={photoURL}
                onChange={(e) => setPhotoURL(e.target.value)}
                placeholder="https://..."
                className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
              />
            </div>

            <div>
              <label className="text-[10px] font-mono text-slate-400 uppercase">
                Bio Description
              </label>
              <textarea
                rows={3}
                value={bio}
                onChange={(e) => setBio(e.target.value)}
                className="w-full mt-1 p-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500 resize-none"
              />
            </div>

            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setIsEditing(false)}
                className="px-4 py-2 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSaving}
                className="px-5 py-2 rounded-xl bg-cyan-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-cyan-500/20"
              >
                {isSaving ? <RefreshCw className="w-3.5 h-3.5 animate-spin" /> : null}
                <span>Save Changes</span>
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
