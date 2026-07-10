"use client";

import { useSession } from "next-auth/react";
import { useRouter, usePathname } from "next/navigation";
import { useState } from "react";
import { TopBar } from "@/components/layout/topbar";
import { Sidebar } from "@/components/layout/sidebar";
import { MobileNavbar } from "@/components/layout/mobile-navbar";
import { PWAInstall } from "@/components/pwa/install-prompt";

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();
  const pathname = usePathname();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  if (status === "loading") {
    return (
      <div className="flex h-screen items-center justify-center bg-gray-50 dark:bg-gray-900">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7126b6] border-t-transparent" />
      </div>
    );
  }

  if (!session) {
    router.push("/auth/login");
    return null;
  }

  const allowedRoles = ["VENDOR", "ADMIN", "MODERATOR", "OWNER"];
  if (!allowedRoles.includes(session.user.role)) {
    router.push("/");
    return null;
  }

  const isOnboarding = pathname === "/vendor/onboarding";

  if (isOnboarding) {
    return <>{children}</>;
  }

  return (
    <div className="flex h-dvh flex-col bg-gray-50 dark:bg-gray-900">
      <TopBar onMenuToggle={() => setSidebarOpen(true)} />

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          isOpen={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
        />

        <main className="flex-1 overflow-y-auto overflow-x-hidden pb-20 md:pb-0">
          <div className="p-4 md:p-6">{children}</div>
        </main>
      </div>

      <MobileNavbar onMenuToggle={() => setSidebarOpen(true)} />
      <PWAInstall />
    </div>
  );
}
