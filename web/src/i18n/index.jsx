import { createContext, Fragment, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import id from './locales/id';
import en from './locales/en';

/**
 * Sistem i18n ringan untuk web Dadi Mulyo (React Context, tanpa library eksternal).
 *
 * - Locale default: 'id' (Bahasa Indonesia) — juga menjadi fallback jika key tidak ditemukan.
 * - Locale tersimpan di localStorage sehingga bertahan saat pindah halaman / refresh browser.
 * - t(key, params): lookup key dengan dot notation ("nav.home"), dukung interpolasi {param}.
 */

const DICTIONARIES = { id, en };

export const SUPPORTED_LOCALES = ['id', 'en'];
export const DEFAULT_LOCALE = 'id';

const STORAGE_KEY = 'dm_locale';

function detectInitialLocale() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved && SUPPORTED_LOCALES.includes(saved)) return saved;
  } catch {
    // localStorage tidak tersedia — gunakan default.
  }
  return DEFAULT_LOCALE;
}

function resolve(dictionary, path) {
  return path.split('.').reduce((acc, part) => (acc == null ? undefined : acc[part]), dictionary);
}

const I18nContext = createContext(null);

export function I18nProvider({ children }) {
  const [locale, setLocaleState] = useState(detectInitialLocale);

  // Sinkronkan atribut lang pada <html> (SEO & aksesibilitas).
  useEffect(() => {
    document.documentElement.lang = locale;
  }, [locale]);

  const setLocale = useCallback((next) => {
    if (!SUPPORTED_LOCALES.includes(next)) return;
    setLocaleState(next);
    try {
      localStorage.setItem(STORAGE_KEY, next);
    } catch {
      // Abaikan jika penyimpanan tidak tersedia.
    }
  }, []);

  const t = useCallback(
    (key, params) => {
      let value = resolve(DICTIONARIES[locale], key);
      // Fallback selalu ke Bahasa Indonesia (locale default), lalu ke key itu sendiri.
      if (value == null) value = resolve(DICTIONARIES[DEFAULT_LOCALE], key);
      if (value == null) return key;
      if (params && typeof value === 'string') {
        const containsNode = Object.values(params).some(
          (v) => v != null && typeof v === 'object'
        );
        if (!containsNode) {
          // Interpolasi string biasa: "Halo, {name}!"
          return value.replace(/\{(\w+)\}/g, (match, name) =>
            params[name] != null ? String(params[name]) : match
          );
        }
        // Interpolasi dengan React node (mis. <span>email</span>):
        // hasil berupa array [string, node, string, ...] agar styling tetap terjaga.
        const parts = [];
        const regex = /\{(\w+)\}/g;
        let lastIndex = 0;
        let match;
        while ((match = regex.exec(value)) !== null) {
          if (match.index > lastIndex) parts.push(value.slice(lastIndex, match.index));
          const name = match[1];
          parts.push(params[name] != null ? params[name] : match[0]);
          lastIndex = match.index + match[0].length;
        }
        if (lastIndex < value.length) parts.push(value.slice(lastIndex));
        return parts.map((part, i) => <Fragment key={i}>{part}</Fragment>);
      }
      return value;
    },
    [locale]
  );

  // Locale untuk toLocaleDateString/toLocaleString.
  const dateLocale = locale === 'en' ? 'en-GB' : 'id-ID';

  const value = useMemo(
    () => ({ locale, setLocale, t, dateLocale, supported: SUPPORTED_LOCALES, defaultLocale: DEFAULT_LOCALE }),
    [locale, setLocale, t]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}

export function useI18n() {
  const ctx = useContext(I18nContext);
  if (!ctx) throw new Error('useI18n must be used inside I18nProvider');
  return ctx;
}
