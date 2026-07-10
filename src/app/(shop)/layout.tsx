import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { ShopPWA } from "@/components/pwa/shop-pwa";

export default function ShopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">{children}</main>
      <Footer />
      <ShopPWA />
    </div>
  );
}
