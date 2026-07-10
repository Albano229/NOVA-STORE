"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import {
  SalesLineChart,
  RevenueBarChart,
  AreaChartCustom,
  CategoryPieChart,
} from "@/components/charts";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Users,
  UserCheck,
  CreditCard,
  Wallet,
  Smartphone,
  Landmark,
  Calendar,
  ArrowUpRight,
  Clock,
  Star,
} from "lucide-react";

const filters = [
  { label: "Aujourd'hui", value: "today" },
  { label: "7 jours", value: "7d" },
  { label: "30 jours", value: "30d" },
  { label: "3 mois", value: "3m" },
  { label: "12 mois", value: "12m" },
];

const CATEGORY_COLORS = ["#7126B6", "#7C3AED", "#10B981", "#F59E0B", "#F43F5E"];
const PAYMENT_COLORS: Record<string, string> = {
  STRIPE: "#6366F1",
  FLUTTERWAVE: "#10B981",
  FEDAPAY: "#F59E0B",
  PAYPAL: "#3B82F6",
  unknown: "#94A3B8",
};
const PAYMENT_ICONS: Record<string, typeof CreditCard> = {
  STRIPE: CreditCard,
  FLUTTERWAVE: Smartphone,
  FEDAPAY: Landmark,
  PAYPAL: Wallet,
  unknown: Wallet,
};

interface AnalyticsData {
  revenue: { current: number; previous: number; change: number };
  orders: { current: number; previous: number; change: number };
  visitors: { current: number; previous: number; change: number };
  conversionRate: number;
  avgOrderValue: number;
  customers: { unique: number; repeat: number };
  paymentMethods: { method: string; value: number }[];
  recentOrders: { orderNumber: string; total: number; status: string; customerName: string; createdAt: string }[];
  bestDays: { day: string; orders: number; revenue: number }[];
  salesEvolution: { name: string; value: number }[];
  ordersByDay: { name: string; value: number }[];
  categoryData: { name: string; value: number }[];
  topProducts: { name: string; value: number }[];
}

function SkeletonBlock({ className }: { className?: string }) {
  return <div className={cn("animate-pulse rounded-xl bg-gray-200", className)} />;
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-amber-100 text-amber-700" },
  CONFIRMED: { label: "Confirmée", color: "bg-blue-100 text-blue-700" },
  SHIPPED: { label: "Expédiée", color: "bg-purple-100 text-purple-700" },
  DELIVERED: { label: "Livrée", color: "bg-green-100 text-green-700" },
  COMPLETED: { label: "Terminée", color: "bg-green-100 text-green-700" },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-700" },
};

export default function VendorAnalytics() {
  const [activeFilter, setActiveFilter] = useState("7d");
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<AnalyticsData | null>(null);

  useEffect(() => {
    setLoading(true);
    fetch(`/api/vendor/analytics?period=${activeFilter}`)
      .then((res) => res.json())
      .then((d) => {
        if (!d.error) setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [activeFilter]);

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="flex gap-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-9 w-24 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-24" />
          ))}
        </div>
        <div className="grid gap-6 sm:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <SkeletonBlock key={i} className="h-72" />
          ))}
        </div>
      </div>
    );
  }

  const salesEvolution = data?.salesEvolution || [];
  const ordersByDay = data?.ordersByDay || [];
  const categoryData = data?.categoryData || [];
  const topProductsData = data?.topProducts || [];
  const paymentMethods = data?.paymentMethods || [];
  const recentOrders = data?.recentOrders || [];
  const bestDays = data?.bestDays || [];

  const totalPaymentRevenue = paymentMethods.reduce((sum, p) => sum + p.value, 0);
  const repeatRate = data?.customers && data.customers.unique > 0
    ? Math.round((data.customers.repeat / data.customers.unique) * 100)
    : 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Analytics</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Suivez les performances de votre boutique</p>
      </div>

      {/* Summary Cards - 6 columns */}
      {data && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase text-gray-400">Revenus</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-indigo-100 dark:bg-indigo-900/50">
                <TrendingUp className="h-3.5 w-3.5 text-indigo-600" />
              </div>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">{data.revenue.current.toLocaleString("fr-FR")} FCFA</p>
            <span className={`text-[10px] font-medium ${data.revenue.change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {data.revenue.change >= 0 ? "+" : ""}{data.revenue.change}%
            </span>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase text-gray-400">Commandes</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100 dark:bg-emerald-900/50">
                <ShoppingCart className="h-3.5 w-3.5 text-emerald-600" />
              </div>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">{data.orders.current}</p>
            <span className={`text-[10px] font-medium ${data.orders.change >= 0 ? "text-emerald-600" : "text-red-500"}`}>
              {data.orders.change >= 0 ? "+" : ""}{data.orders.change}%
            </span>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase text-gray-400">Panier moyen</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-amber-100 dark:bg-amber-900/50">
                <Star className="h-3.5 w-3.5 text-amber-600" />
              </div>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">{data.avgOrderValue.toLocaleString("fr-FR")} FCFA</p>
            <span className="text-[10px] text-gray-400">Par commande</span>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase text-gray-400">Clients</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/50">
                <Users className="h-3.5 w-3.5 text-purple-600" />
              </div>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">{data.customers?.unique || 0}</p>
            <span className="text-[10px] text-gray-400">Uniques ce mois</span>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase text-gray-400">Fidélité</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-rose-100 dark:bg-rose-900/50">
                <UserCheck className="h-3.5 w-3.5 text-rose-600" />
              </div>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">{repeatRate}%</p>
            <span className="text-[10px] text-gray-400">Clients récurrents</span>
          </div>
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <div className="flex items-center justify-between">
              <p className="text-[10px] font-medium uppercase text-gray-400">Conversion</p>
              <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-100 dark:bg-cyan-900/50">
                <TrendingUp className="h-3.5 w-3.5 text-cyan-600" />
              </div>
            </div>
            <p className="mt-2 text-lg font-bold text-gray-900 dark:text-gray-100">{data.conversionRate}%</p>
            <span className="text-[10px] text-gray-400">Visiteurs → Acheteurs</span>
          </div>
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter.value}
            onClick={() => setActiveFilter(filter.value)}
            className={cn(
              "rounded-lg px-4 py-2 text-sm font-medium transition-all",
              activeFilter === filter.value
                ? "bg-[#7126b6] text-white shadow-sm"
                : "border border-gray-200 dark:border-gray-700 bg-white text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            )}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Charts Grid 2x2 */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Sales Evolution */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Évolution des ventes</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Chiffre d&apos;affaires par jour</p>
          <div className="mt-4">
            {salesEvolution.length > 0 ? (
              <AreaChartCustom data={salesEvolution} height={260} color="#7126b6" />
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                Aucune donnée pour cette période
              </div>
            )}
          </div>
        </div>

        {/* Orders by Day */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Commandes par jour</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Nombre de commandes cette semaine</p>
          <div className="mt-4">
            {ordersByDay.length > 0 ? (
              <SalesLineChart data={ordersByDay} height={260} color="#10B981" dataKey="value" />
            ) : (
              <div className="flex h-[260px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
                Aucune commande cette semaine
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Section - 3 columns */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {/* Category Distribution */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Répartition des catégories</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Ventes par catégorie</p>
          {categoryData.length > 0 ? (
            <div className="mt-4 space-y-3">
              {categoryData.map((cat, i) => {
                const pct = totalPaymentRevenue > 0 ? Math.round((cat.value / categoryData.reduce((s, c) => s + c.value, 0)) * 100) : 0;
                return (
                  <div key={cat.name}>
                    <div className="flex items-center justify-between mb-1">
                      <div className="flex items-center gap-2">
                        <span className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: CATEGORY_COLORS[i] }} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{cat.name}</span>
                      </div>
                      <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{cat.value.toLocaleString("fr-FR")} FCFA</span>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                      <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: CATEGORY_COLORS[i] }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              Aucune donnée de catégorie
            </div>
          )}
        </div>

        {/* Payment Methods */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Modes de paiement</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Répartition des revenus</p>
          {paymentMethods.length > 0 ? (
            <div className="mt-4">
              <div className="flex justify-center">
                <ResponsiveContainer width="100%" height={160}>
                  <PieChart>
                    <Pie
                      data={paymentMethods.map((p) => ({ ...p, name: p.method || "Autre" }))}
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={70}
                      dataKey="value"
                      paddingAngle={3}
                    >
                      {paymentMethods.map((entry, index) => (
                        <Cell key={entry.method} fill={PAYMENT_COLORS[entry.method] || PAYMENT_COLORS.unknown} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v: number) => [`${v.toLocaleString("fr-FR")} FCFA`, "Revenu"]} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 space-y-2">
                {paymentMethods.map((pm) => {
                  const Icon = PAYMENT_ICONS[pm.method] || Wallet;
                  const pct = totalPaymentRevenue > 0 ? Math.round((pm.value / totalPaymentRevenue) * 100) : 0;
                  return (
                    <div key={pm.method} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Icon className="h-3.5 w-3.5" style={{ color: PAYMENT_COLORS[pm.method] || PAYMENT_COLORS.unknown }} />
                        <span className="text-sm text-gray-600 dark:text-gray-400">{pm.method || "Autre"}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-400">{pct}%</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{pm.value.toLocaleString("fr-FR")}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              Aucune donnée
            </div>
          )}
        </div>

        {/* Best Days */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Meilleurs jours</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Performance par jour de la semaine</p>
          {bestDays.length > 0 ? (
            <div className="mt-4 space-y-2.5">
              {bestDays.sort((a, b) => b.revenue - a.revenue).map((day) => {
                const maxRevenue = Math.max(...bestDays.map((d) => d.revenue));
                const pct = maxRevenue > 0 ? (day.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={day.day}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-700 dark:text-gray-300 capitalize">{day.day}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] text-gray-400">{day.orders} cmd</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{day.revenue.toLocaleString("fr-FR")}</span>
                      </div>
                    </div>
                    <div className="h-1.5 rounded-full bg-gray-100 dark:bg-gray-700">
                      <div className="h-full rounded-full bg-[#7126b6]" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[200px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              Aucune donnée
            </div>
          )}
        </div>
      </div>

      {/* Bottom Section 2 - Top Products + Recent Orders */}
      <div className="grid gap-6 sm:grid-cols-2">
        {/* Top Products Horizontal Bar */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Top produits</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400">Classement par revenu</p>
          {topProductsData.length > 0 ? (
            <div className="mt-4">
              <ResponsiveContainer width="100%" height={260}>
                <BarChart
                  data={topProductsData}
                  layout="vertical"
                  margin={{ top: 0, right: 20, left: 0, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
                  <XAxis
                    type="number"
                    tick={{ fontSize: 11, fill: "#94a3b8" }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={(v) => `${(v / 1000000).toFixed(1)}M`}
                  />
                  <YAxis
                    type="category"
                    dataKey="name"
                    tick={{ fontSize: 11, fill: "#64748b" }}
                    axisLine={false}
                    tickLine={false}
                    width={130}
                  />
                  <Tooltip
                    formatter={(value) => [`${Number(value).toLocaleString("fr-FR")} FCFA`, "Revenu"]}
                    contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.05)" }}
                  />
                  <Bar dataKey="value" radius={[0, 6, 6, 0]} maxBarSize={28}>
                    {topProductsData.map((_entry: { name: string; value: number }, index: number) => (
                      <Cell key={`cell-${index}`} fill={CATEGORY_COLORS[index % CATEGORY_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              Aucun produit vendu
            </div>
          )}
        </div>

        {/* Recent Orders */}
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-semibold text-gray-900 dark:text-gray-100">Dernières commandes</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400">5 commandes récentes</p>
            </div>
            <Clock className="h-4 w-4 text-gray-400" />
          </div>
          {recentOrders.length > 0 ? (
            <div className="mt-4 space-y-3">
              {recentOrders.map((order) => {
                const st = statusConfig[order.status] || { label: order.status, color: "bg-gray-100 text-gray-500" };
                return (
                  <div key={order.orderNumber} className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-700/50 px-4 py-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{order.orderNumber}</span>
                        <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", st.color)}>{st.label}</span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{order.customerName}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{order.total.toLocaleString("fr-FR")} FCFA</p>
                      <p className="text-[10px] text-gray-400">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="flex h-[260px] items-center justify-center text-sm text-gray-400 dark:text-gray-500">
              Aucune commande récente
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
