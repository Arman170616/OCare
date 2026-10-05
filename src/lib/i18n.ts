// Minimal bilingual support: Arabic (default, RTL) and English.
// Components call tr('English', 'العربية'); switching language remounts the app
// (see LanguageRoot in App.tsx), so plain module state is enough here.

export type Lang = 'ar' | 'en';

const STORAGE_KEY = 'omancare-lang';
const listeners = new Set<(lang: Lang) => void>();

function loadLang(): Lang {
  try {
    return localStorage.getItem(STORAGE_KEY) === 'en' ? 'en' : 'ar';
  } catch {
    return 'ar';
  }
}

let current: Lang = loadLang();

function applyToDocument(lang: Lang) {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === 'ar' ? 'rtl' : 'ltr';
}

applyToDocument(current);

export function getLang(): Lang {
  return current;
}

export function isRtl(): boolean {
  return current === 'ar';
}

export function setLang(lang: Lang): void {
  if (lang === current) return;
  current = lang;
  try {
    localStorage.setItem(STORAGE_KEY, lang);
  } catch {
    // storage unavailable (private mode); language still applies for this session
  }
  applyToDocument(lang);
  listeners.forEach((fn) => fn(lang));
}

export function onLangChange(fn: (lang: Lang) => void): () => void {
  listeners.add(fn);
  return () => {
    listeners.delete(fn);
  };
}

/** Pick the string for the active language. */
export function tr(en: string, ar: string): string {
  return current === 'ar' ? ar : en;
}

/** Locale for number/date formatting. Western digits are kept in Arabic, as is common in Oman. */
export function locale(): string {
  return current === 'ar' ? 'ar-OM-u-nu-latn' : 'en-US';
}
