"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { formatPrice } from "@/lib/utils";
import Link from "next/link";
import { Heart, ShoppingCart, Store } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import toast from "react-hot-toast";

interface WishlistItem {
  id: string;
  productId: string;
  variantId: string | null;
  name: string;
  slug: string;
  price: number;
  comparePrice: number | null;
  avgRating: number;
  reviewCount: number;
  image: string | null;
  shop: { id: string; name: string; slug: string };
  createdAt: string;
}

export default function WishlistPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);

  const [items, setItems] = useState<WishlistItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [removing, setRemoving] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/auth/login");
      return;
    }
    if (status === "authenticated") {
      fetch("/api/wishlist")
        .then((res) => res.json())
        .then((data) => {
          setItems(data);
          setLoading(false);
        })
        .catch(() => setLoading(false));
    }
  }, [status, router]);

  const handleRemove = async (productId: string) => {
    setRemoving(productId);
    try {
      await fetch("/api/wishlist", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ productId }),
      });
      setItems((prev) => prev.filter((i) => i.productId !== productId));
      toast.success("Retiré de la liste");
    } catch {
      toast.error("Erreur lors de la suppression");
    } finally {
      setRemoving(null);
    }
  };

  const handleAddToCart = (item: WishlistItem) => {
    addItem({
      id: "",
      productId: item.productId,
      variantId: item.variantId ?? undefined,
      name: item.name,
      price: item.price,
      image: item.image || "",
      shopId: item.shop.id,
      shopName: item.shop.name,
      stock: 99,
      quantity: 1,
    });
    toast.success("Ajouté au panier !");
  };

  if (loading || status === "loading") {
    return (
      <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[#0f172a]">Ma liste de souhaits</h1>
      <p className="mt-1 text-sm text-gray-500">
        {items.length} article{items.length > 1 ? "s" : ""}
      </p>

      {items.length === 0 ? (
        <div className="mt-12 rounded-xl border border-gray-200 bg-white p-12 text-center">
          <Heart className="mx-auto h-12 w-12 text-gray-300" />
          <h3 className="mt-4 text-lg font-medium text-[#0f172a]">Vide pour l&apos;instant</h3>
          <p className="mt-1 text-sm text-gray-500">
            Ajoutez des produits à votre liste de souhaits.
          </p>
          <Link
            href="/products"
            className="mt-4 inline-block text-sm font-medium text-[#7126b6] hover:underline"
          >
            Explorer la boutique
          </Link>
        </div>
      ) : (
        <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item) => (
            <div
              key={item.id}
              className="group rounded-xl border border-gray-200 bg-white overflow-hidden transition-all hover:shadow-md hover:border-[#7126b6]/30"
            >
              <Link href={`/product/${item.slug}`}>
                <div className="aspect-square overflow-hidden bg-gray-100">
                  {item.image ? (
                    <img
                      src={item.image}
                      alt={item.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Store className="h-12 w-12 text-gray-300" />
                    </div>
                  )}
                </div>
              </Link>
              <div className="p-4">
                <Link href={`/product/${item.slug}`}>
                  <h3 className="line-clamp-2 text-sm font-medium text-[#0f172a] hover:text-[#7126b6] transition-colors">
                    {item.name}
                  </h3>
                </Link>
                <p className="mt-1 text-xs text-gray-500">{item.shop.name}</p>
                <div className="mt-2 flex items-baseline gap-2">
                  <span className="text-base font-bold text-[#0f172a]">
                    {formatPrice(item.price)}
                  </span>
                  {item.comparePrice && item.comparePrice > item.price && (
                    <span className="text-xs text-gray-400 line-through">
                      {formatPrice(item.comparePrice)}
                    </span>
                  )}
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    onClick={() => handleAddToCart(item)}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-[#7126b6] px-3 py-2 text-xs font-medium text-white hover:bg-[#5e1f9a] transition-colors"
                  >
                    <ShoppingCart className="h-3.5 w-3.5" />
                    Ajouter
                  </button>
                  <button
                    onClick={() => handleRemove(item.productId)}
                    disabled={removing === item.productId}
                    className="rounded-lg border border-gray-200 px-3 py-2 text-xs font-medium text-red-500 hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <Heart className="h-3.5 w-3.5 fill-red-500" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
