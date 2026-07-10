import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatPrice(price: number, currencyCode?: string): string {
  if (currencyCode) {
    try {
      return new Intl.NumberFormat("fr-SN", {
        style: "currency",
        currency: currencyCode,
        minimumFractionDigits: currencyCode === "XOF" || currencyCode === "XAF" ? 0 : 2,
        maximumFractionDigits: currencyCode === "XOF" || currencyCode === "XAF" ? 0 : 2,
      }).format(price);
    } catch {
      return `${price.toLocaleString("fr-SN")} ${currencyCode}`;
    }
  }
  return new Intl.NumberFormat("fr-SN", {
    style: "currency",
    currency: "XOF",
  }).format(price);
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

export function generateOrderNumber(): string {
  const date = new Date();
  const prefix = "NV";
  const year = date.getFullYear().toString().slice(-2);
  const month = (date.getMonth() + 1).toString().padStart(2, "0");
  const random = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `${prefix}${year}${month}-${random}`;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    PENDING: "bg-yellow-100 text-yellow-800",
    CONFIRMED: "bg-blue-100 text-blue-800",
    SHIPPED: "bg-purple-100 text-purple-800",
    DELIVERED: "bg-green-100 text-green-800",
    CANCELLED: "bg-red-100 text-red-800",
    REFUNDED: "bg-orange-100 text-orange-800",
    COMPLETED: "bg-green-100 text-green-800",
    FAILED: "bg-red-100 text-red-800",
    PAID: "bg-green-100 text-green-800",
  };
  return colors[status] || "bg-gray-100 text-gray-800";
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    PENDING: "En attente",
    CONFIRMED: "Confirmée",
    SHIPPED: "Expédiée",
    DELIVERED: "Livrée",
    CANCELLED: "Annulée",
    REFUNDED: "Remboursée",
    COMPLETED: "Terminé",
    FAILED: "Échoué",
    PAID: "Payée",
  };
  return labels[status] || status;
}
