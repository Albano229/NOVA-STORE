export default function TermsPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900">Termes et conditions</h1>
      <p className="mt-2 text-sm text-gray-500">Dernière mise à jour : 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-xl font-bold text-gray-900">1. Acceptation des conditions</h2>
          <p className="mt-2">
            En utilisant la plateforme NOVA STORE, vous acceptez les présentes conditions générales.
            Si vous n&apos;acceptez pas ces conditions, veuillez ne pas utiliser nos services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">2. Description du service</h2>
          <p className="mt-2">
            NOVA STORE est une plateforme de marketplace multi-vendeurs permettant aux vendeurs de créer
            leur boutique en ligne et de vendre leurs produits. Nous facturons une commission de 5%
            sur chaque transaction réussie.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">3. Obligations des vendeurs</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Fournir des informations exactes et à jour</li>
            <li>Respecter les lois et réglementations en vigueur</li>
            <li>Ne pas vendre de produits interdits ou contrefaits</li>
            <li>Honorer les commandes reçues dans les délais impartis</li>
            <li>Payer la commission de 5% sur chaque vente</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">4. Obligations des acheteurs</h2>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Fournir des informations de livraison exactes</li>
            <li>Effectuer le paiement conformément aux modalités</li>
            <li>Respecter les conditions de retour des vendeurs</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">5. Propriété intellectuelle</h2>
          <p className="mt-2">
            Le contenu de la plateforme (logo, design, textes) est la propriété de NOVA STORE.
            Les produits vendus par les vendeurs restent leur propriété intellectuelle.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">6. Limitation de responsabilité</h2>
          <p className="mt-2">
            NOVA STORE agit comme intermédiaire entre vendeurs et acheteurs. Nous ne pouvons être tenus
            responsables des litiges entre vendeurs et acheteurs, mais nous nous engageons à faciliter
            leur résolution.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">7. Contact</h2>
          <p className="mt-2">
            Pour toute question, contactez-nous à :
            <a href="mailto:novadigital184@gmail.com" className="ml-1 text-indigo-600 hover:underline">
              novadigital184@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
