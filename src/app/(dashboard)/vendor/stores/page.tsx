"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  Plus,
  ExternalLink,
  Settings,
  MoreVertical,
  Trash2,
  Package,
  ShoppingCart,
  DollarSign,
  X,
} from "lucide-react";
import toast from "react-hot-toast";
import { formatPrice } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

interface ShopData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  isActive: boolean;
  _count: { products: number };
  ordersCount: number;
  revenue: number;
}

interface CreateShopForm {
  name: string;
  description: string;
  phone: string;
  email: string;
  address: string;
  city: string;
}

const emptyForm: CreateShopForm = {
  name: "",
  description: "",
  phone: "",
  email: "",
  address: "",
  city: "",
};

const placeholderColors = [
  "bg-indigo-500",
  "bg-purple-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-cyan-500",
  "bg-teal-500",
  "bg-pink-500",
];

function getPlaceholderColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return placeholderColors[Math.abs(hash) % placeholderColors.length];
}

export default function VendorStoresPage() {
  const [shops, setShops] = useState<ShopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createForm, setCreateForm] = useState<CreateShopForm>(emptyForm);
  const [creating, setCreating] = useState(false);
  const [menuOpen, setMenuOpen] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  const fetchShops = () => {
    fetch("/api/vendor/shops")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) setShops(data);
        setLoading(false);
      })
      .catch(() => {
        setLoading(false);
        toast.error("Erreur lors du chargement des boutiques");
      });
  };

  useEffect(() => {
    fetchShops();
  }, []);

  const handleCreate = async () => {
    if (!createForm.name.trim()) {
      toast.error("Le nom de la boutique est requis");
      return;
    }
    setCreating(true);
    try {
      const res = await fetch("/api/vendor/shops", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(createForm),
      });
      if (res.ok) {
        const newShop = await res.json();
        setShops((prev) => [newShop, ...prev]);
        setCreateModalOpen(false);
        setCreateForm(emptyForm);
        toast.success("Boutique créée avec succès");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la création");
      }
    } catch {
      toast.error("Erreur lors de la création de la boutique");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (shopId: string) => {
    try {
      const res = await fetch(`/api/vendor/shops/${shopId}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setShops((prev) => prev.filter((s) => s.id !== shopId));
        setDeleteConfirm(null);
        setMenuOpen(null);
        toast.success("Boutique supprimée");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleSetDefault = async (shopId: string) => {
    try {
      const res = await fetch("/api/vendor/shops/default", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopId }),
      });
      if (res.ok) {
        localStorage.setItem("nova_active_shop_id", shopId);
        toast.success("Boutique par défaut mise à jour");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
            <div className="mt-2 h-4 w-64 animate-pulse rounded bg-gray-200" />
          </div>
          <div className="h-10 w-44 animate-pulse rounded-lg bg-gray-200" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-52 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Mes boutiques</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez toutes vos boutiques au même endroit
          </p>
        </div>
        {shops.length > 0 && (
          <Button onClick={() => window.location.href = "/stores/create"}>
            <Plus className="mr-2 h-4 w-4" />
            Nouvelle boutique
          </Button>
        )}
      </div>

      {shops.length === 0 ? (
        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
            <Store className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="mt-4 text-lg font-semibold text-gray-900 dark:text-gray-100">Aucune boutique</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Créez votre première boutique pour commencer à vendre
          </p>
          <Button className="mt-6" onClick={() => window.location.href = "/stores/create"}>
            <Plus className="mr-2 h-4 w-4" />
            Créer ma boutique
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {shops.map((shop) => {
            const activeShopId =
              typeof window !== "undefined"
                ? localStorage.getItem("nova_active_shop_id")
                : null;
            const isActiveShop = activeShopId === shop.id;

            return (
              <div
                key={shop.id}
                className="group relative rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-gray-800/20 transition-shadow hover:shadow-md"
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {shop.logo ? (
                      <img
                        src={shop.logo}
                        alt={shop.name}
                        className="h-12 w-12 rounded-xl object-cover"
                      />
                    ) : (
                      <div
                        className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white ${getPlaceholderColor(
                          shop.name
                        )}`}
                      >
                        {shop.name.charAt(0).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">
                        {shop.name}
                      </h3>
                      <p className="truncate text-xs text-gray-400 dark:text-gray-500">nova-store-{shop.slug}</p>
                    </div>
                  </div>

                  <div className="relative">
                    <button
                      onClick={() => setMenuOpen(menuOpen === shop.id ? null : shop.id)}
                      className="rounded-lg p-1 text-gray-400 transition-opacity hover:bg-gray-100 dark:text-gray-500 dark:hover:bg-gray-700 hover:text-gray-600 dark:hover:text-gray-400"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    {menuOpen === shop.id && (
                      <div className="absolute right-0 top-full z-10 mt-1 w-48 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 shadow-lg">
                        <Link
                          href="/vendor/settings"
                          onClick={() => setMenuOpen(null)}
                          className="flex items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Settings className="h-4 w-4" />
                          Modifier
                        </Link>
                        <button
                          onClick={() => handleSetDefault(shop.id)}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        >
                          <Store className="h-4 w-4" />
                          Définir par défaut
                        </button>
                        <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                        <button
                          onClick={() => {
                            setDeleteConfirm(shop.id);
                            setMenuOpen(null);
                          }}
                          className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                          Supprimer
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div className="mt-4">
                  <span
                    className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      shop.isActive
                        ? "bg-green-100 text-green-700"
                        : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                    }`}
                  >
                    {shop.isActive ? "Active" : "Inactive"}
                  </span>
                </div>

                <div className="mt-4 flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                  <div className="flex items-center gap-1">
                    <Package className="h-3.5 w-3.5" />
                    <span>{shop._count.products}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <ShoppingCart className="h-3.5 w-3.5" />
                    <span>{shop.ordersCount}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <DollarSign className="h-3.5 w-3.5" />
                    <span>{formatPrice(shop.revenue)}</span>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <a
                    href={`/shops/${shop.slug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <ExternalLink className="h-4 w-4" />
                    Visiter
                  </a>
                  <Link
                    href="/vendor/settings"
                    className="inline-flex flex-1 items-center justify-center gap-2 rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
                  >
                    <Settings className="h-4 w-4" />
                    Modifier
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Nouvelle boutique</h2>
              <button
                onClick={() => {
                  setCreateModalOpen(false);
                  setCreateForm(emptyForm);
                }}
                className="rounded-lg p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="mt-6 space-y-4">
              <Input
                label="Nom de la boutique"
                placeholder="Ma super boutique"
                value={createForm.name}
                onChange={(e) => setCreateForm({ ...createForm, name: e.target.value })}
              />
              <Textarea
                label="Description"
                placeholder="Décrivez votre boutique..."
                value={createForm.description}
                onChange={(e) =>
                  setCreateForm({ ...createForm, description: e.target.value })
                }
              />
              <div className="grid gap-4 sm:grid-cols-2">
                <Input
                  label="Téléphone"
                  placeholder="+221 77 123 45 67"
                  value={createForm.phone}
                  onChange={(e) => setCreateForm({ ...createForm, phone: e.target.value })}
                />
                <Input
                  label="Email"
                  type="email"
                  placeholder="contact@boutique.com"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                />
              </div>
              <Input
                label="Adresse"
                placeholder="123 Rue Principale"
                value={createForm.address}
                onChange={(e) => setCreateForm({ ...createForm, address: e.target.value })}
              />
              <Input
                label="Ville"
                placeholder="Dakar"
                value={createForm.city}
                onChange={(e) => setCreateForm({ ...createForm, city: e.target.value })}
              />
            </div>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => {
                  setCreateModalOpen(false);
                  setCreateForm(emptyForm);
                }}
              >
                Annuler
              </Button>
              <Button className="flex-1" onClick={handleCreate} disabled={creating}>
                {creating ? "Création..." : "Créer la boutique"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-xl">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 mx-auto">
              <Trash2 className="h-6 w-6 text-red-600" />
            </div>
            <h2 className="mt-4 text-center text-lg font-semibold text-gray-900 dark:text-gray-100">
              Supprimer cette boutique ?
            </h2>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">
              Cette action est irréversible. Tous les produits et commandes associés seront
              supprimés.
            </p>
            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() => setDeleteConfirm(null)}
              >
                Annuler
              </Button>
              <Button
                variant="destructive"
                className="flex-1"
                onClick={() => handleDelete(deleteConfirm)}
              >
                Supprimer
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
