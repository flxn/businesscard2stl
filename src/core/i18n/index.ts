import { createI18n } from 'vue-i18n';
import siteConfig from '@/site.config';
import {
  defaultLocale, isLocale, localePath, locales, messages, type Locale,
} from './messages';

export { locales, localePath, type Locale };

const LOCALE_KEY = 'locale';

/**
 * Every language has its own URL (/ and /de/), so search engines can index each one.
 * A language in the path always wins; at the root, a remembered choice or the browser language is used.
 */
const detectLocale = (): Locale => {
  const fromPath = window.location.pathname.split('/')[1];
  if (isLocale(fromPath) && fromPath !== defaultLocale) {
    return fromPath;
  }
  try {
    const stored = window.localStorage.getItem(LOCALE_KEY);
    if (isLocale(stored)) {
      return stored;
    }
  } catch {
    // storage unavailable
  }
  return navigator.languages.map((language) => language.slice(0, 2).toLowerCase()).find(isLocale) ?? defaultLocale;
};

/** Keeps URL, document language, title and canonical link in line with the shown language. */
const applyLocaleToDocument = (locale: Locale) => {
  const path = localePath(locale);
  if (window.location.pathname !== path) {
    window.history.replaceState(window.history.state, '', `${path}${window.location.search}${window.location.hash}`);
  }
  const { seo } = messages[locale];
  document.documentElement.setAttribute('lang', locale);
  document.title = seo.title;
  document.querySelector('meta[name="description"]')?.setAttribute('content', seo.description);
  document.querySelector('link[rel="canonical"]')?.setAttribute('href', new URL(path, siteConfig.url).href);
};

const initialLocale = detectLocale();
applyLocaleToDocument(initialLocale);

export const i18n = createI18n({
  legacy: false,
  locale: initialLocale,
  fallbackLocale: defaultLocale,
  messages,
});

export const setLocale = (locale: Locale) => {
  i18n.global.locale.value = locale;
  applyLocaleToDocument(locale);
  try {
    window.localStorage.setItem(LOCALE_KEY, locale);
  } catch {
    // storage unavailable: the language applies for this session
  }
};
