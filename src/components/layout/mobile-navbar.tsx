"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Menu,
  BarChart3,
  Users,
  DollarSign,
  Store,
  Megaphone,
  Shield,
  Settings,
  UserCheck,
  AlertTriangle,
  ExternalLink,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useWorkspace } from "@/contexts/workspace-context";

interface MobileNavbarProps {
  onMenuToggle?: () => void;
}

export function MobileNavbar({ onMenuToggle }: MobileNavbarProps) {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { workspace, hasShop, currentShop, isOwner, isAdmin, isModerator, isVendor, setWorkspace } = useWorkspace();

  if (!session) return null;

  const isStaff = isOwner || isAdmin || isModerator;
  const inShopMode = workspace === "shop" && hasShop;

  const getTabs = () => {
    const isOnVendorPath = pathname.startsWith("/vendor");
    const isOnStoreDashboard = pathname.startsWith("/stores/") && pathname !== "/stores";
    const isVendorUser = isVendor || isOnVendorPath;

    if (inShopMode || isVendorUser || isOnStoreDashboard) {
      const shopId = currentShop?.id || (isOnStoreDashboard ? pathname.split("/")[2] : "") || "";
      const dashHref = shopId ? `/stores/${shopId}/dashboard` : "/vendor";
      return [
        { href: dashHref, label: "Accueil", icon: LayoutDashboard },
        { href: "/vendor/products", label: "Produits", icon: Package },
        { href: "/vendor/orders", label: "Commandes", icon: ShoppingCart },
        { href: "/vendor/payouts", label: "Revenus", icon: DollarSign },
        { href: "/vendor/analytics", label: "Stats", icon: BarChart3 },
      ];
    }
    if (isAdmin || isOwner) {
      return [
        { href: "/admin", label: "Accueil", icon: LayoutDashboard },
        { href: "/admin/users", label: "Clients", icon: Users },
        { href: "/admin/products", label: "Produits", icon: Package },
        { href: "/admin/orders", label: "Commandes", icon: ShoppingCart },
        { href: "/admin/analytics", label: "Stats", icon: BarChart3 },
      ];
    }
    if (isModerator) {
      return [
        { href: "/moderator", label: "Accueil", icon: LayoutDashboard },
        { href: "/moderator/products", label: "Produits", icon: Package },
        { href: "/moderator/stores", label: "Boutiques", icon: Store },
        { href: "/moderator/users", label: "Clients", icon: Users },
        { href: "/moderator/orders", label: "Commandes", icon: ShoppingCart },
      ];
    }
    return [];
  };

  const tabs = getTabs();

  const isActive = (href: string) => {
    if (href === "/admin" || href === "/vendor" || href === "/moderator") {
      return pathname === href || pathname.startsWith(href + "/");
    }
    if (href.includes("/stores/")) {
      return pathname === href || pathname.startsWith(href + "/");
    }
    return pathname.startsWith(href);
  };

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-gray-200 bg-white shadow-lg dark:border-gray-700 dark:bg-gray-900 md:hidden">
      {inShopMode && currentShop && (
        <div className="flex items-center justify-between border-b border-gray-100 bg-emerald-50 px-4 py-2 dark:border-gray-700 dark:bg-emerald-900/20">
          <div className="flex items-center gap-2 min-w-0">
            <Store className="h-4 w-4 flex-shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span className="truncate text-xs font-semibold text-emerald-800 dark:text-emerald-300">{currentShop.name}</span>
          </div>
          <div className="flex items-center gap-2">
            <a
              href={`/shops/${currentShop.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1 rounded-lg border border-emerald-200 bg-white px-2.5 py-1 text-[10px] font-semibold text-emerald-700 transition-colors hover:bg-emerald-100 dark:border-emerald-700 dark:bg-gray-800 dark:text-emerald-300 dark:hover:bg-emerald-900/40"
            >
              <ExternalLink className="h-3 w-3" />
              Visiter
            </a>
            {isStaff && (
              <button
                onClick={() => {
                  setWorkspace(isModerator ? "moderator" : "admin");
                  window.location.reload();
                }}
                className="flex-shrink-0 rounded-lg border border-gray-200 bg-white px-3 py-1 text-[10px] font-medium text-gray-600 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-400"
              >
                Admin
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex items-center justify-around py-2">
        {tabs.map((tab) => {
          const active = isActive(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                "flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium transition-colors",
                active ? "text-[#7126b6]" : "text-gray-500 dark:text-gray-400"
              )}
            >
              <tab.icon className="h-5 w-5" />
              <span>{tab.label}</span>
            </Link>
          );
        })}
        <button
          onClick={onMenuToggle}
          className="flex flex-col items-center gap-0.5 px-2 py-1 text-[10px] font-medium text-gray-500 transition-colors dark:text-gray-400"
        >
          <Menu className="h-5 w-5" />
          <span>Menu</span>
        </button>
      </div>
    </nav>
  );
}
