"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Store,
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Settings,
  ExternalLink,
  Loader2,
} from "lucide-react";
import { formatPrice, getStatusColor, getStatusLabel } from "@/lib/utils";
import { SalesLineChart, RevenueBarChart } from "@/components/charts";

interface ShopInfo {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  isActive: boolean;
}

interface VendorStats {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  lastMonthRevenue: number;
  totalOrders: number;
  todayOrders: number;
  totalProducts: number;
  pendingOrders: number;
  uniqueClients: number;
  recentOrders: {
    id: string;
    orderNumber: string;
    total: number;
    status: string;
    paymentStatus: string;
    createdAt: string;
    user: { name: string | null; email: string };
  }[];
  popularProducts: { name: string; sold: number; revenue: number }[];
  weeklySales: { name: string; value: number }[];
  monthlyRevenue: { name: string; value: number }[];
}

export default function StoreDashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const storeId = params.storeId as string;

  const [shop, setShop] = useState<ShopInfo | null>(null);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status !== "authenticated") return;

    Promise.all([
      fetch("/api/vendor/shops").then((r) => r.json()),
      fetch("/api/vendor/stats").then((r) => r.json()),
    ])
      .then(([shopsData, statsData]) => {
        const shops = Array.isArray(shopsData) ? shopsData : [];
        const currentShop = shops.find((s: ShopInfo) => s.id === storeId);
        if (!currentShop) {
          setError(true);
          return;
        }
        setShop(currentShop);
        localStorage.setItem("nova_active_shop_id", storeId);
        if (statsData && !statsData.error) {
          setStats(statsData);
        }
      })
      .catch(() => setError(true))
      .finally(() => setLoading(false));
  }, [status, storeId, router]);

  if (loading || status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7126b6]" />
      </div>
    );
  }

  if (error || !shop) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
        <Store className="h-12 w-12 text-gray-300" />
        <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Boutique introuvable</h2>
        <Link href="/stores" className="mt-4 text-sm text-[#7126b6] hover:underline">
          Retour à mes boutiques
        </Link>
      </div>
    );
  }

  const monthChange = stats && stats.lastMonthRevenue > 0
    ? Math.round(((stats.monthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)
    : 0;

  const kpis = stats ? [
    { label: "Revenus total", value: formatPrice(stats.totalRevenue), icon: DollarSign, bgClass: "bg-purple-50", iconClass: "text-[#7126b6]" },
    { label: "Revenus du jour", value: formatPrice(stats.todayRevenue), icon: TrendingUp, bgClass: "bg-emerald-50", iconClass: "text-emerald-600" },
    { label: "Commandes", value: stats.totalOrders.toString(), suffix: stats.pendingOrders > 0 ? ` (${stats.pendingOrders} en attente)` : undefined, icon: ShoppingCart, bgClass: "bg-amber-50", iconClass: "text-amber-600" },
    { label: "Produits", value: stats.totalProducts.toString(), icon: Package, bgClass: "bg-rose-50", iconClass: "text-rose-600" },
    { label: "Clients", value: stats.uniqueClients.toString(), icon: Users, bgClass: "bg-cyan-50", iconClass: "text-cyan-600" },
    { label: "Ventes ce mois", value: formatPrice(stats.monthRevenue), icon: BarChart3, bgClass: "bg-purple-50", iconClass: "text-purple-600", change: monthChange },
  ] : [];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-3">
          <Link href="/stores" className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          {shop.logo ? (
            <img src={shop.logo} alt={shop.name} className="h-10 w-10 rounded-xl object-cover" />
          ) : (
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7126b6] text-sm font-bold text-white">
              {shop.name.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-gray-100">{shop.name}</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">Dashboard de la boutique</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <a
            href={`/shops/${shop.slug}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <ExternalLink className="h-4 w-4" />
            Voir
          </a>
          <Link
            href="/vendor/settings"
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Settings className="h-4 w-4" />
            Paramètres
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
      {stats && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {kpis.map((kpi) => (
            <div key={kpi.label} className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{kpi.label}</span>
                <div className={`rounded-xl ${kpi.bgClass} p-2.5`}>
                  <kpi.icon className={`h-4 w-4 ${kpi.iconClass}`} />
                </div>
              </div>
              <p className="mt-3 text-xl font-bold text-gray-900 dark:text-gray-100">{kpi.value}</p>
              {"change" in kpi && kpi.change !== undefined && kpi.change !== 0 && (
                <div className="mt-2 flex items-center gap-1">
                  {kpi.change > 0 ? (
                    <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                  )}
                  <span className={`text-xs font-semibold ${kpi.change > 0 ? "text-emerald-600" : "text-red-600"}`}>
                    {kpi.change > 0 ? "+" : ""}{kpi.change}%
                  </span>
                </div>
              )}
              {"suffix" in kpi && kpi.suffix && (
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{kpi.suffix}</p>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Charts */}
      {stats && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Courbe des ventes</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">7 derniers jours</p>
            <div className="mt-4">
              {stats.weeklySales.length > 0 ? (
                <SalesLineChart data={stats.weeklySales} height={280} />
              ) : (
                <div className="flex h-[280px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                  Aucune donnée de vente
                </div>
              )}
            </div>
          </div>
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Revenus mensuels</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">6 derniers mois</p>
            <div className="mt-4">
              {stats.monthlyRevenue.length > 0 ? (
                <RevenueBarChart data={stats.monthlyRevenue} height={280} />
              ) : (
                <div className="flex h-[280px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                  Aucune donnée de revenu
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Recent Orders + Popular Products */}
      {stats && (
        <div className="grid gap-6 lg:grid-cols-2">
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-[#7126b6]" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Commandes récentes</h2>
            </div>
            {stats.recentOrders.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                Aucune commande récente
              </div>
            ) : (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      <th className="pb-3 pr-4">ID</th>
                      <th className="pb-3 pr-4">Client</th>
                      <th className="pb-3 pr-4">Montant</th>
                      <th className="pb-3">Statut</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{order.user.name || order.user.email}</td>
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">{formatPrice(order.total)}</td>
                        <td className="py-3">
                          <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
            <div className="flex items-center gap-2">
              <Package className="h-4 w-4 text-amber-500" />
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Produits populaires</h2>
            </div>
            {stats.popularProducts.length === 0 ? (
              <div className="flex h-48 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                Aucun produit vendu
              </div>
            ) : (
              <div className="mt-4 space-y-4">
                {stats.popularProducts.map((product, i) => (
                  <div key={product.name} className="flex items-center gap-4">
                    <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${i < 3 ? "bg-purple-100 text-[#7126b6]" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                      {i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{product.sold} ventes</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatPrice(product.revenue)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
