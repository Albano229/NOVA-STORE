"use client";

import { useSession, signOut } from "next-auth/react";
import Link from "next/link";
import { useEffect, useState, useRef, useCallback } from "react";
import {
  ChevronDown,
  Search,
  User,
  LogOut,
  Settings,
  Store,
  Shield,
  ShieldCheck,
  Crown,
  Plus,
  LayoutDashboard,
  Sun,
  Moon,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationsDropdown } from "@/components/notifications/dropdown";
import { useWorkspace } from "@/contexts/workspace-context";
import { ShopSelector } from "@/components/shop-selector";
import { SiteLogo } from "@/components/ui/site-logo";
import { useTheme } from "@/contexts/theme-context";
import { DeviseTestSwitcher } from "@/components/ui/devise-test-switcher";

interface TopBarProps {
  onMenuToggle?: () => void;
}

export function TopBar({ onMenuToggle }: TopBarProps) {
  const { data: session } = useSession();
  const { workspace, setWorkspace, hasShop, setHasShop, isOwner, isAdmin, isModerator, currentShop } = useWorkspace();
  const { theme, setTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [themeOpen, setThemeOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const themeRef = useRef<HTMLDivElement>(null);

  const isStaff = isOwner || isAdmin || isModerator;
  const inShopMode = workspace === "shop" && currentShop;

  const checkShop = useCallback(async () => {
    if (!isStaff) return;
    try {
      const res = await fetch("/api/user/has-shop");
      if (res.ok) {
        const data = await res.json();
        setHasShop(data.hasShop);
      }
    } catch {
      // ignore
    }
  }, [isStaff, setHasShop]);

  useEffect(() => {
    checkShop();
  }, [checkShop]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false);
      }
      if (themeRef.current && !themeRef.current.contains(e.target as Node)) {
        setThemeOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const initials = session?.user?.name
    ? session.user.name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "U";

  const getDisplayRole = () => {
    if (inShopMode) {
      return { label: "Vendeur", icon: Store, color: "text-emerald-500", bgColor: "bg-emerald-100 dark:bg-emerald-900/50" };
    }
    if (isOwner) {
      return { label: "Propriétaire", icon: Crown, color: "text-amber-500", bgColor: "bg-amber-100 dark:bg-amber-900/50" };
    }
    if (isAdmin) {
      return { label: "Administrateur", icon: Shield, color: "text-purple-500", bgColor: "bg-purple-100 dark:bg-purple-900/50" };
    }
    if (isModerator) {
      return { label: "Modérateur", icon: ShieldCheck, color: "text-orange-500", bgColor: "bg-orange-100 dark:bg-orange-900/50" };
    }
    return { label: "Vendeur", icon: Store, color: "text-emerald-500", bgColor: "bg-emerald-100 dark:bg-emerald-900/50" };
  };

  const displayRole = getDisplayRole();
  const RoleIcon = displayRole.icon;

  const getAdminHref = () => {
    if (isOwner || isAdmin || isModerator) return "/stores/admin";
    return "/stores";
  };

  const handleTabClick = (target: "admin" | "shop") => {
    if (target === "admin") {
      setWorkspace(isModerator ? "moderator" : "admin");
      window.location.href = getAdminHref();
    } else {
      setWorkspace("shop");
      window.location.href = "/stores";
    }
  };

  const themeOptions = [
    { value: "light" as const, label: "Clair", icon: Sun },
    { value: "dark" as const, label: "Sombre", icon: Moon },
  ];

  const ThemeIcon = theme === "dark" ? Moon : Sun;

  return (
    <header className="relative z-50 flex h-14 sm:h-16 shrink-0 items-center border-b border-gray-200 bg-white px-3 dark:border-gray-700 dark:bg-gray-900 sm:px-6">
      <div className="flex items-center gap-3">
        <button
          onClick={onMenuToggle}
          className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-100 text-gray-600 hover:bg-gray-200 active:bg-gray-300 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 md:hidden"
        >
          <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" /></svg>
        </button>
        <Link href={getAdminHref()} className="hidden items-center gap-2 md:flex flex-shrink-0">
          <SiteLogo size="md" />
        </Link>
        {inShopMode && currentShop && (
          <a
            href={`/shops/${currentShop.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 rounded-lg bg-[#7126b6]/10 px-2.5 py-1.5 text-xs font-medium text-[#7126b6] transition-colors hover:bg-[#7126b6]/20 md:hidden"
          >
            <ExternalLink className="h-3.5 w-3.5" />
            Ma boutique
          </a>
        )}
      </div>

      {inShopMode && (
        <div className="ml-4 hidden md:block">
          <ShopSelector />
        </div>
      )}

      {isStaff && hasShop && (
        <div className="ml-4 hidden md:block">
          <div className="flex rounded-xl bg-gray-100 p-1 dark:bg-gray-800">
            <button
              onClick={() => handleTabClick("admin")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                !inShopMode
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              {isOwner ? <Crown className="h-4 w-4" /> : isModerator ? <ShieldCheck className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
              {isOwner ? "Plateforme" : isModerator ? "Modération" : "Administration"}
            </button>
            <button
              onClick={() => handleTabClick("shop")}
              className={cn(
                "flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all",
                inShopMode
                  ? "bg-white text-gray-900 shadow-sm dark:bg-gray-700 dark:text-gray-100"
                  : "text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
              )}
            >
              <Store className="h-4 w-4" />
              Ma Boutique
            </button>
          </div>
        </div>
      )}

      {!hasShop && isStaff && (
        <div className="ml-4 hidden md:block">
          <Link
            href="/stores/create"
            className="flex items-center gap-2 rounded-xl bg-[#7126b6] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#5e1f99]"
          >
            <Plus className="h-4 w-4" />
            Créer ma boutique
          </Link>
        </div>
      )}

      <div className="flex flex-1 items-center justify-end gap-2 md:gap-4">
        <button className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800">
          <Search className="h-5 w-5" />
        </button>

        <NotificationsDropdown />

        <DeviseTestSwitcher />

        <div className="relative" ref={themeRef}>
          <button
            onClick={() => setThemeOpen(!themeOpen)}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            title="Changer de thème"
          >
            <ThemeIcon className="h-5 w-5" />
          </button>
          {themeOpen && (
            <div className="absolute right-0 top-full z-50 mt-2 w-36 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-800">
              {themeOptions.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => {
                    setTheme(opt.value);
                    setThemeOpen(false);
                  }}
                  className={cn(
                    "flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-colors",
                    theme === opt.value
                      ? "bg-[#7126b6]/10 font-medium text-[#7126b6] dark:bg-[#7126b6]/20"
                      : "text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                  )}
                >
                  <opt.icon className="h-4 w-4" />
                  {opt.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="relative" ref={userMenuRef}>
          <button
            onClick={() => setUserMenuOpen(!userMenuOpen)}
            className="flex items-center gap-2 rounded-lg px-2 py-1.5 hover:bg-gray-50 dark:hover:bg-gray-800"
          >
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-purple-100 text-sm font-bold text-[#7126b6] dark:bg-purple-900/50">
              {initials}
            </div>
            <span className="hidden text-sm font-medium text-gray-700 dark:text-gray-300 md:inline">
              {session?.user?.name}
            </span>
            <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          </button>

          {userMenuOpen && (
            <div className="absolute right-0 top-full mt-2 w-56 rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-800">
              <div className="border-b border-gray-100 px-4 py-3 dark:border-gray-700">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{session?.user?.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
                <div className="mt-2 flex items-center gap-1.5">
                  <span className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold",
                    displayRole.bgColor,
                    displayRole.color
                  )}>
                    <RoleIcon className="h-3 w-3" />
                    {displayRole.label}
                  </span>
                </div>
              </div>
              <Link
                href="/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <User className="h-4 w-4" />
                Mon compte
              </Link>
              {isStaff && (
                <button
                  onClick={() => {
                    handleTabClick("admin");
                    setUserMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <LayoutDashboard className="h-4 w-4" />
                  {isOwner ? "Plateforme" : "Administration"}
                </button>
              )}
              {hasShop && (
                <button
                  onClick={() => {
                    handleTabClick("shop");
                    setUserMenuOpen(false);
                  }}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Store className="h-4 w-4" />
                  Ma Boutique
                </button>
              )}
              <Link
                href="/profile"
                onClick={() => setUserMenuOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
              >
                <Settings className="h-4 w-4" />
                Paramètres
              </Link>
              <div className="my-1 border-t border-gray-100 dark:border-gray-700" />
              <button
                onClick={() => signOut({ callbackUrl: "/auth/login" })}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
              >
                <LogOut className="h-4 w-4" />
                Déconnexion
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
