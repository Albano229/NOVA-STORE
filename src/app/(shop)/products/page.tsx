"use client";

import { Suspense, useState, useEffect, useCallback } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import { Store, Search, Star, SlidersHorizontal, X, ChevronDown, ChevronUp, ArrowUpDown, Grid3X3, LayoutList, Scale } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { useCompareStore } from "@/stores/compare";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: { url: string }[];
  shop: { id: string; name: string; slug: string; logo: string | null };
  category: { name: string; slug: string } | null;
  avgRating: number;
  reviewCount: number;
  soldCount: number;
  variantCount: number;
  minVariantPrice: number | null;
  maxVariantPrice: number | null;
}

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
}

const SORT_OPTIONS = [
  { value: "newest", label: "Plus récents" },
  { value: "popular", label: "Populaires" },
  { value: "rating", label: "Mieux notés" },
  { value: "price_asc", label: "Prix croissant" },
  { value: "price_desc", label: "Prix décroissant" },
];

const PRICE_PRESETS = [
  { label: "< 5 000", min: 0, max: 5000 },
  { label: "5 000 - 20 000", min: 5000, max: 20000 },
  { label: "20 000 - 50 000", min: 20000, max: 50000 },
  { label: "50 000 - 100 000", min: 50000, max: 100000 },
  { label: "> 100 000", min: 100000, max: 999999999 },
];

function ProductsContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const typeFromUrl = searchParams.get("type") || "";
  const { recentlyViewed, clearRecent } = useRecentlyViewed();
  const { addProduct: addToCompare, isInCompare, removeProduct: removeFromCompare } = useCompareStore();

  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const [search, setSearch] = useState(searchParams.get("search") || "");
  const [category, setCategory] = useState(searchParams.get("category") || "");
  const [type] = useState(typeFromUrl);
  const [sort, setSort] = useState(searchParams.get("sort") || "newest");
  const [minPrice, setMinPrice] = useState(searchParams.get("minPrice") || "");
  const [maxPrice, setMaxPrice] = useState(searchParams.get("maxPrice") || "");
  const [minRating, setMinRating] = useState(parseInt(searchParams.get("minRating") || "0"));

  const [showFilters, setShowFilters] = useState(false);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(Array.isArray(data) ? data : []))
      .catch(() => {});
  }, []);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category) params.set("category", category);
    if (type) params.set("type", type);
    if (sort) params.set("sort", sort);
    if (minPrice) params.set("minPrice", minPrice);
    if (maxPrice) params.set("maxPrice", maxPrice);
    params.set("page", String(page));
    params.set("limit", "24");

    try {
      const r = await fetch(`/api/products?${params}`);
      const data = await r.json();
      let items = Array.isArray(data?.products) ? data.products : Array.isArray(data) ? data : [];
      if (minRating > 0) {
        items = items.filter((p: Product) => p.avgRating >= minRating);
      }
      setProducts(items);
      setTotal(data?.pagination?.total || items.length);
      setTotalPages(data?.pagination?.pages || 1);
    } catch {
      setProducts([]);
    } finally {
      setLoading(false);
    }
  }, [search, category, type, sort, minPrice, maxPrice, minRating, page]);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  useEffect(() => {
    setPage(1);
  }, [search, category, sort, minPrice, maxPrice, minRating]);

  const clearFilters = () => {
    setSearch("");
    setCategory("");
    setSort("newest");
    setMinPrice("");
    setMaxPrice("");
    setMinRating(0);
    setPage(1);
  };

  const hasActiveFilters = search || category || sort !== "newest" || minPrice || maxPrice || minRating > 0;

  const activeFilters: { label: string; onRemove: () => void }[] = [];
  if (search) activeFilters.push({ label: `"${search}"`, onRemove: () => setSearch("") });
  if (category) {
    const cat = categories.find((c) => c.slug === category);
    activeFilters.push({ label: cat?.name || category, onRemove: () => setCategory("") });
  }
  if (sort !== "newest") activeFilters.push({ label: SORT_OPTIONS.find((s) => s.value === sort)?.label || sort, onRemove: () => setSort("newest") });
  if (minPrice) activeFilters.push({ label: `Min ${formatPrice(Number(minPrice))}`, onRemove: () => setMinPrice("") });
  if (maxPrice) activeFilters.push({ label: `Max ${formatPrice(Number(maxPrice))}`, onRemove: () => setMaxPrice("") });
  if (minRating > 0) activeFilters.push({ label: `${minRating}★+`, onRemove: () => setMinRating(0) });

  const title = typeFromUrl
    ? { physical: "Produits Physiques", digital: "Produits Digitaux", service: "Services" }[typeFromUrl] || "Produits"
    : search
    ? `Résultats pour "${search}"`
    : "Tous les produits";

  const FilterPanel = ({ className = "" }: { className?: string }) => (
    <div className={`space-y-5 ${className}`}>
      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Catégorie</h4>
        <div className="space-y-1">
          <button
            onClick={() => setCategory("")}
            className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${!category ? "bg-purple-50 text-[#7126b6] font-medium" : "text-gray-600 hover:bg-gray-50"}`}
          >
            Toutes
          </button>
          {categories.map((cat) => (
            <button
              key={cat.slug}
              onClick={() => setCategory(category === cat.slug ? "" : cat.slug)}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${category === cat.slug ? "bg-purple-50 text-[#7126b6] font-medium" : "text-gray-600 hover:bg-gray-50"}`}
            >
              {cat.icon && <span className="mr-1.5">{cat.icon}</span>}
              {cat.name}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Prix</h4>
        <div className="flex gap-2 mb-2">
          <input
            type="number"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            placeholder="Min"
            className="w-1/2 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none"
          />
          <input
            type="number"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            placeholder="Max"
            className="w-1/2 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none"
          />
        </div>
        <div className="flex flex-wrap gap-1.5">
          {PRICE_PRESETS.map((preset) => (
            <button
              key={preset.label}
              onClick={() => {
                if (minPrice === String(preset.min) && maxPrice === String(preset.max)) {
                  setMinPrice("");
                  setMaxPrice("");
                } else {
                  setMinPrice(String(preset.min));
                  setMaxPrice(String(preset.max));
                }
              }}
              className={`rounded-full border px-2.5 py-1 text-xs transition ${
                minPrice === String(preset.min) && maxPrice === String(preset.max)
                  ? "border-[#7126b6] bg-purple-50 text-[#7126b6]"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Note minimale</h4>
        <div className="flex gap-1.5">
          {[0, 3, 3.5, 4, 4.5].map((rating) => (
            <button
              key={rating}
              onClick={() => setMinRating(minRating === rating ? 0 : rating)}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs transition ${
                minRating === rating
                  ? "border-yellow-400 bg-yellow-50 text-yellow-700"
                  : "border-gray-200 text-gray-500 hover:border-gray-300"
              }`}
            >
              {rating === 0 ? (
                "Toutes"
              ) : (
                <>
                  {rating}
                  <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                  +
                </>
              )}
            </button>
          ))}
        </div>
      </div>

      <div>
        <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">Type</h4>
        <div className="space-y-1">
          {[
            { value: "", label: "Tous" },
            { value: "physical", label: "Physique" },
            { value: "digital", label: "Digital" },
            { value: "service", label: "Service" },
            { value: "bundle", label: "Pack" },
            { value: "subscription", label: "Abonnement" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => {
                const params = new URLSearchParams(window.location.search);
                if (opt.value) params.set("type", opt.value);
                else params.delete("type");
                router.push(`/products?${params.toString()}`);
              }}
              className={`w-full text-left rounded-lg px-3 py-2 text-sm transition ${
                type === opt.value || (!type && !opt.value)
                  ? "bg-purple-50 text-[#7126b6] font-medium"
                  : "text-gray-600 hover:bg-gray-50"
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a] sm:text-3xl">{title}</h1>
        <p className="mt-1 text-sm text-gray-500">{total} produit{total > 1 ? "s" : ""}</p>
      </div>

      {/* Search + Sort bar */}
      <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && fetchProducts()}
            placeholder="Rechercher un produit, une marque..."
            className="w-full rounded-xl border border-gray-200 bg-white pl-10 pr-4 py-2.5 text-sm focus:border-[#7126b6] focus:ring-1 focus:ring-[#7126b6] focus:outline-none dark:border-gray-700 dark:bg-gray-800"
          />
          {search && (
            <button onClick={() => setSearch("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="lg:hidden flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
          >
            <SlidersHorizontal className="h-4 w-4" />
            Filtres
            {hasActiveFilters && (
              <span className="flex h-5 w-5 items-center justify-center rounded-full bg-[#7126b6] text-[10px] text-white">
                {activeFilters.length}
              </span>
            )}
          </button>

          <div className="relative">
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value)}
              className="appearance-none rounded-xl border border-gray-200 bg-white px-4 py-2.5 pr-9 text-sm text-gray-700 focus:border-[#7126b6] focus:outline-none dark:border-gray-700 dark:bg-gray-800"
            >
              {SORT_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>{opt.label}</option>
              ))}
            </select>
            <ArrowUpDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-gray-400" />
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      {activeFilters.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {activeFilters.map((f, i) => (
            <span key={i} className="inline-flex items-center gap-1 rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-[#7126b6]">
              {f.label}
              <button onClick={f.onRemove} className="ml-0.5 hover:text-[#5e1f9a]">
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
          <button onClick={clearFilters} className="text-xs text-gray-500 hover:text-gray-700 underline">
            Tout effacer
          </button>
        </div>
      )}

      {/* Desktop layout: sidebar + grid */}
      <div className="mt-6 flex gap-6">
        {/* Desktop sidebar */}
        <aside className="hidden lg:block w-64 flex-shrink-0">
          <div className="sticky top-24 rounded-2xl border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-semibold text-[#0f172a]">Filtres</h3>
              {hasActiveFilters && (
                <button onClick={clearFilters} className="text-xs text-[#7126b6] hover:underline">
                  Réinitialiser
                </button>
              )}
            </div>
            <FilterPanel />
          </div>
        </aside>

        {/* Product grid */}
        <div className="flex-1 min-w-0">
          {loading ? (
            <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-800">
                  <div className="aspect-square bg-gray-200 dark:bg-gray-700" />
                  <div className="p-3 space-y-2">
                    <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4" />
                    <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2" />
                    <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-1/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : products.length === 0 ? (
            <div className="rounded-2xl border border-gray-200 bg-white py-16 text-center dark:border-gray-700 dark:bg-gray-800">
              <Store className="mx-auto h-14 w-14 text-gray-300" />
              <p className="mt-4 text-lg font-medium text-gray-500">Aucun produit trouvé</p>
              <p className="mt-1 text-sm text-gray-400">Essayez de modifier vos filtres</p>
              <button onClick={clearFilters} className="mt-4 rounded-lg bg-[#7126b6] px-4 py-2 text-sm font-medium text-white hover:bg-[#5e1f9a] transition">
                Réinitialiser les filtres
              </button>
            </div>
          ) : (
            <>
              <div className="grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3">
                {products.map((product) => (
                  <Link
                    key={product.id}
                    href={`/product/${product.slug}`}
                    className="group rounded-xl border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-md dark:border-gray-700 dark:bg-gray-800"
                  >
                    <div className="aspect-square bg-gray-100 dark:bg-gray-700 relative">
                      {product.images[0] ? (
                        <img
                          src={product.images[0].url}
                          alt={product.name}
                          className="h-full w-full object-cover group-hover:scale-105 transition-transform"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <Store className="h-12 w-12 text-gray-300" />
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          if (isInCompare(product.id)) {
                            removeFromCompare(product.id);
                          } else {
                            addToCompare({
                              id: product.id,
                              name: product.name,
                              slug: product.slug,
                              price: product.price,
                              comparePrice: product.comparePrice,
                              image: product.images?.[0]?.url,
                              shopName: product.shop?.name || "",
                            });
                          }
                        }}
                        className={`absolute top-2 left-2 z-10 rounded-lg p-1.5 transition-colors ${
                          isInCompare(product.id)
                            ? "bg-[#7126b6] text-white"
                            : "bg-black/50 text-white/70 hover:bg-[#7126b6] hover:text-white"
                        }`}
                        title={isInCompare(product.id) ? "Retirer de la comparaison" : "Comparer"}
                      >
                        <Scale className="h-3.5 w-3.5" />
                      </button>
                      {product.comparePrice && product.comparePrice > product.price && (
                        <span className="absolute top-2 left-2 rounded-lg bg-red-500 px-2 py-0.5 text-[10px] font-bold text-white">
                          -{Math.round(((product.comparePrice - product.price) / product.comparePrice) * 100)}%
                        </span>
                      )}
                      {product.variantCount > 0 && (
                        <span className="absolute top-2 right-2 rounded-lg bg-black/60 px-2 py-0.5 text-[10px] font-medium text-white">
                          {product.variantCount} variantes
                        </span>
                      )}
                    </div>
                    <div className="p-3">
                      <p className="text-[10px] text-gray-400 truncate sm:text-xs">{product.shop.name}</p>
                      <h3 className="mt-0.5 text-xs font-medium text-[#0f172a] line-clamp-2 sm:text-sm">{product.name}</h3>
                      {product.avgRating > 0 && (
                        <div className="mt-1 flex items-center gap-1">
                          <div className="flex items-center gap-0.5">
                            {[1, 2, 3, 4, 5].map((star) => (
                              <Star
                                key={star}
                                className={`h-2.5 w-2.5 sm:h-3 sm:w-3 ${
                                  star <= Math.round(product.avgRating)
                                    ? "fill-yellow-400 text-yellow-400"
                                    : "fill-gray-200 text-gray-200"
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-[9px] text-gray-400 sm:text-[10px]">
                            {product.avgRating.toFixed(1)} ({product.reviewCount})
                          </span>
                        </div>
                      )}
                      <div className="mt-1.5 flex items-baseline gap-1.5">
                        <span className="text-sm font-bold text-[#7126b6] sm:text-base">
                          {product.variantCount > 0 && product.minVariantPrice != null
                            ? `${formatPrice(product.minVariantPrice)}${product.maxVariantPrice && product.maxVariantPrice !== product.minVariantPrice ? " +" : ""}`
                            : formatPrice(product.price)}
                        </span>
                        {product.comparePrice && product.comparePrice > product.price && (
                          <span className="text-[10px] text-gray-400 line-through sm:text-xs">{formatPrice(product.comparePrice)}</span>
                        )}
                      </div>
                      {product.category && (
                        <span className="mt-1.5 inline-block rounded-full bg-gray-100 px-2 py-0.5 text-[9px] text-gray-500 dark:bg-gray-700 dark:text-gray-400 sm:text-[10px]">
                          {product.category.name}
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-8 flex items-center justify-center gap-2">
                  <button
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700"
                  >
                    Précédent
                  </button>
                  {Array.from({ length: Math.min(totalPages, 7) }, (_, i) => {
                    let pageNum: number;
                    if (totalPages <= 7) {
                      pageNum = i + 1;
                    } else if (page <= 4) {
                      pageNum = i + 1;
                    } else if (page >= totalPages - 3) {
                      pageNum = totalPages - 6 + i;
                    } else {
                      pageNum = page - 3 + i;
                    }
                    return (
                      <button
                        key={pageNum}
                        onClick={() => setPage(pageNum)}
                        className={`h-9 w-9 rounded-lg text-sm font-medium transition ${
                          page === pageNum
                            ? "bg-[#7126b6] text-white"
                            : "border border-gray-200 text-gray-600 hover:bg-gray-50 dark:border-gray-700"
                        }`}
                      >
                        {pageNum}
                      </button>
                    );
                  })}
                  <button
                    onClick={() => setPage(Math.min(totalPages, page + 1))}
                    disabled={page >= totalPages}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed dark:border-gray-700"
                  >
                    Suivant
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Mobile filter drawer */}
      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute inset-y-0 right-0 w-full max-w-sm bg-white shadow-xl dark:bg-gray-800 overflow-y-auto">
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 dark:bg-gray-800 dark:border-gray-700">
              <h3 className="text-lg font-semibold text-[#0f172a]">Filtres</h3>
              <button onClick={() => setMobileFiltersOpen(false)} className="rounded-lg p-1 hover:bg-gray-100">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4">
              <FilterPanel />
            </div>
            <div className="sticky bottom-0 border-t border-gray-200 bg-white p-4 dark:bg-gray-800 dark:border-gray-700">
              <button
                onClick={() => setMobileFiltersOpen(false)}
                className="w-full rounded-xl bg-[#7126b6] py-3 text-sm font-semibold text-white hover:bg-[#5e1f9a] transition"
              >
                Voir {total} résultat{total > 1 ? "s" : ""}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ═══════════════ RECENTLY VIEWED ═══════════════ */}
      {recentlyViewed.length > 0 && (
      <section className="mt-12 border-t border-gray-200 pt-10">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-[#0f172a] sm:text-2xl">
              Récemment consultés
            </h2>
            <p className="mt-1 text-sm text-gray-500">Les produits que vous avez récemment vus</p>
          </div>
          <button
            onClick={clearRecent}
            className="text-sm font-medium text-gray-500 hover:text-gray-700 underline"
          >
            Effacer l&apos;historique
          </button>
        </div>

        <div className="mt-6 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
          {recentlyViewed.map((product) => (
            <Link
              key={product.id}
              href={`/product/${product.slug}`}
              className="group flex-shrink-0 w-48 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:shadow-md hover:border-[#7126b6]/30"
            >
              <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                {product.image ? (
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform group-hover:scale-105"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center">
                    <Store className="h-10 w-10 text-gray-300" />
                  </div>
                )}
              </div>
              <p className="mt-2 text-[10px] text-gray-400 truncate">{product.shopName}</p>
              <h3 className="line-clamp-2 text-sm font-medium text-gray-900">{product.name}</h3>
              <p className="mt-1 text-sm font-bold text-[#7126b6]">{formatPrice(product.price)}</p>
            </Link>
          ))}
        </div>
      </section>
      )}
    </div>
  );
}

export default function ProductsPage() {
  return (
    <Suspense fallback={
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          <div className="h-10 w-48 animate-pulse rounded-lg bg-gray-200" />
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
              <div key={i} className="animate-pulse rounded-xl border border-gray-200 bg-white overflow-hidden">
                <div className="aspect-square bg-gray-200" />
                <div className="p-3 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-3/4" />
                  <div className="h-3 bg-gray-200 rounded w-1/2" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    }>
      <ProductsContent />
    </Suspense>
  );
}
