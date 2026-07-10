"use client";

import { useEffect, useState, useCallback } from "react";
import { formatPrice } from "@/lib/utils";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import {
  DollarSign,
  Clock,
  Calendar,
  Coins,
  TrendingUp,
  CreditCard,
  XCircle,
  RotateCcw,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  CheckCircle,
  Ban,
  AlertTriangle,
  Wallet,
  FileText,
  Store,
  User,
  ArrowUpDown,
  RefreshCw,
  Download,
  Send,
  BanIcon,
  Undo2,
} from "lucide-react";

interface Transaction {
  id: string;
  orderId: string;
  method: string;
  amount: number;
  status: string;
  transactionId: string | null;
  createdAt: string;
  orderNumber: string;
  orderTotal: number;
  userId: string;
  shopId: string;
  customerName: string | null;
  customerEmail: string;
  shopName: string;
  commissionAmount: number;
  commissionRate: number;
  commissionStatus: string;
}

interface Payout {
  id: string;
  userId: string;
  shopId: string;
  amount: number;
  status: string;
  method: string;
  createdAt: string;
  vendorName: string;
  vendorEmail: string;
  shopName: string;
}

interface Commission {
  id: string;
  orderId: string;
  shopId: string;
  amount: number;
  rate: number;
  status: string;
  paidAt: string | null;
  createdAt: string;
  orderNumber: string;
  shopName: string;
}

interface Refund {
  id: string;
  orderId: string;
  amount: number;
  status: string;
  createdAt: string;
  orderNumber: string;
  customerName: string | null;
  customerEmail: string;
}

interface Stats {
  totalRevenue: number;
  todayRevenue: number;
  monthRevenue: number;
  totalCommissions: number;
  todayCommissions: number;
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  pendingTransactions: number;
  totalRefunds: number;
}

interface ApiResponse {
  transactions: Transaction[];
  payouts: Payout[];
  commissions: Commission[];
  refunds: Refund[];
  stats: Stats;
}

const paymentStatusBadge: Record<string, string> = {
  COMPLETED: "bg-green-100 text-green-700",
  PENDING: "bg-amber-100 text-amber-700",
  FAILED: "bg-red-100 text-red-700",
  REFUNDED: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
};

const paymentStatusLabel: Record<string, string> = {
  COMPLETED: "Terminé",
  PENDING: "En attente",
  FAILED: "Échoué",
  REFUNDED: "Remboursé",
};

const payoutStatusBadge: Record<string, string> = {
  PENDING: "bg-amber-100 text-amber-700",
  APPROVED: "bg-blue-100 text-blue-700",
  REJECTED: "bg-red-100 text-red-700",
  PAID: "bg-green-100 text-green-700",
};

const payoutStatusLabel: Record<string, string> = {
  PENDING: "En attente",
  APPROVED: "Approuvé",
  REJECTED: "Rejeté",
  PAID: "Payé",
};

const methodBadge: Record<string, string> = {
  STRIPE: "bg-indigo-100 text-indigo-700",
  PAYPAL: "bg-blue-100 text-blue-700",
  FLUTTERWAVE: "bg-purple-100 text-purple-700",
  ORANGE_MONEY: "bg-orange-100 text-orange-700",
  WAVE: "bg-cyan-100 text-cyan-700",
  MTN_MONEY: "bg-yellow-100 text-yellow-700",
  CARD: "bg-indigo-100 text-indigo-700",
};

const sortOptions = [
  { value: "newest", label: "Plus récent" },
  { value: "oldest", label: "Plus ancien" },
  { value: "amount_desc", label: "Montant ↓" },
  { value: "amount_asc", label: "Montant ↑" },
  { value: "status", label: "Statut" },
];

const statusOptions = [
  { value: "ALL", label: "Tous les statuts" },
  { value: "COMPLETED", label: "Terminé" },
  { value: "PENDING", label: "En attente" },
  { value: "FAILED", label: "Échoué" },
  { value: "REFUNDED", label: "Remboursé" },
];

const methodOptions = [
  { value: "ALL", label: "Toutes les méthodes" },
  { value: "STRIPE", label: "Stripe" },
  { value: "PAYPAL", label: "PayPal" },
  { value: "FLUTTERWAVE", label: "Flutterwave" },
  { value: "ORANGE_MONEY", label: "Orange Money" },
  { value: "WAVE", label: "Wave" },
  { value: "MTN_MONEY", label: "MTN Money" },
];

function formatDate(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });
}

function formatDateTime(d: string) {
  return new Date(d).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPaymentsPage() {
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [methodFilter, setMethodFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [activeTab, setActiveTab] = useState<"transactions" | "payouts" | "commissions" | "refunds">("transactions");
  const [payoutActionModal, setPayoutActionModal] = useState<{ type: "approve" | "reject"; payout: Payout } | null>(null);
  const [refundModal, setRefundModal] = useState<Transaction | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [refundAmount, setRefundAmount] = useState("");
  const [refundReason, setRefundReason] = useState("");

  const fetchPayments = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (statusFilter !== "ALL") params.set("status", statusFilter);
      if (methodFilter !== "ALL") params.set("method", methodFilter);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      if (sortBy) params.set("sort", sortBy);

      const res = await fetch(`/api/admin/payments?${params.toString()}`);
      if (!res.ok) throw new Error("Erreur");
      const json: ApiResponse = await res.json();
      setData(json);
    } catch {
      toast.error("Erreur lors du chargement des paiements");
    } finally {
      setLoading(false);
    }
  }, [search, statusFilter, methodFilter, dateFrom, dateTo, sortBy]);

  useEffect(() => {
    fetchPayments();
  }, [fetchPayments]);

  const resetFilters = () => {
    setSearch("");
    setStatusFilter("ALL");
    setMethodFilter("ALL");
    setDateFrom("");
    setDateTo("");
    setSortBy("newest");
    setPage(1);
  };

  const handlePayoutAction = async (payoutId: string, action: "approve" | "reject") => {
    setActionLoading(true);
    try {
      const body: Record<string, string> = { status: action === "approve" ? "APPROVED" : "REJECTED" };
      if (action === "reject" && rejectReason) body.reason = rejectReason;

      const res = await fetch(`/api/admin/payouts/${payoutId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (!res.ok) throw new Error("Erreur");

      const logRes = await fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: `PAYOUT_${action.toUpperCase()}`,
          targetId: payoutId,
          details: `Retrait ${action === "approve" ? "approuvé" : "rejeté"}${rejectReason ? `: ${rejectReason}` : ""}`,
        }),
      }).catch(() => {});

      toast.success(`Retrait ${action === "approve" ? "approuvé" : "rejeté"}`);
      setPayoutActionModal(null);
      setRejectReason("");
      fetchPayments();
    } catch {
      toast.error("Erreur lors de l'action");
    } finally {
      setActionLoading(false);
    }
  };

  const handleRefund = async (tx: Transaction) => {
    if (!refundAmount || Number(refundAmount) <= 0) {
      toast.error("Montant invalide");
      return;
    }
    if (Number(refundAmount) > tx.amount) {
      toast.error("Le montant ne peut pas dépasser le montant original");
      return;
    }
    setActionLoading(true);
    try {
      const res = await fetch(`/api/admin/orders/${tx.orderId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "REFUNDED",
          paymentStatus: "REFUNDED",
          refundAmount: Number(refundAmount),
          refundReason,
        }),
      });
      if (!res.ok) throw new Error("Erreur");

      await fetch("/api/admin/audit-logs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "ORDER_REFUND",
          targetId: tx.orderId,
          details: `Remboursement de ${formatPrice(Number(refundAmount))} pour la commande ${tx.orderNumber}. Raison: ${refundReason || "Non spécifiée"}`,
        }),
      }).catch(() => {});

      toast.success("Remboursement effectué");
      setRefundModal(null);
      setRefundAmount("");
      setRefundReason("");
      fetchPayments();
    } catch {
      toast.error("Erreur lors du remboursement");
    } finally {
      setActionLoading(false);
    }
  };

  const stats = data?.stats;
  const transactions = data?.transactions || [];
  const payouts = data?.payouts || [];
  const commissions = data?.commissions || [];
  const refunds = data?.refunds || [];

  const PAGE_SIZE = 10;
  const paginatedTx = transactions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalTxPages = Math.ceil(transactions.length / PAGE_SIZE);
  const paginatedPayouts = payouts.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalPayoutPages = Math.ceil(payouts.length / PAGE_SIZE);
  const paginatedCommissions = commissions.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalCommPages = Math.ceil(commissions.length / PAGE_SIZE);
  const paginatedRefunds = refunds.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);
  const totalRefundPages = Math.ceil(refunds.length / PAGE_SIZE);

  const kpiCards = stats
    ? [
        { label: "Revenus totaux", value: formatPrice(stats.totalRevenue), icon: DollarSign, bg: "bg-emerald-50", iconColor: "text-emerald-600", valueColor: "text-emerald-700" },
        { label: "Revenus aujourd'hui", value: formatPrice(stats.todayRevenue), icon: Clock, bg: "bg-blue-50", iconColor: "text-blue-600", valueColor: "text-blue-700" },
        { label: "Revenus ce mois", value: formatPrice(stats.monthRevenue), icon: Calendar, bg: "bg-purple-50", iconColor: "text-purple-600", valueColor: "text-purple-700" },
        { label: "Total commissions", value: formatPrice(stats.totalCommissions), icon: Coins, bg: "bg-amber-50", iconColor: "text-amber-600", valueColor: "text-amber-700" },
        { label: "Commissions aujourd'hui", value: formatPrice(stats.todayCommissions), icon: TrendingUp, bg: "bg-green-50", iconColor: "text-green-600", valueColor: "text-green-700" },
        { label: "Transactions", value: stats.totalTransactions.toLocaleString("fr-FR"), icon: CreditCard, bg: "bg-indigo-50", iconColor: "text-indigo-600", valueColor: "text-indigo-700" },
        { label: "Transactions échouées", value: stats.failedTransactions.toLocaleString("fr-FR"), icon: XCircle, bg: "bg-red-50", iconColor: "text-red-600", valueColor: "text-red-700" },
        { label: "Remboursés", value: formatPrice(stats.totalRefunds), icon: RotateCcw, bg: "bg-gray-100 dark:bg-gray-700", iconColor: "text-gray-500", valueColor: "text-gray-600 dark:text-gray-400" },
      ]
    : [];

  const currentItems = activeTab === "transactions" ? paginatedTx : activeTab === "payouts" ? paginatedPayouts : activeTab === "commissions" ? paginatedCommissions : paginatedRefunds;
  const currentTotalPages = activeTab === "transactions" ? totalTxPages : activeTab === "payouts" ? totalPayoutPages : activeTab === "commissions" ? totalCommPages : totalRefundPages;

  if (loading) {
    return (
      <div className="space-y-6 p-4 lg:p-6">
        <div className="h-8 w-48 animate-pulse rounded-xl bg-gray-200" />
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          {[...Array(8)].map((_, i) => (
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
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 lg:text-3xl">Gestion des paiements</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          {stats?.totalTransactions || 0} transaction{stats?.totalTransactions !== 1 ? "s" : ""} au total
        </p>
      </div>

      <div className="mb-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {kpiCards.map((kpi) => (
          <div
            key={kpi.label}
            className={`${kpi.bg} rounded-2xl p-4 shadow-sm dark:shadow-gray-800/20 transition-transform hover:scale-[1.02]`}
          >
            <div className="flex items-center gap-2">
              <kpi.icon className={`h-5 w-5 ${kpi.iconColor}`} />
              <span className="text-xs font-medium text-gray-600 dark:text-gray-400 truncate">{kpi.label}</span>
            </div>
            <p className={`mt-2 text-2xl font-bold ${kpi.valueColor} truncate`}>{kpi.value}</p>
          </div>
        ))}
      </div>

      <div className="mb-6 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                id="payment-search"
                placeholder="Rechercher par ID, commande, client, boutique..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-9"
              />
              {search && (
                <button
                  onClick={() => { setSearch(""); setPage(1); }}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="h-4 w-4" />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-colors ${
                showFilters || statusFilter !== "ALL" || methodFilter !== "ALL" || dateFrom || dateTo
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 dark:border-gray-700 bg-white text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtres
            </button>
          </div>

          {showFilters && (
            <div className="grid gap-3 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <select
                  value={statusFilter}
                  onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  {statusOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={methodFilter}
                  onChange={(e) => { setMethodFilter(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  {methodOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <select
                  value={sortBy}
                  onChange={(e) => { setSortBy(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  {sortOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-2">
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
              </div>
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

      <div className="mb-6 flex flex-wrap gap-2 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 shadow-sm dark:shadow-gray-800/20">
        {[
          { key: "transactions" as const, label: "Transactions", count: transactions.length },
          { key: "payouts" as const, label: "Retraits vendeurs", count: payouts.length },
          { key: "commissions" as const, label: "Commissions", count: commissions.length },
          { key: "refunds" as const, label: "Remboursements", count: refunds.length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => { setActiveTab(tab.key); setPage(1); }}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-indigo-600 text-white shadow-sm dark:shadow-gray-800/20"
                : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
            }`}
          >
            {tab.label}
            <span className={`rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
              activeTab === tab.key ? "bg-white/20 text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
            }`}>
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      {activeTab === "transactions" && (
        <>
          <div className="mb-6 hidden overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">ID</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Commande</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Client</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Boutique</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Montant</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Commission</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Vendeur</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Méthode</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedTx.map((tx) => {
                    const vendorAmount = tx.amount - (tx.commissionAmount || 0);
                    return (
                      <tr key={tx.id} className="transition-colors hover:bg-gray-50/50 dark:bg-gray-800/30">
                        <td className="px-6 py-4">
                          <span className="text-xs font-mono text-gray-500 dark:text-gray-400">{tx.id.slice(0, 8)}...</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{tx.orderNumber}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="min-w-0">
                            <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{tx.customerName || "Client"}</p>
                            <p className="truncate text-xs text-gray-500 dark:text-gray-400">{tx.customerEmail}</p>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-600 dark:text-gray-400">{tx.shopName}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatPrice(tx.amount)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-amber-600 font-medium">{formatPrice(tx.commissionAmount || 0)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm font-medium text-green-600">{formatPrice(vendorAmount)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${methodBadge[tx.method] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                            {tx.method}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatusBadge[tx.status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                            {paymentStatusLabel[tx.status] || tx.status}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(tx.createdAt)}</span>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center justify-end gap-1">
                            {tx.status === "COMPLETED" && (
                              <button
                                onClick={() => {
                                  setRefundModal(tx);
                                  setRefundAmount(String(tx.amount));
                                  setRefundReason("");
                                }}
                                className="rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                                title="Rembourser"
                              >
                                <Undo2 className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            {paginatedTx.length === 0 && (
              <div className="py-16 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucune transaction trouvée</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Essayez de modifier vos filtres</p>
              </div>
            )}
          </div>

          <div className="mb-6 space-y-3 lg:hidden">
            {paginatedTx.map((tx) => {
              const vendorAmount = tx.amount - (tx.commissionAmount || 0);
              return (
                <div key={tx.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{tx.orderNumber}</p>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 font-mono">{tx.id.slice(0, 12)}...</p>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${paymentStatusBadge[tx.status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                      {paymentStatusLabel[tx.status] || tx.status}
                    </span>
                  </div>
                  <div className="mt-3 flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <User className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    <span>{tx.customerName || tx.customerEmail}</span>
                    <span className="text-gray-300">·</span>
                    <Store className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                    <span>{tx.shopName}</span>
                  </div>
                  <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
                    <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2 text-center">
                      <p className="text-[10px] text-gray-400 dark:text-gray-500">Montant</p>
                      <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatPrice(tx.amount)}</p>
                    </div>
                    <div className="rounded-lg bg-amber-50 p-2 text-center">
                      <p className="text-[10px] text-amber-400">Commission</p>
                      <p className="text-sm font-bold text-amber-600">{formatPrice(tx.commissionAmount || 0)}</p>
                    </div>
                    <div className="rounded-lg bg-green-50 p-2 text-center">
                      <p className="text-[10px] text-green-400">Vendeur</p>
                      <p className="text-sm font-bold text-green-600">{formatPrice(vendorAmount)}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between">
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${methodBadge[tx.method] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                      {tx.method}
                    </span>
                    <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(tx.createdAt)}</span>
                  </div>
                  {tx.status === "COMPLETED" && (
                    <div className="mt-3">
                      <button
                        onClick={() => {
                          setRefundModal(tx);
                          setRefundAmount(String(tx.amount));
                          setRefundReason("");
                        }}
                        className="flex w-full items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                      >
                        <Undo2 className="h-4 w-4" />
                        Rembourser
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
            {paginatedTx.length === 0 && (
              <div className="py-16 text-center">
                <CreditCard className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucune transaction trouvée</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "payouts" && (
        <>
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
              <p className="mt-1 text-xl font-bold text-amber-600">{payouts.filter((p) => p.status === "PENDING").length}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Approuvés</p>
              <p className="mt-1 text-xl font-bold text-blue-600">{payouts.filter((p) => p.status === "APPROVED").length}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Payés</p>
              <p className="mt-1 text-xl font-bold text-green-600">{payouts.filter((p) => p.status === "PAID").length}</p>
            </div>
          </div>

          <div className="mb-6 hidden overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Vendeur</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Boutique</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Montant</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Méthode</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                    <th className="px-6 py-4 text-right text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedPayouts.map((payout) => (
                    <tr key={payout.id} className="transition-colors hover:bg-gray-50/50 dark:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{payout.vendorName}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{payout.vendorEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{payout.shopName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{formatPrice(payout.amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${methodBadge[payout.method] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                          {payout.method}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${payoutStatusBadge[payout.status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                          {payoutStatusLabel[payout.status] || payout.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(payout.createdAt)}</span>
                      </td>
                      <td className="px-6 py-4">
                        {payout.status === "PENDING" && (
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => setPayoutActionModal({ type: "approve", payout })}
                              className="rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-green-50 hover:text-green-600"
                              title="Approuver"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => setPayoutActionModal({ type: "reject", payout })}
                              className="rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-red-50 hover:text-red-600"
                              title="Rejeter"
                            >
                              <Ban className="h-4 w-4" />
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {paginatedPayouts.length === 0 && (
              <div className="py-16 text-center">
                <Wallet className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucun retrait trouvé</p>
              </div>
            )}
          </div>

          <div className="mb-6 space-y-3 lg:hidden">
            {paginatedPayouts.map((payout) => (
              <div key={payout.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{payout.vendorName}</p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{payout.shopName}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${payoutStatusBadge[payout.status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                    {payoutStatusLabel[payout.status] || payout.status}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatPrice(payout.amount)}</p>
                    <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-medium ${methodBadge[payout.method] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                      {payout.method}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(payout.createdAt)}</span>
                </div>
                {payout.status === "PENDING" && (
                  <div className="mt-3 flex gap-2">
                    <button
                      onClick={() => setPayoutActionModal({ type: "approve", payout })}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-green-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4" />
                      Approuver
                    </button>
                    <button
                      onClick={() => setPayoutActionModal({ type: "reject", payout })}
                      className="flex flex-1 items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-medium text-red-700 transition-colors hover:bg-red-100"
                    >
                      <Ban className="h-4 w-4" />
                      Rejeter
                    </button>
                  </div>
                )}
              </div>
            ))}
            {paginatedPayouts.length === 0 && (
              <div className="py-16 text-center">
                <Wallet className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucun retrait trouvé</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "commissions" && (
        <>
          <div className="mb-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
              <p className="mt-1 text-xl font-bold text-amber-600">{formatPrice(commissions.reduce((s, c) => s + c.amount, 0))}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">Payées</p>
              <p className="mt-1 text-xl font-bold text-green-600">{formatPrice(commissions.filter((c) => c.status === "PAID").reduce((s, c) => s + c.amount, 0))}</p>
            </div>
            <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20 text-center">
              <p className="text-xs text-gray-500 dark:text-gray-400">En attente</p>
              <p className="mt-1 text-xl font-bold text-amber-600">{formatPrice(commissions.filter((c) => c.status === "PENDING").reduce((s, c) => s + c.amount, 0))}</p>
            </div>
          </div>

          <div className="mb-6 hidden overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Commande</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Boutique</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Montant</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Taux</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedCommissions.map((comm) => (
                    <tr key={comm.id} className="transition-colors hover:bg-gray-50/50 dark:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{comm.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{comm.shopName}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-amber-600">{formatPrice(comm.amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-600 dark:text-gray-400">{comm.rate}%</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                          comm.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                        }`}>
                          {comm.status === "PAID" ? "Payée" : "En attente"}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(comm.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {paginatedCommissions.length === 0 && (
              <div className="py-16 text-center">
                <Coins className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucune commission trouvée</p>
              </div>
            )}
          </div>

          <div className="mb-6 space-y-3 lg:hidden">
            {paginatedCommissions.map((comm) => (
              <div key={comm.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{comm.orderNumber}</p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{comm.shopName}</p>
                  </div>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${
                    comm.status === "PAID" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                  }`}>
                    {comm.status === "PAID" ? "Payée" : "En attente"}
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <div>
                    <p className="text-lg font-bold text-amber-600">{formatPrice(comm.amount)}</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Taux: {comm.rate}%</p>
                  </div>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(comm.createdAt)}</span>
                </div>
              </div>
            ))}
            {paginatedCommissions.length === 0 && (
              <div className="py-16 text-center">
                <Coins className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucune commission trouvée</p>
              </div>
            )}
          </div>
        </>
      )}

      {activeTab === "refunds" && (
        <>
          <div className="mb-6 hidden overflow-hidden rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20 lg:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30">
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Commande</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Client</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Montant</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Statut</th>
                    <th className="px-6 py-4 text-left text-xs font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {paginatedRefunds.map((r) => (
                    <tr key={r.id} className="transition-colors hover:bg-gray-50/50 dark:bg-gray-800/30">
                      <td className="px-6 py-4">
                        <span className="text-sm font-bold text-gray-900 dark:text-gray-100">{r.orderNumber}</span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{r.customerName || "Client"}</p>
                          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{r.customerEmail}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-semibold text-red-600">{formatPrice(r.amount)}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                          Remboursé
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-gray-500 dark:text-gray-400">{formatDate(r.createdAt)}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {paginatedRefunds.length === 0 && (
              <div className="py-16 text-center">
                <RotateCcw className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucun remboursement</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Les remboursements apparaîtront ici</p>
              </div>
            )}
          </div>

          <div className="mb-6 space-y-3 lg:hidden">
            {paginatedRefunds.map((r) => (
              <div key={r.id} className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{r.orderNumber}</p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{r.customerName || r.customerEmail}</p>
                  </div>
                  <span className="inline-flex items-center rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                    Remboursé
                  </span>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <p className="text-lg font-bold text-red-600">{formatPrice(r.amount)}</p>
                  <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(r.createdAt)}</span>
                </div>
              </div>
            ))}
            {paginatedRefunds.length === 0 && (
              <div className="py-16 text-center">
                <RotateCcw className="mx-auto h-12 w-12 text-gray-300" />
                <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucun remboursement</p>
                <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Les remboursements apparaîtront ici</p>
              </div>
            )}
          </div>
        </>
      )}

      {currentTotalPages > 1 && (
        <div className="mb-6 flex items-center justify-between rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3 shadow-sm dark:shadow-gray-800/20">
          <span className="text-sm text-gray-500 dark:text-gray-400">
            Page {page} sur {currentTotalPages}
          </span>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            {Array.from({ length: Math.min(5, currentTotalPages) }, (_, i) => {
              const start = Math.max(1, Math.min(page - 2, currentTotalPages - 4));
              const pageNum = start + i;
              if (pageNum > currentTotalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => setPage(pageNum)}
                  className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                    page === pageNum ? "bg-indigo-600 text-white" : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => setPage((p) => Math.min(currentTotalPages, p + 1))}
              disabled={page >= currentTotalPages}
              className="rounded-lg border border-gray-200 dark:border-gray-700 p-2 text-gray-600 dark:text-gray-400 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      {payoutActionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setPayoutActionModal(null); setRejectReason(""); }} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className={`rounded-xl p-2.5 ${payoutActionModal.type === "approve" ? "bg-green-100" : "bg-red-100"}`}>
                {payoutActionModal.type === "approve" ? (
                  <CheckCircle className="h-5 w-5 text-green-600" />
                ) : (
                  <Ban className="h-5 w-5 text-red-600" />
                )}
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {payoutActionModal.type === "approve" ? "Approuver le retrait" : "Rejeter le retrait"}
                </h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {payoutActionModal.payout.vendorName} · {payoutActionModal.payout.shopName}
                </p>
              </div>
            </div>
            <div className="mb-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Montant</span>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{formatPrice(payoutActionModal.payout.amount)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Méthode</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{payoutActionModal.payout.method}</span>
              </div>
            </div>
            {payoutActionModal.type === "reject" && (
              <div className="mb-4">
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Raison du rejet</label>
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Indiquez la raison du rejet..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors placeholder:text-gray-400 dark:text-gray-500 focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20"
                />
              </div>
            )}
            <div className="flex gap-3">
              <button
                onClick={() => { setPayoutActionModal(null); setRejectReason(""); }}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={() => handlePayoutAction(payoutActionModal.payout.id, payoutActionModal.type)}
                disabled={actionLoading}
                className={`flex-1 rounded-xl px-4 py-2.5 text-sm font-medium text-white transition-colors disabled:opacity-50 ${
                  payoutActionModal.type === "approve"
                    ? "bg-green-600 hover:bg-green-700"
                    : "bg-red-600 hover:bg-red-700"
                }`}
              >
                {actionLoading ? "En cours..." : payoutActionModal.type === "approve" ? "Confirmer l'approbation" : "Confirmer le rejet"}
              </button>
            </div>
          </div>
        </div>
      )}

      {refundModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => { setRefundModal(null); setRefundAmount(""); setRefundReason(""); }} />
          <div className="relative z-10 w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl">
            <div className="mb-4 flex items-center gap-3">
              <div className="rounded-xl bg-red-100 p-2.5">
                <RotateCcw className="h-5 w-5 text-red-600" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Rembourser la commande</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">{refundModal.orderNumber}</p>
              </div>
            </div>
            <div className="mb-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Montant original</span>
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatPrice(refundModal.amount)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Client</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{refundModal.customerName || refundModal.customerEmail}</span>
              </div>
              <div className="mt-2 flex items-center justify-between">
                <span className="text-sm text-gray-500 dark:text-gray-400">Boutique</span>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{refundModal.shopName}</span>
              </div>
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Montant du remboursement</label>
              <Input
                id="refund-amount"
                type="number"
                min={0}
                max={refundModal.amount}
                value={refundAmount}
                onChange={(e) => setRefundAmount(e.target.value)}
                placeholder="Montant à rembourser"
              />
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">Maximum: {formatPrice(refundModal.amount)}</p>
            </div>
            <div className="mb-4">
              <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Raison du remboursement</label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Indiquez la raison du remboursement..."
                rows={3}
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors placeholder:text-gray-400 dark:text-gray-500 focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
              />
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => { setRefundModal(null); setRefundAmount(""); setRefundReason(""); }}
                className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={() => handleRefund(refundModal)}
                disabled={actionLoading}
                className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:opacity-50"
              >
                {actionLoading ? "En cours..." : "Confirmer le remboursement"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
