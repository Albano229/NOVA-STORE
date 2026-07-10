"use client";

import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { BRAND } from "@/lib/brand";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function PWAInstall() {
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showBanner, setShowBanner] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    if (window.matchMedia("(display-mode: standalone)").matches || (window.navigator as any).standalone) {
      setIsInstalled(true);
      return;
    }

    const dismissed = localStorage.getItem("nova_pwa_dismissed");
    if (dismissed) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      setShowBanner(true);
    };

    window.addEventListener("beforeinstallprompt", handler);

    window.addEventListener("appinstalled", () => {
      setIsInstalled(true);
      setShowBanner(false);
      localStorage.removeItem("nova_pwa_dismissed");
    });

    return () => {
      window.removeEventListener("beforeinstallprompt", handler);
    };
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === "accepted") {
      setIsInstalled(true);
    }
    setDeferredPrompt(null);
    setShowBanner(false);
  };

  const handleDismiss = () => {
    setShowBanner(false);
    localStorage.setItem("nova_pwa_dismissed", "true");
  };

  if (isInstalled || !showBanner) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 md:bottom-6 md:left-auto md:right-6 md:max-w-sm">
      <div className="rounded-2xl border border-purple-200 bg-white p-4 shadow-xl shadow-purple-600/10">
        <div className="flex items-start gap-3">
          <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-purple-100">
            <Download className="h-6 w-6 text-[#7126b6]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-semibold text-gray-900">Installer {BRAND.name}</p>
            <p className="mt-0.5 text-xs text-gray-500">
              Ajoutez {BRAND.name} à votre écran d&apos;accueil pour un accès rapide.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleInstall}
                className="rounded-lg bg-[#7126b6] px-4 py-2 text-xs font-semibold text-white hover:bg-[#5e1f99]"
              >
                Installer
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg px-4 py-2 text-xs font-medium text-gray-500 hover:bg-gray-100"
              >
                Plus tard
              </button>
            </div>
          </div>
          <button onClick={handleDismiss} className="flex-shrink-0 text-gray-400 hover:text-gray-600">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
