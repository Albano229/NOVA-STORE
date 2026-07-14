import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

const SYSTEM_PROMPTS: Record<string, string> = {
  PHYSICAL: `Tu es un rédacteur e-commerce expert pour produits physiques sur NOVA Store (Bénin, FCFA).
Tu génères des descriptions produit percutantes axées sur: bénéfices client, matériaux, caractéristiques techniques, et appels à l'action.
Format HTML propre avec <h2>, <h3>, <ul>, <li>, <strong>, <p>.
Ton: professionnel et engageant. Public cible: Afrique de l'Ouest.`,
  DIGITAL: `Tu es un rédacteur e-commerce expert pour produits numériques (e-books, templates, formations) sur NOVA Store.
Tu structures: Sommaire, Prérequis, Ce que vous apprendrez, Instructions de téléchargement.
Format HTML propre avec <h2>, <h3>, <ul>, <li>, <strong>, <p>.
Ton: pédagogique et motivant. Insiste sur la valeur immédiate et l'accès instantané.`,
  SERVICE: `Tu es un rédacteur e-commerce expert pour services/prestations sur NOVA Store.
Tu présentes le service en livrables précis (Étape 1, Étape 2...) et mets en avant l'expertise.
Format HTML propre avec <h2>, <h3>, <ul>, <li>, <strong>, <p>.
Ton: professionnel et rassurant. Montre la méthodologie claire.`,
  COMMUNITY: `Tu es un rédacteur e-commerce expert pour communautés et memberships sur NOVA Store.
Tu décris les avantages exclusifs, la charte du groupe, et l'accès aux contenus privés.
Format HTML propre avec <h2>, <h3>, <ul>, <li>, <strong>, <p>.
Ton: inspirant et exclusif. Crée le désir d'appartenir au groupe.`,
  BUNDLE: `Tu es un rédacteur e-commerce expert pour les packs/bundles sur NOVA Store.
Tu mets en avant le gain financier, la valeur cumulée, et l'offre groupée avantageuse.
Format HTML propre avec <h2>, <h3>, <ul>, <li>, <strong>, <p>.
Ton: commercial et orienté valeur. Calcule et affiche les économies.`,
  BOOKING: `Tu es un rédacteur e-commerce expert pour événements et réservations sur NOVA Store.
Tu crées un programme/planning accrocheur, heure par heure, avec émotions et dynamisme.
Format HTML propre avec <h2>, <h3>, <ul>, <li>, <strong>, <p>.
Ton: dynamique et événementiel. Crée l'urgence et l'excitation.`,
};

const SEO_PROMPT = `Tu es un expert SEO. À partir du nom et type de produit, génère:
1. Un titre SEO de maximum 60 caractères, percutant et contenant le mot-clé principal
2. Une meta description de maximum 160 caractères, incitative au clic

Réponds UNIQUEMENT avec un JSON valide: {"seoTitle": "...", "seoDescription": "..."}`;

const FAQ_PROMPT = `Tu es un expert e-commerce. À partir du nom et type de produit, génère les 3 questions/réponses les plus fréquemment posées par les clients pour CE type de produit spécifique.

Réponds UNIQUEMENT avec un JSON valide: {"faqItems": [{"question": "...", "answer": "..."}]}`;

const AUTOFILL_PROMPT = `Tu es un assistant e-commerce intelligent. À partir du nom et type de produit, tu génères des suggestions de pré-remplissage pour le formulaire.

Réponds UNIQUEMENT avec un JSON valide contenant les champs pertinents:
{
  "shortDescription": "courte description du produit",
  "ctaText": "texte du bouton CTA adapté",
  "seoTitle": "titre SEO < 60 car.",
  "seoDescription": "meta description < 160 car.",
  "seoKeywords": "mot1, mot2, mot3",
  "price": 0,
  "comparePrice": 0
}`;

function parseJsonResponse(text: string): any {
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      return JSON.parse(jsonMatch[0]);
    } catch { /* empty */ }
  }
  return null;
}

function generateLocalDescription(name: string, type: string, category: string, tone: string): string {
  const prompts = SYSTEM_PROMPTS[type] || SYSTEM_PROMPTS.PHYSICAL;
  const categoryText = category ? ` dans la catégorie ${category}` : "";

  const structures: Record<string, string> = {
    PHYSICAL: `<h2>${name}</h2>

<p>Découvrez <strong>${name}</strong>, un produit ${categoryText} qui combine qualité exceptionnelle et design soigné. Conçu pour répondre aux attentes les plus exigeants, il s'impose comme un choix incontournable.</p>

<h3>Caractéristiques principales</h3>
<ul>
<li><strong>Qualité premium</strong> — Matériaux sélectionnés avec soin pour une durabilité optimale</li>
<li><strong>Design soigné</strong> — Esthétique moderne et élégante, adapté à tous les usages</li>
<li><strong>Confort optimal</strong> — Conçu pour un usage quotidien sans compromis</li>
<li><strong>Durabilité</strong> — Résistant et pensé pour durer dans le temps</li>
</ul>

<h3>Pourquoi choisir ${name} ?</h3>
<p>Notre engagement envers la qualité fait la différence. Chaque détail a été pensé pour vous offrir une expérience supérieure et durable. ${name} est le choix idéal pour ceux qui ne font aucun compromis sur l'excellence.</p>

<p><strong>Commandez dès maintenant</strong> et profitez d'un service client réactif et d'une livraison rapide sur tout le Bénin !</p>`,

    DIGITAL: `<h2>${name}</h2>

<p><strong>${name}</strong> est une ressource numérique de qualité professionnelle, conçue pour vous faire gagner du temps et atteindre vos objectifs rapidement.</p>

<h3>Ce que vous trouverez</h3>
<ul>
<li><strong>Contenu complet et structuré</strong> — Organisation claire pour une prise en main rapide</li>
<li><strong>Prérequis</strong> — Aucune expérience préalable nécessaire, convient à tous les niveaux</li>
<li><strong>Multi-appareils</strong> — Accessible sur PC, tablette et smartphone</li>
</ul>

<h3>Instructions de téléchargement</h3>
<ul>
<li>Étape 1 : Après paiement, cliquez sur "Télécharger"</li>
<li>Étape 2 : Le fichier sera automatiquement enregistré</li>
<li>Étape 3 : Ouvrez le fichier avec le logiciel compatible</li>
</ul>

<p><strong>Accès instantané</strong> — Téléchargez immédiatement après validation. Mises à jour gratuites incluses !</p>`,

    SERVICE: `<h2>${name}</h2>

<p>Découvrez <strong>${name}</strong> — un service professionnel ${categoryText} pensé pour transformer votre vision en réalité. Notre approche méthodique garantit des résultats mesurables à chaque étape.</p>

<h3>Déroulement de la prestation</h3>
<ul>
<li><strong>Étape 1 — Analyse</strong> : Étude approfondie de vos besoins et objectifs</li>
<li><strong>Étape 2 — Stratégie</strong> : Élaboration d'un plan d'action personnalisé</li>
<li><strong>Étape 3 — Réalisation</strong> : Exécution professionnelle avec suivi en temps réel</li>
<li><strong>Étape 4 — Livraison</strong> : Résultats finals avec accompagnement post-prestation</li>
</ul>

<h3>Ce qui est inclus</h3>
<ul>
<li>Consultation initiale complète</li>
<li>Suivi personnalisé tout au long du projet</li>
<li>Livrables clairs et documentés</li>
<li>Support post-prestation inclus</li>
</ul>

<p><strong>Réservez maintenant</strong> et bénéficiez d'un accompagnement expert de A à Z !</p>`,

    COMMUNITY: `<h2>${name}</h2>

<p>Rejoignez <strong>${name}</strong> — une communauté exclusive de passionnés qui partagent les mêmes ambitions. Accédez à du contenu premium, des échanges de qualité et un réseau privilégié.</p>

<h3>Avantages des membres</h3>
<ul>
<li><strong>Contenu exclusif</strong> — Accédez à des ressources et formations réservées aux membres</li>
<li><strong>Communauté privée</strong> — Échangez avec des membres sélectionnés</li>
<li><strong>Événements spéciaux</strong> — Webinaires et sessions live exclusives</li>
<li><strong>Support prioritaire</strong> — Assistance dédiée pour les membres</li>
</ul>

<h3>Comment ça marche</h3>
<ul>
<li>Étape 1 : Choisissez votre plan d'adhésion</li>
<li>Étape 2 : Recevez vos accès privés par email</li>
<li>Étape 3 : Intégrez la communauté et commencez à échanger</li>
</ul>

<p><strong>Rejoignez-nous maintenant</strong> et faites partie des membres qui avancent ensemble !</p>`,

    BUNDLE: `<h2>${name}</h2>

<p>Découvrez <strong>${name}</strong> — un pack exclusif regroupant les meilleurs produits pour maximiser vos résultats à prix réduit. L'offre complète pour réussir !</p>

<h3>Ce que contient le pack</h3>
<ul>
<li><strong>Produits premium</strong> — Sélection rigoureuse des meilleurs éléments</li>
<li><strong>Valeur cumulée</strong> — Un pack qui vaut bien plus que sa somme</li>
<li><strong>Économies garanties</strong> — Réduction exclusive sur l'ensemble du lot</li>
<li><strong>Accès immédiat</strong> — Tout est disponible dès validation</li>
</ul>

<h3>Pourquoi choisir ce pack ?</h3>
<p>Achetez le lot et faites des économies significatives par rapport à l'achat séparé. Chaque produit du pack a été sélectionné pour sa complémentarité et sa qualité.</p>

<p><strong>Achetez le pack maintenant</strong> et profitez d'une offre imbattable !</p>`,

    BOOKING: `<h2>${name}</h2>

<p>Ne manquez pas <strong>${name}</strong> — un événement incontournable qui promet de vous inspirer, connecter et propulser vers le succès. Réservez votre place avant qu'il ne soit trop tard !</p>

<h3>Programme de la journée</h3>
<ul>
<li><strong>09h00 — Accueil & Networking</strong> : Rencontrez les intervenants et autres participants</li>
<li><strong>10h00 — Keynote d'ouverture</strong> : Les grandes tendances du secteur</li>
<li><strong>11h30 — Atelier pratique</strong> : Mise en main et exercices concrets</li>
<li><strong>13h00 — Pause déjeuner</strong> : Échanges informels et networking</li>
<li><strong>14h30 — Panels & Discussions</strong> : Débats avec les experts</li>
<li><strong>16h00 — Clôture & Awards</strong> : Récompenses et perspectives d'avenir</li>
</ul>

<h3>Pourquoi participer ?</h3>
<ul>
<li><strong>Networking</strong> — Rencontrez des professionnels du secteur</li>
<li><strong>Expertise</strong> — Apprenez des meilleurs acteurs du marché</li>
<li><strong>Exclusivité</strong> — Accédez à du contenu réservé aux participants</li>
</ul>

<p><strong>Réservez votre place maintenant</strong> — Les places sont limitées !</p>`,
  };

  return structures[type] || structures.PHYSICAL;
}

function generateLocalSeo(name: string, type: string): { seoTitle: string; seoDescription: string } {
  const typeLabels: Record<string, string> = {
    PHYSICAL: "Achat en ligne",
    DIGITAL: "Téléchargement immédiat",
    SERVICE: "Service professionnel",
    COMMUNITY: "Rejoindre la communauté",
    BUNDLE: "Pack promotionnel",
    BOOKING: "Réserver votre place",
  };
  const label = typeLabels[type] || "Achat en ligne";
  let title = `${name} — ${label} | NOVA Store`;
  if (title.length > 60) title = `${name.substring(0, 40)} — ${label}`;
  if (title.length > 60) title = `${name.substring(0, 50)} | NOVA Store`;

  const descriptions: Record<string, string> = {
    PHYSICAL: `Découvrez ${name} sur NOVA Store. Qualité premium, livraison rapide au Bénin, paiement sécurisé. Commandez maintenant !`,
    DIGITAL: `Téléchargez ${name} immédiatement après achat. Accès instantané, multi-appareils, mises à jour gratuites. Disponible sur NOVA Store.`,
    SERVICE: `${name} — Service professionnel de qualité. Réservez maintenant sur NOVA Store. Accompagnement expert garanti.`,
    COMMUNITY: `Rejoignez ${name} sur NOVA Store. Contenu exclusif, communauté privée, accès privilégié. Adhérez maintenant !`,
    BUNDLE: `${name} — Pack exclusif à prix réduit. Économisez sur l'achat groupé. Disponible sur NOVA Store.`,
    BOOKING: `${name} — Réservez votre place maintenant sur NOVA Store. Places limitées, ne tardez pas !`,
  };

  let desc = descriptions[type] || descriptions.PHYSICAL;
  if (desc.length > 160) desc = desc.substring(0, 157) + "...";

  return { seoTitle: title, seoDescription: desc };
}

function generateLocalFaq(name: string, type: string): Array<{ question: string; answer: string }> {
  const faqs: Record<string, Array<{ question: string; answer: string }>> = {
    PHYSICAL: [
      { question: `Comment commander ${name} ?`, answer: `Cliquez sur "Ajouter au panier", validez votre panier, puis choisissez votre mode de paiement (Mobile Money, carte bancaire). Vous recevrez une confirmation par SMS/email.` },
      { question: `Quels sont les délais de livraison pour ${name} ?`, answer: `Livraison en 24-48h à Cotonou, 2-5 jours en province. Suivi de commande en temps réel disponible après expédition.` },
      { question: `Puis-je retourner ${name} ?`, answer: `Oui, retour gratuit sous 30 jours si le produit est dans son emballage d'origine. Contactez notre support pour initié le retour.` },
    ],
    DIGITAL: [
      { question: `Comment télécharger ${name} ?`, answer: `Après paiement, cliquez sur "Télécharger" sur la page de confirmation. Le lien reste actif pendant 30 jours. Téléchargements illimités si non spécifié.` },
      { question: `${name} est-il compatible mobile ?`, answer: `Oui, ${name} est accessible sur tous les appareils : PC, smartphone, tablette. Aucune installation spécifique requise.` },
      { question: `Puis-je obtenir un remboursement pour ${name} ?`, answer: `Remboursement sous 7 jours si le fichier n'a pas été téléchargé. Contactez le support avec votre numéro de commande.` },
    ],
    SERVICE: [
      { question: `Comment se déroule ${name} ?`, answer: `Après réservation, vous recevrez un questionnaire pour décrire vos besoins. Le prestataire vous contactera sous 24h pour planifier la première session.` },
      { question: `Combien de temps prend ${name} ?`, answer: `La durée dépend de la complexité du projet. Un devis détaillé vous sera fourni après la première consultation gratuite.` },
      { question: `Que comprend ${name} ?`, answer: `Le service inclut la consultation, l'exécution, les révisions nécessaires et le support post-prestation. Tout est détaillé dans la fiche produit.` },
    ],
    COMMUNITY: [
      { question: `Comment rejoindre ${name} ?`, answer: `Choisissez votre plan, validez le paiement, et vous recevrez vos accès privés par email sous 5 minutes.` },
      { question: `Puis-je me désabonner de ${name} ?`, answer: `Oui, annulez à tout moment depuis votre espace membre. L'accès reste actif jusqu'à la fin de la période payée.` },
      { question: `Quel contenu est disponible dans ${name} ?`, answer: `Accédez à des formations exclusives, un forum privé, des sessions live mensuelles et un support prioritaire.` },
    ],
    BUNDLE: [
      { question: `Comment fonctionne ${name} ?`, answer: `Le pack regroupe plusieurs produits à prix réduit. Après achat, vous accédez à tous les éléments du lot instantanément.` },
      { question: `Puis-je retourner un seul produit du pack ?`, answer: `Le pack est vendu ensemble. Pour un retour, contactez le support sous 30 jours avec justification.` },
      { question: `Quelle est l'économie réalisée avec ${name} ?`, answer: `Le pack offre une réduction de 20-40% par rapport à l'achat séparé de chaque produit. L'économie exacte est affichée sur la fiche.` },
    ],
    BOOKING: [
      { question: `Comment réserver pour ${name} ?`, answer: `Sélectionnez votre catégorie de billet, choisissez la date, et validez le paiement. Vous recevrez votre billet par email.` },
      { question: `Puis-je annuler ma réservation pour ${name} ?`, answer: `Annulation gratuite jusqu'à 7 jours avant l'événement. Au-delà, remboursement de 50%. Contactez le support.` },
      { question: `Y a-t-il un parking sur place pour ${name} ?`, answer: `Les informations pratiques (parking, accès, plan) seront envoyées par email 48h avant l'événement.` },
    ],
  };

  return faqs[type] || faqs.PHYSICAL;
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { prompt, productType, currentStep, productName, currentData } = body;

    if (!prompt || typeof prompt !== "string") {
      return NextResponse.json({ error: "Prompt requis" }, { status: 400 });
    }

    const lower = prompt.toLowerCase();
    const type = productType || "PHYSICAL";

    if (currentStep === "seo" || lower.includes("seo") || lower.includes("meta") || lower.includes("titre seo")) {
      const seo = generateLocalSeo(productName || "Mon produit", type);
      return NextResponse.json({
        action: "seo",
        data: seo,
      });
    }

    if (currentStep === "faq" || lower.includes("faq") || lower.includes("question") || lower.includes("fréquent")) {
      const faq = generateLocalFaq(productName || "Mon produit", type);
      return NextResponse.json({
        action: "faq",
        data: { faqItems: faq },
      });
    }

    if (lower.includes("remplir") || lower.includes("pré-remplir") || lower.includes("auto") || lower.includes("suggestion")) {
      const seo = generateLocalSeo(productName || "Mon produit", type);
      const typeDefaults: Record<string, { ctaText: string; shortDesc: string }> = {
        PHYSICAL: { ctaText: "Ajouter au panier", shortDesc: "Produit de qualité disponible sur NOVA Store" },
        DIGITAL: { ctaText: "Télécharger", shortDesc: "Ressource numérique accessible immédiatement" },
        SERVICE: { ctaText: "Réserver", shortDesc: "Service professionnel de qualité" },
        COMMUNITY: { ctaText: "Rejoindre", shortDesc: "Communauté exclusive de passionnés" },
        BUNDLE: { ctaText: "Acheter le pack", shortDesc: "Pack complet à prix réduit" },
        BOOKING: { ctaText: "Réserver", shortDesc: "Places limitées — réservez maintenant !" },
      };
      const defaults = typeDefaults[type] || typeDefaults.PHYSICAL;

      return NextResponse.json({
        action: "autoFill",
        data: {
          shortDescription: defaults.shortDesc,
          ctaText: defaults.ctaText,
          ...seo,
          seoKeywords: productName ? `${productName}, NOVA Store, ${type.toLowerCase()}` : `NOVA Store, ${type.toLowerCase()}`,
        },
      });
    }

    const description = generateLocalDescription(productName || "Mon produit", type, currentData?.categoryId || "", prompt);

    return NextResponse.json({
      action: "description",
      data: { description },
    });
  } catch (error) {
    console.error("[AI Assistant] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
