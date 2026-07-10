"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import { BRAND } from "@/lib/brand";

interface SiteSettings {
  siteName: string;
  siteDescription: string;
  logo: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  currency: string;
  contactEmail: string;
  contactPhone: string;
  siteUrl: string;
  facebookUrl: string;
  instagramUrl: string;
  twitterUrl: string;
  youtubeUrl: string;
  tiktokUrl: string;
  heroTitle: string;
  heroSubtitle: string;
  heroCtaText: string;
  showTestimonials: string;
  showFeatures: string;
  showPricing: string;
  showStats: string;
  showCategories: string;
  showMarquee: string;
  showResources: string;
  [key: string]: string;
}

interface SiteSettingsContextType {
  settings: SiteSettings;
  loading: boolean;
}

const DEFAULTS: SiteSettings = {
  siteName: BRAND.name,
  siteDescription: BRAND.description,
  logo: "",
  favicon: "",
  primaryColor: "#7126b6",
  secondaryColor: "#7c3aed",
  currency: "FCFA",
  contactEmail: "",
  contactPhone: "",
  siteUrl: "",
  facebookUrl: "",
  instagramUrl: "",
  twitterUrl: "",
  youtubeUrl: "",
  tiktokUrl: "",
  heroTitle: "",
  heroSubtitle: "",
  heroCtaText: "",
  showTestimonials: "true",
  showFeatures: "true",
  showPricing: "true",
  showStats: "true",
  showCategories: "true",
  showMarquee: "true",
  showResources: "true",
};

const SiteSettingsContext = createContext<SiteSettingsContextType>({
  settings: DEFAULTS,
  loading: true,
});

export function SiteSettingsProvider({ children }: { children: React.ReactNode }) {
  const [settings, setSettings] = useState<SiteSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);

  const fetchSettings = useCallback(async () => {
    try {
      const res = await fetch("/api/site-settings");
      if (res.ok) {
        const data = await res.json();
        setSettings((prev) => ({ ...prev, ...data }));
      }
    } catch {
      // keep defaults
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  return (
    <SiteSettingsContext.Provider value={{ settings, loading }}>
      {children}
    </SiteSettingsContext.Provider>
  );
}

export function useSiteSettings() {
  return useContext(SiteSettingsContext);
}
