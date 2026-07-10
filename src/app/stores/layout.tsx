"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { SiteLogo } from "@/components/ui/site-logo";
import { LogOut, Settings, HelpCircle, ChevronDown, Globe, Sun, Moon } from "lucide-react";
import { signOut } from "next-auth/react";
import { useTheme } from "@/contexts/theme-context";
import { cn } from "@/lib/utils";

const languages = [
  { code: "FR", label: "Français" },
  { code: "EN", label: "English" },
  { code: "ES", label: "Español" },
  { code: "PT", label: "Português" },
  { code: "WOL", label: "Wolof" },
];

export default function StoresLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const { theme, setTheme } = useTheme();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);
  const [lang, setLang] = useState("FR");
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false);
        setLangOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7126b6] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  const role = session.user?.role;
  const isAdminRole = role === "OWNER" || role === "ADMIN" || role === "MODERATOR";

  if (pathname === "/stores" && isAdminRole) {
    router.replace("/admin");
    return (
      <div className="flex min-h-screen items-center justify-center bg-white dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7126b6] border-t-transparent" />
      </div>
    );
  }

  const isDashboard = pathname.includes("/stores/") && pathname !== "/stores" && pathname !== "/stores/admin" && pathname !== "/stores/create";

  if (isDashboard) {
    return <>{children}</>;
  }

  const user = session.user;
  const firstName = (user?.name || "Utilisateur").split(" ")[0].toUpperCase();
  const initials = (user?.name || "U")
    .split(" ")
    .map((w) => w[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  const currentLang = languages.find((l) => l.code === lang) || languages[0];

  return (
    <div className="flex min-h-screen flex-col bg-white dark:bg-gray-900">
      <header className="flex items-center justify-between px-4 py-3 sm:px-6 lg:px-12 lg:py-4">
        <SiteLogo href="/stores" size="md" />

        <div className="flex items-center gap-2">
          <button
            onClick={() => setTheme(theme === "light" ? "dark" : "light")}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            title="Changer de thème"
          >
            {theme === "dark" ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
          </button>

          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2.5 rounded-full bg-[#7126b6] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#7126b6]/90"
            >
              <span className="hidden text-xs tracking-wide sm:inline">{firstName}</span>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-white/20 text-xs font-bold">
                {initials}
              </div>
              <ChevronDown className="h-3.5 w-3.5 opacity-60" />
            </button>

            {menuOpen && (
              <div className="absolute right-0 top-full z-50 mt-2 w-72 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-start gap-3 p-5">
                  <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-[#7126b6]">
                    <img
                      src="/brand/logo.png"
                      alt="NOVA"
                      className="h-8 w-auto"
                      onError={(e) => {
                        (e.target as HTMLImageElement).style.display = "none";
                      }}
                    />
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{user?.name}</p>
                    <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">{user?.email}</p>
                  </div>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700" />

                <button
                  onClick={() => setLangOpen(!langOpen)}
                  className="flex w-full items-center justify-between px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <div className="flex items-center gap-3">
                    <Globe className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="font-medium">{currentLang.code}</span>
                    <span className="text-gray-500 dark:text-gray-400">{currentLang.label}</span>
                  </div>
                  <ChevronDown className={`h-4 w-4 text-gray-400 transition-transform ${langOpen ? "rotate-180" : ""}`} />
                </button>

                {langOpen && (
                  <div className="border-t border-gray-100 bg-gray-50 px-5 py-2 dark:border-gray-700 dark:bg-gray-700/50">
                    {languages.map((l) => (
                      <button
                        key={l.code}
                        onClick={() => {
                          setLang(l.code);
                          setLangOpen(false);
                        }}
                        className={`flex w-full items-center rounded-lg px-3 py-2 text-sm transition-colors ${
                          lang === l.code
                            ? "bg-[#7126b6]/10 font-medium text-[#7126b6] dark:bg-[#7126b6]/20"
                            : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-600"
                        }`}
                      >
                        {l.code} — {l.label}
                      </button>
                    ))}
                  </div>
                )}

                <div className="border-t border-gray-100 dark:border-gray-700" />

                <button
                  onClick={() => setTheme(theme === "light" ? "dark" : "light")}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  {theme === "dark" ? <Sun className="h-4 w-4 text-gray-400" /> : <Moon className="h-4 w-4 text-gray-400" />}
                  {theme === "dark" ? "Mode clair" : "Mode sombre"}
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push("/profile");
                  }}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <Settings className="h-4 w-4 text-gray-400" />
                  Mon Compte
                </button>

                <a
                  href="https://nova-store-ashy.vercel.app"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => setMenuOpen(false)}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-sm text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                >
                  <HelpCircle className="h-4 w-4 text-gray-400" />
                  Centre d'aide
                </a>

                <div className="border-t border-gray-100 dark:border-gray-700" />

                <button
                  onClick={() => signOut({ callbackUrl: "/" })}
                  className="flex w-full items-center gap-3 px-5 py-3.5 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20"
                >
                  <LogOut className="h-4 w-4" />
                  Se déconnecter
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-4 sm:px-6 lg:px-12 lg:py-8">
        {children}
      </main>
    </div>
  );
}
