"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import {
  Ticket,
  Circle,
  Clock,
  CheckCircle,
  AlertTriangle,
  ArrowUp,
  Minus,
  Search,
  X,
  Send,
  User,
  ChevronRight,
  Plus,
  MessageSquare,
  ArrowUpCircle,
  ArrowLeft,
  RefreshCw,
  UserPlus,
  Tag,
  Mail,
  LayoutList,
  LayoutGrid,
  Settings,
  DollarSign,
  Package,
  HelpCircle,
} from "lucide-react";

interface TicketResponse {
  id: string;
  author: string;
  authorRole: string;
  content: string;
  createdAt: string;
}

interface TicketItem {
  id: string;
  subject: string;
  message: string;
  priority: string;
  status: string;
  userId: string;
  userName: string;
  userEmail: string;
  userRole: string;
  assignedTo: string | null;
  category: string;
  responses: TicketResponse[];
  createdAt: string;
  updatedAt: string;
}

interface TicketStats {
  total: number;
  open: number;
  pending: number;
  resolved: number;
  urgent: number;
  high: number;
  medium: number;
  low: number;
}

interface TeamMember {
  id: string;
  name: string | null;
  email: string;
  role: string;
}

const priorityConfig: Record<
  string,
  { label: string; color: string; bg: string; stripe: string }
> = {
  urgent: {
    label: "Urgente",
    color: "text-red-700",
    bg: "bg-red-100",
    stripe: "bg-red-500",
  },
  high: {
    label: "Haute",
    color: "text-orange-700",
    bg: "bg-orange-100",
    stripe: "bg-orange-500",
  },
  medium: {
    label: "Moyenne",
    color: "text-amber-700",
    bg: "bg-amber-100",
    stripe: "bg-amber-500",
  },
  low: {
    label: "Basse",
    color: "text-gray-600 dark:text-gray-400",
    bg: "bg-gray-100 dark:bg-gray-700",
    stripe: "bg-gray-400",
  },
};

const statusConfig: Record<string, { label: string; color: string; bg: string }> =
  {
    open: { label: "Ouvert", color: "text-blue-700", bg: "bg-blue-100" },
    pending: {
      label: "En attente",
      color: "text-amber-700",
      bg: "bg-amber-100",
    },
    resolved: {
      label: "Résolu",
      color: "text-green-700",
      bg: "bg-green-100",
    },
    closed: { label: "Fermé", color: "text-gray-500 dark:text-gray-400", bg: "bg-gray-100 dark:bg-gray-700" },
  };

const statusTabs = [
  { id: "all", label: "Tous" },
  { id: "open", label: "Ouverts" },
  { id: "pending", label: "En attente" },
  { id: "resolved", label: "Résolus" },
  { id: "closed", label: "Fermés" },
] as const;

const categoryConfig: Record<string, { label: string; icon: typeof Ticket }> = {
  technical: { label: "Technique", icon: Settings },
  billing: { label: "Facturation", icon: DollarSign },
  account: { label: "Compte", icon: User },
  product: { label: "Produit", icon: Package },
  other: { label: "Autre", icon: HelpCircle },
};

const quickReplies = [
  { label: "Merci pour votre message", text: "Merci pour votre message. Nous étudions votre demande et reviendrons vers vous rapidement." },
  { label: "Information demandée", text: "Pourriez-vous nous fournir plus de détails concernant votre problème afin que nous puissions mieux vous aider ?" },
  { label: "Ticket résolu", text: "Votre problème semble avoir été résolu. N'hésitez pas à nous recontacter si vous avez d'autres questions." },
  { label: "Escalade", text: "Votre demande a été escaladée à un spécialiste. Vous recevrez une réponse dans les plus brefs délais." },
];

export default function SupportPage() {
  const [tickets, setTickets] = useState<TicketItem[]>([]);
  const [stats, setStats] = useState<TicketStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeStatus, setActiveStatus] = useState("all");
  const [priorityFilter, setPriorityFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTicket, setSelectedTicket] = useState<TicketItem | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "chat">("list");
  const chatEndRef = useRef<HTMLDivElement>(null);

  const [newSubject, setNewSubject] = useState("");
  const [newMessage, setNewMessage] = useState("");
  const [newPriority, setNewPriority] = useState("medium");
  const [newCategory, setNewCategory] = useState("technical");

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (activeStatus !== "all") params.set("status", activeStatus);
      if (priorityFilter !== "all") params.set("priority", priorityFilter);
      if (searchQuery) params.set("search", searchQuery);

      const [ticketsRes, teamRes] = await Promise.all([
        fetch(`/api/admin/support?${params.toString()}`),
        fetch("/api/admin/team"),
      ]);

      if (ticketsRes.ok) {
        const data = await ticketsRes.json();
        setTickets(data.tickets || []);
        setStats(data.stats || null);
      }

      if (teamRes.ok) {
        const data = await teamRes.json();
        setTeamMembers(data.members || []);
      }
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, [activeStatus, priorityFilter, searchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  useEffect(() => {
    if (selectedTicket && viewMode === "chat") {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
      }, 100);
    }
  }, [selectedTicket, viewMode]);

  const createTicket = async () => {
    if (!newSubject.trim() || !newMessage.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subject: newSubject,
          message: newMessage,
          priority: newPriority,
          category: newCategory,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Ticket créé avec succès");
      setShowCreateModal(false);
      setNewSubject("");
      setNewMessage("");
      setNewPriority("medium");
      setNewCategory("technical");
      fetchData();
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const updateTicket = async (ticketId: string, data: Record<string, any>) => {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticketId, ...data }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Ticket mis à jour");
      fetchData();
      if (selectedTicket && selectedTicket.id === ticketId) {
        setSelectedTicket((prev) => (prev ? { ...prev, ...data } : null));
      }
    } catch {
      toast.error("Erreur lors de la mise à jour");
    } finally {
      setSubmitting(false);
    }
  };

  const sendReply = async () => {
    if (!selectedTicket || !replyText.trim()) return;
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/support", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          replyContent: replyText,
        }),
      });
      if (!res.ok) throw new Error("Failed");
      toast.success("Réponse envoyée");
      setReplyText("");
      fetchData();
      setSelectedTicket((prev) =>
        prev
          ? {
              ...prev,
              responses: [
                ...prev.responses,
                {
                  id: Date.now().toString(),
                  author: "Admin",
                  authorRole: "ADMIN",
                  content: replyText,
                  createdAt: new Date().toISOString(),
                },
              ],
            }
          : null
      );
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSubmitting(false);
    }
  };

  const openTicketChat = (ticket: TicketItem) => {
    setSelectedTicket(ticket);
    setViewMode("chat");
  };

  const backToList = () => {
    setSelectedTicket(null);
    setViewMode("list");
    fetchData();
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
      hour: "2-digit",
      minute: "2-digit",
    });

  const statsCards = stats
    ? [
        {
          label: "Total",
          value: stats.total,
          icon: Ticket,
          iconBg: "bg-indigo-100",
          iconColor: "text-indigo-600",
        },
        {
          label: "Ouverts",
          value: stats.open,
          icon: Circle,
          iconBg: "bg-blue-100",
          iconColor: "text-blue-600",
        },
        {
          label: "En attente",
          value: stats.pending,
          icon: Clock,
          iconBg: "bg-amber-100",
          iconColor: "text-amber-600",
        },
        {
          label: "Résolus",
          value: stats.resolved,
          icon: CheckCircle,
          iconBg: "bg-green-100",
          iconColor: "text-green-600",
        },
        {
          label: "Urgentes",
          value: stats.urgent,
          icon: AlertTriangle,
          iconBg: "bg-red-100",
          iconColor: "text-red-600",
        },
        {
          label: "Haute",
          value: stats.high,
          icon: ArrowUp,
          iconBg: "bg-orange-100",
          iconColor: "text-orange-600",
        },
        {
          label: "Moyenne",
          value: stats.medium,
          icon: Minus,
          iconBg: "bg-gray-100 dark:bg-gray-700",
          iconColor: "text-gray-600 dark:text-gray-400",
        },
      ]
    : [];

  if (loading && !stats) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
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
      {viewMode === "list" ? (
        <>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-[#0f172a]">
                Support / Tickets
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                Gestion des demandes de support
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={fetchData}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <RefreshCw
                  className={`h-4 w-4 ${loading ? "animate-spin" : ""}`}
                />
              </button>
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 transition-colors"
              >
                <Plus className="h-4 w-4" />
                <span className="hidden sm:inline">Nouveau ticket</span>
              </button>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            {statsCards.map((s) => (
              <div
                key={s.label}
                className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-3 shadow-sm dark:shadow-gray-800/20"
              >
                <div className="flex items-center gap-2">
                  <div
                    className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.iconBg}`}
                  >
                    <s.icon className={`h-4 w-4 ${s.iconColor}`} />
                  </div>
                  <div>
                    <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      {s.label}
                    </p>
                    <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                      {s.value}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20">
            <div className="border-b border-gray-100 dark:border-gray-700/50 px-4 py-3">
              <div className="flex flex-wrap items-center gap-2">
                {statusTabs.map((tab) => (
                  <button
                    key={tab.id}
                    onClick={() => setActiveStatus(tab.id)}
                    className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${
                      activeStatus === tab.id
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
                    placeholder="Rechercher un ticket..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>
                <select
                  value={priorityFilter}
                  onChange={(e) => setPriorityFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                >
                  <option value="all">Toutes priorités</option>
                  <option value="urgent">Urgente</option>
                  <option value="high">Haute</option>
                  <option value="medium">Moyenne</option>
                  <option value="low">Basse</option>
                </select>
                <select
                  value={categoryFilter}
                  onChange={(e) => setCategoryFilter(e.target.value)}
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                >
                  <option value="all">Toutes catégories</option>
                  <option value="technical">Technique</option>
                  <option value="billing">Facturation</option>
                  <option value="account">Compte</option>
                  <option value="product">Produit</option>
                  <option value="other">Autre</option>
                </select>
              </div>
            </div>

            <div className="p-4">
              <div className="hidden lg:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      <th className="pb-3 pr-4 text-left">ID</th>
                      <th className="pb-3 pr-4 text-left">Sujet</th>
                      <th className="pb-3 pr-4 text-left">Utilisateur</th>
                      <th className="pb-3 pr-4 text-left">Catégorie</th>
                      <th className="pb-3 pr-4 text-left">Priorité</th>
                      <th className="pb-3 pr-4 text-left">Statut</th>
                      <th className="pb-3 pr-4 text-left">Assigné à</th>
                      <th className="pb-3 pr-4 text-left">Date</th>
                      <th className="pb-3 pr-4 text-center">
                        <MessageSquare className="inline h-3.5 w-3.5" />
                      </th>
                      <th className="pb-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {tickets.map((ticket) => {
                      const pCfg =
                        priorityConfig[ticket.priority] ||
                        priorityConfig.medium;
                      const sCfg =
                        statusConfig[ticket.status] || statusConfig.open;
                      const catCfg =
                        categoryConfig[ticket.category] ||
                        categoryConfig.other;
                      return (
                        <tr
                          key={ticket.id}
                          className="hover:bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer"
                          onClick={() => openTicketChat(ticket)}
                        >
                          <td className="py-3 pr-4">
                            <span className="font-mono text-xs text-gray-400 dark:text-gray-500">
                              {ticket.id.slice(0, 12)}...
                            </span>
                          </td>
                          <td className="py-3 pr-4 font-medium text-[#0f172a] max-w-[200px] truncate">
                            {ticket.subject}
                          </td>
                          <td className="py-3 pr-4">
                            <div className="flex items-center gap-2">
                              <div className="flex h-6 w-6 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
                                <User className="h-3 w-3 text-gray-500 dark:text-gray-400" />
                              </div>
                              <span className="text-gray-600 dark:text-gray-400 truncate max-w-[120px]">
                                {ticket.userName || ticket.userEmail}
                              </span>
                            </div>
                          </td>
                          <td className="py-3 pr-4">
                            <span className="inline-flex items-center gap-1 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                              <Tag className="h-3 w-3" />
                              {catCfg.label}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${pCfg.bg} ${pCfg.color}`}
                            >
                              {pCfg.label}
                            </span>
                          </td>
                          <td className="py-3 pr-4">
                            <span
                              className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${sCfg.bg} ${sCfg.color}`}
                            >
                              {sCfg.label}
                            </span>
                          </td>
                          <td className="py-3 pr-4 text-xs text-gray-500 dark:text-gray-400">
                            {ticket.assignedTo || (
                              <span className="text-gray-300">—</span>
                            )}
                          </td>
                          <td className="py-3 pr-4 text-xs text-gray-400 dark:text-gray-500">
                            {formatDate(ticket.createdAt)}
                          </td>
                          <td className="py-3 pr-4 text-center">
                            <span className="inline-flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                              <MessageSquare className="h-3.5 w-3.5" />
                              {ticket.responses.length}
                            </span>
                          </td>
                          <td className="py-3 text-right">
                            <ChevronRight className="inline h-4 w-4 text-gray-400 dark:text-gray-500" />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div className="lg:hidden space-y-3">
                {tickets.map((ticket) => {
                  const pCfg =
                    priorityConfig[ticket.priority] || priorityConfig.medium;
                  const sCfg =
                    statusConfig[ticket.status] || statusConfig.open;
                  return (
                    <div
                      key={ticket.id}
                      className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 p-4 cursor-pointer"
                      onClick={() => openTicketChat(ticket)}
                    >
                      <div className="flex items-start gap-3">
                        <div
                          className={`h-full w-1 shrink-0 self-stretch rounded-full ${pCfg.stripe}`}
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-[#0f172a]">
                              {ticket.subject}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${pCfg.bg} ${pCfg.color}`}
                            >
                              {pCfg.label}
                            </span>
                            <span
                              className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${sCfg.bg} ${sCfg.color}`}
                            >
                              {sCfg.label}
                            </span>
                          </div>
                          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                            {ticket.message}
                          </p>
                          <div className="mt-2 flex items-center gap-3 text-xs text-gray-400 dark:text-gray-500">
                            <span className="flex items-center gap-1">
                              <User className="h-3 w-3" />
                              {ticket.userName || ticket.userEmail}
                            </span>
                            <span>•</span>
                            <span>{formatDate(ticket.createdAt)}</span>
                            <span className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              {ticket.responses.length}
                            </span>
                            {ticket.assignedTo && (
                              <>
                                <span>•</span>
                                <span>{ticket.assignedTo}</span>
                              </>
                            )}
                          </div>
                        </div>
                        <ChevronRight className="h-4 w-4 shrink-0 text-gray-400 dark:text-gray-500" />
                      </div>
                    </div>
                  );
                })}
              </div>

              {tickets.length === 0 && (
                <div className="py-12 text-center">
                  <Ticket className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-3 text-sm font-medium text-gray-500 dark:text-gray-400">
                    Aucun ticket trouvé
                  </p>
                </div>
              )}
            </div>
          </div>
        </>
      ) : (
        selectedTicket && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <button
                onClick={backToList}
                className="flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </button>
              <div className="flex-1 min-w-0">
                <h1 className="text-lg font-bold text-[#0f172a] truncate">
                  {selectedTicket.subject}
                </h1>
                <div className="flex items-center gap-2 mt-1 flex-wrap">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      priorityConfig[selectedTicket.priority]?.bg || "bg-gray-100 dark:bg-gray-700"
                    } ${priorityConfig[selectedTicket.priority]?.color || "text-gray-600 dark:text-gray-400"}`}
                  >
                    {priorityConfig[selectedTicket.priority]?.label || selectedTicket.priority}
                  </span>
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                      statusConfig[selectedTicket.status]?.bg || "bg-gray-100 dark:bg-gray-700"
                    } ${statusConfig[selectedTicket.status]?.color || "text-gray-600 dark:text-gray-400"}`}
                  >
                    {statusConfig[selectedTicket.status]?.label || selectedTicket.status}
                  </span>
                  <span className="text-xs text-gray-400 dark:text-gray-500">
                    {selectedTicket.userName || selectedTicket.userEmail}
                  </span>
                </div>
              </div>
            </div>

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-4">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20">
                  <div className="border-b border-gray-100 dark:border-gray-700/50 px-4 py-3">
                    <h3 className="text-sm font-bold text-[#0f172a]">
                      Conversation
                    </h3>
                  </div>

                  <div className="max-h-[500px] overflow-y-auto p-4 space-y-4">
                    <div className="flex gap-3">
                      <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-blue-100">
                        <User className="h-4 w-4 text-blue-600" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-semibold text-[#0f172a]">
                            {selectedTicket.userName || "Utilisateur"}
                          </span>
                          <span className="rounded-full bg-gray-200 px-1.5 py-0.5 text-[10px] font-medium text-gray-600 dark:text-gray-400">
                            {selectedTicket.userRole}
                          </span>
                          <span className="text-[10px] text-gray-400 dark:text-gray-500">
                            {formatDate(selectedTicket.createdAt)}
                          </span>
                        </div>
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                            {selectedTicket.message}
                          </p>
                        </div>
                      </div>
                    </div>

                    {selectedTicket.responses.map((r) => (
                      <div key={r.id} className="flex gap-3">
                        <div
                          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
                            r.authorRole === "ADMIN"
                              ? "bg-indigo-100"
                              : "bg-blue-100"
                          }`}
                        >
                          <User
                            className={`h-4 w-4 ${
                              r.authorRole === "ADMIN"
                                ? "text-indigo-600"
                                : "text-blue-600"
                            }`}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-xs font-semibold text-[#0f172a]">
                              {r.author}
                            </span>
                            <span
                              className={`rounded-full px-1.5 py-0.5 text-[10px] font-medium ${
                                r.authorRole === "ADMIN"
                                  ? "bg-indigo-100 text-indigo-700"
                                  : "bg-gray-200 text-gray-600 dark:text-gray-400"
                              }`}
                            >
                              {r.authorRole}
                            </span>
                            <span className="text-[10px] text-gray-400 dark:text-gray-500">
                              {formatDate(r.createdAt)}
                            </span>
                          </div>
                          <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                            <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
                              {r.content}
                            </p>
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={chatEndRef} />
                  </div>

                  <div className="border-t border-gray-100 dark:border-gray-700/50 p-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      {quickReplies.map((qr) => (
                        <button
                          key={qr.label}
                          onClick={() => setReplyText(qr.text)}
                          className="rounded-full border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                        >
                          {qr.label}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <textarea
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        placeholder="Écrire une réponse..."
                        rows={2}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 resize-none"
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendReply();
                          }
                        }}
                      />
                      <button
                        onClick={sendReply}
                        disabled={!replyText.trim() || submitting}
                        className="flex items-center justify-center gap-2 rounded-lg bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    Actions
                  </h4>
                  <div className="space-y-2">
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        Statut
                      </label>
                      <select
                        value={selectedTicket.status}
                        onChange={(e) =>
                          updateTicket(selectedTicket.id, {
                            status: e.target.value,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                      >
                        <option value="open">Ouvert</option>
                        <option value="pending">En attente</option>
                        <option value="resolved">Résolu</option>
                        <option value="closed">Fermé</option>
                      </select>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs font-medium text-gray-600 dark:text-gray-400">
                        <UserPlus className="inline h-3 w-3 mr-1" />
                        Assigner à
                      </label>
                      <select
                        value={selectedTicket.assignedTo || ""}
                        onChange={(e) =>
                          updateTicket(selectedTicket.id, {
                            assignedTo: e.target.value || null,
                          })
                        }
                        className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                      >
                        <option value="">Non assigné</option>
                        {teamMembers.map((m) => (
                          <option key={m.id} value={m.name || m.email}>
                            {m.name || m.email} ({m.role})
                          </option>
                        ))}
                      </select>
                    </div>
                    <button
                      onClick={() =>
                        updateTicket(selectedTicket.id, {
                          priority:
                            selectedTicket.priority === "urgent"
                              ? "high"
                              : "urgent",
                        })
                      }
                      className={`w-full flex items-center justify-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition-colors ${
                        selectedTicket.priority === "urgent"
                          ? "bg-red-50 text-red-700 hover:bg-red-100"
                          : "bg-red-50 text-red-700 hover:bg-red-100"
                      }`}
                    >
                      <ArrowUpCircle className="h-3.5 w-3.5" />
                      {selectedTicket.priority === "urgent"
                        ? "Descendre priorité"
                        : "Escalader"}
                    </button>
                    <button
                      onClick={() =>
                        updateTicket(selectedTicket.id, { status: "closed" })
                      }
                      className="w-full flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200 transition-colors"
                    >
                      Fermer le ticket
                    </button>
                  </div>
                </div>

                <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
                  <h4 className="text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-3">
                    Détails
                  </h4>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <User className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {selectedTicket.userName || "Utilisateur"}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Mail className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {selectedTicket.userEmail}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {formatDate(selectedTicket.createdAt)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Tag className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-gray-600 dark:text-gray-400">
                        {selectedTicket.userRole}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )
      )}

      {showCreateModal && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm"
            onClick={() => setShowCreateModal(false)}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 shadow-2xl">
              <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 px-6 py-4">
                <h3 className="text-lg font-bold text-[#0f172a]">
                  Nouveau ticket
                </h3>
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              <div className="px-6 py-5 space-y-4">
                <Input
                  id="newSubject"
                  label="Sujet"
                  value={newSubject}
                  onChange={(e) => setNewSubject(e.target.value)}
                  placeholder="Ex: Problème de paiement"
                />

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Catégorie
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    {Object.entries(categoryConfig).map(([key, cfg]) => {
                      const Icon = cfg.icon;
                      const isSelected = newCategory === key;
                      return (
                        <button
                          key={key}
                          onClick={() => setNewCategory(key)}
                          className={`rounded-xl border-2 px-2 py-2 text-center transition-all ${
                            isSelected
                              ? "border-[#0f172a] bg-[#0f172a] text-white"
                              : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            <Icon className="h-4 w-4" />
                            <span className="text-[10px] font-medium">
                              {cfg.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>

                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Message
                  </label>
                  <textarea
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Décrivez votre problème en détail..."
                    rows={4}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 resize-none"
                  />
                </div>

                <div>
                  <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                    Priorité
                  </label>
                  <div className="grid grid-cols-4 gap-2">
                    {(["low", "medium", "high", "urgent"] as const).map((p) => {
                      const cfg = priorityConfig[p];
                      const isSelected = newPriority === p;
                      return (
                        <button
                          key={p}
                          onClick={() => setNewPriority(p)}
                          className={`rounded-xl border-2 px-3 py-3 text-center transition-all ${
                            isSelected
                              ? `${cfg.bg} ${cfg.color} border-current`
                              : "border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300"
                          }`}
                        >
                          <div className="flex flex-col items-center gap-1">
                            {p === "urgent" && (
                              <AlertTriangle className="h-4 w-4" />
                            )}
                            {p === "high" && <ArrowUp className="h-4 w-4" />}
                            {p === "medium" && <Minus className="h-4 w-4" />}
                            {p === "low" && <Circle className="h-4 w-4" />}
                            <span className="text-xs font-medium">
                              {cfg.label}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700/50 px-6 py-4">
                <button
                  onClick={() => setShowCreateModal(false)}
                  className="rounded-lg bg-gray-100 dark:bg-gray-700 px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  onClick={createTicket}
                  disabled={
                    submitting || !newSubject.trim() || !newMessage.trim()
                  }
                  className="rounded-lg bg-[#0f172a] px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Création..." : "Créer le ticket"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
