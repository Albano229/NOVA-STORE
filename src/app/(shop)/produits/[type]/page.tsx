"use client";

import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Package,
  Download,
  Gift,
  Users,
  Calendar,
  Wrench,
  Check,
  ArrowRight,
  Star,
  Shield,
  Zap,
  Globe,
  CreditCard,
  Headphones,
} from "lucide-react";

const typesConfig: Record<string, {
  id: string;
  label: string;
  icon: React.ElementType;
  gradient: string;
  bgLight: string;
  emoji: string;
  heroTitle: string;
  heroDesc: string;
  features: { icon: React.ElementType; title: string; desc: string }[];
  benefits: string[];
  howItWorks: { step: string; title: string; desc: string }[];
}> = {
  physique: {
    id: "physical",
    label: "Produits Physiques",
    icon: Package,
    gradient: "from-indigo-500 to-purple-600",
    bgLight: "bg-indigo-50",
    emoji: "📦",
    heroTitle: "Vendez des produits physiques partout dans le monde",
    heroDesc: "Des vêtements à l'électronique en passant par l'alimentation — gérez votre stock, vos expéditions et vos ventes depuis un tableau de bord centralisé.",
    features: [
      { icon: Package, title: "Gestion de stock", desc: "Suivez votre inventaire en temps réel avec alertes automatiques" },
      { icon: Globe, title: "Expédition mondiale", desc: "Intégrez vos transporteurs locaux et internationaux" },
      { icon: CreditCard, title: "Paiements multiples", desc: "Wave, Moov Money, MTN, carte bancaire, PayPal" },
      { icon: Shield, title: "Protection vendeur", desc: "Paiement sécurisé avant expédition" },
    ],
    benefits: ["Aucun abonnement mensuel", "Commission unique de 5%", "Tableau de bord intuitif", "Support 7j/7"],
    howItWorks: [
      { step: "1", title: "Ajoutez vos produits", desc: "Photos, descriptions, prix — ajoutez tout en quelques clics" },
      { step: "2", title: "Recevez des commandes", desc: "Vos clients commandent et paient en ligne" },
      { step: "3", title: "Expédiez et gagnez", desc: "Préparez et expédiez — recevez votre paiement" },
    ],
  },
  digital: {
    id: "digital",
    label: "Produits Digitaux",
    icon: Download,
    gradient: "from-emerald-500 to-teal-600",
    bgLight: "bg-emerald-50",
    emoji: "💻",
    heroTitle: "Ressources numériques & formations en ligne",
    heroDesc: "Ebooks, templates, logiciels, musiques ET formations complètes avec vidéos, quiz et certificats. Livraison instantanée, zéro stock, marges maximales.",
    features: [
      { icon: Download, title: "Livraison instantanée", desc: "Vos clients reçoivent leurs fichiers automatiquement" },
      { icon: Star, title: "Éditeur de cours", desc: "Créez des formations avec vidéos, quiz et certificats" },
      { icon: Shield, title: "Protection anti-piratage", desc: "Sécurisez vos fichiers numériques" },
      { icon: Globe, title: "Marché mondial", desc: "Vendez à des clients du monde entier" },
    ],
    benefits: ["Aucun stock à gérer", "Zéro frais d'expédition", "Livraison automatique", "Marges bénéficiaires élevées"],
    howItWorks: [
      { step: "1", title: "Créez votre produit", desc: "Uploader votre fichier ou créez votre cours vidéo" },
      { step: "2", title: "Fixez votre prix", desc: "Tarif libre, promotions, coupons" },
      { step: "3", title: "Vendez et gagnez", desc: "Paiement → Livraison automatique → Vous êtes payé" },
    ],
  },
  bundle: {
    id: "bundle",
    label: "Bundles",
    icon: Gift,
    gradient: "from-amber-500 to-orange-600",
    bgLight: "bg-amber-50",
    emoji: "🎁",
    heroTitle: "Créez des packs gagnants",
    heroDesc: "Combinez produits physiques + digitaux, formations + coaching, ou tout ce que vous voulez. Augmentez votre panier moyen avec des offres groupées irrésistibles.",
    features: [
      { icon: Gift, title: "Packs personnalisables", desc: "Combinez n'importe quels types de produits" },
      { icon: Star, title: "Remises automatiques", desc: "Fixez des prix dégressifs pour les packs" },
      { icon: Zap, title: "Promotions flash", desc: "Créez des offres limitées dans le temps" },
      { icon: Shield, title: "Gestion centralisée", desc: "Stock et commandes gérés automatiquement" },
    ],
    benefits: ["Panier moyen plus élevé", "Fidélisation client", "Écoulez vos stocks", "Offres uniques"],
    howItWorks: [
      { step: "1", title: "Sélectionnez vos produits", desc: "Choisissez 2 produits ou plus à assembler" },
      { step: "2", title: "Fixez le prix du pack", desc: "Proposez un prix attractif avec réduction" },
      { step: "3", title: "Vendez en volume", desc: "Les clients adorent les offres groupées" },
    ],
  },
  service: {
    id: "service",
    label: "Services",
    icon: Wrench,
    gradient: "from-emerald-500 to-emerald-600",
    bgLight: "bg-emerald-50",
    emoji: "🔧",
    heroTitle: "Proposez vos services et prestations",
    heroDesc: "Consultations, coaching, développement, design, réparation — gérez votre planning, recevez des réservations et encaissez vos paiements en ligne.",
    features: [
      { icon: Calendar, title: "Calendrier intelligent", desc: "Gérez vos créneaux disponibles en temps réel" },
      { icon: CreditCard, title: "Paiement à la réservation", desc: "Sécurisez vos rendez-vous avec un paiement" },
      { icon: Headphones, title: "Questionnaire personnalisé", desc: "Collectez les infos nécessaires avant chaque prestation" },
      { icon: Zap, title: "Rappels automatiques", desc: "SMS et email de rappel pour réduire les absences" },
    ],
    benefits: ["Zéro stock", "Paiement garanti", "Planning optimisé", "Disponible 24h/24"],
    howItWorks: [
      { step: "1", title: "Créez votre service", desc: "Définissez vos prestations, durée et tarifs" },
      { step: "2", title: "Les clients réservent", desc: "Ils choisissent un créneau et paient en ligne" },
      { step: "3", title: "Réalisez et gagnez", desc: "Effectuez la prestation et recevez votre paiement" },
    ],
  },
  communaute: {
    id: "community",
    label: "Communauté",
    icon: Users,
    gradient: "from-rose-500 to-pink-600",
    bgLight: "bg-rose-50",
    emoji: "👥",
    heroTitle: "Monétisez votre communauté",
    heroDesc: "Créez un espace privé payant, des abonnements mensuels, des groupes VIP. Idéal pour coachs, créateurs de contenu et experts.",
    features: [
      { icon: Users, title: "Groupes privés", desc: "Espaces exclusifs pour vos membres" },
      { icon: CreditCard, title: "Abonnements récurrents", desc: "Revenus prévisibles chaque mois" },
      { icon: Headphones, title: "Messagerie intégrée", desc: "Échangez directement avec vos membres" },
      { icon: Shield, title: "Contenu exclusif", desc: "Partagez du contenu réservé aux membres" },
    ],
    benefits: ["Revenus récurrents", "Fidélisation forte", "Lien direct avec votre audience", "Pas de stock"],
    howItWorks: [
      { step: "1", title: "Créez votre communauté", desc: "Définissez votre thème et vos objectifs" },
      { step: "2", title: "Fixez vos tarifs", desc: "Abonnement mensuel, annuel ou accès à vie" },
      { step: "3", title: "Développez votre groupe", desc: "Partagez du contenu exclusif régulièrement" },
    ],
  },
  reservation: {
    id: "booking",
    label: "Réservation",
    icon: Calendar,
    gradient: "from-cyan-500 to-blue-600",
    bgLight: "bg-cyan-50",
    emoji: "📅",
    heroTitle: "Gérez vos rendez-vous et services",
    heroDesc: "Consultations, coaching, ateliers, locations — vos clients réservent en ligne, paient à l'avance et reçoivent des rappels automatiques.",
    features: [
      { icon: Calendar, title: "Calendrier intelligent", desc: "Gérez vos créneaux disponibles en temps réel" },
      { icon: CreditCard, title: "Paiement à la réservation", desc: "Sécurisez vos rendez-vous avec un paiement" },
      { icon: Zap, title: "Rappels automatiques", desc: "SMS et email de rappel pour réduire les absences" },
      { icon: Globe, title: "Disponible 24/7", desc: "Vos clients réservent quand ils veulent" },
    ],
    benefits: ["Plus d'absences", "Paiement garanti", "Planning optimisé", "Disponible 24h/24"],
    howItWorks: [
      { step: "1", title: "Configurez vos disponibilités", desc: "Définissez vos créneaux et services" },
      { step: "2", title: "Les clients réservent", desc: "Ils choisissent un créneau et paient en ligne" },
      { step: "3", title: "Recevez des rappels", desc: "Notifications automatiques pour vous et vos clients" },
    ],
  },
};

export default function ProductTypePage() {
  const params = useParams();
  const type = params.type as string;
  const config = typesConfig[type];

  if (!config) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Type de produit introuvable</h1>
          <p className="mt-2 text-gray-500">Le type &quot;{type}&quot; n&apos;existe pas.</p>
          <Link href="/" className="mt-4 inline-flex items-center text-indigo-600 hover:text-indigo-700">
            Retour à l&apos;accueil <ArrowRight className="ml-1 h-4 w-4" />
          </Link>
        </div>
      </div>
    );
  }

  const Icon = config.icon;

  return (
    <div className="overflow-hidden">
      {/* Hero */}
      <section className={`relative bg-gradient-to-br ${config.gradient} pb-20 pt-24`}>
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col items-center text-center lg:flex-row lg:text-left lg:gap-16">
            <div className="flex-1">
              <div className="inline-flex items-center gap-2 rounded-full bg-white/20 px-4 py-1.5 text-sm font-medium text-white backdrop-blur-sm">
                <span>{config.emoji}</span>
                {config.label}
              </div>
              <h1 className="mt-6 text-4xl font-extrabold text-white sm:text-5xl lg:text-6xl">
                {config.heroTitle}
              </h1>
              <p className="mt-6 text-lg leading-relaxed text-white/80 max-w-2xl">
                {config.heroDesc}
              </p>
              <div className="mt-8 flex flex-wrap gap-3">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 rounded-full bg-white px-8 py-3.5 text-sm font-semibold text-gray-900 shadow-md transition-all hover:shadow-xl"
                >
                  Commencer à vendre
                  <ArrowRight className="h-4 w-4" />
                </Link>
                <Link
                  href="/#pricing"
                  className="inline-flex items-center gap-2 rounded-full border border-white/30 px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10"
                >
                  Voir les tarifs
                </Link>
              </div>
            </div>
            <div className="mt-10 lg:mt-0">
              <div className="flex h-48 w-48 items-center justify-center rounded-3xl bg-white/10 backdrop-blur-sm sm:h-64 sm:w-64">
                <Icon className="h-24 w-24 text-white/60 sm:h-32 sm:w-32" />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="bg-white py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Tout ce qu&apos;il vous faut pour vendre des <span className="text-indigo-600">{config.label.toLowerCase()}</span>
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-2 lg:grid-cols-4">
            {config.features.map((f) => (
              <div key={f.title} className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${config.gradient} text-white shadow-md`}>
                  <f.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className={`bg-gradient-to-br ${config.gradient} py-16`}>
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold text-white sm:text-4xl">
            Pourquoi vendre des <span className="text-white/80">{config.label.toLowerCase()}</span> sur NOVA STORE ?
          </h2>
          <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {config.benefits.map((b) => (
              <div key={b} className="flex items-center gap-3 rounded-xl bg-white/10 p-4 backdrop-blur-sm">
                <Check className="h-5 w-5 flex-shrink-0 text-white" />
                <span className="text-sm font-medium text-white">{b}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="bg-gray-50 py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold text-gray-900 sm:text-4xl">
            Comment ça marche ?
          </h2>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {config.howItWorks.map((step) => (
              <div key={step.step} className="relative rounded-2xl border border-gray-200 bg-white p-8 text-center shadow-sm">
                <div className={`absolute -top-4 left-1/2 -translate-x-1/2 flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br ${config.gradient} text-sm font-bold text-white shadow-md`}>
                  {step.step}
                </div>
                <div className="mt-4">
                  <h3 className="text-lg font-bold text-gray-900">{step.title}</h3>
                  <p className="mt-2 text-sm text-gray-500">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-slate-900 py-16">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold text-white sm:text-4xl">
            Prêt à vendre des {config.label.toLowerCase()} ?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
            Créez votre boutique gratuitement et rejoignez +10.000 vendeurs.
          </p>
          <Link
            href="/auth/register"
            className={`mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${config.gradient} px-8 py-4 text-base font-semibold text-white shadow-lg transition-all hover:shadow-xl`}
          >
            Créer ma boutique
            <ArrowRight className="h-5 w-5" />
          </Link>
        </div>
      </section>
    </div>
  );
}
