export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
      <h1 className="text-3xl font-extrabold text-gray-900">Politique de confidentialité</h1>
      <p className="mt-2 text-sm text-gray-500">Dernière mise à jour : 2026</p>

      <div className="mt-8 space-y-6 text-sm leading-relaxed text-gray-600">
        <section>
          <h2 className="text-xl font-bold text-gray-900">1. Collecte des informations</h2>
          <p className="mt-2">
            Nous collectons les informations que vous nous fournissez directement lors de la création de votre compte :
            nom, adresse email, numéro de téléphone et informations de paiement.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">2. Utilisation des informations</h2>
          <p className="mt-2">
            Vos informations sont utilisées pour :
          </p>
          <ul className="mt-2 list-disc pl-5 space-y-1">
            <li>Vous fournir nos services de marketplace</li>
            <li>Traiter vos transactions et paiements</li>
            <li>Vous contacter concernant votre compte</li>
            <li>Améliorer notre plateforme</li>
            <li>Vous envoyer des notifications importantes</li>
          </ul>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">3. Protection des données</h2>
          <p className="mt-2">
            Nous mettons en œuvre des mesures de sécurité techniques et organisationnelles pour protéger
            vos informations personnelles contre tout accès non autorisé, modification, divulgation ou destruction.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">4. Partage des informations</h2>
          <p className="mt-2">
            Nous ne vendons pas vos informations personnelles. Nous pouvons partager vos informations
            avec des prestataires de services tiers (paiement, livraison) uniquement dans le cadre
            de la fourniture de nos services.
          </p>
        </section>

        <section>
          <h2 className="text-xl font-bold text-gray-900">5. Contact</h2>
          <p className="mt-2">
            Pour toute question concernant cette politique, contactez-nous à :
            <a href="mailto:novadigital184@gmail.com" className="ml-1 text-indigo-600 hover:underline">
              novadigital184@gmail.com
            </a>
          </p>
        </section>
      </div>
    </div>
  );
}
