"use client";

import { useState, useEffect } from "react";
import { Star, Save, Loader2, Users, TrendingUp } from "lucide-react";
import toast from "react-hot-toast";

interface LoyaltyConfig {
  isEnabled: boolean;
  pointsPerCurrency: number;
  redeemRate: number;
  minRedeem: number;
}

interface LoyaltyStats {
  members: number;
  totalPointsEarned: number;
}

export default function VendorLoyaltyPage() {
  const [config, setConfig] = useState<LoyaltyConfig>({
    isEnabled: true,
    pointsPerCurrency: 1.0,
    redeemRate: 100.0,
    minRedeem: 500,
  });
  const [stats, setStats] = useState<LoyaltyStats>({ members: 0, totalPointsEarned: 0 });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/vendor/loyalty")
      .then((r) => r.json())
      .then((data) => {
        if (data.config) setConfig(data.config);
        if (data.stats) setStats(data.stats);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/vendor/loyalty", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(config),
      });
      if (!res.ok) throw new Error("Erreur");
      toast.success("Configuration sauvegardée !");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#7126b6]" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Programme de fidélité
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Configurez le programme de fidélité pour votre boutique
        </p>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7126b6]/10">
              <Users className="h-5 w-5 text-[#7126b6]" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.members}
              </p>
              <p className="text-xs text-gray-500">Membres actifs</p>
            </div>
          </div>
        </div>
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50">
              <TrendingUp className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stats.totalPointsEarned.toLocaleString()}
              </p>
              <p className="text-xs text-gray-500">Points distribués</p>
            </div>
          </div>
        </div>
      </div>

      {/* Config */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <div className="flex items-center gap-3 mb-6">
          <Star className="h-5 w-5 text-[#7126b6]" />
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
            Configuration
          </h2>
        </div>

        <div className="space-y-6">
          {/* Enable/Disable */}
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Activer le programme
              </p>
              <p className="text-xs text-gray-500">
                Les clients gagneront des points à chaque achat
              </p>
            </div>
            <button
              onClick={() => setConfig({ ...config, isEnabled: !config.isEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                config.isEnabled ? "bg-[#7126b6]" : "bg-gray-200"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  config.isEnabled ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          {/* Points per currency */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Points par FCFA dépensé
            </label>
            <input
              type="number"
              value={config.pointsPerCurrency}
              onChange={(e) =>
                setConfig({ ...config, pointsPerCurrency: parseFloat(e.target.value) || 1 })
              }
              step="0.1"
              min="0.1"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">
              Ex: 1.0 = 1 point pour 1 FCFA dépensé. Un achat de 10 000 FCFA = 10 000 points
            </p>
          </div>

          {/* Redeem rate */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Points nécessaires pour 1 FCFA de réduction
            </label>
            <input
              type="number"
              value={config.redeemRate}
              onChange={(e) =>
                setConfig({ ...config, redeemRate: parseFloat(e.target.value) || 100 })
              }
              step="10"
              min="10"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm"
            />
            <p className="mt-1 text-xs text-gray-400">
              Ex: 100 = 100 points = 1 FCFA de réduction. 500 points = 5 FCFA de réduction
            </p>
          </div>

          {/* Min redeem */}
          <div className="rounded-xl border border-gray-200 dark:border-gray-700 p-4">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300 block mb-2">
              Minimum de points pour échanger
            </label>
            <input
              type="number"
              value={config.minRedeem}
              onChange={(e) =>
                setConfig({ ...config, minRedeem: parseInt(e.target.value) || 500 })
              }
              step="100"
              min="100"
              className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm"
            />
          </div>

          {/* Preview */}
          <div className="rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4">
            <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Aperçu
            </p>
            <div className="text-xs text-gray-500 space-y-1">
              <p>• Un achat de <strong>10 000 FCFA</strong> = <strong>{(10000 * config.pointsPerCurrency).toLocaleString()}</strong> points gagnés</p>
              <p>• Pour échanger <strong>{config.minRedeem.toLocaleString()}</strong> points = réduction de <strong>{(config.minRedeem / config.redeemRate).toLocaleString()} FCFA</strong></p>
            </div>
          </div>

          <button
            onClick={handleSave}
            disabled={saving}
            className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7126b6] px-4 py-3 text-sm font-medium text-white hover:bg-[#5c1e96] disabled:opacity-50"
          >
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
            Sauvegarder
          </button>
        </div>
      </div>
    </div>
  );
}
