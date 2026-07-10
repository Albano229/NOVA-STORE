import { StoreLayoutWrapper } from "@/components/layout/store-layout-wrapper";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return <StoreLayoutWrapper>{children}</StoreLayoutWrapper>;
}
