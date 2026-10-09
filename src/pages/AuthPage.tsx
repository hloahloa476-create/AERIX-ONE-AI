import React, { useState } from 'react';
import {
  Cpu,
  Mail,
  Lock,
  User,
  ArrowRight,
  AlertCircle,
  CheckCircle2,
  Eye,
  EyeOff,
  WifiOff,
  Sparkles,
  RefreshCw,
  ShieldCheck,
  Languages
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useLanguage } from '../contexts/LanguageContext';
import { soundEffects } from '../utils/sound';

export const AuthPage: React.FC = () => {
  const {
    signInWithEmail,
    signUpWithEmail,
    signInWithGoogle,
    signInWithApple,
    resetPassword,
    authError,
    clearAuthError,
    isOffline,
    isConfigured,
    continueOfflineDemo
  } = useAuth();

  const { language, setLanguage, isRtl } = useLanguage();

  const [mode, setMode] = useState<'signin' | 'signup' | 'forgot'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProvider, setLoadingProvider] = useState<'google' | 'apple' | 'email' | null>(null);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    clearAuthError();
    setSuccessNotice(null);
    soundEffects.playHapticClick();

    if (!email.trim()) return;

    if (mode === 'signup') {
      if (password !== confirmPassword) {
        soundEffects.playTone(200, 0.2);
        return;
      }
      if (password.length < 6) {
        soundEffects.playTone(200, 0.2);
        return;
      }
      setIsLoading(true);
      setLoadingProvider('email');
      try {
        await signUpWithEmail(email, password, displayName);
        soundEffects.playSuccessBeep();
      } catch {
        // error handled by context
      } finally {
        setIsLoading(false);
        setLoadingProvider(null);
      }
    } else if (mode === 'signin') {
      setIsLoading(true);
      setLoadingProvider('email');
      try {
        await signInWithEmail(email, password);
        soundEffects.playSuccessBeep();
      } catch {
        // error handled by context
      } finally {
        setIsLoading(false);
        setLoadingProvider(null);
      }
    } else if (mode === 'forgot') {
      setIsLoading(true);
      setLoadingProvider('email');
      try {
        await resetPassword(email);
        soundEffects.playSuccessBeep();
        setSuccessNotice(
          language === 'ar'
            ? 'تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.'
            : 'A secure password reset link has been dispatched to your email.'
        );
      } catch {
        // error handled by context
      } finally {
        setIsLoading(false);
        setLoadingProvider(null);
      }
    }
  };

  const handleGoogleSignIn = async () => {
    clearAuthError();
    soundEffects.playHapticClick();
    setIsLoading(true);
    setLoadingProvider('google');
    try {
      await signInWithGoogle();
      soundEffects.playSuccessBeep();
    } catch {
      // error handled by context
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  const handleAppleSignIn = async () => {
    clearAuthError();
    soundEffects.playHapticClick();
    setIsLoading(true);
    setLoadingProvider('apple');
    try {
      await signInWithApple();
      soundEffects.playSuccessBeep();
    } catch {
      // error handled by context
    } finally {
      setIsLoading(false);
      setLoadingProvider(null);
    }
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="min-h-screen bg-[#030712] text-slate-100 flex flex-col items-center justify-center p-4 relative overflow-hidden font-sans select-none"
    >
      {/* Background Cyber Ambient Glows */}
      <div className="absolute top-1/4 -left-20 w-80 h-80 bg-cyan-500/10 rounded-full blur-[100px] pointer-events-none" />
      <div className="absolute bottom-1/4 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[100px] pointer-events-none" />

      {/* Language Switcher in top corner */}
      <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 p-1 rounded-2xl aerix-glass border border-slate-800">
        <button
          onClick={() => {
            soundEffects.playHapticClick();
            setLanguage(language === 'en' ? 'ar' : 'en');
          }}
          className="px-3 py-1 rounded-xl text-xs font-mono text-cyan-400 hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <Languages className="w-3.5 h-3.5" />
          <span>{language === 'en' ? 'العربية' : 'English'}</span>
        </button>
      </div>

      <div className="w-full max-w-md relative z-10 space-y-6 my-auto">
        {/* Brand Header */}
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-tr from-cyan-500/20 to-blue-500/20 border border-cyan-500/40 text-cyan-400 shadow-xl shadow-cyan-500/10 mb-1">
            <Cpu className="w-7 h-7" />
          </div>
          <h1 className="text-2xl font-bold font-display tracking-tight text-white">
            {language === 'ar' ? 'أيريكس ون' : 'AERIX ONE'}
          </h1>
          <p className="text-xs text-slate-400 max-w-xs mx-auto">
            {language === 'ar'
              ? 'نظام تشغيل ذكي وموحد. قم بتسجيل الدخول للوصول إلى بياناتك الشخصية.'
              : 'Everything. One Intelligence. Sign in to access your secure neural node.'}
          </p>
        </div>

        {/* Offline notice if disconnected */}
        {isOffline && (
          <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-amber-300">
            <WifiOff className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {language === 'ar'
                ? 'الجهاز غير متصل بالإنترنت. يمكنك المتابعة في وضع المعاينة التجريبي.'
                : 'Device is offline. You can continue with the local offline guest profile.'}
            </span>
          </div>
        )}

        {/* Error notification banner */}
        {authError && (
          <div className="p-3.5 bg-rose-500/10 border border-rose-500/30 rounded-2xl flex items-start gap-3 text-xs text-rose-300 animate-shake">
            <AlertCircle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="font-semibold block mb-0.5">
                {language === 'ar' ? 'تنبيه المصادقة' : 'Authentication Notice'}
              </span>
              <span>{authError}</span>
            </div>
            <button
              onClick={clearAuthError}
              className="text-rose-400 hover:text-rose-200 text-xs px-1"
            >
              ✕
            </button>
          </div>
        )}

        {/* Success Notice */}
        {successNotice && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl flex items-center gap-2.5 text-xs text-emerald-300">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{successNotice}</span>
          </div>
        )}

        {/* Main Card */}
        <div className="aerix-glass-card rounded-3xl p-6 border border-slate-800 shadow-2xl backdrop-blur-xl space-y-5">
          {/* Mode Switcher Tabs */}
          <div className="grid grid-cols-2 p-1 bg-slate-900/90 rounded-2xl border border-slate-800">
            <button
              type="button"
              onClick={() => {
                soundEffects.playHapticClick();
                setMode('signin');
                clearAuthError();
                setSuccessNotice(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                mode === 'signin'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'تسجيل الدخول' : 'Sign In'}
            </button>

            <button
              type="button"
              onClick={() => {
                soundEffects.playHapticClick();
                setMode('signup');
                clearAuthError();
                setSuccessNotice(null);
              }}
              className={`py-2 text-xs font-semibold rounded-xl transition-all ${
                mode === 'signup'
                  ? 'bg-cyan-500 text-slate-950 font-bold shadow'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              {language === 'ar' ? 'إنشاء حساب' : 'Create Account'}
            </button>
          </div>

          {/* Social Logins: Google & Apple */}
          <div className="space-y-2.5">
            {/* Continue with Google */}
            <button
              type="button"
              onClick={handleGoogleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-white text-slate-900 font-semibold rounded-2xl shadow-sm hover:bg-slate-100 active:scale-98 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-xs"
            >
              {loadingProvider === 'google' ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-900" />
              ) : (
                <svg className="w-4 h-4" viewBox="0 0 48 48">
                  <path
                    fill="#EA4335"
                    d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z"
                  />
                  <path
                    fill="#4285F4"
                    d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z"
                  />
                  <path
                    fill="#FBBC05"
                    d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z"
                  />
                  <path
                    fill="#34A853"
                    d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"
                  />
                </svg>
              )}
              <span>{language === 'ar' ? 'المتابعة مع Google' : 'Continue with Google'}</span>
            </button>

            {/* Continue with Apple */}
            <button
              type="button"
              onClick={handleAppleSignIn}
              disabled={isLoading}
              className="w-full py-2.5 px-4 bg-black border border-slate-700 text-white font-semibold rounded-2xl shadow-sm hover:bg-slate-900 active:scale-98 transition-all flex items-center justify-center gap-3 disabled:opacity-50 text-xs"
            >
              {loadingProvider === 'apple' ? (
                <RefreshCw className="w-4 h-4 animate-spin text-white" />
              ) : (
                <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                  <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.6-7.71-11.7-14-6.3-9.68-11.16-20.59-14.59-32.74-3.43-12.16-5.15-23.77-5.15-34.84 0-14.57 3.59-26.68 10.77-36.33 7.18-9.65 16.34-14.57 27.49-14.77 5.11 0 10.74 1.25 16.89 3.76 6.15 2.51 10.05 3.82 11.71 3.93 2.18-.21 6.28-1.58 12.31-4.11 6.03-2.53 11.45-3.7 16.27-3.52 12.31.63 22.37 5.24 30.17 13.84-10.77 6.53-16.05 15.53-15.84 27 0 10.15 3.93 18.73 11.79 25.75 3.93 3.59 8.39 6.28 13.38 8.08-2.61 7.74-5.66 15.34-9.15 22.8zM119.22 33.02c0-7.08 2.51-13.72 7.53-19.92 5.02-6.2 11.22-10.35 18.6-12.45-.63 6.97-3.24 13.56-7.83 19.78-4.59 6.22-10.7 10.45-18.3 12.59z" />
                </svg>
              )}
              <span>{language === 'ar' ? 'المتابعة مع Apple' : 'Continue with Apple'}</span>
            </button>
          </div>

          <div className="relative flex items-center justify-center">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-[#0b101e] px-3 text-[10px] font-mono text-slate-500 uppercase tracking-widest absolute">
              {language === 'ar' ? 'أو عبر البريد' : 'or with email'}
            </span>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-3.5">
            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  {language === 'ar' ? 'الاسم المعروض' : 'Display Name'}
                </label>
                <div className="relative">
                  <User className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder={language === 'ar' ? 'مثال: القائد علي' : 'e.g. Commander Nova'}
                    required
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="text-[11px] font-mono text-slate-400 block mb-1">
                {language === 'ar' ? 'البريد الإلكتروني' : 'Email Address'}
              </label>
              <div className="relative">
                <Mail className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="node@aerix.net"
                  required
                  className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                />
              </div>
            </div>

            {mode !== 'forgot' && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-[11px] font-mono text-slate-400">
                    {language === 'ar' ? 'كلمة المرور' : 'Password'}
                  </label>
                  {mode === 'signin' && (
                    <button
                      type="button"
                      onClick={() => {
                        soundEffects.playHapticClick();
                        setMode('forgot');
                        clearAuthError();
                      }}
                      className="text-[10px] text-cyan-400 hover:underline"
                    >
                      {language === 'ar' ? 'نسيت كلمة المرور؟' : 'Forgot Password?'}
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>
            )}

            {mode === 'signup' && (
              <div>
                <label className="text-[11px] font-mono text-slate-400 block mb-1">
                  {language === 'ar' ? 'تأكيد كلمة المرور' : 'Confirm Password'}
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    required
                    minLength={6}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-900 border border-slate-800 rounded-2xl text-xs text-white placeholder-slate-500 focus:outline-none focus:border-cyan-500"
                  />
                </div>
              </div>
            )}

            <button
              type="submit"
              disabled={isLoading}
              className="w-full py-3 bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-slate-950 font-bold rounded-2xl shadow-lg shadow-cyan-500/20 active:scale-98 transition-all flex items-center justify-center gap-2 disabled:opacity-50 text-xs"
            >
              {isLoading && loadingProvider === 'email' ? (
                <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              ) : (
                <ArrowRight className="w-4 h-4" />
              )}
              <span>
                {mode === 'signin'
                  ? language === 'ar' ? 'تسجيل الدخول' : 'Sign In with Email'
                  : mode === 'signup'
                  ? language === 'ar' ? 'إنشاء حساب جديد' : 'Create My Account'
                  : language === 'ar' ? 'إرسال رابط إعادة التعيين' : 'Send Reset Link'}
              </span>
            </button>

            {mode === 'forgot' && (
              <button
                type="button"
                onClick={() => setMode('signin')}
                className="w-full text-center text-xs text-slate-400 hover:text-white py-1"
              >
                {language === 'ar' ? '← العودة لتسجيل الدخول' : '← Back to Sign In'}
              </button>
            )}
          </form>

          {/* Guest Sandbox mode */}
          <div className="pt-2 border-t border-slate-850 text-center">
            <button
              type="button"
              onClick={() => {
                soundEffects.playHapticClick();
                continueOfflineDemo();
              }}
              className="text-[11px] font-mono text-slate-400 hover:text-cyan-400 transition-colors"
            >
              {language === 'ar'
                ? 'متابعة كضيف محلي (وضع المعاينة)'
                : 'Continue as Local Guest (Preview Mode)'}
            </button>
          </div>
        </div>

        <div className="text-center text-[10px] font-mono text-slate-500 flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-cyan-400" />
          <span>AERIX Secure Identity & Zero-Knowledge Architecture</span>
        </div>
      </div>
    </div>
  );
};
