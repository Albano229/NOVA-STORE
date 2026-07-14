export type ProductType = "PHYSICAL" | "DIGITAL" | "BUNDLE" | "COMMUNITY" | "BOOKING"

export const PRODUCT_TYPES: Array<{
  type: ProductType
  label: string
  icon: string
  description: string
  color: string
  defaultCta: string
}> = [
  {
    type: "PHYSICAL",
    label: "Produit physique",
    icon: "Package",
    description: "Articles tangibles à expédier : vêtements, électronique, accessoires...",
    color: "from-blue-500 to-blue-600",
    defaultCta: "Ajouter au panier",
  },
  {
    type: "DIGITAL",
    label: "Produit numérique",
    icon: "Download",
    description: "Fichiers téléchargeables : e-books, templates, logiciels, photos...",
    color: "from-purple-500 to-purple-600",
    defaultCta: "Télécharger",
  },
  {
    type: "COMMUNITY",
    label: "Communauté",
    icon: "Users",
    description: "Accès à une communauté privée, abonnements, memberships...",
    color: "from-orange-500 to-orange-600",
    defaultCta: "Rejoindre",
  },
  {
    type: "BUNDLE",
    label: "Pack / Bundle",
    icon: "Boxes",
    description: "Ensemble de produits groupés avec une réduction attractive...",
    color: "from-pink-500 to-pink-600",
    defaultCta: "Acheter le pack",
  },
  {
    type: "BOOKING",
    label: "Réservation",
    icon: "Calendar",
    description: "Réservation de places, événements, rendez-vous, ateliers...",
    color: "from-amber-500 to-amber-600",
    defaultCta: "Réserver",
  },
]

export const PRODUCT_TYPE_FIELDS: Record<ProductType, string[]> = {
  PHYSICAL: ["stock", "weight", "dimensions", "variants", "shipping", "preparationDelay", "sku", "warranty", "returnPolicy"],
  DIGITAL: ["fileUrl", "externalUrl", "maxDownloads", "version", "fileSize", "fileType", "accessDuration"],
  BUNDLE: ["bundleProducts", "bundleDiscount", "bundleItems"],
  COMMUNITY: ["isSubscription", "subscriptionPrice", "subscriptionInterval", "privateAccess", "accessType", "communityInfo"],
  BOOKING: ["eventDate", "eventTime", "eventDuration", "eventLocation", "maxSeats", "availability"],
}

export const CATEGORIES = {
  PHYSICAL: [
    {
      id: "clothing",
      name: "Vêtements & Mode",
      icon: "Shirt",
      subcategories: [
        { id: "men-clothing", name: "Homme" },
        { id: "women-clothing", name: "Femme" },
        { id: "kids-clothing", name: "Enfant" },
        { id: "accessories", name: "Accessoires" },
        { id: "shoes", name: "Chaussures" },
      ],
    },
    {
      id: "electronics",
      name: "Électronique",
      icon: "Smartphone",
      subcategories: [
        { id: "phones", name: "Téléphones" },
        { id: "computers", name: "Ordinateurs" },
        { id: "audio", name: "Audio" },
        { id: "gaming", name: "Gaming" },
        { id: "photography", name: "Photographie" },
      ],
    },
    {
      id: "home",
      name: "Maison & Décoration",
      icon: "Home",
      subcategories: [
        { id: "furniture", name: "Mobilier" },
        { id: "decoration", name: "Décoration" },
        { id: "kitchen", name: "Cuisine" },
        { id: "garden", name: "Jardin" },
      ],
    },
    {
      id: "beauty",
      name: "Beauté & Santé",
      icon: "Sparkles",
      subcategories: [
        { id: "skincare", name: "Soins du visage" },
        { id: "makeup", name: "Maquillage" },
        { id: "wellness", name: "Bien-être" },
        { id: "supplements", name: "Compléments" },
      ],
    },
    {
      id: "sports",
      name: "Sports & Loisirs",
      icon: "Dumbbell",
      subcategories: [
        { id: "fitness", name: "Fitness" },
        { id: "outdoor", name: "Plein air" },
        { id: "team-sports", name: "Sports collectifs" },
      ],
    },
    {
      id: "food",
      name: "Alimentation",
      icon: "UtensilsCrossed",
      subcategories: [
        { id: "groceries", name: "Épicerie" },
        { id: "drinks", name: "Boissons" },
        { id: "organic", name: "Bio" },
      ],
    },
  ],
  DIGITAL: [
    {
      id: "ebooks",
      name: "E-books & Guides",
      icon: "BookOpen",
      subcategories: [
        { id: "novels", name: "Romans" },
        { id: "business", name: "Business" },
        { id: "self-help", name: "Développement personnel" },
        { id: "technical", name: "Technique" },
      ],
    },
    {
      id: "templates",
      name: "Templates & Designs",
      icon: "Layout",
      subcategories: [
        { id: "resume", name: "CV & Lettres" },
        { id: "presentation", name: "Présentations" },
        { id: "social-media", name: "Réseaux sociaux" },
        { id: "website", name: "Sites web" },
      ],
    },
    {
      id: "software",
      name: "Logiciels & Apps",
      icon: "Code",
      subcategories: [
        { id: "productivity", name: "Productivité" },
        { id: "utilities", name: "Utilitaires" },
        { id: "plugins", name: "Plugins & Extensions" },
      ],
    },
    {
      id: "media",
      name: "Photos & Vidéos",
      icon: "Image",
      subcategories: [
        { id: "stock-photos", name: "Photos stock" },
        { id: "video-templates", name: "Templates vidéo" },
        { id: "music", name: "Musique" },
        { id: "sound-effects", name: "Effets sonores" },
      ],
    },
    {
      id: "digital-art",
      name: "Art Numérique",
      icon: "Palette",
      subcategories: [
        { id: "illustrations", name: "Illustrations" },
        { id: "fonts", name: "Polices" },
        { id: "icons", name: "Icônes" },
        { id: "3d-models", name: "Modèles 3D" },
      ],
    },
  ],
  COMMUNITY: [
    {
      id: "membership",
      name: "Adhésion & Membership",
      icon: "Crown",
      subcategories: [
        { id: "premium", name: "Accès premium" },
        { id: "vip", name: "VIP" },
        { id: "exclusive", name: "Exclusif" },
      ],
    },
    {
      id: "group",
      name: "Groupe & Forum",
      icon: "MessageCircle",
      subcategories: [
        { id: "mastermind", name: "Mastermind" },
        { id: "support-group", name: "Groupe de soutien" },
        { id: "networking", name: "Networking" },
      ],
    },
    {
      id: "courses",
      name: "Cours & Académie",
      icon: "BookMarked",
      subcategories: [
        { id: "online-courses", name: "Cours en ligne" },
        { id: "mentorship", name: "Mentorat" },
        { id: "workshops", name: "Ateliers" },
      ],
    },
    {
      id: "content",
      name: "Contenu Exclusif",
      icon: "Lock",
      subcategories: [
        { id: "newsletter", name: "Newsletter premium" },
        { id: "podcast", name: "Podcast privé" },
        { id: "resources", name: "Ressources" },
      ],
    },
  ],
  BUNDLE: [
    {
      id: "starter-pack",
      name: "Pack Démarrage",
      icon: "Rocket",
      subcategories: [
        { id: "beginner", name: "Débutant" },
        { id: "intermediate", name: "Intermédiaire" },
        { id: "advanced", name: "Avancé" },
      ],
    },
    {
      id: "pro-bundle",
      name: "Pack Professionnel",
      icon: "Briefcase",
      subcategories: [
        { id: "freelance", name: "Freelance" },
        { id: "agency", name: "Agence" },
        { id: "enterprise", name: "Entreprise" },
      ],
    },
    {
      id: "seasonal",
      name: "Pack Saisonier",
      icon: "Calendar",
      subcategories: [
        { id: "summer", name: "Été" },
        { id: "winter", name: "Hiver" },
        { id: "holiday", name: "Fêtes" },
      ],
    },
    {
      id: "custom-bundle",
      name: "Pack Personnalisé",
      icon: "SlidersHorizontal",
      subcategories: [
        { id: "mixed", name: "Mixte" },
        { id: "themed", name: "Thématique" },
      ],
    },
  ],
  BOOKING: [
    {
      id: "events",
      name: "Événements",
      icon: "PartyPopper",
      subcategories: [
        { id: "concert", name: "Concert" },
        { id: "conference", name: "Conférence" },
        { id: "workshop", name: "Atelier" },
        { id: "webinar", name: "Webinaire" },
      ],
    },
    {
      id: "booking",
      name: "Réservation",
      icon: "CalendarCheck",
      subcategories: [
        { id: "room", name: "Salle" },
        { id: "equipment", name: "Équipement" },
        { id: "vehicle", name: "Véhicule" },
      ],
    },
    {
      id: "appointments",
      name: "Rendez-vous",
      icon: "Clock",
      subcategories: [
        { id: "medical", name: "Médical" },
        { id: "consultation", name: "Consultation" },
        { id: "coaching-session", name: "Séance coaching" },
      ],
    },
    {
      id: "classes",
      name: "Cours & Sessions",
      icon: "BookOpen",
      subcategories: [
        { id: "fitness-class", name: "Fitness" },
        { id: "music-class", name: "Musique" },
        { id: "language-class", name: "Langues" },
      ],
    },
  ],
}

export const CURRENCIES = [
  { code: "XOF", symbol: "FCFA", name: "Franc CFA" },
  { code: "EUR", symbol: "€", name: "Euro" },
  { code: "USD", symbol: "$", name: "Dollar américain" },
]

export const SUBSCRIPTION_INTERVALS = [
  { value: "monthly", label: "Mensuel" },
  { value: "quarterly", label: "Trimestriel" },
  { value: "yearly", label: "Annuel" },
]

export const PREPARATION_DELAYS = [
  { value: "immediate", label: "Immédiat" },
  { value: "1-2days", label: "1-2 jours" },
  { value: "3-5days", label: "3-5 jours" },
  { value: "1week", label: "1 semaine" },
  { value: "2weeks", label: "2 semaines" },
  { value: "custom", label: "Personnalisé" },
]

export const CTA_COLORS = [
  { value: "#3b82f6", label: "Bleu" },
  { value: "#10b981", label: "Vert" },
  { value: "#f59e0b", label: "Orange" },
  { value: "#ef4444", label: "Rouge" },
  { value: "#8b5cf6", label: "Violet" },
  { value: "#ec4899", label: "Rose" },
  { value: "#06b6d4", label: "Cyan" },
  { value: "#1e293b", label: "Sombre" },
  { value: "#f8fafc", label: "Clair" },
]

export interface FaqItem {
  question: string
  answer: string
}

export interface VariantOption {
  name: string
  values: string[]
}

export interface WizardData {
  step: string
  productType: ProductType | null
  name: string
  shortDescription: string
  categoryId: string
  subcategoryId: string
  price: number
  comparePrice: number
  currency: string
  brand: string
  sku: string
  description: string
  bannerUrl: string
  images: Array<{ url: string; alt: string; position: number }>
  videoUrl: string
  stock: number
  lowStockAlert: number
  weight: number
  dimensions: string
  variants: Array<{
    name: string
    sku: string
    price: number
    stock: number
    image: string
    options: Record<string, string>
  }>
  variantOptions: Array<{
    name: string
    values: string[]
  }>
  shippingEnabled: boolean
  shippingCost: number
  shippingCountries: string[]
  preparationDelay: string
  collectDeliveryAddress: boolean
  requiresShippingAddress: boolean
  carriers: string[]
  fileUrl: string
  externalUrl: string
  fileName: string
  fileSize: number
  fileType: string
  storagePath: string
  storageBucket: string
  maxDownloads: number
  version: string
  accessDuration: string
  accessType: string
  duration: string
  availability: string
  locationType: "online" | "offline" | "both"
  clientForm: string
  zone: string
  deliveryDelay: string
  paidOptions: Array<{ name: string; price: number }>
  isSubscription: boolean
  subscriptionPrice: number
  subscriptionInterval: string
  privateAccess: boolean
  communityInfo: string
  communityBannerUrl: string
  communityLogoUrl: string
  integrationInstructions: string
  bundleProducts: Array<{ productId: string; name: string; price: number }>
  bundleDiscount: number
  bundleItems: Array<{ name: string; description: string; included: boolean }>
  bundleBannerUrl: string
  bundleSquareImage: string
  bundleTotalRealPrice: number
  eventDate: string
  eventTime: string
  eventEndDate: string
  eventEndTime: string
  eventDuration: string
  eventLocation: string
  eventMode: "online" | "offline" | "both"
  onlineUrl: string
  physicalAddress: string
  maxSeats: number
  ticketCategories: Array<{ name: string; price: number; seats: number }>
  availabilitySchedule: string
  seoTitle: string
  seoDescription: string
  seoKeywords: string
  slug: string
  customUrl: string
  visibility: "published" | "hidden"
  isFeatured: boolean
  publishAt: string
  ctaText: string
  ctaColor: string
  ctaStyle: "solid" | "outline" | "rounded"
  priceType: "fixed" | "variable" | "free"
  warranty: string
  returnPolicy: string
  postPurchaseInstructions: string
  postPurchaseQuill: string
  autoDiscount: boolean
  autoDiscountType: "percentage" | "fixed"
  autoDiscountValue: number
  salesLimit: number
  countdownStartDate: string
  countdownEndDate: string
  countdownEnabled: boolean
  customButton: string
  hideFromStore: boolean
  faqItems: FaqItem[]
  requirementQuestions: Array<{ label: string; type: "text" | "file"; required: boolean }>
}

export const INITIAL_WIZARD_DATA: WizardData = {
  step: "type",
  productType: null,
  name: "",
  shortDescription: "",
  categoryId: "",
  subcategoryId: "",
  price: 0,
  comparePrice: 0,
  currency: "XOF",
  brand: "",
  sku: "",
  description: "",
  bannerUrl: "",
  images: [],
  videoUrl: "",
  stock: 0,
  lowStockAlert: 5,
  weight: 0,
  dimensions: "",
  variants: [],
  variantOptions: [],
  shippingEnabled: true,
  shippingCost: 0,
  shippingCountries: [],
  preparationDelay: "immediate",
  collectDeliveryAddress: false,
  requiresShippingAddress: true,
  carriers: [],
  fileUrl: "",
  externalUrl: "",
  fileName: "",
  fileSize: 0,
  fileType: "",
  storagePath: "",
  storageBucket: "",
  maxDownloads: 0,
  version: "",
  accessDuration: "",
  accessType: "lifetime",
  duration: "",
  availability: "",
  locationType: "online",
  clientForm: "",
  zone: "",
  deliveryDelay: "",
  paidOptions: [],
  isSubscription: false,
  subscriptionPrice: 0,
  subscriptionInterval: "monthly",
  privateAccess: false,
  communityInfo: "",
  communityBannerUrl: "",
  communityLogoUrl: "",
  integrationInstructions: "",
  bundleProducts: [],
  bundleDiscount: 0,
  bundleItems: [],
  bundleBannerUrl: "",
  bundleSquareImage: "",
  bundleTotalRealPrice: 0,
  eventDate: "",
  eventTime: "",
  eventEndDate: "",
  eventEndTime: "",
  eventDuration: "",
  eventLocation: "",
  eventMode: "online",
  onlineUrl: "",
  physicalAddress: "",
  maxSeats: 0,
  ticketCategories: [],
  availabilitySchedule: "",
  seoTitle: "",
  seoDescription: "",
  seoKeywords: "",
  slug: "",
  customUrl: "",
  visibility: "published",
  isFeatured: false,
  publishAt: "",
  ctaText: "",
  ctaColor: "#3b82f6",
  ctaStyle: "solid",
  priceType: "fixed",
  warranty: "",
  returnPolicy: "",
  postPurchaseInstructions: "",
  postPurchaseQuill: "",
  autoDiscount: false,
  autoDiscountType: "percentage",
  autoDiscountValue: 0,
  salesLimit: 0,
  countdownStartDate: "",
  countdownEndDate: "",
  countdownEnabled: false,
  customButton: "",
  hideFromStore: false,
  faqItems: [],
  requirementQuestions: [],
}

export function getStepsForType(type: ProductType | null): string[] {
  if (!type) return ["type"]
  switch (type) {
    case "PHYSICAL":
      return ["type", "general", "media-banner", "pricing-marketing", "logistics", "seo", "preview"]
    case "DIGITAL":
      return ["type", "general", "media-banner", "files-visuals", "pricing-marketing", "post-purchase", "seo", "preview"]
    case "COMMUNITY":
      return ["type", "general", "media-banner", "pricing-marketing", "access-config", "seo", "preview"]
    case "BUNDLE":
      return ["type", "general", "media-banner", "bundle-selection", "pricing-marketing", "seo", "preview"]
    case "BOOKING":
      return ["type", "general", "media-banner", "planning-venue", "pricing-marketing", "seo", "preview"]
    default:
      return ["type"]
  }
}

export const STEP_LABELS: Record<string, string> = {
  "type": "Type",
  "general": "Informations",
  "media-banner": "Médias",
  "pricing-marketing": "Prix & Marketing",
  "logistics": "Logistique",
  "files-visuals": "Fichiers",
  "post-purchase": "Post-Achat",
  "requirements": "Exigences",
  "access-config": "Adhésion",
  "bundle-selection": "Sélection",
  "planning-venue": "Planning",
  "seo": "SEO",
  "preview": "Aperçu",
}

export const STEP_ICONS: Record<string, string> = {
  "type": "Layers",
  "general": "FileText",
  "media-banner": "Image",
  "pricing-marketing": "Tag",
  "logistics": "Truck",
  "files-visuals": "Package",
  "post-purchase": "CheckCircle",
  "requirements": "ClipboardList",
  "access-config": "KeyRound",
  "bundle-selection": "Boxes",
  "planning-venue": "MapPin",
  "seo": "Search",
  "preview": "Eye",
}
