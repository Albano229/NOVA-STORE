"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import { Store, CheckCircle, XCircle, ExternalLink, AlertTriangle } from "lucide-react";

interface Shop {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  isVerified: boolean;
  createdAt: string;
  user: { name: string | null; email: string };
  _count: { products: number; orders: number };
}

export default function ModeratorStoresPage() {
  const [shops, setShops] = useState<Shop[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/moderator/stores")
      .then((r) => r.json())
      .then(setShops)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateStore = async (id: string, data: Record<string, any>) => {
    try {
      const res = await fetch(`/api/moderator/stores/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (res.ok) {
        setShops((prev) => prev.map((s) => (s.id === id ? { ...s, ...data } : s)));
        toast.success("Boutique mise à jour");
      }
    } catch {
      toast.error("Erreur");
    }
  };

  if (loading) {
    return <div className="space-y-4">{[1, 2, 3].map((i) => <div key={i} className="h-24 animate-pulse rounded-xl bg-gray-200" />)}</div>;
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-[#0f172a]">Boutiques</h1>
      <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Examiner et modérer les boutiques</p>

      <div className="mt-6 space-y-4">
        {shops.map((shop) => (
          <Card key={shop.id} className="p-5">
            <div className="flex items-center gap-4">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-indigo-100">
                <Store className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="truncate text-sm font-semibold text-[#0f172a]">{shop.name}</p>
                  {shop.isVerified && <span className="rounded-full bg-blue-100 px-2 py-0.5 text-[10px] font-medium text-blue-700">Vérifié</span>}
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">{shop.user.name || shop.user.email} · {shop._count.products} produits · {shop._count.orders} commandes</p>
              </div>
              <span className={`rounded-full px-2.5 py-0.5 text-xs font-medium ${shop.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"}`}>
                {shop.isActive ? "Active" : "Suspendue"}
              </span>
              <div className="flex items-center gap-2">
                {!shop.isVerified && (
                  <Button size="sm" onClick={() => updateStore(shop.id, { isVerified: true })}>
                    <CheckCircle className="h-4 w-4 mr-1" /> Vérifier
                  </Button>
                )}
                <Button size="sm" variant={shop.isActive ? "destructive" : "outline"} onClick={() => updateStore(shop.id, { isActive: !shop.isActive })}>
                  {shop.isActive ? "Suspendre" : "Activer"}
                </Button>
                <a href={`/shops/${shop.slug}`} target="_blank" rel="noopener noreferrer" className="rounded-lg p-2 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700">
                  <ExternalLink className="h-4 w-4" />
                </a>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
}
