"use client";

import { useEffect, useState } from "react";
import { formatPrice, getStatusColor, getStatusLabel } from "@/lib/utils";
import { DollarSign, Search } from "lucide-react";
import { Input } from "@/components/ui/input";

interface Payment {
  id: string;
  amount: number;
  currency: string;
  method: string;
  status: string;
  transactionId: string | null;
  createdAt: string;
  order: { orderNumber: string; user: { name: string | null; email: string } };
}

export default function ModeratorTransactionsPage() {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("/api/moderator/transactions")
      .then((r) => r.json())
      .then((data) => setPayments(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const filtered = (Array.isArray(payments) ? payments : []).filter((p) =>
    p.order.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
    p.order.user.email.toLowerCase().includes(search.toLowerCase()) ||
    p.method.toLowerCase().includes(search.toLowerCase())
  );

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-16 animate-pulse rounded-xl bg-gray-200" />)}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f172a]">Transactions</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Consultation seule — aucune modification possible</p>

      <div className="mt-6 relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
        <Input id="search" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
      </div>

      <div className="mt-6 overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="w-full text-left text-sm">
          <thead>
            <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
              <th className="px-4 py-3">Transaction</th>
              <th className="px-4 py-3">Commande</th>
              <th className="px-4 py-3">Client</th>
              <th className="px-4 py-3">Méthode</th>
              <th className="px-4 py-3">Montant</th>
              <th className="px-4 py-3">Statut</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
            {filtered.map((p) => (
              <tr key={p.id} className="hover:bg-gray-50/50 dark:bg-gray-800/30">
                <td className="px-4 py-3 font-mono text-xs text-gray-600 dark:text-gray-400">{p.transactionId || p.id.slice(0, 8)}</td>
                <td className="px-4 py-3 font-medium text-[#0f172a]">{p.order.orderNumber}</td>
                <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{p.order.user.name || p.order.user.email}</td>
                <td className="px-4 py-3"><span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2.5 py-0.5 text-xs font-medium text-gray-700 dark:text-gray-300">{p.method}</span></td>
                <td className="px-4 py-3 font-medium text-[#0f172a]">{formatPrice(p.amount)}</td>
                <td className="px-4 py-3"><span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(p.status)}`}>{getStatusLabel(p.status)}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Aucune transaction</p>}
      </div>
    </div>
  );
}
