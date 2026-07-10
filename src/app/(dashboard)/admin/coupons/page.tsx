"use client";

import { useState, useEffect, useCallback } from "react";
import {
  Tag,
  Plus,
  Search,
  Copy,
  Trash2,
  Edit3,
  CheckCircle,
  XCircle,
  Percent,
  DollarSign,
  Calendar,
  BarChart3,
  Users,
  Loader2,
  X,
  Eye,
  EyeOff,
  AlertTriangle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discountType: string;
  discountValue: number;
  minOrderAmount: number | null;
  maxDiscount: number | null;
  usageLimit: number | null;
  usedCount: number;
  perUserLimit: number | null;
  shopId: string | null;
  shopName: string | null;
  productIds: string[] | null;
  isActive: boolean;
  startsAt: string | null;
  endsAt: string | null;
  createdBy: string;
  creatorName: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CouponUsage {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  orderId: string;
  amount: number;
  createdAt: string;
}

interface CouponStats {
  total: number;
  active: number;
  inactive: number;
  total_uses: number;
}

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [stats, setStats] = useState<CouponStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [showCreate, setShowCreate] = useState(false);
  const [selectedCoupon, setSelectedCoupon] = useState<Coupon | null>(null);
  const [couponUsages, setCouponUsages] = useState<CouponUsage[]>([]);
  const [detailLoading, setDetailLoading] = useState(false);

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/admin/coupons?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setCoupons(data.coupons || []);
        setStats(data.stats || null);
      }
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchCoupons();
  }, [fetchCoupons]);

  const openDetail = async (coupon: Coupon) => {
    setSelectedCoupon(coupon);
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`);
      if (res.ok) {
        const data = await res.json();
        setCouponUsages(data.usages || []);
      }
    } catch {
      // ignore
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleActive = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !coupon.isActive }),
      });
      if (!res.ok) throw new Error("Erreur");
      toast.success(coupon.isActive ? "Coupon désactivé" : "Coupon activé");
      fetchCoupons();
      if (selectedCoupon?.id === coupon.id) {
        setSelectedCoupon({ ...coupon, isActive: !coupon.isActive });
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const deleteCoupon = async (coupon: Coupon) => {
    if (!confirm(`Supprimer le coupon "${coupon.code}" ?`)) return;
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "DELETE",
      });
      if (!res.ok) throw new Error("Erreur");
      toast.success("Coupon supprimé");
      fetchCoupons();
      if (selectedCoupon?.id === coupon.id) {
        setSelectedCoupon(null);
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copié !");
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const isExpired = (coupon: Coupon) => {
    if (coupon.endsAt && new Date(coupon.endsAt) < new Date()) return true;
    if (coupon.usageLimit && coupon.usedCount >= coupon.usageLimit) return true;
    return false;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Codes Promo</h1>
          <p className="mt-1 text-sm text-gray-500">
            Gérez les codes de réduction de la plateforme
          </p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-[#7126b6] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#5e1f99] transition-colors"
        >
          <Plus className="h-4 w-4" />
          Nouveau code
        </button>
      </div>

      {stats && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: stats.total, icon: Tag, bg: "bg-purple-100", color: "text-purple-600" },
            { label: "Actifs", value: stats.active, icon: CheckCircle, bg: "bg-green-100", color: "text-green-600" },
            { label: "Inactifs", value: stats.inactive, icon: XCircle, bg: "bg-gray-100", color: "text-gray-500" },
            { label: "Utilisations", value: stats.total_uses, icon: BarChart3, bg: "bg-blue-100", color: "text-blue-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 bg-white p-4 shadow-sm">
              <div className="flex items-center gap-3">
                <div className={cn("flex h-10 w-10 items-center justify-center rounded-xl", s.bg)}>
                  <s.icon className={cn("h-5 w-5", s.color)} />
                </div>
                <div>
                  <p className="text-xs font-medium uppercase text-gray-400">{s.label}</p>
                  <p className="text-xl font-bold text-gray-900">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="rounded-2xl border border-gray-100 bg-white shadow-sm">
        <div className="border-b border-gray-100 p-4">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Rechercher un code..."
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
              />
            </div>
            <div className="flex gap-1.5">
              {["all", "active", "expired"].map((s) => (
                <button
                  key={s}
                  onClick={() => setStatusFilter(s)}
                  className={cn(
                    "rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                    statusFilter === s
                      ? "bg-[#7126b6] text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  )}
                >
                  {s === "all" ? "Tous" : s === "active" ? "Actifs" : "Expirés"}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="p-4">
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : coupons.length === 0 ? (
            <div className="py-12 text-center">
              <Tag className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">Aucun coupon trouvé</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 text-xs font-medium uppercase text-gray-400">
                    <th className="pb-3 pr-4 text-left">Code</th>
                    <th className="pb-3 pr-4 text-left">Réduction</th>
                    <th className="pb-3 pr-4 text-left">Min. commande</th>
                    <th className="pb-3 pr-4 text-left">Utilisations</th>
                    <th className="pb-3 pr-4 text-left">Boutique</th>
                    <th className="pb-3 pr-4 text-left">Expire le</th>
                    <th className="pb-3 pr-4 text-left">Statut</th>
                    <th className="pb-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {coupons.map((coupon) => {
                    const expired = isExpired(coupon);
                    return (
                      <tr key={coupon.id} className="hover:bg-gray-50/50">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-sm font-bold text-[#7126b6]">
                              {coupon.code}
                            </span>
                            <button
                              onClick={() => copyCode(coupon.code)}
                              className="rounded p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              title="Copier"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                          {coupon.description && (
                            <p className="mt-0.5 text-xs text-gray-500 max-w-[200px] truncate">
                              {coupon.description}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1">
                            {coupon.discountType === "PERCENTAGE" ? (
                              <Percent className="h-3.5 w-3.5 text-blue-500" />
                            ) : (
                              <DollarSign className="h-3.5 w-3.5 text-green-500" />
                            )}
                            <span className="font-medium text-gray-900">
                              {coupon.discountType === "PERCENTAGE"
                                ? `${coupon.discountValue}%`
                                : `${coupon.discountValue}`}
                            </span>
                          </div>
                          {coupon.maxDiscount && (
                            <p className="text-[10px] text-gray-400">
                              Max: {coupon.maxDiscount}
                            </p>
                          )}
                        </td>
                        <td className="py-3 pr-4 text-xs text-gray-600">
                          {coupon.minOrderAmount ? `${coupon.minOrderAmount}` : "—"}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1">
                            <Users className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {coupon.usedCount}
                              {coupon.usageLimit ? ` / ${coupon.usageLimit}` : ""}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-xs text-gray-600">
                          {coupon.shopName || "Global"}
                        </td>
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-3.5 w-3.5 text-gray-400" />
                            <span className="text-xs text-gray-600">
                              {formatDate(coupon.endsAt)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 pr-4">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                              expired
                                ? "bg-red-100 text-red-700"
                                : coupon.isActive
                                ? "bg-green-100 text-green-700"
                                : "bg-gray-100 text-gray-500"
                            )}
                          >
                            {expired ? (
                              <XCircle className="h-3 w-3" />
                            ) : coupon.isActive ? (
                              <CheckCircle className="h-3 w-3" />
                            ) : (
                              <EyeOff className="h-3 w-3" />
                            )}
                            {expired ? "Expiré" : coupon.isActive ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="py-3 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => openDetail(coupon)}
                              className="rounded-lg p-1.5 text-gray-400 hover:bg-gray-100 hover:text-gray-600"
                              title="Détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => toggleActive(coupon)}
                              className={cn(
                                "rounded-lg p-1.5 hover:bg-gray-100",
                                coupon.isActive ? "text-green-500 hover:text-green-600" : "text-gray-400 hover:text-gray-600"
                              )}
                              title={coupon.isActive ? "Désactiver" : "Activer"}
                            >
                              {coupon.isActive ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                            </button>
                            <button
                              onClick={() => deleteCoupon(coupon)}
                              className="rounded-lg p-1.5 text-red-400 hover:bg-red-50 hover:text-red-600"
                              title="Supprimer"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {showCreate && (
        <CreateCouponModal
          onClose={() => setShowCreate(false)}
          onCreated={() => {
            setShowCreate(false);
            fetchCoupons();
          }}
        />
      )}

      {selectedCoupon && (
        <CouponDetailModal
          coupon={selectedCoupon}
          usages={couponUsages}
          loading={detailLoading}
          onClose={() => setSelectedCoupon(null)}
          onToggle={() => toggleActive(selectedCoupon)}
          onDelete={() => deleteCoupon(selectedCoupon)}
        />
      )}
    </div>
  );
}

function CreateCouponModal({
  onClose,
  onCreated,
}: {
  onClose: () => void;
  onCreated: () => void;
}) {
  const [code, setCode] = useState("");
  const [description, setDescription] = useState("");
  const [discountType, setDiscountType] = useState("PERCENTAGE");
  const [discountValue, setDiscountValue] = useState("");
  const [minOrderAmount, setMinOrderAmount] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [endsAt, setEndsAt] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!code.trim() || !discountValue) {
      toast.error("Code et valeur de réduction requis");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/admin/coupons", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          description: description || null,
          discountType,
          discountValue: parseFloat(discountValue),
          minOrderAmount: minOrderAmount ? parseFloat(minOrderAmount) : null,
          maxDiscount: maxDiscount ? parseFloat(maxDiscount) : null,
          usageLimit: usageLimit ? parseInt(usageLimit) : null,
          perUserLimit: perUserLimit ? parseInt(perUserLimit) : 1,
          endsAt: endsAt || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur");
      }
      toast.success("Coupon créé !");
      onCreated();
    } catch (err: any) {
      toast.error(err.message || "Erreur lors de la création");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-gray-900">Nouveau code promo</h2>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Code promo *</label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="EX: NOVA20"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm font-mono uppercase focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Réduction de 20%"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Type de réduction</label>
            <div className="flex gap-2">
              <button
                onClick={() => setDiscountType("PERCENTAGE")}
                className={cn(
                  "flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2",
                  discountType === "PERCENTAGE"
                    ? "border-[#7126b6] bg-purple-50 text-[#7126b6]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                <Percent className="h-4 w-4" />
                Pourcentage
              </button>
              <button
                onClick={() => setDiscountType("FIXED")}
                className={cn(
                  "flex-1 rounded-xl border-2 px-4 py-2.5 text-sm font-medium transition-all flex items-center justify-center gap-2",
                  discountType === "FIXED"
                    ? "border-[#7126b6] bg-purple-50 text-[#7126b6]"
                    : "border-gray-200 text-gray-600 hover:border-gray-300"
                )}
              >
                <DollarSign className="h-4 w-4" />
                Montant fixe
              </button>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Valeur de la réduction *
            </label>
            <input
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "PERCENTAGE" ? "Ex: 20" : "Ex: 500"}
              min="0"
              step="0.01"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Montant min.</label>
              <input
                type="number"
                value={minOrderAmount}
                onChange={(e) => setMinOrderAmount(e.target.value)}
                placeholder="0"
                min="0"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Réduction max.</label>
              <input
                type="number"
                value={maxDiscount}
                onChange={(e) => setMaxDiscount(e.target.value)}
                placeholder="Illimité"
                min="0"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite totale</label>
              <input
                type="number"
                value={usageLimit}
                onChange={(e) => setUsageLimit(e.target.value)}
                placeholder="Illimité"
                min="1"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Limite/utilisateur</label>
              <input
                type="number"
                value={perUserLimit}
                onChange={(e) => setPerUserLimit(e.target.value)}
                placeholder="1"
                min="1"
                className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date d&apos;expiration</label>
            <input
              type="datetime-local"
              value={endsAt}
              onChange={(e) => setEndsAt(e.target.value)}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !code.trim() || !discountValue}
            className="flex-1 rounded-xl bg-[#7126b6] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#5e1f99] disabled:opacity-50 transition-colors"
          >
            {loading ? "Création..." : "Créer le coupon"}
          </button>
        </div>
      </div>
    </div>
  );
}

function CouponDetailModal({
  coupon,
  usages,
  loading,
  onClose,
  onToggle,
  onDelete,
}: {
  coupon: Coupon;
  usages: CouponUsage[];
  loading: boolean;
  onClose: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div
        className="w-full max-w-2xl rounded-2xl bg-white p-6 shadow-2xl max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono text-lg font-bold text-[#7126b6]">{coupon.code}</span>
              <span
                className={cn(
                  "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-medium",
                  coupon.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"
                )}
              >
                {coupon.isActive ? "Actif" : "Inactif"}
              </span>
            </div>
            {coupon.description && (
              <p className="mt-1 text-sm text-gray-500">{coupon.description}</p>
            )}
          </div>
          <button onClick={onClose} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="mt-5 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-400">Réduction</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {coupon.discountType === "PERCENTAGE" ? `${coupon.discountValue}%` : coupon.discountValue}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-400">Utilisations</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {coupon.usedCount}{coupon.usageLimit ? `/${coupon.usageLimit}` : ""}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-400">Min. commande</p>
            <p className="mt-1 text-lg font-bold text-gray-900">
              {coupon.minOrderAmount || "—"}
            </p>
          </div>
          <div className="rounded-xl bg-gray-50 p-3 text-center">
            <p className="text-xs text-gray-400">Expire le</p>
            <p className="mt-1 text-sm font-bold text-gray-900">
              {coupon.endsAt ? new Date(coupon.endsAt).toLocaleDateString("fr-FR") : "Jamais"}
            </p>
          </div>
        </div>

        <div className="mt-5 flex gap-2">
          <button
            onClick={onToggle}
            className={cn(
              "flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors",
              coupon.isActive
                ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                : "bg-green-100 text-green-700 hover:bg-green-200"
            )}
          >
            {coupon.isActive ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            {coupon.isActive ? "Désactiver" : "Activer"}
          </button>
          <button
            onClick={onDelete}
            className="flex items-center gap-2 rounded-xl bg-red-100 px-4 py-2.5 text-sm font-medium text-red-700 hover:bg-red-200 transition-colors"
          >
            <Trash2 className="h-4 w-4" />
            Supprimer
          </button>
        </div>

        <div className="mt-5">
          <h3 className="text-sm font-bold text-gray-900">Historique des utilisations</h3>
          {loading ? (
            <div className="mt-3 space-y-2">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-12 animate-pulse rounded-xl bg-gray-100" />
              ))}
            </div>
          ) : usages.length === 0 ? (
            <p className="mt-3 text-sm text-gray-500 text-center py-6">Aucune utilisation</p>
          ) : (
            <div className="mt-3 space-y-2">
              {usages.map((u) => (
                <div key={u.id} className="flex items-center justify-between rounded-xl bg-gray-50 px-4 py-2.5">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{u.userName || u.userEmail}</p>
                    <p className="text-xs text-gray-400">Commande #{u.orderId.slice(0, 8)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">-{u.amount}</p>
                    <p className="text-xs text-gray-400">
                      {new Date(u.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
