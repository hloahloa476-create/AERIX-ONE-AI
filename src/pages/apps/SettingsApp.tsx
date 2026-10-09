import React, { useState, useEffect } from 'react';
import {
  Settings,
  User,
  Shield,
  Sliders,
  Sparkles,
  Lock,
  ChevronLeft,
  X,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  LogOut,
  Camera,
  Key,
  Globe,
  Bell,
  MapPin,
  Trash2,
  Eye,
  EyeOff,
  Check,
  ShieldAlert,
  Smartphone,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useLanguage } from '../../contexts/LanguageContext';
import { userDataService, UserSettingsRecord } from '../../services/userDataService';
import { conversationService } from '../../services/conversationService';
import { soundEffects } from '../../utils/sound';

interface SettingsAppProps {
  onClose: () => void;
  onOpenLaterPhase?: (title: string, desc: string, feat?: string) => void;
}

type SettingsTab = 'account' | 'security' | 'preferences' | 'ai' | 'privacy';

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=150&auto=format&fit=crop&q=80',
];

export const SettingsApp: React.FC<SettingsAppProps> = ({ onClose }) => {
  const {
    currentUser,
    userProfile,
    signOutUser,
    updateProfileData,
    changePassword,
    deleteAccount
  } = useAuth();

  const { language, setLanguage, isRtl, t } = useLanguage();

  const userId = currentUser?.uid || 'guest-node';
  const [activeTab, setActiveTab] = useState<SettingsTab>('account');
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // --- ACCOUNT STATE ---
  const [displayName, setDisplayName] = useState(userProfile?.displayName || currentUser?.displayName || 'Commander Nova');
  const [photoURL, setPhotoURL] = useState(userProfile?.photoURL || currentUser?.photoURL || AVATAR_PRESETS[0]);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);

  // --- SECURITY STATE ---
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isChangingPass, setIsChangingPass] = useState(false);
  const [showDeleteAccountModal, setShowDeleteAccountModal] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  // --- PREFERENCES & AI & PRIVACY STATE ---
  const [settingsData, setSettingsData] = useState<UserSettingsRecord>({
    userId,
    language: language,
    theme: 'dark',
    notifications: true,
    aiLanguage: 'auto',
    saveHistory: true,
    conversationMemory: true,
    responseStyle: 'fast',
    locationPermission: 'unknown',
    updatedAt: new Date().toISOString()
  });

  const [showClearHistoryModal, setShowClearHistoryModal] = useState(false);
  const [showClearDataModal, setShowClearDataModal] = useState(false);
  const [isClearing, setIsClearing] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3000);
  };

  // Load user settings from Firestore / local
  useEffect(() => {
    userDataService.getSettings(userId).then((s) => {
      setSettingsData(s);
    });
  }, [userId]);

  // Save Account Profile
  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!displayName.trim()) return;
    setIsSavingProfile(true);
    soundEffects.playHapticClick();
    try {
      await updateProfileData({ displayName: displayName.trim(), photoURL });
      showToast(language === 'ar' ? 'تم تحديث الملف الشخصي بنجاح' : 'Profile updated successfully');
    } catch {
      showToast('Failed to update profile.');
    } finally {
      setIsSavingProfile(false);
    }
  };

  // Save New Password
  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 6) {
      showToast('Password must be at least 6 characters.');
      return;
    }
    if (newPassword !== confirmPassword) {
      showToast('Passwords do not match.');
      return;
    }

    setIsChangingPass(true);
    soundEffects.playHapticClick();
    try {
      await changePassword(newPassword);
      setNewPassword('');
      setConfirmPassword('');
      showToast(language === 'ar' ? 'تم تغيير كلمة المرور بنجاح' : 'Password updated successfully');
    } catch (err: any) {
      showToast(err.message || 'Failed to update password.');
    } finally {
      setIsChangingPass(false);
    }
  };

  // Update Settings field
  const handleUpdateSetting = async <K extends keyof UserSettingsRecord>(key: K, value: UserSettingsRecord[K]) => {
    soundEffects.playHapticClick();
    const updated = { ...settingsData, [key]: value };
    setSettingsData(updated);
    if (key === 'language') {
      setLanguage(value as 'en' | 'ar');
    }
    await userDataService.updateSettings(userId, { [key]: value });
    showToast(language === 'ar' ? 'تم حفظ التفضيل' : 'Preference saved');
  };

  // Delete All Chat History
  const handleClearChatHistory = async () => {
    setIsClearing(true);
    soundEffects.playHapticClick();
    try {
      await conversationService.clearAllConversations(userId);
      setShowClearHistoryModal(false);
      showToast(language === 'ar' ? 'تم مسح سجل المحادثات' : 'Chat history cleared');
    } catch {
      showToast('Failed to clear history.');
    } finally {
      setIsClearing(false);
    }
  };

  // Delete All Account Data
  const handleClearAccountData = async () => {
    setIsClearing(true);
    soundEffects.playHapticClick();
    try {
      await userDataService.deleteAllUserData(userId);
      setShowClearDataModal(false);
      showToast(language === 'ar' ? 'تم مسح جميع بيانات الحساب' : 'All account data deleted');
    } catch {
      showToast('Failed to delete account data.');
    } finally {
      setIsClearing(false);
    }
  };

  // Delete Entire Account
  const handleConfirmDeleteAccount = async () => {
    setIsDeletingAccount(true);
    soundEffects.playHapticClick();
    try {
      await deleteAccount();
      onClose();
    } catch (err: any) {
      showToast(err.message || 'Failed to delete account.');
    } finally {
      setIsDeletingAccount(false);
    }
  };

  const tabs: { id: SettingsTab; label: string; icon: React.ElementType }[] = [
    { id: 'account', label: t('settings.account', 'Account'), icon: User },
    { id: 'security', label: t('settings.security', 'Security'), icon: Shield },
    { id: 'preferences', label: t('settings.preferences', 'Preferences'), icon: Sliders },
    { id: 'ai', label: t('settings.aiSettings', 'AI Settings'), icon: Sparkles },
    { id: 'privacy', label: t('settings.privacy', 'Privacy'), icon: Lock },
  ];

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="fixed inset-0 z-50 bg-[#030712] text-slate-100 flex flex-col font-sans select-none overflow-hidden animate-fadeIn"
    >
      {/* Toast Alert */}
      {toastMessage && (
        <div className="absolute top-16 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-2xl bg-cyan-950/90 border border-cyan-500/50 text-cyan-200 text-xs shadow-2xl backdrop-blur-md font-mono flex items-center gap-2">
          <CheckCircle2 className="w-3.5 h-3.5 text-cyan-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Top Header */}
      <header className="h-14 px-4 bg-slate-900/90 border-b border-slate-800 flex items-center justify-between backdrop-blur-md shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              soundEffects.playHapticClick();
              onClose();
            }}
            className="w-8 h-8 rounded-xl aerix-glass border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Settings className="w-4 h-4" />
            </div>
            <div>
              <h1 className="text-sm font-bold font-display text-white">
                {t('settings.title', 'Account Settings')}
              </h1>
              <p className="text-[10px] font-mono text-slate-400">
                {currentUser?.email || 'guest-node@aerix'}
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onClose}
          className="w-8 h-8 rounded-xl aerix-glass border border-slate-800 flex items-center justify-center text-slate-400 hover:text-white transition-colors"
        >
          <X className="w-4 h-4" />
        </button>
      </header>

      {/* Section Tab Bar (Scrollable on mobile) */}
      <div className="px-4 py-2 border-b border-slate-800 bg-[#060a15] shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  soundEffects.playHapticClick();
                  setActiveTab(tab.id);
                }}
                className={`min-h-[36px] px-3.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20'
                    : 'aerix-glass border border-slate-800 text-slate-400 hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 overflow-y-auto no-scrollbar p-4 max-w-2xl mx-auto w-full space-y-6 pb-20">
        {/* 1. ACCOUNT SECTION */}
        {activeTab === 'account' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-5 rounded-3xl aerix-glass border border-slate-800 space-y-5">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <User className="w-4 h-4 text-cyan-400" />
                Profile Information
              </h3>

              {/* Avatar Changer */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <img
                    src={photoURL}
                    alt="User Avatar"
                    className="w-16 h-16 rounded-2xl object-cover border-2 border-cyan-500/50 shadow-lg"
                  />
                  <button
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-lg bg-cyan-500 text-slate-950 flex items-center justify-center shadow"
                    title="Change Avatar"
                  >
                    <Camera className="w-3 h-3" />
                  </button>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-white">{displayName}</h4>
                  <p className="text-xs text-slate-400 font-mono">{currentUser?.email || 'node@aerix.net'}</p>
                  <button
                    onClick={() => setShowAvatarPicker(!showAvatarPicker)}
                    className="text-[11px] text-cyan-400 hover:underline mt-1 block"
                  >
                    Change profile photo
                  </button>
                </div>
              </div>

              {/* Avatar Preset Grid */}
              {showAvatarPicker && (
                <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 space-y-2">
                  <span className="text-[10px] font-mono text-slate-400 block uppercase">
                    Choose Avatar Preset
                  </span>
                  <div className="flex items-center gap-2 overflow-x-auto">
                    {AVATAR_PRESETS.map((url, i) => (
                      <button
                        key={i}
                        onClick={() => {
                          setPhotoURL(url);
                          setShowAvatarPicker(false);
                        }}
                        className={`w-11 h-11 rounded-xl overflow-hidden border-2 transition-all ${
                          photoURL === url ? 'border-cyan-400 scale-105' : 'border-transparent opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={url} alt="Preset" className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Edit Name Form */}
              <form onSubmit={handleSaveProfile} className="space-y-4 pt-2">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Display Name
                  </label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    value={currentUser?.email || ''}
                    disabled
                    className="w-full px-3.5 py-2.5 bg-slate-950/80 border border-slate-850 rounded-xl text-xs text-slate-400 cursor-not-allowed"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Verified through AERIX Auth & Google Workspace OAuth.
                  </p>
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingProfile}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isSavingProfile && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* 2. SECURITY SECTION */}
        {activeTab === 'security' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Change Password */}
            <div className="p-5 rounded-3xl aerix-glass border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Key className="w-4 h-4 text-cyan-400" />
                Change Password
              </h3>

              <form onSubmit={handleChangePassword} className="space-y-3.5">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="••••••••"
                      required
                      minLength={6}
                      className="w-full pl-3.5 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                    >
                      {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Confirm New Password
                  </label>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>

                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isChangingPass || !newPassword}
                    className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all disabled:opacity-50"
                  >
                    {isChangingPass && <RefreshCw className="w-3.5 h-3.5 animate-spin" />}
                    Update Password
                  </button>
                </div>
              </form>
            </div>

            {/* Connected Sign-In Methods */}
            <div className="p-5 rounded-3xl aerix-glass border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Smartphone className="w-4 h-4 text-cyan-400" />
                Sign-In Methods
              </h3>

              <div className="space-y-2.5">
                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-white flex items-center justify-center text-slate-900">
                      <span className="font-bold text-xs">G</span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Google Account</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        {currentUser?.email || 'Connected'}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                    Active
                  </span>
                </div>

                <div className="p-3 rounded-2xl bg-slate-900/90 border border-slate-800 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-black border border-slate-700 flex items-center justify-center text-white">
                      <span className="font-bold text-xs"></span>
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Apple ID</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        Enabled with OAuth Provider
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-cyan-400 px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/30">
                    Available
                  </span>
                </div>
              </div>
            </div>

            {/* Session Management */}
            <div className="p-5 rounded-3xl aerix-glass border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <LogOut className="w-4 h-4 text-amber-400" />
                Device Session Management
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                Disconnect active session tokens across this client node.
              </p>

              <button
                onClick={() => {
                  soundEffects.playHapticClick();
                  signOutUser();
                  onClose();
                }}
                className="w-full py-2.5 rounded-2xl bg-amber-500/15 border border-amber-500/30 text-amber-300 font-bold text-xs hover:bg-amber-500/25 transition-all flex items-center justify-center gap-2"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out of All Devices
              </button>
            </div>

            {/* Danger Zone: Delete Account */}
            <div className="p-5 rounded-3xl bg-rose-950/20 border border-rose-500/30 space-y-3">
              <h3 className="text-sm font-bold font-display text-rose-300 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-rose-400" />
                Delete Account
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                Permanently purge your AERIX ONE account credentials and cloud storage. This action cannot be reversed.
              </p>

              <button
                onClick={() => setShowDeleteAccountModal(true)}
                className="py-2.5 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs flex items-center gap-1.5 transition-all shadow-lg shadow-rose-600/20"
              >
                <Trash2 className="w-3.5 h-3.5" />
                Delete Account
              </button>
            </div>
          </div>
        )}

        {/* 3. PREFERENCES SECTION */}
        {activeTab === 'preferences' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-5 rounded-3xl aerix-glass border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Globe className="w-4 h-4 text-cyan-400" />
                Language & Localization
              </h3>

              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => handleUpdateSetting('language', 'en')}
                  className={`p-3 rounded-2xl border text-left transition-all ${
                    language === 'en'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'aerix-glass border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white">English</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">LTR layout</div>
                </button>

                <button
                  onClick={() => handleUpdateSetting('language', 'ar')}
                  className={`p-3 rounded-2xl border text-right transition-all ${
                    language === 'ar'
                      ? 'bg-cyan-500/20 border-cyan-400 text-cyan-300'
                      : 'aerix-glass border-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  <div className="font-bold text-xs text-white">العربية (Arabic)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">RTL layout</div>
                </button>
              </div>
            </div>

            {/* Notifications */}
            <div className="p-5 rounded-3xl aerix-glass border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Bell className="w-4 h-4 text-cyan-400" />
                System Notifications & Sound
              </h3>

              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Auditory Haptic Chimes</div>
                  <div className="text-[10px] text-slate-400">Play feedback sounds on tap & action</div>
                </div>
                <input
                  type="checkbox"
                  checked={settingsData.notifications}
                  onChange={(e) => handleUpdateSetting('notifications', e.target.checked)}
                  className="w-5 h-5 accent-cyan-500 cursor-pointer"
                />
              </div>
            </div>

            {/* Location Permissions */}
            <div className="p-5 rounded-3xl aerix-glass border border-slate-800 space-y-3">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <MapPin className="w-4 h-4 text-cyan-400" />
                Location Permissions
              </h3>
              <p className="text-xs text-slate-400 leading-relaxed">
                AERIX ONE uses device location strictly for map centering and real-time navigation.
              </p>
              <div className="p-3 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                <span className="text-xs font-mono text-cyan-300">Device GPS Access</span>
                <span className="text-[10px] font-mono text-emerald-400 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/30">
                  Native GPS
                </span>
              </div>
            </div>
          </div>
        )}

        {/* 4. AI SETTINGS */}
        {activeTab === 'ai' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-5 rounded-3xl aerix-glass border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-cyan-400" />
                AI Assistant Engine
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Default AI Language
                  </label>
                  <select
                    value={settingsData.aiLanguage}
                    onChange={(e) => handleUpdateSetting('aiLanguage', e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="auto">Auto-Detect Language (Follows User)</option>
                    <option value="ar">العربية (Arabic Only)</option>
                    <option value="en">English (English Only)</option>
                  </select>
                </div>

                <div>
                  <label className="text-[11px] font-mono text-slate-400 block mb-1">
                    Response Style
                  </label>
                  <select
                    value={settingsData.responseStyle}
                    onChange={(e) => handleUpdateSetting('responseStyle', e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white focus:outline-none focus:border-cyan-500"
                  >
                    <option value="fast">Ultra Fast (Low latency, direct answer)</option>
                    <option value="creative">Creative & Rich Markdown</option>
                    <option value="analytical">Deep Analytical & Step-by-Step</option>
                  </select>
                </div>

                <div className="flex items-center justify-between pt-2">
                  <div>
                    <div className="text-xs font-semibold text-white">Save Conversation History</div>
                    <div className="text-[10px] text-slate-400">Keep persistent threads in Firestore</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsData.saveHistory}
                    onChange={(e) => handleUpdateSetting('saveHistory', e.target.checked)}
                    className="w-5 h-5 accent-cyan-500 cursor-pointer"
                  />
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Conversation Memory</div>
                    <div className="text-[10px] text-slate-400">Send prior turn context to the model</div>
                  </div>
                  <input
                    type="checkbox"
                    checked={settingsData.conversationMemory}
                    onChange={(e) => handleUpdateSetting('conversationMemory', e.target.checked)}
                    className="w-5 h-5 accent-cyan-500 cursor-pointer"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 5. PRIVACY SECTION */}
        {activeTab === 'privacy' && (
          <div className="space-y-6 animate-fadeIn">
            <div className="p-5 rounded-3xl aerix-glass border border-slate-800 space-y-4">
              <h3 className="text-sm font-bold font-display text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-cyan-400" />
                Data Privacy & Sandboxing
              </h3>

              <p className="text-xs text-slate-400 leading-relaxed">
                All personal data is linked to your User ID. Cloud Firestore access rules strictly forbid any other account from viewing your data.
              </p>

              <div className="space-y-3 pt-2">
                {/* Clear Conversation History */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">AI Conversation Archives</div>
                    <div className="text-[10px] text-slate-400">Delete all recorded conversation sessions</div>
                  </div>
                  <button
                    onClick={() => setShowClearHistoryModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all"
                  >
                    Delete History
                  </button>
                </div>

                {/* Delete Account Data */}
                <div className="p-3.5 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-between">
                  <div>
                    <div className="text-xs font-semibold text-white">Purge Account Data</div>
                    <div className="text-[10px] text-slate-400">Clear saved locations, settings, and cache</div>
                  </div>
                  <button
                    onClick={() => setShowClearDataModal(true)}
                    className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-rose-500/20 text-rose-300 text-xs font-semibold border border-rose-500/30 transition-all"
                  >
                    Delete Data
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* CONFIRMATION MODAL: DELETE CONVERSATION HISTORY */}
      {showClearHistoryModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl aerix-glass border border-rose-500/40 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Delete Conversation History?
            </h3>
            <p className="text-xs text-slate-300">
              Are you sure you want to delete all saved conversations? This cannot be undone.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearHistoryModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleClearChatHistory}
                disabled={isClearing}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
              >
                {isClearing && <RefreshCw className="w-3 h-3 animate-spin mr-1 inline" />}
                Confirm Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE ACCOUNT DATA */}
      {showClearDataModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl aerix-glass border border-rose-500/40 p-5 space-y-4 shadow-2xl">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-rose-400" />
              Purge Account Data?
            </h3>
            <p className="text-xs text-slate-300">
              This will erase all saved locations, app preferences, and local cache.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowClearDataModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleClearAccountData}
                disabled={isClearing}
                className="px-4 py-1.5 rounded-xl bg-rose-600 text-white font-bold text-xs"
              >
                {isClearing && <RefreshCw className="w-3 h-3 animate-spin mr-1 inline" />}
                Confirm Purge
              </button>
            </div>
          </div>
        </div>
      )}

      {/* CONFIRMATION MODAL: DELETE ENTIRE ACCOUNT */}
      {showDeleteAccountModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-sm rounded-3xl aerix-glass border border-rose-500/50 p-5 space-y-4 shadow-2xl">
            <div className="w-10 h-10 rounded-2xl bg-rose-500/20 text-rose-400 flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <h3 className="text-sm font-bold text-white">Permanently Delete Account?</h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              Your profile, saved waypoints, AI conversations, and permissions will be permanently eradicated.
            </p>
            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setShowDeleteAccountModal(false)}
                className="px-3.5 py-1.5 rounded-xl text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmDeleteAccount}
                disabled={isDeletingAccount}
                className="px-4 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-bold text-xs"
              >
                {isDeletingAccount && <RefreshCw className="w-3 h-3 animate-spin mr-1 inline" />}
                Permanently Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
