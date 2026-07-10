"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { formatPrice, cn } from "@/lib/utils";
import { DataTable, type Column } from "@/components/ui/data-table";
import { Search, ShoppingCart, Eye } from "lucide-react";
import toast from "react-hot-toast";

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  user: { name: string | null; email: string };
  items: { id: string; name: string; price: number; quantity: number }[];
}

type StatusFilter =
  | "all"
  | "PENDING"
  | "CONFIRMED"
  | "SHIPPED"
  | "DELIVERED"
  | "CANCELLED";

const filterTabs: { value: StatusFilter; label: string }[] = [
  { value: "all", label: "Toutes" },
  { value: "PENDING", label: "En attente" },
  { value: "CONFIRMED", label: "Payées" },
  { value: "SHIPPED", label: "Expédiées" },
  { value: "DELIVERED", label: "Livrées" },
  { value: "CANCELLED", label: "Annulées" },
];

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes} min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days} jour${days > 1 ? "s" : ""}`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `il y a ${weeks} sem`;
  const months = Math.floor(days / 30);
  if (months < 12) return `il y a ${months} mois`;
  const years = Math.floor(days / 365);
  return `il y a ${years} an${years > 1 ? "s" : ""}`;
}

function PaymentBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    PAID: "bg-green-100 text-green-700",
    PENDING: "bg-yellow-100 text-yellow-700",
    FAILED: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    PAID: "Payé",
    PENDING: "En attente",
    FAILED: "Échoué",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status] || "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
      )}
    >
      {labels[status] || status}
    </span>
  );
}

function DeliveryBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    DELIVERED: "bg-green-100 text-green-700",
    SHIPPED: "bg-blue-100 text-blue-700",
    PENDING: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
    CONFIRMED: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400",
    CANCELLED: "bg-red-100 text-red-700",
  };
  const labels: Record<string, string> = {
    DELIVERED: "Livré",
    SHIPPED: "En cours",
    PENDING: "En attente",
    CONFIRMED: "En attente",
    CANCELLED: "Annulé",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        styles[status] || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"
      )}
    >
      {labels[status] || status}
    </span>
  );
}

export default function VendorOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");

  const fetchOrders = useCallback(() => {
    const url =
      statusFilter !== "all"
        ? `/api/vendor/orders?status=${statusFilter}`
        : "/api/vendor/orders";
    fetch(url)
      .then((res) => res.json())
      .then((data) => {
        setOrders(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [statusFilter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(
      (o) =>
        o.orderNumber.toLowerCase().includes(q) ||
        o.user.name?.toLowerCase().includes(q) ||
        o.user.email.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const tabCounts = useMemo(() => {
    const counts: Record<string, number> = { all: orders.length };
    for (const o of orders) {
      counts[o.status] = (counts[o.status] || 0) + 1;
    }
    return counts;
  }, [orders]);

  const columns: Column<Order>[] = [
    {
      key: "orderNumber",
      header: "#",
      render: (order) => (
        <span className="font-medium text-[#0f172a]">
          {order.orderNumber}
        </span>
      ),
    },
    {
      key: "client",
      header: "Client",
      render: (order) => (
        <div className="min-w-0">
          <p className="truncate font-medium text-[#0f172a]">
            {order.user.name || "Client"}
          </p>
          <p className="truncate text-xs text-gray-500 dark:text-gray-400">{order.user.email}</p>
        </div>
      ),
    },
    {
      key: "items",
      header: "Produits",
      render: (order) => {
        const count = order.items.reduce((sum, i) => sum + i.quantity, 0);
        return (
          <div className="min-w-0">
            <span className="font-medium text-[#0f172a]">
              {count} produit{count > 1 ? "s" : ""}
            </span>
            {order.items[0] && (
              <p className="truncate text-xs text-gray-500 dark:text-gray-400">
                {order.items[0].name}
                {order.items.length > 1 && ` +${order.items.length - 1}`}
              </p>
            )}
          </div>
        );
      },
    },
    {
      key: "total",
      header: "Montant",
      className: "whitespace-nowrap",
      render: (order) => (
        <span className="font-bold text-[#0f172a]">
          {formatPrice(order.total)}
        </span>
      ),
    },
    {
      key: "paymentStatus",
      header: "Paiement",
      render: (order) => <PaymentBadge status={order.paymentStatus} />,
    },
    {
      key: "status",
      header: "Livraison",
      render: (order) => <DeliveryBadge status={order.status} />,
    },
    {
      key: "createdAt",
      header: "Date",
      className: "whitespace-nowrap text-gray-500 dark:text-gray-400",
      render: (order) => (
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {timeAgo(order.createdAt)}
        </span>
      ),
    },
    {
      key: "actions",
      header: "",
      className: "w-12",
      render: (order) => (
        <Link
          href={`/vendor/orders/${order.id}`}
          className="inline-flex rounded-lg p-2 text-gray-400 dark:text-gray-500 transition-colors hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#0f172a]"
        >
          <Eye className="h-4 w-4" />
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a] dark:text-white">Commandes</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} commande{filtered.length > 1 ? "s" : ""}
          </p>
        </div>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <input
            type="text"
            placeholder="Rechercher une commande..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-gray-300 bg-white dark:bg-gray-800 py-2.5 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
          />
        </div>

        <div className="flex items-center gap-1 overflow-x-auto rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1">
          {filterTabs.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setStatusFilter(tab.value)}
              className={cn(
                "flex items-center gap-1.5 whitespace-nowrap rounded-md px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === tab.value
                  ? "bg-[#0f172a] text-white"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              )}
            >
              {tab.label}
              <span
                className={cn(
                  "rounded-full px-1.5 py-0.5 text-[10px] font-bold leading-none",
                  statusFilter === tab.value
                    ? "bg-white/20 text-white"
                    : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                )}
              >
                {tabCounts[tab.value] || 0}
              </span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="flex flex-col items-center justify-center rounded-2xl border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
          <ShoppingCart className="h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-base font-medium text-[#0f172a] dark:text-white">Aucune commande</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Aucune commande n&apos;a été trouvée.</p>
        </div>
      ) : (
        <>
          {/* Desktop: table via DataTable columns definition */}
          <div className="hidden lg:block">
            <DataTable
              columns={columns}
              data={filtered}
              keyExtractor={(o) => o.id}
            />
          </div>

          {/* Mobile: cards */}
          <div className="space-y-3 lg:hidden">
            {filtered.map((order) => (
              <Link
                key={order.id}
                href={`/vendor/orders/${order.id}`}
                className="block rounded-xl border border-gray-100 bg-white p-4 transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-bold text-[#0f172a] dark:text-white">{order.orderNumber}</span>
                      <PaymentBadge status={order.paymentStatus} />
                      <DeliveryBadge status={order.status} />
                    </div>
                    <p className="mt-1 truncate text-sm text-gray-600 dark:text-gray-400">
                      {order.user.name || "Client"} — {order.user.email}
                    </p>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {order.items.slice(0, 2).map((item) => (
                        <span key={item.id} className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-600 dark:bg-gray-700 dark:text-gray-300">
                          {item.name} ×{item.quantity}
                        </span>
                      ))}
                      {order.items.length > 2 && (
                        <span className="rounded-md bg-gray-100 px-2 py-0.5 text-xs text-gray-500 dark:bg-gray-700 dark:text-gray-400">
                          +{order.items.length - 2}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-[#0f172a] dark:text-white">{formatPrice(order.total)}</p>
                    <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">{timeAgo(order.createdAt)}</p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
