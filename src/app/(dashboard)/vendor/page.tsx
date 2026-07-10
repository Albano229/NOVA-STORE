"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getStatusColor, getStatusLabel } from "@/lib/utils";
import { useCurrency } from "@/contexts/currency-context";
import {
  DollarSign,
  TrendingUp,
  ShoppingCart,
  Package,
  Users,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
} from "lucide-react";
import { SalesLineChart, RevenueBarChart } from "@/components/charts";

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

function SkeletonCard() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-800/20">
      <div className="flex items-center justify-between">
        <div className="h-4 w-24 animate-pulse rounded bg-gray-200" />
        <div className="h-10 w-10 animate-pulse rounded-xl bg-gray-200" />
      </div>
      <div className="mt-3 h-8 w-32 animate-pulse rounded bg-gray-200" />
      <div className="mt-2 h-3 w-16 animate-pulse rounded bg-gray-200" />
    </div>
  );
}

function SkeletonChart() {
  return (
    <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-800/20">
      <div className="h-5 w-40 animate-pulse rounded bg-gray-200" />
      <div className="mt-6 h-64 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
    </div>
  );
}

export default function VendorDashboard() {
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const { formatConvertedPrice } = useCurrency();

  useEffect(() => {
    fetch("/api/vendor/stats")
      .then((res) => res.json())
      .then((data) => {
        if (data.error || !data.totalRevenue && data.totalRevenue !== 0) {
          setLoading(false);
          return;
        }
        setStats(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <SkeletonChart />
          <SkeletonChart />
        </div>
      </div>
    );
  }

  if (!stats) return null;

  const monthChange = stats.lastMonthRevenue > 0
    ? Math.round(((stats.monthRevenue - stats.lastMonthRevenue) / stats.lastMonthRevenue) * 100)
    : 0;

  const kpis = [
    {
      label: "Revenus total",
      value: formatConvertedPrice(stats.totalRevenue, "XOF"),
      icon: DollarSign,
      color: "indigo",
      bgClass: "bg-indigo-50",
      iconClass: "text-indigo-600",
    },
    {
      label: "Revenus du jour",
      value: formatConvertedPrice(stats.todayRevenue, "XOF"),
      icon: TrendingUp,
      color: "emerald",
      bgClass: "bg-emerald-50",
      iconClass: "text-emerald-600",
    },
    {
      label: "Commandes",
      value: stats.totalOrders.toString(),
      suffix: stats.pendingOrders > 0 ? ` (${stats.pendingOrders} en attente)` : undefined,
      icon: ShoppingCart,
      color: "amber",
      bgClass: "bg-amber-50",
      iconClass: "text-amber-600",
    },
    {
      label: "Produits",
      value: stats.totalProducts.toString(),
      icon: Package,
      color: "rose",
      bgClass: "bg-rose-50",
      iconClass: "text-rose-600",
    },
    {
      label: "Clients",
      value: stats.uniqueClients.toString(),
      icon: Users,
      color: "cyan",
      bgClass: "bg-cyan-50",
      iconClass: "text-cyan-600",
    },
    {
      label: "Ventes ce mois",
      value: formatConvertedPrice(stats.monthRevenue, "XOF"),
      icon: BarChart3,
      color: "purple",
      bgClass: "bg-purple-50",
      iconClass: "text-purple-600",
      change: monthChange,
    },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>

      {/* KPI Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        {kpis.map((kpi) => (
          <div
            key={kpi.label}
            className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-gray-800/20 transition-shadow hover:shadow-md"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-gray-500 dark:text-gray-400">{kpi.label}</span>
              <div className={`rounded-xl ${kpi.bgClass} p-2.5 transition-transform group-hover:scale-105`}>
                <kpi.icon className={`h-4 w-4 ${kpi.iconClass}`} />
              </div>
            </div>
            <p className="mt-3 text-xl font-bold text-gray-900 dark:text-gray-100">
              {kpi.value}
            </p>
            {kpi.change !== undefined && kpi.change !== 0 && (
              <div className="mt-2 flex items-center gap-1">
                {kpi.change > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
                ) : (
                  <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
                )}
                <span
                  className={`text-xs font-semibold ${
                    kpi.change > 0 ? "text-emerald-600" : "text-red-600"
                  }`}
                >
                  {kpi.change > 0 ? "+" : ""}{kpi.change}%
                </span>
              </div>
            )}
            {kpi.suffix && (
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">{kpi.suffix}</p>
            )}
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-800/20 transition-shadow hover:shadow-md">
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
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-800/20 transition-shadow hover:shadow-md">
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

      {/* Bottom Section */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-800/20 transition-shadow hover:shadow-md">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4 text-indigo-500" />
            <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Commandes récentes</h2>
          </div>
          {stats.recentOrders.length === 0 ? (
            <div className="flex h-48 items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              Aucune commande récente
            </div>
          ) : (
            <div className="mt-4">
              {/* Desktop table */}
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50 text-xs font-medium uppercase text-gray-500 dark:text-gray-400">
                      <th className="pb-3 pr-4">ID</th>
                      <th className="pb-3 pr-4">Client</th>
                      <th className="pb-3 pr-4">Montant</th>
                      <th className="pb-3 pr-4">Statut</th>
                      <th className="pb-3">Date</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id} className="transition-colors hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{order.user.name || order.user.email}</td>
                        <td className="py-3 pr-4 font-medium text-gray-900 dark:text-gray-100">
                          {formatConvertedPrice(order.total, "XOF")}
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                              order.status
                            )}`}
                          >
                            {getStatusLabel(order.status)}
                          </span>
                        </td>
                        <td className="py-3 text-gray-500 dark:text-gray-400">
                          {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Mobile cards */}
              <div className="space-y-3 lg:hidden">
                {stats.recentOrders.map((order) => (
                  <div
                    key={order.id}
                    className="flex items-center justify-between gap-3 rounded-xl border border-gray-100 bg-gray-50/50 p-3 dark:border-gray-700 dark:bg-gray-700/30"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{order.orderNumber}</span>
                        <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${getStatusColor(order.status)}`}>
                          {getStatusLabel(order.status)}
                        </span>
                      </div>
                      <p className="mt-0.5 truncate text-xs text-gray-500 dark:text-gray-400">
                        {order.user.name || order.user.email}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatConvertedPrice(order.total, "XOF")}</p>
                      <p className="text-[10px] text-gray-500 dark:text-gray-400">
                        {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Popular Products */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-800/20 transition-shadow hover:shadow-md">
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
                  <span
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-xs font-bold ${
                      i < 3
                        ? "bg-indigo-100 text-indigo-700"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{product.sold} ventes</p>
                  </div>
                  <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    {formatConvertedPrice(product.revenue, "XOF")}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
