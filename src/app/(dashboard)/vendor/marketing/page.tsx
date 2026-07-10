"use client";

import { useSession } from "next-auth/react";
import { useEffect, useState, useCallback } from "react";
import {
  Zap,
  Plus,
  Clock,
  Package,
  X,
  Timer,
  Trash2,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";

interface FlashSaleProduct {
  id: string;
  name: string;
  price: number;
  images: { url: string }[];
}

interface FlashSale {
  id: string;
  title: string;
  salePrice: number;
  originalPrice: number;
  stock: number;
  soldCount: number;
  startsAt: string;
  endsAt: string;
  isActive: boolean;
  product: FlashSaleProduct;
  createdAt: string;
}

interface Product {
  id: string;
  name: string;
  price: number;
}

function getTimeRemaining(endDate: string) {
  const total = new Date(endDate).getTime() - Date.now();
  if (total <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  const days = Math.floor(total / (1000 * 60 * 60 * 24));
  const hours = Math.floor((total / (1000 * 60 * 60)) % 24);
  const minutes = Math.floor((total / (1000 * 60)) % 60);
  const seconds = Math.floor((total / 1000) % 60);
  return { days, hours, minutes, seconds, expired: false };
}

function CountdownTimer({ endDate }: { endDate: string }) {
  const [time, setTime] = useState(getTimeRemaining(endDate));

  useEffect(() => {
    const interval = setInterval(() => {
      setTime(getTimeRemaining(endDate));
    }, 1000);
    return () => clearInterval(interval);
  }, [endDate]);

  if (time.expired) {
    return <span className="text-sm font-medium text-red-500">Terminée</span>;
  }

  return (
    <div className="flex items-center gap-1 text-sm">
      <Timer className="h-4 w-4 text-orange-500" />
      <span className="font-mono font-medium text-orange-600">
        {time.days > 0 && `${time.days}j `}
        {String(time.hours).padStart(2, "0")}:
        {String(time.minutes).padStart(2, "0")}:
        {String(time.seconds).padStart(2, "0")}
      </span>
    </div>
  );
}

export default function MarketingPage() {
  const { data: session } = useSession();
  const [flashSales, setFlashSales] = useState<FlashSale[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    title: "",
    productId: "",
    salePrice: "",
    stock: "",
    startsAt: "",
    endsAt: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [salesRes, productsRes] = await Promise.all([
        fetch("/api/vendor/flash-sales"),
        fetch("/api/vendor/products"),
      ]);
      if (salesRes.ok) {
        const data = await salesRes.json();
        setFlashSales(Array.isArray(data) ? data : []);
      }
      if (productsRes.ok) {
        const data = await productsRes.json();
        setProducts(Array.isArray(data) ? data.map((p: any) => ({ id: p.id, name: p.name, price: p.price })) : []);
      }
    } catch {
      toast.error("Erreur lors du chargement des données");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.title || !form.productId || !form.salePrice || !form.startsAt || !form.endsAt) {
      toast.error("Veuillez remplir tous les champs obligatoires");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/vendor/flash-sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: form.title,
          productId: form.productId,
          salePrice: parseFloat(form.salePrice),
          stock: form.stock ? parseInt(form.stock) : undefined,
          startsAt: form.startsAt,
          endsAt: form.endsAt,
        }),
      });
      if (res.ok) {
        toast.success("Offre flash créée !");
        setShowForm(false);
        setForm({ title: "", productId: "", salePrice: "", stock: "", startsAt: "", endsAt: "" });
        fetchData();
      } else {
        const err = await res.json();
        toast.error(err.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur lors de la création");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Supprimer cette offre flash ?")) return;
    try {
      const res = await fetch(`/api/vendor/flash-sales/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Offre flash supprimée");
        setFlashSales((prev) => prev.filter((s) => s.id !== id));
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const activeSales = flashSales.filter((s) => new Date(s.endsAt) > new Date() && s.isActive);
  const pastSales = flashSales.filter((s) => new Date(s.endsAt) <= new Date() || !s.isActive);

  const selectedProduct = products.find((p) => p.id === form.productId);

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-48 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Offres flash</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Créez des promotions temporaires pour booster vos ventes
          </p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white shadow-sm dark:shadow-gray-800/20 hover:bg-indigo-700 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Créer une offre flash
        </button>
      </div>

      {/* Create Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100">Créer une offre flash</h2>
              <button onClick={() => setShowForm(false)} className="rounded-lg p-1 hover:bg-gray-100 dark:hover:bg-gray-700">
                <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Titre *</label>
                <input
                  type="text"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  placeholder="Ex: Soldes d'été"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Produit *</label>
                <select
                  value={form.productId}
                  onChange={(e) => setForm({ ...form, productId: e.target.value })}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  required
                >
                  <option value="">Sélectionner un produit</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} — {formatPrice(p.price)}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Prix promotion *</label>
                  <input
                    type="number"
                    min={1}
                    value={form.salePrice}
                    onChange={(e) => setForm({ ...form, salePrice: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Prix en FCFA"
                    required
                  />
                  {selectedProduct && form.salePrice && selectedProduct.price > 0 && (
                    <p className="mt-1 text-xs text-green-600">
                      Réduction: {Math.round(((selectedProduct.price - parseFloat(form.salePrice)) / selectedProduct.price) * 100)}%
                    </p>
                  )}
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Stock</label>
                  <input
                    type="number"
                    min={0}
                    value={form.stock}
                    onChange={(e) => setForm({ ...form, stock: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    placeholder="Stock (optionnel)"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de début *</label>
                  <input
                    type="datetime-local"
                    value={form.startsAt}
                    onChange={(e) => setForm({ ...form, startsAt: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Date de fin *</label>
                  <input
                    type="datetime-local"
                    value={form.endsAt}
                    onChange={(e) => setForm({ ...form, endsAt: e.target.value })}
                    className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                    required
                  />
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="flex-1 rounded-lg border border-gray-300 bg-white py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 rounded-lg bg-indigo-600 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 transition-colors"
                >
                  {submitting ? "Création..." : "Créer l'offre"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Active Flash Sales */}
      <div>
        <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
          <Zap className="h-5 w-5 text-orange-500" />
          Offres actives ({activeSales.length})
        </h2>
        {activeSales.length === 0 ? (
          <div className="mt-4 rounded-xl border border-dashed border-gray-300 bg-white dark:bg-gray-800 p-12 text-center">
            <Zap className="mx-auto h-12 w-12 text-gray-300" />
            <p className="mt-4 text-sm text-gray-500 dark:text-gray-400">Aucune offre flash active</p>
            <button
              onClick={() => setShowForm(true)}
              className="mt-4 inline-flex items-center gap-2 rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
            >
              <Plus className="h-4 w-4" />
              Créer votre première offre
            </button>
          </div>
        ) : (
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeSales.map((sale) => {
              const discount = sale.originalPrice > 0
                ? Math.round(((sale.originalPrice - sale.salePrice) / sale.originalPrice) * 100)
                : 0;
              return (
                <div
                  key={sale.id}
                  className="relative overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-gray-800/20"
                >
                  <div className="absolute top-0 right-0 rounded-bl-xl bg-orange-500 px-3 py-1">
                    <span className="text-xs font-bold text-white">-{discount}%</span>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                      {sale.product.images[0] ? (
                        <img src={sale.product.images[0].url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-6 w-6 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-sm font-bold text-gray-900 dark:text-gray-100 truncate">{sale.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{sale.product.name}</p>
                    </div>
                  </div>
                  <div className="mt-3 flex items-baseline gap-2">
                    <span className="text-lg font-bold text-indigo-600">{formatPrice(sale.salePrice)}</span>
                    <span className="text-xs text-gray-400 dark:text-gray-500 line-through">{formatPrice(sale.originalPrice)}</span>
                  </div>
                  <div className="mt-2 flex items-center gap-2">
                    <Clock className="h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(sale.startsAt).toLocaleDateString("fr-FR")} — {new Date(sale.endsAt).toLocaleDateString("fr-FR")}
                    </span>
                  </div>
                  <div className="mt-2">
                    <CountdownTimer endDate={sale.endsAt} />
                  </div>
                  <div className="mt-2 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span>Stock: {sale.stock}</span>
                    <span>Vendus: {sale.soldCount}</span>
                  </div>
                  <button
                    onClick={() => handleDelete(sale.id)}
                    className="mt-3 flex items-center gap-1.5 text-xs text-red-500 hover:text-red-700 transition-colors"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                    Supprimer
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Past / Inactive Flash Sales */}
      {pastSales.length > 0 && (
        <div>
          <h2 className="flex items-center gap-2 text-lg font-semibold text-gray-900 dark:text-gray-100">
            <Clock className="h-5 w-5 text-gray-400 dark:text-gray-500" />
            Offres passées ({pastSales.length})
          </h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {pastSales.map((sale) => {
              const discount = sale.originalPrice > 0
                ? Math.round(((sale.originalPrice - sale.salePrice) / sale.originalPrice) * 100)
                : 0;
              return (
                <div
                  key={sale.id}
                  className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-5 opacity-70"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">{sale.title}</h3>
                      <p className="text-xs text-gray-500 dark:text-gray-400">{sale.product.name}</p>
                    </div>
                    <span className="rounded-full bg-gray-200 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                      -{discount}%
                    </span>
                  </div>
                  <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
                    {new Date(sale.startsAt).toLocaleDateString("fr-FR")} — {new Date(sale.endsAt).toLocaleDateString("fr-FR")}
                  </p>
                  <span className="mt-2 inline-block text-xs font-medium text-red-500">Terminée</span>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
