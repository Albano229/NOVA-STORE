"use client";

import Link from "next/link";
import { useState } from "react";
import {
  Store,
  ArrowRight,
  CreditCard,
  Truck,
  Zap,
  Brain,
  BarChart3,
  Headphones,
  LayoutGrid,
  LinkIcon,
  Activity,
  Search,
  ShoppingCart,
  Globe,
  Tag,
  Shield,
  BookOpen,
  Users,
  Package,
  Download,
  Briefcase,
  Shirt,
  Smartphone,
  Apple,
  Coffee,
  Home,
  FileText,
  Video,
  Code,
  Music,
  File,
  PenTool,
  Film,
  Laptop,
  Check,
} from "lucide-react";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { BRAND } from "@/lib/brand";
import { useRecentlyViewed } from "@/hooks/use-recently-viewed";
import { formatPrice } from "@/lib/utils";

/* ────────────────────────────────────────────
   DATA
──────────────────────────────────────────── */

const productTabs = [
  {
    id: "physical",
    label: "Produits Physiques",
    desc: "Vendez des vêtements, électronique, accessoires et tout produit tangible directement depuis votre boutique.",
    gradient: "from-indigo-500 to-purple-600",
  },
  {
    id: "digital",
    label: "Produits Digitaux",
    desc: "Ebooks, templates, musique, photos et tout fichier numérique. Livraison instantanée après paiement.",
    gradient: "from-emerald-500 to-teal-600",
  },
  {
    id: "services",
    label: "Services",
    desc: "Proposez vos prestations : consulting, design, développement, coaching et bien plus.",
    gradient: "from-amber-500 to-orange-600",
  },
  {
    id: "formations",
    label: "Formations",
    desc: "Créez et vendez vos formations en ligne avec vidéos, quiz et certificats intégrés.",
    gradient: "from-rose-500 to-pink-600",
  },
  {
    id: "coaching",
    label: "Coaching",
    desc: "Accompagnez vos clients en séances individuelles ou en groupe grâce à notre système de réservation.",
    gradient: "from-cyan-500 to-blue-600",
  },
];

const testimonials = [
  {
    quote: "NOVA STORE a transformé mon business. J'encaisse partout au Bénin et en Afrique. Simple et efficace.",
    name: "Aristide",
    flag: "🇧🇯",
    role: "Entrepreneur",
    color: "bg-indigo-500",
  },
  {
    quote: "Mes produits sont vendus dans plus de 15 pays. NOVA STORE centralise mes ventes et mes paiements.",
    name: "Chantal",
    flag: "🇧🇯",
    role: "Commerçante",
    color: "bg-emerald-500",
  },
  {
    quote: "Mon chiffre d'affaires a été multiplié par 3. Les paiements sont automatisés, la livraison aussi.",
    name: "Patrick",
    flag: "🇨🇮",
    role: "Vendeur en ligne",
    color: "bg-amber-500",
  },
  {
    quote: "En 30 minutes, j'ai créé ma boutique et ajouté mes premiers produits. Aucune compétence technique requise.",
    name: "Fatima",
    flag: "🇹🇬",
    role: "Entrepreneure",
    color: "bg-rose-500",
  },
  {
    quote: "Je recommande NOVA STORE à tous les entrepreneurs. La plateforme est fluide et les paiements sont rapides.",
    name: "Ibrahim",
    flag: "🇧🇫",
    role: "Consultant",
    color: "bg-cyan-500",
  },
  {
    quote: "Fiable, intuitive et bien pensée. NOVA STORE m'a permis de structurer et faire croître mon business.",
    name: "Marie",
    flag: "🇨🇲",
    role: "CEO",
    color: "bg-purple-500",
  },
];

const features = [
  {
    icon: Store,
    title: "Boutique en Ligne",
    desc: "Lancez votre boutique en ligne en 5 minutes. Personnalisez-la selon votre image de marque avec nos thèmes professionnels.",
    cta: "Créez une boutique gratuitement",
    gradient: "from-indigo-500 to-indigo-700",
  },
  {
    icon: CreditCard,
    title: "Paiements",
    desc: "Acceptez des paiements du monde entier. Wave, Moov Money, MTN Mobile Money, carte bancaire et plus.",
    cta: "Découvrir les paiements",
    gradient: "from-emerald-500 to-emerald-700",
  },
  {
    icon: Truck,
    title: "Livraison",
    desc: "Gérez la livraison de vos produits facilement. Intégration avec les transporteurs locaux et internationaux.",
    cta: "En savoir plus",
    gradient: "from-amber-500 to-amber-700",
  },
  {
    icon: Zap,
    title: "Automatisation",
    desc: "Automatisez votre business et gagnez du temps. Factures, confirmations, relances : tout se gère tout seul.",
    cta: "En savoir plus",
    gradient: "from-rose-500 to-rose-700",
  },
  {
    icon: Brain,
    title: "IA Intégrée",
    desc: "L'intelligence artificielle au service de vos ventes. Descriptions auto-générées, recommandations produits et analyse prédictive.",
    cta: "En savoir plus",
    gradient: "from-purple-500 to-purple-700",
  },
  {
    icon: BarChart3,
    title: "Statistiques",
    desc: "Prenez les bonnes décisions avec des statistiques claires. Ventes, revenus, clients : tout est visualisé.",
    cta: "En savoir plus",
    gradient: "from-cyan-500 to-cyan-700",
  },
  {
    icon: Headphones,
    title: "Support Client",
    desc: "Un support client qui vous comprend vraiment. Disponible par chat, email et WhatsApp pour vous accompagner.",
    cta: "Contacter le support",
    gradient: "from-orange-500 to-orange-700",
  },
];

const smallFeatures = [
  { icon: Zap, title: "Workflows", desc: "Automatisez vos tâches répétitives" },
  { icon: LinkIcon, title: "Intégrations", desc: "Connectez vos outils favoris" },
  { icon: BarChart3, title: "Analytics", desc: "Tableau de bord en temps réel" },
  { icon: Search, title: "SEO", desc: "Référencement optimisé pour Google" },
  { icon: ShoppingCart, title: "Panier intelligents", desc: "Réduction du taux d'abandon" },
  { icon: Globe, title: "Multi-devises", desc: "Vendez dans le monde entier" },
  { icon: Tag, title: "Coupons & promotions", desc: "Attirez plus de clients" },
  { icon: Truck, title: "Transporteurs", desc: "Intégration logistique complète" },
  { icon: Shield, title: "Support 7j/7", desc: "Une équipe toujours disponible" },
];

const marqueeItems = [
  "Électronique", "Mode", "Alimentaire", "Beauté", "Maison", "Sport",
  "Livres", "Cours", "Coaching", "Templates", "Musique", "Art",
  "Photos", "Vidéos", "Software",
];

const resources = [
  {
    icon: BookOpen,
    title: "Premiers pas avec NOVA STORE",
    desc: "Débutez avec une formation gratuite et créez votre première boutique en quelques minutes.",
    cta: "Découvrir la formation",
    gradient: "from-indigo-500 to-indigo-700",
  },
  {
    icon: LayoutGrid,
    title: "Guides et modèles prêts à l'emploi",
    desc: "Accélérez votre lancement avec des templates, guides et checklist validés par nos experts.",
    cta: "Voir les ressources",
    gradient: "from-emerald-500 to-emerald-700",
  },
  {
    icon: Users,
    title: "Rejoignez la communauté",
    desc: "Échangez avec d'autres vendeurs, partagez vos astuces et grandissez ensemble.",
    cta: "Rejoindre la communauté",
    gradient: "from-amber-500 to-amber-700",
  },
];

const sellCategories = [
  {
    type: "physical",
    icon: Package,
    title: "Produits Physiques",
    desc: "Vendez des produits que vous pouvez expédier à vos clients. Gérez votre stock, vos livraisons et vos prix directement depuis votre boutique.",
    gradient: "from-indigo-500 to-indigo-700",
    examples: [
      { icon: Shirt, label: "Vêtements" },
      { icon: Smartphone, label: "Électronique" },
      { icon: Apple, label: "Alimentation" },
      { icon: Home, label: "Maison" },
      { icon: Coffee, label: "Accessoires" },
    ],
  },
  {
    type: "digital",
    icon: Download,
    title: "Produits Digitaux",
    desc: "Vendez des produits numériques téléchargeables automatiquement après paiement. Aucun stock, aucune livraison physique.",
    gradient: "from-emerald-500 to-emerald-700",
    examples: [
      { icon: FileText, label: "Ebooks" },
      { icon: Video, label: "Formations vidéo" },
      { icon: Code, label: "Logiciels" },
      { icon: Music, label: "Musiques" },
      { icon: File, label: "Fichiers PDF" },
    ],
  },
  {
    type: "service",
    icon: Briefcase,
    title: "Services",
    desc: "Proposez vos compétences et recevez des demandes de clients directement via votre boutique.",
    gradient: "from-amber-500 to-amber-700",
    examples: [
      { icon: Users, label: "Coaching" },
      { icon: Laptop, label: "Consulting" },
      { icon: PenTool, label: "Design" },
      { icon: Film, label: "Montage vidéo" },
      { icon: Code, label: "Développement" },
    ],
  },
];

/* ────────────────────────────────────────────
   PAGE
──────────────────────────────────────────── */

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("physical");
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || BRAND.name;
  const { recentlyViewed, clearRecent } = useRecentlyViewed();

  const heroTitle = settings.heroTitle || "La plateforme N°1 pour vendre vos produits au Bénin.";
  const heroSubtitle = settings.heroSubtitle || `Créez une boutique en 5 minutes, vendez vos produits partout dans le monde et recevez vos revenus rapidement grâce à ${siteName}.`;
  const heroCta = settings.heroCtaText || "Créer ma boutique gratuitement";

  const showSection = (key: string) => settings[key] !== "false";

  return (
    <div className="overflow-hidden">
      {/* ═══════════════ HERO ═══════════════ */}
      <section className="relative bg-white pb-16 pt-20 sm:pb-24 sm:pt-28">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Avatars */}
          <div className="flex items-center justify-center gap-3">
            <div className="flex -space-x-3">
              {["A", "C", "P"].map((init, i) => (
                <div
                  key={i}
                  className={`flex h-9 w-9 items-center justify-center rounded-full border-2 border-white text-xs font-bold text-white ${
                    ["bg-indigo-500", "bg-emerald-500", "bg-amber-500"][i]
                  }`}
                >
                  {init}
                </div>
              ))}
            </div>
            <span className="text-sm font-medium text-gray-600">Des milliers de vendeurs au Bénin</span>
          </div>

          {/* Title */}
          <h1 className="mx-auto mt-8 max-w-4xl text-center text-4xl font-extrabold tracking-tight text-gray-900 sm:text-5xl lg:text-6xl">
            {heroTitle}
          </h1>

          {/* Subtitle */}
          <p className="mx-auto mt-6 max-w-2xl text-center text-lg text-gray-500">
            {heroSubtitle}
          </p>

          {/* CTA */}
          <div className="mt-10 flex justify-center">
            <Link
              href="/auth/register"
              className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl"
            >
              {heroCta}
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>

          {/* Tabs */}
          <div className="mx-auto mt-16 max-w-4xl">
            <div className="flex flex-wrap items-center justify-center gap-2">
              {productTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="mt-8 grid items-center gap-8 md:grid-cols-2">
              {productTabs
                .filter((tab) => tab.id === activeTab)
                .map((tab) => (
                  <div key={tab.id}>
                    <p className="text-lg text-gray-600">{tab.desc}</p>
                  </div>
                ))}
              <div className="hidden md:block">
                <div
                  className={`flex h-56 items-center justify-center rounded-2xl bg-gradient-to-br ${
                    productTabs.find((t) => t.id === activeTab)?.gradient
                  } text-white`}
                >
                  <Store className="h-20 w-20 opacity-50" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════ TESTIMONIALS ═══════════════ */}
      {showSection("showTestimonials") && (
      <section id="testimonials" className="border-y border-gray-100 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
            Ils vendent avec {siteName}
          </h2>
        </div>
        <div className="relative mt-12 overflow-hidden">
          <div className="flex gap-6 animate-[scroll_40s_linear_infinite] w-max">
            {[...testimonials, ...testimonials].map((t, i) => (
              <div
                key={i}
                className="w-80 flex-shrink-0 rounded-2xl border border-gray-200 bg-white p-6 shadow-sm"
              >
                <p className="text-sm italic leading-relaxed text-gray-600">&ldquo;{t.quote}&rdquo;</p>
                <div className="mt-5 flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-full text-xs font-bold text-white ${t.color}`}
                  >
                    {t.name.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {t.name} <span className="ml-1">{t.flag}</span>
                    </p>
                    <p className="text-xs text-gray-500">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
        <style>{`
          @keyframes scroll {
            0% { transform: translateX(0); }
            100% { transform: translateX(-50%); }
          }
        `}</style>
      </section>
      )}

      {/* ═══════════════ STATS ═══════════════ */}
      {showSection("showStats") && (
      <section className="bg-white py-16">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
            {[
              { value: "+10.000", label: "Vendeurs actifs" },
              { value: "+50.000", label: "Produits vendus" },
              { value: "+150", label: "Pays couverts" },
            ].map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl font-bold text-indigo-600 sm:text-4xl">{stat.value}</p>
                <p className="mt-2 text-sm text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════ SELL CATEGORIES ═══════════════ */}
      {showSection("showCategories") && (
      <section className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {/* Header */}
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Vendez tout ce que vous voulez sur{" "}
              <span className="text-indigo-600">{siteName}</span>
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
              Produits physiques, produits digitaux et services — une seule plateforme pour développer
              votre business.
            </p>
          </div>

          {/* 3 Cards */}
          <div className="mt-14 grid gap-8 lg:grid-cols-3">
            {sellCategories.map((cat) => (
              <div
                key={cat.type}
                className="group relative rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-lg"
              >
                {/* Icon */}
                <div
                  className={`inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br ${cat.gradient} text-white shadow-lg`}
                >
                  <cat.icon className="h-7 w-7" />
                </div>

                {/* Title */}
                <h3 className="mt-6 text-xl font-bold text-gray-900">{cat.title}</h3>

                {/* Description */}
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{cat.desc}</p>

                {/* Examples */}
                <div className="mt-6 flex flex-wrap gap-2">
                  {cat.examples.map((ex) => (
                    <span
                      key={ex.label}
                      className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 bg-gray-50 px-3 py-1.5 text-xs font-medium text-gray-600"
                    >
                      <ex.icon className="h-3.5 w-3.5" />
                      {ex.label}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Synthesis block */}
          <div className="mt-14 rounded-2xl border border-indigo-100 bg-indigo-50 p-8 sm:p-10">
            <div className="flex flex-col items-center gap-8 md:flex-row">
              <div className="flex-1">
                <h3 className="text-xl font-bold text-gray-900">
                  Avec {siteName}, vous pouvez gérer dans une seule boutique :
                </h3>
                <ul className="mt-5 space-y-3">
                  {["Produits physiques", "Produits digitaux", "Services"].map((item) => (
                    <li key={item} className="flex items-center gap-3 text-gray-700">
                      <div className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-indigo-600">
                        <Check className="h-3.5 w-3.5 text-white" />
                      </div>
                      <span className="font-medium">{item}</span>
                    </li>
                  ))}
                </ul>
                <p className="mt-4 text-sm text-gray-500">
                  Tout est centralisé dans votre tableau de bord vendeur.
                </p>
              </div>
              <div className="flex-shrink-0">
                <Link
                  href="/auth/register"
                  className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl"
                >
                  Commencez à vendre dès aujourd&apos;hui
                  <ArrowRight className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════ FEATURES ═══════════════ */}
      {showSection("showFeatures") && (<>
      <section id="features" className="bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
            Tout ce qu&apos;il vous faut pour vendre
          </h2>
          <div className="mt-12 grid gap-6 lg:grid-cols-2">
            {features.map((f) => (
              <div
                key={f.title}
                className="flex flex-col justify-between rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md"
              >
                <div>
                  <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${f.gradient} text-white`}>
                    <f.icon className="h-6 w-6" />
                  </div>
                  <h3 className="mt-5 text-xl font-bold text-gray-900">{f.title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-gray-500">{f.desc}</p>
                </div>
                <Link
                  href="/auth/register"
                  className="mt-6 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {f.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ SMALL FEATURES ═══════════════ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
            Des fonctionnalités qui accélèrent votre croissance.
          </h2>
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {smallFeatures.map((f) => (
              <div
                key={f.title}
                className="rounded-2xl border border-gray-200 bg-gray-50 p-6 transition-all hover:bg-white hover:shadow-md"
              >
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-indigo-100 text-indigo-600">
                  <f.icon className="h-5 w-5" />
                </div>
                <h3 className="mt-4 text-base font-bold text-gray-900">{f.title}</h3>
                <p className="mt-2 text-sm text-gray-500">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </>)}

      {/* ═══════════════ MARQUEE ═══════════════ */}
      {showSection("showMarquee") && (
      <section className="border-y border-gray-100 bg-gray-50 py-8">
        <div className="relative overflow-hidden">
          <div className="flex gap-4 animate-[marquee_30s_linear_infinite] w-max">
            {[...marqueeItems, ...marqueeItems, ...marqueeItems, ...marqueeItems].map((item, i) => (
              <span
                key={i}
                className="inline-flex flex-shrink-0 rounded-full border border-gray-200 bg-white px-5 py-2 text-sm font-medium text-gray-700 shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
          <style>{`
            @keyframes marquee {
              0% { transform: translateX(0); }
              100% { transform: translateX(-25%); }
            }
          `}</style>
        </div>
      </section>
      )}

      {/* ═══════════════ RESOURCES ═══════════════ */}
      {showSection("showResources") && (
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
            Des ressources pour aller plus loin
          </h2>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {resources.map((r) => (
              <div
                key={r.title}
                className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition-all hover:shadow-md"
              >
                <div className={`inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${r.gradient} text-white`}>
                  <r.icon className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-bold text-gray-900">{r.title}</h3>
                <p className="mt-3 text-sm text-gray-500">{r.desc}</p>
                <Link
                  href="#"
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-indigo-600 hover:text-indigo-700"
                >
                  {r.cta}
                  <ArrowRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════ RECENTLY VIEWED ═══════════════ */}
      {recentlyViewed.length > 0 && (
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-extrabold tracking-tight text-gray-900 sm:text-3xl">
                Récemment consultés
              </h2>
              <p className="mt-1 text-sm text-gray-500">Les produits que vous avez récemment vus</p>
            </div>
            <button
              onClick={clearRecent}
              className="text-sm font-medium text-gray-500 hover:text-gray-700 underline"
            >
              Effacer l&apos;historique
            </button>
          </div>

          <div className="mt-8 flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
            {recentlyViewed.map((product) => (
              <Link
                key={product.id}
                href={`/product/${product.slug}`}
                className="group flex-shrink-0 w-48 rounded-xl border border-gray-200 bg-white p-3 transition-all hover:shadow-md hover:border-[#7126b6]/30"
              >
                <div className="aspect-square overflow-hidden rounded-lg bg-gray-100">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.name}
                      className="h-full w-full object-cover transition-transform group-hover:scale-105"
                    />
                  ) : (
                    <div className="flex h-full items-center justify-center">
                      <Store className="h-10 w-10 text-gray-300" />
                    </div>
                  )}
                </div>
                <p className="mt-2 text-[10px] text-gray-400 truncate">{product.shopName}</p>
                <h3 className="line-clamp-2 text-sm font-medium text-gray-900">{product.name}</h3>
                <p className="mt-1 text-sm font-bold text-[#7126b6]">{formatPrice(product.price)}</p>
              </Link>
            ))}
          </div>
        </div>
      </section>
      )}

      {/* ═══════════════ FINAL CTA ═══════════════ */}
      <section className="bg-slate-900 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 text-center sm:px-6 lg:px-8">
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-4xl">
            Commencez à vendre dès aujourd&apos;hui
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-lg text-gray-400">
            +10.000 vendeurs génèrent déjà des revenus avec {siteName}.
          </p>
          <Link
            href="/auth/register"
            className="mt-8 inline-flex items-center gap-2 rounded-full bg-indigo-600 px-8 py-4 text-base font-semibold text-white shadow-lg shadow-indigo-600/25 transition-all hover:bg-indigo-700 hover:shadow-xl"
          >
            Créer ma boutique gratuitement
            <ArrowRight className="h-5 w-5" />
          </Link>
          <div className="mt-10">
            <img src="/brand/logo.png" alt={siteName} className="h-[36px] md:h-[48px] w-auto mx-auto" />
          </div>
        </div>
      </section>
    </div>
  );
}
