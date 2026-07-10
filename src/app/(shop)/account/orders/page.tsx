"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Package, Eye } from "lucide-react";

interface Order {
  id: string;
  orderNumber: string;
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
  shop: { name: string };
  items: { id: string; name: string; price: number; quantity: number; image: string | null }[];
}

export default function AccountOrdersPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/orders")
        .then((res) => res.json())
        .then((data) => {
          setOrders(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  if (loading || status === "loading") {
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

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[#0f172a]">Mes commandes</h1>
      <p className="mt-1 text-sm text-gray-500">{orders.length} commande{orders.length > 1 ? "s" : ""}</p>

      {orders.length === 0 ? (
        <div className="mt-12 rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-[#0f172a]">Aucune commande</h3>
          <p className="mt-1 text-sm text-gray-500">Vous n&apos;avez pas encore passé de commande.</p>
          <Link href="/products" className="mt-4 inline-block text-[#7126b6] hover:underline">
            Explorer la boutique
          </Link>
        </div>
      ) : (
        <div className="mt-6 space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-gray-200 bg-white p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-semibold text-[#0f172a]">{order.orderNumber}</p>
                  <p className="text-xs text-gray-500">
                    {order.shop.name} • {new Date(order.createdAt).toLocaleDateString("fr-FR")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#0f172a]">{formatPrice(order.total)}</p>
                  <span className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${
                    order.status === "DELIVERED" ? "bg-green-100 text-green-700" :
                    order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                    "bg-yellow-100 text-yellow-700"
                  }`}>
                    {order.status}
                  </span>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2">
                {order.items.map((item) => (
                  <div key={item.id} className="flex items-center gap-2 rounded-lg bg-gray-50 px-2 py-1">
                    {item.image && (
                      <img src={item.image} alt="" className="h-6 w-6 rounded object-cover" />
                    )}
                    <span className="text-xs text-gray-600">
                      {item.name} ×{item.quantity}
                    </span>
                  </div>
                ))}
              </div>
              <Link
                href={`/account/orders/${order.id}`}
                className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-[#7126b6] hover:underline"
              >
                <Eye className="h-3.5 w-3.5" />
                Voir les détails
              </Link>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
