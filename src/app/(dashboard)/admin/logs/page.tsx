"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Flag,
  Clock,
  CheckCircle,
  Package,
  Store,
  UserX,
  Activity,
  Eye,
  Trash2,
  Ban,
  AlertTriangle,
  Shield,
  MessageSquare,
  X,
  Search,
  ChevronDown,
  ExternalLink,
  Send,
  Archive,
} from "lucide-react";

interface Report {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  beforeState: any;
  afterState: any;
  metadata: any;
  createdAt: string;
  user: { id: string; name: string | null; email: string };
}

interface FlaggedProduct {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  productType: string;
  createdAt: string;
  shop: { id: string; name: string; slug: string };
  vendor: { id: string; name: string; email: string };
  riskLevel: string;
  riskType: string;
}

interface SuspiciousShop {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  owner: { id: string; name: string; email: string };
  productCount: number;
  avgRating: number;
  auditCount: number;
  suspicionType: string;
}

interface SuspiciousUser {
  id: string;
  name: string | null;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: string;
  failedPayments: number;
  shopCount: number;
  suspicionType: string;
}

interface ModerationStats {
  totalReports: number;
  pendingReports: number;
  resolvedReports: number;
  flaggedProducts: number;
  suspendedShops: number;
  bannedUsers: number;
  todayActions: number;
}

interface RecentAction {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  createdAt: string;
  user: { name: string | null; email: string };
}

interface ModerationData {
  reports: Report[];
  flaggedProducts: FlaggedProduct[];
  suspiciousShops: SuspiciousShop[];
  suspiciousUsers: SuspiciousUser[];
  stats: ModerationStats;
  recentActions: RecentAction[];
}

const tabs = [
  { id: "all", label: "Tous" },
  { id: "products", label: "Produits" },
  { id: "shops", label: "Boutiques" },
  { id: "users", label: "Utilisateurs" },
  { id: "comments", label: "Commentaires" },
] as const;

type TabId = (typeof tabs)[number]["id"];

const riskColors: Record<string, string> = {
  high: "bg-red-100 text-red-700",
  medium: "bg-amber-100 text-amber-700",
  low: "bg-green-100 text-green-700",
};

const suspicionIcons: Record<string, string> = {
  unverified: "bg-amber-100 text-amber-600",
  low_rating: "bg-red-100 text-red-600",
  normal: "bg-green-100 text-green-600",
  fraud_risk: "bg-red-100 text-red-600",
  banned: "bg-red-100 text-red-600",
  active: "bg-green-100 text-green-600",
  suspended: "bg-red-100 text-red-600",
  bad_reviews: "bg-amber-100 text-amber-600",
  flagged: "bg-orange-100 text-orange-600",
};

const suspicionLabels: Record<string, string> = {
  unverified: "Non vérifié",
  low_rating: "Faible note",
  normal: "Normal",
  fraud_risk: "Risque fraude",
  banned: "Banni",
  active: "Actif",
  suspended: "Suspendu",
  bad_reviews: "Mauvais avis",
  flagged: "Signalé",
};

export default function ModerationPage() {
  const [data, setData] = useState<ModerationData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [typeFilter, setTypeFilter] = useState("all");
  const [modal, setModal] = useState<{
    type: string;
    target: any;
  } | null>(null);
  const [modalReason, setModalReason] = useState("");
  const [modalDuration, setModalDuration] = useState("7d");
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("type", activeTab);
      params.set("status", statusFilter);
      const res = await fetch(`/api/admin/moderation?${params.toString()}`);
      if (!res.ok) throw new Error("Failed");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [activeTab, statusFilter]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const executeAction = async (action: string, entityType: string, entityId: string, extra?: Record<string, any>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/moderation", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action,
          entityType,
          entityId,
          reason: modalReason || extra?.reason,
          details: { duration: modalDuration, ...extra },
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Action effectuée");
      setModal(null);
      setModalReason("");
      fetchData();
    } catch {
      toast.error("Erreur lors de l'action");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredReports = data?.reports.filter((r) => {
    const matchesSearch =
      !searchQuery ||
      r.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.entityType.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.user?.email?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesTab =
      activeTab === "all" ||
      (activeTab === "products" && r.entityType === "PRODUCT") ||
      (activeTab === "shops" && r.entityType === "SHOP") ||
      (activeTab === "users" && r.entityType === "USER") ||
      (activeTab === "comments" && r.entityType === "REVIEW");
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "pending" && (!r.afterState || r.afterState?.resolved === false)) ||
      (statusFilter === "resolved" && r.afterState?.resolved === true);
    return matchesSearch && matchesTab && matchesStatus;
  }) || [];

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });

  if (loading && !data) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="h-32 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    );
  }

  if (!data) return null;

  const stats = [
    { label: "Signalements", value: data.stats.totalReports, icon: Flag, iconBg: "bg-red-100", iconColor: "text-red-600" },
    { label: "En attente", value: data.stats.pendingReports, icon: Clock, iconBg: "bg-amber-100", iconColor: "text-amber-600" },
    { label: "Résolus", value: data.stats.resolvedReports, icon: CheckCircle, iconBg: "bg-green-100", iconColor: "text-green-600" },
    { label: "Produits signalés", value: data.stats.flaggedProducts, icon: Package, iconBg: "bg-orange-100", iconColor: "text-orange-600" },
    { label: "Boutiques suspendues", value: data.stats.suspendedShops, icon: Store, iconBg: "bg-purple-100", iconColor: "text-purple-600" },
    { label: "Utilisateurs bannis", value: data.stats.bannedUsers, icon: UserX, iconBg: "bg-red-100", iconColor: "text-red-600" },
    { label: "Actions aujourd'hui", value: data.stats.todayActions, icon: Activity, iconBg: "bg-blue-100", iconColor: "text-blue-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Modération</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gestion des signalements et contenus à risque</p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-7 gap-3">
        {stats.map((s) => (
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
          <div className="flex flex-wrap items-center gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#0f172a] text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:text-gray-300"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-gray-100 dark:border-gray-700/50 px-4 py-3">
          <div className="flex flex-wrap items-center gap-3">
            <div className="relative flex-1 min-w-[200px]">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
              <Input
                id="search"
                placeholder="Rechercher..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
            >
              <option value="all">Tous les types</option>
              <option value="PRODUCT">Produits</option>
              <option value="SHOP">Boutiques</option>
              <option value="USER">Utilisateurs</option>
              <option value="REVIEW">Commentaires</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En attente</option>
              <option value="resolved">Résolus</option>
            </select>
          </div>
        </div>

        <div className="p-4">
          <div className="hidden lg:block overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 dark:border-gray-700/50 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                  <th className="pb-3 pr-4 text-left">Action</th>
                  <th className="pb-3 pr-4 text-left">Entité</th>
                  <th className="pb-3 pr-4 text-left">Signalé par</th>
                  <th className="pb-3 pr-4 text-left">Date</th>
                  <th className="pb-3 pr-4 text-left">Statut</th>
                  <th className="pb-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                {filteredReports.map((report) => {
                  const isResolved = report.afterState?.resolved === true;
                  return (
                    <tr key={report.id} className="hover:bg-gray-50/50 dark:bg-gray-800/30">
                      <td className="py-3 pr-4">
                        <div className="flex items-center gap-2">
                          <Shield className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                          <span className="font-medium text-[#0f172a]">{report.action}</span>
                        </div>
                      </td>
                      <td className="py-3 pr-4">
                        <div>
                          <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                            {report.entityType}
                          </span>
                          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">{report.entityId}</p>
                        </div>
                      </td>
                      <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{report.user?.name || report.user?.email}</td>
                      <td className="py-3 pr-4 text-xs text-gray-400 dark:text-gray-500">{formatDate(report.createdAt)}</td>
                      <td className="py-3 pr-4">
                        <span
                          className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                            isResolved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {isResolved ? "Résolu" : "En attente"}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setModal({ type: "view", target: report })}
                            className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                          >
                            <Eye className="h-4 w-4" />
                          </button>
                          {!isResolved && (
                            <button
                              onClick={() => setModal({ type: "escalate", target: report })}
                              className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-amber-100 hover:text-amber-600"
                            >
                              <Send className="h-4 w-4" />
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

          <div className="lg:hidden space-y-3">
            {filteredReports.map((report) => {
              const isResolved = report.afterState?.resolved === true;
              return (
                <div key={report.id} className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#0f172a]">{report.action}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                            isResolved ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"
                          }`}
                        >
                          {isResolved ? "Résolu" : "En attente"}
                        </span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                          {report.entityType}
                        </span>
                        <span className="text-xs text-gray-400 dark:text-gray-500">{formatDate(report.createdAt)}</span>
                      </div>
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">Par {report.user?.name || report.user?.email}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button
                        onClick={() => setModal({ type: "view", target: report })}
                        className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                      {!isResolved && (
                        <button
                          onClick={() => setModal({ type: "escalate", target: report })}
                          className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-amber-100 hover:text-amber-600"
                        >
                          <Send className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {filteredReports.length === 0 && (
            <div className="py-12 text-center">
              <Shield className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">Aucun signalement trouvé</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 text-orange-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Produits à risque</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.flaggedProducts.map((product) => (
            <div key={product.id} className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#0f172a]">{product.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{product.shop?.name}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${riskColors[product.riskLevel] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                  {product.riskLevel === "high" ? "Élevé" : product.riskLevel === "medium" ? "Moyen" : "Faible"}
                </span>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${suspicionIcons[product.riskType] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                  {suspicionLabels[product.riskType] || product.riskType}
                </span>
                <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">
                  {product.productType}
                </span>
              </div>
              <div className="mt-3 flex gap-2">
                <a
                  href={`/product/${product.slug}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                >
                  <Eye className="h-3 w-3" />
                  Voir
                </a>
                <button
                  onClick={() => executeAction("DELETE_CONTENT", "PRODUCT", product.id)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  <Trash2 className="h-3 w-3" />
                  Retirer
                </button>
                <button
                  onClick={() => executeAction("RESTORE_CONTENT", "PRODUCT", product.id)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100"
                >
                  <CheckCircle className="h-3 w-3" />
                  Garder
                </button>
              </div>
            </div>
          ))}
          {data.flaggedProducts.length === 0 && (
            <div className="col-span-full rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 py-12 text-center shadow-sm dark:shadow-gray-800/20">
              <Package className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Aucun produit à risque</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <Store className="h-4 w-4 text-purple-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Boutiques suspectes</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.suspiciousShops.map((shop) => (
            <div key={shop.id} className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#0f172a]">{shop.name}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500">{shop.owner?.name || shop.owner?.email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${suspicionIcons[shop.suspicionType] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                  {suspicionLabels[shop.suspicionType] || shop.suspicionType}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Produits</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{shop.productCount}</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Note</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{shop.avgRating || "—"}</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Actions</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{shop.auditCount}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => executeAction("SUSPEND_SHOP", "SHOP", shop.id)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  <Ban className="h-3 w-3" />
                  Suspendre
                </button>
                <button
                  onClick={() => setModal({ type: "investigate", target: shop })}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-100"
                >
                  <Eye className="h-3 w-3" />
                  Enquêter
                </button>
                <button
                  onClick={() => executeAction("CLEAR_SHOP", "SHOP", shop.id)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-600 hover:bg-green-100"
                >
                  <CheckCircle className="h-3 w-3" />
                  Nettoyer
                </button>
              </div>
            </div>
          ))}
          {data.suspiciousShops.length === 0 && (
            <div className="col-span-full rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 py-12 text-center shadow-sm dark:shadow-gray-800/20">
              <Store className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Aucune boutique suspecte</p>
            </div>
          )}
        </div>
      </div>

      <div>
        <div className="mb-3 flex items-center gap-2">
          <UserX className="h-4 w-4 text-red-500" />
          <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Utilisateurs à risque</h2>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {data.suspiciousUsers.map((user) => (
            <div key={user.id} className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="truncate font-semibold text-[#0f172a]">{user.name || "Sans nom"}</p>
                  <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{user.email}</p>
                </div>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium ${suspicionIcons[user.suspicionType] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                  {suspicionLabels[user.suspicionType] || user.suspicionType}
                </span>
              </div>
              <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 text-center">
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Échecs</p>
                  <p className={`text-sm font-bold ${user.failedPayments > 5 ? "text-red-600" : "text-gray-900 dark:text-gray-100"}`}>{user.failedPayments}</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Boutiques</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.shopCount}</p>
                </div>
                <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 p-2">
                  <p className="text-xs text-gray-400 dark:text-gray-500">Rôle</p>
                  <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{user.role}</p>
                </div>
              </div>
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => executeAction("BLOCK_USER", "USER", user.id)}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100"
                >
                  <Ban className="h-3 w-3" />
                  Bloquer
                </button>
                <button
                  onClick={() => setModal({ type: "warn", target: user })}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-amber-50 px-3 py-1.5 text-xs font-medium text-amber-600 hover:bg-amber-100"
                >
                  <AlertTriangle className="h-3 w-3" />
                  Avertir
                </button>
                <a
                  href={`/admin/users`}
                  className="flex flex-1 items-center justify-center gap-1 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-1.5 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                >
                  <Eye className="h-3 w-3" />
                  Profil
                </a>
              </div>
            </div>
          ))}
          {data.suspiciousUsers.length === 0 && (
            <div className="col-span-full rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 py-12 text-center shadow-sm dark:shadow-gray-800/20">
              <UserX className="mx-auto h-10 w-10 text-gray-300" />
              <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Aucun utilisateur à risque</p>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => setModal(null)} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 px-6 py-4">
                <h3 className="text-lg font-bold text-[#0f172a]">
                  {modal.type === "view" && "Détails du signalement"}
                  {modal.type === "escalate" && "Escalader vers le super admin"}
                  {modal.type === "warn" && "Avertir l'utilisateur"}
                  {modal.type === "investigate" && "Enquêter sur la boutique"}
                </h3>
                <button onClick={() => setModal(null)} className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400">
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-5">
                {modal.type === "view" && (
                  <div className="space-y-3">
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Action</p>
                      <p className="mt-1 font-medium text-[#0f172a]">{modal.target.action}</p>
                    </div>
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                      <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Entité</p>
                      <p className="mt-1 font-medium text-[#0f172a]">{modal.target.entityType}</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">{modal.target.entityId}</p>
                    </div>
                    {modal.target.metadata && (
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                        <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">Métadonnées</p>
                        <pre className="mt-1 overflow-auto text-xs text-gray-600 dark:text-gray-400">{JSON.stringify(modal.target.metadata, null, 2)}</pre>
                      </div>
                    )}
                  </div>
                )}

                {modal.type === "escalate" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Escalader ce signalement vers le super administrateur pour review.
                    </p>
                    <textarea
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      placeholder="Note pour le super admin..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                    />
                  </div>
                )}

                {modal.type === "warn" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Envoyer un avertissement à <strong>{modal.target.name || modal.target.email}</strong>.
                    </p>
                    <textarea
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      placeholder="Message d'avertissement..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                    />
                  </div>
                )}

                {modal.type === "investigate" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Lancer une enquête sur la boutique <strong>{modal.target.name}</strong>.
                    </p>
                    <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-4">
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Produits</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{modal.target.productCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Note moyenne</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{modal.target.avgRating || "—"}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Actions d'audit</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{modal.target.auditCount}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-400 dark:text-gray-500">Vérifiée</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{modal.target.isVerified ? "Oui" : "Non"}</p>
                        </div>
                      </div>
                    </div>
                    <textarea
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                      placeholder="Notes d'enquête..."
                      rows={3}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700/50 px-6 py-4">
                <button
                  onClick={() => setModal(null)}
                  className="rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                >
                  Annuler
                </button>
                {modal.type === "view" && (
                  <button
                    onClick={() => setModal(null)}
                    className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-gray-800"
                  >
                    Fermer
                  </button>
                )}
                {modal.type === "escalate" && (
                  <button
                    onClick={() => executeAction("ESCALATE", modal.target.entityType, modal.target.entityId, { escalateNote: modalReason })}
                    disabled={submitting}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {submitting ? "Envoi..." : "Escalader"}
                  </button>
                )}
                {modal.type === "warn" && (
                  <button
                    onClick={() => executeAction("WARN_USER", "USER", modal.target.id)}
                    disabled={submitting}
                    className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white hover:bg-amber-700 disabled:opacity-50"
                  >
                    {submitting ? "Envoi..." : "Avertir"}
                  </button>
                )}
                {modal.type === "investigate" && (
                  <button
                    onClick={() => executeAction("LOG_INVESTIGATION", "SHOP", modal.target.id, { investigationNote: modalReason })}
                    disabled={submitting}
                    className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
                  >
                    {submitting ? "Enregistrement..." : "Enregistrer"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
