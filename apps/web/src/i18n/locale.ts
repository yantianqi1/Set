export const SUPPORTED_LOCALES = ["en", "zh-CN", "zh-TW", "ja"] as const;

export type LocaleCode = (typeof SUPPORTED_LOCALES)[number];

export const DEFAULT_LOCALE: LocaleCode = "zh-CN";
export const LOCALE_STORAGE_KEY = "image-set-locale";

export const LOCALE_NATIVE_LABELS: Record<LocaleCode, string> = {
  en: "English",
  "zh-CN": "简体中文",
  "zh-TW": "繁體中文",
  ja: "日本語"
};

const TRADITIONAL_CHINESE_HINTS = ["zh-tw", "zh-hk", "zh-mo", "hant"];
const DATE_TIME_OPTIONS = { dateStyle: "medium", timeStyle: "short" } as const;
const TIME_OPTIONS = { timeStyle: "medium" } as const;

export function isLocaleCode(value: string | null | undefined): value is LocaleCode {
  return typeof value === "string" && SUPPORTED_LOCALES.includes(value as LocaleCode);
}

export function resolveBrowserLocale(language?: string | null): LocaleCode {
  const normalized = language?.trim().toLowerCase();

  if (!normalized) {
    return DEFAULT_LOCALE;
  }

  if (normalized.startsWith("en")) {
    return "en";
  }

  if (normalized.startsWith("ja")) {
    return "ja";
  }

  if (normalized.startsWith("zh")) {
    return TRADITIONAL_CHINESE_HINTS.some((hint) => normalized.includes(hint))
      ? "zh-TW"
      : "zh-CN";
  }

  return DEFAULT_LOCALE;
}

export function resolveInitialLocale(
  savedLocale?: string | null,
  browserLanguage?: string | null
): LocaleCode {
  if (isLocaleCode(savedLocale)) {
    return savedLocale;
  }

  return resolveBrowserLocale(browserLanguage);
}

function getStorage() {
  return typeof window === "undefined" ? null : window.localStorage;
}

export function loadStoredLocale() {
  const storage = getStorage();
  const value = storage?.getItem(LOCALE_STORAGE_KEY);
  return isLocaleCode(value) ? value : null;
}

export function saveStoredLocale(locale: LocaleCode) {
  getStorage()?.setItem(LOCALE_STORAGE_KEY, locale);
}

export function clearStoredLocale() {
  getStorage()?.removeItem(LOCALE_STORAGE_KEY);
}

function toDate(value: string) {
  return new Date(value);
}

export function formatDateTime(locale: LocaleCode, value: string) {
  return new Intl.DateTimeFormat(locale, DATE_TIME_OPTIONS).format(toDate(value));
}

export function formatTime(locale: LocaleCode, value: string) {
  return new Intl.DateTimeFormat(locale, TIME_OPTIONS).format(toDate(value));
}
