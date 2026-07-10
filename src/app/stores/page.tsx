"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Store,
  Plus,
  ArrowRight,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import toast from "react-hot-toast";

interface ShopData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  isActive: boolean;
}

const placeholderColors = [
  "bg-[#7126b6]", "bg-purple-500", "bg-emerald-500", "bg-amber-500",
  "bg-rose-500", "bg-cyan-500", "bg-teal-500", "bg-pink-500",
];

function getPlaceholderColor(name: string) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash);
  return placeholderColors[Math.abs(hash) % placeholderColors.length];
}

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function StoresHubPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [shops, setShops] = useState<ShopData[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [archivedOpen, setArchivedOpen] = useState(false);

  const role = session?.user?.role;
  const isAdmin = role === "OWNER" || role === "ADMIN" || role === "MODERATOR";

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/vendor/shops")
        .then((res) => res.json())
        .then((data) => {
          const shopList = Array.isArray(data) ? data : [];
          setShops(shopList);

          if (role === "VENDOR" && shopList.length === 0) {
            router.push("/stores/create");
          }
        })
        .catch(() => {})
        .finally(() => setLoading(false));
    }
  }, [status, role, router]);

  const handleDelete = async (shopId: string) => {
    try {
      const res = await fetch(`/api/vendor/shops/${shopId}`, { method: "DELETE" });
      if (res.ok) {
        setShops((prev) => prev.filter((s) => s.id !== shopId));
        setDeleteConfirm(null);
        toast.success("Boutique supprimée");
      } else {
        const data = await res.json();
        toast.error(data.error || "Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  if (loading || status === "loading") {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[#7126b6]" />
      </div>
    );
  }

  if (!session) return null;

  const firstName = (session.user?.name || "Utilisateur").split(" ")[0].toUpperCase();

  const activeShops = shops.filter((s) => s.isActive);
  const archivedShops = shops.filter((s) => !s.isActive);

  if (isAdmin) {
    return (
      <div className="space-y-8">
        <div>
          <p className="text-base text-gray-500 dark:text-gray-400">
            {getGreeting()}, {firstName} ! 👋
          </p>
          <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-4xl">
              Vos boutiques
            </h1>
            <Link
              href="/stores/create"
              className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#7126b6] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#5e1f99] hover:shadow-md"
            >
              <Plus className="h-4 w-4" />
              Créer une boutique
            </Link>
          </div>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Sélectionnez une boutique pour continuer
          </p>
        </div>

        {activeShops.length > 0 && (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {activeShops.map((shop) => (
              <Link
                key={shop.id}
                href={`/stores/${shop.id}/dashboard`}
                className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
              >
                <div className="flex items-center gap-3">
                  {shop.logo ? (
                    <img src={shop.logo} alt={shop.name} className="h-12 w-12 rounded-xl object-cover" />
                  ) : (
                    <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white ${getPlaceholderColor(shop.name)}`}>
                      {shop.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{shop.name}</h3>
                    <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">nova-store-{shop.slug}</p>
                  </div>
                </div>
                <div className="mt-4 flex items-center justify-between">
                  <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">Active</span>
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-all group-hover:bg-[#7126b6] group-hover:text-white">
                    <ArrowRight className="h-3.5 w-3.5" />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

        {archivedShops.length > 0 && (
          <div>
            <button
              onClick={() => setArchivedOpen(!archivedOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
            >
              Boutiques archivées
              {archivedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
            {archivedOpen && (
              <div className="mt-3 columns-1 gap-4 sm:columns-2 lg:columns-3">
                {archivedShops.map((shop) => (
                  <Link
                    key={shop.id}
                    href={`/stores/${shop.id}/dashboard`}
                    className="group mb-4 block break-inside-avoid rounded-2xl border border-gray-100 bg-gray-50 p-6 opacity-60 transition-all hover:opacity-100 dark:border-gray-700 dark:bg-gray-800/50"
                  >
                    <div className="flex items-center gap-3">
                      {shop.logo ? (
                        <img src={shop.logo} alt={shop.name} className="h-10 w-10 rounded-xl object-cover" />
                      ) : (
                        <div className={`flex h-10 w-10 items-center justify-center rounded-xl text-sm font-bold text-white ${getPlaceholderColor(shop.name)}`}>
                          {shop.name.charAt(0).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0 flex-1">
                        <h3 className="truncate text-sm font-semibold text-gray-700 dark:text-gray-300">{shop.name}</h3>
                        <p className="truncate text-xs text-gray-400 dark:text-gray-500">nova-store-{shop.slug}</p>
                      </div>
                      <ArrowRight className="h-4 w-4 text-gray-300" />
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {shops.length === 0 && (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 py-16 text-center dark:border-gray-600 dark:bg-gray-800/50">
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700">
              <Store className="h-8 w-8 text-gray-400 dark:text-gray-500" />
            </div>
            <h2 className="mt-5 text-lg font-semibold text-gray-900 dark:text-gray-100">Aucune boutique</h2>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Créez votre première boutique pour commencer à vendre
            </p>
            <Link
              href="/stores/create"
              className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#7126b6] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5e1f99]"
            >
              <Plus className="h-4 w-4" />
              Créer ma boutique
            </Link>
          </div>
        )}

        {deleteConfirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
              <h2 className="text-center text-lg font-semibold text-gray-900 dark:text-gray-100">Supprimer cette boutique ?</h2>
              <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">Cette action est irréversible.</p>
              <div className="mt-6 flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                  Annuler
                </button>
                <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700">
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div>
        <p className="text-base text-gray-500 dark:text-gray-400">
          {getGreeting()}, {firstName} ! 👋
        </p>
        <div className="mt-2 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h1 className="text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-4xl">
            Vos boutiques
          </h1>
          <Link
            href="/stores/create"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-[#7126b6] px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-[#5e1f99] hover:shadow-md"
          >
            <Plus className="h-4 w-4" />
            Créer une boutique
          </Link>
        </div>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Sélectionnez une boutique pour continuer
        </p>
      </div>

      {activeShops.length > 0 && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {activeShops.map((shop) => (
            <Link
              key={shop.id}
              href={`/stores/${shop.id}/dashboard`}
              className="group rounded-2xl border border-gray-200 bg-white p-5 transition-all hover:border-gray-300 hover:shadow-lg dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
            >
              <div className="flex items-center gap-3">
                {shop.logo ? (
                  <img src={shop.logo} alt={shop.name} className="h-12 w-12 rounded-xl object-cover" />
                ) : (
                  <div className={`flex h-12 w-12 items-center justify-center rounded-xl text-lg font-bold text-white ${getPlaceholderColor(shop.name)}`}>
                    {shop.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-gray-100">{shop.name}</h3>
                  <p className="mt-0.5 truncate text-xs text-gray-400 dark:text-gray-500">nova-store-{shop.slug}</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">Active</span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 text-gray-400 transition-all group-hover:bg-[#7126b6] group-hover:text-white dark:bg-gray-700 dark:text-gray-500">
                  <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      {archivedShops.length > 0 && (
        <div>
          <button
            onClick={() => setArchivedOpen(!archivedOpen)}
            className="flex items-center gap-2 text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Boutiques archivées
            {archivedOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
          {archivedOpen && (
            <div className="mt-3 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {archivedShops.map((shop) => (
                <Link
                  key={shop.id}
                  href={`/stores/${shop.id}/dashboard`}
                  className="group flex items-center gap-4 rounded-2xl border border-gray-100 bg-gray-50 p-4 opacity-60 transition-all hover:opacity-100 dark:border-gray-700 dark:bg-gray-800/50 md:p-5"
                >
                  {shop.logo ? (
                    <img src={shop.logo} alt={shop.name} className="h-10 w-10 rounded-xl object-cover" />
                  ) : (
                    <div className={`flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-xl text-sm font-bold text-white ${getPlaceholderColor(shop.name)}`}>
                      {shop.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <h3 className="truncate text-sm font-semibold text-gray-700 dark:text-gray-300">{shop.name}</h3>
                    <p className="truncate text-xs text-gray-400 dark:text-gray-500">nova-store-{shop.slug}</p>
                  </div>
                  <ArrowRight className="h-4 w-4 text-gray-300 dark:text-gray-600" />
                </Link>
              ))}
            </div>
          )}
        </div>
      )}

      {shops.length === 0 && (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 py-16 text-center dark:border-gray-600 dark:bg-gray-800/50">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-700">
            <Store className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h2 className="mt-5 text-lg font-semibold text-gray-900 dark:text-gray-100">Aucune boutique</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            Créez votre première boutique pour commencer à vendre
          </p>
          <Link
            href="/stores/create"
            className="mt-6 inline-flex items-center justify-center gap-2 rounded-xl bg-[#7126b6] px-5 py-3 text-sm font-semibold text-white hover:bg-[#5e1f99]"
          >
            <Plus className="h-4 w-4" />
            Créer ma boutique
          </Link>
        </div>
      )}

      {deleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-gray-800">
            <h2 className="text-center text-lg font-semibold text-gray-900 dark:text-gray-100">Supprimer cette boutique ?</h2>
            <p className="mt-2 text-center text-sm text-gray-500 dark:text-gray-400">Cette action est irréversible.</p>
            <div className="mt-6 flex gap-3">
              <button onClick={() => setDeleteConfirm(null)} className="flex-1 rounded-xl border border-gray-300 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-700">
                Annuler
              </button>
              <button onClick={() => handleDelete(deleteConfirm)} className="flex-1 rounded-xl bg-red-600 py-2.5 text-sm font-medium text-white hover:bg-red-700">
                Supprimer
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
