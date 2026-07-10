"use client";

import { useEffect, useState, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import {
  DollarSign,
  Calendar,
  ShoppingCart,
  TrendingUp,
  Users,
  UserPlus,
  Target,
  Percent,
  Download,
  RefreshCw,
  Search,
  ArrowUpRight,
  ArrowDownRight,
  Trophy,
  BarChart3,
  Activity,
  Clock,
  Filter,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  AreaChart,
  Area,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

interface AnalyticsData {
  overview: {
    totalRevenue: number;
    monthRevenue: number;
    weekRevenue: number;
    todayRevenue: number;
    totalOrders: number;
    monthOrders: number;
    totalUsers: number;
    monthUsers: number;
    totalVendors: number;
    totalShops: number;
    avgOrderValue: number;
    conversionRate: number;
  };
  revenueChart: { date: string; revenue: number; orders: number }[];
  salesChart: { date: string; sales: number; revenue: number }[];
  usersChart: { date: string; newUsers: number; totalUsers: number }[];
  topVendors: { id: string; name: string; email: string; revenue: number; orders: number; shops: number }[];
  topShops: { id: string; name: string; slug: string; revenue: number; orders: number; products: number }[];
  topProducts: { id: string; name: string; price: number; salesCount: number; revenue: number; shopName: string }[];
  topCategories: { name: string; productCount: number; totalSales: number; totalRevenue: number }[];
  recentActivity: { action: string; entityType: string; userName: string; createdAt: string }[];
  conversion: {
    rate: number;
    abandonedCart: number;
    avgOrder: number;
    returnRate: number;
  };
}

type ChartPeriod = "7d" | "30d" | "90d" | "1y";

const PIE_COLORS = ["#0f172a", "#6366f1", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#06b6d4", "#ec4899"];

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });

const formatFullDate = (date: string) =>
  new Date(date).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "long",
    year: "numeric",
  });

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [period, setPeriod] = useState<ChartPeriod>("30d");
  const [revenuePeriod, setRevenuePeriod] = useState<ChartPeriod>("30d");
  const [salesPeriod, setSalesPeriod] = useState<ChartPeriod>("30d");
  const [usersPeriod, setUsersPeriod] = useState<ChartPeriod>("90d");
  const [shopFilter, setShopFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const fetchAnalytics = useCallback(async (showRefresh = false) => {
    if (showRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const res = await fetch(`/api/admin/analytics?period=${period}`);
      if (!res.ok) throw new Error("Erreur de chargement");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erreur lors du chargement des analytics");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  useEffect(() => {
    fetchAnalytics();
  }, [period]);

  const handleExport = () => {
    toast.success("Export en cours de préparation...");
  };

  const kpis = data
    ? [
        {
          label: "Revenus totaux",
          value: formatPrice(data.overview.totalRevenue),
          icon: DollarSign,
          color: "bg-emerald-100 text-emerald-600",
        },
        {
          label: "Revenus ce mois",
          value: formatPrice(data.overview.monthRevenue),
          icon: Calendar,
          color: "bg-purple-100 text-purple-600",
        },
        {
          label: "Commandes totales",
          value: data.overview.totalOrders.toLocaleString("fr-FR"),
          icon: ShoppingCart,
          color: "bg-indigo-100 text-indigo-600",
        },
        {
          label: "Commandes ce mois",
          value: data.overview.monthOrders.toLocaleString("fr-FR"),
          icon: TrendingUp,
          color: "bg-blue-100 text-blue-600",
        },
        {
          label: "Utilisateurs",
          value: data.overview.totalUsers.toLocaleString("fr-FR"),
          icon: Users,
          color: "bg-teal-100 text-teal-600",
        },
        {
          label: "Nouveaux utilisateurs ce mois",
          value: data.overview.monthUsers.toLocaleString("fr-FR"),
          icon: UserPlus,
          color: "bg-green-100 text-green-600",
        },
        {
          label: "Panier moyen",
          value: formatPrice(data.overview.avgOrderValue),
          icon: Target,
          color: "bg-amber-100 text-amber-600",
        },
        {
          label: "Taux de conversion",
          value: `${data.overview.conversionRate}%`,
          icon: Percent,
          color: "bg-pink-100 text-pink-600",
        },
      ]
    : [];

  const filteredTopShops = data?.topShops.filter(
    (s) => !shopFilter || s.name.toLowerCase().includes(shopFilter.toLowerCase())
  ) || [];

  const filteredTopProducts = data?.topProducts.filter(
    (p) => !shopFilter || p.shopName.toLowerCase().includes(shopFilter.toLowerCase())
  ) || [];

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded-lg bg-gray-200" />
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
            <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-700" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-96 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-700" />
          ))}
        </div>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Analytics</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Vue détaillée des performances de la plateforme
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={handleExport}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm dark:shadow-gray-800/20 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
          >
            <Download className="h-4 w-4" />
            Exporter
          </button>
          <button
            onClick={() => fetchAnalytics(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-white shadow-sm dark:shadow-gray-800/20 transition-colors hover:bg-[#1e293b] disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`} />
            Actualiser
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 shadow-sm dark:shadow-gray-800/20">
        {(["7d", "30d", "90d", "1y"] as ChartPeriod[]).map((p) => (
          <button
            key={p}
            onClick={() => setPeriod(p)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              period === p
                ? "bg-[#0f172a] text-white shadow-sm dark:shadow-gray-800/20"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:text-gray-300"
            }`}
          >
            {p === "7d" ? "7 jours" : p === "30d" ? "30 jours" : p === "90d" ? "90 jours" : "1 an"}
          </button>
        ))}
      </div>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Indicateurs clés
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {kpis.map((kpi) => (
            <Card key={kpi.label} hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">{kpi.label}</span>
                <div className={`rounded-xl p-2.5 ${kpi.color}`}>
                  <kpi.icon className="h-5 w-5" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">{kpi.value}</p>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Graphiques
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#0f172a]">Revenus</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Évolution des revenus</p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                {(["7d", "30d", "90d", "1y"] as ChartPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setRevenuePeriod(p)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      revenuePeriod === p
                        ? "bg-white dark:bg-gray-800 text-[#0f172a] shadow-sm dark:shadow-gray-800/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {p === "7d" ? "7j" : p === "30d" ? "30j" : p === "90d" ? "90j" : "1an"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.revenueChart}>
                  <defs>
                    <linearGradient id="revenueGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" stopOpacity={0.3} />
                      <stop offset="100%" stopColor="#6366f1" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`}
                  />
                  <Tooltip
                    formatter={(value: number) => [formatPrice(value), "Revenus"]}
                    labelFormatter={(label) => formatFullDate(label)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#6366f1"
                    strokeWidth={2}
                    fill="url(#revenueGradient)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#0f172a]">Ventes</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Nombre de commandes</p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                {(["7d", "30d", "90d", "1y"] as ChartPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setSalesPeriod(p)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      salesPeriod === p
                        ? "bg-white dark:bg-gray-800 text-[#0f172a] shadow-sm dark:shadow-gray-800/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {p === "7d" ? "7j" : p === "30d" ? "30j" : p === "90d" ? "90j" : "1an"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data.salesChart} barSize={24}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value: number) => [value, "Ventes"]}
                    labelFormatter={(label) => formatFullDate(label)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                    }}
                  />
                  <Bar dataKey="sales" fill="#0f172a" radius={[6, 6, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#0f172a]">Utilisateurs</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Croissance des utilisateurs</p>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 p-1">
                {(["7d", "30d", "90d", "1y"] as ChartPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setUsersPeriod(p)}
                    className={`rounded-md px-2.5 py-1 text-xs font-medium transition-colors ${
                      usersPeriod === p
                        ? "bg-white dark:bg-gray-800 text-[#0f172a] shadow-sm dark:shadow-gray-800/20"
                        : "text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300"
                    }`}
                  >
                    {p === "7d" ? "7j" : p === "30d" ? "30j" : p === "90d" ? "90j" : "1an"}
                  </button>
                ))}
              </div>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data.usersChart}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis
                    dataKey="date"
                    tickFormatter={formatDate}
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    allowDecimals={false}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) => [
                      value,
                      name === "newUsers" ? "Nouveaux" : "Total",
                    ]}
                    labelFormatter={(label) => formatFullDate(label)}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                    }}
                  />
                  <Legend
                    formatter={(value) => (value === "newUsers" ? "Nouveaux" : "Total")}
                  />
                  <Line
                    type="monotone"
                    dataKey="newUsers"
                    stroke="#10b981"
                    strokeWidth={2}
                    dot={{ fill: "#10b981", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="totalUsers"
                    stroke="#6366f1"
                    strokeWidth={2}
                    dot={{ fill: "#6366f1", r: 3 }}
                    activeDot={{ r: 5 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-[#0f172a]">Revenus par boutique</h3>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Répartition des revenus</p>
              </div>
            </div>
            <div className="mt-6 h-72">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={data.topShops.slice(0, 8)}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={4}
                    dataKey="revenue"
                    nameKey="name"
                  >
                    {data.topShops.slice(0, 8).map((_, index) => (
                      <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(value: number) => [formatPrice(value), "Revenus"]}
                    contentStyle={{
                      borderRadius: "12px",
                      border: "1px solid #e2e8f0",
                      boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                    }}
                  />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Top classements
        </h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-indigo-100 p-2">
                <Trophy className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-[#0f172a]">Top Vendeurs</h3>
            </div>
            <div className="space-y-3">
              {data.topVendors.slice(0, 5).map((vendor, i) => (
                <div key={vendor.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0f172a]">
                      {vendor.name || vendor.email}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(vendor.revenue)}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                    {vendor.orders} cmd
                  </span>
                </div>
              ))}
              {data.topVendors.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">Aucune donnée</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-emerald-100 p-2">
                <BarChart3 className="h-4 w-4 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-[#0f172a]">Top Boutiques</h3>
            </div>
            <div className="space-y-3">
              {filteredTopShops.slice(0, 5).map((shop, i) => (
                <div key={shop.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0f172a]">{shop.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(shop.revenue)}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                    {shop.orders} cmd
                  </span>
                </div>
              ))}
              {filteredTopShops.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">Aucune donnée</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-amber-100 p-2">
                <ShoppingCart className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="font-semibold text-[#0f172a]">Top Produits</h3>
            </div>
            <div className="space-y-3">
              {filteredTopProducts.slice(0, 5).map((product, i) => (
                <div key={product.id} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0f172a]">{product.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(product.revenue)}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                    {product.salesCount} ventes
                  </span>
                </div>
              ))}
              {filteredTopProducts.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">Aucune donnée</p>
              )}
            </div>
          </Card>

          <Card className="p-5">
            <div className="mb-4 flex items-center gap-2">
              <div className="rounded-lg bg-purple-100 p-2">
                <Activity className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-[#0f172a]">Top Catégories</h3>
            </div>
            <div className="space-y-3">
              {data.topCategories.slice(0, 5).map((cat, i) => (
                <div key={cat.name} className="flex items-center gap-3">
                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-xs font-bold text-gray-600 dark:text-gray-400">
                    {i + 1}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-[#0f172a]">{cat.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{formatPrice(cat.totalRevenue)}</p>
                  </div>
                  <span className="whitespace-nowrap text-xs text-gray-400 dark:text-gray-500">
                    {cat.totalSales} ventes
                  </span>
                </div>
              ))}
              {data.topCategories.length === 0 && (
                <p className="py-4 text-center text-sm text-gray-400 dark:text-gray-500">Aucune donnée</p>
              )}
            </div>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Métriques de conversion
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <Card hover className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux de conversion</span>
              <div className="rounded-xl bg-emerald-100 p-2.5">
                <Percent className="h-5 w-5 text-emerald-600" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-[#0f172a]">
              {data.conversion.rate}%
            </p>
            <div className="mt-2 flex items-center gap-1">
              {data.conversion.rate >= 50 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  data.conversion.rate >= 50 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {data.conversion.rate >= 50 ? "Bon" : "À améliorer"}
              </span>
            </div>
          </Card>

          <Card hover className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux d&apos;abandon panier</span>
              <div className="rounded-xl bg-red-100 p-2.5">
                <ShoppingCart className="h-5 w-5 text-red-600" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-[#0f172a]">
              {data.conversion.abandonedCart}%
            </p>
            <div className="mt-2 flex items-center gap-1">
              <ArrowUpRight className="h-3.5 w-3.5 text-red-500" />
              <span className="text-xs font-medium text-red-500">
                {data.conversion.abandonedCart > 30 ? "Élevé" : "Normal"}
              </span>
            </div>
          </Card>

          <Card hover className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Panier moyen</span>
              <div className="rounded-xl bg-amber-100 p-2.5">
                <Target className="h-5 w-5 text-amber-600" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-[#0f172a]">
              {formatPrice(data.conversion.avgOrder)}
            </p>
            <div className="mt-2 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <span className="text-xs text-gray-500 dark:text-gray-400">Moyenne 30j</span>
            </div>
          </Card>

          <Card hover className="p-5">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Taux de retour</span>
              <div className="rounded-xl bg-orange-100 p-2.5">
                <RefreshCw className="h-5 w-5 text-orange-600" />
              </div>
            </div>
            <p className="mt-3 text-2xl font-bold text-[#0f172a]">
              {data.conversion.returnRate}%
            </p>
            <div className="mt-2 flex items-center gap-1">
              {data.conversion.returnRate <= 5 ? (
                <ArrowUpRight className="h-3.5 w-3.5 text-emerald-500" />
              ) : (
                <ArrowDownRight className="h-3.5 w-3.5 text-red-500" />
              )}
              <span
                className={`text-xs font-medium ${
                  data.conversion.returnRate <= 5 ? "text-emerald-600" : "text-red-500"
                }`}
              >
                {data.conversion.returnRate <= 5 ? "Bon" : "Élevé"}
              </span>
            </div>
          </Card>
        </div>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Performance produits
        </h2>
        <div className="grid gap-6 lg:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-blue-100 p-2">
                <TrendingUp className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-[#0f172a]">Produits les plus vendus</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    <th className="pb-3 pr-4">Produit</th>
                    <th className="pb-3 pr-4">Boutique</th>
                    <th className="pb-3 pr-4">Ventes</th>
                    <th className="pb-3">Revenus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {data.topProducts.slice(0, 8).map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/50 dark:bg-gray-800/30">
                      <td className="py-3 pr-4 font-medium text-[#0f172a]">{product.name}</td>
                      <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{product.shopName}</td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{product.salesCount}</td>
                      <td className="py-3 font-medium text-[#0f172a]">
                        {formatPrice(product.revenue)}
                      </td>
                    </tr>
                  ))}
                  {data.topProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                        Aucune donnée disponible
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-purple-100 p-2">
                <DollarSign className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-[#0f172a]">Produits les plus rentables</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    <th className="pb-3 pr-4">Produit</th>
                    <th className="pb-3 pr-4">Boutique</th>
                    <th className="pb-3 pr-4">Prix</th>
                    <th className="pb-3">Revenus</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {[...data.topProducts]
                    .sort((a, b) => b.revenue - a.revenue)
                    .slice(0, 8)
                    .map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/50 dark:bg-gray-800/30">
                        <td className="py-3 pr-4 font-medium text-[#0f172a]">{product.name}</td>
                        <td className="py-3 pr-4 text-gray-500 dark:text-gray-400">{product.shopName}</td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{formatPrice(product.price)}</td>
                        <td className="py-3 font-medium text-[#0f172a]">
                          {formatPrice(product.revenue)}
                        </td>
                      </tr>
                    ))}
                  {data.topProducts.length === 0 && (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                        Aucune donnée disponible
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <Card className="mt-6 p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="rounded-lg bg-teal-100 p-2">
              <BarChart3 className="h-4 w-4 text-teal-600" />
            </div>
            <h3 className="font-semibold text-[#0f172a]">Ventes par produit</h3>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data.topProducts.slice(0, 10)} barSize={32} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis
                  type="number"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fontSize: 11, fill: "#94a3b8" }}
                  axisLine={false}
                  tickLine={false}
                  width={120}
                />
                <Tooltip
                  formatter={(value: number) => [value, "Ventes"]}
                  contentStyle={{
                    borderRadius: "12px",
                    border: "1px solid #e2e8f0",
                    boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)",
                  }}
                />
                <Bar dataKey="salesCount" fill="#0f172a" radius={[0, 6, 6, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </section>

      <section>
        <h2 className="mb-4 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
          Filtres et actions
        </h2>
        <Card className="p-6">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Période</label>
              <div className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
                {(["7d", "30d", "90d", "1y"] as ChartPeriod[]).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`flex-1 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                      period === p
                        ? "bg-[#0f172a] text-white shadow-sm dark:shadow-gray-800/20"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {p === "7d" ? "7j" : p === "30d" ? "30j" : p === "90d" ? "90j" : "1an"}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date début</label>
              <Input
                type="date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Date fin</label>
              <Input
                type="date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Filtrer par boutique</label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
                <Input
                  type="text"
                  placeholder="Nom de la boutique..."
                  value={shopFilter}
                  onChange={(e) => setShopFilter(e.target.value)}
                  className="w-full pl-9"
                />
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50 pt-4">
            <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              <Filter className="h-4 w-4" />
              <span>
                {shopFilter
                  ? `Filtré par "${shopFilter}"`
                  : "Toutes les boutiques"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setShopFilter("");
                  setDateFrom("");
                  setDateTo("");
                }}
                className="rounded-lg px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Réinitialiser
              </button>
              <button
                onClick={handleExport}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-white shadow-sm dark:shadow-gray-800/20 transition-colors hover:bg-[#1e293b]"
              >
                <Download className="h-4 w-4" />
                Exporter les données
              </button>
            </div>
          </div>
        </Card>
      </section>
    </div>
  );
}
