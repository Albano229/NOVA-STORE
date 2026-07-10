"use client";

import { useEffect, useState } from "react";
import { Users, Gift, TrendingUp, Settings, Save, ExternalLink, Trophy, Search } from "lucide-react";
import toast from "react-hot-toast";

interface AdminReferralData {
  stats: {
    total_referrals: string;
    confirmed: string;
    pending: string;
    total_rewards: string;
    users_with_code: string;
  };
  config: {
    rewardAmount: number;
    rewardType: string;
    minPurchaseAmount: number;
    maxReferralsPerUser: number;
    isActive: boolean;
  } | null;
  topReferrers: Array<{
    id: string;
    name: string;
    email: string;
    referralCode: string;
    referral_count: string;
    total_earned: number;
  }>;
  recent: Array<{
    id: string;
    status: string;
    rewardAmount: number;
    createdAt: string;
    referrer_name: string;
    referrer_email: string;
    referee_name: string;
    referee_email: string;
  }>;
}

export default function AdminReferralsPage() {
  const [data, setData] = useState<AdminReferralData | null>(null);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState({
    rewardAmount: 500,
    rewardType: "CREDIT",
    minPurchaseAmount: 0,
    maxReferralsPerUser: 50,
    isActive: true,
  });
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/admin/referrals")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        if (d.config) setConfig(d.config);
      })
      .finally(() => setLoading(false));
  }, []);

  const saveConfig = async () => {
    try {
      const res = await fetch("/api/admin/referrals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (res.ok) toast.success("Configuration sauvegardée");
      else toast.error("Erreur");
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const filteredReferrers = (data?.topReferrers || []).filter(
    (r) =>
      r.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.referralCode?.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-5">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 sm:p-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Parrainage</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gérer le programme de parrainage</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
        <StatCard icon={Users} label="Parrainages" value={data?.stats?.total_referrals || "0"} color="text-blue-500" />
        <StatCard icon={TrendingUp} label="Confirmés" value={data?.stats?.confirmed || "0"} color="text-emerald-500" />
        <StatCard icon={Gift} label="En attente" value={data?.stats?.pending || "0"} color="text-amber-500" />
        <StatCard icon={Trophy} label="Récompenses" value={`${Number(data?.stats?.total_rewards || 0).toLocaleString()} F`} color="text-[#7126b6]" />
        <StatCard icon={Users} label="Avec code" value={data?.stats?.users_with_code || "0"} color="text-indigo-500" />
      </div>

      {/* Config */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center gap-2">
          <Settings className="h-5 w-5 text-[#7126b6]" />
          <h2 className="font-semibold text-gray-900 dark:text-white">Configuration</h2>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Montant récompense (F)</label>
            <input
              type="number"
              value={config.rewardAmount}
              onChange={(e) => setConfig({ ...config, rewardAmount: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Type de récompense</label>
            <select
              value={config.rewardType}
              onChange={(e) => setConfig({ ...config, rewardType: e.target.value })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
            >
              <option value="CREDIT">Crédit boutique</option>
              <option value="DISCOUNT">Réduction</option>
              <option value="CASH">Cash</option>
            </select>
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Achat minimum (F)</label>
            <input
              type="number"
              value={config.minPurchaseAmount}
              onChange={(e) => setConfig({ ...config, minPurchaseAmount: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <div>
            <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">Max parrainages/utilisateur</label>
            <input
              type="number"
              value={config.maxReferralsPerUser}
              onChange={(e) => setConfig({ ...config, maxReferralsPerUser: Number(e.target.value) })}
              className="w-full rounded-lg border border-gray-300 bg-white px-3 py-2 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <div className="flex items-end">
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={config.isActive}
                onChange={(e) => setConfig({ ...config, isActive: e.target.checked })}
                className="h-4 w-4 rounded border-gray-300 text-[#7126b6] focus:ring-[#7126b6]"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">Programme actif</span>
            </label>
          </div>
        </div>
        <button
          onClick={saveConfig}
          className="mt-4 flex items-center gap-2 rounded-lg bg-[#7126b6] px-4 py-2 text-sm font-medium text-white hover:bg-[#5a1f94]"
        >
          <Save className="h-4 w-4" />
          Sauvegarder
        </button>
      </div>

      {/* Top Referrers */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900 dark:text-white">Meilleurs parrains</h2>
          <div className="relative">
            <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="rounded-lg border border-gray-300 bg-white pl-8 pr-3 py-1.5 text-sm dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
        </div>
        {filteredReferrers.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200 dark:border-gray-700">
                  <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">Utilisateur</th>
                  <th className="pb-2 text-left font-medium text-gray-500 dark:text-gray-400">Code</th>
                  <th className="pb-2 text-center font-medium text-gray-500 dark:text-gray-400">Parrainés</th>
                  <th className="pb-2 text-right font-medium text-gray-500 dark:text-gray-400">Gagné</th>
                </tr>
              </thead>
              <tbody>
                {filteredReferrers.map((r, i) => (
                  <tr key={r.id} className="border-b border-gray-100 dark:border-gray-700/50">
                    <td className="py-2.5">
                      <div className="flex items-center gap-2">
                        {i < 3 && <Trophy className={`h-4 w-4 ${i === 0 ? "text-yellow-500" : i === 1 ? "text-gray-400" : "text-amber-600"}`} />}
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">{r.name || "—"}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">{r.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-2.5 font-mono text-xs text-[#7126b6]">{r.referralCode}</td>
                    <td className="py-2.5 text-center font-medium text-gray-900 dark:text-white">{r.referral_count}</td>
                    <td className="py-2.5 text-right font-semibold text-[#7126b6]">{r.total_earned.toLocaleString()} F</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">Aucun parrainage encore</p>
        )}
      </div>

      {/* Recent Referrals */}
      <div className="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 font-semibold text-gray-900 dark:text-white">Parrainages récents</h2>
        {data?.recent && data.recent.length > 0 ? (
          <div className="space-y-2">
            {data.recent.map((r) => (
              <div key={r.id} className="flex items-center justify-between rounded-lg bg-gray-50 px-4 py-3 dark:bg-gray-700/50">
                <div className="min-w-0">
                  <p className="text-sm text-gray-900 dark:text-white">
                    <span className="font-medium">{r.referrer_name || r.referrer_email}</span>
                    {" → "}
                    <span className="text-gray-600 dark:text-gray-400">{r.referee_name || r.referee_email}</span>
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(r.createdAt).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                  r.status === "CONFIRMED" ? "bg-emerald-100 text-emerald-700" :
                  r.status === "PENDING" ? "bg-amber-100 text-amber-700" :
                  "bg-gray-100 text-gray-600"
                }`}>
                  {r.status === "CONFIRMED" ? "Confirmé" : r.status === "PENDING" ? "En attente" : r.status}
                </span>
              </div>
            ))}
          </div>
        ) : (
          <p className="py-4 text-center text-sm text-gray-500 dark:text-gray-400">Aucun parrainage récent</p>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: string; color: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
      <Icon className={`mb-2 h-5 w-5 ${color}`} />
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}
