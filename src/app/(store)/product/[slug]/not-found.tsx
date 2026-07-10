import Link from "next/link";

export default function ProductNotFound() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-12 text-center sm:px-6 lg:px-8">
      <h1 className="text-2xl font-bold text-[#0f172a]">Produit non trouvé</h1>
      <p className="mt-2 text-gray-500">
        Le produit que vous recherchez n&apos;existe pas ou a été supprimé.
      </p>
      <Link
        href="/products"
        className="mt-4 inline-block text-[#7126b6] hover:underline"
      >
        Retour aux produits
      </Link>
    </div>
  );
}
