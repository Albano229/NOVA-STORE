"use client";

import { usePathname } from "next/navigation";
import { useState, useEffect } from "react";
import { StoreHeader } from "@/components/layout/store-header";

interface ShopData {
  name: string;
  slug: string;
  logo: string | null;
}

export function StoreLayoutWrapper({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [shop, setShop] = useState<ShopData | null>(null);
  const [loading, setLoading] = useState(true);

  const shopSlug = pathname.split("/shops/")[1]?.split("/")[0] || "";

  useEffect(() => {
    if (!shopSlug) {
      setLoading(false);
      return;
    }

    const fetchShop = async () => {
      try {
        const res = await fetch(`/api/shops/${shopSlug}`);
        if (res.ok) {
          const data = await res.json();
          setShop({ name: data.name, slug: data.slug, logo: data.logo });
        }
      } catch {
        // ignore
      } finally {
        setLoading(false);
      }
    };

    fetchShop();
  }, [shopSlug]);

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <StoreHeader
        shopName={shop?.name || "Boutique"}
        shopLogo={shop?.logo || null}
        shopSlug={shopSlug}
      />
      <main className="flex-1">{children}</main>
      <footer className="border-t border-gray-200 bg-white py-6 dark:border-gray-700 dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-4 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Propulsé par{" "}
            <a href="/" className="font-semibold text-[#7126b6] hover:underline">
              NOVA STORE
            </a>
          </p>
        </div>
      </footer>
    </div>
  );
}
