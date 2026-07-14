"use client";

import { useEffect, useState, useMemo, useCallback } from "react";
import Link from "next/link";
import { formatPrice, cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ProductActionMenu } from "@/components/vendor/product-action-menu";
import { useWorkspace } from "@/contexts/workspace-context";
import {
  Plus,
  Search,
  Package,
  FileUp,
  ExternalLink,
  FileDown,
  SlidersHorizontal,
} from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  productType: string;
  price: number;
  stock: number;
  isActive: boolean;
  isFeatured: boolean;
  soldCount: number;
  createdAt: string;
  images: { url: string }[];
  categoryName?: string | null;
  category?: { name: string } | null;
  digitalFile?: { fileName: string } | null;
}

type FilterType = "all" | "PHYSICAL" | "DIGITAL" | "BOOKING";

const filterOptions: { value: FilterType; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "PHYSICAL", label: "Physiques" },
  { value: "DIGITAL", label: "Digitaux" },
  { value: "BOOKING", label: "Réservations" },
];

const statusFilters = [
  { value: "all", label: "Tout" },
  { value: "draft", label: "Brouillon" },
  { value: "published", label: "Publié" },
] as const;

function timeAgo(dateStr: string): string {
  const now = new Date();
  const date = new Date(dateStr);
  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  const weeks = Math.floor(days / 7);
  if (weeks < 4) return `il y a ${weeks}sem`;
  const months = Math.floor(days / 30);
  return `il y a ${months}mois`;
}

const typeIcons: Record<string, string> = {
  PHYSICAL: "📦",
  DIGITAL: "💿",
  SERVICE: "🛠️",
};

export default function VendorProductsPage() {
  const { currentShop, setCurrentShop, setShops, setHasShop } = useWorkspace();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "draft" | "published">("all");

  useEffect(() => {
    if (currentShop) return;
    fetch("/api/vendor/shop")
      .then((res) => res.ok ? res.json() : null)
      .then((data) => {
        if (data && data.id) {
          const shop = { id: data.id, name: data.name, slug: data.slug };
          setCurrentShop(shop);
          setShops([shop]);
          setHasShop(true);
        }
      })
      .catch(() => {});
  }, [currentShop, setCurrentShop, setShops, setHasShop]);

  const handleDelete = useCallback((productId: string) => {
    setProducts((prev) => prev.filter((p) => p.id !== productId));
  }, []);

  const handleToggleActive = useCallback((productId: string, newActive: boolean) => {
    setProducts((prev) => prev.map((p) => (p.id === productId ? { ...p, isActive: newActive } : p)));
  }, []);

  const fetchProducts = useCallback(() => {
    const params = new URLSearchParams();
    if (currentShop?.id) params.set("shopId", currentShop.id);
    fetch(`/api/vendor/products?${params.toString()}`)
      .then((res) => res.json())
      .then((data) => {
        setProducts(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [currentShop?.id]);

  useEffect(() => { fetchProducts(); }, [fetchProducts]);

  const filtered = useMemo(() => {
    if (!Array.isArray(products)) return [];
    return products.filter((p) => {
      const matchType = filter === "all" || p.productType === filter;
      const matchStatus =
        statusFilter === "all" ||
        (statusFilter === "published" && p.isActive) ||
        (statusFilter === "draft" && !p.isActive);
      const matchSearch =
        !search ||
        p.name.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.name?.toLowerCase().includes(search.toLowerCase());
      return matchType && matchStatus && matchSearch;
    });
  }, [products, filter, statusFilter, search]);

  return (
    <div className="space-y-4 p-4 sm:p-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white sm:text-2xl">Produits</h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {filtered.length} produit{filtered.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          {currentShop && (
            <a
              href={`/shops/${currentShop.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
            >
              <ExternalLink className="h-4 w-4" />
              Boutique
            </a>
          )}
          <Link
            href="/vendor/products/import-export"
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <FileDown className="h-4 w-4" />
            Import / Export
          </Link>
          <Link href="/vendor/products/new">
            <Button className="rounded-xl bg-[#7126b6] hover:bg-[#5a1f94]">
              <Plus className="mr-1 h-4 w-4" />
              Ajouter un produit
            </Button>
          </Link>
        </div>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Rechercher un produit..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full rounded-xl border border-gray-200 bg-white py-3 pl-10 pr-4 text-sm transition-colors placeholder:text-gray-400 focus:border-[#7126b6] focus:outline-none focus:ring-2 focus:ring-[#7126b6]/20 dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:placeholder:text-gray-500"
        />
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-600 dark:bg-gray-800">
          {filterOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setFilter(opt.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                filter === opt.value
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1 rounded-xl border border-gray-200 bg-white p-1 dark:border-gray-600 dark:bg-gray-800">
          {statusFilters.map((opt) => (
            <button
              key={opt.value}
              onClick={() => setStatusFilter(opt.value)}
              className={cn(
                "rounded-lg px-3 py-1.5 text-xs font-medium transition-colors",
                statusFilter === opt.value
                  ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                  : "text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700"
              )}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Product List */}
      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
              <div className="h-14 w-14 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />
              <div className="flex-1 space-y-2">
                <div className="h-4 w-1/2 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                <div className="h-3 w-1/4 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
              </div>
              <div className="h-8 w-8 animate-pulse rounded-lg bg-gray-200 dark:bg-gray-700" />
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-12 text-center dark:border-gray-600 dark:bg-gray-800">
          <Package className="mx-auto h-12 w-12 text-gray-300 dark:text-gray-600" />
          <h3 className="mt-4 text-base font-medium text-gray-900 dark:text-white">Aucun produit</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Commencez par ajouter votre premier produit.</p>
          <Link href="/vendor/products/new" className="mt-4 inline-block">
            <Button className="bg-[#7126b6] hover:bg-[#5a1f94]">
              <Plus className="mr-1 h-4 w-4" />
              Ajouter un produit
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-2">
          {/* Header row - desktop only */}
          <div className="hidden items-center rounded-xl bg-gray-50 px-4 py-2.5 text-xs font-medium uppercase tracking-wider text-gray-500 dark:bg-gray-800/50 dark:text-gray-400 sm:flex">
            <div className="flex flex-1 items-center gap-3">
              <div className="w-14" />
              <div className="flex-1">Produit</div>
            </div>
            <div className="hidden w-20 text-center md:block">Type</div>
            <div className="w-24 text-right">Prix</div>
            <div className="hidden w-16 text-center sm:block">Stock</div>
            <div className="hidden w-20 text-center lg:block">Statut</div>
            <div className="w-10" />
          </div>

          {/* Product rows */}
          {filtered.map((product) => (
            <div
              key={product.id}
              className="group flex items-center gap-3 rounded-2xl border border-gray-100 bg-white p-3 transition-all hover:border-gray-200 hover:shadow-sm sm:gap-4 sm:p-4 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-gray-600"
            >
              {/* Image */}
              <div className="h-14 w-14 flex-shrink-0 overflow-hidden rounded-xl bg-gray-100 sm:h-16 sm:w-16 dark:bg-gray-700">
                {product.images[0] ? (
                  <img
                    src={product.images[0].url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-gray-400">
                    {product.productType === "DIGITAL" ? (
                      <FileUp className="h-6 w-6" />
                    ) : (
                      <Package className="h-6 w-6" />
                    )}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="truncate text-sm font-semibold text-gray-900 dark:text-white sm:text-base">
                    {product.name}
                  </h3>
                  {product.isFeatured && (
                    <span className="hidden rounded-full bg-yellow-100 px-1.5 py-0.5 text-[10px] font-medium text-yellow-700 sm:inline dark:bg-yellow-900/30 dark:text-yellow-400">
                      ⭐ Vedette
                    </span>
                  )}
                </div>
                <div className="mt-0.5 flex items-center gap-2">
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {product.categoryName || product.category?.name || "Sans catégorie"}
                  </span>
                  <span className="text-gray-300 dark:text-gray-600">·</span>
                  <span className="text-xs" title={product.productType}>
                    {typeIcons[product.productType] || "📦"}
                  </span>
                </div>
                {/* Mobile: price + stock inline */}
                <div className="mt-1 flex items-center gap-3 sm:hidden">
                  <span className="text-sm font-bold text-[#7126b6]">
                    {formatPrice(product.price)}
                  </span>
                  {product.productType === "PHYSICAL" && (
                    <span className={cn(
                      "rounded-full px-2 py-0.5 text-[10px] font-medium",
                      product.stock > 10 ? "bg-green-100 text-green-700" :
                      product.stock >= 5 ? "bg-yellow-100 text-yellow-700" :
                      "bg-red-100 text-red-700"
                    )}>
                      Stock: {product.stock}
                    </span>
                  )}
                  <span className={cn(
                    "rounded-full px-2 py-0.5 text-[10px] font-medium",
                    product.isActive
                      ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                      : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                  )}>
                    {product.isActive ? "Publié" : "Brouillon"}
                  </span>
                </div>
              </div>

              {/* Type badge - desktop */}
              <div className="hidden w-20 text-center md:block">
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  product.productType === "PHYSICAL" ? "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" :
                  product.productType === "DIGITAL" ? "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" :
                  "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400"
                )}>
                  {product.productType === "PHYSICAL" ? "Physique" : product.productType === "DIGITAL" ? "Digital" : "Service"}
                </span>
              </div>

              {/* Price - desktop */}
              <div className="hidden w-24 text-right sm:block">
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {formatPrice(product.price)}
                </span>
              </div>

              {/* Stock - desktop */}
              <div className="hidden w-16 text-center sm:block">
                {product.productType === "PHYSICAL" ? (
                  <span className={cn(
                    "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                    product.stock > 10 ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" :
                    product.stock >= 5 ? "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400" :
                    "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400"
                  )}>
                    {product.stock}
                  </span>
                ) : (
                  <span className="text-xs text-gray-400">—</span>
                )}
              </div>

              {/* Status - desktop */}
              <div className="hidden w-20 text-center lg:block">
                <span className={cn(
                  "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
                  product.isActive
                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                    : "bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                )}>
                  {product.isActive ? "Publié" : "Brouillon"}
                </span>
              </div>

              {/* Actions - 3 dot menu */}
              <div className="flex-shrink-0">
                <ProductActionMenu
                  product={product}
                  shopSlug={currentShop?.slug || ""}
                  onToggleActive={handleToggleActive}
                  onDelete={handleDelete}
                />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
