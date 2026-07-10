"use client";

import { useEffect } from "react";
import { useSiteSettings } from "@/contexts/site-settings-context";

export function DynamicHead() {
  const { settings } = useSiteSettings();

  useEffect(() => {
    if (settings.siteName) {
      document.title = `${settings.siteName} - La plateforme N°1 pour vendre vos produits`;
    }
    if (settings.favicon) {
      let link = document.querySelector("link[rel='icon']") as HTMLLinkElement;
      if (!link) {
        link = document.createElement("link");
        link.rel = "icon";
        document.head.appendChild(link);
      }
      link.href = settings.favicon;
    }
  }, [settings.siteName, settings.favicon]);

  return null;
}
