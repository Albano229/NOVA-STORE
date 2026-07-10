"use client";

import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface Commission {
  id: string;
  amount: number;
  rate: number;
  status: string;
  createdAt: string;
  paidAt: string | null;
  order: { orderNumber: string; total: number; createdAt: string };
  shop: { name: string };
}

export default function AdminCommissionsPage() {
  const [commissions, setCommissions] = useState<Commission[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("");

  useEffect(() => {
    const url = statusFilter
      ? `/api/admin/commissions?status=${statusFilter}`
      : "/api/admin/commissions";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setCommissions(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter]);

  const markAsPaid = async (id: string) => {
    try {
      const res = await fetch(`/api/admin/commissions/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "PAID" }),
      });
      if (res.ok) {
        setCommissions((prev) =>
          prev.map((c) => (c.id === id ? { ...c, status: "PAID", paidAt: new Date().toISOString() } : c))
        );
        toast.success("Commission marquée comme payée");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  const totalPending = commissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + c.amount, 0);
  const totalPaid = commissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + c.amount, 0);

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f172a]">Commissions</h1>

      <div className="mt-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Total commissions</p>
          <p className="mt-1 text-xl font-bold text-[#0f172a]">
            {formatPrice(totalPending + totalPaid)}
          </p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">En attente</p>
          <p className="mt-1 text-xl font-bold text-orange-600">{formatPrice(totalPending)}</p>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <p className="text-sm text-gray-500 dark:text-gray-400">Payées</p>
          <p className="mt-1 text-xl font-bold text-green-600">{formatPrice(totalPaid)}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-2">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-lg border border-gray-300 px-3 py-2 text-sm"
        >
          <option value="">Tous les statuts</option>
          <option value="PENDING">En attente</option>
          <option value="PAID">Payées</option>
        </select>
      </div>

      <div className="mt-6 space-y-3">
        {commissions.map((commission) => (
          <div key={commission.id} className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div>
              <p className="text-sm font-medium text-[#0f172a]">
                {commission.shop.name} - {commission.order.orderNumber}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Commande: {formatPrice(commission.order.total)} • Taux: {commission.rate}% •{" "}
                {new Date(commission.createdAt).toLocaleDateString("fr-FR")}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-bold text-[#0f172a]">{formatPrice(commission.amount)}</p>
              <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                commission.status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"
              }`}>
                {commission.status === "PAID" ? "Payée" : "En attente"}
              </span>
              {commission.status === "PENDING" && (
                <button
                  onClick={() => markAsPaid(commission.id)}
                  className="rounded-lg bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700"
                >
                  Marquer payée
                </button>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
