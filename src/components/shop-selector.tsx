"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useWorkspace } from "@/contexts/workspace-context";
import { Store, Check, Plus, ChevronDown, ExternalLink } from "lucide-react";
import { cn } from "@/lib/utils";

interface ShopData {
  id: string;
  name: string;
  slug: string;
}

export function ShopSelector() {
  const { currentShop, setCurrentShop, shops, setShops, setWorkspace } = useWorkspace();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetch("/api/vendor/shops")
      .then((res) => res.json())
      .then((data) => {
        if (Array.isArray(data)) {
          setShops(data.map((s: ShopData) => ({ id: s.id, name: s.name, slug: s.slug })));
        }
      })
      .catch(() => {});
  }, [setShops]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectShop = (shop: ShopData) => {
    setCurrentShop(shop);
    setWorkspace("shop");
    setOpen(false);
    window.location.reload();
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="flex items-center gap-2 rounded-xl border border-gray-200 bg-white px-3 py-2 text-sm font-medium text-gray-700 shadow-sm transition-all hover:border-indigo-200 hover:shadow-md"
      >
        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-emerald-100">
          <Store className="h-3.5 w-3.5 text-emerald-600" />
        </div>
        <span className="max-w-[140px] truncate">{currentShop?.name || "Sélectionner"}</span>
        <ChevronDown className={cn("h-4 w-4 text-gray-400 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute left-0 top-full z-50 mt-2 w-72 rounded-xl border border-gray-200 bg-white py-2 shadow-xl">
          <div className="border-b border-gray-100 px-4 py-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-gray-400">Mes boutiques</p>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {shops.length === 0 ? (
              <p className="px-4 py-3 text-sm text-gray-500">Aucune boutique</p>
            ) : (
              shops.map((shop) => (
                <button
                  key={shop.id}
                  onClick={() => selectShop(shop)}
                  className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-gray-50"
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-100 text-xs font-bold text-emerald-700">
                    {shop.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{shop.name}</p>
                    <p className="truncate text-xs text-gray-400">{shop.slug}</p>
                  </div>
                  {currentShop?.id === shop.id && (
                    <Check className="h-4 w-4 flex-shrink-0 text-emerald-500" />
                  )}
                </button>
              ))
            )}
          </div>
          <div className="border-t border-gray-100 pt-1">
            <Link
              href="/vendor/stores"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-700 transition-colors hover:bg-gray-50"
            >
              <ExternalLink className="h-4 w-4" />
              Gérer mes boutiques
            </Link>
            <Link
              href="/vendor/onboarding"
              onClick={() => setOpen(false)}
              className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-emerald-600 transition-colors hover:bg-emerald-50"
            >
              <Plus className="h-4 w-4" />
              Nouvelle boutique
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
