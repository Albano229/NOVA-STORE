"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useCompareStore } from "@/stores/compare";
import { formatPrice } from "@/lib/utils";
import {
  X,
  Trash2,
  ShoppingBag,
  Star,
  Package,
  Loader2,
  Scale,
} from "lucide-react";
import toast from "react-hot-toast";

interface ProductData {
  id: string;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  description: string | null;
  brand: string | null;
  sku: string | null;
  stock: number;
  productType: string;
  weight: number | null;
  dimensions: string | null;
  categoryName: string | null;
  shopName: string | null;
  shopSlug: string | null;
  images: { url: string; alt: string }[];
  physicalOpt: { shippingEnabled: boolean; shippingCost: number | null } | null;
  digitalFile: { fileName: string; fileType: string; fileSize: number | null } | null;
  avgRating: number | null;
  reviewCount: number;
}

function RatingStars({ rating, count }: { rating: number | null; count: number }) {
  const avg = rating || 0;
  return (
    <div className="flex items-center gap-1">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((s) => (
          <Star
            key={s}
            className={`h-3.5 w-3.5 ${
              s <= avg ? "fill-yellow-400 text-yellow-400" : "text-gray-300"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500">
        {avg.toFixed(1)} ({count})
      </span>
    </div>
  );
}

export default function ComparePage() {
  const { items, removeProduct, clearAll } = useCompareStore();
  const [products, setProducts] = useState<ProductData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (items.length === 0) {
      setLoading(false);
      return;
    }
    const ids = items.map((i) => i.id).join(",");
    fetch(`/api/compare?ids=${ids}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [items]);

  if (items.length === 0 && !loading) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <Scale className="h-16 w-16 text-gray-300 mb-4" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Aucun produit à comparer
        </h1>
        <p className="text-gray-500 mb-6">
          Ajoutez des produits à la comparaison depuis la page produits
        </p>
        <Link
          href="/products"
          className="rounded-xl bg-[#7126b6] px-6 py-3 text-sm font-medium text-white hover:bg-[#5c1e96]"
        >
          Voir les produits
        </Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-8 w-8 animate-spin text-[#7126b6]" />
      </div>
    );
  }

  const rows: { label: string; key: string; render?: (p: ProductData) => React.ReactNode }[] = [
    {
      label: "Image",
      key: "image",
      render: (p) => (
        <Link href={`/product/${p.slug}`} className="block">
          <img
            src={p.images?.[0]?.url || "/placeholder.png"}
            alt={p.name}
            className="h-32 w-32 rounded-xl object-cover mx-auto"
          />
        </Link>
      ),
    },
    {
      label: "Nom",
      key: "name",
      render: (p) => (
        <Link href={`/product/${p.slug}`} className="text-sm font-semibold text-[#7126b6] hover:underline">
          {p.name}
        </Link>
      ),
    },
    {
      label: "Prix",
      key: "price",
      render: (p) => (
        <div>
          <span className="text-lg font-bold text-gray-900 dark:text-white">
            {formatPrice(p.price)}
          </span>
          {p.comparePrice && p.comparePrice > p.price && (
            <span className="ml-2 text-sm text-gray-400 line-through">
              {formatPrice(p.comparePrice)}
            </span>
          )}
        </div>
      ),
    },
    {
      label: "Note",
      key: "rating",
      render: (p) => <RatingStars rating={p.avgRating} count={p.reviewCount} />,
    },
    {
      label: "Catégorie",
      key: "category",
      render: (p) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {p.categoryName || "-"}
        </span>
      ),
    },
    {
      label: "Boutique",
      key: "shop",
      render: (p) => (
        <Link href={`/shops/${p.shopSlug}`} className="text-sm text-[#7126b6] hover:underline">
          {p.shopName}
        </Link>
      ),
    },
    {
      label: "Stock",
      key: "stock",
      render: (p) => (
        p.productType !== "PHYSICAL" ? (
          <span className="inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium bg-purple-100 text-purple-700">
            Illimité
          </span>
        ) : (
          <span
            className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${
              p.stock > 10
                ? "bg-green-100 text-green-700"
                : p.stock > 0
                ? "bg-yellow-100 text-yellow-700"
                : "bg-red-100 text-red-700"
            }`}
          >
            {p.stock > 0 ? `${p.stock} en stock` : "Rupture"}
          </span>
        )
      ),
    },
    {
      label: "Marque",
      key: "brand",
      render: (p) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {p.brand || "-"}
        </span>
      ),
    },
    {
      label: "Type",
      key: "type",
      render: (p) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {p.productType === "PHYSICAL" ? "Physique" : p.productType === "DIGITAL" ? "Digital" : "Service"}
        </span>
      ),
    },
    {
      label: "Poids",
      key: "weight",
      render: (p) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {p.weight ? `${p.weight} kg` : "-"}
        </span>
      ),
    },
    {
      label: "Livraison",
      key: "shipping",
      render: (p) => (
        <span className="text-sm text-gray-600 dark:text-gray-400">
          {p.physicalOpt?.shippingEnabled
            ? p.physicalOpt.shippingCost
              ? `${formatPrice(p.physicalOpt.shippingCost)} de frais`
              : "Gratuite"
            : "Non disponible"}
          {p.productType === "DIGITAL" ? "Instantanée" : ""}
        </span>
      ),
    },
    {
      label: "Description",
      key: "description",
      render: (p) => (
        <p className="text-xs text-gray-500 line-clamp-4 max-w-[200px]">
          {p.description || "Aucune description"}
        </p>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            Comparer les produits
          </h1>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {products.length} produit{products.length > 1 ? "s" : ""} sélectionné{products.length > 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => {
            clearAll();
            toast.success("Comparaison vidée");
          }}
          className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
        >
          <Trash2 className="h-4 w-4" />
          Tout supprimer
        </button>
      </div>

      {/* Comparison Table */}
      <div className="overflow-x-auto rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <table className="w-full">
          <thead>
            <tr>
              <th className="w-24 sm:w-40 p-4 text-left text-sm font-medium text-gray-500 bg-gray-50 dark:bg-gray-700/50" />
              {products.map((p) => (
                <th key={p.id} className="p-4 text-center min-w-[180px] sm:min-w-[220px]">
                  <div className="relative">
                    <button
                      onClick={() => {
                        removeProduct(p.id);
                        toast.success("Retiré de la comparaison");
                      }}
                      className="absolute -right-1 -top-1 rounded-full bg-red-50 p-1 text-red-500 hover:bg-red-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                </th>
              ))}
              {products.length < 4 && (
                <th className="p-4 text-center min-w-[220px]">
                  <Link
                    href="/products"
                    className="flex h-32 flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 text-gray-400 hover:border-[#7126b6] hover:text-[#7126b6] transition-colors"
                  >
                    <Package className="h-6 w-6 mb-1" />
                    <span className="text-xs">Ajouter</span>
                  </Link>
                </th>
              )}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t border-gray-100 dark:border-gray-700/50">
                <td className="p-4 text-sm font-medium text-gray-500 bg-gray-50 dark:bg-gray-700/50">
                  {row.label}
                </td>
                {products.map((p) => (
                  <td key={p.id} className="p-4 text-center">
                    {row.render ? row.render(p) : <span className="text-sm text-gray-600">-</span>}
                  </td>
                ))}
                {products.length < 4 && <td />}
              </tr>
            ))}
            {/* Add to Cart row */}
            <tr className="border-t border-gray-200 dark:border-gray-700">
              <td className="p-4 text-sm font-medium text-gray-500 bg-gray-50 dark:bg-gray-700/50">
                Action
              </td>
              {products.map((p) => (
                <td key={p.id} className="p-4 text-center">
                  <Link
                    href={`/product/${p.slug}`}
                    className="inline-flex items-center gap-2 rounded-xl bg-[#7126b6] px-4 py-2 text-sm font-medium text-white hover:bg-[#5c1e96]"
                  >
                    <ShoppingBag className="h-4 w-4" />
                    Voir le produit
                  </Link>
                </td>
              ))}
              {products.length < 4 && <td />}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
