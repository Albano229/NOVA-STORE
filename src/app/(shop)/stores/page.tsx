import { Metadata } from "next";
import Link from "next/link";
import { Search, Store, MapPin, Star, ArrowRight } from "lucide-react";

export const metadata: Metadata = {
  title: "Boutiques - NOVA STORE",
  description: "Découvrez toutes les boutiques de la place de marché NOVA STORE",
};

const mockStores = [
  { id: "1", name: "TechPro Bénin", slug: "techpro-benin", category: "Électronique", rating: 4.8, products: 156, city: "Cotonou", badge: "Premium" },
  { id: "2", name: "Art & Culture", slug: "art-culture", category: "Artisanat", rating: 4.5, products: 89, city: "Porto-Novo" },
  { id: "3", name: "Mode Africaine", slug: "mode-africaine", category: "Mode", rating: 4.9, products: 234, city: "Cotonou", badge: "Premium" },
  { id: "4", name: "Santé Naturelle", slug: "sante-naturelle", category: "Bien-être", rating: 4.3, products: 67, city: "Abomey-Calavi" },
  { id: "5", name: "Digital Services", slug: "digital-services", category: "Services", rating: 4.7, products: 45, city: "Cotonou" },
  { id: "6", name: "EduPlus Formation", slug: "eduplus", category: "Formation", rating: 4.6, products: 32, city: "Parakou" },
];

export default function StoresPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* En-tête */}
        <div className="text-center">
          <h1 className="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl">
            Nos Boutiques
          </h1>
          <p className="mt-4 text-lg text-gray-600 dark:text-gray-400">
            Découvrez nos vendeurs et trouvez les produits qui vous correspondent
          </p>
        </div>

        {/* Barre de recherche */}
        <div className="mx-auto mt-8 max-w-xl">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Rechercher une boutique..."
              className="w-full rounded-xl border border-gray-300 bg-white py-3 pl-10 pr-4 text-sm shadow-sm transition focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>

        {/* Filtres rapides */}
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          {["Toutes", "Mode", "Électronique", "Artisanat", "Services", "Formation"].map((cat) => (
            <button
              key={cat}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                cat === "Toutes"
                  ? "bg-purple-600 text-white"
                  : "bg-white text-gray-600 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-gray-700"
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Grille des boutiques */}
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {mockStores.map((store) => (
            <Link
              key={store.id}
              href={`/stores/${store.slug}`}
              className="group rounded-2xl border border-gray-200 bg-white p-6 shadow-sm transition hover:shadow-md hover:border-purple-200 dark:border-gray-700 dark:bg-gray-800 dark:hover:border-purple-600"
            >
              <div className="flex items-start justify-between">
                <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow">
                  <Store className="h-7 w-7" />
                </div>
                {store.badge && (
                  <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800 dark:bg-amber-900/30 dark:text-amber-400">
                    {store.badge}
                  </span>
                )}
              </div>
              <h3 className="mt-4 text-lg font-semibold text-gray-900 group-hover:text-purple-600 dark:text-white dark:group-hover:text-purple-400">
                {store.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">{store.category}</p>
              <div className="mt-4 flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" /> {store.city}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="h-4 w-4 text-amber-400" /> {store.rating}
                </span>
                <span>{store.products} produits</span>
              </div>
              <div className="mt-4 flex items-center text-sm font-medium text-purple-600 dark:text-purple-400">
                Voir la boutique <ArrowRight className="ml-1 h-4 w-4 transition group-hover:translate-x-1" />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
