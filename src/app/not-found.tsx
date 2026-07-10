import Link from "next/link";
import { Store, Home, Search } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <div className="flex h-20 w-20 items-center justify-center rounded-full bg-[#7126b6]/10">
        <Store className="h-10 w-10 text-[#7126b6]" />
      </div>
      <h1 className="mt-6 text-4xl font-bold text-[#0f172a]">404</h1>
      <p className="mt-2 text-lg text-gray-500 dark:text-gray-400">Page non trouvée</p>
      <p className="mt-1 text-sm text-gray-400 dark:text-gray-500">La page que vous recherchez n&apos;existe pas ou a été déplacée.</p>
      <div className="mt-8 flex gap-4">
        <Link
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-[#7126b6] px-6 py-3 text-sm font-semibold text-white hover:bg-[#5e1f9a] transition-colors"
        >
          <Home className="h-4 w-4" />
          Accueil
        </Link>
        <Link
          href="/products"
          className="inline-flex items-center gap-2 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-6 py-3 text-sm font-semibold text-[#0f172a] hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <Search className="h-4 w-4" />
          Produits
        </Link>
      </div>
    </div>
  );
}
