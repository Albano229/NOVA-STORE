"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  FileText,
  Clock,
  Package,
  Store,
  Users,
  DollarSign,
  LogIn,
  Search,
  Filter,
  X,
  ChevronLeft,
  ChevronRight,
  Download,
  FileJson,
  RefreshCw,
  Eye,
  Calendar,
} from "lucide-react";

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: any;
  afterState: any;
  metadata: any;
  createdAt: string;
  user: { id: string; name: string | null; email: string } | null;
}

interface Stats {
  total: number;
  today: number;
  productChanges: number;
  shopChanges: number;
  roleChanges: number;
  payments: number;
  logins: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface LogsResponse {
  logs: AuditLog[];
  stats: Stats;
  pagination: Pagination;
}

const entityTypeOptions = [
  { value: "all", label: "Tous les types" },
  { value: "User", label: "Utilisateurs" },
  { value: "Shop", label: "Boutiques" },
  { value: "Product", label: "Produits" },
  { value: "Order", label: "Commandes" },
  { value: "Payment", label: "Paiements" },
  { value: "System", label: "Système" },
];

const actionColors: Record<string, string> = {
  CREATE: "bg-green-100 text-green-700",
  UPDATE: "bg-blue-100 text-blue-700",
  DELETE: "bg-red-100 text-red-700",
  LOGIN: "bg-teal-100 text-teal-700",
  LOGOUT: "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300",
  STATUS_CHANGE: "bg-amber-100 text-amber-700",
  ROLE_CHANGE: "bg-purple-100 text-purple-700",
  PAYMENT: "bg-emerald-100 text-emerald-700",
  REFUND: "bg-orange-100 text-orange-700",
};

function getActionColor(action: string): string {
  const upper = action.toUpperCase();
  for (const [key, color] of Object.entries(actionColors)) {
    if (upper.includes(key)) return color;
  }
  return "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300";
}

export default function ReportsPage() {
  const [data, setData] = useState<LogsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [entityType, setEntityType] = useState("all");
  const [action, setAction] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [page, setPage] = useState(1);
  const [showFilters, setShowFilters] = useState(false);
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [exportDateFrom, setExportDateFrom] = useState("");
  const [exportDateTo, setExportDateTo] = useState("");

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (search) params.set("search", search);
      if (entityType !== "all") params.set("entityType", entityType);
      if (action) params.set("action", action);
      if (dateFrom) params.set("dateFrom", dateFrom);
      if (dateTo) params.set("dateTo", dateTo);
      params.set("page", page.toString());
      params.set("limit", "20");

      const res = await fetch(`/api/admin/audit-logs?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erreur lors du chargement des logs");
    } finally {
      setLoading(false);
    }
  }, [search, entityType, action, dateFrom, dateTo, page]);

  useEffect(() => {
    fetchLogs();
  }, [fetchLogs]);

  const resetFilters = () => {
    setSearch("");
    setEntityType("all");
    setAction("");
    setDateFrom("");
    setDateTo("");
    setPage(1);
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });

  const exportCSV = () => {
    if (!data?.logs.length) {
      toast.error("Aucun log à exporter");
      return;
    }
    const headers = ["Date", "Utilisateur", "Email", "Action", "Type Entité", "ID Entité", "Détails"];
    const rows = data.logs.map((log) => [
      formatDate(log.createdAt),
      log.user?.name || "Système",
      log.user?.email || "",
      log.action,
      log.entityType,
      log.entityId,
      log.metadata ? JSON.stringify(log.metadata) : "",
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exporté");
  };

  const exportJSON = () => {
    if (!data?.logs.length) {
      toast.error("Aucun log à exporter");
      return;
    }
    const jsonStr = JSON.stringify(data.logs, null, 2);
    const blob = new Blob([jsonStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("JSON exporté");
  };

  const statsCards = data
    ? [
        { label: "Total logs", value: data.stats.total, icon: FileText, iconBg: "bg-indigo-100", iconColor: "text-indigo-600" },
        { label: "Aujourd'hui", value: data.stats.today, icon: Clock, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
        { label: "Modifications produits", value: data.stats.productChanges, icon: Package, iconBg: "bg-orange-100", iconColor: "text-orange-600" },
        { label: "Modifications boutiques", value: data.stats.shopChanges, icon: Store, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
        { label: "Changements rôles", value: data.stats.roleChanges, icon: Users, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
        { label: "Paiements", value: data.stats.payments, icon: DollarSign, iconBg: "bg-green-100", iconColor: "text-green-600" },
        { label: "Connexions", value: data.stats.logins, icon: LogIn, iconBg: "bg-teal-100", iconColor: "text-teal-600" },
      ]
    : [];

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Rapports & Logs</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Journal d&apos;audit et statistiques de la plateforme</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {statsCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-3 shadow-sm dark:shadow-gray-800/20">
            <div className="flex items-center gap-2">
              <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.iconBg}`}>
                <s.icon className={`h-4 w-4 ${s.iconColor}`} />
              </div>
              <div>
                <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{s.label}</p>
                <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20">
        <div className="border-b border-gray-100 dark:border-gray-700/50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                id="log-search"
                placeholder="Rechercher par nom, email, action, ID..."
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
                showFilters || entityType !== "all" || action || dateFrom || dateTo
                  ? "border-indigo-300 bg-indigo-50 text-indigo-700"
                  : "border-gray-200 dark:border-gray-700 bg-white text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
              }`}
            >
              <Filter className="h-4 w-4" />
              Filtres
            </button>
          </div>

          {showFilters && (
            <div className="mt-3 grid gap-3 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div>
                <select
                  value={entityType}
                  onChange={(e) => { setEntityType(e.target.value); setPage(1); }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-600/20"
                >
                  {entityTypeOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <Input
                  id="action-filter"
                  placeholder="Filtrer par action..."
                  value={action}
                  onChange={(e) => { setAction(e.target.value); setPage(1); }}
                />
              </div>
              <div>
                <Input
                  id="date-from"
                  type="date"
                  value={dateFrom}
                  onChange={(e) => { setDateFrom(e.target.value); setPage(1); }}
                />
              </div>
              <div>
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

        <div className="p-4">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/50 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  <th className="pb-3 pr-4 text-left">Date</th>
                  <th className="pb-3 pr-4 text-left">Utilisateur</th>
                  <th className="pb-3 pr-4 text-left">Action</th>
                  <th className="pb-3 pr-4 text-left">Type Entité</th>
                  <th className="pb-3 pr-4 text-left">ID Entité</th>
                  <th className="pb-3 text-right">Détails</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {data?.logs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50/50 dark:bg-gray-800/30">
                    <td className="py-3 pr-4 text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">{formatDate(log.createdAt)}</td>
                    <td className="py-3 pr-4">
                      <div>
                        <p className="font-medium text-[#0f172a]">{log.user?.name || "Système"}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{log.user?.email || "—"}</p>
                      </div>
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                        {log.entityType}
                      </span>
                    </td>
                    <td className="py-3 pr-4 font-mono text-xs text-gray-500 dark:text-gray-400 max-w-[200px] truncate">{log.entityId}</td>
                    <td className="py-3 text-right">
                      <button
                        onClick={() => setSelectedLog(log)}
                        className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="lg:hidden space-y-3">
            {data?.logs.map((log) => (
              <div key={log.id} className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                      <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                        {log.entityType}
                      </span>
                    </div>
                    <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                      {log.user?.name || "Système"} — {log.user?.email || "—"}
                    </p>
                    <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 font-mono truncate max-w-[250px]">{log.entityId}</p>
                    <p className="mt-1 text-[10px] text-gray-400 dark:text-gray-500">{formatDate(log.createdAt)}</p>
                  </div>
                  <button
                    onClick={() => setSelectedLog(log)}
                    className="shrink-0 rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    <Eye className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>

          {data && data.logs.length === 0 && (
            <div className="py-12 text-center">
              <FileText className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">Aucun log trouvé</p>
            </div>
          )}
        </div>

        {data && data.pagination.totalPages > 1 && (
          <div className="flex items-center justify-between border-t border-gray-100 dark:border-gray-700/50 px-4 py-3">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {data.pagination.total} résultat{(data.pagination.total > 1) ? "s" : ""} — Page {data.pagination.page} / {data.pagination.totalPages}
            </p>
            <div className="flex items-center gap-1">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(5, data.pagination.totalPages) }, (_, i) => {
                const start = Math.max(1, Math.min(page - 2, data.pagination.totalPages - 4));
                const pageNum = start + i;
                if (pageNum > data.pagination.totalPages) return null;
                return (
                  <button
                    key={pageNum}
                    onClick={() => setPage(pageNum)}
                    className={`h-8 w-8 rounded-lg text-xs font-medium transition-colors ${
                      page === pageNum
                        ? "bg-[#0f172a] text-white"
                        : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              <button
                onClick={() => setPage((p) => Math.min(data.pagination.totalPages, p + 1))}
                disabled={page === data.pagination.totalPages}
                className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400 disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-6 shadow-sm dark:shadow-gray-800/20">
        <div className="flex items-center gap-2 mb-4">
          <Download className="h-5 w-5 text-gray-400 dark:text-gray-500" />
          <h2 className="text-lg font-semibold text-[#0f172a]">Exporter les logs</h2>
        </div>
        <div className="flex flex-wrap items-end gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Date début</label>
            <Input
              id="export-date-from"
              type="date"
              value={exportDateFrom}
              onChange={(e) => setExportDateFrom(e.target.value)}
            />
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="mb-1 block text-xs font-medium text-gray-500 dark:text-gray-400">Date fin</label>
            <Input
              id="export-date-to"
              type="date"
              value={exportDateTo}
              onChange={(e) => setExportDateTo(e.target.value)}
            />
          </div>
          <button
            onClick={exportCSV}
            className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-5 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
          >
            <Download className="h-4 w-4" />
            Export CSV
          </button>
          <button
            onClick={exportJSON}
            className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white px-5 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
          >
            <FileJson className="h-4 w-4" />
            Export JSON
          </button>
        </div>
      </div>

      {selectedLog && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setSelectedLog(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 px-6 py-4">
                <h3 className="text-lg font-bold text-[#0f172a]">Détails du log</h3>
                <button onClick={() => setSelectedLog(null)} className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400">
                  <X className="h-5 w-5" />
                </button>
              </div>
              <div className="px-6 py-5 space-y-3">
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Date</p>
                  <p className="mt-1 font-medium text-[#0f172a]">{formatDate(selectedLog.createdAt)}</p>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Utilisateur</p>
                  <p className="mt-1 font-medium text-[#0f172a]">{selectedLog.user?.name || "Système"}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{selectedLog.user?.email || "—"}</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Action</p>
                    <p className="mt-1">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${getActionColor(selectedLog.action)}`}>
                        {selectedLog.action}
                      </span>
                    </p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Type Entité</p>
                    <p className="mt-1 font-medium text-[#0f172a]">{selectedLog.entityType}</p>
                  </div>
                </div>
                <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                  <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">ID Entité</p>
                  <p className="mt-1 font-mono text-sm text-[#0f172a] break-all">{selectedLog.entityId}</p>
                </div>
                {selectedLog.beforeState && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">État avant</p>
                    <pre className="mt-1 overflow-auto text-xs text-gray-600 dark:text-gray-400 max-h-40">{JSON.stringify(selectedLog.beforeState, null, 2)}</pre>
                  </div>
                )}
                {selectedLog.afterState && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">État après</p>
                    <pre className="mt-1 overflow-auto text-xs text-gray-600 dark:text-gray-400 max-h-40">{JSON.stringify(selectedLog.afterState, null, 2)}</pre>
                  </div>
                )}
                {selectedLog.metadata && (
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                    <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Métadonnées</p>
                    <pre className="mt-1 overflow-auto text-xs text-gray-600 dark:text-gray-400 max-h-40">{JSON.stringify(selectedLog.metadata, null, 2)}</pre>
                  </div>
                )}
              </div>
              <div className="flex items-center justify-end border-t border-gray-100 dark:border-gray-700/50 px-6 py-4">
                <button
                  onClick={() => setSelectedLog(null)}
                  className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                >
                  Fermer
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
