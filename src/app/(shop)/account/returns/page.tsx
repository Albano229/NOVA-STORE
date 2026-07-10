"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import { Package, Plus, X, Loader2, RotateCcw } from "lucide-react";
import toast from "react-hot-toast";

interface ReturnRequest {
  id: string;
  orderId: string;
  orderNumber: string;
  shopName: string;
  reason: string;
  description: string | null;
  status: string;
  refundAmount: number | null;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  items: { id: string; name: string; price: number; quantity: number }[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string }> = {
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-700" },
  APPROVED: { label: "Approuvée", color: "bg-blue-100 text-blue-700" },
  REJECTED: { label: "Refusée", color: "bg-red-100 text-red-700" },
  REFUNDED: { label: "Remboursée", color: "bg-green-100 text-green-700" },
};

const REASONS = [
  "Produit défectueux",
  "Produit non conforme à la description",
  "Mauvaise taille / dimensions",
  "Changement d'avis",
  "Produit endommagé à la réception",
  "Autre",
];

export default function CustomerReturnsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [returns, setReturns] = useState<ReturnRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState("");
  const [selectedItem, setSelectedItem] = useState("");
  const [reason, setReason] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/verify?redirect=/account/returns");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/returns")
        .then((res) => res.json())
        .then((data) => {
          setReturns(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const openModal = async () => {
    setShowModal(true);
    try {
      const res = await fetch("/api/orders");
      const data = await res.json();
      const delivered = (Array.isArray(data) ? data : []).filter(
        (o: Order) => o.status === "DELIVERED" || o.status === "SHIPPED"
      );
      setOrders(delivered);
    } catch {}
  };

  const handleSubmit = async () => {
    if (!selectedOrder || !reason) {
      toast.error("Veuillez remplir les champs obligatoires");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/returns", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderId: selectedOrder,
          orderItemId: selectedItem || undefined,
          reason,
          description,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        setReturns([data, ...returns]);
        setShowModal(false);
        setSelectedOrder("");
        setSelectedItem("");
        setReason("");
        setDescription("");
        toast.success("Demande de retour créée");
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSubmitting(false);
  };

  if (status === "loading" || loading) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  const selectedOrderData = orders.find((o) => o.id === selectedOrder);

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <RotateCcw className="h-7 w-7 text-[#7126b6]" />
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Mes retours</h1>
            <p className="text-sm text-gray-500">{returns.length} demande{returns.length > 1 ? "s" : ""}</p>
          </div>
        </div>
        <button
          onClick={openModal}
          className="inline-flex items-center gap-2 rounded-lg bg-[#7126b6] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#5a1d94]"
        >
          <Plus className="h-4 w-4" />
          Nouveau retour
        </button>
      </div>

      {returns.length === 0 ? (
        <div className="mt-12 rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucun retour</h3>
          <p className="mt-1 text-sm text-gray-500">Vous n'avez pas encore fait de demande de retour.</p>
        </div>
      ) : (
        <div className="mt-6 space-y-3">
          {returns.map((ret) => {
            const st = STATUS_CONFIG[ret.status] || STATUS_CONFIG.PENDING;
            return (
              <div key={ret.id} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">Commande {ret.orderNumber}</p>
                    <p className="text-xs text-gray-500">{ret.shopName}</p>
                    <p className="mt-1 text-sm text-gray-600">{ret.reason}</p>
                    {ret.description && (
                      <p className="mt-0.5 text-xs text-gray-400">{ret.description}</p>
                    )}
                  </div>
                  <div className="text-right">
                    {ret.refundAmount != null && (
                      <p className="text-sm font-bold text-gray-900">{formatPrice(ret.refundAmount)}</p>
                    )}
                    <span className={`mt-1 inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${st.color}`}>
                      {st.label}
                    </span>
                    <p className="mt-1 text-xs text-gray-400">
                      {new Date(ret.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-gray-900">Nouvelle demande de retour</h2>
              <button onClick={() => setShowModal(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Commande *</label>
                <select
                  value={selectedOrder}
                  onChange={(e) => {
                    setSelectedOrder(e.target.value);
                    setSelectedItem("");
                  }}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-2 focus:ring-[#7126b6]/20"
                >
                  <option value="">Sélectionner une commande</option>
                  {orders.map((o) => (
                    <option key={o.id} value={o.id}>
                      {o.orderNumber} — {formatPrice(o.total)}
                    </option>
                  ))}
                </select>
              </div>

              {selectedOrderData && selectedOrderData.items.length > 0 && (
                <div>
                  <label className="mb-1.5 block text-sm font-medium text-gray-700">Article (optionnel)</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-2 focus:ring-[#7126b6]/20"
                  >
                    <option value="">Toute la commande</option>
                    {selectedOrderData.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.name} × {item.quantity}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Motif *</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-2 focus:ring-[#7126b6]/20"
                >
                  <option value="">Sélectionner un motif</option>
                  {REASONS.map((r) => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Décrivez votre problème..."
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-2 focus:ring-[#7126b6]/20 resize-none"
                />
              </div>
            </div>

            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
              >
                Annuler
              </button>
              <button
                onClick={handleSubmit}
                disabled={submitting}
                className="inline-flex items-center gap-2 rounded-lg bg-[#7126b6] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#5a1d94] disabled:opacity-50"
              >
                {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
                Envoyer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
