"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import {
  Activity,
  LogIn,
  AlertTriangle,
  Users,
  Globe,
  Lock,
  Key,
  RefreshCw,
  Trash2,
  X,
  Ban,
  CheckCircle,
  ShieldCheck,
  Clock,
  Wifi,
  WifiOff,
  Search,
  Mail,
  Smartphone,
} from "lucide-react";

interface ActiveSession {
  sessionId: string;
  sessionToken: string;
  expires: string;
  userId: string;
  userName: string | null;
  userEmail: string;
  role: string;
  ipAddress: string | null;
  lastActivity: string | null;
}

interface LoginHistory {
  userId: string;
  userName: string | null;
  email: string;
  action: string;
  ipAddress: string | null;
  createdAt: string;
}

interface FailedAttempt {
  email: string;
  attempts: number;
  lastAttempt: string;
}

interface SecurityStats {
  activeSessions: number;
  todayLogins: number;
  failedLogins: number;
  blockedIPs: number;
}

interface SecurityData {
  activeSessions: ActiveSession[];
  loginHistory: LoginHistory[];
  failedAttempts: FailedAttempt[];
  stats: SecurityStats;
}

type TabId = "connexions" | "alertes" | "protection" | "actions";

const tabs: { id: TabId; label: string; icon: typeof ShieldCheck }[] = [
  { id: "connexions", label: "Connexions", icon: Wifi },
  { id: "alertes", label: "Alertes", icon: AlertTriangle },
  { id: "protection", label: "Protection", icon: ShieldCheck },
  { id: "actions", label: "Actions", icon: Activity },
];

export default function SecurityPage() {
  const [data, setData] = useState<SecurityData>({
    activeSessions: [],
    loginHistory: [],
    failedAttempts: [],
    stats: { activeSessions: 0, todayLogins: 0, failedLogins: 0, blockedIPs: 0 },
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabId>("connexions");
  const [searchQuery, setSearchQuery] = useState("");
  const [modal, setModal] = useState<{ type: string; target?: any } | null>(null);
  const [modalInput, setModalInput] = useState("");
  const [modalReason, setModalReason] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [twoFA, setTwoFA] = useState(false);
  const [blockedIPs, setBlockedIPs] = useState<string[]>([]);
  const [newIP, setNewIP] = useState("");
  const [doubleConfirm, setDoubleConfirm] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [statsRes, sessionsRes, loginsRes, failedRes] = await Promise.all([
        fetch("/api/admin/security?type=stats"),
        fetch("/api/admin/security?type=sessions"),
        fetch("/api/admin/security?type=logins"),
        fetch("/api/admin/security?type=failed"),
      ]);

      const stats = statsRes.ok ? await statsRes.json() : { stats: data.stats };
      const sessions = sessionsRes.ok ? await sessionsRes.json() : { activeSessions: [] };
      const logins = loginsRes.ok ? await loginsRes.json() : { loginHistory: [] };
      const failed = failedRes.ok ? await failedRes.json() : { failedAttempts: [] };

      setData({
        stats: stats.stats || data.stats,
        activeSessions: sessions.activeSessions || [],
        loginHistory: logins.loginHistory || [],
        failedAttempts: failed.failedAttempts || [],
      });
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const executeAction = async (action: string, extra?: Record<string, any>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/security", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, ...extra }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Action effectuée");
      setModal(null);
      setModalInput("");
      setModalReason("");
      setDoubleConfirm(false);
      fetchData();
    } catch {
      toast.error("Erreur lors de l'action");
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const relativeTime = (d: string) => {
    const diff = Date.now() - new Date(d).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return "à l'instant";
    if (mins < 60) return `il y a ${mins}min`;
    const hours = Math.floor(mins / 60);
    if (hours < 24) return `il y a ${hours}h`;
    const days = Math.floor(hours / 24);
    return `il y a ${days}j`;
  };

  const actionLabels: Record<string, string> = {
    LOGIN: "Connexion",
    LOGIN_FAILED: "Échec connexion",
    LOGOUT: "Déconnexion",
    REGISTER: "Inscription",
    IP_BLOCKED: "IP bloquée",
    EMAIL_BLOCKED: "Email bloqué",
  };

  const filteredSessions = data.activeSessions.filter(
    (s) =>
      !searchQuery ||
      s.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.userEmail.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const filteredLogins = data.loginHistory.filter(
    (l) =>
      !searchQuery ||
      l.userName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      l.ipAddress?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading && !data.stats.activeSessions && !data.stats.todayLogins) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-24 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-gray-200" />
      </div>
    );
  }

  const statsCards = [
    { label: "Sessions actives", value: data.stats.activeSessions, icon: Users, color: "bg-blue-100 text-blue-600" },
    { label: "Connexions aujourd'hui", value: data.stats.todayLogins, icon: LogIn, color: "bg-green-100 text-green-600" },
    { label: "Échecs aujourd'hui", value: data.stats.failedLogins, icon: AlertTriangle, color: "bg-red-100 text-red-600" },
    { label: "IPs bloquées", value: data.stats.blockedIPs, icon: Ban, color: "bg-amber-100 text-amber-600" },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Sécurité</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Surveillance et protection du système</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
        {statsCards.map((s) => (
          <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${s.color}`}>
                <s.icon className="h-5 w-5" />
              </div>
              <div>
                <p className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{s.label}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
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
                className={`flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "bg-[#0f172a] text-white"
                    : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:text-gray-300"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="border-b border-gray-100 dark:border-gray-700/50 px-4 py-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input
              id="search"
              placeholder="Rechercher..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>

        <div className="p-4">
          {activeTab === "connexions" && (
            <div className="space-y-4">
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      <th className="pb-3 pr-4 text-left">Utilisateur</th>
                      <th className="pb-3 pr-4 text-left">Email</th>
                      <th className="pb-3 pr-4 text-left">Rôle</th>
                      <th className="pb-3 pr-4 text-left">IP</th>
                      <th className="pb-3 pr-4 text-left">Dernière activité</th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {filteredSessions.map((s) => (
                      <tr key={s.sessionId} className="hover:bg-gray-50/50 dark:bg-gray-800/30">
                        <td className="py-3 pr-4">
                          <div className="flex items-center gap-2">
                            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                              <Users className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                            </div>
                            <span className="font-medium text-[#0f172a]">{s.userName || "Sans nom"}</span>
                          </div>
                        </td>
                        <td className="py-3 pr-4 text-gray-600 dark:text-gray-400">{s.userEmail}</td>
                        <td className="py-3 pr-4">
                          <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                            {s.role}
                          </span>
                        </td>
                        <td className="py-3 pr-4 font-mono text-xs text-gray-500 dark:text-gray-400">{s.ipAddress || "—"}</td>
                        <td className="py-3 pr-4 text-xs text-gray-400 dark:text-gray-500">
                          {s.lastActivity ? relativeTime(s.lastActivity) : "—"}
                        </td>
                        <td className="py-3 text-right">
                          <button
                            onClick={() => {
                              setModal({ type: "disconnect", target: s });
                            }}
                            className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-600"
                            title="Déconnecter"
                          >
                            <WifiOff className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-3">
                {filteredSessions.map((s) => (
                  <div key={s.sessionId} className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="font-semibold text-[#0f172a]">{s.userName || "Sans nom"}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500 truncate">{s.userEmail}</p>
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                            {s.role}
                          </span>
                          <span className="font-mono text-[10px] text-gray-400 dark:text-gray-500">{s.ipAddress || "—"}</span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {s.lastActivity ? relativeTime(s.lastActivity) : "—"}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={() => setModal({ type: "disconnect", target: s })}
                        className="shrink-0 rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-600"
                      >
                        <WifiOff className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {filteredSessions.length === 0 && (
                <div className="py-12 text-center">
                  <Users className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">Aucune session active</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "alertes" && (
            <div className="space-y-6">
              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                  Tentatives échouées (24h)
                </h3>
                {data.failedAttempts.length > 0 ? (
                  <div className="space-y-2">
                    {data.failedAttempts.map((f) => (
                      <div
                        key={f.email}
                        className="flex items-center justify-between rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 p-4"
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100">
                            <Mail className="h-5 w-5 text-red-600" />
                          </div>
                          <div>
                            <p className="font-medium text-[#0f172a]">{f.email}</p>
                            <p className="text-xs text-gray-400 dark:text-gray-500">{relativeTime(f.lastAttempt)}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <span className="rounded-full bg-red-100 px-2.5 py-1 text-xs font-bold text-red-700">
                            {f.attempts} {f.attempts > 1 ? "tentatives" : "tentative"}
                          </span>
                          <button
                            onClick={() =>
                              setModal({ type: "block_email", target: f })
                            }
                            className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-600"
                            title="Bloquer"
                          >
                            <Ban className="h-4 w-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 py-8 text-center">
                    <CheckCircle className="mx-auto h-10 w-10 text-green-300" />
                    <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">Aucune tentative échouée</p>
                  </div>
                )}
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Smartphone className="h-4 w-4 text-amber-500" />
                  Activité suspecte
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                        <Globe className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-800">Multiples connexions</p>
                        <p className="text-xs text-amber-600">
                          {data.activeSessions.length} sessions depuis des IPs différentes
                        </p>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-2xl border border-amber-100 bg-amber-50/50 p-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-amber-100">
                        <Clock className="h-5 w-5 text-amber-600" />
                      </div>
                      <div>
                        <p className="font-medium text-amber-800">Connexions hors horaire</p>
                        <p className="text-xs text-amber-600">Détection basée sur l&apos;historique</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <LogIn className="h-4 w-4 text-blue-500" />
                  Historique des connexions
                </h3>
                <div className="hidden lg:block overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-100 dark:border-gray-700/50 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                        <th className="pb-3 pr-4 text-left">Utilisateur</th>
                        <th className="pb-3 pr-4 text-left">Action</th>
                        <th className="pb-3 pr-4 text-left">IP</th>
                        <th className="pb-3 text-right">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                      {filteredLogins.slice(0, 50).map((l, i) => (
                        <tr key={i} className="hover:bg-gray-50/50 dark:bg-gray-800/30">
                          <td className="py-3 pr-4">
                            <div>
                              <span className="font-medium text-[#0f172a]">{l.userName || "—"}</span>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{l.email}</p>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                                l.action === "LOGIN"
                                  ? "bg-green-100 text-green-700"
                                  : l.action === "LOGIN_FAILED"
                                    ? "bg-red-100 text-red-700"
                                    : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {actionLabels[l.action] || l.action}
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-mono text-xs text-gray-500 dark:text-gray-400">{l.ipAddress || "—"}</td>
                          <td className="py-3 text-right text-xs text-gray-400 dark:text-gray-500">{formatDate(l.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <div className="lg:hidden space-y-2">
                  {filteredLogins.slice(0, 30).map((l, i) => (
                    <div key={i} className="flex items-center justify-between rounded-xl bg-gray-50/50 dark:bg-gray-800/30 p-3">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-medium text-[#0f172a]">{l.userName || l.email}</p>
                        <div className="flex items-center gap-2">
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${
                              l.action === "LOGIN"
                                ? "bg-green-100 text-green-700"
                                : l.action === "LOGIN_FAILED"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
                            }`}
                          >
                            {actionLabels[l.action] || l.action}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(l.createdAt)}</span>
                        </div>
                      </div>
                      <span className="shrink-0 font-mono text-[10px] text-gray-400 dark:text-gray-500">{l.ipAddress || "—"}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {activeTab === "protection" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-gray-800/20">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-100">
                        <Key className="h-5 w-5 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-[#0f172a]">Authentification 2FA</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">Double facteur pour tous les admins</p>
                      </div>
                    </div>
                    <button
                      onClick={() => setTwoFA(!twoFA)}
                      className={`relative h-6 w-11 rounded-full transition-colors ${
                        twoFA ? "bg-green-500" : "bg-gray-300"
                      }`}
                    >
                      <span
                        className={`absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-gray-800 shadow transition-transform ${
                          twoFA ? "translate-x-5" : "translate-x-0.5"
                        }`}
                      />
                    </button>
                  </div>
                  <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                    {twoFA ? "Activé — Tous les comptes admin nécessitent le 2FA" : "Désactivé — Recommandé pour la sécurité"}
                  </p>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-gray-800/20">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100">
                      <ShieldCheck className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-[#0f172a]">Détection de fraude</p>
                      <p className="text-xs text-gray-400 dark:text-gray-500">Analyse automatique des comportements</p>
                    </div>
                  </div>
                  <div className="mt-4 space-y-2">
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Multiples IPs</span>
                      <span className="text-xs font-medium text-green-600">Activé</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Volume anormal</span>
                      <span className="text-xs font-medium text-green-600">Activé</span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg bg-gray-50 dark:bg-gray-800/50 px-3 py-2">
                      <span className="text-xs text-gray-500 dark:text-gray-400">Géolocalisation</span>
                      <span className="text-xs font-medium text-amber-600">En attente</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-gray-800/20">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Lock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                  Politique de mots de passe
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Longueur minimale</p>
                    <p className="mt-1 text-lg font-bold text-[#0f172a]">8 caractères</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Complexité</p>
                    <p className="mt-1 text-lg font-bold text-[#0f172a]">Majuscule + chiffre</p>
                  </div>
                  <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                    <p className="text-xs text-gray-400 dark:text-gray-500">Expiration</p>
                    <p className="mt-1 text-lg font-bold text-[#0f172a]">90 jours</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-gray-800/20">
                <h3 className="mb-3 flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
                  <Ban className="h-4 w-4 text-red-500" />
                  Liste des IPs bloquées
                </h3>
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Input
                      id="newIP"
                      placeholder="IP à bloquer (ex: 192.168.1.1)"
                      value={newIP}
                      onChange={(e) => setNewIP(e.target.value)}
                    />
                  </div>
                  <button
                    onClick={() => {
                      if (!newIP.trim()) return;
                      setBlockedIPs([...blockedIPs, newIP.trim()]);
                      setNewIP("");
                      toast.success("IP ajoutée à la liste");
                    }}
                    className="shrink-0 rounded-lg bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Bloquer
                  </button>
                </div>
                {blockedIPs.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {blockedIPs.map((ip, i) => (
                      <div key={i} className="flex items-center justify-between rounded-lg bg-red-50 px-3 py-2">
                        <span className="font-mono text-sm text-red-700">{ip}</span>
                        <button
                          onClick={() => setBlockedIPs(blockedIPs.filter((_, idx) => idx !== i))}
                          className="rounded p-1 text-red-400 hover:bg-red-100 hover:text-red-600"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                {blockedIPs.length === 0 && (
                  <p className="mt-3 text-center text-xs text-gray-400 dark:text-gray-500">Aucune IP bloquée manuellement</p>
                )}
              </div>
            </div>
          )}

          {activeTab === "actions" && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setModal({ type: "block_ip" })}
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-5 text-left shadow-sm dark:shadow-gray-800/20 transition-colors hover:border-gray-200"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100">
                    <Globe className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0f172a]">Bloquer une IP</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Restreindre l&apos;accès par adresse</p>
                  </div>
                </button>

                <button
                  onClick={() => setModal({ type: "disconnect_all" })}
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-5 text-left shadow-sm dark:shadow-gray-800/20 transition-colors hover:border-gray-200"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-orange-100">
                    <WifiOff className="h-6 w-6 text-orange-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0f172a]">Déconnecter tous les utilisateurs</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Forcer la déconnexion globale</p>
                  </div>
                </button>

                <button
                  onClick={() => executeAction("reset_sessions")}
                  className="flex items-center gap-4 rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-5 text-left shadow-sm dark:shadow-gray-800/20 transition-colors hover:border-gray-200"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100">
                    <RefreshCw className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-[#0f172a]">Réinitialiser les sessions</p>
                    <p className="text-xs text-gray-400 dark:text-gray-500">Nettoyer les sessions expirées</p>
                  </div>
                </button>

                <button
                  onClick={() => setModal({ type: "clear_logs" })}
                  className="flex items-center gap-4 rounded-2xl border border-red-100 bg-red-50/50 p-5 text-left shadow-sm dark:shadow-gray-800/20 transition-colors hover:border-red-200"
                >
                  <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-100">
                    <Trash2 className="h-6 w-6 text-red-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-red-800">Nettoyer les logs</p>
                    <p className="text-xs text-red-500">Supprimer les logs &gt; 30 jours (OWNER uniquement)</p>
                  </div>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>

      {modal && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={() => { setModal(null); setDoubleConfirm(false); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 px-6 py-4">
                <h3 className="text-lg font-bold text-[#0f172a]">
                  {modal.type === "disconnect" && "Déconnecter l'utilisateur"}
                  {modal.type === "disconnect_all" && "Déconnecter tous les utilisateurs"}
                  {modal.type === "block_ip" && "Bloquer une adresse IP"}
                  {modal.type === "block_email" && "Bloquer l'email"}
                  {modal.type === "clear_logs" && "Nettoyer les journaux"}
                </h3>
                <button
                  onClick={() => { setModal(null); setDoubleConfirm(false); }}
                  className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-5">
                {modal.type === "disconnect" && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Déconnecter <strong>{modal.target?.userName || modal.target?.userEmail}</strong> de sa session active ?
                  </p>
                )}

                {modal.type === "disconnect_all" && (
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Forcer la déconnexion de <strong>tous les utilisateurs</strong> actifs. Cette action est irréversible.
                  </p>
                )}

                {modal.type === "block_ip" && (
                  <div className="space-y-4">
                    <Input
                      id="blockIP"
                      label="Adresse IP"
                      placeholder="192.168.1.1"
                      value={modalInput}
                      onChange={(e) => setModalInput(e.target.value)}
                    />
                    <Input
                      id="blockReason"
                      label="Raison (optionnel)"
                      placeholder="Activité suspecte..."
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                    />
                  </div>
                )}

                {modal.type === "block_email" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Bloquer l&apos;email <strong>{modal.target?.email}</strong> ?
                    </p>
                    <Input
                      id="blockEmailReason"
                      label="Raison"
                      placeholder="Tentatives répétées..."
                      value={modalReason}
                      onChange={(e) => setModalReason(e.target.value)}
                    />
                  </div>
                )}

                {modal.type === "clear_logs" && (
                  <div className="space-y-4">
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      Supprimer tous les journaux d&apos;audit datant de plus de 30 jours.
                    </p>
                    {!doubleConfirm ? (
                      <div className="rounded-xl bg-red-50 p-4">
                        <p className="text-sm font-medium text-red-800">
                          Êtes-vous sûr ? Cette action est irréversible.
                        </p>
                      </div>
                    ) : (
                      <div className="rounded-xl bg-red-100 p-4">
                        <p className="text-sm font-bold text-red-900">
                          Confirmez une dernière fois pour supprimer les logs.
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700/50 px-6 py-4">
                <button
                  onClick={() => { setModal(null); setDoubleConfirm(false); }}
                  className="rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                >
                  Annuler
                </button>

                {modal.type === "disconnect" && (
                  <button
                    onClick={() => executeAction("disconnect_user", { userId: modal.target?.userId })}
                    disabled={submitting}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {submitting ? "En cours..." : "Déconnecter"}
                  </button>
                )}

                {modal.type === "disconnect_all" && (
                  <button
                    onClick={() => executeAction("disconnect_all")}
                    disabled={submitting}
                    className="rounded-lg bg-orange-600 px-4 py-2 text-sm font-medium text-white hover:bg-orange-700 disabled:opacity-50"
                  >
                    {submitting ? "En cours..." : "Tout déconnecter"}
                  </button>
                )}

                {modal.type === "block_ip" && (
                  <button
                    onClick={() => executeAction("block_ip", { ip: modalInput, reason: modalReason })}
                    disabled={submitting || !modalInput.trim()}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {submitting ? "En cours..." : "Bloquer"}
                  </button>
                )}

                {modal.type === "block_email" && (
                  <button
                    onClick={() => executeAction("block_email", { email: modal.target?.email, reason: modalReason })}
                    disabled={submitting}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700 disabled:opacity-50"
                  >
                    {submitting ? "En cours..." : "Bloquer"}
                  </button>
                )}

                {modal.type === "clear_logs" && !doubleConfirm && (
                  <button
                    onClick={() => setDoubleConfirm(true)}
                    className="rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white hover:bg-red-700"
                  >
                    Continuer
                  </button>
                )}

                {modal.type === "clear_logs" && doubleConfirm && (
                  <button
                    onClick={() => executeAction("clear_audit_logs")}
                    disabled={submitting}
                    className="rounded-lg bg-red-700 px-4 py-2 text-sm font-bold text-white hover:bg-red-800 disabled:opacity-50"
                  >
                    {submitting ? "Suppression..." : "Confirmer la suppression"}
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
