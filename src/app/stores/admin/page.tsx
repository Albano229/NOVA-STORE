"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Store, LayoutDashboard, ArrowRight } from "lucide-react";

function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Bonjour";
  if (h < 18) return "Bon après-midi";
  return "Bonsoir";
}

export default function AdminStoresPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.push("/auth/login");
    if (status === "authenticated") {
      const role = session?.user?.role;
      if (role !== "OWNER" && role !== "ADMIN" && role !== "MODERATOR") {
        router.push("/stores");
      }
    }
  }, [status, session, router]);

  if (status === "loading" || !session) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7126b6] border-t-transparent" />
      </div>
    );
  }

  const firstName = (session.user?.name || "Admin").split(" ")[0].toUpperCase();

  return (
    <div className="space-y-8">
      <div>
        <p className="text-base text-gray-500 dark:text-gray-400">
          {getGreeting()}, {firstName} ! 👋
        </p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight text-gray-900 dark:text-gray-100 md:text-4xl">
          Administration
        </h1>
        <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
          Choisissez votre espace de travail
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Link
          href="/admin/stores"
          className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 transition-all hover:border-gray-300 hover:shadow-lg"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50">
            <Store className="h-6 w-6 text-[#7126b6]" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">Stores</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Gérer les boutiques</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="inline-block rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-[#7126b6]">Boutiques</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 transition-all group-hover:bg-[#7126b6] group-hover:text-white">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </Link>

        <Link
          href="/admin"
          className="group rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 transition-all hover:border-gray-300 hover:shadow-lg"
        >
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-purple-50">
            <LayoutDashboard className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="mt-4 text-base font-semibold text-gray-900 dark:text-gray-100">Dashboard</h3>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Tableau de bord admin</p>
          <div className="mt-4 flex items-center justify-between">
            <span className="inline-block rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">Admin</span>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700 text-gray-400 dark:text-gray-500 transition-all group-hover:bg-[#7126b6] group-hover:text-white">
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
