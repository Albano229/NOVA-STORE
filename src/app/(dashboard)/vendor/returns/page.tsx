"use client";

import { useEffect, useState, useMemo } from "react";
import { formatPrice, cn } from "@/lib/utils";
import { RotateCcw, CheckCircle, XCircle, DollarSign, Loader2 } from "lucide-react";
import toast from "react-hot-toast";

interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  userId: string;
  userName: string;
  userEmail: string;
  shopName: string;
  reason: string;
  description: string | null;
  status: string;
  refundAmount: number | null;
  refundMethod: string | null;
  adminNotes: string | null;
  createdAt: string;
}

type StatusFilter = "all" | "PENDING" | "APPROVED" | "REJECTED" | "REFUNDED";

const filterTabs: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "APPROVED", label: "Approuvées" },
  { value: "REJECTED", label: "Refusées" },
  { value: "REFUNDED", label: "Remboursées" },
];

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Approuvée", color: "bg-blue-100 text-blue-700" },
  REJECTED: { label: "Refusée", color: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Remboursée", color: "bg-green-100 text-green-700" },
};

export default function VendorReturnsPage() {
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchReturns();
  }, []);

  const fetchReturns = () => {
    fetch("/api/returns")
      .then((res) => res.json())
      .then((data) => {
        setReturns(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  };

  const filtered = useMemo(() => {
    if (statusFilter === "all") return returns;
    return returns.filter((r) => r.status === statusFilter);
  }, [returns, statusFilter]);

  const handleAction = async (id: string, newStatus: string, refundMethod?: string) => {
    setActionLoading(id);
    try {
      const res = await fetch(`/api/returns/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus, refundMethod }),
      });
      if (res.ok) {
        const updated = await res.json();
        setReturns(returns.map((r) => (r.id === id ? { ...r, ...updated } : r)));
        toast.success(`Retour ${newStatus === "APPROVED" ? "approuvé" : newStatus === "REJECTED" ? "refusé" : "remboursé"}`);
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setActionLoading(null);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Demandes de retour</h1>
        <p className="mt-1 text-sm text-gray-500">
          {filtered.length} demande{filtered.length > 1 ? "s" : ""}
        </p>
      </div>

      <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-gray-200 bg-white p-1">
        {filterTabs.map((tab) => (
          <button
            key={tab.value}
            onClick={() => setStatusFilter(tab.value)}
            className={cn(
              "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
              statusFilter === tab.value
                ? "bg-[#0f172a] text-white"
                : "text-gray-600 hover:bg-gray-100"
            )}
          >
            {tab.label}
            <span
              className={cn(
                "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                statusFilter === tab.value
                  ? "bg-white/20 text-white"
                  : "bg-gray-100 text-gray-500"
              )}
            >
              {tab.value === "all" ? returns.length : returns.filter((r) => r.status === tab.value).length}
            </span>
          </button>
        ))}
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <RotateCcw className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-[#0f172a]">Aucune demande</h3>
          <p className="mt-1 text-sm text-gray-500">Aucune demande de retour pour le moment.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((ret) => {
            const st = STATUS_CONFIG[ret.status] || STATUS_CONFIG.PENDING;
            const isActionLoading = actionLoading === ret.id;
            return (
              <div key={ret.id} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-bold text-[#0f172a]">{ret.orderNumber}</p>
                      <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </div>
                    <p className="mt-1 text-sm text-gray-600">{ret.userName} ({ret.userEmail})</p>
                    <p className="mt-0.5 text-sm font-medium text-gray-700">{ret.reason}</p>
                    {ret.description && (
                      <p className="mt-0.5 text-xs text-gray-400">{ret.description}</p>
                    )}
                    <div className="mt-2 flex items-center gap-4 text-xs text-gray-400">
                      <span>{new Date(ret.createdAt).toLocaleDateString("fr-FR")}</span>
                      {ret.refundAmount != null && (
                        <span className="font-semibold text-[#0f172a]">
                          Remboursement: {formatPrice(ret.refundAmount)}
                        </span>
                      )}
                    </div>
                  </div>

                  {ret.status === "PENDING" && (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleAction(ret.id, "APPROVED")}
                        disabled={isActionLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-3 py-1.5 text-xs font-medium text-green-700 hover:bg-green-100 disabled:opacity-50"
                      >
                        {isActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        Approuver
                      </button>
                      <button
                        onClick={() => handleAction(ret.id, "REJECTED")}
                        disabled={isActionLoading}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3 py-1.5 text-xs font-medium text-red-700 hover:bg-red-100 disabled:opacity-50"
                      >
                        <XCircle className="h-3.5 w-3.5" />
                        Refuser
                      </button>
                    </div>
                  )}

                  {ret.status === "APPROVED" && (
                    <button
                      onClick={() => handleAction(ret.id, "REFUNDED", "original")}
                      disabled={isActionLoading}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#7126b6]/10 px-3 py-1.5 text-xs font-medium text-[#7126b6] hover:bg-[#7126b6]/20 disabled:opacity-50 shrink-0"
                    >
                      {isActionLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <DollarSign className="h-3.5 w-3.5" />}
                      Rembourser
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
