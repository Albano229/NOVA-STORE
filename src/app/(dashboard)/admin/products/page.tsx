"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { formatPrice } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  Package,
  Search,
  CheckCircle,
  XCircle,
  Star,
  EyeOff,
  Box,
  Download,
  Wrench,
  Users,
  Clock,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  MoreVertical,
  Trash2,
  Eye,
  SlidersHorizontal,
  X,
  ShoppingCart,
  DollarSign,
  TrendingUp,
  AlertTriangle,
  Image,
  FileText,
  RotateCcw,
  ArrowUpDown,
  ImageOff,
  MessageSquare,
  BarChart3,
  User,
} from "lucide-react";

interface ProductImage {
  id: string;
  url: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  comparePrice: number | null;
  discountPercent: number | null;
  sku: string | null;
  stock: number;
  weight: number | null;
  productType: string;
  isActive: boolean;
  isFeatured: boolean;
  isHidden: boolean;
  videoUrl: string | null;
  seoTitle: string | null;
  seoDescription: string | null;
  createdAt: string;
  shop: { id: string; name: string; slug: string };
  vendor: { id: string; name: string; email: string };
  category: { name: string; slug: string } | null;
  images: ProductImage[];
  salesCount: number;
  revenue: number;
  digitalFileType: string | null;
  digitalFileUrl: string | null;
  maxDownloads: number | null;
  shippingEnabled: boolean;
  shippingCost: number | null;
}

interface ProductStats {
  total: number;
  active: number;
  inactive: number;
  featured: number;
  hidden: number;
  physical: number;
  digital: number;
  service: number;
  community: number;
  bundle: number;
  today: number;
}

interface TopProduct {
  id: string;
  name: string;
  price: number;
  productType: string;
  shopName: string;
  salesCount: number;
  revenue: number;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

interface ProductDetail {
  product: Product;
  images: ProductImage[];
  digitalFile: { fileType: string; fileUrl: string; maxDownloads: number } | null;
  physicalOpt: { shippingEnabled: boolean; shippingCost: number } | null;
  stats: { totalSales: number; unitsSold: number; totalRevenue: number };
  recentOrders: { id: string; orderNumber: string; total: number; status: string; createdAt: string; user: { name: string | null } }[];
  reviews: { id: string; rating: number; comment: string | null; createdAt: string; user: { name: string | null; image: string | null } }[];
}

const typeBadge: Record<string, { label: string; className: string }> = {
  PHYSICAL: { label: "Physique", className: "bg-blue-100 text-blue-700" },
  DIGITAL: { label: "Digital", className: "bg-purple-100 text-purple-700" },
  SERVICE: { label: "Service", className: "bg-teal-100 text-teal-700" },
  COMMUNITY: { label: "Communauté", className: "bg-pink-100 text-pink-700" },
  BUNDLE: { label: "Bundle", className: "bg-amber-100 text-amber-700" },
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<ProductStats | null>(null);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [pagination, setPagination] = useState<Pagination>({ page: 1, limit: 20, total: 0, totalPages: 0 });

  const [search, setSearch] = useState("");
  const [shopFilter, setShopFilter] = useState("");
  const [vendorFilter, setVendorFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  const [selectedProduct, setSelectedProduct] = useState<ProductDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [openDropdown, setOpenDropdown] = useState<string | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  const fetchProducts = useCallback(async (page: number = 1) => {
    setLoading(true);
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "20");
    if (search) params.set("search", search);
    if (shopFilter) params.set("shop", shopFilter);
    if (vendorFilter) params.set("vendor", vendorFilter);
    if (typeFilter) params.set("type", typeFilter);
    if (statusFilter) params.set("status", statusFilter);
    if (categoryFilter) params.set("category", categoryFilter);
    if (sortBy) params.set("sort", sortBy);
    try {
      const res = await fetch(`/api/admin/products?${params.toString()}`);
      const data = await res.json();
      setProducts(data.products || []);
      setPagination(data.pagination || { page: 1, limit: 20, total: 0, totalPages: 0 });
      setStats(data.stats || null);
      setTopProducts(data.topProducts || []);
    } catch {
      toast.error("Erreur lors du chargement des produits");
    } finally {
      setLoading(false);
    }
  }, [search, shopFilter, vendorFilter, typeFilter, statusFilter, categoryFilter, sortBy]);

  useEffect(() => {
    fetchProducts(1);
  }, [fetchProducts]);

  const openDetail = async (productId: string) => {
    setDetailLoading(true);
    setSelectedProduct(null);
    try {
      const res = await fetch(`/api/admin/products/${productId}`);
      const data = await res.json();
      setSelectedProduct(data);
    } catch {
      toast.error("Erreur lors du chargement du produit");
    } finally {
      setDetailLoading(false);
    }
  };

  const closeDetail = () => {
    setSelectedProduct(null);
    setOpenDropdown(null);
  };

  const patchProduct = async (id: string, body: Record<string, unknown>) => {
    try {
      const res = await fetch(`/api/admin/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...body } : p)));
        if (selectedProduct?.product.id === id) {
          setSelectedProduct((prev) => prev ? { ...prev, product: { ...prev.product, ...body } } : prev);
        }
        toast.success("Produit mis à jour");
        fetchProducts(pagination.page);
      } else {
        toast.error("Erreur lors de la mise à jour");
      }
    } catch {
      toast.error("Erreur réseau");
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget || deleteConfirmText !== "SUPPRIMER") return;
    setDeleting(true);
    try {
      const res = await fetch(`/api/admin/products/${deleteTarget.id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Produit supprimé");
        setDeleteTarget(null);
        setDeleteConfirmText("");
        setSelectedProduct(null);
        fetchProducts(pagination.page);
      } else {
        toast.error("Erreur lors de la suppression");
      }
    } catch {
      toast.error("Erreur réseau");
    } finally {
      setDeleting(false);
    }
  };

  const handlePageChange = (newPage: number) => {
    if (newPage < 1 || newPage > pagination.totalPages) return;
    fetchProducts(newPage);
  };

  const resetFilters = () => {
    setSearch("");
    setShopFilter("");
    setVendorFilter("");
    setTypeFilter("");
    setStatusFilter("");
    setCategoryFilter("");
    setSortBy("createdAt");
  };

  const formatDate = (d: string) => new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, i) => (
      <Star key={i} className={`h-3.5 w-3.5 ${i < rating ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
    ));
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50 p-4 md:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Gestion des Produits</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{pagination.total} produit{pagination.total > 1 ? "s" : ""} au total</p>
      </div>

      {stats && (
        <div className="mb-6 grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 lg:grid-cols-10 gap-3">
          {[
            { label: "Total", value: stats.total, icon: Package, color: "bg-indigo-100 text-indigo-600" },
            { label: "Actifs", value: stats.active, icon: CheckCircle, color: "bg-emerald-100 text-emerald-600" },
            { label: "Inactifs", value: stats.inactive, icon: XCircle, color: "bg-red-100 text-red-600" },
            { label: "En vedette", value: stats.featured, icon: Star, color: "bg-amber-100 text-amber-600" },
            { label: "Cachés", value: stats.hidden, icon: EyeOff, color: "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400" },
            { label: "Physiques", value: stats.physical, icon: Box, color: "bg-blue-100 text-blue-600" },
            { label: "Digitaux", value: stats.digital, icon: Download, color: "bg-purple-100 text-purple-600" },
            { label: "Services", value: stats.service, icon: Wrench, color: "bg-teal-100 text-teal-600" },
            { label: "Communautés", value: stats.community, icon: Users, color: "bg-pink-100 text-pink-600" },
            { label: "Aujourd'hui", value: stats.today, icon: Clock, color: "bg-emerald-100 text-emerald-600" },
          ].map((s) => (
            <div key={s.label} className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-3 shadow-sm dark:shadow-gray-800/20">
              <div className="flex items-center gap-2">
                <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${s.color}`}>
                  <s.icon className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-[10px] font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">{s.label}</p>
                  <p className="text-lg font-bold text-gray-900 dark:text-gray-100">{s.value}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="mb-6 rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20">
        <div className="flex items-center gap-2 mb-3">
          <SlidersHorizontal className="h-4 w-4 text-gray-400 dark:text-gray-500" />
          <span className="text-xs font-semibold uppercase tracking-wider text-gray-400 dark:text-gray-500">Filtres</span>
          <button onClick={resetFilters} className="ml-auto flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400">
            <RotateCcw className="h-3 w-3" />
            Réinitialiser
          </button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <Input id="search" placeholder="Nom, SKU..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
          </div>
          <Input id="shop" placeholder="Boutique..." value={shopFilter} onChange={(e) => setShopFilter(e.target.value)} />
          <Input id="vendor" placeholder="Vendeur..." value={vendorFilter} onChange={(e) => setVendorFilter(e.target.value)} />
          <Input id="category" placeholder="Catégorie..." value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)} />
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">Tous les types</option>
            <option value="PHYSICAL">Physique</option>
            <option value="DIGITAL">Digital</option>
            <option value="BOOKING">Booking</option>
            <option value="BUNDLE">Bundle</option>
            <option value="COMMUNITY">Communauté</option>
          </select>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">Tous les statuts</option>
            <option value="active">Actifs</option>
            <option value="inactive">Inactifs</option>
            <option value="featured">En vedette</option>
            <option value="hidden">Cachés</option>
          </select>
          <div className="relative">
            <ArrowUpDown className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
            <select
              value={sortBy}
              onChange={(e) => {
                setSortBy(e.target.value);
                if (e.target.value.includes("asc")) {
                  setSortOrder("asc");
                  setSortBy(e.target.value.replace("_asc", ""));
                } else if (e.target.value.includes("desc")) {
                  setSortOrder("desc");
                  setSortBy(e.target.value.replace("_desc", ""));
                } else {
                  setSortBy(e.target.value);
                }
              }}
              className="w-full appearance-none rounded-lg border border-gray-300 py-2.5 pl-9 pr-3 text-sm text-gray-700 dark:text-gray-300 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-200"
            >
              <option value="createdAt">Plus récents</option>
              <option value="createdAt_asc">Plus anciens</option>
              <option value="name">Nom A-Z</option>
              <option value="price">Prix croissant</option>
              <option value="price_desc">Prix décroissant</option>
              <option value="salesCount_desc">Plus vendus</option>
              <option value="revenue_desc">Plus rentables</option>
            </select>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-20 animate-pulse rounded-2xl bg-gray-200" />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 py-16 text-center shadow-sm dark:shadow-gray-800/20">
          <Package className="mx-auto h-12 w-12 text-gray-300" />
          <p className="mt-3 text-sm text-gray-400 dark:text-gray-500">Aucun produit trouvé</p>
        </div>
      ) : (
        <>
          <div className="hidden lg:block rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                    <th className="px-4 py-3 text-left">Produit</th>
                    <th className="px-4 py-3 text-left">Boutique</th>
                    <th className="px-4 py-3 text-left">Vendeur</th>
                    <th className="px-4 py-3 text-left">Type</th>
                    <th className="px-4 py-3 text-left">Catégorie</th>
                    <th className="px-4 py-3 text-left">Prix</th>
                    <th className="px-4 py-3 text-left">Stock</th>
                    <th className="px-4 py-3 text-left">Statut</th>
                    <th className="px-4 py-3 text-left">Ventes</th>
                    <th className="px-4 py-3 text-left">Revenus</th>
                    <th className="px-4 py-3 text-left">Date</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                  {products.map((product) => (
                    <tr key={product.id} className="hover:bg-gray-50/50 dark:bg-gray-800/30 cursor-pointer" onClick={() => openDetail(product.id)}>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                            {product.images[0] ? (
                              <img src={product.images[0].url} alt="" className="h-full w-full object-cover" />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-4 w-4 text-gray-300" />
                              </div>
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="truncate font-medium text-gray-900 dark:text-gray-100">{product.name}</p>
                            {product.sku && <p className="truncate text-xs text-gray-400 dark:text-gray-500">SKU: {product.sku}</p>}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.shop.name}</td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.vendor.name}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${typeBadge[product.productType]?.className || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                          {typeBadge[product.productType]?.label || product.productType}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-gray-500 dark:text-gray-400 text-xs">{product.category?.name || "—"}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{formatPrice(product.price)}</td>
                      <td className="px-4 py-3">
                        <span className={`font-medium ${product.stock <= 5 ? "text-red-600" : "text-gray-900 dark:text-gray-100"}`}>
                          {product.stock}
                        </span>
                        {product.stock <= 5 && <span className="ml-1 text-[10px] text-red-400">⚠</span>}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1">
                          {product.isActive && (
                            <span className="inline-block rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Actif</span>
                          )}
                          {product.isFeatured && (
                            <span className="inline-block rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">★ Vedette</span>
                          )}
                          {product.isHidden && (
                            <span className="inline-block rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">Caché</span>
                          )}
                          {!product.isActive && !product.isHidden && (
                            <span className="inline-block rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-medium text-red-600">Inactif</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-gray-600 dark:text-gray-400">{product.salesCount}</td>
                      <td className="px-4 py-3 font-medium text-gray-900 dark:text-gray-100">{formatPrice(product.revenue)}</td>
                      <td className="px-4 py-3 text-xs text-gray-400 dark:text-gray-500">{formatDate(product.createdAt)}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="relative" onClick={(e) => e.stopPropagation()}>
                          <button
                            onClick={() => setOpenDropdown(openDropdown === product.id ? null : product.id)}
                            className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                          >
                            <MoreVertical className="h-4 w-4" />
                          </button>
                          {openDropdown === product.id && (
                            <div className="absolute right-0 top-full z-20 mt-1 w-52 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 py-1 shadow-lg">
                              <button
                                onClick={() => { openDetail(product.id); setOpenDropdown(null); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Eye className="h-4 w-4" />
                                Voir les détails
                              </button>
                              <button
                                onClick={() => { patchProduct(product.id, { isActive: !product.isActive }); setOpenDropdown(null); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                {product.isActive ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-emerald-500" />}
                                {product.isActive ? "Désactiver" : "Activer"}
                              </button>
                              <button
                                onClick={() => { patchProduct(product.id, { isFeatured: !product.isFeatured }); setOpenDropdown(null); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <Star className="h-4 w-4 text-amber-500" />
                                {product.isFeatured ? "Retirer vedette" : "Mettre en vedette"}
                              </button>
                              <button
                                onClick={() => { patchProduct(product.id, { isHidden: !product.isHidden }); setOpenDropdown(null); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              >
                                <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                                {product.isHidden ? "Afficher" : "Cacher"}
                              </button>
                              <a
                                href={`/product/${product.slug}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <ExternalLink className="h-4 w-4 text-indigo-500" />
                                Voir sur la boutique
                              </a>
                              <a
                                href={`/admin/vendors`}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                                onClick={() => setOpenDropdown(null)}
                              >
                                <User className="h-4 w-4 text-teal-500" />
                                Profil vendeur
                              </a>
                              <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                              <button
                                onClick={() => { setDeleteTarget(product); setOpenDropdown(null); }}
                                className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                              >
                                <Trash2 className="h-4 w-4" />
                                Supprimer
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="lg:hidden space-y-3">
            {products.map((product) => (
              <div key={product.id} className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-4 shadow-sm dark:shadow-gray-800/20" onClick={() => openDetail(product.id)}>
                <div className="flex items-start gap-3">
                  <div className="h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
                    {product.images[0] ? (
                      <img src={product.images[0].url} alt="" className="h-full w-full object-cover" />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center">
                        <Package className="h-5 w-5 text-gray-300" />
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate font-semibold text-gray-900 dark:text-gray-100">{product.name}</p>
                        {product.sku && <p className="text-xs text-gray-400 dark:text-gray-500">SKU: {product.sku}</p>}
                      </div>
                      <div className="relative shrink-0" onClick={(e) => e.stopPropagation()}>
                        <button
                          onClick={() => setOpenDropdown(openDropdown === product.id ? null : product.id)}
                          className="rounded-lg p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <MoreVertical className="h-4 w-4" />
                        </button>
                        {openDropdown === product.id && (
                          <div className="absolute right-0 top-full z-20 mt-1 w-48 rounded-xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 py-1 shadow-lg">
                            <button
                              onClick={() => { openDetail(product.id); setOpenDropdown(null); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <Eye className="h-4 w-4" />
                              Détails
                            </button>
                            <button
                              onClick={() => { patchProduct(product.id, { isActive: !product.isActive }); setOpenDropdown(null); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              {product.isActive ? <XCircle className="h-4 w-4 text-red-500" /> : <CheckCircle className="h-4 w-4 text-emerald-500" />}
                              <span className="text-gray-700 dark:text-gray-300">{product.isActive ? "Désactiver" : "Activer"}</span>
                            </button>
                            <button
                              onClick={() => { patchProduct(product.id, { isFeatured: !product.isFeatured }); setOpenDropdown(null); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <Star className="h-4 w-4 text-amber-500" />
                              {product.isFeatured ? "Retirer vedette" : "Vedette"}
                            </button>
                            <button
                              onClick={() => { patchProduct(product.id, { isHidden: !product.isHidden }); setOpenDropdown(null); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                            >
                              <EyeOff className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                              {product.isHidden ? "Afficher" : "Cacher"}
                            </button>
                            <a
                              href={`/product/${product.slug}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                              onClick={() => setOpenDropdown(null)}
                            >
                              <ExternalLink className="h-4 w-4 text-indigo-500" />
                              Boutique
                            </a>
                            <div className="my-1 border-t border-gray-100 dark:border-gray-700/50" />
                            <button
                              onClick={() => { setDeleteTarget(product); setOpenDropdown(null); }}
                              className="flex w-full items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${typeBadge[product.productType]?.className || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                        {typeBadge[product.productType]?.label || product.productType}
                      </span>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{product.shop.name}</span>
                      {product.category && <span className="text-xs text-gray-400 dark:text-gray-500">· {product.category.name}</span>}
                    </div>
                    <div className="mt-2 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(product.price)}</span>
                        <span className={`text-xs font-medium ${product.stock <= 5 ? "text-red-500" : "text-gray-400 dark:text-gray-500"}`}>
                          Stock: {product.stock}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 text-xs text-gray-400 dark:text-gray-500">
                        <span>{product.salesCount} ventes</span>
                        <span>·</span>
                        <span>{formatPrice(product.revenue)}</span>
                      </div>
                    </div>
                    <div className="mt-2 flex flex-wrap gap-1">
                      {product.isActive && (
                        <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">Actif</span>
                      )}
                      {product.isFeatured && (
                        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700">★ Vedette</span>
                      )}
                      {product.isHidden && (
                        <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-[10px] font-medium text-gray-500 dark:text-gray-400">Caché</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {pagination.totalPages > 1 && (
            <div className="mt-6 flex items-center justify-center gap-1">
              <button
                onClick={() => handlePageChange(pagination.page - 1)}
                disabled={pagination.page <= 1}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {Array.from({ length: Math.min(pagination.totalPages, 7) }, (_, i) => {
                let page: number;
                if (pagination.totalPages <= 7) {
                  page = i + 1;
                } else if (pagination.page <= 4) {
                  page = i + 1;
                } else if (pagination.page >= pagination.totalPages - 3) {
                  page = pagination.totalPages - 6 + i;
                } else {
                  page = pagination.page - 3 + i;
                }
                return (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`flex h-9 w-9 items-center justify-center rounded-lg text-sm font-medium ${
                      pagination.page === page
                        ? "bg-indigo-600 text-white"
                        : "border border-gray-200 dark:border-gray-700 bg-white text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700"
                    }`}
                  >
                    {page}
                  </button>
                );
              })}
              <button
                onClick={() => handlePageChange(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages}
                className="flex h-9 w-9 items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:cursor-not-allowed disabled:opacity-40"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </>
      )}

      <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-gray-800/20">
          <div className="flex items-center gap-2 mb-4">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Modération</h2>
          </div>
          <div className="space-y-3">
            {[
              { label: "Produits signalés", count: 3, icon: AlertTriangle, color: "bg-red-100 text-red-600" },
              { label: "Problèmes de contenu", count: 1, icon: FileText, color: "bg-amber-100 text-amber-600" },
              { label: "Problèmes d'images", count: 2, icon: ImageOff, color: "bg-orange-100 text-orange-600" },
            ].map((item) => (
              <div key={item.label} className="flex items-center justify-between rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                <div className="flex items-center gap-3">
                  <div className={`flex h-8 w-8 items-center justify-center rounded-lg ${item.color}`}>
                    <item.icon className="h-4 w-4" />
                  </div>
                  <span className="text-sm text-gray-700 dark:text-gray-300">{item.label}</span>
                </div>
                <span className="text-lg font-bold text-gray-900 dark:text-gray-100">{item.count}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-2xl border border-gray-100 dark:border-gray-700/50 bg-white dark:bg-gray-800 p-5 shadow-sm dark:shadow-gray-800/20">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="h-4 w-4 text-indigo-500" />
            <h2 className="text-sm font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">Top Produits</h2>
          </div>
          <div className="space-y-3">
            {topProducts.length === 0 ? (
              <p className="py-4 text-center text-xs text-gray-400 dark:text-gray-500">Aucune donnée disponible</p>
            ) : (
              topProducts.slice(0, 10).map((tp, idx) => {
                const maxRevenue = Math.max(...topProducts.map((t) => t.revenue), 1);
                const barWidth = maxRevenue > 0 ? (tp.revenue / maxRevenue) * 100 : 0;
                return (
                  <div key={tp.id} className="flex items-center gap-3">
                    <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[10px] font-bold text-indigo-600">
                      {idx + 1}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-medium text-gray-900 dark:text-gray-100">{tp.name}</p>
                        <span className="shrink-0 text-xs text-gray-400 dark:text-gray-500">{tp.salesCount} ventes</span>
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <div className="h-1.5 flex-1 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-indigo-500 transition-all"
                            style={{ width: `${barWidth}%` }}
                          />
                        </div>
                        <span className="shrink-0 text-xs font-medium text-gray-500 dark:text-gray-400">{formatPrice(tp.revenue)}</span>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {(selectedProduct || detailLoading) && (
        <>
          <div className="fixed inset-0 z-40 bg-black/30 backdrop-blur-sm" onClick={closeDetail} />
          <div className="fixed inset-y-0 right-0 z-50 w-full max-w-2xl overflow-y-auto bg-white dark:bg-gray-800 shadow-2xl">
            {detailLoading ? (
              <div className="flex h-full items-center justify-center">
                <div className="h-8 w-8 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
              </div>
            ) : selectedProduct && (
              <div className="flex flex-col h-full">
                <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 px-6 py-4">
                  <h2 className="text-lg font-bold text-gray-900 dark:text-gray-100 truncate pr-4">{selectedProduct.product.name}</h2>
                  <button onClick={closeDetail} className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400">
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <div className="flex-1 overflow-y-auto px-6 py-5 space-y-6">
                  <div className="flex flex-col sm:flex-row gap-4">
                    <div className="shrink-0 w-full sm:w-48 h-48 overflow-hidden rounded-xl bg-gray-100 dark:bg-gray-700">
                      {selectedProduct.images[0] ? (
                        <img src={selectedProduct.images[0].url} alt="" className="h-full w-full object-cover" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center">
                          <Package className="h-10 w-10 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-xl font-bold text-gray-900 dark:text-gray-100">{selectedProduct.product.name}</p>
                      <div className="mt-2 flex flex-wrap gap-2">
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${typeBadge[selectedProduct.product.productType]?.className || "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400"}`}>
                          {typeBadge[selectedProduct.product.productType]?.label || selectedProduct.product.productType}
                        </span>
                        {selectedProduct.product.isActive && (
                          <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-medium text-emerald-700">Actif</span>
                        )}
                        {selectedProduct.product.isFeatured && (
                          <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-medium text-amber-700">★ Vedette</span>
                        )}
                        {selectedProduct.product.isHidden && (
                          <span className="rounded-full bg-gray-100 dark:bg-gray-700 px-3 py-1 text-xs font-medium text-gray-500 dark:text-gray-400">Caché</span>
                        )}
                      </div>
                      {selectedProduct.product.description && (
                        <p className="mt-3 text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{selectedProduct.product.description}</p>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div className="rounded-xl bg-indigo-50 p-4 text-center">
                      <ShoppingCart className="mx-auto h-5 w-5 text-indigo-500" />
                      <p className="mt-1 text-2xl font-bold text-indigo-700">{selectedProduct.stats.totalSales}</p>
                      <p className="text-xs text-indigo-400">Ventes totales</p>
                    </div>
                    <div className="rounded-xl bg-blue-50 p-4 text-center">
                      <Package className="mx-auto h-5 w-5 text-blue-500" />
                      <p className="mt-1 text-2xl font-bold text-blue-700">{selectedProduct.stats.unitsSold}</p>
                      <p className="text-xs text-blue-400">Unités vendues</p>
                    </div>
                    <div className="rounded-xl bg-emerald-50 p-4 text-center">
                      <DollarSign className="mx-auto h-5 w-5 text-emerald-500" />
                      <p className="mt-1 text-2xl font-bold text-emerald-700">{formatPrice(selectedProduct.stats.totalRevenue)}</p>
                      <p className="text-xs text-emerald-400">Revenu total</p>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Informations</h3>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Prix</p>
                        <p className="font-bold text-gray-900 dark:text-gray-100">{formatPrice(selectedProduct.product.price)}</p>
                      </div>
                      {selectedProduct.product.comparePrice && (
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                          <p className="text-xs text-gray-400 dark:text-gray-500">Prix de comparaison</p>
                          <p className="font-bold text-gray-900 dark:text-gray-100 line-through">{formatPrice(selectedProduct.product.comparePrice)}</p>
                        </div>
                      )}
                      {selectedProduct.product.discountPercent && (
                        <div className="rounded-xl bg-red-50 p-3">
                          <p className="text-xs text-gray-400 dark:text-gray-500">Réduction</p>
                          <p className="font-bold text-red-600">{selectedProduct.product.discountPercent}%</p>
                        </div>
                      )}
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Stock</p>
                        <p className={`font-bold ${selectedProduct.product.stock <= 5 ? "text-red-600" : "text-gray-900 dark:text-gray-100"}`}>{selectedProduct.product.stock}</p>
                      </div>
                      {selectedProduct.product.sku && (
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                          <p className="text-xs text-gray-400 dark:text-gray-500">SKU</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{selectedProduct.product.sku}</p>
                        </div>
                      )}
                      {selectedProduct.product.weight && (
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                          <p className="text-xs text-gray-400 dark:text-gray-500">Poids</p>
                          <p className="font-medium text-gray-900 dark:text-gray-100">{selectedProduct.product.weight} kg</p>
                        </div>
                      )}
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Catégorie</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedProduct.product.category?.name || "—"}</p>
                      </div>
                      <div className="rounded-xl bg-gray-50 dark:bg-gray-800/50 p-3">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Ajouté le</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{formatDate(selectedProduct.product.createdAt)}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Boutique & Vendeur</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="rounded-xl border border-gray-100 dark:border-gray-700/50 p-3">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Boutique</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedProduct.product.shop.name}</p>
                      </div>
                      <div className="rounded-xl border border-gray-100 dark:border-gray-700/50 p-3">
                        <p className="text-xs text-gray-400 dark:text-gray-500">Vendeur</p>
                        <p className="font-medium text-gray-900 dark:text-gray-100">{selectedProduct.product.vendor.name}</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{selectedProduct.product.vendor.email}</p>
                      </div>
                    </div>
                  </div>

                  {selectedProduct.product.productType === "DIGITAL" && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Informations digitales</h3>
                      <div className="rounded-xl border border-purple-100 bg-purple-50 p-4">
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div>
                            <p className="text-xs text-purple-400">Type de fichier</p>
                            <p className="font-medium text-purple-900">{selectedProduct.digitalFile?.fileType || "—"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-purple-400">Max téléchargements</p>
                            <p className="font-medium text-purple-900">{selectedProduct.digitalFile?.maxDownloads ?? "Illimité"}</p>
                          </div>
                        </div>
                        {selectedProduct.digitalFile?.fileUrl && (
                          <a
                            href={selectedProduct.digitalFile.fileUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-3 inline-flex items-center gap-1.5 text-sm font-medium text-purple-600 hover:text-purple-700"
                          >
                            <Download className="h-4 w-4" />
                            Télécharger le fichier
                          </a>
                        )}
                      </div>
                    </div>
                  )}

                  {selectedProduct.product.productType === "PHYSICAL" && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Expédition</h3>
                      <div className="rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm">
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <p className="text-xs text-blue-400">Expédition activée</p>
                            <p className="font-medium text-blue-900">{selectedProduct.physicalOpt?.shippingEnabled ? "Oui" : "Non"}</p>
                          </div>
                          <div>
                            <p className="text-xs text-blue-400">Frais de port</p>
                            <p className="font-medium text-blue-900">{selectedProduct.physicalOpt?.shippingCost ? formatPrice(selectedProduct.physicalOpt.shippingCost) : "Gratuit"}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {selectedProduct.reviews.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Avis ({selectedProduct.reviews.length})</h3>
                      <div className="space-y-2">
                        {selectedProduct.reviews.map((review) => (
                          <div key={review.id} className="rounded-xl border border-gray-100 dark:border-gray-700/50 p-3">
                            <div className="flex items-center gap-2">
                              <div className="h-7 w-7 shrink-0 overflow-hidden rounded-full bg-gray-200">
                                {review.user.image ? (
                                  <img src={review.user.image} alt="" className="h-full w-full object-cover" />
                                ) : (
                                  <div className="flex h-full w-full items-center justify-center">
                                    <User className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500" />
                                  </div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{review.user.name || "Anonyme"}</p>
                                <div className="flex items-center gap-0.5">{renderStars(review.rating)}</div>
                              </div>
                              <span className="text-[10px] text-gray-400 dark:text-gray-500">{formatDate(review.createdAt)}</span>
                            </div>
                            {review.comment && (
                              <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{review.comment}</p>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {selectedProduct.recentOrders.length > 0 && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Commandes récentes</h3>
                      <div className="space-y-2">
                        {selectedProduct.recentOrders.map((order) => (
                          <div key={order.id} className="flex items-center justify-between rounded-xl border border-gray-100 dark:border-gray-700/50 p-3">
                            <div>
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{order.orderNumber}</p>
                              <p className="text-xs text-gray-400 dark:text-gray-500">{order.user.name || "Client"} · {formatDate(order.createdAt)}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{formatPrice(order.total)}</p>
                              <span className={`inline-block rounded-full px-2 py-0.5 text-[10px] font-medium ${
                                order.status === "DELIVERED" || order.status === "COMPLETED" ? "bg-emerald-100 text-emerald-700" :
                                order.status === "CANCELLED" ? "bg-red-100 text-red-700" :
                                "bg-amber-100 text-amber-700"
                              }`}>
                                {order.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {(selectedProduct.product.seoTitle || selectedProduct.product.seoDescription) && (
                    <div className="space-y-3">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">SEO</h3>
                      <div className="rounded-xl border border-gray-100 dark:border-gray-700/50 bg-gray-50 dark:bg-gray-800/50 p-4 text-sm space-y-2">
                        {selectedProduct.product.seoTitle && (
                          <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Titre SEO</p>
                            <p className="font-medium text-gray-900 dark:text-gray-100">{selectedProduct.product.seoTitle}</p>
                          </div>
                        )}
                        {selectedProduct.product.seoDescription && (
                          <div>
                            <p className="text-xs text-gray-400 dark:text-gray-500">Description SEO</p>
                            <p className="text-gray-600 dark:text-gray-400">{selectedProduct.product.seoDescription}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">Actions</h3>
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={() => patchProduct(selectedProduct.product.id, { isActive: !selectedProduct.product.isActive })}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                          selectedProduct.product.isActive
                            ? "bg-red-100 text-red-700 hover:bg-red-200"
                            : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                        }`}
                      >
                        {selectedProduct.product.isActive ? <XCircle className="h-3.5 w-3.5" /> : <CheckCircle className="h-3.5 w-3.5" />}
                        {selectedProduct.product.isActive ? "Désactiver" : "Activer"}
                      </button>
                      <button
                        onClick={() => patchProduct(selectedProduct.product.id, { isFeatured: !selectedProduct.product.isFeatured })}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                          selectedProduct.product.isFeatured
                            ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        <Star className="h-3.5 w-3.5" />
                        {selectedProduct.product.isFeatured ? "Retirer vedette" : "Mettre en vedette"}
                      </button>
                      <button
                        onClick={() => patchProduct(selectedProduct.product.id, { isHidden: !selectedProduct.product.isHidden })}
                        className={`flex items-center gap-1.5 rounded-xl px-3 py-2 text-xs font-medium transition-colors ${
                          selectedProduct.product.isHidden
                            ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                            : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
                        }`}
                      >
                        {selectedProduct.product.isHidden ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                        {selectedProduct.product.isHidden ? "Afficher" : "Cacher"}
                      </button>
                      <a
                        href={`/product/${selectedProduct.product.slug}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1.5 rounded-xl bg-indigo-100 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-200 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                        Voir sur la boutique
                      </a>
                      <a
                        href={`/admin/vendors`}
                        className="flex items-center gap-1.5 rounded-xl bg-teal-100 px-3 py-2 text-xs font-medium text-teal-700 hover:bg-teal-200 transition-colors"
                      >
                        <User className="h-3.5 w-3.5" />
                        Profil vendeur
                      </a>
                      <button
                        onClick={() => { setDeleteTarget(selectedProduct.product); }}
                        className="flex items-center gap-1.5 rounded-xl bg-red-100 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-200 transition-colors"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Supprimer
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {deleteTarget && (
        <>
          <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm" onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }} />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <div className="w-full max-w-md rounded-2xl bg-white dark:bg-gray-800 p-6 shadow-2xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center gap-3 mb-4">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-100">
                  <Trash2 className="h-5 w-5 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">Supprimer le produit</h3>
                  <p className="text-xs text-gray-400 dark:text-gray-500">Cette action est irréversible</p>
                </div>
              </div>
              <div className="mb-4 rounded-xl bg-red-50 p-4">
                <p className="text-sm text-gray-700 dark:text-gray-300">
                  Vous êtes sur le point de supprimer <strong className="text-gray-900 dark:text-gray-100">{deleteTarget.name}</strong>.
                  Tapez <strong className="text-red-600">SUPPRIMER</strong> pour confirmer.
                </p>
              </div>
              <Input
                id="deleteConfirm"
                placeholder='Tapez "SUPPRIMER" pour confirmer'
                value={deleteConfirmText}
                onChange={(e) => setDeleteConfirmText(e.target.value)}
                className="mb-4"
              />
              <div className="flex gap-3">
                <button
                  onClick={() => { setDeleteTarget(null); setDeleteConfirmText(""); }}
                  className="flex-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={deleteConfirmText !== "SUPPRIMER" || deleting}
                  className="flex-1 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50 transition-colors"
                >
                  {deleting ? "Suppression..." : "Supprimer"}
                </button>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
