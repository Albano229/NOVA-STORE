"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import {
  Store, Search, CheckCircle, XCircle, Shield, AlertTriangle,
  Clock, Calendar, DollarSign, MoreVertical, ExternalLink, Trash2,
  Eye, X, Package, ShoppingBag, TrendingUp, User, Phone, Mail,
  MapPin, BarChart3, Loader2,
} from "lucide-react";

interface ShopOwner { id: string; name: string | null; email: string; image: string | null; }
interface Shop {
  id: string; name: string; slug: string; description: string | null;
  phone: string | null; email: string | null; address: string | null; city: string | null;
  isActive: boolean; isVerified: boolean; commissionRate: number; createdAt: string;
  owner: ShopOwner; productCount: number; orderCount: number; revenue: number; commissionGenerated: number;
}
interface ShopStats { total: number; active: number; inactive: number; verified: number; unverified: number; today: number; thisMonth: number; }
interface TopShop { id: string; name: string; slug: string; vendorName: string; revenue: number; orderCount: number; }
interface ShopsResponse { shops: Shop[]; stats: ShopStats; topShops: TopShop[]; }
interface ShopDetail {
  shop: Shop;
  products: { id: string; name: string; price: number; type: string; orderCount: number; stock: number; }[];
  orders: { id: string; orderNumber: string; total: number; status: string; createdAt: string; user: { name: string | null; email: string }; }[];
  stats: { totalRevenue: number; monthRevenue: number; todayRevenue: number; totalOrders: number; totalPaidCommission: number; pendingCommission: number; };
  topProducts: { id: string; name: string; totalSold: number; revenue: number; }[];
  recentOrders: { id: string; orderNumber: string; total: number; status: string; createdAt: string; user: { name: string | null; email: string }; }[];
}

const formatDate = (date: string) =>
  new Date(date).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const formatNumber = (n: number) => new Intl.NumberFormat("fr-FR").format(n);

const orderStatusBadge = (status: string) => {
  const m: Record<string, string> = {
    PENDING: "bg-amber-100 text-amber-700", PAID: "bg-blue-100 text-blue-700",
    SHIPPED: "bg-indigo-100 text-indigo-700", DELIVERED: "bg-emerald-100 text-emerald-700",
    CANCELLED: "bg-red-100 text-red-700", REFUNDED: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  };
  return m[status] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
};

const orderStatusLabel = (status: string) => {
  const m: Record<string, string> = {
    PENDING: "En attente", PAID: "Payee", SHIPPED: "Expédiee",
    DELIVERED: "Livrée", CANCELLED: "Annulée", REFUNDED: "Remboursee",
  };
  return m[status] || status;
};

const productTypeBadge = (type: string) => {
  const m: Record<string, string> = {
    PHYSICAL: "bg-sky-100 text-sky-700", DIGITAL: "bg-violet-100 text-violet-700", SERVICE: "bg-teal-100 text-teal-700",
  };
  return m[type] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
};

const productTypeLabel = (type: string) => {
  const m: Record<string, string> = { PHYSICAL: "Physique", DIGITAL: "Digitale", SERVICE: "Service" };
  return m[type] || type;
};
export default function AdminStoresPage() {
  const [data, setData] = useState<ShopsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [searchDebounce, setSearchDebounce] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sort, setSort] = useState("recent");
  const [detailId, setDetailId] = useState<string | null>(null);
  const [detail, setDetail] = useState<ShopDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [detailTab, setDetailTab] = useState<"products" | "orders" | "top">("products");
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [deleteName, setDeleteName] = useState("");
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchShops = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (searchDebounce) params.set("search", searchDebounce);
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (sort) params.set("sort", sort);
      const res = await fetch(`/api/admin/stores?${params.toString()}`);
      if (res.ok) { const json = await res.json(); setData(json); }
    } catch { toast.error("Erreur lors du chargement des boutiques"); }
    finally { setLoading(false); }
  }, [searchDebounce, statusFilter, sort]);

  useEffect(() => { setLoading(true); fetchShops(); }, [fetchShops]);

  useEffect(() => {
    const timer = setTimeout(() => setSearchDebounce(search), 400);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) setOpenDropdown(null);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchDetail = async (id: string) => {
    setDetailId(id); setDetailLoading(true); setDetailTab("products");
    try {
      const res = await fetch(`/api/admin/stores/${id}`);
      if (res.ok) { const json = await res.json(); setDetail(json); }
    } catch { toast.error("Erreur lors du chargement des details"); }
    finally { setDetailLoading(false); }
  };

  const closeDetail = () => { setDetailId(null); setDetail(null); };

  const toggleActive = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/stores/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !current }),
      });
      if (res.ok) {
        setData(prev => prev ? { ...prev, shops: prev.shops.map(s => s.id === id ? { ...s, isActive: !current } : s) } : prev);
        setDetail(prev => prev && prev.shop.id === id ? { ...prev, shop: { ...prev.shop, isActive: !current } } : prev);
        toast.success(current ? "Boutique suspendue" : "Boutique activee");
      } else { toast.error("Erreur lors de la mise a jour"); }
    } catch { toast.error("Erreur reseau"); }
    setOpenDropdown(null);
  };

  const toggleVerified = async (id: string, current: boolean) => {
    try {
      const res = await fetch(`/api/admin/stores/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isVerified: !current }),
      });
      if (res.ok) {
        setData(prev => prev ? { ...prev, shops: prev.shops.map(s => s.id === id ? { ...s, isVerified: !current } : s) } : prev);
        setDetail(prev => prev && prev.shop.id === id ? { ...prev, shop: { ...prev.shop, isVerified: !current } } : prev);
        toast.success(current ? "Verification retiree" : "Boutique verifiee");
      } else { toast.error("Erreur lors de la mise a jour"); }
    } catch { toast.error("Erreur reseau"); }
    setOpenDropdown(null);
  };

  const deleteShop = async () => {
    if (!deleteId || deleteName !== data?.shops.find(s => s.id === deleteId)?.name) {
      toast.error("Le nom ne correspond pas"); return;
    }
    setDeleteLoading(true);
    try {
      const res = await fetch(`/api/admin/stores/${deleteId}`, { method: "DELETE" });
      if (res.ok) {
        setData(prev => prev ? { ...prev, shops: prev.shops.filter(s => s.id !== deleteId), stats: { ...prev.stats, total: prev.stats.total - 1 } } : prev);
        toast.success("Boutique supprimee"); setDeleteId(null); setDeleteName("");
        if (detailId === deleteId) { setDetailId(null); setDetail(null); }
      } else { toast.error("Erreur lors de la suppression"); }
    } catch { toast.error("Erreur reseau"); }
    finally { setDeleteLoading(false); }
  };

  const totalRevenue = data?.shops.reduce((acc, s) => acc + s.revenue, 0) ?? 0;
  const unverifiedShops = data?.shops.filter(s => !s.isVerified) ?? [];
  const suspendedShops = data?.shops.filter(s => !s.isActive) ?? [];
  const statusFilters = [
    { key: "all", label: "Toutes" }, { key: "active", label: "Actives" },
    { key: "inactive", label: "Suspendues" }, { key: "verified", label: "Verifiees" },
    { key: "unverified", label: "Non verifiees" },
  ];
  const sortOptions = [
    { key: "recent", label: "Plus recentes" }, { key: "oldest", label: "Plus anciennes" },
    { key: "name", label: "Nom" }, { key: "revenue", label: "Meilleures revenus" },
    { key: "orders", label: "Plus de commandes" },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50">
        <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
          <div className="mb-8">
            <div className="h-8 w-64 animate-pulse rounded-lg bg-gray-200" />
            <div className="mt-2 h-4 w-40 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            {[1,2,3,4,5,6,7,8].map(i => <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-200" />)}
          </div>
          <div className="space-y-3">
            {[1,2,3,4,5].map(i => <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-200" />)}
          </div>
        </div>
      </div>
    );
  }
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50">
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#0f172a]">Gestion des boutiques</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {data ? `${data.stats.total} boutique(s) au total` : "Chargement..."}
          </p>
        </div>

        {data && (
          <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-4 lg:grid-cols-8">
            <Card className="p-4">
              <div className="rounded-xl bg-indigo-100 p-2.5 w-fit">
                <Store className="h-5 w-5 text-indigo-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">{formatNumber(data.stats.total)}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Total boutiques</p>
            </Card>
            <Card className="p-4">
              <div className="rounded-xl bg-green-100 p-2.5 w-fit">
                <CheckCircle className="h-5 w-5 text-green-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">{formatNumber(data.stats.active)}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Actives</p>
            </Card>
            <Card className="p-4">
              <div className="rounded-xl bg-red-100 p-2.5 w-fit">
                <XCircle className="h-5 w-5 text-red-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">{formatNumber(data.stats.inactive)}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Suspendues</p>
            </Card>
            <Card className="p-4">
              <div className="rounded-xl bg-blue-100 p-2.5 w-fit">
                <Shield className="h-5 w-5 text-blue-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">{formatNumber(data.stats.verified)}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Verifiees</p>
            </Card>
            <Card className="p-4">
              <div className="rounded-xl bg-orange-100 p-2.5 w-fit">
                <AlertTriangle className="h-5 w-5 text-orange-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">{formatNumber(data.stats.unverified)}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Non verifiees</p>
            </Card>
            <Card className="p-4">
              <div className="rounded-xl bg-purple-100 p-2.5 w-fit">
                <Clock className="h-5 w-5 text-purple-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">{formatNumber(data.stats.today)}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Aujourd&#39;hui</p>
            </Card>
            <Card className="p-4">
              <div className="rounded-xl bg-teal-100 p-2.5 w-fit">
                <Calendar className="h-5 w-5 text-teal-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">{formatNumber(data.stats.thisMonth)}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Ce mois</p>
            </Card>
            <Card className="p-4">
              <div className="rounded-xl bg-emerald-100 p-2.5 w-fit">
                <DollarSign className="h-5 w-5 text-emerald-600" />
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">{formatPrice(totalRevenue)}</p>
              <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">Revenus totaux</p>
            </Card>
          </div>
        )}

        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input id="search" placeholder="Rechercher par nom, vendeur, email..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
          </div>
          <div className="flex flex-wrap gap-2">
            {statusFilters.map(f => (
              <button key={f.key} onClick={() => setStatusFilter(f.key)}
                className={`whitespace-nowrap rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                  statusFilter === f.key ? "bg-[#0f172a] text-white" : "bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700"
                }`}>
                {f.label}
              </button>
            ))}
          </div>
          <select value={sort} onChange={e => setSort(e.target.value)}
            className="rounded-lg border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2.5 text-sm text-[#0f172a] focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20">
            {sortOptions.map(o => <option key={o.key} value={o.key}>{o.label}</option>)}
          </select>
        </div>
        <div className="hidden lg:block">
          <Card className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    <th className="px-5 py-3.5">Boutique</th>
                    <th className="px-5 py-3.5">Proprietaire</th>
                    <th className="px-5 py-3.5 text-center">Produits</th>
                    <th className="px-5 py-3.5 text-center">Commandes</th>
                    <th className="px-5 py-3.5 text-right">Revenus</th>
                    <th className="px-5 py-3.5 text-right">Commission</th>
                    <th className="px-5 py-3.5 text-center">Statut</th>
                    <th className="px-5 py-3.5">Cree le</th>
                    <th className="px-5 py-3.5 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {data?.shops.map(shop => (
                    <tr key={shop.id} className="cursor-pointer transition-colors hover:bg-gray-50/50 dark:bg-gray-800/30" onClick={() => fetchDetail(shop.id)}>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                            <Store className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate text-sm font-semibold text-[#0f172a]">{shop.name}</p>
                              {shop.isVerified && <Shield className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />}
                            </div>
                            <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{shop.slug}</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm text-[#0f172a]">{shop.owner.name || "Sans nom"}</p>
                          <p className="truncate text-xs text-gray-400 dark:text-gray-500">{shop.owner.email}</p>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-medium text-[#0f172a]">{formatNumber(shop.productCount)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className="text-sm font-medium text-[#0f172a]">{formatNumber(shop.orderCount)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm font-semibold text-[#0f172a]">{formatPrice(shop.revenue)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{formatPrice(shop.commissionGenerated)}</span>
                      </td>
                      <td className="px-5 py-4 text-center">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${shop.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                          {shop.isActive ? "Active" : "Suspendue"}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <span className="text-xs text-gray-500 dark:text-gray-400">{formatDate(shop.createdAt)}</span>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <div className="relative inline-block" ref={openDropdown === shop.id ? dropdownRef : undefined} onClick={e => e.stopPropagation()}>
                          <button onClick={() => setOpenDropdown(openDropdown === shop.id ? null : shop.id)} className="rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400">
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openDropdown === shop.id && (
                            <div className="absolute right-0 top-full z-50 mt-1 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 shadow-lg">
                              <button onClick={() => fetchDetail(shop.id)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#0f172a] hover:bg-gray-50 dark:hover:bg-gray-700">
                                <Eye className="h-4 w-4 text-gray-400 dark:text-gray-500" />Voir les details
                              </button>
                              <button onClick={() => toggleActive(shop.id, shop.isActive)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                                {shop.isActive ? (<><XCircle className="h-4 w-4 text-red-400" /><span className="text-red-600">Suspendre</span></>) : (<><CheckCircle className="h-4 w-4 text-green-400" /><span className="text-green-600">Activer</span></>)}
                              </button>
                              <button onClick={() => toggleVerified(shop.id, shop.isVerified)} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-gray-50 dark:hover:bg-gray-700">
                                {shop.isVerified ? (<><AlertTriangle className="h-4 w-4 text-orange-400" /><span className="text-orange-600">Retirer verification</span></>) : (<><Shield className="h-4 w-4 text-blue-400" /><span className="text-blue-600">Verifier</span></>)}
                              </button>
                              <a href={`/shops/${shop.slug}`} target="_blank" rel="noopener noreferrer" className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#0f172a] hover:bg-gray-50 dark:hover:bg-gray-700">
                                <ExternalLink className="h-4 w-4 text-gray-400 dark:text-gray-500" />Voir la boutique
                              </a>
                              <a href={`/admin/vendors?search=${shop.owner.email}`} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[#0f172a] hover:bg-gray-50 dark:hover:bg-gray-700">
                                <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />Profil vendeur
                              </a>
                              <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                              <button onClick={() => { setDeleteId(shop.id); setDeleteName(""); setOpenDropdown(null); }} className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50">
                                <Trash2 className="h-4 w-4" />Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {data && data.shops.length === 0 && (
              <div className="py-16 text-center">
                <Store className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Aucune boutique trouvee</p>
              </div>
            )}
          </Card>
        </div>

        <div className="space-y-3 lg:hidden">
          {data?.shops.map(shop => (
            <Card key={shop.id} className="p-4 cursor-pointer" onClick={() => fetchDetail(shop.id)}>
              <div className="flex items-start gap-3">
                <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-xl bg-indigo-100">
                  <Store className="h-6 w-6 text-indigo-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <p className="truncate text-sm font-semibold text-[#0f172a]">{shop.name}</p>
                    {shop.isVerified && <Shield className="h-3.5 w-3.5 flex-shrink-0 text-blue-500" />}
                  </div>
                  <p className="text-xs text-gray-500 dark:text-gray-400">{shop.owner.name || shop.owner.email}</p>
                  <div className="mt-2 flex flex-wrap gap-3 text-xs text-gray-500 dark:text-gray-400">
                    <span>{formatNumber(shop.productCount)} produits</span>
                    <span>{formatNumber(shop.orderCount)} commandes</span>
                    <span className="font-medium text-[#0f172a]">{formatPrice(shop.revenue)}</span>
                  </div>
                </div>
                <span className={`whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${shop.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                  {shop.isActive ? "Active" : "Suspendue"}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2 border-t border-gray-100 dark:border-gray-700/50 pt-3">
                <button onClick={e => { e.stopPropagation(); toggleActive(shop.id, shop.isActive); }}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${shop.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                  {shop.isActive ? "Suspendre" : "Activer"}
                </button>
                <button onClick={e => { e.stopPropagation(); toggleVerified(shop.id, shop.isVerified); }}
                  className={`flex-1 rounded-lg py-1.5 text-xs font-medium ${shop.isVerified ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
                  {shop.isVerified ? "Retirer verif." : "Verifier"}
                </button>
                <a href={`/shops/${shop.slug}`} target="_blank" rel="noopener noreferrer" onClick={e => e.stopPropagation()} className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </Card>
          ))}
          {data && data.shops.length === 0 && (
            <div className="py-16 text-center">
              <Store className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Aucune boutique trouvee</p>
            </div>
          )}
        </div>
        {data && (
          <div className="mt-8 grid gap-6 lg:grid-cols-2">
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-[#0f172a]">Alertes</h2>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Points d&#39;attention</p>
              <div className="mt-4 space-y-3">
                {unverifiedShops.length > 0 && (
                  <div className="rounded-xl bg-orange-50 p-4">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4 text-orange-500" />
                      <p className="text-sm font-medium text-orange-800">{unverifiedShops.length} boutique(s) non verifiee(s)</p>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {unverifiedShops.slice(0, 5).map(s => (
                        <div key={s.id} className="flex items-center justify-between">
                          <span className="text-xs text-orange-700">{s.name}</span>
                          <button onClick={() => toggleVerified(s.id, false)} className="text-xs font-medium text-orange-600 hover:text-orange-800">Verifier</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {suspendedShops.length > 0 && (
                  <div className="rounded-xl bg-red-50 p-4">
                    <div className="flex items-center gap-2">
                      <XCircle className="h-4 w-4 text-red-500" />
                      <p className="text-sm font-medium text-red-800">{suspendedShops.length} boutique(s) suspendue(s)</p>
                    </div>
                    <div className="mt-2 space-y-1.5">
                      {suspendedShops.slice(0, 5).map(s => (
                        <div key={s.id} className="flex items-center justify-between">
                          <span className="text-xs text-red-700">{s.name}</span>
                          <button onClick={() => toggleActive(s.id, false)} className="text-xs font-medium text-red-600 hover:text-red-800">Reactiver</button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {unverifiedShops.length === 0 && suspendedShops.length === 0 && (
                  <div className="py-8 text-center">
                    <CheckCircle className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Aucune alerte en cours</p>
                  </div>
                )}
              </div>
            </Card>

            <Card className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">Top boutiques</h2>
                  <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Classement par revenus</p>
                </div>
                <TrendingUp className="h-5 w-5 text-gray-300" />
              </div>
              <div className="mt-4 space-y-3">
                {data.topShops.slice(0, 5).map((shop, idx) => {
                  const maxRevenue = data.topShops[0]?.revenue || 1;
                  const pct = Math.round((shop.revenue / maxRevenue) * 100);
                  return (
                    <div key={shop.id}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2.5">
                          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-[#0f172a] text-[10px] font-bold text-white">{idx + 1}</span>
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-[#0f172a]">{shop.name}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{shop.vendorName}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-[#0f172a]">{formatPrice(shop.revenue)}</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">{formatNumber(shop.orderCount)} cmd</p>
                        </div>
                      </div>
                      <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                        <div className="h-full rounded-full bg-indigo-500 transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                  );
                })}
                {data.topShops.length === 0 && (
                  <div className="py-8 text-center">
                    <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
                    <p className="mt-3 text-sm text-gray-500 dark:text-gray-400">Aucune donnee disponible</p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        )}
      </div>
      {detailId && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={closeDetail} />
          <div className="relative flex h-full w-full max-w-2xl flex-col overflow-hidden bg-white dark:bg-gray-800 shadow-2xl animate-slide-in-right">
            {detailLoading || !detail ? (
              <div className="flex flex-1 items-center justify-center">
                <Loader2 className="h-8 w-8 animate-spin text-indigo-500" />
              </div>
            ) : (
              <>
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                      <Store className="h-5 w-5 text-indigo-600" />
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5">
                        <h2 className="text-lg font-semibold text-[#0f172a]">{detail.shop.name}</h2>
                        {detail.shop.isVerified && <Shield className="h-4 w-4 text-blue-500" />}
                      </div>
                      <p className="text-xs text-gray-400 dark:text-gray-500">/{detail.shop.slug}</p>
                    </div>
                  </div>
                  <button onClick={closeDetail} className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex items-center gap-2 border-b border-gray-100 dark:border-gray-700/50 px-6 py-3">
                  <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${detail.shop.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                    {detail.shop.isActive ? "Active" : "Suspendue"}
                  </span>
                  <button onClick={() => toggleActive(detail.shop.id, detail.shop.isActive)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${detail.shop.isActive ? "bg-red-50 text-red-600 hover:bg-red-100" : "bg-green-50 text-green-600 hover:bg-green-100"}`}>
                    {detail.shop.isActive ? "Suspendre" : "Activer"}
                  </button>
                  <button onClick={() => toggleVerified(detail.shop.id, detail.shop.isVerified)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-medium ${detail.shop.isVerified ? "bg-orange-50 text-orange-600 hover:bg-orange-100" : "bg-blue-50 text-blue-600 hover:bg-blue-100"}`}>
                    {detail.shop.isVerified ? "Retirer verif." : "Verifier"}
                  </button>
                  <div className="flex-1" />
                  <a href={`/shops/${detail.shop.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>

                <div className="flex-1 overflow-y-auto">
                  <div className="border-b border-gray-100 dark:border-gray-700/50 px-6 py-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Informations</h3>
                    <div className="mt-3 grid grid-cols-2 gap-3">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />{detail.shop.owner.name || "Sans nom"}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                        <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />{detail.shop.owner.email}
                      </div>
                      {detail.shop.phone && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <Phone className="h-4 w-4 text-gray-400 dark:text-gray-500" />{detail.shop.phone}
                        </div>
                      )}
                      {detail.shop.city && (
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <MapPin className="h-4 w-4 text-gray-400 dark:text-gray-500" />{detail.shop.city}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 border-b border-gray-100 dark:border-gray-700/50 p-6 sm:grid-cols-4">
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Revenus totaux</p>
                      <p className="mt-1 text-lg font-bold text-[#0f172a]">{formatPrice(detail.stats.totalRevenue)}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Ce mois</p>
                      <p className="mt-1 text-lg font-bold text-[#0f172a]">{formatPrice(detail.stats.monthRevenue)}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Aujourd&#39;hui</p>
                      <p className="mt-1 text-lg font-bold text-[#0f172a]">{formatPrice(detail.stats.todayRevenue)}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                      <p className="text-xs text-gray-500 dark:text-gray-400">Total commandes</p>
                      <p className="mt-1 text-lg font-bold text-[#0f172a]">{formatNumber(detail.stats.totalOrders)}</p>
                    </div>
                  </div>

                  <div className="border-b border-gray-100 dark:border-gray-700/50 px-6 py-4">
                    <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Commission</h3>
                    <div className="mt-3 flex gap-4">
                      <div className="rounded-lg bg-emerald-50 px-3 py-2">
                        <p className="text-xs text-emerald-600">Total payee</p>
                        <p className="text-sm font-semibold text-emerald-700">{formatPrice(detail.stats.totalPaidCommission)}</p>
                      </div>
                      <div className="rounded-lg bg-amber-50 px-3 py-2">
                        <p className="text-xs text-amber-600">En attente</p>
                        <p className="text-sm font-semibold text-amber-700">{formatPrice(detail.stats.pendingCommission)}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Taux</p>
                        <p className="text-sm font-semibold text-[#0f172a]">{detail.shop.commissionRate}%</p>
                      </div>
                    </div>
                  </div>
                  <div className="border-b border-gray-100 dark:border-gray-700/50 px-6 py-3">
                    <div className="flex gap-1">
                      {(["products", "orders", "top"] as const).map(tab => (
                        <button key={tab} onClick={() => setDetailTab(tab)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-medium transition-colors ${
                            detailTab === tab ? "bg-[#0f172a] text-white" : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          }`}>
                          {tab === "products" ? `Produits (${detail.products.length})` : tab === "orders" ? `Commandes (${detail.orders.length})` : "Top produits"}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="p-6">
                    {detailTab === "products" && (
                      <div className="space-y-2">
                        {detail.products.length === 0 && <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Aucun produit</p>}
                        {detail.products.map(p => (
                          <div key={p.id} className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-700/50 p-3">
                            <div className="min-w-0 flex-1">
                              <p className="truncate text-sm font-medium text-[#0f172a]">{p.name}</p>
                              <div className="mt-1 flex items-center gap-2">
                                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${productTypeBadge(p.type)}`}>
                                  {productTypeLabel(p.type)}
                                </span>
                                <span className="text-xs text-gray-400 dark:text-gray-500">{formatNumber(p.orderCount)} commandes</span>
                              </div>
                            </div>
                            <p className="text-sm font-semibold text-[#0f172a]">{formatPrice(p.price)}</p>
                          </div>
                        ))}
                      </div>
                    )}

                    {detailTab === "orders" && (
                      <div className="space-y-2">
                        {detail.orders.length === 0 && <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Aucune commande</p>}
                        {detail.orders.map(o => (
                          <div key={o.id} className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-700/50 p-3">
                            <div className="min-w-0 flex-1">
                              <p className="text-sm font-medium text-[#0f172a]">{o.orderNumber}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{o.user.name || o.user.email} &middot; {formatDate(o.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-semibold text-[#0f172a]">{formatPrice(o.total)}</p>
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${orderStatusBadge(o.status)}`}>
                                {orderStatusLabel(o.status)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {detailTab === "top" && (
                      <div className="space-y-3">
                        {detail.topProducts.length === 0 && <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Aucune donnee</p>}
                        {detail.topProducts.map((tp, idx) => {
                          const maxSold = detail.topProducts[0]?.totalSold || 1;
                          const pct = Math.round((tp.totalSold / maxSold) * 100);
                          return (
                            <div key={tp.id}>
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2.5">
                                  <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-700">{idx + 1}</span>
                                  <p className="text-sm font-medium text-[#0f172a]">{tp.name}</p>
                                </div>
                                <div className="text-right">
                                  <p className="text-sm font-semibold text-[#0f172a]">{formatPrice(tp.revenue)}</p>
                                  <p className="text-xs text-gray-400 dark:text-gray-500">{formatNumber(tp.totalSold)} vendus</p>
                                </div>
                              </div>
                              <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                                <div className="h-full rounded-full bg-indigo-400 transition-all" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => { if (!deleteLoading) { setDeleteId(null); setDeleteName(""); } }} />
          <div className="relative mx-4 w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                <Trash2 className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-[#0f172a]">Supprimer la boutique</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">Cette action est irreversible</p>
              </div>
            </div>
            <p className="mt-4 text-sm text-gray-600 dark:text-gray-400">
              Tapez le nom de la boutique <span className="font-semibold text-[#0f172a]">{data?.shops.find(s => s.id === deleteId)?.name}</span> pour confirmer la suppression.
            </p>
            <Input id="delete-confirm" placeholder="Nom de la boutique" value={deleteName} onChange={e => setDeleteName(e.target.value)} className="mt-3" />
            <div className="mt-6 flex justify-end gap-3">
              <Button variant="outline" onClick={() => { setDeleteId(null); setDeleteName(""); }} disabled={deleteLoading}>Annuler</Button>
              <Button variant="destructive" onClick={deleteShop} disabled={deleteLoading || deleteName !== data?.shops.find(s => s.id === deleteId)?.name}>
                {deleteLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Trash2 className="mr-2 h-4 w-4" />}
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
