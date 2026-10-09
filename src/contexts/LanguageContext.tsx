import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

export type SupportedLanguage = 'en' | 'ar';

interface LanguageContextType {
  language: SupportedLanguage;
  setLanguage: (lang: SupportedLanguage) => void;
  isRtl: boolean;
  t: (key: string, defaultText?: string) => string;
}

const translations: Record<string, { en: string; ar: string }> = {
  // Navigation & General
  'nav.home': { en: 'Home', ar: 'الرئيسية' },
  'nav.ai': { en: 'AI', ar: 'الذكاء الاصطناعي' },
  'nav.maps': { en: 'Maps', ar: 'الخرائط' },
  'nav.shorts': { en: 'Shorts', ar: 'فيديوهات قصيرة' },
  'nav.apps': { en: 'Apps', ar: 'التطبيقات' },
  'app.name': { en: 'AERIX ONE', ar: 'أيريكس ون' },

  // Maps
  'maps.useCurrentLocation': { en: 'Use My Current Location', ar: 'استخدام موقعي الحالي' },
  'maps.searchLocation': { en: 'Search Location', ar: 'البحث عن موقع' },
  'maps.searchPlaceholder': { en: 'Search city, address, place or destination...', ar: 'ابحث عن مدينة، عنوان، مكان أو وجهة...' },
  'maps.state.requested': { en: 'Location permission requested', ar: 'تم طلب إذن الموقع' },
  'maps.state.granted': { en: 'Location permission granted', ar: 'تم منح إذن الموقع' },
  'maps.state.denied': { en: 'Location permission denied', ar: 'تم رفض إذن الموقع' },
  'maps.state.unavailable': { en: 'Location unavailable', ar: 'الموقع غير متاح' },
  'maps.state.loading': { en: 'GPS loading...', ar: 'جارٍ تحديد الموقع بالـ GPS...' },
  'maps.state.searching': { en: 'Searching location...', ar: 'جارٍ البحث عن الموقع...' },
  'maps.state.selected': { en: 'Location selected', ar: 'تم تحديد الموقع' },
  'maps.deniedExplanation': {
    en: 'Location access is currently blocked. To enable, open your device or browser settings, select Site Settings > Location, and allow AERIX ONE.',
    ar: 'الوصول إلى الموقع محظور حالياً. للتفعيل، افتح إعدادات المتصفح أو الجهاز، اختر إعدادات الموقع، واسمح لـ AERIX ONE.'
  },

  // AI Assistant
  'ai.newChat': { en: 'New Chat', ar: 'محادثة جديدة' },
  'ai.chatHistory': { en: 'Chat History', ar: 'سجل المحادثات' },
  'ai.renameChat': { en: 'Rename Conversation', ar: 'إعادة تسمية المحادثة' },
  'ai.deleteChat': { en: 'Delete Conversation', ar: 'حذف المحادثة' },
  'ai.searchChats': { en: 'Search Conversations', ar: 'البحث في المحادثات' },
  'ai.stopGenerating': { en: 'Stop Generating', ar: 'إيقاف التوليد' },
  'ai.placeholder': { en: 'Ask AERIX AI anything in Arabic or English...', ar: 'اسأل ذكاء أيريكس أي شيء بالعربية أو الإنجليزية...' },

  // Settings
  'settings.title': { en: 'Account Settings', ar: 'إعدادات الحساب' },
  'settings.account': { en: 'Account', ar: 'الحساب' },
  'settings.security': { en: 'Security', ar: 'الأمان' },
  'settings.preferences': { en: 'Preferences', ar: 'التفضيلات' },
  'settings.aiSettings': { en: 'AI Settings', ar: 'إعدادات الذكاء الاصطناعي' },
  'settings.privacy': { en: 'Privacy', ar: 'الخصوصية' },
  'settings.language': { en: 'Language', ar: 'اللغة' },
  'settings.arabic': { en: 'العربية (Arabic)', ar: 'العربية' },
  'settings.english': { en: 'English', ar: 'الإنجليزية' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<SupportedLanguage>(() => {
    try {
      const saved = localStorage.getItem('aerix_user_language');
      if (saved === 'ar' || saved === 'en') return saved;
      // Auto-detect browser language
      return navigator.language.startsWith('ar') ? 'ar' : 'en';
    } catch {
      return 'en';
    }
  });

  const isRtl = language === 'ar';

  useEffect(() => {
    try {
      localStorage.setItem('aerix_user_language', language);
    } catch {
      // ignore
    }
    // Update html dir attribute
    document.documentElement.dir = isRtl ? 'rtl' : 'ltr';
    document.documentElement.lang = language;
  }, [language, isRtl]);

  const setLanguage = (lang: SupportedLanguage) => {
    setLanguageState(lang);
  };

  const t = (key: string, defaultText?: string): string => {
    const item = translations[key];
    if (item && item[language]) {
      return item[language];
    }
    return defaultText || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, isRtl, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = (): LanguageContextType => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
