"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, ShoppingCart } from "lucide-react";
import { useCartStore } from "@/stores/cart";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShopPWA } from "@/components/pwa/shop-pwa";

const MINIMAL_ROUTES = ["/cart", "/checkout"];

export function ShopLayoutClient({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isMinimal = MINIMAL_ROUTES.some(
    (r) => pathname === r || pathname.startsWith(r + "/")
  );

  return (
    <div className="flex min-h-screen flex-col">
      {isMinimal ? <MinimalHeader pathname={pathname} /> : <Header />}
      <main className="flex-1">{children}</main>
      {!isMinimal && <Footer />}
      <ShopPWA />
    </div>
  );
}

function MinimalHeader({ pathname }: { pathname: string }) {
  const itemCount = useCartStore((s) => s.getItemCount());
  const isCheckout = pathname.startsWith("/checkout");

  return (
    <header className="sticky top-0 z-50 border-b border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link
          href="/products"
          className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-[#7126b6] transition-colors dark:text-gray-300"
        >
          <ArrowLeft className="h-4 w-4" />
          Continuer mes achats
        </Link>
        {!isCheckout && (
          <Link href="/cart" className="relative">
            <ShoppingCart className="h-5 w-5 text-gray-600 dark:text-gray-400" />
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-[#7126b6] text-[10px] font-bold text-white">
                {itemCount > 99 ? "99+" : itemCount}
              </span>
            )}
          </Link>
        )}
      </div>
    </header>
  );
}
