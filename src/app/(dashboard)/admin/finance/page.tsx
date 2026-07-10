"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatPrice } from "@/lib/utils";
import { DollarSign, TrendingUp, Clock, Download } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

interface FinanceStats {
  totalRevenue: number;
  earnedCommissions: number;
  pendingPayouts: number;
  chartData: { month: string; revenue: number; commissions: number }[];
}

export default function AdminFinancePage() {
  const [stats, setStats] = useState<FinanceStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/stats")
      .then((r) => r.json())
      .then((data) => {
        setStats({
          totalRevenue: data.totalRevenue,
          earnedCommissions: data.earnedCommissions,
          pendingPayouts: data.pendingPayouts,
          chartData: data.chartRevenue?.map((d: any) => ({
            month: d.month,
            revenue: d.revenue,
            commissions: d.revenue * 0.05,
          })) || [],
        });
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-32 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Finance</h1>
          <p className="mt-1 text-sm text-gray-500">Revenus et commissions de la plateforme</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-[#0f172a] px-3 py-2 text-sm font-medium text-white hover:bg-[#1e293b]">
          <Download className="h-4 w-4" />
          Exporter CSV
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Revenus totaux</span>
            <div className="rounded-xl bg-green-100 p-2.5">
              <DollarSign className="h-5 w-5 text-green-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#0f172a]">{formatPrice(stats?.totalRevenue || 0)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Commissions gagnées</span>
            <div className="rounded-xl bg-emerald-100 p-2.5">
              <TrendingUp className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#0f172a]">{formatPrice(stats?.earnedCommissions || 0)}</p>
        </Card>
        <Card className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500">Retraits en attente</span>
            <div className="rounded-xl bg-orange-100 p-2.5">
              <Clock className="h-5 w-5 text-orange-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#0f172a]">{formatPrice(stats?.pendingPayouts || 0)}</p>
        </Card>
      </div>

      <Card className="p-6">
        <h2 className="text-lg font-semibold text-[#0f172a]">Revenus mensuels</h2>
        <p className="mt-1 text-sm text-gray-500">Évolution des revenus et commissions</p>
        <div className="mt-6 h-72">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={stats?.chartData || []} barSize={24}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} />
              <YAxis tick={{ fontSize: 12, fill: "#94a3b8" }} axisLine={false} tickLine={false} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                formatter={(value: any, name: any) => [formatPrice(Number(value)), name === "revenue" ? "Revenus" : "Commissions"]}
                contentStyle={{ borderRadius: "12px", border: "1px solid #e2e8f0" }}
              />
              <Bar dataKey="revenue" fill="#0f172a" radius={[6, 6, 0, 0]} name="revenue" />
              <Bar dataKey="commissions" fill="#7126b6" radius={[6, 6, 0, 0]} name="commissions" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
