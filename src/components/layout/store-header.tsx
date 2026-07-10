"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Search, ShoppingCart, Store, Menu, X } from "lucide-react";
import { useCartStore } from "@/stores/cart";

interface StoreHeaderProps {
  shopName: string;
  shopLogo: string | null;
  shopSlug: string;
}

export function StoreHeader({ shopName, shopLogo, shopSlug }: StoreHeaderProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const itemCount = useCartStore((s) => s.getItemCount());

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/shops/${shopSlug}?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 items-center justify-between gap-4">
          {/* Shop Logo & Name */}
          <Link
            href={`/shops/${shopSlug}`}
            className="flex items-center gap-3 flex-shrink-0"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#7126b6]/10 overflow-hidden">
              {shopLogo ? (
                <img src={shopLogo} alt={shopName} className="h-full w-full object-cover" />
              ) : (
                <Store className="h-5 w-5 text-[#7126b6]" />
              )}
            </div>
            <span className="text-lg font-bold text-[#0f172a] dark:text-white hidden sm:block truncate max-w-[200px]">
              {shopName}
            </span>
          </Link>

          {/* Search Bar */}
          <form
            onSubmit={handleSearch}
            className="flex-1 max-w-md hidden md:flex"
          >
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder={`Rechercher dans ${shopName}...`}
                className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm transition-colors focus:border-[#7126b6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7126b6] dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:focus:border-[#7126b6]"
              />
            </div>
          </form>

          {/* Right Actions */}
          <div className="flex items-center gap-2">
            {/* Mobile Search Toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800"
            >
              <Search className="h-5 w-5" />
            </button>

            {/* Cart */}
            <Link
              href="/cart"
              className="relative flex items-center justify-center rounded-xl p-2.5 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition-colors"
            >
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -right-1 -top-1 flex h-5 w-5 items-center justify-center rounded-full bg-[#7126b6] text-[10px] font-bold text-white">
                  {itemCount > 99 ? "99+" : itemCount}
                </span>
              )}
            </Link>
          </div>
        </div>

        {/* Mobile Search (collapsible) */}
        {mobileMenuOpen && (
          <div className="pb-4 md:hidden">
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder={`Rechercher dans ${shopName}...`}
                  className="w-full rounded-xl border border-gray-200 bg-gray-50 py-2.5 pl-10 pr-4 text-sm focus:border-[#7126b6] focus:bg-white focus:outline-none focus:ring-1 focus:ring-[#7126b6] dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  autoFocus
                />
              </div>
            </form>
          </div>
        )}
      </div>
    </header>
  );
}
