"use client";

import { useSession } from "next-auth/react";
import { use, useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Star,
  MapPin,
  Mail,
  Phone,
  Package,
  Share2,
  BadgeCheck,
  Heart,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  MessageSquare,
  MapPinned,
  ExternalLink,
} from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import toast from "react-hot-toast";

interface ShopData {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  logo: string | null;
  banner: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  isVerified: boolean;
  showPublicContact: boolean;
  createdAt: string;
  products: {
    id: string;
    name: string;
    slug: string;
    price: number;
    comparePrice: number | null;
    isActive: boolean;
    requiresShippingAddress: boolean;
    productType: string;
    ctaText: string | null;
    ctaColor: string | null;
    images: { id: string; url: string; alt: string | null }[];
  }[];
  reviews: {
    id: string;
    rating: number;
    comment: string | null;
    createdAt: string;
    user: { name: string | null; image: string | null };
  }[];
  _count: { products: number; followers: number };
  averageRating: number;
  isFollowing: boolean;
}

type Tab = "all" | "promos" | "reviews";

export default function ShopPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = use(params);
  const router = useRouter();
  const { data: session } = useSession();
  const addItem = useCartStore((s) => s.addItem);

  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("all");
  const [page, setPage] = useState(1);
  const [isFollowing, setIsFollowing] = useState(false);
  const [followerCount, setFollowerCount] = useState(0);
  const PRODUCTS_PER_PAGE = 9;

  const fetchShop = useCallback(async () => {
    try {
      const res = await fetch(`/api/shops/${slug}`);
      if (res.ok) {
        const data = await res.json();
        setShop(data);
        setIsFollowing(data.isFollowing);
        setFollowerCount(data._count?.followers || 0);
      }
    } catch {
      setShop(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchShop();
  }, [fetchShop]);

  const handleFollow = async () => {
    if (!session) {
      toast.error("Connectez-vous pour suivre cette boutique");
      return;
    }
    try {
      const method = isFollowing ? "DELETE" : "POST";
      const res = await fetch(`/api/shops/${slug}/follow`, { method });
      if (res.ok) {
        setIsFollowing(!isFollowing);
        setFollowerCount((prev) => (isFollowing ? prev - 1 : prev + 1));
        toast.success(isFollowing ? "Boutique retirée de vos favoris" : "Boutique ajoutée à vos favoris");
      }
    } catch {
      toast.error("Erreur lors de l'opération");
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: shop?.name, url });
      } catch {}
    } else {
      await navigator.clipboard.writeText(url);
      toast.success("Lien copié !");
    }
  };

  const addToCart = (product: ShopData["products"][0]) => {
    if (!shop) return;
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || "",
      shopId: shop.id,
      shopName: shop.name,
      stock: 999,
      requiresShippingAddress: product.requiresShippingAddress !== false,
    });
    toast.success("Ajouté au panier !");
  };

  const handleBuyNow = (product: ShopData["products"][0]) => {
    if (!shop) return;
    addItem({
      id: product.id,
      productId: product.id,
      name: product.name,
      price: product.price,
      image: product.images[0]?.url || "",
      shopId: shop.id,
      shopName: shop.name,
      stock: 999999,
      requiresShippingAddress: product.requiresShippingAddress !== false,
    });
    router.push("/checkout");
  };

  const promoProducts = (Array.isArray(shop?.products) ? shop.products : []).filter((p) => p.comparePrice && p.comparePrice > p.price);
  const totalPages = Math.ceil(((Array.isArray(shop?.products) ? shop.products : []).length) / PRODUCTS_PER_PAGE);
  const paginatedProducts = (Array.isArray(shop?.products) ? shop.products : []).slice(
    (page - 1) * PRODUCTS_PER_PAGE,
    page * PRODUCTS_PER_PAGE
  ) || [];

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="h-48 animate-pulse bg-gray-200 sm:h-64" />
        <div className="mx-auto max-w-7xl px-4 py-8">
          <div className="flex items-end gap-4">
            <div className="h-24 w-24 animate-pulse rounded-2xl bg-gray-200 sm:h-32 sm:w-32" />
            <div className="flex-1 space-y-3">
              <div className="h-6 w-48 animate-pulse rounded bg-gray-200" />
              <div className="h-4 w-72 animate-pulse rounded bg-gray-200" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!shop) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <Store className="mx-auto h-16 w-16 text-gray-300" />
          <h2 className="mt-4 text-xl font-bold text-gray-900">Boutique introuvable</h2>
          <p className="mt-2 text-gray-500">Cette boutique n&apos;existe pas ou a été supprimée.</p>
          <Link href="/products" className="mt-6 inline-block rounded-xl bg-[#7126b6] px-6 py-2.5 text-sm font-semibold text-white hover:bg-[#5e1f9a]">
            Retour aux produits
          </Link>
        </div>
      </div>
    );
  }

  const avgRating = shop.averageRating;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Banner */}
      <div className="relative h-48 bg-gradient-to-r from-[#7126b6] to-[#7c3aed] sm:h-64">
        {shop.banner && (
          <img src={shop.banner} alt={shop.name} className="h-full w-full object-cover" />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />
        <div className="absolute bottom-4 right-4">
          <button
            onClick={handleShare}
            className="flex items-center gap-2 rounded-lg bg-white/20 px-3 py-2 text-sm font-medium text-white backdrop-blur hover:bg-white/30 transition-colors"
          >
            <Share2 className="h-4 w-4" />
            Partager
          </button>
        </div>
      </div>

      {/* Shop Info */}
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="relative -mt-16 mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
          {/* Logo */}
          <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-white bg-white shadow-lg sm:h-32 sm:w-32">
            {shop.logo ? (
              <img src={shop.logo} alt={shop.name} className="h-full w-full rounded-2xl object-cover" />
            ) : (
              <Store className="h-12 w-12 text-[#7126b6]" />
            )}
          </div>

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center gap-2 justify-center sm:justify-start">
              <h1 className="text-2xl font-bold text-[#0f172a]">{shop.name}</h1>
              {shop.isVerified && (
                <BadgeCheck className="h-5 w-5 text-[#7126b6]" />
              )}
            </div>
            {shop.description && (
              <p className="mt-1 text-sm text-gray-600 max-w-xl">{shop.description}</p>
            )}
            <div className="mt-2 flex flex-wrap items-center gap-4 text-sm text-gray-500 justify-center sm:justify-start">
              {avgRating > 0 && (
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                  {avgRating.toFixed(1)}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Package className="h-4 w-4" />
                {shop._count.products} produits
              </span>
              <span className="flex items-center gap-1">
                <Heart className="h-4 w-4" />
                {followerCount} abonnés
              </span>
              {shop.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {shop.city}{shop.country ? `, ${shop.country}` : ""}
                </span>
              )}
            </div>
          </div>

          {/* Follow Button */}
          <button
            onClick={handleFollow}
            className={`flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold transition-all ${
              isFollowing
                ? "border-2 border-gray-200 bg-white text-gray-700 hover:bg-gray-50"
                : "bg-[#7126b6] text-white shadow-lg shadow-[#7126b6]/20 hover:bg-[#5e1f9a]"
            }`}
          >
            <Heart className={`h-4 w-4 ${isFollowing ? "fill-current" : ""}`} />
            {isFollowing ? "Suivie" : "Suivre cette boutique"}
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex gap-6">
            {([
              { key: "all", label: "Tous les produits", count: shop.products.length },
              { key: "promos", label: "Promotions", count: promoProducts.length },
              { key: "reviews", label: "Avis", count: shop.reviews.length },
            ] as const).map((tab) => (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); setPage(1); }}
                className={`relative pb-3 text-sm font-medium transition-colors ${
                  activeTab === tab.key
                    ? "text-[#7126b6]"
                    : "text-gray-500 hover:text-gray-700"
                }`}
              >
                {tab.label}
                <span className="ml-1.5 text-xs text-gray-400">({tab.count})</span>
                {activeTab === tab.key && (
                  <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[#7126b6]" />
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="py-8">
          {/* All Products Tab */}
          {activeTab === "all" && (
            <>
              {paginatedProducts.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-sm text-gray-500">Aucun produit pour le moment</p>
                </div>
              ) : (
                <>
                  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                    {paginatedProducts.map((product) => (
                      <div
                        key={product.id}
                        className="group rounded-xl border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-md"
                      >
                        <Link href={`/product/${product.slug}`}>
                          <div className="aspect-square overflow-hidden bg-gray-100">
                            {product.images[0] ? (
                              <img
                                src={product.images[0].url}
                                alt={product.images[0].alt || product.name}
                                className="h-full w-full object-cover transition-transform group-hover:scale-105"
                              />
                            ) : (
                              <div className="flex h-full w-full items-center justify-center">
                                <Package className="h-12 w-12 text-gray-300" />
                              </div>
                            )}
                          </div>
                        </Link>
                        <div className="p-4">
                          <Link href={`/product/${product.slug}`}>
                            <h3 className="text-sm font-medium text-[#0f172a] line-clamp-2 hover:text-[#7126b6]">
                              {product.name}
                            </h3>
                          </Link>
                          <div className="mt-2 flex items-center gap-2">
                            <span className="text-base font-bold text-[#7126b6]">
                              {formatPrice(product.price)}
                            </span>
                            {product.comparePrice && product.comparePrice > product.price && (
                              <span className="text-xs text-gray-400 line-through">
                                {formatPrice(product.comparePrice)}
                              </span>
                            )}
                          </div>
                          {product.productType === "PHYSICAL" ? (
                            <button
                              onClick={() => addToCart(product)}
                              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f172a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e293b] transition-colors"
                            >
                              <ShoppingCart className="h-3.5 w-3.5" />
                              Ajouter au panier
                            </button>
                          ) : (
                            <button
                              onClick={() => handleBuyNow(product)}
                              className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors"
                              style={{ backgroundColor: product.ctaColor || "#7126b6" }}
                            >
                              {product.ctaText || "Acheter maintenant"}
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  {totalPages > 1 && (
                    <div className="mt-8 flex items-center justify-center gap-2">
                      <button
                        onClick={() => setPage((p) => Math.max(1, p - 1))}
                        disabled={page === 1}
                        className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </button>
                      {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
                        <button
                          key={p}
                          onClick={() => setPage(p)}
                          className={`h-9 w-9 rounded-lg text-sm font-medium transition-colors ${
                            p === page
                              ? "bg-[#7126b6] text-white"
                              : "border border-gray-200 bg-white text-gray-600 hover:bg-gray-50"
                          }`}
                        >
                          {p}
                        </button>
                      ))}
                      <button
                        onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                        disabled={page === totalPages}
                        className="rounded-lg border border-gray-200 bg-white p-2 text-gray-600 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <ChevronRight className="h-4 w-4" />
                      </button>
                    </div>
                  )}
                </>
              )}
            </>
          )}

          {/* Promos Tab */}
          {activeTab === "promos" && (
            <>
              {promoProducts.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                  <Package className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-sm text-gray-500">Aucune promotion en cours</p>
                </div>
              ) : (
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {promoProducts.map((product) => (
                    <div
                      key={product.id}
                      className="group rounded-xl border border-gray-200 bg-white overflow-hidden transition-shadow hover:shadow-md"
                    >
                      <Link href={`/product/${product.slug}`}>
                        <div className="relative aspect-square overflow-hidden bg-gray-100">
                          {product.images[0] ? (
                            <img
                              src={product.images[0].url}
                              alt={product.images[0].alt || product.name}
                              className="h-full w-full object-cover transition-transform group-hover:scale-105"
                            />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center">
                              <Package className="h-12 w-12 text-gray-300" />
                            </div>
                          )}
                          <div className="absolute top-2 left-2 rounded-lg bg-red-500 px-2 py-1 text-xs font-bold text-white">
                            -{Math.round(((product.comparePrice! - product.price) / product.comparePrice!) * 100)}%
                          </div>
                        </div>
                      </Link>
                      <div className="p-4">
                        <Link href={`/product/${product.slug}`}>
                          <h3 className="text-sm font-medium text-[#0f172a] line-clamp-2 hover:text-[#7126b6]">
                            {product.name}
                          </h3>
                        </Link>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="text-base font-bold text-[#7126b6]">
                            {formatPrice(product.price)}
                          </span>
                          {product.comparePrice && product.comparePrice > product.price && (
                            <span className="text-xs text-gray-400 line-through">
                              {formatPrice(product.comparePrice)}
                            </span>
                          )}
                        </div>
                        {product.productType === "PHYSICAL" ? (
                          <button
                            onClick={() => addToCart(product)}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg bg-[#0f172a] px-4 py-2 text-xs font-semibold text-white hover:bg-[#1e293b] transition-colors"
                          >
                            <ShoppingCart className="h-3.5 w-3.5" />
                            Ajouter au panier
                          </button>
                        ) : (
                          <button
                            onClick={() => handleBuyNow(product)}
                            className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold text-white transition-colors"
                            style={{ backgroundColor: product.ctaColor || "#7126b6" }}
                          >
                            {product.ctaText || "Acheter maintenant"}
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          )}

          {/* Reviews Tab */}
          {activeTab === "reviews" && (
            <>
              {shop.reviews.length === 0 ? (
                <div className="rounded-xl border border-gray-200 bg-white p-12 text-center">
                  <MessageSquare className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="mt-4 text-sm text-gray-500">Aucun avis pour le moment</p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="rounded-xl border border-gray-200 bg-white p-6">
                    <div className="flex items-center gap-4">
                      <div className="text-center">
                        <p className="text-3xl font-bold text-[#0f172a]">{avgRating.toFixed(1)}</p>
                        <div className="mt-1 flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-4 w-4 ${
                                s <= Math.round(avgRating)
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                        <p className="mt-1 text-xs text-gray-500">{shop.reviews.length} avis</p>
                      </div>
                    </div>
                  </div>

                  {shop.reviews.map((review) => (
                    <div key={review.id} className="rounded-xl border border-gray-200 bg-white p-5">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[#e0e7ff] text-sm font-bold text-[#0f172a]">
                            {review.user.image ? (
                              <img
                                src={review.user.image}
                                alt=""
                                className="h-9 w-9 rounded-full object-cover"
                              />
                            ) : (
                              review.user.name?.charAt(0)?.toUpperCase() || "U"
                            )}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-[#0f172a]">
                              {review.user.name || "Utilisateur"}
                            </p>
                            <p className="text-xs text-gray-500">
                              {new Date(review.createdAt).toLocaleDateString("fr-FR", {
                                day: "numeric",
                                month: "long",
                                year: "numeric",
                              })}
                            </p>
                          </div>
                        </div>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`h-3.5 w-3.5 ${
                                s <= review.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          ))}
                        </div>
                      </div>
                      {review.comment && (
                        <p className="mt-3 text-sm text-gray-600 leading-relaxed">
                          {review.comment}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </>
          )}
        </div>

        {/* Contact Section — only if vendor opted in */}
        {shop.showPublicContact && (shop.phone || shop.email || shop.address) && (
          <div className="mb-12 rounded-xl border border-gray-200 bg-white p-6">
            <h3 className="text-lg font-bold text-[#0f172a]">Contact</h3>
            <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {shop.phone && (
                <a
                  href={`tel:${shop.phone}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-green-50">
                    <Phone className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Téléphone</p>
                    <p className="text-sm font-medium text-[#0f172a]">{shop.phone}</p>
                  </div>
                  <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
                </a>
              )}
              {shop.email && (
                <a
                  href={`mailto:${shop.email}`}
                  className="flex items-center gap-3 rounded-lg border border-gray-100 p-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-50">
                    <Mail className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Email</p>
                    <p className="text-sm font-medium text-[#0f172a]">{shop.email}</p>
                  </div>
                  <ExternalLink className="ml-auto h-4 w-4 text-gray-400" />
                </a>
              )}
              {shop.address && (
                <div className="flex items-center gap-3 rounded-lg border border-gray-100 p-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-purple-50">
                    <MapPinned className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-xs text-gray-500">Adresse</p>
                    <p className="text-sm font-medium text-[#0f172a]">
                      {shop.address}
                      {shop.city ? `, ${shop.city}` : ""}
                      {shop.country ? `, ${shop.country}` : ""}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
