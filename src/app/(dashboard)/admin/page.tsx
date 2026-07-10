"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import { useWorkspace } from "@/contexts/workspace-context";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { BRAND } from "@/lib/brand";
import {
  LayoutDashboard,
  Users,
  Store,
  Package,
  ShoppingCart,
  DollarSign,
  BarChart3,
  Megaphone,
  Shield,
  FileText,
  Settings,
  UserCog,
  Lock,
  Plus,
  ExternalLink,
  Crown,
  ShieldCheck,
  ArrowRight,
  ChevronRight,
} from "lucide-react";

interface ShopData {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  _count: { products: number };
  ordersCount: number;
  revenue: number;
}

export default function AdminDashboard() {
  const { isOwner, isAdmin, isModerator, setWorkspace, setCurrentShop } = useWorkspace();
  const { settings } = useSiteSettings();
  const [shops, setShops] = useState<ShopData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/vendor/shops")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setShops(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const enterShop = (shop: ShopData) => {
    window.location.href = `/stores/${shop.id}/dashboard`;
  };

  const roleLabel = isOwner ? "Propriétaire" : isAdmin ? "Administrateur" : "Modérateur";
  const RoleIcon = isOwner ? Crown : isAdmin ? Shield : ShieldCheck;
  const roleColor = isOwner ? "from-amber-500 to-orange-600" : isAdmin ? "from-purple-500 to-indigo-600" : "from-orange-500 to-red-600";

  const adminLinks = [
    { href: "/admin/users", label: "Utilisateurs", icon: Users, color: "text-violet-600 bg-violet-50" },
    { href: "/admin/stores", label: "Boutiques", icon: Store, color: "text-emerald-600 bg-emerald-50" },
    { href: "/admin/products", label: "Produits", icon: Package, color: "text-indigo-600 bg-indigo-50" },
    { href: "/admin/orders", label: "Commandes", icon: ShoppingCart, color: "text-amber-600 bg-amber-50" },
    { href: "/admin/payments", label: "Paiements", icon: DollarSign, color: "text-green-600 bg-green-50" },
    { href: "/admin/analytics", label: "Analytics", icon: BarChart3, color: "text-blue-600 bg-blue-50" },
    { href: "/admin/marketing", label: "Marketing", icon: Megaphone, color: "text-pink-600 bg-pink-50" },
    { href: "/admin/logs", label: "Modération", icon: Shield, color: "text-red-600 bg-red-50" },
    { href: "/admin/reports", label: "Rapports", icon: FileText, color: "text-teal-600 bg-teal-50" },
    ...(isOwner ? [
      { href: "/admin/team", label: "Équipe", icon: UserCog, color: "text-cyan-600 bg-cyan-50" },
      { href: "/admin/security", label: "Sécurité", icon: Lock, color: "text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700" },
      { href: "/admin/settings", label: "Paramètres", icon: Settings, color: "text-slate-600 bg-slate-100" },
    ] : []),
  ];

  return (
    <div className="space-y-8">
      {/* Welcome Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className={`flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${roleColor} shadow-lg`}>
            <RoleIcon className="h-7 w-7 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Bienvenue</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              {roleLabel} · {settings.siteName || BRAND.name}
            </p>
          </div>
        </div>
      </div>

      {/* Section A: Administration */}
      <div>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
            <LayoutDashboard className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Administration</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Gérez la plateforme {settings.siteName || BRAND.name}</p>
          </div>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {adminLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className="group flex items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20 transition-all hover:border-indigo-200 hover:shadow-md"
            >
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${link.color} transition-transform group-hover:scale-105`}>
                <link.icon className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{link.label}</p>
              </div>
              <ChevronRight className="h-4 w-4 text-gray-300 transition-colors group-hover:text-indigo-500" />
            </Link>
          ))}
        </div>
      </div>

      {/* Section B: Mes Boutiques */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100">
              <Store className="h-4 w-4 text-emerald-600" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Mes Boutiques</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">{shops.length} boutique{shops.length !== 1 ? "s" : ""}</p>
            </div>
          </div>
          <Link
            href="/stores/create"
            className="flex items-center gap-2 rounded-xl bg-[#7126b6] px-4 py-2 text-sm font-medium text-white shadow-sm dark:shadow-gray-800/20 transition-colors hover:bg-[#5e1f99]"
          >
            <Plus className="h-4 w-4" />
            Créer une boutique
          </Link>
        </div>

        {loading ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
            ))}
          </div>
        ) : shops.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white dark:bg-gray-800 p-12 text-center">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <Store className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h3 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Aucune boutique</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Créez votre première boutique pour commencer à vendre
            </p>
            <Link
              href="/stores/create"
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#7126b6] px-6 py-3 text-sm font-medium text-white shadow-sm dark:shadow-gray-800/20 transition-colors hover:bg-[#5e1f99]"
            >
              <Plus className="h-4 w-4" />
              Créer ma boutique
            </Link>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {shops.map((shop) => (
              <button
                key={shop.id}
                onClick={() => enterShop(shop)}
                className="group flex flex-col rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-gray-800/20 text-left transition-all hover:border-emerald-200 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-sm font-bold text-emerald-700">
                    {shop.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{shop.name}</p>
                    <span
                      className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        shop.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                      }`}
                    >
                      {shop.isActive ? "Active" : "Inactive"}
                    </span>
                  </div>
                  <ExternalLink className="h-4 w-4 text-gray-300 transition-colors group-hover:text-emerald-500" />
                </div>
                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <span>{shop._count?.products || 0} produits</span>
                  <span>{shop.ordersCount || 0} commandes</span>
                  <span>{formatPrice(shop.revenue || 0)}</span>
                </div>
                <div className="mt-3 flex items-center gap-1 text-xs font-medium text-emerald-600 transition-opacity">
                  Entrer dans la boutique
                  <ArrowRight className="h-3 w-3" />
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
