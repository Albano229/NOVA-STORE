"use client";

import { useEffect } from "react";
import { useSiteSettings } from "@/contexts/site-settings-context";

function hexToHSL(hex: string): string {
  hex = hex.replace("#", "");
  const r = parseInt(hex.substring(0, 2), 16) / 255;
  const g = parseInt(hex.substring(2, 4), 16) / 255;
  const b = parseInt(hex.substring(4, 6), 16) / 255;

  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

function hexToRGB(hex: string): string {
  hex = hex.replace("#", "");
  return `${parseInt(hex.substring(0, 2), 16)} ${parseInt(hex.substring(2, 4), 16)} ${parseInt(hex.substring(4, 6), 16)}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { settings } = useSiteSettings();

  useEffect(() => {
    const root = document.documentElement;
    const primary = settings.primaryColor || "#7126b6";
    const secondary = settings.secondaryColor || "#7c3aed";

    root.style.setProperty("--color-primary", primary);
    root.style.setProperty("--color-secondary", secondary);
    root.style.setProperty("--color-primary-hsl", hexToHSL(primary));
    root.style.setProperty("--color-secondary-hsl", hexToHSL(secondary));
    root.style.setProperty("--color-primary-rgb", hexToRGB(primary));
    root.style.setProperty("--color-secondary-rgb", hexToRGB(secondary));

    // Meta theme-color for mobile browsers
    let meta = document.querySelector("meta[name='theme-color']") as HTMLMetaElement;
    if (!meta) {
      meta = document.createElement("meta");
      meta.name = "theme-color";
      document.head.appendChild(meta);
    }
    meta.content = primary;
  }, [settings.primaryColor, settings.secondaryColor]);

  return <>{children}</>;
}
