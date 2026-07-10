"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { getTranslations, type Locale, type TranslationKeys } from "./index";

interface I18nContextType {
  locale: Locale;
  t: TranslationKeys;
  setLocale: (locale: Locale) => void;
}

const I18nContext = createContext<I18nContextType | undefined>(undefined);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("fr");

  useEffect(() => {
    const saved = localStorage.getItem("nova-locale") as Locale;
    if (saved && saved !== locale) {
      setLocaleState(saved);
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem("nova-locale", newLocale);
  }, []);

  const t = getTranslations(locale);

  return (
    <I18nContext.Provider value={{ locale, t, setLocale }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  const context = useContext(I18nContext);
  if (!context) {
    throw new Error("useI18n must be used within an I18nProvider");
  }
  return context;
}
