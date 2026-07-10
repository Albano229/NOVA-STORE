"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { formatPrice, getStatusColor, getStatusLabel } from "@/lib/utils";
import { ShoppingCart, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  createdAt: string;
  user: { name: string | null; email: string };
  shop: { name: string };
}

export default function ModeratorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/moderator/orders")
      .then((r) => r.json())
      .then((data) => setOrders(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = (Array.isArray(orders) ? orders : []).filter((o) =>
    o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    o.user.name?.toLowerCase().includes(search.toLowerCase()) ||
    o.user.email.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />)}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f172a]">Commandes signalées</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Analyser les commandes suspectes (lecture seule)</p>

      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <Input id="search" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Boutique</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Paiement</th>
              <th className="px-4 py-3">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {filtered.map((order) => (
              <tr key={order.id} className="hover:bg-gray-50/50 dark:bg-gray-800/30">
                <td className="px-4 py-3 font-medium text-[#0f172a]">{order.orderNumber}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{order.user.name || order.user.email}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{order.shop.name}</td>
                <td className="px-4 py-3 font-medium text-[#0f172a]">{formatPrice(order.total)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.status)}`}>{getStatusLabel(order.status)}</span></td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(order.paymentStatus)}`}>{getStatusLabel(order.paymentStatus)}</span></td>
                <td className="px-4 py-3 text-gray-500 dark:text-gray-400">{new Date(order.createdAt).toLocaleDateString("fr-FR")}</td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Aucune commande</p>}
      </div>
    </div>
  );
}
