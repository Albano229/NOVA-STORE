"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { Star, Gift, ArrowUpRight, ArrowDownRight, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface LoyaltyHistory {
  id: string;
  shopId: string;
  shopName: string;
  orderId: string | null;
  points: number;
  type: string;
  description: string;
  createdAt: string;
}

interface ShopBalance {
  shopId: string;
  shopName: string;
  points: number;
}

export default function LoyaltyPage() {
  const { data: session } = useSession();
  const [totalPoints, setTotalPoints] = useState(0);
  const [history, setHistory] = useState<LoyaltyHistory[]>([]);
  const [byShop, setByShop] = useState<ShopBalance[]>([]);
  const [loading, setLoading] = useState(true);
  const [redeeming, setRedeeming] = useState(false);
  const [selectedShop, setSelectedShop] = useState<string>("");
  const [redeemPoints, setRedeemPoints] = useState("");

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/loyalty/balance")
      .then((r) => r.json())
      .then((data) => {
        setTotalPoints(data.totalPoints || 0);
        setHistory(data.history || []);
        setByShop(data.byShop || []);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session]);

  const handleRedeem = async () => {
    if (!selectedShop || !redeemPoints) {
      toast.error("Sélectionnez une boutique et un montant");
      return;
    }
    setRedeeming(true);
    try {
      const res = await fetch("/api/loyalty/redeem", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId: selectedShop, points: parseInt(redeemPoints) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success(`Réduction de ${data.discount.toLocaleString()} FCFA appliquée !`);
      setTotalPoints(data.newBalance);
      setRedeemPoints("");
      setSelectedShop("");
    } catch (err: any) {
      toast.error(err.message || "Erreur");
    } finally {
      setRedeeming(false);
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
          Accumulez des points à chaque achat et échangez-les contre des réductions
        </p>
      </div>

      {/* Total Points */}
      <div className="rounded-2xl bg-gradient-to-br from-[#7126b6] to-[#5c1e96] p-6 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Star className="h-6 w-6" />
          <span className="text-sm font-medium opacity-80">Mes points</span>
        </div>
        <p className="text-4xl font-bold">{totalPoints.toLocaleString()}</p>
        <p className="mt-1 text-sm opacity-70">points disponibles</p>
      </div>

      {/* By Shop */}
      {byShop.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Points par boutique
          </h2>
          <div className="space-y-3">
            {byShop.map((shop) => (
              <div
                key={shop.shopId}
                className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4"
              >
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {shop.shopName}
                </span>
                <span className="text-sm font-bold text-[#7126b6]">
                  {shop.points.toLocaleString()} pts
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Redeem */}
      {byShop.length > 0 && (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            <Gift className="inline h-5 w-5 mr-2 text-[#7126b6]" />
            Échanger mes points
          </h2>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Boutique
              </label>
              <select
                value={selectedShop}
                onChange={(e) => setSelectedShop(e.target.value)}
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm"
              >
                <option value="">Sélectionner...</option>
                {byShop.map((shop) => (
                  <option key={shop.shopId} value={shop.shopId}>
                    {shop.shopName} ({shop.points} pts)
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1 block">
                Points à échanger
              </label>
              <input
                type="number"
                value={redeemPoints}
                onChange={(e) => setRedeemPoints(e.target.value)}
                placeholder="500"
                min="500"
                className="w-full rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-4 py-2.5 text-sm"
              />
              <p className="mt-1 text-xs text-gray-400">Minimum 500 points</p>
            </div>
            <button
              onClick={handleRedeem}
              disabled={redeeming || !selectedShop || !redeemPoints}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#7126b6] px-4 py-3 text-sm font-medium text-white hover:bg-[#5c1e96] disabled:opacity-50"
            >
              {redeeming ? <Loader2 className="h-4 w-4 animate-spin" /> : <Gift className="h-4 w-4" />}
              Échanger
            </button>
          </div>
        </div>
      )}

      {/* History */}
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
          Historique
        </h2>
        {history.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">
            Aucun point encore. Faites un achat pour commencer !
          </p>
        ) : (
          <div className="space-y-3">
            {history.map((h) => (
              <div
                key={h.id}
                className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-700/50 p-4"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                      h.points > 0 ? "bg-green-100 text-green-600" : "bg-red-100 text-red-600"
                    }`}
                  >
                    {h.points > 0 ? (
                      <ArrowUpRight className="h-4 w-4" />
                    ) : (
                      <ArrowDownRight className="h-4 w-4" />
                    )}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      {h.description || (h.type === "EARN" ? "Points gagnés" : "Points échangés")}
                    </p>
                    <p className="text-xs text-gray-400">
                      {h.shopName} · {new Date(h.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
                <span
                  className={`text-sm font-bold ${
                    h.points > 0 ? "text-green-600" : "text-red-600"
                  }`}
                >
                  {h.points > 0 ? "+" : ""}{h.points}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
