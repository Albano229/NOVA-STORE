"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Menu, X, ChevronDown, User, LayoutDashboard, ShoppingBag, Home, Package, Grid3X3, Users } from "lucide-react";
import { useSession } from "next-auth/react";
import { SiteLogo } from "@/components/ui/site-logo";
import { CurrencySelector } from "@/components/ui/currency-selector";
import { LanguageSwitcher } from "@/components/ui/language-switcher";

export function Header() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [produitsOpen, setProduitsOpen] = useState(false);

  const isStorePage = pathname.startsWith("/shops/");
  const isLanding = pathname === "/";

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 10);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const isLoggedIn = !!session;
  const role = session?.user?.role;

  const getLogoHref = () => {
    if (!isLoggedIn) return "/";
    if (role === "VENDOR") return "/stores";
    if (role === "OWNER" || role === "ADMIN" || role === "MODERATOR") return "/stores/admin";
    return "/";
  };

  const getDashboardHref = () => {
    if (role === "OWNER" || role === "ADMIN" || role === "MODERATOR") return "/stores/admin";
    return "/stores";
  };

  const storeSlug = isStorePage ? pathname.split("/shops/")[1]?.split("/")[0] : null;

  return (
    <header
      className={`sticky top-0 z-50 bg-white transition-all duration-200 dark:bg-gray-900 ${
        scrolled ? "border-b border-gray-200 shadow-sm dark:border-gray-700" : ""
      }`}
    >
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <SiteLogo href={getLogoHref()} size="md" className="flex-shrink-0" />

        <nav className="hidden items-center gap-8 md:flex">
          <div className="relative">
            <button
              onClick={() => setProduitsOpen(!produitsOpen)}
              className="flex items-center gap-1 text-sm font-medium text-gray-700 hover:text-[#7126b6] transition-colors dark:text-gray-300"
            >
              Produits
              <ChevronDown className="h-4 w-4" />
            </button>
            {produitsOpen && (
              <div className="absolute left-0 top-full z-50 mt-2 w-48 rounded-xl border border-gray-200 bg-white py-2 shadow-lg dark:border-gray-700 dark:bg-gray-800">
                <Link href="/products?type=physical" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => setProduitsOpen(false)}>
                  Produits Physiques
                </Link>
                <Link href="/products?type=digital" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => setProduitsOpen(false)}>
                  Produits Digitaux
                </Link>
                <Link href="/products?type=service" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700" onClick={() => setProduitsOpen(false)}>
                  Services
                </Link>
              </div>
            )}
          </div>
          <Link href="/#features" className="text-sm font-medium text-gray-700 hover:text-[#7126b6] transition-colors dark:text-gray-300">
            Fonctionnalités
          </Link>
          <Link href="/#pricing" className="text-sm font-medium text-gray-700 hover:text-[#7126b6] transition-colors dark:text-gray-300">
            Tarifs
          </Link>
          <Link href="/#testimonials" className="text-sm font-medium text-gray-700 hover:text-[#7126b6] transition-colors dark:text-gray-300">
            Témoignages
          </Link>
        </nav>

        <div className="hidden items-center gap-4 md:flex">
          <LanguageSwitcher />
          {!isLanding && <CurrencySelector />}
          <Link
            href={isLoggedIn ? "/account/purchases" : "/auth/verify?redirect=/account/purchases"}
            className="flex items-center gap-2 rounded-full border border-gray-200 px-4 py-2 text-sm font-medium text-gray-700 transition-colors hover:border-[#7126b6] hover:text-[#7126b6] dark:border-gray-700 dark:text-gray-300"
          >
            <ShoppingBag className="h-4 w-4" />
            Mes achats
          </Link>
          {isLoggedIn ? (
            <>
              <Link href="/profile" className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#7126b6] transition-colors dark:text-gray-300">
                <User className="h-4 w-4" />
                Mon compte
              </Link>
              <Link
                href={getDashboardHref()}
                className="rounded-full bg-[#7126b6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#5e1f99] hover:shadow-md"
              >
                Dashboard
              </Link>
            </>
          ) : (
            <>
              <Link href="/auth/login" className="text-sm font-medium text-gray-700 hover:text-[#7126b6] transition-colors dark:text-gray-300">
                Connexion
              </Link>
              <Link
                href="/auth/register"
                className="rounded-full bg-[#7126b6] px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#5e1f99] hover:shadow-md"
              >
                Commencer
              </Link>
            </>
          )}
        </div>

        <button
          className="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 md:hidden"
          onClick={() => setMobileOpen(!mobileOpen)}
        >
          {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {mobileOpen && (
        <div className="border-t border-gray-200 bg-white px-4 pb-6 pt-4 dark:border-gray-700 dark:bg-gray-900 md:hidden">
          {isStorePage && storeSlug ? (
            <div className="flex flex-col gap-1">
              <Link href="/" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                <Home className="h-4 w-4" />
                Accueil
              </Link>
              <Link href={`/shops/${storeSlug}`} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                <Package className="h-4 w-4" />
                Produits
              </Link>
              <Link href="/products" className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                <Grid3X3 className="h-4 w-4" />
                Catégories
              </Link>
              <Link href={isLoggedIn ? "/account/purchases" : "/auth/verify?redirect=/account/purchases"} className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                <ShoppingBag className="h-4 w-4" />
                Mes achats
              </Link>
            </div>
          ) : (
            <div className="flex flex-col gap-1">
              <span className="px-3 py-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Produits</span>
              <Link href="/products?type=physical" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                Produits Physiques
              </Link>
              <Link href="/products?type=digital" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                Produits Digitaux
              </Link>
              <Link href="/products?type=service" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                Services
              </Link>
              <Link href="/#features" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                Fonctionnalités
              </Link>
              <Link href="/#pricing" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                Tarifs
              </Link>
              <Link href="/#testimonials" className="rounded-lg px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                Témoignages
              </Link>
              <div className="mt-4 flex flex-col gap-2 border-t border-gray-100 pt-4 dark:border-gray-700">
                {!isLanding && (
                  <div className="px-3 py-2">
                    <CurrencySelector />
                  </div>
                )}
                <Link href={isLoggedIn ? "/account/purchases" : "/auth/verify?redirect=/account/purchases"} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                  <ShoppingBag className="h-4 w-4" />
                  Mes achats
                </Link>
                <Link href={isLoggedIn ? "/account/referrals" : "/auth/verify?redirect=/account/referrals"} className="flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                  <Users className="h-4 w-4" />
                  Parrainage
                </Link>
                {isLoggedIn ? (
                  <>
                    <Link href="/profile" className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                      Mon compte
                    </Link>
                    <Link href={getDashboardHref()} className="rounded-full bg-[#7126b6] px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#5e1f99]" onClick={() => setMobileOpen(false)}>
                      Dashboard
                    </Link>
                  </>
                ) : (
                  <>
                    <Link href="/auth/login" className="rounded-lg px-3 py-2.5 text-center text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800" onClick={() => setMobileOpen(false)}>
                      Connexion
                    </Link>
                    <Link href="/auth/register" className="rounded-full bg-[#7126b6] px-3 py-2.5 text-center text-sm font-semibold text-white hover:bg-[#5e1f99]" onClick={() => setMobileOpen(false)}>
                      Commencer
                    </Link>
                  </>
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </header>
  );
}
