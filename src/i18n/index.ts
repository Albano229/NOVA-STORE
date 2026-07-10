import fr from "./locales/fr.json";
import en from "./locales/en.json";
import es from "./locales/es.json";
import pt from "./locales/pt.json";
import wo from "./locales/wo.json";

export type Locale = "fr" | "en" | "es" | "pt" | "wo";

export const locales: { code: Locale; label: string; flag: string }[] = [
  { code: "fr", label: "Français", flag: "🇫🇷" },
  { code: "en", label: "English", flag: "🇬🇧" },
  { code: "es", label: "Español", flag: "🇪🇸" },
  { code: "pt", label: "Português", flag: "🇧🇷" },
  { code: "wo", label: "Wolof", flag: "🇸🇳" },
];

const translations: Record<Locale, typeof fr> = { fr, en, es, pt, wo };

export function getTranslations(locale: Locale): typeof fr {
  return translations[locale] || translations.fr;
}

export type TranslationKeys = typeof fr;
