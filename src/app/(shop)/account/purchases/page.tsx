"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";
import {
  Package,
  Download,
  FileText,
  ShoppingBag,
  Clock,
  CheckCircle,
  XCircle,
  Truck,
  ChevronRight,
  LogIn,
} from "lucide-react";

interface OrderItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  shop: { name: string; slug: string };
  items: OrderItem[];
}

const STATUS_CONFIG: Record<string, { label: string; color: string; icon: any }> = {
  PENDING: { label: "En attente", color: "bg-yellow-100 text-yellow-700", icon: Clock },
  CONFIRMED: { label: "Confirmée", color: "bg-blue-100 text-blue-700", icon: CheckCircle },
  SHIPPED: { label: "Expédiée", color: "bg-indigo-100 text-indigo-700", icon: Truck },
  DELIVERED: { label: "Livrée", color: "bg-green-100 text-green-700", icon: CheckCircle },
  CANCELLED: { label: "Annulée", color: "bg-red-100 text-red-700", icon: XCircle },
};

export default function PurchasesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "pending" | "delivered">("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/verify?redirect=/account/purchases");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/orders")
        .then((res) => res.json())
        .then((data) => {
          setOrders(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const filteredOrders = orders.filter((o) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return ["PENDING", "CONFIRMED", "SHIPPED"].includes(o.status);
    if (activeTab === "delivered") return o.status === "DELIVERED";
    return true;
  });

  const digitalItems = orders
    .filter((o) => o.status === "DELIVERED")
    .flatMap((o) => o.items.filter((i) => i.productId))
    .slice(0, 10);

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

  if (!session) return null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center gap-3">
        <ShoppingBag className="h-7 w-7 text-[#7126b6]" />
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mes achats</h1>
          <p className="text-sm text-gray-500">{session.user?.email}</p>
        </div>
      </div>

      <div className="mt-6 flex gap-2 overflow-x-auto border-b border-gray-200 pb-px">
        {[
          { key: "all", label: "Toutes", count: orders.length },
          { key: "pending", label: "En cours", count: orders.filter((o) => ["PENDING", "CONFIRMED", "SHIPPED"].includes(o.status)).length },
          { key: "delivered", label: "Livrées", count: orders.filter((o) => o.status === "DELIVERED").length },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`whitespace-nowrap border-b-2 px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "border-[#7126b6] text-[#7126b6]"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label} ({tab.count})
          </button>
        ))}
      </div>

      {filteredOrders.length === 0 ? (
        <div className="mt-12 rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-gray-900">Aucune commande</h3>
          <p className="mt-1 text-sm text-gray-500">
            {activeTab === "all"
              ? "Vous n'avez pas encore passé de commande."
              : "Aucune commande dans cette catégorie."}
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block text-[#7126b6] hover:underline"
          >
            Explorer la boutique
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {filteredOrders.map((order) => {
            const statusInfo = STATUS_CONFIG[order.status] || STATUS_CONFIG.PENDING;
            const StatusIcon = statusInfo.icon;

            return (
              <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-4 sm:p-5">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{order.orderNumber}</p>
                    <p className="mt-0.5 text-xs text-gray-500">
                      {order.shop.name} &middot; {new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-bold text-gray-900">{formatPrice(order.total)}</p>
                    <span className={`mt-1 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${statusInfo.color}`}>
                      <StatusIcon className="h-3 w-3" />
                      {statusInfo.label}
                    </span>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap gap-2">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2.5 py-1.5">
                      {item.image && (
                        <img src={item.image} alt="" className="h-6 w-6 rounded object-cover" />
                      )}
                      <span className="text-xs text-gray-600">
                        {item.name} &times;{item.quantity}
                      </span>
                    </div>
                  ))}
                </div>

                {order.status === "DELIVERED" && (
                  <div className="mt-3 flex gap-2 border-t border-gray-100 pt-3">
                    <button className="inline-flex items-center gap-1.5 rounded-lg bg-[#7126b6]/10 px-3 py-1.5 text-xs font-medium text-[#7126b6] hover:bg-[#7126b6]/20">
                      <Download className="h-3.5 w-3.5" />
                      Télécharger
                    </button>
                    <Link
                      href={`/account/orders/${order.id}/invoice`}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
                    >
                      <FileText className="h-3.5 w-3.5" />
                      Facture
                    </Link>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {digitalItems.length > 0 && (
        <div className="mt-10">
          <h2 className="text-lg font-bold text-gray-900">Produits digitaux</h2>
          <p className="mt-1 text-sm text-gray-500">Articles numériques disponibles au téléchargement</p>
          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {digitalItems.map((item) => (
              <div key={item.id} className="flex items-center gap-3 rounded-xl border border-gray-200 bg-white p-4">
                {item.image && (
                  <img src={item.image} alt="" className="h-12 w-12 rounded-lg object-cover" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-500">{formatPrice(item.price)}</p>
                </div>
                <button
                  onClick={() => window.location.href = `/api/download?productId=${item.productId}`}
                  className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#7126b6]/10 text-[#7126b6] hover:bg-[#7126b6]/20"
                >
                  <Download className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
