import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import enTranslations from '../locales/en.json';
import mrTranslations from '../locales/mr.json';
import hiTranslations from '../locales/hi.json';

const STORAGE_KEY = 'agrorent_language';

export const SUPPORTED_LANGUAGES = [
  { code: 'en', label: 'English', nativeLabel: 'English', locale: 'en-IN' },
  { code: 'mr', label: 'Marathi', nativeLabel: 'मराठी', locale: 'mr-IN' },
  { code: 'hi', label: 'Hindi', nativeLabel: 'हिन्दी', locale: 'hi-IN' },
];

const TRANSLATIONS = {
  en: enTranslations,
  mr: mrTranslations,
  hi: hiTranslations,
};

const LOCALE_MAP = {
  en: 'en-IN',
  mr: 'mr-IN',
  hi: 'hi-IN',
};

const LanguageContext = createContext(null);

/**
 * Helper to traverse nested object by dot-delimited path (e.g. 'equipment.setAsPrimary')
 */
function getNestedTranslation(obj, path) {
  if (!obj || !path) return null;
  const parts = path.split('.');
  let current = obj;
  for (const part of parts) {
    if (current && typeof current === 'object' && part in current) {
      current = current[part];
    } else {
      return null;
    }
  }
  return typeof current === 'string' ? current : null;
}

/**
 * Helper to replace {param} tokens in template strings
 */
function interpolate(template, params) {
  if (!template || !params) return template;
  return template.replace(/\{([a-zA-Z0-9_]+)\}/g, (match, paramName) => {
    return paramName in params && params[paramName] !== undefined && params[paramName] !== null
      ? String(params[paramName])
      : match;
  });
}

export const LanguageProvider = ({ children }) => {
  // English is default for first-time visitors; restore from localStorage if present
  const [language, setLanguageState] = useState(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && (saved === 'en' || saved === 'mr' || saved === 'hi')) {
        return saved;
      }
    } catch (e) {
      // LocalStorage access restricted or unavailable
    }
    return 'en';
  });

  // Sync html lang attribute whenever language changes
  useEffect(() => {
    document.documentElement.lang = LOCALE_MAP[language] || 'en-IN';
  }, [language]);

  /**
   * Change current language, persist in localStorage, and update UI immediately
   */
  const changeLanguage = useCallback((newLang) => {
    if (!TRANSLATIONS[newLang]) {
      console.warn(`[i18n] Unsupported language requested: "${newLang}". Supported: en, mr, hi.`);
      return;
    }
    setLanguageState(newLang);
    try {
      localStorage.setItem(STORAGE_KEY, newLang);
    } catch (e) {
      console.error('[i18n] Failed to persist language to localStorage', e);
    }
  }, []);

  /**
   * Translation function `t(key, params)`
   * Resolves text for the active language with automatic fallback to English and parameter interpolation.
   */
  const t = useCallback(
    (key, params = null) => {
      if (!key) return '';

      // 1. Try active language
      const activeDict = TRANSLATIONS[language] || TRANSLATIONS.en;
      let text = getNestedTranslation(activeDict, key);

      // 2. Fall back to English if missing in active language
      if (text === null && language !== 'en') {
        if (import.meta.env.DEV) {
          console.warn(`[i18n] Missing translation for key "${key}" in language "${language}". Falling back to English.`);
        }
        text = getNestedTranslation(TRANSLATIONS.en, key);
      }

      // 3. Fallback when key is missing completely
      if (text === null) {
        if (import.meta.env.DEV) {
          console.warn(`[i18n] Translation key not found: "${key}"`);
        }
        // Avoid displaying raw keys like 'common.saveChanges'; return last part as human-readable fallback
        const segments = key.split('.');
        text = segments[segments.length - 1];
      }

      // 4. Interpolate dynamic values (e.g. {count}, {name})
      if (params) {
        text = interpolate(text, params);
      }

      return text;
    },
    [language]
  );

  /**
   * Locale-aware Indian Rupee Currency Formatter
   * Example: 1500 -> "₹1,500"
   */
  const formatCurrency = useCallback(
    (amount, options = {}) => {
      const num = Number(amount);
      if (isNaN(num)) return '₹0';
      const activeLocale = LOCALE_MAP[language] || 'en-IN';
      try {
        return new Intl.NumberFormat(activeLocale, {
          style: 'currency',
          currency: 'INR',
          maximumFractionDigits: options.maximumFractionDigits ?? 0,
          minimumFractionDigits: options.minimumFractionDigits ?? 0,
          ...options,
        }).format(num);
      } catch (e) {
        return `₹${num.toLocaleString('en-IN')}`;
      }
    },
    [language]
  );

  /**
   * Locale-aware Date Formatter
   */
  const formatDate = useCallback(
    (dateVal, options = {}) => {
      if (!dateVal) return 'N/A';
      try {
        const date = new Date(dateVal);
        if (isNaN(date.getTime())) return String(dateVal);
        const activeLocale = LOCALE_MAP[language] || 'en-IN';
        return date.toLocaleDateString(activeLocale, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          ...options,
        });
      } catch (e) {
        return String(dateVal);
      }
    },
    [language]
  );

  /**
   * Locale-aware Date + Time Formatter
   */
  const formatDateTime = useCallback(
    (dateVal, options = {}) => {
      if (!dateVal) return 'N/A';
      try {
        const date = new Date(dateVal);
        if (isNaN(date.getTime())) return String(dateVal);
        const activeLocale = LOCALE_MAP[language] || 'en-IN';
        return date.toLocaleString(activeLocale, {
          day: '2-digit',
          month: 'short',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
          ...options,
        });
      } catch (e) {
        return String(dateVal);
      }
    },
    [language]
  );

  /**
   * Locale-aware Number Formatter
   */
  const formatNumber = useCallback(
    (num) => {
      const n = Number(num);
      if (isNaN(n)) return '0';
      const activeLocale = LOCALE_MAP[language] || 'en-IN';
      return n.toLocaleString(activeLocale);
    },
    [language]
  );

  /**
   * Status Translation Helper
   * Preserves backend enum ('PENDING', 'APPROVED', 'REJECTED', 'CANCELLED', 'COMPLETED')
   * and translates only displayed labels.
   */
  const getBookingStatusLabel = useCallback(
    (status) => {
      if (!status) return '';
      const norm = String(status).toUpperCase();
      switch (norm) {
        case 'PENDING':
          return t('booking.statusPending');
        case 'APPROVED':
          return t('booking.statusApproved');
        case 'REJECTED':
          return t('booking.statusRejected');
        case 'CANCELLED':
          return t('booking.statusCancelled');
        case 'COMPLETED':
          return t('booking.statusCompleted');
        default:
          return status;
      }
    },
    [t]
  );

  /**
   * Category Translation Helper
   */
  const getCategoryLabel = useCallback(
    (cat) => {
      if (!cat) return '';
      const mapping = {
        'All Categories': 'categories.allCategories',
        Tractors: 'categories.tractors',
        Harvesters: 'categories.harvesters',
        Rotavators: 'categories.rotavators',
        'Seed Drills': 'categories.seedDrills',
        Cultivators: 'categories.cultivators',
        Sprayers: 'categories.sprayers',
        'Power Tillers': 'categories.powerTillers',
        'Other Machinery': 'categories.otherMachinery',
      };
      const key = mapping[cat];
      return key ? t(key) : cat;
    },
    [t]
  );

  const value = useMemo(
    () => ({
      language,
      locale: LOCALE_MAP[language] || 'en-IN',
      changeLanguage,
      setLanguage: changeLanguage,
      t,
      formatCurrency,
      formatDate,
      formatDateTime,
      formatNumber,
      getBookingStatusLabel,
      getCategoryLabel,
      supportedLanguages: SUPPORTED_LANGUAGES,
    }),
    [
      language,
      changeLanguage,
      t,
      formatCurrency,
      formatDate,
      formatDateTime,
      formatNumber,
      getBookingStatusLabel,
      getCategoryLabel,
    ]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};

// Aliased export for convenience
export const useTranslation = useLanguage;

export default LanguageContext;
