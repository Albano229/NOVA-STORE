"use client";

import { useEffect, useState } from "react";
import { Search, Users, DollarSign, ShoppingCart, Phone, Mail } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { StatCard } from "@/components/ui/stat-card";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Client {
  id: string;
  name: string | null;
  email: string;
  phone: string | null;
  createdAt: string;
  orderCount: number;
  totalSpent: number;
  lastOrder: string | null;
}

const AVATAR_COLORS = [
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-violet-500",
  "bg-pink-500",
  "bg-teal-500",
  "bg-orange-500",
  "bg-sky-500",
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length];
}

function getInitials(name: string | null, email: string): string {
  if (name) {
    const parts = name.trim().split(" ");
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return parts[0].substring(0, 2).toUpperCase();
  }
  return email.substring(0, 2).toUpperCase();
}

function relativeDate(dateStr: string | null): string {
  if (!dateStr) return "—";
  const now = new Date();
  const date = new Date(dateStr);
  const diffMs = now.getTime() - date.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

  if (diffDays === 0) return "Aujourd'hui";
  if (diffDays === 1) return "Hier";
  if (diffDays < 7) return `Il y a ${diffDays} jours`;
  if (diffDays < 30) return `Il y a ${Math.floor(diffDays / 7)} sem.`;
  if (diffDays < 365) return `Il y a ${Math.floor(diffDays / 30)} mois`;
  return `Il y a ${Math.floor(diffDays / 365)} an${Math.floor(diffDays / 365) > 1 ? "s" : ""}`;
}

export default function VendorClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/vendor/clients")
      .then((res) => res.json())
      .then((data) => {
        setClients(data.clients || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filteredClients = clients.filter((c) => {
    const q = search.toLowerCase();
    return (
      (c.name && c.name.toLowerCase().includes(q)) ||
      c.email.toLowerCase().includes(q)
    );
  });

  const totalSpent = clients.reduce((sum, c) => sum + c.totalSpent, 0);
  const avgOrder =
    clients.length > 0
      ? clients.reduce((sum, c) => sum + c.orderCount, 0) / clients.length
      : 0;

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-28 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
        <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white">Clients</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez vos clients et suivez leurs achats
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Rechercher un client..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 dark:text-gray-500 focus:border-[#7126b6] focus:outline-none focus:ring-2 focus:ring-[#7126b6]/20"
            />
          </div>
          <div className="flex items-center gap-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Users className="h-4 w-4" />
            <span>{clients.length}</span>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <StatCard icon={Users} label="Total clients" value={clients.length} color="text-indigo-600" />
        <StatCard icon={DollarSign} label="Total dépensé" value={formatPrice(totalSpent)} color="text-emerald-600" />
        <StatCard icon={ShoppingCart} label="Panier moyen" value={formatPrice(avgOrder)} color="text-violet-600" />
      </div>

      <Card className="overflow-hidden">
        {filteredClients.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <Users className="h-12 w-12 text-gray-300 dark:text-gray-600" />
            <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucun client</p>
            <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
              {search
                ? "Aucun résultat pour cette recherche"
                : "Vos clients apparaîtront ici après leurs premières commandes"}
            </p>
          </div>
        ) : (
          <>
            {/* Desktop table */}
            <div className="hidden lg:block overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                    <th className="px-6 py-3">Client</th>
                    <th className="px-6 py-3">Téléphone</th>
                    <th className="px-6 py-3 text-right">Commandes</th>
                    <th className="px-6 py-3 text-right">Total dépensé</th>
                    <th className="px-6 py-3 text-right">Dernière commande</th>
                    <th className="px-6 py-3 text-right">Inscription</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {filteredClients.map((client) => {
                    const initials = getInitials(client.name, client.email);
                    const avatarColor = getAvatarColor(client.name || client.email);
                    return (
                      <tr
                        key={client.id}
                        className="transition-colors hover:bg-gray-50/50 dark:bg-gray-800/30"
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div
                              className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor}`}
                            >
                              {initials}
                            </div>
                            <div className="min-w-0">
                              <p className="truncate font-semibold text-[#0f172a] dark:text-white">
                                {client.name || "Client"}
                              </p>
                              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                                {client.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {client.phone ? (
                            <span className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                              <Phone className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                              {client.phone}
                            </span>
                          ) : (
                            <span className="text-gray-300">—</span>
                          )}
                        </td>
                        <td className="px-6 py-4 text-right font-medium text-[#0f172a] dark:text-white">
                          {client.orderCount}
                        </td>
                        <td className="px-6 py-4 text-right font-bold text-[#0f172a] dark:text-white">
                          {formatPrice(client.totalSpent)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">
                          {relativeDate(client.lastOrder)}
                        </td>
                        <td className="px-6 py-4 text-right text-gray-500 dark:text-gray-400">
                          {new Date(client.createdAt).toLocaleDateString("fr-FR", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile cards */}
            <div className="divide-y divide-gray-100 dark:divide-gray-700/50 lg:hidden">
              {filteredClients.map((client) => {
                const initials = getInitials(client.name, client.email);
                const avatarColor = getAvatarColor(client.name || client.email);
                return (
                  <div key={client.id} className="p-4">
                    <div className="flex items-start gap-3">
                      <div
                        className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${avatarColor}`}
                      >
                        {initials}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate font-semibold text-[#0f172a] dark:text-white">
                          {client.name || "Client"}
                        </p>
                        <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                          {client.email}
                        </p>
                        {client.phone && (
                          <span className="mt-1 flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                            <Phone className="h-3 w-3" />
                            {client.phone}
                          </span>
                        )}
                      </div>
                    </div>
                    <div className="mt-3 grid grid-cols-3 gap-2 text-center">
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 px-2 py-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Commandes</p>
                        <p className="text-sm font-bold text-[#0f172a] dark:text-white">{client.orderCount}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 px-2 py-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Total</p>
                        <p className="text-sm font-bold text-[#0f172a] dark:text-white">{formatPrice(client.totalSpent)}</p>
                      </div>
                      <div className="rounded-lg bg-gray-50 dark:bg-gray-700/50 px-2 py-2">
                        <p className="text-xs text-gray-500 dark:text-gray-400">Dernière cmd.</p>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">{relativeDate(client.lastOrder)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </Card>
    </div>
  );
}
