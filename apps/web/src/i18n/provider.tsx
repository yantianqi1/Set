"use client";

import { createContext, useEffect, useMemo, useState, type ReactNode } from "react";

import {
  DEFAULT_LOCALE,
  loadStoredLocale,
  resolveInitialLocale,
  saveStoredLocale,
  type LocaleCode
} from "./locale";
import { messages, type Messages } from "./messages";

export type I18nContextValue = {
  locale: LocaleCode;
  setLocale: (locale: LocaleCode) => void;
  t: Messages;
};

export const I18nContext = createContext<I18nContextValue | null>(null);

function syncDocumentLocale(locale: LocaleCode) {
  if (typeof document !== "undefined") {
    document.documentElement.lang = locale;
  }
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState(DEFAULT_LOCALE);
  const [isResolved, setIsResolved] = useState(false);

  useEffect(() => {
    const nextLocale = resolveInitialLocale(loadStoredLocale(), globalThis.navigator?.language);
    setLocaleState(nextLocale);
    setIsResolved(true);
    syncDocumentLocale(nextLocale);
  }, []);

  useEffect(() => {
    syncDocumentLocale(locale);
    if (isResolved) {
      saveStoredLocale(locale);
    }
  }, [isResolved, locale]);

  const value = useMemo(
    () => ({
      locale,
      setLocale(nextLocale: LocaleCode) {
        setLocaleState(nextLocale);
        setIsResolved(true);
      },
      t: messages[locale]
    }),
    [locale]
  );

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>;
}
