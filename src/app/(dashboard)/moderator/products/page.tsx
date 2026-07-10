"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import toast from "react-hot-toast";
import { CheckCircle, XCircle, Search, Package, ExternalLink } from "lucide-react";

interface Product {
  id: string;
  name: string;
  slug: string;
  price: number;
  productType: string;
  isActive: boolean;
  isHidden: boolean;
  createdAt: string;
  shop: { name: string; slug: string };
  category: { name: string } | null;
  images: { url: string }[];
}

export default function ModeratorProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<"ALL" | "ACTIVE" | "INACTIVE">("ALL");

  useEffect(() => {
    fetch("/api/moderator/products")
      .then((r) => r.json())
      .then((data) => setProducts(Array.isArray(data) ? data : []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateProduct = async (id: string, data: Record<string, any>) => {
    try {
      const res = await fetch(`/api/moderator/products/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setProducts((prev) => prev.map((p) => (p.id === id ? { ...p, ...data } : p)));
        toast.success(data.isActive ? "Produit activé" : "Produit désactivé");
      }
    } catch (_e) {
      toast.error("Erreur");
    }
  };

  const filtered = (Array.isArray(products) ? products : []).filter((p) => {
    const searchLower = search.toLowerCase();
    const matchSearch = p.name.toLowerCase().includes(searchLower) || p.shop.name.toLowerCase().includes(searchLower);
    const matchFilter = filter === "ALL" || (filter === "ACTIVE" ? p.isActive : !p.isActive);
    return matchSearch && matchFilter;
  });

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        {[1, 2, 3].map((i) => <div key={i} className="h-20 animate-pulse rounded-xl bg-gray-200" />)}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f172a]">Produits à valider</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{filtered.length} produit(s)</p>

      <div className="mt-6 flex gap-3">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400 dark:text-gray-500" />
          <Input id="search" placeholder="Rechercher..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
        </div>
        <div className="flex gap-2">
          {(["ALL", "ACTIVE", "INACTIVE"] as const).map((f) => (
            <button key={f} onClick={() => setFilter(f)} className={`rounded-lg px-3 py-2 text-xs font-medium ${filter === f ? "bg-[#0f172a] text-white" : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200"}`}>
              {f === "ALL" ? "Tous" : f === "ACTIVE" ? "Actifs" : "Inactifs"}
            </button>
          ))}
        </div>
      </div>

      <div className="mt-6 space-y-3">
        {filtered.map((product) => (
          <div key={product.id} className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                {product.images[0] ? (
                  <img src={product.images[0].url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center"><Package className="h-5 w-5 text-gray-400 dark:text-gray-500" /></div>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="truncate text-sm font-semibold text-[#0f172a]">{product.name}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400">{product.shop.name} · {product.category?.name || "Sans catégorie"}</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${product.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {product.isActive ? "Actif" : "Inactif"}
              </span>
              <div className="flex items-center gap-2">
                <Button size="sm" variant={product.isActive ? "destructive" : "default"} onClick={() => updateProduct(product.id, { isActive: !product.isActive })}>
                  {product.isActive ? <XCircle className="h-4 w-4" /> : <CheckCircle className="h-4 w-4" />}
                  {product.isActive ? "Suspendre" : "Activer"}
                </Button>
                <a href={`/product/${product.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </div>
        ))}
        {filtered.length === 0 && <p className="py-8 text-center text-sm text-gray-500 dark:text-gray-400">Aucun produit trouvé</p>}
      </div>
    </div>
  );
}
