"use client";

import Link from "next/link";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { SiteLogo } from "@/components/ui/site-logo";
import { BRAND } from "@/lib/brand";

export function Footer() {
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || BRAND.name;
  const siteDesc = settings.siteDescription || "La plateforme N°1 pour vendre vos produits en Afrique et dans le monde.";

  return (
    <footer className="bg-slate-900 text-gray-300">
      <div className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        {/* Top */}
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-6">
          {/* Brand */}
          <div className="lg:col-span-2">
            <Link href="/" className="flex items-center gap-2 text-xl font-extrabold text-white">
              {settings.logo ? (
                <img src={settings.logo} alt={siteName} className="h-[36px] md:h-[48px] w-auto" />
              ) : (
                <img src="/brand/logo.png" alt={siteName} className="h-[36px] md:h-[48px] w-auto" />
              )}
            </Link>
            <p className="mt-4 max-w-sm text-sm leading-relaxed text-gray-400">
              {siteDesc}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {[
                { name: "Facebook", url: "https://facebook.com/novastore" },
                { name: "Instagram", url: "https://instagram.com/novastore" },
                { name: "TikTok", url: "https://tiktok.com/@novastore" },
                { name: "X", url: "https://x.com/novastore" },
              ].map((s) => (
                <a
                  key={s.name}
                  href={s.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-xs font-bold text-gray-400 transition-colors hover:bg-white/20 hover:text-white"
                >
                  {s.name.charAt(0)}
                </a>
              ))}
            </div>
          </div>

          {/* Products */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Produits</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/products" className="text-sm text-gray-400 transition-colors hover:text-white">Boutique en ligne</Link></li>
              <li><Link href="/#features" className="text-sm text-gray-400 transition-colors hover:text-white">Paiements</Link></li>
              <li><Link href="/#features" className="text-sm text-gray-400 transition-colors hover:text-white">Livraison</Link></li>
              <li><Link href="/#features" className="text-sm text-gray-400 transition-colors hover:text-white">Automatisation</Link></li>
            </ul>
          </div>

          {/* Ressources */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Ressources</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/#features" className="text-sm text-gray-400 transition-colors hover:text-white">Fonctionnalités</Link></li>
              <li><Link href="/#pricing" className="text-sm text-gray-400 transition-colors hover:text-white">Tarifs</Link></li>
              <li><Link href="/products" className="text-sm text-gray-400 transition-colors hover:text-white">Boutique</Link></li>
              <li><Link href="/auth/register" className="text-sm text-gray-400 transition-colors hover:text-white">Créer ma boutique</Link></li>
            </ul>
          </div>

          {/* Légal */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Légal</h3>
            <ul className="mt-4 space-y-3">
              <li><Link href="/privacy" className="text-sm text-gray-400 transition-colors hover:text-white">Politique de confidentialité</Link></li>
              <li><Link href="/terms" className="text-sm text-gray-400 transition-colors hover:text-white">Termes et conditions</Link></li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-sm font-semibold uppercase tracking-wider text-white">Contact</h3>
            <ul className="mt-4 space-y-3">
              <li><span className="text-sm text-gray-400">support@nova-store.com</span></li>
            </ul>
          </div>
        </div>

        {/* Bottom */}
        <div className="mt-12 border-t border-gray-800 pt-8 text-center text-sm text-gray-500">
          &copy; {new Date().getFullYear()} {siteName}. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}
