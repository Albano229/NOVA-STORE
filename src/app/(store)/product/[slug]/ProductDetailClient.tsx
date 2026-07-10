"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ShoppingCart, Store, Star, Check, Download, FileText,
  ShieldCheck, Calendar, MapPin, Users, Key, Truck, Clock, Tag,
  ChevronRight, Heart, Scale, Zap,
} from "lucide-react";
import ReviewSection from "@/components/reviews/ReviewSection";
import { Button } from "@/components/ui/button";
import { formatPrice } from "@/lib/utils";
import { useCartStore } from "@/stores/cart";
import { useCompareStore } from "@/stores/compare";
import { useSession } from "next-auth/react";
import toast from "react-hot-toast";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";

interface ProductVariant {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  stock: number;
  image: string | null;
  options: Record<string, string> | null;
  isActive: boolean;
}

interface SimilarProduct {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  images: { url: string; alt: string | null }[];
  avgRating: number;
  reviewCount: number;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  shortDescription: string | null;
  price: number;
  comparePrice: number | null;
  stock: number;
  productType: string;
  brand: string | null;
  avgRating: number;
  reviewCount: number;
  soldCount: number;
  postPurchaseInstructions: string | null;
  warranty: string | null;
  returnPolicy: string | null;
  videoUrl: string | null;
  ctaText: string | null;
  ctaColor: string | null;
  shop: { id: string; name: string; slug: string; logo: string | null; isVerified: boolean };
  images: { id: string; url: string; alt: string | null; position: number }[];
  category?: { id: string; name: string; slug: string } | null;
  digitalFile?: { fileUrl: string | null; fileName: string | null; maxDownloads: number | null; downloadCount: number } | null;
  physicalOpt?: { shippingEnabled: boolean; shippingCost: number | null } | null;
  requiresShippingAddress?: boolean;
  variants?: ProductVariant[];
  variantOptions?: { name: string; values: string[] }[];
  similarProducts?: SimilarProduct[];
}

interface PurchaseCheck {
  hasPurchased: boolean;
  orderId?: string;
  downloadUrl?: string;
  accessGranted?: boolean;
}

const PRODUCT_TYPE_LABELS: Record<string, { icon: typeof Store; label: string; color: string }> = {
  PHYSICAL: { icon: Truck, label: "Produit physique", color: "blue" },
  DIGITAL: { icon: Download, label: "Produit numérique", color: "purple" },
  SERVICE: { icon: Calendar, label: "Service", color: "emerald" },
  COMMUNITY: { icon: Users, label: "Communauté", color: "orange" },
  BUNDLE: { icon: Tag, label: "Pack / Bundle", color: "pink" },
  RESERVATION: { icon: Clock, label: "Réservation", color: "amber" },
};

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [purchaseCheck, setPurchaseCheck] = useState<PurchaseCheck | null>(null);
  const [checkingPurchase, setCheckingPurchase] = useState(true);
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null);
  const [selectedOptions, setSelectedOptions] = useState<Record<string, string>>({});
  const addItem = useCartStore((s) => s.addItem);
  const { data: session } = useSession();
  const { addProduct } = useRecentlyViewed();
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [togglingWishlist, setTogglingWishlist] = useState(false);
  const { addProduct: addToCompare, isInCompare, removeProduct: removeFromCompare } = useCompareStore();

  const hasVariants = (product.variants?.length || 0) > 0;

  useEffect(() => {
    if (session?.user) {
      fetch(`/api/purchases/check?productId=${product.id}`)
        .then((r) => r.json())
        .then((data) => {
          setPurchaseCheck(data);
          setCheckingPurchase(false);
        })
        .catch(() => setCheckingPurchase(false));

      fetch("/api/wishlist")
        .then((r) => r.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setIsInWishlist(data.some((w: any) => w.productId === product.id));
          }
        })
        .catch(() => {});
    } else {
      setCheckingPurchase(false);
    }
  }, [session, product.id]);

  const handleToggleWishlist = async () => {
    if (!session?.user) {
      toast.error("Connectez-vous pour ajouter à vos favoris");
      return;
    }
    setTogglingWishlist(true);
    try {
      if (isInWishlist) {
        await fetch("/api/wishlist", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ productId: product.id }),
        });
        setIsInWishlist(false);
        toast.success("Retiré de la liste");
      } else {
        await fetch("/api/wishlist", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            productId: product.id,
            variantId: selectedVariant?.id || null,
          }),
        });
        setIsInWishlist(true);
        toast.success("Ajouté à la liste !");
      }
    } catch {
      toast.error("Erreur");
    } finally {
      setTogglingWishlist(false);
    }
  };

  useEffect(() => {
    if (!hasVariants) {
      setSelectedVariant(null);
      return;
    }
    const match = product.variants?.find((v) => {
      if (!v.options) return false;
      const opts = v.options as Record<string, string>;
      return Object.entries(selectedOptions).every(([k, val]) => opts[k] === val);
    });
    setSelectedVariant(match || null);
  }, [selectedOptions, product.variants, hasVariants]);

  useEffect(() => {
    addProduct({
      id: product.id,
      name: product.name,
      slug: product.slug,
      price: product.price,
      image: product.images[0]?.url || "",
      shopName: product.shop.name,
    });
  }, [product.id, product.name, product.slug, product.price, product.images, product.shop.name, addProduct]);

  const displayPrice = selectedVariant?.price ?? product.price;
  const displayComparePrice = product.comparePrice;
  const displayStock = selectedVariant?.stock ?? product.stock;
  const displayImage = selectedVariant?.image || product.images[selectedImage]?.url;

  const handleOptionSelect = (optionName: string, value: string) => {
    setSelectedOptions((prev) => ({ ...prev, [optionName]: value }));
  };

  const handleAddToCart = () => {
    const isPhysical = product.productType === "PHYSICAL";
    addItem({
      id: "",
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      price: displayPrice,
      image: displayImage || "",
      shopId: product.shop.id,
      shopName: product.shop.name,
      stock: isPhysical ? displayStock : 999999,
      quantity,
      requiresShippingAddress: product.requiresShippingAddress !== false,
      selectedOptions: selectedVariant?.options || undefined,
    });
    toast.success("Ajouté au panier !");
  };

  const handleBuyNow = () => {
    const isPhysical = product.productType === "PHYSICAL";
    addItem({
      id: "",
      productId: product.id,
      variantId: selectedVariant?.id,
      name: product.name,
      price: displayPrice,
      image: displayImage || "",
      shopId: product.shop.id,
      shopName: product.shop.name,
      stock: isPhysical ? displayStock : 999999,
      quantity,
      requiresShippingAddress: product.requiresShippingAddress !== false,
      selectedOptions: selectedVariant?.options || undefined,
    });
    router.push("/checkout");
  };

  const hasAccess = purchaseCheck?.hasPurchased || purchaseCheck?.accessGranted;
  const typeInfo = PRODUCT_TYPE_LABELS[product.productType] || PRODUCT_TYPE_LABELS.PHYSICAL;
  const TypeIcon = typeInfo.icon;

  return (
    <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">

      {/* ── Breadcrumb ── */}
      <nav className="mb-6 flex flex-wrap items-center gap-1 text-xs text-gray-500 sm:text-sm">
        <Link href="/" className="hover:text-[#7126b6] transition-colors">Accueil</Link>
        <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        <Link href="/products" className="hover:text-[#7126b6] transition-colors">Produits</Link>
        {product.category && (
          <>
            <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
            <Link href={`/category/${product.category.slug}`} className="hover:text-[#7126b6] transition-colors">
              {product.category.name}
            </Link>
          </>
        )}
        <ChevronRight className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
        <span className="text-[#0f172a] truncate min-w-0">{product.name}</span>
      </nav>

      {/* ════════════════════════════════════════════════════════
          SECTION 1 — Gallery + Product Info (two-column)
         ════════════════════════════════════════════════════════ */}
      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">

        {/* ── Gallery ── */}
        <div className="space-y-3 sm:space-y-4">
          <div className="aspect-square overflow-hidden rounded-2xl border border-gray-200 bg-gray-100">
            {product.images[selectedImage] ? (
              <img
                src={product.images[selectedImage].url}
                alt={product.images[selectedImage].alt || product.name}
                className="h-full w-full object-cover transition-transform duration-300"
              />
            ) : (
              <div className="flex h-full items-center justify-center">
                <Store className="h-20 w-20 text-gray-300 sm:h-28 sm:w-28" />
              </div>
            )}
          </div>

          {product.images.length > 1 && (
            <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
              {product.images.map((img, i) => (
                <button
                  key={img.id}
                  onClick={() => setSelectedImage(i)}
                  className={`h-16 w-16 flex-shrink-0 overflow-hidden rounded-xl border-2 transition-all sm:h-20 sm:w-20 ${
                    selectedImage === i
                      ? "border-[#7126b6] ring-2 ring-purple-200"
                      : "border-gray-200 hover:border-gray-300"
                  }`}
                >
                  <img src={img.url} alt={img.alt || ""} className="h-full w-full object-cover" />
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ── Product Info ── */}
        <div className="flex flex-col">

          {/* Shop link */}
          <Link
            href={`/shops/${product.shop.slug}`}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-[#7126b6] hover:underline sm:text-sm"
          >
            {product.shop.isVerified && <ShieldCheck className="h-3.5 w-3.5" />}
            {product.shop.name}
          </Link>

          {/* Product name */}
          <h1 className="mt-2 text-2xl font-bold text-[#0f172a] sm:text-3xl lg:text-4xl">
            {product.name}
          </h1>

          {/* Short description */}
          {product.shortDescription && (
            <p className="mt-2 text-sm text-gray-500 sm:text-base">
              {product.shortDescription}
            </p>
          )}

          {/* Rating + sold */}
          {product.avgRating > 0 && (
            <div className="mt-3 flex items-center gap-2 sm:mt-4">
              <div className="flex items-center gap-0.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Star
                    key={i}
                    className={`h-4 w-4 ${
                      i < Math.floor(product.avgRating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-gray-300"
                    }`}
                  />
                ))}
              </div>
              <span className="text-sm text-gray-500">
                {product.avgRating.toFixed(1)} ({product.reviewCount} avis)
              </span>
              <span className="text-gray-300">·</span>
              <span className="text-sm text-gray-500">{product.soldCount} vendus</span>
            </div>
          )}

          {/* Price */}
          <div className="mt-4 flex flex-wrap items-baseline gap-3 sm:mt-5">
            <span className="text-3xl font-bold text-[#0f172a] sm:text-4xl">
              {formatPrice(displayPrice)}
            </span>
            {displayComparePrice && displayComparePrice > displayPrice && (
              <>
                <span className="text-base text-gray-400 line-through sm:text-lg">
                  {formatPrice(displayComparePrice)}
                </span>
                <span className="rounded-lg bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 sm:text-sm">
                  -{Math.round(((displayComparePrice - displayPrice) / displayComparePrice) * 100)}%
                </span>
              </>
            )}
          </div>

          {/* Variants */}
          {hasVariants && product.variantOptions && product.variantOptions.length > 0 && (
            <div className="mt-5 space-y-4 sm:mt-6">
              {product.variantOptions.map((opt) => (
                <div key={opt.name}>
                  <p className="mb-2 text-sm font-medium text-[#0f172a]">{opt.name}</p>
                  <div className="flex flex-wrap gap-2">
                    {opt.values.map((val) => {
                      const isSelected = selectedOptions[opt.name] === val;
                      const isAvailable = product.variants?.some((v) => {
                        if (!v.options || !v.isActive) return false;
                        if (v.options[opt.name] !== val) return false;
                        const otherSelections = Object.entries(selectedOptions).filter(([k]) => k !== opt.name);
                        return otherSelections.every(([k, v2]) => v.options?.[k] === v2) && (product.productType !== "PHYSICAL" || v.stock > 0);
                      });
                      return (
                        <button
                          key={val}
                          onClick={() => handleOptionSelect(opt.name, val)}
                          disabled={!isAvailable}
                          className={`rounded-lg border px-4 py-2 text-sm font-medium transition ${
                            isSelected
                              ? "border-[#7126b6] bg-purple-50 text-[#7126b6] ring-1 ring-[#7126b6]"
                              : isAvailable
                              ? "border-gray-200 text-gray-700 hover:border-[#7126b6] hover:text-[#7126b6]"
                              : "border-gray-100 text-gray-300 cursor-not-allowed"
                          }`}
                        >
                          {val}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Type badge */}
          <div className="mt-4 sm:mt-5">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
              <TypeIcon className="h-3.5 w-3.5" />
              {typeInfo.label}
            </span>
            {product.brand && (
              <span className="ml-2 inline-flex items-center rounded-full bg-gray-100 px-3 py-1 text-xs font-medium text-gray-600">
                {product.brand}
              </span>
            )}
          </div>

          {/* Stock — PHYSICAL only */}
          {product.productType === "PHYSICAL" && (
            <div className="mt-3 sm:mt-4">
              {displayStock > 0 ? (
                <span className="inline-flex items-center gap-1.5 text-sm font-medium text-green-600">
                  <Check className="h-4 w-4" />
                  En stock ({displayStock} disponible{displayStock > 1 ? "s" : ""})
                </span>
              ) : (
                <span className="text-sm font-medium text-red-600">Rupture de stock</span>
              )}
            </div>
          )}

          {/* Quantity + CTA Buttons */}
          {(product.productType !== "PHYSICAL" || displayStock > 0) && (
            <div className="mt-5 sm:mt-6">
              <div className="flex items-center gap-3 sm:gap-4">
                {product.productType === "PHYSICAL" && (
                  <div className="flex items-center rounded-xl border border-gray-300">
                    <button
                      onClick={() => setQuantity(Math.max(1, quantity - 1))}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors sm:px-4 sm:py-2.5"
                    >
                      -
                    </button>
                    <span className="min-w-[40px] text-center text-sm font-semibold sm:min-w-[48px]">{quantity}</span>
                    <button
                      onClick={() => setQuantity(Math.min(displayStock, quantity + 1))}
                      className="px-3 py-2 text-gray-600 hover:bg-gray-50 transition-colors sm:px-4 sm:py-2.5"
                    >
                      +
                    </button>
                  </div>
                )}
                <button
                  onClick={handleToggleWishlist}
                  disabled={togglingWishlist}
                  className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border transition-all flex-shrink-0 ${
                    isInWishlist
                      ? "border-red-200 bg-red-50 text-red-500 hover:bg-red-100"
                      : "border-gray-300 text-gray-400 hover:border-red-300 hover:text-red-400 hover:bg-red-50"
                  } disabled:opacity-50`}
                  title={isInWishlist ? "Retirer des favoris" : "Ajouter aux favoris"}
                >
                  <Heart className={`h-5 w-5 sm:h-6 sm:w-6 ${isInWishlist ? "fill-red-500" : ""}`} />
                </button>
                <button
                  onClick={() => {
                    if (isInCompare(product.id)) {
                      removeFromCompare(product.id);
                      toast.success("Retiré de la comparaison");
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
                      toast.success("Ajouté à la comparaison");
                    }
                  }}
                  className={`flex h-11 w-11 sm:h-12 sm:w-12 items-center justify-center rounded-xl border transition-all flex-shrink-0 ${
                    isInCompare(product.id)
                      ? "border-[#7126b6] bg-[#7126b6]/5 text-[#7126b6]"
                      : "border-gray-300 text-gray-400 hover:border-[#7126b6] hover:text-[#7126b6] hover:bg-[#7126b6]/5"
                  }`}
                  title={isInCompare(product.id) ? "Retirer de la comparaison" : "Comparer"}
                >
                  <Scale className={`h-5 w-5 sm:h-6 sm:w-6 ${isInCompare(product.id) ? "fill-[#7126b6]" : ""}`} />
                </button>
              </div>

              {product.productType === "PHYSICAL" ? (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <Button
                    onClick={handleAddToCart}
                    className="h-12 sm:h-13 text-sm sm:text-base font-semibold"
                    variant="outline"
                    disabled={hasVariants && !selectedVariant}
                  >
                    <ShoppingCart className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {hasVariants && !selectedVariant ? "Sélectionnez une variante" : "Ajouter au panier"}
                  </Button>
                  <Button
                    onClick={handleBuyNow}
                    className="h-12 sm:h-13 text-sm sm:text-base font-semibold bg-[#7126b6] hover:bg-[#5e1f9a]"
                    disabled={hasVariants && !selectedVariant}
                  >
                    <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    Acheter maintenant
                  </Button>
                </div>
              ) : (
                <div className="mt-4">
                  <Button
                    onClick={handleBuyNow}
                    className="h-12 sm:h-13 w-full text-sm sm:text-base font-semibold"
                    style={{ backgroundColor: product.ctaColor || "#7126b6" }}
                    disabled={hasVariants && !selectedVariant}
                  >
                    <Zap className="mr-2 h-4 w-4 sm:h-5 sm:w-5" />
                    {hasVariants && !selectedVariant
                      ? "Sélectionnez une variante"
                      : product.ctaText || "Acheter maintenant"}
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* Product-specific quick info */}
          <div className="mt-5 space-y-2 border-t border-gray-100 pt-5 sm:mt-6">
            {product.productType === "PHYSICAL" && product.physicalOpt?.shippingEnabled && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Truck className="h-4 w-4 text-gray-400" />
                Livraison {product.physicalOpt.shippingCost ? `— ${formatPrice(product.physicalOpt.shippingCost)}` : "gratuite"}
              </div>
            )}
            {product.productType === "DIGITAL" && product.digitalFile?.fileName && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Download className="h-4 w-4 text-gray-400" />
                Fichier : {product.digitalFile.fileName}
              </div>
            )}
            {product.productType === "RESERVATION" && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Calendar className="h-4 w-4 text-gray-400" />
                Places limitées — {product.stock} restante{product.stock > 1 ? "s" : ""}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════
          SECTION 2 — Full Description
         ════════════════════════════════════════════════════════ */}
      {product.description && (
        <section className="mt-10 sm:mt-14">
          <h2 className="text-lg font-bold text-[#0f172a] sm:text-xl">Description du produit</h2>
          <div className="mt-1 h-1 w-10 rounded-full bg-[#7126b6] sm:mt-2" />
          <div
            className="prose prose-gray prose-sm sm:prose-base mt-4 max-w-none text-gray-600"
            dangerouslySetInnerHTML={{ __html: product.description }}
          />
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          SECTION 3 — Warranty & Return
         ════════════════════════════════════════════════════════ */}
      {(product.warranty || product.returnPolicy) && (
        <section className="mt-8 grid gap-4 sm:mt-10 sm:grid-cols-2">
          {product.warranty && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-bold text-[#0f172a]">Garantie</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{product.warranty}</p>
            </div>
          )}
          {product.returnPolicy && (
            <div className="rounded-xl border border-gray-200 bg-white p-5">
              <h3 className="text-sm font-bold text-[#0f172a]">Politique de retour</h3>
              <p className="mt-2 text-sm leading-relaxed text-gray-600">{product.returnPolicy}</p>
            </div>
          )}
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          SECTION 4 — Reviews
         ════════════════════════════════════════════════════════ */}
      <section className="mt-10 sm:mt-14">
        <ReviewSection
          productId={product.id}
          initialAvgRating={product.avgRating}
          initialReviewCount={product.reviewCount}
          hasPurchased={hasAccess || false}
        />
      </section>

      {/* ════════════════════════════════════════════════════════
          SECTION 5 — Secure Content (post-purchase)
         ════════════════════════════════════════════════════════ */}
      {!checkingPurchase && hasAccess && (
        <section className="mt-10 sm:mt-14">
          <div className="rounded-2xl border-2 border-green-200 bg-gradient-to-br from-green-50 to-emerald-50 p-5 sm:p-6">
            <div className="flex items-center gap-2 mb-4">
              <ShieldCheck className="h-5 w-5 text-green-600" />
              <h2 className="text-base font-bold text-green-800 sm:text-lg">Contenu sécurisé — Accès confirmé</h2>
            </div>

            {product.productType === "DIGITAL" && (
              <div className="rounded-xl bg-white p-4 border border-green-100 shadow-sm">
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                      <Download className="h-6 w-6 text-green-600" />
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-[#0f172a]">Fichier à télécharger</p>
                      <p className="text-xs text-gray-500">{product.digitalFile?.fileName || "Fichier du produit"}</p>
                    </div>
                  </div>
                  <a
                    href={`/api/download?productId=${product.id}`}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700 transition"
                  >
                    <Download className="h-4 w-4" />
                    Télécharger
                  </a>
                </div>
                {product.digitalFile?.maxDownloads && (
                  <p className="mt-3 text-xs text-gray-400">
                    Téléchargements restants : {product.digitalFile.maxDownloads - (product.digitalFile.downloadCount || 0)}
                  </p>
                )}
              </div>
            )}

            {product.productType === "SERVICE" && (
              <div className="rounded-xl bg-white p-4 border border-green-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                    <Calendar className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">Coordonnées du prestataire</p>
                    <p className="text-xs text-gray-500">Contactez le vendeur pour planifier</p>
                  </div>
                </div>
              </div>
            )}

            {product.productType === "COMMUNITY" && (
              <div className="rounded-xl bg-white p-4 border border-green-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-100">
                    <Key className="h-6 w-6 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">Accès à la communauté</p>
                    <p className="text-xs text-gray-500">Lien d&apos;invitation affiché après vérification</p>
                  </div>
                </div>
              </div>
            )}

            {product.productType === "RESERVATION" && (
              <div className="rounded-xl bg-white p-4 border border-green-100 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-amber-100">
                    <MapPin className="h-6 w-6 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-[#0f172a]">Détails de la réservation</p>
                    <p className="text-xs text-gray-500">Lieu et horaires confirmés</p>
                  </div>
                </div>
              </div>
            )}

            {product.postPurchaseInstructions && (
              <div className="mt-4 rounded-xl bg-white p-4 border border-green-100 shadow-sm">
                <h3 className="flex items-center gap-2 text-sm font-semibold text-[#0f172a] mb-2">
                  <FileText className="h-4 w-4 text-[#7126b6]" />
                  Instructions post-achat
                </h3>
                <div
                  className="prose prose-sm text-sm text-gray-600"
                  dangerouslySetInnerHTML={{ __html: product.postPurchaseInstructions }}
                />
              </div>
            )}
          </div>
        </section>
      )}

      {/* Marketing CTA for non-buyers */}
      {!checkingPurchase && !hasAccess && product.ctaText && product.productType !== "PHYSICAL" && (
        <section className="mt-8 sm:mt-10">
          <div className="rounded-2xl border-2 border-gray-200 bg-gradient-to-br from-gray-50 to-white p-5 text-center sm:p-6">
            <p className="text-sm font-semibold text-[#0f172a]">
              {product.ctaText}
            </p>
            <Button
              className="mt-4"
              size="lg"
              style={{ backgroundColor: product.ctaColor || "#7126b6" }}
              onClick={handleBuyNow}
            >
              <Zap className="mr-2 h-4 w-4" />
              {product.ctaText}
            </Button>
          </div>
        </section>
      )}

      {/* ════════════════════════════════════════════════════════
          SECTION 6 — Similar Products
         ════════════════════════════════════════════════════════ */}
      {product.similarProducts && product.similarProducts.length > 0 && (
        <section className="mt-10 sm:mt-14">
          <h2 className="text-lg font-bold text-[#0f172a] sm:text-xl">Produits similaires</h2>
          <div className="mt-1 h-1 w-10 rounded-full bg-[#7126b6] sm:mt-2" />
          <p className="mt-2 text-sm text-gray-500">
            Découvrez d&apos;autres produits de <span className="font-medium text-[#7126b6]">{product.shop.name}</span>
          </p>

          <div className="mt-5 grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6">
            {product.similarProducts.map((item) => (
              <Link
                key={item.id}
                href={`/product/${item.slug}`}
                className="group rounded-xl border border-gray-200 bg-white p-3 transition-all hover:shadow-md hover:border-[#7126b6]/30 sm:p-4"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {item.images[0] ? (
                    <img
                      src={item.images[0].url}
                      alt={item.images[0].alt || item.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Store className="h-8 w-8 text-gray-300" />
                    </div>
                  )}
                </div>
                <h3 className="mt-2 line-clamp-2 text-xs font-medium text-[#0f172a] sm:text-sm">
                  {item.name}
                </h3>
                {item.avgRating > 0 && (
                  <div className="mt-1 flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    <span className="text-[10px] text-gray-500 sm:text-xs">
                      {item.avgRating.toFixed(1)}
                    </span>
                  </div>
                )}
                <div className="mt-1.5 flex items-baseline gap-1.5">
                  <span className="text-sm font-bold text-[#0f172a] sm:text-base">
                    {formatPrice(item.price)}
                  </span>
                  {item.comparePrice && item.comparePrice > item.price && (
                    <span className="text-[10px] text-gray-400 line-through sm:text-xs">
                      {formatPrice(item.comparePrice)}
                    </span>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
