"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import {
  MessageSquare,
  Send,
  Plus,
  Search,
  Clock,
  CheckCircle,
  AlertCircle,
  XCircle,
  ChevronLeft,
  Paperclip,
  Smile,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

interface Ticket {
  id: string;
  subject: string;
  description: string;
  category: string;
  priority: string;
  status: string;
  assignedTo: string | null;
  assignedName: string | null;
  createdAt: string;
  updatedAt: string;
  messages?: Message[];
}

interface Message {
  id: string;
  ticketId: string;
  senderId: string | null;
  senderName: string;
  senderRole: string;
  content: string;
  contentType: string;
  createdAt: string;
}

const categoryConfig: Record<string, { label: string; icon: string; color: string }> = {
  technique: { label: "Technique", icon: "🔧", color: "bg-blue-100 text-blue-700" },
  paiement: { label: "Paiement", icon: "💰", color: "bg-green-100 text-green-700" },
  boutique: { label: "Boutique", icon: "🏪", color: "bg-purple-100 text-purple-700" },
  produit: { label: "Produit", icon: "📦", color: "bg-orange-100 text-orange-700" },
  compte: { label: "Compte", icon: "👤", color: "bg-gray-100 text-gray-700" },
  autre: { label: "Autre", icon: "💬", color: "bg-gray-100 text-gray-500" },
};

const statusConfig: Record<string, { label: string; color: string; icon: typeof CheckCircle }> = {
  open: { label: "Ouvert", color: "bg-blue-100 text-blue-700", icon: AlertCircle },
  pending: { label: "En attente", color: "bg-amber-100 text-amber-700", icon: Clock },
  resolved: { label: "Résolu", color: "bg-green-100 text-green-700", icon: CheckCircle },
  closed: { label: "Fermé", color: "bg-gray-100 text-gray-500", icon: XCircle },
};

const priorityConfig: Record<string, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "text-red-600" },
  high: { label: "Haute", color: "text-orange-600" },
  medium: { label: "Moyenne", color: "text-amber-600" },
  low: { label: "Basse", color: "text-gray-500" },
};

function formatTime(d: string) {
  return new Date(d).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });
}

function formatDate(d: string) {
  const date = new Date(d);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));
  if (days === 0) return formatTime(d);
  if (days === 1) return "Hier";
  if (days < 7) return `Il y a ${days}j`;
  return date.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
}

export default function VendorHelpPage() {
  const { data: session } = useSession();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [messagesLoading, setMessagesLoading] = useState(false);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  const fetchTickets = useCallback(async () => {
    try {
      const params = new URLSearchParams();
      if (statusFilter !== "all") params.set("status", statusFilter);
      if (search) params.set("search", search);
      const res = await fetch(`/api/support/tickets?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTickets(data.tickets || []);
      }
    } catch {
      // ignore
    } finally {
      setLoading(false);
    }
  }, [statusFilter, search]);

  useEffect(() => {
    fetchTickets();
  }, [fetchTickets]);

  const fetchMessages = useCallback(async (ticketId: string) => {
    setMessagesLoading(true);
    try {
      const res = await fetch(`/api/support/messages?ticketId=${ticketId}`);
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages || []);
      }
    } catch {
      // ignore
    } finally {
      setMessagesLoading(false);
    }
  }, []);

  useEffect(() => {
    if (selectedTicket) {
      fetchMessages(selectedTicket.id);
      pollingRef.current = setInterval(() => {
        fetchMessages(selectedTicket.id);
      }, 5000);
    }
    return () => {
      if (pollingRef.current) clearInterval(pollingRef.current);
    };
  }, [selectedTicket, fetchMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !selectedTicket || sending) return;
    setSending(true);
    try {
      const res = await fetch("/api/support/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ticketId: selectedTicket.id,
          content: newMessage.trim(),
        }),
      });
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      if (data.message) {
        setMessages((prev) => [...prev, data.message]);
      }
      setNewMessage("");
      fetchTickets();
    } catch {
      toast.error("Erreur lors de l'envoi");
    } finally {
      setSending(false);
    }
  };

  const handleCreateTicket = async (subject: string, category: string, description: string, priority: string) => {
    try {
      const res = await fetch("/api/support/tickets", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subject, category, description, priority }),
      });
      if (!res.ok) throw new Error("Erreur");
      const data = await res.json();
      toast.success("Ticket créé");
      setShowCreate(false);
      fetchTickets();
      if (data.ticket) {
        setSelectedTicket(data.ticket);
      }
    } catch {
      toast.error("Erreur lors de la création");
    }
  };

  const filteredTickets = tickets.filter((t) => {
    if (statusFilter !== "all" && t.status !== statusFilter) return false;
    if (search && !t.subject.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-900">
      {/* Sidebar - Ticket List */}
      <div className={cn(
        "flex flex-col border-r border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-800",
        selectedTicket ? "hidden md:flex md:w-80 lg:w-96" : "w-full md:w-80 lg:w-96"
      )}>
        <div className="border-b border-gray-200 p-4 dark:border-gray-700">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold text-gray-900 dark:text-gray-100">Messages</h1>
            <button
              onClick={() => setShowCreate(true)}
              className="flex items-center gap-1.5 rounded-xl bg-[#7126b6] px-3 py-2 text-xs font-medium text-white hover:bg-[#5e1f99] transition-colors"
            >
              <Plus className="h-3.5 w-3.5" />
              Nouveau
            </button>
          </div>
          <div className="mt-3 relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Rechercher..."
              className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-9 pr-3 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6] dark:border-gray-600 dark:bg-gray-700"
            />
          </div>
          <div className="mt-3 flex gap-1.5 overflow-x-auto">
            {["all", "open", "pending", "resolved"].map((s) => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "flex-shrink-0 rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                  statusFilter === s
                    ? "bg-[#7126b6] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-400"
                )}
              >
                {s === "all" ? "Tous" : statusConfig[s]?.label || s}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
              ))}
            </div>
          ) : filteredTickets.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4">
              <MessageSquare className="h-12 w-12 text-gray-300" />
              <p className="mt-3 text-sm font-medium text-gray-500">Aucun message</p>
              <p className="mt-1 text-xs text-gray-400">Créez un ticket pour contacter le support</p>
            </div>
          ) : (
            filteredTickets.map((ticket) => {
              const status = statusConfig[ticket.status] || statusConfig.open;
              const category = categoryConfig[ticket.category] || categoryConfig.autre;
              return (
                <button
                  key={ticket.id}
                  onClick={() => setSelectedTicket(ticket)}
                  className={cn(
                    "w-full border-b border-gray-100 p-4 text-left transition-colors hover:bg-gray-50 dark:border-gray-700 dark:hover:bg-gray-800",
                    selectedTicket?.id === ticket.id && "bg-[#7126b6]/5 border-l-2 border-l-[#7126b6]"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                        {ticket.subject}
                      </p>
                      <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400 truncate">
                        {ticket.description}
                      </p>
                    </div>
                    <span className={cn("ml-2 flex-shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium", status.color)}>
                      {status.label}
                    </span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <span className={cn("rounded-full px-1.5 py-0.5 text-[10px] font-medium", category.color)}>
                      {category.icon} {category.label}
                    </span>
                    <span className="text-[10px] text-gray-400">{formatDate(ticket.createdAt)}</span>
                    {ticket.assignedName && (
                      <span className="text-[10px] text-gray-400">→ {ticket.assignedName}</span>
                    )}
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className={cn(
        "flex flex-1 flex-col",
        !selectedTicket && "hidden md:flex"
      )}>
        {selectedTicket ? (
          <>
            {/* Chat Header */}
            <div className="flex items-center gap-3 border-b border-gray-200 bg-white px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <button
                onClick={() => setSelectedTicket(null)}
                className="rounded-lg p-1.5 text-gray-500 hover:bg-gray-100 md:hidden"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                  {selectedTicket.subject}
                </p>
                <div className="flex items-center gap-2">
                  <span className={cn(
                    "rounded-full px-1.5 py-0.5 text-[10px] font-medium",
                    statusConfig[selectedTicket.status]?.color || "bg-gray-100 text-gray-500"
                  )}>
                    {statusConfig[selectedTicket.status]?.label || selectedTicket.status}
                  </span>
                  <span className={cn(
                    "text-[10px] font-medium",
                    priorityConfig[selectedTicket.priority]?.color || "text-gray-500"
                  )}>
                    {priorityConfig[selectedTicket.priority]?.label || selectedTicket.priority}
                  </span>
                </div>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto bg-gray-50 p-4 dark:bg-gray-900">
              {messagesLoading ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="h-6 w-6 animate-spin text-[#7126b6]" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12">
                  <MessageSquare className="h-10 w-10 text-gray-300" />
                  <p className="mt-2 text-sm text-gray-500">Aucun message</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {messages.map((msg) => {
                    const isMe = msg.senderId === session?.user?.id;
                    const isAdmin = msg.senderRole === "admin" || msg.senderRole === "ADMIN" || msg.senderRole === "OWNER" || msg.senderRole === "MODERATOR";
                    return (
                      <div key={msg.id} className={cn("flex", isMe ? "justify-end" : "justify-start")}>
                        <div className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-2.5",
                          isMe
                            ? "bg-[#7126b6] text-white"
                            : "bg-white text-gray-900 shadow-sm dark:bg-gray-800 dark:text-gray-100"
                        )}>
                          {!isMe && (
                            <p className={cn(
                              "text-[10px] font-semibold mb-1",
                              isAdmin ? "text-[#7126b6]" : "text-gray-500"
                            )}>
                              {msg.senderName}
                              {isAdmin && " · Support"}
                            </p>
                          )}
                          <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <p className={cn(
                            "mt-1 text-[10px]",
                            isMe ? "text-white/60" : "text-gray-400"
                          )}>
                            {formatTime(msg.createdAt)}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>
              )}
            </div>

            {/* Message Input */}
            {selectedTicket.status !== "closed" ? (
              <div className="border-t border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
                <div className="flex items-end gap-2">
                  <div className="flex-1 rounded-xl border border-gray-200 bg-gray-50 focus-within:border-[#7126b6] focus-within:ring-1 focus-within:ring-[#7126b6] dark:border-gray-600 dark:bg-gray-700">
                    <textarea
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter" && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage();
                        }
                      }}
                      placeholder="Écrire un message..."
                      rows={1}
                      className="w-full resize-none rounded-xl bg-transparent px-4 py-3 text-sm focus:outline-none"
                    />
                  </div>
                  <button
                    onClick={handleSendMessage}
                    disabled={!newMessage.trim() || sending}
                    className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7126b6] text-white transition-colors hover:bg-[#5e1f99] disabled:opacity-50"
                  >
                    {sending ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Send className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>
            ) : (
              <div className="border-t border-gray-200 bg-gray-50 p-4 text-center dark:border-gray-700 dark:bg-gray-800">
                <p className="text-sm text-gray-500">Ce ticket est fermé</p>
              </div>
            )}
          </>
        ) : (
          <div className="hidden flex-1 items-center justify-center bg-gray-50 dark:bg-gray-900 md:flex">
            <div className="text-center">
              <MessageSquare className="mx-auto h-16 w-16 text-gray-300" />
              <h3 className="mt-4 text-lg font-semibold text-gray-700 dark:text-gray-300">
                Messagerie Support
              </h3>
              <p className="mt-2 text-sm text-gray-500 max-w-sm">
                Sélectionnez une conversation ou créez un nouveau ticket pour contacter notre équipe support.
              </p>
              <button
                onClick={() => setShowCreate(true)}
                className="mt-4 inline-flex items-center gap-2 rounded-xl bg-[#7126b6] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#5e1f99] transition-colors"
              >
                <Plus className="h-4 w-4" />
                Nouveau ticket
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Create Ticket Modal */}
      {showCreate && (
        <CreateTicketModal
          onClose={() => setShowCreate(false)}
          onCreate={handleCreateTicket}
        />
      )}
    </div>
  );
}

function CreateTicketModal({ onClose, onCreate }: { onClose: () => void; onCreate: (subject: string, category: string, description: string, priority: string) => void }) {
  const [subject, setSubject] = useState("");
  const [category, setCategory] = useState("technique");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("medium");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!subject.trim() || !description.trim()) {
      toast.error("Veuillez remplir tous les champs");
      return;
    }
    setLoading(true);
    await onCreate(subject, category, description, priority);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-gray-800" onClick={(e) => e.stopPropagation()}>
        <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Nouveau ticket</h2>
        <p className="mt-1 text-sm text-gray-500">Décrivez votre problème pour contacter le support</p>

        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sujet</label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="Ex: Problème de paiement"
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6] dark:border-gray-600"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Catégorie</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2">
              {Object.entries(categoryConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setCategory(key)}
                  className={cn(
                    "rounded-xl border-2 p-2.5 text-center text-xs font-medium transition-all",
                    category === key
                      ? "border-[#7126b6] bg-purple-50 text-[#7126b6]"
                      : "border-gray-200 hover:border-gray-300 text-gray-600 dark:border-gray-600"
                  )}
                >
                  <div className="text-lg">{config.icon}</div>
                  <div className="mt-1">{config.label}</div>
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Priorité</label>
            <div className="flex gap-2">
              {Object.entries(priorityConfig).map(([key, config]) => (
                <button
                  key={key}
                  onClick={() => setPriority(key)}
                  className={cn(
                    "flex-1 rounded-xl border-2 px-3 py-2 text-xs font-medium transition-all",
                    priority === key
                      ? "border-[#7126b6] bg-purple-50 text-[#7126b6]"
                      : "border-gray-200 text-gray-600 hover:border-gray-300 dark:border-gray-600"
                  )}
                >
                  {config.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Décrivez votre problème en détail..."
              rows={4}
              className="w-full rounded-xl border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6] dark:border-gray-600"
            />
          </div>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 rounded-xl border border-gray-200 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300"
          >
            Annuler
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !subject.trim() || !description.trim()}
            className="flex-1 rounded-xl bg-[#7126b6] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#5e1f99] disabled:opacity-50 transition-colors"
          >
            {loading ? "Envoi..." : "Créer le ticket"}
          </button>
        </div>
      </div>
    </div>
  );
}
