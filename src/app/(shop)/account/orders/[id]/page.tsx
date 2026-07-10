"use client";

import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice, getStatusColor, getStatusLabel } from "@/lib/utils";
import Link from "next/link";
import {
  ArrowLeft, Package, Truck, CreditCard, MapPin,
  Clock, CheckCircle2, XCircle, PackageCheck,
} from "lucide-react";

interface OrderItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  price: number;
  quantity: number;
  image: string | null;
}

interface OrderPayment {
  id: string;
  method: string;
  status: string;
  amount: number;
  transactionId: string | null;
  createdAt: string;
}

interface Order {
  id: string;
  orderNumber: string;
  subtotal: number;
  shippingFee: number;
  tax: number;
  discount: number;
  total: number;
  status: string;
  paymentMethod: string;
  paymentStatus: string;
  trackingNumber: string | null;
  notes: string | null;
  shippingAddress: string | null;
  createdAt: string;
  updatedAt: string;
  shop: { id: string; name: string; slug: string };
  items: OrderItem[];
  payment: OrderPayment | null;
}

const STATUS_TIMELINE = ["PENDING", "CONFIRMED", "SHIPPED", "DELIVERED"];

const STATUS_ICONS: Record<string, typeof Package> = {
  PENDING: Clock,
  CONFIRMED: CheckCircle2,
  SHIPPED: Truck,
  DELIVERED: PackageCheck,
  CANCELLED: XCircle,
};

export default function OrderDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const orderId = params.id as string;

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated" && orderId) {
      fetch(`/api/orders/${orderId}`)
        .then((res) => {
          if (!res.ok) throw new Error("Commande non trouvée");
          return res.json();
        })
        .then((data) => {
          setOrder(data);
          setLoading(false);
        })
        .catch((err) => {
          setError(err.message);
          setLoading(false);
        });
    }
  }, [status, router, orderId]);

  if (loading || status === "loading") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
          <div className="h-64 animate-pulse rounded-xl bg-gray-200" />
          <div className="h-48 animate-pulse rounded-xl bg-gray-200" />
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-[#0f172a]">
            {error || "Commande non trouvée"}
          </h3>
          <Link
            href="/account/orders"
            className="mt-4 inline-block text-sm text-[#7126b6] hover:underline"
          >
            Retour aux commandes
          </Link>
        </div>
      </div>
    );
  }

  const currentStepIndex = STATUS_TIMELINE.indexOf(order.status);
  const isCancelled = order.status === "CANCELLED";

  const shippingAddr = order.shippingAddress
    ? (() => {
        try {
          return JSON.parse(order.shippingAddress);
        } catch {
          return null;
        }
      })()
    : null;

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <Link
        href="/account/orders"
        className="mb-6 inline-flex items-center gap-2 text-sm text-gray-500 hover:text-[#7126b6] transition-colors"
      >
        <ArrowLeft className="h-4 w-4" />
        Retour aux commandes
      </Link>

      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">
            Commande {order.orderNumber}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Passée le{" "}
            {new Date(order.createdAt).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </p>
        </div>
        <span
          className={`inline-block rounded-full px-3 py-1 text-sm font-medium ${getStatusColor(order.status)}`}
        >
          {getStatusLabel(order.status)}
        </span>
      </div>

      {/* Timeline */}
      {order.status !== "CANCELLED" && (
        <div className="mt-8 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-bold text-[#0f172a]">Suivi de commande</h2>
          <div className="mt-4 flex items-center justify-between">
            {STATUS_TIMELINE.map((step, i) => {
              const Icon = STATUS_ICONS[step] || Package;
              const isCompleted = i <= currentStepIndex;
              const isCurrent = i === currentStepIndex;
              return (
                <div key={step} className="flex flex-1 items-center">
                  <div className="flex flex-col items-center">
                    <div
                      className={`flex h-10 w-10 items-center justify-center rounded-full transition-all ${
                        isCompleted
                          ? "bg-[#7126b6] text-white"
                          : "bg-gray-100 text-gray-400"
                      } ${isCurrent ? "ring-4 ring-purple-100" : ""}`}
                    >
                      <Icon className="h-5 w-5" />
                    </div>
                    <span
                      className={`mt-2 text-xs font-medium ${
                        isCompleted ? "text-[#7126b6]" : "text-gray-400"
                      }`}
                    >
                      {getStatusLabel(step)}
                    </span>
                  </div>
                  {i < STATUS_TIMELINE.length - 1 && (
                    <div
                      className={`mx-2 h-0.5 flex-1 ${
                        i < currentStepIndex ? "bg-[#7126b6]" : "bg-gray-200"
                      }`}
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
        <h2 className="text-sm font-bold text-[#0f172a]">
          Articles ({order.items.length})
        </h2>
        <div className="mt-4 divide-y divide-gray-100">
          {order.items.map((item) => (
            <div key={item.id} className="flex items-center gap-4 py-4 first:pt-0 last:pb-0">
              <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100">
                {item.image ? (
                  <img
                    src={item.image}
                    alt={item.name}
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Package className="h-6 w-6 text-gray-300" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[#0f172a] truncate">
                  {item.name}
                </p>
                <p className="text-xs text-gray-500">
                  Qty: {item.quantity}
                </p>
              </div>
              <p className="text-sm font-semibold text-[#0f172a]">
                {formatPrice(item.price * item.quantity)}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Order summary + Info grid */}
      <div className="mt-6 grid gap-6 sm:grid-cols-2">
        {/* Summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-bold text-[#0f172a]">Récapitulatif</h2>
          <div className="mt-4 space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Sous-total</span>
              <span className="text-[#0f172a]">{formatPrice(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Livraison</span>
              <span className="text-[#0f172a]">{formatPrice(order.shippingFee)}</span>
            </div>
            {order.tax > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">TVA</span>
                <span className="text-[#0f172a]">{formatPrice(order.tax)}</span>
              </div>
            )}
            {order.discount > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Réduction</span>
                <span className="text-green-600">-{formatPrice(order.discount)}</span>
              </div>
            )}
            <div className="border-t border-gray-100 pt-3">
              <div className="flex justify-between">
                <span className="text-sm font-bold text-[#0f172a]">Total</span>
                <span className="text-lg font-bold text-[#0f172a]">
                  {formatPrice(order.total)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Info */}
        <div className="space-y-6">
          {/* Payment */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <div className="flex items-center gap-2">
              <CreditCard className="h-4 w-4 text-gray-400" />
              <h2 className="text-sm font-bold text-[#0f172a]">Paiement</h2>
            </div>
            <div className="mt-3 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Méthode</span>
                <span className="text-[#0f172a]">{order.paymentMethod}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-500">Statut</span>
                <span
                  className={`inline-block rounded-full px-2 py-0.5 text-xs font-medium ${getStatusColor(order.paymentStatus)}`}
                >
                  {getStatusLabel(order.paymentStatus)}
                </span>
              </div>
              {order.payment?.transactionId && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Transaction</span>
                  <span className="text-[#0f172a] font-mono text-xs">
                    {order.payment.transactionId}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Shipping address */}
          {shippingAddr && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <MapPin className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-bold text-[#0f172a]">
                  Adresse de livraison
                </h2>
              </div>
              <div className="mt-3 text-sm text-gray-600 space-y-1">
                {shippingAddr.fullName && <p className="font-medium text-[#0f172a]">{shippingAddr.fullName}</p>}
                {shippingAddr.phone && <p>{shippingAddr.phone}</p>}
                {shippingAddr.address && <p>{shippingAddr.address}</p>}
                {shippingAddr.city && <p>{shippingAddr.city}{shippingAddr.postalCode ? ` ${shippingAddr.postalCode}` : ""}</p>}
                {shippingAddr.country && <p>{shippingAddr.country}</p>}
              </div>
            </div>
          )}

          {/* Tracking */}
          {order.trackingNumber && (
            <div className="rounded-xl border border-gray-200 bg-white p-6">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-gray-400" />
                <h2 className="text-sm font-bold text-[#0f172a]">Suivi</h2>
              </div>
              <p className="mt-3 font-mono text-sm text-[#7126b6]">
                {order.trackingNumber}
              </p>
            </div>
          )}

          {/* Shop */}
          <div className="rounded-xl border border-gray-200 bg-white p-6">
            <h2 className="text-sm font-bold text-[#0f172a]">Vendeur</h2>
            <Link
              href={`/shops/${order.shop.slug}`}
              className="mt-2 inline-block text-sm font-medium text-[#7126b6] hover:underline"
            >
              {order.shop.name}
            </Link>
          </div>
        </div>
      </div>

      {/* Notes */}
      {order.notes && (
        <div className="mt-6 rounded-xl border border-gray-200 bg-white p-6">
          <h2 className="text-sm font-bold text-[#0f172a]">Notes</h2>
          <p className="mt-2 text-sm text-gray-600">{order.notes}</p>
        </div>
      )}
    </div>
  );
}
