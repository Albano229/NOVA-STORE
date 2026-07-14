import { ShopLayoutClient } from "@/components/layout/shop-layout-client";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return <ShopLayoutClient>{children}</ShopLayoutClient>;
}
