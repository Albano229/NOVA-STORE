"use client";

import { useEffect, useState, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import {
  Search,
  Filter,
  X,
  Store,
  User,
  Package,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  Wallet,
  CheckCircle,
  Ban,
  Shield,
  ShieldOff,
  ChevronRight,
  ArrowUpDown,
  RefreshCw,
  Users,
  Coins,
  CreditCard,
  Clock,
  Eye,
  XCircle,
} from "lucide-react";

interface VendorShop {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean;
  isVerified: boolean;
  commissionRate: number;
  productCount: number;
  orderCount: number;
  totalRevenue: number;
  totalCommissions: number;
  pendingCommissions: number;
  totalPaidOut: number;
  pendingPayouts: number;
  availableBalance: number;
}

interface Vendor {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  image: string | null;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  shop: VendorShop | null;
}

interface VendorStats {
  total: number;
  active: number;
  inactive: number;
  withShop: number;
  verified: number;
  totalRevenue: number;
  totalCommissions: number;
  totalPaidOut: number;
}

interface VendorDetail {
  vendor: Vendor;
  transactions: any[];
  payouts: any[];
  recentOrders: any[];
}

const statusOptions = [
  { value: "ALL", label: "Tous" },
  { value: "ACTIVE", label: "Actifs" },
  { value: "INACTIVE", label: "Inactifs" },
  { value: "WITH_SHOP", label: "Avec boutique" },
  { value: "NO_SHOP", label: "Sans boutique" },
  { value: "VERIFIED", label: "Vérifiés" },
  { value: "UNVERIFIED", label: "Non vérifiés" },
];

const sortOptions = [
  { value: "newest", label: "Plus récent" },
  { value: "oldest", label: "Plus ancien" },
  { value: "name_asc", label: "Nom A-Z" },
  { value: "name_desc", label: "Nom Z-A" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit", month: "short", year: "numeric",
    hour: "2-digit", minute: "2-digit",
  });
}

const payoutStatusBadge: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  COMPLETED: "bg-green-100 text-green-700",
};

const payoutStatusLabel: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
  COMPLETED: "Payé",
};

const orderStatusBadge: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  CONFIRMED: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const orderStatusLabel: Record<string, string> = {
  PENDING: "En attente",
  CONFIRMED: "Confirmée",
  SHIPPED: "Expédiée",
  DELIVERED: "Livrée",
  CANCELLED: "Annulée",
};

export default function AdminVendorsPage() {
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [stats, setStats] = useState<VendorStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [sortBy, setSortBy] = useState("newest");
  const [selectedVendor, setSelectedVendor] = useState<Vendor | null>(null);
  const [detailData, setDetailData] = useState<VendorDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"overview" | "orders" | "payouts" | "transactions">("overview");
  const [payoutModal, setPayoutModal] = useState<{ type: "approve" | "reject"; payout: any } | null>(null);
  const [payoutActionLoading, setPayoutActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const fetchVendors = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (sortBy) params.set("sort", sortBy);

      const res = await fetch(`/api/admin/vendors?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      setVendors(data.vendors);
      setStats(data.stats);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, sortBy]);

  useEffect(() => {
    fetchVendors();
  }, [fetchVendors]);

  const fetchVendorDetail = async (vendor: Vendor) => {
    setSelectedVendor(vendor);
    setDetailLoading(true);
    setDetailTab("overview");
    try {
      const [txRes, payoutRes, orderRes] = await Promise.all([
        fetch(`/api/vendor/transactions?limit=20`),
        fetch(`/api/vendor/payouts`),
        fetch(`/api/vendor/orders?limit=10`),
      ]);
      const txData = txRes.ok ? await txRes.json() : { transactions: [] };
      const payoutData = payoutRes.ok ? await payoutRes.json() : [];
      const orderData = orderRes.ok ? await orderRes.json() : [];
      setDetailData({
        vendor,
        transactions: txData.transactions || [],
        payouts: Array.isArray(payoutData) ? payoutData : [],
        recentOrders: Array.isArray(orderData) ? orderData : (orderData.orders || []),
      });
    } catch {
      setDetailData({ vendor, transactions: [], payouts: [], recentOrders: [] });
    } finally {
      setDetailLoading(false);
    }
  };

  const toggleVendorActive = async (userId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/vendors/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setVendors((prev) => prev.map((v) => v.id === userId ? { ...v, isActive: !current } : v));
        toast.success(current ? "Vendeur désactivé" : "Vendeur activé");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const toggleShopVerified = async (shopId: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/shops/${shopId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !current }),
      });
      if (res.ok) {
        setVendors((prev) => prev.map((v) =>
          v.shop?.id === shopId ? { ...v, shop: v.shop ? { ...v.shop, isVerified: !current } : v.shop } : v
        ));
        toast.success(current ? "Boutique non vérifiée" : "Boutique vérifiée");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  const handlePayoutAction = async (payoutId: string, action: "approve" | "reject") => {
    setPayoutActionLoading(true);
    try {
      const body: Record<string, string> = { status: action === "approve" ? "APPROVED" : "REJECTED" };
      if (action === "reject" && rejectReason) body.reason = rejectReason;

      const res = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur");

      toast.success(`Retrait ${action === "approve" ? "approuvé" : "rejeté"}`);
      setPayoutModal(null);
      setRejectReason("");
      if (selectedVendor) fetchVendorDetail(selectedVendor);
      fetchVendors();
    } catch {
      toast.error("Erreur lors de l'action");
    } finally {
      setPayoutActionLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50 p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 lg:text-3xl">Gestion des vendeurs</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {stats?.total || 0} vendeur{(stats?.total || 0) > 1 ? "s" : ""} au total
        </p>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Total vendeurs", value: stats.total, icon: Users, bg: "bg-blue-50", iconColor: "text-blue-600", valueColor: "text-blue-700" },
            { label: "Avec boutique", value: stats.withShop, icon: Store, bg: "bg-purple-50", iconColor: "text-purple-600", valueColor: "text-purple-700" },
            { label: "Revenus totaux", value: formatPrice(stats.totalRevenue), icon: DollarSign, bg: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-emerald-700" },
            { label: "Commissions", value: formatPrice(stats.totalCommissions), icon: Coins, bg: "bg-amber-50", iconColor: "text-amber-600", valueColor: "text-amber-700" },
          ].map((kpi) => (
            <div key={kpi.label} className={`${kpi.bg} rounded-2xl p-4 shadow-sm transition-transform hover:scale-[1.02]`}>
              <div className="flex items-center gap-2">
                <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
                <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{kpi.label}</span>
              </div>
              <p className={`mt-2 text-2xl font-bold ${kpi.valueColor} truncate`}>{kpi.value}</p>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <Input
                id="vendor-search"
                placeholder="Rechercher par nom, email, boutique..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); }}
                className="pl-9"
              />
              {search && (
                <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium transition-colors focus:border-[#7126b6] focus:outline-none focus:ring-2 focus:ring-[#7126b6]/20"
            >
              {statusOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium transition-colors focus:border-[#7126b6] focus:outline-none focus:ring-2 focus:ring-[#7126b6]/20"
            >
              {sortOptions.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      <div className="hidden overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Vendeur</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Boutique</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Produits</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Commandes</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Revenus</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Balance</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Statut</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500">Inscrit</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {vendors.map((vendor) => (
                <tr key={vendor.id} className="transition-colors hover:bg-gray-50/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-full bg-[#7126b6]/10 flex items-center justify-center text-[#7126b6] font-bold text-sm">
                        {vendor.name?.[0]?.toUpperCase() || vendor.email[0].toUpperCase()}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-gray-900">{vendor.name || "Sans nom"}</p>
                        <p className="truncate text-xs text-gray-500">{vendor.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {vendor.shop ? (
                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-medium text-gray-900">{vendor.shop.name}</span>
                          {vendor.shop.isVerified && <CheckCircle className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />}
                        </div>
                        <p className="truncate text-xs text-gray-500">/{vendor.shop.slug}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-gray-400 italic">Aucune boutique</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{vendor.shop?.productCount || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-medium text-gray-900">{vendor.shop?.orderCount || 0}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-emerald-600">{formatPrice(vendor.shop?.totalRevenue || 0)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`text-sm font-semibold ${(vendor.shop?.availableBalance || 0) > 0 ? "text-green-600" : "text-gray-500"}`}>
                      {formatPrice(Math.max(0, vendor.shop?.availableBalance || 0))}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                        vendor.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      }`}>
                        {vendor.isActive ? "Actif" : "Inactif"}
                      </span>
                      {vendor.shop && (
                        <span className={`inline-flex w-fit items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                          vendor.shop.isVerified ? "bg-blue-100 text-blue-700" : "bg-gray-100 text-gray-500"
                        }`}>
                          {vendor.shop.isVerified ? "Vérifié" : "Non vérifié"}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500">{formatDate(vendor.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => fetchVendorDetail(vendor)}
                        className="rounded-lg p-2 text-gray-400 transition-colors hover:bg-[#7126b6]/10 hover:text-[#7126b6]"
                        title="Voir détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => toggleVendorActive(vendor.id, vendor.isActive)}
                        className={`rounded-lg p-2 transition-colors ${
                          vendor.isActive ? "text-gray-400 hover:bg-red-50 hover:text-red-600" : "text-gray-400 hover:bg-green-50 hover:text-green-600"
                        }`}
                        title={vendor.isActive ? "Désactiver" : "Activer"}
                      >
                        {vendor.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                      </button>
                      {vendor.shop && (
                        <button
                          onClick={() => toggleShopVerified(vendor.shop!.id, vendor.shop!.isVerified)}
                          className={`rounded-lg p-2 transition-colors ${
                            vendor.shop.isVerified ? "text-gray-400 hover:bg-gray-100 hover:text-gray-600" : "text-gray-400 hover:bg-blue-50 hover:text-blue-600"
                          }`}
                          title={vendor.shop.isVerified ? "Retirer vérification" : "Vérifier"}
                        >
                          {vendor.shop.isVerified ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {vendors.length === 0 && (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-500">Aucun vendeur trouvé</p>
            <p className="mt-1 text-xs text-gray-400">Essayez de modifier vos filtres</p>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-3 lg:hidden">
        {vendors.map((vendor) => (
          <div key={vendor.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm">
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#7126b6]/10 flex items-center justify-center text-[#7126b6] font-bold text-sm">
                  {vendor.name?.[0]?.toUpperCase() || vendor.email[0].toUpperCase()}
                </div>
                <div>
                  <p className="text-sm font-bold text-gray-900">{vendor.name || "Sans nom"}</p>
                  <p className="text-xs text-gray-500">{vendor.email}</p>
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${
                  vendor.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                }`}>
                  {vendor.isActive ? "Actif" : "Inactif"}
                </span>
              </div>
            </div>

            {vendor.shop && (
              <div className="mt-3 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                <div className="flex items-center gap-1.5">
                  <Store className="h-3.5 w-3.5 text-[#7126b6]" />
                  <span className="text-sm font-semibold text-gray-900">{vendor.shop.name}</span>
                  {vendor.shop.isVerified && <CheckCircle className="h-3 w-3 text-blue-500" />}
                </div>
                <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-center">
                  <div>
                    <p className="text-[10px] text-gray-400">Produits</p>
                    <p className="text-sm font-bold text-gray-900">{vendor.shop.productCount}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Revenus</p>
                    <p className="text-sm font-bold text-emerald-600">{formatPrice(vendor.shop.totalRevenue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-gray-400">Balance</p>
                    <p className="text-sm font-bold text-green-600">{formatPrice(Math.max(0, vendor.shop.availableBalance))}</p>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-3 flex gap-2">
              <button
                onClick={() => fetchVendorDetail(vendor)}
                className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-[#7126b6] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#5a1e94]"
              >
                <Eye className="h-4 w-4" />
                Détails
              </button>
              <button
                onClick={() => toggleVendorActive(vendor.id, vendor.isActive)}
                className={`flex flex-1 items-center justify-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                  vendor.isActive ? "border-red-200 bg-red-50 text-red-700 hover:bg-red-100" : "border-green-200 bg-green-50 text-green-700 hover:bg-green-100"
                }`}
              >
                {vendor.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                {vendor.isActive ? "Désactiver" : "Activer"}
              </button>
            </div>
          </div>
        ))}
        {vendors.length === 0 && (
          <div className="py-16 text-center">
            <Users className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-500">Aucun vendeur trouvé</p>
          </div>
        )}
      </div>

      {selectedVendor && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/50 p-0 sm:p-4" onClick={() => setSelectedVendor(null)}>
          <div
            className="w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto rounded-t-3xl sm:rounded-3xl bg-white dark:bg-gray-900 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 px-6 py-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-[#7126b6]/10 flex items-center justify-center text-[#7126b6] font-bold">
                  {selectedVendor.name?.[0]?.toUpperCase() || selectedVendor.email[0].toUpperCase()}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-gray-900">{selectedVendor.name || "Sans nom"}</h2>
                  <p className="text-sm text-gray-500">{selectedVendor.email}</p>
                </div>
              </div>
              <button onClick={() => setSelectedVendor(null)} className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600">
                <XCircle className="h-5 w-5" />
              </button>
            </div>

            {detailLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
                ))}
              </div>
            ) : detailData ? (
              <div className="p-6">
                {selectedVendor.shop && (
                  <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <Store className="h-5 w-5 text-[#7126b6]" />
                      <h3 className="font-bold text-gray-900">{selectedVendor.shop.name}</h3>
                      {selectedVendor.shop.isVerified && (
                        <span className="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">Vérifié</span>
                      )}
                    </div>
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                      {[
                        { label: "Revenus", value: formatPrice(selectedVendor.shop.totalRevenue), color: "text-emerald-600" },
                        { label: "Commissions", value: formatPrice(selectedVendor.shop.totalCommissions), color: "text-amber-600" },
                        { label: "Payé", value: formatPrice(selectedVendor.shop.totalPaidOut), color: "text-blue-600" },
                        { label: "Balance", value: formatPrice(Math.max(0, selectedVendor.shop.availableBalance)), color: "text-green-600" },
                      ].map((stat) => (
                        <div key={stat.label} className="rounded-xl bg-white dark:bg-gray-800 p-3 text-center">
                          <p className="text-[10px] text-gray-400">{stat.label}</p>
                          <p className={`text-lg font-bold ${stat.color}`}>{stat.value}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mb-4 flex gap-2 overflow-x-auto">
                  {(["overview", "orders", "payouts", "transactions"] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setDetailTab(tab)}
                      className={`flex-shrink-0 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                        detailTab === tab
                          ? "bg-[#7126b6] text-white"
                          : "text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-800"
                      }`}
                    >
                      {tab === "overview" ? "Aperçu" : tab === "orders" ? "Commandes" : tab === "payouts" ? "Retraits" : "Transactions"}
                    </button>
                  ))}
                </div>

                {detailTab === "overview" && (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                        <div className="flex items-center gap-2">
                          <Package className="h-4 w-4 text-[#7126b6]" />
                          <span className="text-xs text-gray-500">Produits</span>
                        </div>
                        <p className="mt-1 text-xl font-bold text-gray-900">{selectedVendor.shop?.productCount || 0}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                        <div className="flex items-center gap-2">
                          <ShoppingCart className="h-4 w-4 text-[#7126b6]" />
                          <span className="text-xs text-gray-500">Commandes</span>
                        </div>
                        <p className="mt-1 text-xl font-bold text-gray-900">{selectedVendor.shop?.orderCount || 0}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                        <div className="flex items-center gap-2">
                          <Coins className="h-4 w-4 text-amber-500" />
                          <span className="text-xs text-gray-500">Commissions dues</span>
                        </div>
                        <p className="mt-1 text-xl font-bold text-amber-600">{formatPrice(selectedVendor.shop?.pendingCommissions || 0)}</p>
                      </div>
                      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                        <div className="flex items-center gap-2">
                          <Wallet className="h-4 w-4 text-blue-500" />
                          <span className="text-xs text-gray-500">Retraits en attente</span>
                        </div>
                        <p className="mt-1 text-xl font-bold text-blue-600">{formatPrice(selectedVendor.shop?.pendingPayouts || 0)}</p>
                      </div>
                    </div>

                    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                      <h4 className="mb-3 font-semibold text-gray-900">Actions rapides</h4>
                      <div className="flex flex-wrap gap-2">
                        <button
                          onClick={() => toggleVendorActive(selectedVendor.id, selectedVendor.isActive)}
                          className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                            selectedVendor.isActive ? "bg-red-100 text-red-700 hover:bg-red-200" : "bg-green-100 text-green-700 hover:bg-green-200"
                          }`}
                        >
                          {selectedVendor.isActive ? <Ban className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                          {selectedVendor.isActive ? "Désactiver le vendeur" : "Activer le vendeur"}
                        </button>
                        {selectedVendor.shop && (
                          <button
                            onClick={() => toggleShopVerified(selectedVendor.shop!.id, selectedVendor.shop!.isVerified)}
                            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
                              selectedVendor.shop.isVerified ? "bg-gray-100 text-gray-700 hover:bg-gray-200" : "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            }`}
                          >
                            {selectedVendor.shop.isVerified ? <ShieldOff className="h-4 w-4" /> : <Shield className="h-4 w-4" />}
                            {selectedVendor.shop.isVerified ? "Retirer la vérification" : "Vérifier la boutique"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )}

                {detailTab === "orders" && (
                  <div className="space-y-3">
                    {detailData.recentOrders.length === 0 ? (
                      <div className="py-12 text-center">
                        <ShoppingCart className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-sm text-gray-500">Aucune commande</p>
                      </div>
                    ) : (
                      detailData.recentOrders.map((order: any) => (
                        <div key={order.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{order.orderNumber || order.id?.slice(0, 8)}</p>
                              <p className="text-xs text-gray-500">{order.customerName || order.customerEmail || "Client"}</p>
                            </div>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${orderStatusBadge[order.status] || "bg-gray-100 text-gray-500"}`}>
                              {orderStatusLabel[order.status] || order.status}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-sm font-semibold text-gray-900">{formatPrice(order.total || order.amount || 0)}</span>
                            <span className="text-xs text-gray-400">{formatDate(order.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === "payouts" && (
                  <div className="space-y-3">
                    {detailData.payouts.length === 0 ? (
                      <div className="py-12 text-center">
                        <Wallet className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-sm text-gray-500">Aucun retrait</p>
                      </div>
                    ) : (
                      detailData.payouts.map((payout: any) => (
                        <div key={payout.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{formatPrice(payout.amount)}</p>
                              <p className="text-xs text-gray-500">{payout.method || "Non spécifié"}</p>
                            </div>
                            <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${payoutStatusBadge[payout.status] || "bg-gray-100 text-gray-500"}`}>
                              {payoutStatusLabel[payout.status] || payout.status}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between">
                            <span className="text-xs text-gray-400">{formatDateTime(payout.createdAt)}</span>
                            {payout.status === "PENDING" && (
                              <div className="flex gap-1">
                                <button
                                  onClick={() => setPayoutModal({ type: "approve", payout })}
                                  className="rounded-lg bg-green-100 px-3 py-1 text-xs font-medium text-green-700 hover:bg-green-200"
                                >
                                  Approuver
                                </button>
                                <button
                                  onClick={() => setPayoutModal({ type: "reject", payout })}
                                  className="rounded-lg bg-red-100 px-3 py-1 text-xs font-medium text-red-700 hover:bg-red-200"
                                >
                                  Rejeter
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}

                {detailTab === "transactions" && (
                  <div className="space-y-3">
                    {detailData.transactions.length === 0 ? (
                      <div className="py-12 text-center">
                        <CreditCard className="mx-auto h-10 w-10 text-gray-300" />
                        <p className="mt-3 text-sm text-gray-500">Aucune transaction</p>
                      </div>
                    ) : (
                      detailData.transactions.map((tx: any, i: number) => (
                        <div key={tx.id || i} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                          <div className="flex items-start justify-between">
                            <div>
                              <p className="text-sm font-bold text-gray-900">{tx.reference || tx.id?.slice(0, 8)}</p>
                              <p className="text-xs text-gray-500">{tx.customer || "Client"}</p>
                            </div>
                            <span className={`text-sm font-semibold ${tx.type === "SALE" ? "text-green-600" : "text-red-600"}`}>
                              {tx.type === "SALE" ? "+" : "-"}{formatPrice(tx.amount)}
                            </span>
                          </div>
                          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
                            <span>{tx.method || tx.type}</span>
                            <span>{formatDate(tx.createdAt)}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      )}

      {payoutModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setPayoutModal(null)}>
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-gray-900">
              {payoutModal.type === "approve" ? "Approuver le retrait" : "Rejeter le retrait"}
            </h3>
            <p className="mt-2 text-sm text-gray-500">
              Montant: <span className="font-semibold text-gray-900">{formatPrice(payoutModal.payout.amount)}</span>
            </p>
            {payoutModal.type === "reject" && (
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">Raison du rejet</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  className="w-full rounded-xl border border-gray-300 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-2 focus:ring-[#7126b6]/20"
                  rows={3}
                  placeholder="Optionnel..."
                />
              </div>
            )}
            <div className="mt-6 flex gap-3">
              <button
                onClick={() => setPayoutModal(null)}
                className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={() => handlePayoutAction(payoutModal.payout.id, payoutModal.type)}
                disabled={payoutActionLoading}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors ${
                  payoutModal.type === "approve" ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"
                } disabled:opacity-50`}
              >
                {payoutActionLoading ? "En cours..." : payoutModal.type === "approve" ? "Approuver" : "Rejeter"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
