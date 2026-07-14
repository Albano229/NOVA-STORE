"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
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
  Gift,
  Monitor,
  Settings,
  Star,
  Award,
  Clock,
  Image,
  MessageCircle,
  GraduationCap,
  Calendar,
  Target,
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
    icon: Package,
    shortDesc: "Vendez des produits tangibles et gérez votre stock facilement.",
    desc: "Vendez des vêtements, électronique, accessoires et tout produit tangible directement depuis votre boutique. Gérez votre inventaire, suivez vos expéditions et offrez une expérience d'achat professionnelle à vos clients, partout dans le monde.",
    gradient: "from-indigo-500 to-purple-600",
    features: ["Gestion de stock en temps réel", "Intégration transporteurs", "Suivi des expéditions", "Étiquettes d'expédition"],
    examples: ["Vêtements", "Électronique", "Alimentation", "Maison", "Accessoires"],
    mockup: "📦",
  },
  {
    id: "digital",
    label: "Produits Digitaux",
    icon: Download,
    subcategories: [
      {
        name: "Ressources",
        emoji: "📄",
        desc: "Ebooks, templates, logiciels, musiques, photos — vendez des fichiers numériques téléchargeables instantanément après paiement.",
        examples: ["Ebooks", "Logiciels", "Templates", "Musiques", "Photos"],
      },
      {
        name: "Formations",
        emoji: "🎓",
        desc: "Cours vidéo, masterclass, bootcamps — créez des formations complètes avec quiz, exercices et certificats automatiques.",
        examples: ["Cours vidéo", "Masterclass", "Bootcamps", "Tutoriels", "Certifications"],
      },
    ],
    shortDesc: "Ressources et formations numériques téléchargeables instantanément.",
    desc: "Vendez des ressources numériques (ebooks, logiciels, templates) ou créez des formations en ligne complètes avec vidéos, quiz et certificats. Livraison instantanée, zéro stock, marges maximales.",
    gradient: "from-emerald-500 to-teal-600",
    features: ["Livraison automatique", "Éditeur de cours vidéo", "Quiz & certificats", "Protection anti-piratage"],
    examples: ["Ebooks", "Formations", "Logiciels", "Templates", "Musiques"],
    mockup: "💻",
  },
  {
    id: "bundle",
    label: "Bundles",
    icon: Gift,
    shortDesc: "Créez des packs gagnants combinant plusieurs produits.",
    desc: "Proposez des packs combinant plusieurs produits (physique + digital, formation + coaching, etc.). Augmentez votre panier moyen et offrez plus de valeur à vos clients avec des offres groupées irrésistibles.",
    gradient: "from-amber-500 to-orange-600",
    features: ["Packs personnalisables", "Remises automatiques", "Stock groupé", "Promotions flash"],
    examples: ["Pack vêtements + ebook", "Formation + coaching", "Lot de produits", "Offre découverte"],
    mockup: "🎁",
  },
  {
    id: "community",
    label: "Communauté",
    icon: Users,
    shortDesc: "Créez une communauté privée payante autour de votre expertise.",
    desc: "Monétisez votre audience avec des communautés privées, groupes d'entraide, forums VIP ou abonnements exclusifs. Idéal pour les créateurs de contenu, coachs et experts qui veulent fidéliser leurs membres.",
    gradient: "from-rose-500 to-pink-600",
    features: ["Groupes privés", "Abonnements récurrents", "Messagerie intégrée", "Contenu exclusif"],
    examples: ["Groupe VIP", "Forum privé", "Abonnement mensuel", "Club d'entraide"],
    mockup: "👥",
  },
  {
    id: "booking",
    label: "Réservation",
    icon: Calendar,
    shortDesc: "Proposez des rendez-vous et services avec planning intégré.",
    desc: "Gérez vos rendez-vous, consultations et prestations de services avec un calendrier intelligent. Vos clients réservent directement en ligne, paient à l'avance et reçoivent des rappels automatiques.",
    gradient: "from-cyan-500 to-blue-600",
    features: ["Calendrier en ligne", "Paiement à la réservation", "Rappels automatiques", "Gestion des créneaux"],
    examples: ["Consultation", "Coaching session", "Service pro", "Rendez-vous"],
    mockup: "📅",
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
    desc: "Ressources numériques et formations en ligne. Ebooks, logiciels, cours vidéo avec quiz et certificats intégrés.",
    gradient: "from-emerald-500 to-emerald-700",
    examples: [
      { icon: FileText, label: "Ebooks" },
      { icon: Video, label: "Formations" },
      { icon: Code, label: "Logiciels" },
      { icon: Music, label: "Musiques" },
      { icon: Film, label: "Templates" },
    ],
  },
  {
    type: "bundle",
    icon: Gift,
    title: "Bundles",
    desc: "Créez des packs combinant plusieurs produits. Augmentez votre panier moyen avec des offres groupées attractives.",
    gradient: "from-amber-500 to-amber-700",
    examples: [
      { icon: Package, label: "Packs" },
      { icon: Star, label: "Promotions" },
      { icon: Tag, label: "Remises" },
      { icon: Zap, label: "Flash deals" },
      { icon: Gift, label: "Offres" },
    ],
  },
  {
    type: "community",
    icon: Users,
    title: "Communauté",
    desc: "Créez une communauté privée payante. Abonnements récurrents, groupes VIP et contenu exclusif pour vos membres.",
    gradient: "from-rose-500 to-rose-700",
    examples: [
      { icon: Users, label: "Groupes VIP" },
      { icon: MessageCircle, label: "Forums" },
      { icon: Star, label: "Abonnements" },
      { icon: Shield, label: "Exclusivité" },
      { icon: Award, label: "Fidélité" },
    ],
  },
  {
    type: "booking",
    icon: Calendar,
    title: "Réservation",
    desc: "Proposez des rendez-vous et services avec un calendrier intelligent. Réservation en ligne et paiement à l'avance.",
    gradient: "from-cyan-500 to-cyan-700",
    examples: [
      { icon: Clock, label: "Rendez-vous" },
      { icon: Calendar, label: "Planning" },
      { icon: CreditCard, label: "Paiement" },
      { icon: Headphones, label: "Services" },
      { icon: Target, label: "Coaching" },
    ],
  },
];

/* ────────────────────────────────────────────
   PAGE
──────────────────────────────────────────── */

export default function HomePage() {
  const [activeTab, setActiveTab] = useState("physical");
  const searchParams = useSearchParams();

  // Lire le paramètre ?tab= pour activer le bon onglet
  useEffect(() => {
    const tab = searchParams.get("tab");
    if (tab && ["physical", "digital", "bundle", "community", "booking"].includes(tab)) {
      setActiveTab(tab);
      // Scroll vers la section hero
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  }, [searchParams]);
  const { settings } = useSiteSettings();
  const siteName = settings.siteName || BRAND.name;
  const { recentlyViewed, clearRecent } = useRecentlyViewed();

  const heroTitle = settings.heroTitle || "La plateforme N°1 pour vendre vos produits en Afrique et dans le monde.";
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
            <span className="text-sm font-medium text-gray-500">Des milliers de vendeurs en Afrique</span>
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

          {/* Tabs - Types de produits */}
          <div className="mx-auto mt-16 max-w-6xl">
            {/* Boutons des onglets */}
            <div className="flex flex-wrap items-center justify-center gap-2">
              {productTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium transition-all ${
                    activeTab === tab.id
                      ? "bg-indigo-600 text-white shadow-md"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </button>
              ))}
            </div>

            {/* Contenu de l'onglet actif */}
            {productTabs
              .filter((tab) => tab.id === activeTab)
              .map((tab) => (
                <div key={tab.id} className="mt-10">
                  <div className="grid items-center gap-10 lg:grid-cols-5">
                    {/* Texte explicatif */}
                    <div className="lg:col-span-3">
                      <h3 className="text-2xl font-bold text-gray-900">
                        {tab.label}
                      </h3>
                      <p className="mt-3 text-base leading-relaxed text-gray-500">
                        {tab.desc}
                      </p>

                      {/* Caractéristiques */}
                      <div className="mt-6 grid grid-cols-2 gap-3">
                        {tab.features.map((f) => (
                          <div key={f} className="flex items-center gap-2 text-sm text-gray-600">
                            <div className={`h-2 w-2 rounded-full bg-gradient-to-r ${tab.gradient}`} />
                            {f}
                          </div>
                        ))}
                      </div>

                      {/* Exemples */}
                      <div className="mt-6">
                        <p className="text-sm font-medium text-gray-700">Exemples :</p>
                        <div className="mt-2 flex flex-wrap gap-2">
                          {tab.examples.map((ex) => (
                            <span
                              key={ex}
                              className="rounded-full border border-gray-200 bg-gray-50 px-3 py-1 text-xs font-medium text-gray-600"
                            >
                              {ex}
                            </span>
                          ))}
                        </div>
                      </div>

                      <Link
                        href={`/produits/${tab.id === "physical" ? "physique" : tab.id === "digital" ? "digital" : tab.id === "bundle" ? "bundle" : tab.id === "community" ? "communaute" : "reservation"}`}
                        className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r ${tab.gradient} px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:shadow-lg`}
                      >
                        En savoir plus
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </div>

                    {/* Mockup / Visuel - Dashboard réaliste */}
                    <div className="lg:col-span-2">
                      <div className={`relative overflow-hidden rounded-2xl bg-gradient-to-br ${tab.gradient} p-1 shadow-lg`}>
                        <div className="rounded-xl bg-white p-4 sm:p-5">
                          {/* Barre type fenêtre */}
                          <div className="mb-3 flex items-center gap-1.5">
                            <div className="h-2.5 w-2.5 rounded-full bg-red-400" />
                            <div className="h-2.5 w-2.5 rounded-full bg-yellow-400" />
                            <div className="h-2.5 w-2.5 rounded-full bg-green-400" />
                            <span className="ml-2 text-[10px] text-gray-400 font-medium">Dashboard vendeur — {tab.label}</span>
                          </div>

                          {tab.subcategories ? (
                            /* --- DIGITAL avec sous-catégories Ressources & Formations --- */
                            <div className="space-y-4">
                              {/* Mini stats */}
                              <div className="grid grid-cols-3 gap-2">
                                {[
                                  { label: "Ventes", value: "847", color: "text-emerald-600", bg: "bg-emerald-50" },
                                  { label: "Élèves", value: "234", color: "text-blue-600", bg: "bg-blue-50" },
                                  { label: "Revenus", value: "12.4k€", color: "text-amber-600", bg: "bg-amber-50" },
                                ].map((s) => (
                                  <div key={s.label} className={`rounded-lg ${s.bg} p-2 text-center`}>
                                    <p className="text-[10px] text-gray-500">{s.label}</p>
                                    <p className={`text-sm font-bold ${s.color}`}>{s.value}</p>
                                  </div>
                                ))}
                              </div>
                              {/* Sous-catégories côte à côte */}
                              <div className="grid grid-cols-2 gap-2">
                                {tab.subcategories.map((sub) => (
                                  <div key={sub.name} className="rounded-lg border border-gray-100 bg-gray-50 p-3 text-center">
                                    <span className="text-xl">{sub.emoji}</span>
                                    <h5 className="mt-1 text-xs font-bold text-gray-900">{sub.name}</h5>
                                    <div className="mt-1.5 flex flex-wrap justify-center gap-1">
                                      {sub.examples.slice(0, 3).map((ex) => (
                                        <span key={ex} className="rounded-full bg-white px-1.5 py-0.5 text-[9px] font-medium text-gray-600 shadow-sm">{ex}</span>
                                      ))}
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          ) : (
                            /* --- DASHBOARD RÉALISTE pour les autres types --- */
                            <div className="space-y-3">
                              {/* Barre latérale + contenu */}
                              <div className="flex gap-2">
                                {/* Sidebar mini */}
                                <div className="flex w-8 flex-col gap-1.5 rounded-lg bg-gray-100 p-1.5">
                                  {["📊", "🛒", "💳", "👥", "⚙️"].map((icon, i) => (
                                    <div key={i} className={`flex h-5 w-5 items-center justify-center rounded text-[10px] ${i === 1 ? "bg-white shadow-sm" : ""}`}>{icon}</div>
                                  ))}
                                </div>
                                {/* Contenu principal */}
                                <div className="flex-1 space-y-2">
                                  {/* Stats row */}
                                  <div className="grid grid-cols-3 gap-1.5">
                                    {[
                                      { label: "Ventes", value: "1,284", change: "+12%", up: true },
                                      { label: "Visiteurs", value: "8,432", change: "+8%", up: true },
                                      { label: "Revenu", value: "3.240€", change: "-2%", up: false },
                                    ].map((s) => (
                                      <div key={s.label} className="rounded-lg bg-gray-50 p-2">
                                        <p className="text-[9px] text-gray-500">{s.label}</p>
                                        <p className="text-sm font-bold text-gray-900">{s.value}</p>
                                        <p className={`text-[9px] ${s.up ? "text-emerald-600" : "text-red-600"}`}>{s.change}</p>
                                      </div>
                                    ))}
                                  </div>
                                  {/* Mini graphique */}
                                  <div className="flex h-12 items-end gap-1 rounded-lg bg-gray-50 px-2 py-1.5">
                                    {[35, 55, 42, 70, 60, 85, 75, 90, 80, 65].map((h, i) => (
                                      <div key={i} className={`flex-1 rounded-t ${i >= 7 ? "bg-indigo-500" : "bg-indigo-200"}`} style={{ height: `${h}%` }} />
                                    ))}
                                  </div>
                                  {/* Produits récents */}
                                  <div className="rounded-lg bg-gray-50 p-2">
                                    <p className="text-[9px] font-semibold text-gray-500 mb-1">🛍️ Produits récents</p>
                                    {[
                                      { name: "Smartphone Pro Max", price: "450.000 F", sold: "23" },
                                      { name: "Formation Marketing", price: "75.000 F", sold: "12" },
                                    ].map((p) => (
                                      <div key={p.name} className="flex items-center justify-between py-0.5">
                                        <span className="text-[10px] text-gray-700 truncate max-w-[60%]">{p.name}</span>
                                        <span className="text-[10px] font-medium text-gray-900">{p.price}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              {/* Badge en bas */}
                              <div className={`rounded-full bg-gradient-to-r ${tab.gradient} px-3 py-1 text-center`}>
                                <span className="text-[10px] font-semibold text-white">✨ Gérez tout depuis votre tableau de bord</span>
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
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
              Produits physiques, digitaux, bundles, communauté et réservation — une seule plateforme pour développer
              votre business.
            </p>
          </div>

          {/* 5 Cards */}
          <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
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

      {/* ═══════════════ PRICING / COMMISSION ═══════════════ */}
      {showSection("showPricing") && (
      <section id="pricing" className="border-t border-gray-100 bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <h2 className="text-center text-3xl font-extrabold tracking-tight text-gray-900">
            Une commission unique de 5%
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-center text-lg text-gray-500">
            Pas d&apos;abonnement, pas de frais cachés. Vous ne payez que lorsque vous vendez.
          </p>

          <div className="mt-12 grid gap-8 lg:grid-cols-3">
            {/* Carte Gratuite */}
            <div className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Démarrage</h3>
              <p className="mt-2 text-4xl font-bold text-gray-900">Gratuit</p>
              <p className="mt-1 text-sm text-gray-500">0 FCFA / mois</p>
              <ul className="mt-6 flex-1 space-y-3">
                {["Boutique en ligne", "Produits illimités", "Paiements intégrés", "Support standard"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
              >
                Commencer gratuitement
              </Link>
            </div>

            {/* Carte Recommandée - Commission 5% */}
            <div className="relative flex flex-col rounded-2xl border-2 border-indigo-500 bg-white p-8 shadow-lg shadow-indigo-500/10">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-indigo-600 px-4 py-1 text-xs font-semibold text-white">
                Le plus populaire
              </span>
              <h3 className="text-lg font-semibold text-gray-900">Commission</h3>
              <p className="mt-2 text-4xl font-bold text-indigo-600">5%</p>
              <p className="mt-1 text-sm text-gray-500">par transaction</p>
              <ul className="mt-6 flex-1 space-y-3">
                {["Pas d'abonnement mensuel", "Paiement à la vente uniquement", "Tous les moyens de paiement", "Support prioritaire", "Statistiques avancées", "Export des données"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="/auth/register"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-md transition-all hover:bg-indigo-700"
              >
                Créer ma boutique
              </Link>
            </div>

            {/* Carte Premium */}
            <div className="relative flex flex-col rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
              <h3 className="text-lg font-semibold text-gray-900">Premium</h3>
              <p className="mt-2 text-4xl font-bold text-gray-900">3%</p>
              <p className="mt-1 text-sm text-gray-500">pour les gros volumes</p>
              <ul className="mt-6 flex-1 space-y-3">
                {["Tout de la formule Commission", "Commission réduite à 3%", "API dédiée", "Gestionnaire de compte", "Intégrations sur mesure", "Formation prioritaire"].map((item) => (
                  <li key={item} className="flex items-center gap-2 text-sm text-gray-600">
                    <Check className="h-4 w-4 text-emerald-500" />
                    {item}
                  </li>
                ))}
              </ul>
              <Link
                href="mailto:novadigital184@gmail.com"
                className="mt-8 inline-flex w-full items-center justify-center rounded-full border border-gray-300 bg-white px-6 py-3 text-sm font-semibold text-gray-900 transition-colors hover:bg-gray-50"
              >
                Nous contacter
              </Link>
            </div>
          </div>

          <p className="mt-10 text-center text-sm text-gray-400">
            Tous les prix sont en FCFA. Commission prélevée automatiquement sur chaque transaction réussie.
          </p>
        </div>
      </section>
      )}

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

      {/* ═══════════════ COMMENT ÇA MARCHE ═══════════════ */}
      <section className="bg-white py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Comment ça marche ?
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-lg text-gray-500">
              Créez votre boutique en 5 minutes et commencez à vendre immédiatement.
            </p>
          </div>
          <div className="mt-14 grid gap-8 md:grid-cols-3">
            {[
              {
                step: "1",
                emoji: "📝",
                title: "Créez votre boutique",
                desc: "Inscrivez-vous gratuitement, personnalisez votre boutique avec nos thèmes professionnels et ajoutez vos premiers produits en quelques clics.",
              },
              {
                step: "2",
                emoji: "🚀",
                title: "Vendez vos produits",
                desc: "Que ce soit des produits physiques, digitaux, bundles, abonnements ou réservations — gérez tout depuis un tableau de bord unique et puissant.",
              },
              {
                step: "3",
                emoji: "💰",
                title: "Recevez vos paiements",
                desc: "Touchez vos revenus rapidement via Wave, Moov Money, MTN Mobile Money, carte bancaire et plus. Suivez vos finances en temps réel.",
              },
            ].map((item) => (
              <div key={item.step} className="relative rounded-2xl border border-gray-100 bg-white p-8 text-center shadow-sm transition-all hover:shadow-lg hover:-translate-y-1">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-50 text-2xl">
                  {item.emoji}
                </div>
                <div className="absolute -top-3 left-6 flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-sm font-bold text-white shadow-md">
                  {item.step}
                </div>
                <h3 className="mt-6 text-lg font-bold text-gray-900">{item.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-gray-500">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════ FAQ ═══════════════ */}
      <section className="border-y border-gray-100 bg-gray-50 py-16 sm:py-20">
        <div className="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 sm:text-4xl">
              Questions fréquentes
            </h2>
            <p className="mx-auto mt-4 max-w-xl text-lg text-gray-500">
              Tout ce que vous devez savoir pour commencer.
            </p>
          </div>
          <div className="mt-12 space-y-4">
            {[
              {
                q: "Combien coûte la création d'une boutique ?",
                a: "C'est totalement gratuit ! Créez votre boutique sans aucun abonnement. Vous ne payez qu'une commission de 5% uniquement lorsque vous réalisez une vente.",
              },
              {
                q: "Quels moyens de paiement puis-je accepter ?",
                a: "Vous pouvez accepter les paiements par Wave, Moov Money, MTN Mobile Money, cartes bancaires (Visa, Mastercard), PayPal et bien d'autres — le tout centralisé dans votre boutique.",
              },
              {
                q: "Puis-je vendre depuis n'importe quel pays ?",
                a: "Oui ! NOVA STORE est conçu pour les vendeurs africains et internationaux. Vous pouvez vendre partout dans le monde et recevoir vos paiements dans votre devise locale.",
              },
              {
                q: "Comment fonctionne la commission de 5% ?",
                a: "Les 5% sont prélevés uniquement sur chaque vente réussie. Pas de frais cachés, pas d'abonnement mensuel. Si vous ne vendez pas, vous ne payez rien.",
              },
              {
                q: "Puis-je vendre plusieurs types de produits ?",
                a: "Absolument ! Vous pouvez vendre des produits physiques, digitaux, bundles, abonnements communautaires et réservations — le tout depuis une seule boutique.",
              },
            ].map((faq) => (
              <details key={faq.q} className="group rounded-xl border border-gray-200 bg-white shadow-sm transition-all hover:shadow-md">
                <summary className="flex cursor-pointer items-center justify-between px-6 py-4 text-sm font-semibold text-gray-900 hover:text-indigo-600">
                  {faq.q}
                  <svg className="h-5 w-5 text-gray-400 transition-transform group-open:rotate-180" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </summary>
                <div className="border-t border-gray-100 px-6 py-4">
                  <p className="text-sm leading-relaxed text-gray-600">{faq.a}</p>
                </div>
              </details>
            ))}
          </div>
        </div>
      </section>
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
