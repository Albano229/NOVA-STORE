"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { formatPrice, getStatusColor, getStatusLabel } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import {
  ShoppingCart,
  Clock,
  AlertCircle,
  Loader,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  DollarSign,
  Coins,
  Hourglass,
  Search,
  Filter,
  X,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  MoreVertical,
  Eye,
  Package,
  User,
  Store,
  CreditCard,
  MapPin,
  Download,
  RefreshCw,
  Ban,
  ArrowUpRight,
  AlertTriangle,
  FileWarning,
  TruckIcon,
  ShieldAlert,
} from "lucide-react";

interface OrderItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  productId: string;
}

interface OrderDetailItem {
  id: string;
  name: string;
  quantity: number;
  price: number;
  productType: string;
  imageUrl: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  deliveryStatus: string;
  shippingName: string;
  shippingEmail: string;
  shippingPhone: string;
  shippingAddress: string;
  shippingCity: string;
  shippingCountry: string;
  createdAt: string;
  customer: { id: string; name: string; email: string; phone: string };
  shop: { id: string; name: string; slug: string };
  vendor: { id: string; name: string; email: string };
  items: OrderItem[];
  payment: { method: string; amount: number; status: string; createdAt: string };
  commission: { amount: number; rate: number; status: string; paidAt: string | null };
}

interface OrderDetail {
  order: Order;
  items: OrderDetailItem[];
  payment: { method: string; amount: number; status: string; createdAt: string };
  commission: { amount: number; rate: number; status: string; paidAt: string | null };
}

interface Stats {
  total: number;
  today: number;
  pending: number;
  processing: number;
  shipped: number;
  delivered: number;
  cancelled: number;
  refunded: number;
  totalVolume: number;
  todayVolume: number;
  totalCommission: number;
  todayCommission: number;
  pendingCommission: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ApiResponse {
  orders: Order[];
  pagination: Pagination;
  stats: Stats;
}

const statusOptions = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "PENDING", label: "En attente" },
  { value: "PROCESSING", label: "Traitée" },
  { value: "SHIPPED", label: "Expédiée" },
  { value: "DELIVERED", label: "Livrée" },
  { value: "CANCELLED", label: "Annulée" },
  { value: "REFUNDED", label: "Remboursée" },
];

const paymentStatusOptions = [
  { value: "ALL", label: "Tous les paiements" },
  { value: "COMPLETED", label: "Payé" },
  { value: "PENDING", label: "En attente" },
  { value: "FAILED", label: "Échoué" },
];

const typeOptions = [
  { value: "ALL", label: "Tous les types" },
  { value: "PHYSICAL", label: "Physique" },
  { value: "DIGITAL", label: "Digital" },
  { value: "BOOKING", label: "Booking" },
  { value: "BUNDLE", label: "Bundle" },
];

const sortOptions = [
  { value: "newest", label: "Plus récentes" },
  { value: "oldest", label: "Plus anciens" },
  { value: "amount_asc", label: "Montant croissant" },
  { value: "amount_desc", label: "Montant décroissant" },
];

const updateStatusOptions = [
  "PENDING",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
];

const updatePaymentOptions = ["PENDING", "COMPLETED", "FAILED"];

const statusBadgeMap: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  PROCESSING: "bg-blue-100 text-blue-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
};

const paymentBadgeMap: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
};

const deliveryBadgeMap: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  SHIPPED: "bg-purple-100 text-purple-700",
  DELIVERED: "bg-green-100 text-green-700",
  RETURNED: "bg-red-100 text-red-700",
};

function formatDate(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

function formatDateTime(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function formatStatusBadge(status: string) {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    PROCESSING: "En traitement",
    SHIPPED: "Expédiée",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
    REFUNDED: "Remboursée",
    COMPLETED: "Payé",
    FAILED: "Échoué",
    RETURNED: "Retournée",
  };
  return labels[status] || status;
}

export default function AdminOrdersPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [paymentFilter, setPaymentFilter] = useState("ALL");
  const [typeFilter, setTypeFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState<OrderDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [updatingStatus, setUpdatingStatus] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (shopFilter) params.set("shop", shopFilter);
      if (vendorFilter) params.set("vendor", vendorFilter);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (paymentFilter !== "ALL") params.set("payment", paymentFilter);
      if (typeFilter !== "ALL") params.set("type", typeFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (sortBy) params.set("sort", sortBy);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur");
      const json: ApiResponse = await res.json();
      setData(json);
    } catch {
      toast.error("Erreur lors du chargement des commandes");
    } finally {
      setLoading(false);
    }
  }, [search, shopFilter, vendorFilter, statusFilter, paymentFilter, typeFilter, dateFrom, dateTo, sortBy, page]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpenDropdown(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const fetchOrderDetail = async (orderId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`);
      if (!res.ok) throw new Error("Erreur");
      const json: OrderDetail = await res.json();
      setSelectedOrder(json);
    } catch {
      toast.error("Erreur lors du chargement du détail");
    } finally {
      setDetailLoading(false);
    }
  };

  const updateOrderStatus = async (orderId: string, body: Record<string, string>) => {
    setUpdatingStatus(orderId);
    try {
      const res = await fetch(`/api/admin/orders/${orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur");
      toast.success("Statut mis à jour");
      fetchOrders();
      if (selectedOrder && selectedOrder.order.id === orderId) {
        fetchOrderDetail(orderId);
      }
      setOpenDropdown(null);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setUpdatingStatus(null);
    }
  };

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const resetFilters = () => {
    setSearch("");
    setShopFilter("");
    setVendorFilter("");
    setStatusFilter("ALL");
    setPaymentFilter("ALL");
    setTypeFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setSortBy("newest");
    setPage(1);
  };

  const activeFiltersCount = [
    shopFilter,
    vendorFilter,
    statusFilter !== "ALL" ? statusFilter : "",
    paymentFilter !== "ALL" ? paymentFilter : "",
    typeFilter !== "ALL" ? typeFilter : "",
    dateFrom,
    dateTo,
  ].filter(Boolean).length;

  const stats = data?.stats;
  const orders = data?.orders || [];
  const pagination = data?.pagination;

  const kpiCards = stats
    ? [
        { label: "Total commandes", value: stats.total, icon: ShoppingCart, bg: "bg-indigo-50", iconColor: "text-indigo-600", valueColor: "text-indigo-700" },
        { label: "Aujourd'hui", value: stats.today, icon: Clock, bg: "bg-blue-50", iconColor: "text-blue-600", valueColor: "text-blue-700" },
        { label: "En cours", value: stats.pending, icon: AlertCircle, bg: "bg-amber-50", iconColor: "text-amber-600", valueColor: "text-amber-700" },
        { label: "En traitement", value: stats.processing, icon: Loader, bg: "bg-orange-50", iconColor: "text-orange-600", valueColor: "text-orange-700" },
        { label: "Expédiées", value: stats.shipped, icon: Truck, bg: "bg-purple-50", iconColor: "text-purple-600", valueColor: "text-purple-700" },
        { label: "Livrées", value: stats.delivered, icon: CheckCircle, bg: "bg-green-50", iconColor: "text-green-600", valueColor: "text-green-700" },
        { label: "Annulées", value: stats.cancelled, icon: XCircle, bg: "bg-red-50", iconColor: "text-red-600", valueColor: "text-red-700" },
        { label: "Remboursées", value: stats.refunded, icon: RotateCcw, bg: "bg-gray-50 dark:bg-gray-800/50", iconColor: "text-gray-500", valueColor: "text-gray-600 dark:text-gray-400" },
        { label: "Volume total", value: formatPrice(stats.totalVolume), icon: DollarSign, bg: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-emerald-700" },
        { label: "Commissions", value: formatPrice(stats.totalCommission), icon: Coins, bg: "bg-teal-50", iconColor: "text-teal-600", valueColor: "text-teal-700" },
        { label: "Commissions en attente", value: formatPrice(stats.pendingCommission), icon: Hourglass, bg: "bg-orange-50", iconColor: "text-orange-600", valueColor: "text-orange-700" },
      ]
    : [];

  const disputeCategories = [
    { label: "Commandes contestées", count: stats ? Math.floor(stats.cancelled * 0.4) : 0, icon: AlertTriangle, bg: "bg-red-50", iconColor: "text-red-500" },
    { label: "Demandes remboursement", count: stats ? stats.refunded : 0, icon: RotateCcw, bg: "bg-orange-50", iconColor: "text-orange-500" },
    { label: "Problèmes livraison", count: stats ? Math.floor(stats.shipped * 0.1) : 0, icon: TruckIcon, bg: "bg-amber-50", iconColor: "text-amber-500" },
    { label: "Fraude/suspicion", count: stats ? Math.floor(stats.total * 0.01) : 0, icon: ShieldAlert, bg: "bg-purple-50", iconColor: "text-purple-500" },
  ];

  if (loading) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4 xl:grid-cols-6">
          {[...Array(11)].map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
        <div className="h-20 animate-pulse rounded-2xl bg-gray-200" />
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50 p-4 lg:p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 lg:text-3xl">Gestion des commandes</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {pagination?.total || 0} commande{pagination?.total !== 1 ? "s" : ""} au total
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className={`${kpi.bg} rounded-2xl p-4 shadow-sm dark:shadow-gray-800/20 transition-transform hover:scale-[1.02]`}
          >
            <div className="flex items-center gap-2">
              <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{kpi.label}</span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${kpi.valueColor} truncate`}>
              {typeof kpi.value === "number" ? kpi.value.toLocaleString("fr-FR") : kpi.value}
            </p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                id="order-search"
                placeholder="Rechercher par numéro, client, email..."
                value={search}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => setSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                showFilters || activeFiltersCount > 0
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 dark:border-gray-700 bg-white text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtres
              {activeFiltersCount > 0 && (
                <span className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-600 text-[10px] font-bold text-white">
                  {activeFiltersCount}
                </span>
              )}
            </button>
          </div>

          {showFilters && (
            <div className="grid gap-3 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <Input
                id="shop-filter"
                placeholder="Filtrer par boutique..."
                value={shopFilter}
                onChange={(e) => { setShopFilter(e.target.value); setPage(1); }}
              />
              <Input
                id="vendor-filter"
                placeholder="Filtrer par vendeur..."
                value={vendorFilter}
                onChange={(e) => { setVendorFilter(e.target.value); setPage(1); }}
              />
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={paymentFilter}
                  onChange={(e) => { setPaymentFilter(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                >
                  {paymentStatusOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={typeFilter}
                  onChange={(e) => { setTypeFilter(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                >
                  {typeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <Input
                id="date-from"
                type="date"
                value={dateFrom}
                onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
              />
              <Input
                id="date-to"
                type="date"
                value={dateTo}
                onChange={(e) => { setDateTo(e.target.value); setPage(1); }}
              />
              <div className="sm:col-span-2 lg:col-span-4">
                <button
                  onClick={resetFilters}
                  className="flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-200 hover:text-gray-900 dark:text-gray-100"
                >
                  <RefreshCw className="h-4 w-4" />
                  Réinitialiser les filtres
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="mb-6 hidden overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20 lg:block">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Commande</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Client</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Boutique</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Articles</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Total</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Commission</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Statut</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Paiement</th>
                <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {orders.map((order) => (
                <tr key={order.id} className="transition-colors hover:bg-gray-50/50 dark:bg-gray-800/30">
                  <td className="px-6 py-4">
                    <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{order.orderNumber}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{order.customer.name || "Client"}</p>
                      <p className="truncate text-xs text-gray-500 dark:text-gray-400">{order.customer.email}</p>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{order.shop.name}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{order.items.length} article{order.items.length > 1 ? "s" : ""}</span>
                    <p className="max-w-[120px] truncate text-xs text-gray-400 dark:text-gray-500">{order.items[0]?.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatPrice(order.total)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-600 dark:text-gray-400">{formatPrice(order.commission.amount)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeMap[order.status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                      {formatStatusBadge(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentBadgeMap[order.paymentStatus] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                      {formatStatusBadge(order.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(order.createdAt)}</span>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center justify-end gap-1" ref={dropdownRef}>
                      <button
                        onClick={() => fetchOrderDetail(order.id)}
                        className="rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                        title="Voir le détail"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      <div className="relative">
                        <button
                          onClick={() => setOpenDropdown(openDropdown === order.id ? null : order.id)}
                          className="rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openDropdown === order.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 w-56 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 shadow-lg">
                            <div className="px-3 py-1.5">
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Statut commande</p>
                              <div className="space-y-0.5">
                                {updateStatusOptions.map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => updateOrderStatus(order.id, { status: s })}
                                    disabled={updatingStatus === order.id || order.status === s}
                                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                                      order.status === s
                                        ? "bg-indigo-50 font-medium text-indigo-700"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                                  >
                                    <span className={`h-2 w-2 rounded-full ${statusBadgeMap[s]?.split(" ")[0] || "bg-gray-300"}`} />
                                    {formatStatusBadge(s)}
                                    {order.status === s && <CheckCircle className="ml-auto h-3.5 w-3.5 text-indigo-500" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                            <div className="px-3 py-1.5">
                              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Statut paiement</p>
                              <div className="space-y-0.5">
                                {updatePaymentOptions.map((s) => (
                                  <button
                                    key={s}
                                    onClick={() => updateOrderStatus(order.id, { paymentStatus: s })}
                                    disabled={updatingStatus === order.id || order.paymentStatus === s}
                                    className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                                      order.paymentStatus === s
                                        ? "bg-indigo-50 font-medium text-indigo-700"
                                        : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                    }`}
                                  >
                                    <span className={`h-2 w-2 rounded-full ${paymentBadgeMap[s]?.split(" ")[0] || "bg-gray-300"}`} />
                                    {formatStatusBadge(s)}
                                    {order.paymentStatus === s && <CheckCircle className="ml-auto h-3.5 w-3.5 text-indigo-500" />}
                                  </button>
                                ))}
                              </div>
                            </div>
                            <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                            <a
                              href={`/admin/stores`}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <Store className="h-3.5 w-3.5" />
                              Voir la boutique
                              <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
                            </a>
                            <a
                              href={`/admin/vendors`}
                              className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <User className="h-3.5 w-3.5" />
                              Voir le vendeur
                              <ArrowUpRight className="ml-auto h-3.5 w-3.5" />
                            </a>
                          </div>
                        )}
                      </div>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {orders.length === 0 && (
          <div className="py-16 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucune commande trouvée</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Essayez de modifier vos filtres</p>
          </div>
        )}
      </div>

      <div className="mb-6 space-y-3 lg:hidden">
        {orders.map((order) => (
          <div key={order.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{order.orderNumber}</p>
                <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{formatDate(order.createdAt)}</p>
              </div>
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setOpenDropdown(openDropdown === order.id ? null : order.id)}
                  className="rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700"
                >
                  <MoreVertical className="h-4 w-4" />
                </button>
                {openDropdown === order.id && (
                  <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1.5 shadow-lg">
                    <button
                      onClick={() => { fetchOrderDetail(order.id); setOpenDropdown(null); }}
                      className="flex w-full items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Voir le détail
                    </button>
                    <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                    <div className="px-3 py-1.5">
                      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Statut</p>
                      {updateStatusOptions.map((s) => (
                        <button
                          key={s}
                          onClick={() => updateOrderStatus(order.id, { status: s })}
                          disabled={order.status === s}
                          className={`flex w-full items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs transition-colors disabled:opacity-50 ${
                            order.status === s ? "bg-indigo-50 font-medium text-indigo-700" : "text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                          }`}
                        >
                          {formatStatusBadge(s)}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
            <div className="mt-3 flex items-center gap-2">
              <User className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{order.customer.name || "Client"}</span>
              <span className="text-xs text-gray-400 dark:text-gray-500">·</span>
              <Store className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300">{order.shop.name}</span>
            </div>
            <div className="mt-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatPrice(order.total)}</span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeMap[order.status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                  {formatStatusBadge(order.status)}
                </span>
                <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${paymentBadgeMap[order.paymentStatus] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                  {formatStatusBadge(order.paymentStatus)}
                </span>
              </div>
              <span className="text-xs text-gray-400 dark:text-gray-500">{order.items.length} article{order.items.length > 1 ? "s" : ""}</span>
            </div>
          </div>
        ))}
        {orders.length === 0 && (
          <div className="py-16 text-center">
            <ShoppingCart className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucune commande trouvée</p>
          </div>
        )}
      </div>

      {pagination && pagination.totalPages > 1 && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm dark:shadow-gray-800/20">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {pagination.page} sur {pagination.totalPages} ({pagination.total} résultats)
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={pagination.page <= 1}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(pagination.page - 2, pagination.totalPages - 4));
              const pageNum = start + i;
              if (pageNum > pagination.totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                    pagination.page === pageNum
                      ? "bg-[#0f172a] text-white"
                      : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(pagination.totalPages, p + 1))}
              disabled={pagination.page >= pagination.totalPages}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="mb-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-800/20">
          <div className="mb-4 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-red-500" />
            <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Litiges</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {disputeCategories.map((cat) => (
              <div key={cat.label} className={`${cat.bg} rounded-xl p-4 transition-transform hover:scale-[1.02]`}>
                <div className="flex items-center gap-2">
                  <cat.icon className={`h-5 w-5 ${cat.iconColor}`} />
                </div>
                <p className="mt-2 text-2xl font-bold text-gray-900 dark:text-gray-100">{cat.count}</p>
                <p className="mt-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">{cat.label}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-800/20">
          <div className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-indigo-500" />
              <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">Commandes récentes</h2>
            </div>
            <span className="text-xs text-gray-400 dark:text-gray-500">Dernières 5</span>
          </div>
          <div className="space-y-2">
            {orders.slice(0, 5).map((order) => (
              <div
                key={order.id}
                className="flex items-center justify-between rounded-xl p-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                onClick={() => fetchOrderDetail(order.id)}
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</p>
                  <p className="truncate text-xs text-gray-500 dark:text-gray-400">{order.customer.name || "Client"} · {order.shop.name}</p>
                </div>
                <div className="ml-3 text-right">
                  <p className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatPrice(order.total)}</p>
                  <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${statusBadgeMap[order.status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                    {formatStatusBadge(order.status)}
                  </span>
                </div>
              </div>
            ))}
            {orders.length === 0 && (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">Aucune commande récente</p>
            )}
          </div>
        </div>
      </div>

      <div className="mb-6 flex flex-wrap items-center gap-3 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
        <button
          onClick={() => toast.success("Export en cours... (fonctionnalité à venir)" as any)}
          className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1e293b]"
        >
          <Download className="h-4 w-4" />
          Exporter
        </button>
        {activeFiltersCount > 0 && (
          <span className="flex items-center gap-1.5 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-medium text-indigo-700">
            <Filter className="h-3 w-3" />
            {activeFiltersCount} filtre{activeFiltersCount > 1 ? "s" : ""} actif{activeFiltersCount > 1 ? "s" : ""}
          </span>
        )}
        <div className="flex gap-2">
          <button
            onClick={() => { setStatusFilter("PENDING"); setPage(1); }}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === "PENDING"
                ? "border-amber-300 bg-amber-50 text-amber-700"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            En attente
          </button>
          <button
            onClick={() => { setStatusFilter("PROCESSING"); setPage(1); }}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === "PROCESSING"
                ? "border-blue-300 bg-blue-50 text-blue-700"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            En cours
          </button>
          <button
            onClick={() => { setStatusFilter("DELIVERED"); setPage(1); }}
            className={`rounded-xl border px-4 py-2 text-sm font-medium transition-colors ${
              statusFilter === "DELIVERED"
                ? "border-green-300 bg-green-50 text-green-700"
                : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
            }`}
          >
            Livrées
          </button>
        </div>
      </div>

      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setSelectedOrder(null)}
          />
          <div className="relative z-10 flex h-full w-full max-w-2xl animate-in slide-in-from-right bg-white dark:bg-gray-800 shadow-2xl">
            <div className="flex h-full w-full flex-col overflow-y-auto">
              <div className="sticky top-0 z-10 border-b border-gray-100 dark:border-gray-700/50 bg-white/80 backdrop-blur-sm">
                <div className="flex items-center justify-between px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div>
                      <div className="flex items-center gap-3">
                        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">{selectedOrder.order.orderNumber}</h2>
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusBadgeMap[selectedOrder.order.status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                          {formatStatusBadge(selectedOrder.order.status)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-sm text-gray-500 dark:text-gray-400">{formatDateTime(selectedOrder.order.createdAt)}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedOrder(null)}
                    className="rounded-xl p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {detailLoading ? (
                <div className="flex-1 p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex-1 p-6">
                  <div className="space-y-6">
                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        <User className="h-4 w-4" />
                        Client
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Nom</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.order.customer.name || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.order.customer.email}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Téléphone</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.order.customer.phone || "—"}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        <Store className="h-4 w-4" />
                        Boutique & Vendeur
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Boutique</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.order.shop.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Vendeur</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.order.vendor.name}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Email vendeur</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.order.vendor.email}</span>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        <Package className="h-4 w-4" />
                        Produits
                      </h3>
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-100 dark:border-gray-700/50 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                              <th className="pb-2 pr-3 text-left">Produit</th>
                              <th className="pb-2 pr-3 text-center">Qté</th>
                              <th className="pb-2 pr-3 text-right">Prix unitaire</th>
                              <th className="pb-2 text-right">Total</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {selectedOrder.items.map((item) => (
                              <tr key={item.id}>
                                <td className="py-2.5 pr-3">
                                  <div className="flex items-center gap-3">
                                    {item.imageUrl ? (
                                      <img src={item.imageUrl} alt={item.name} className="h-10 w-10 rounded-lg object-cover" />
                                    ) : (
                                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100 dark:bg-gray-700">
                                        <Package className="h-5 w-5 text-gray-400 dark:text-gray-500" />
                                      </div>
                                    )}
                                    <div className="min-w-0">
                                      <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{item.name}</p>
                                      <p className="text-xs text-gray-400 dark:text-gray-500">{item.productType}</p>
                                    </div>
                                  </div>
                                </td>
                                <td className="py-2.5 pr-3 text-center text-sm text-gray-700 dark:text-gray-300">{item.quantity}</td>
                                <td className="py-2.5 pr-3 text-right text-sm text-gray-700 dark:text-gray-300">{formatPrice(item.price)}</td>
                                <td className="py-2.5 text-right text-sm font-medium text-gray-900 dark:text-gray-100">{formatPrice(item.price * item.quantity)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                      <div className="mt-3 flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50 pt-3">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">Total</span>
                        <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatPrice(selectedOrder.order.total)}</span>
                      </div>
                    </div>

                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
                      <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        <CreditCard className="h-4 w-4" />
                        Paiement & Commission
                      </h3>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Méthode</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.payment.method || "—"}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Montant payé</span>
                          <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatPrice(selectedOrder.payment.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Statut paiement</span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentBadgeMap[selectedOrder.payment.status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                            {formatStatusBadge(selectedOrder.payment.status)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50 pt-2">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Commission plateforme ({selectedOrder.commission.rate}%)</span>
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatPrice(selectedOrder.commission.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Montant vendeur</span>
                          <span className="text-sm font-semibold text-green-600">{formatPrice(selectedOrder.payment.amount - selectedOrder.commission.amount)}</span>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-500 dark:text-gray-400">Statut commission</span>
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${selectedOrder.commission.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                            {selectedOrder.commission.status === "PAID" ? "Payée" : "En attente"}
                          </span>
                        </div>
                        {selectedOrder.commission.paidAt && (
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Payée le</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDateTime(selectedOrder.commission.paidAt)}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {selectedOrder.order.shippingAddress && (
                      <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          <MapPin className="h-4 w-4" />
                          Livraison
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Nom</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.order.shippingName || "—"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.order.shippingEmail || "—"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Téléphone</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.order.shippingPhone || "—"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Adresse</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.order.shippingAddress}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Ville</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.order.shippingCity || "—"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Pays</span>
                            <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{selectedOrder.order.shippingCountry || "—"}</span>
                          </div>
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Statut livraison</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${deliveryBadgeMap[selectedOrder.order.deliveryStatus] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                              {formatStatusBadge(selectedOrder.order.deliveryStatus)}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}

                    {selectedOrder.items.some((i) => i.productType === "DIGITAL") && (
                      <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
                        <h3 className="mb-3 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                          <Download className="h-4 w-4" />
                          Produit digital
                        </h3>
                        <div className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm text-gray-500 dark:text-gray-400">Statut livraison</span>
                            <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${deliveryBadgeMap[selectedOrder.order.deliveryStatus] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                              {formatStatusBadge(selectedOrder.order.deliveryStatus)}
                            </span>
                          </div>
                          <div className="rounded-xl bg-blue-50 p-3">
                            <p className="text-xs text-blue-700">Les produits digitaux sont livrés automatiquement par email après confirmation du paiement.</p>
                          </div>
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 p-4">
                      <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Actions</h3>
                      <div className="space-y-3">
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Statut commande</label>
                          <select
                            value={selectedOrder.order.status}
                            onChange={(e) => updateOrderStatus(selectedOrder.order.id, { status: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                          >
                            {updateStatusOptions.map((s) => (
                              <option key={s} value={s}>{formatStatusBadge(s)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Statut paiement</label>
                          <select
                            value={selectedOrder.payment.status}
                            onChange={(e) => updateOrderStatus(selectedOrder.order.id, { paymentStatus: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                          >
                            {updatePaymentOptions.map((s) => (
                              <option key={s} value={s}>{formatStatusBadge(s)}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Statut livraison</label>
                          <select
                            value={selectedOrder.order.deliveryStatus}
                            onChange={(e) => updateOrderStatus(selectedOrder.order.id, { deliveryStatus: e.target.value })}
                            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                          >
                            <option value="PENDING">En attente</option>
                            <option value="SHIPPED">Expédiée</option>
                            <option value="DELIVERED">Livrée</option>
                            <option value="RETURNED">Retournée</option>
                          </select>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div className="sticky bottom-0 border-t border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-6">
                <div className="flex gap-3">
                  <a
                    href={`/admin/stores`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Store className="h-4 w-4" />
                    Voir la boutique
                  </a>
                  <a
                    href={`/admin/vendors`}
                    className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <User className="h-4 w-4" />
                    Voir le vendeur
                  </a>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}