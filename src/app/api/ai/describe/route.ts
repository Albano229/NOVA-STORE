import { NextResponse } from "next/server";
import { withRateLimit } from "@/lib/api-rate-limit";

interface GenerateOptions {
  name: string
  type?: string
  category?: string
  subcategory?: string
  tone?: string
  detailed?: boolean
  emojis?: boolean
  prompt?: string
  contentType?: string
}

const TONE_CONFIG: Record<string, { adjectives: string[]; style: string }> = {
  professionnel: {
    adjectives: ["haut de gamme", "professionnel", "premium", "fiable"],
    style: "professionnel et structuré",
  },
  decontracte: {
    adjectives: ["super", "génial", "top", "au top"],
    style: "décontracté et amical",
  },
  vendeur: {
    adjectives: ["exceptionnel", "révolutionnaire", "incontournable", "imbattable"],
    style: "percutant et orienté conversion",
  },
  fun: {
    adjectives: ["awesome", "fantastique", "incroyable", "bluffant"],
    style: "fun et dynamique",
  },
}

const EMOJI_SETS = {
  features: ["✨", "🔥", "💪", "⭐", "🎯", "💎", "🚀", "🎁"],
  benefits: ["✅", "💯", "🏆", "👏", "😍", "🙌", "❤️", "👍"],
  cta: ["🛒", "⚡", "💡", "🔔", "📦", "💰"],
}

function pickEmoji(set: keyof typeof EMOJI_SETS, index: number): string {
  const arr = EMOJI_SETS[set]
  return arr[index % arr.length]
}

const TYPE_VOCABULARY: Record<string, { label: string; article: string; features: (e: (i: number, set?: keyof typeof EMOJI_SETS) => string, tc: { adjectives: string[] }) => string[]; ctaLabel: string; howItWorks: string; testimonialText: string }> = {
  PHYSICAL: {
    label: "produit physique",
    article: "un produit physique",
    features: (e: (i: number, set?: keyof typeof EMOJI_SETS) => string, tc: { adjectives: string[] }) => [
      `<strong>${e(0)} Qualité premium</strong> — Fabrication soignée avec des matériaux de qualité supérieure, conçus pour durer et résister à l'usage quotidien`,
      `<strong>${e(1)} Design ${tc.adjectives[0]}</strong> — Esthétique moderne et élégante, adaptée à tous les styles et toutes les occasions`,
      `<strong>${e(2)} Confort optimal</strong> — Conçu pour un usage quotidien sans compromis, avec une attention particulière portée à l'ergonomie`,
      `<strong>${e(3)} Durabilité</strong> — Résistant et conçu pour durer dans le temps, ce produit est un investissement sur le long terme`,
      `<strong>${e(4)} Livraison soignée</strong> — Emballage protecteur et expédition rapide sous 24-48h avec suivi complet`,
    ],
    ctaLabel: "Commandez dès maintenant",
    howItWorks: `Après votre achat, vous recevrez votre ${"{name}"} sous 24-48h avec un suivi complet de livraison. Notre équipe reste disponible pour répondre à toutes vos questions.`,
    testimonialText: "Excellent produit, la qualité est au rendez-vous. La livraison était rapide et le service client très réactif. Je recommande vivement !",
  },
  DIGITAL: {
    label: "contenu digital",
    article: "un produit digital",
    features: (e: (i: number, set?: keyof typeof EMOJI_SETS) => string, tc: { adjectives: string[] }) => [
      `<strong>${e(0)} Accès instantané</strong> — Disponible immédiatement après achat sécurisé, commencez à utiliser en quelques secondes`,
      `<strong>${e(1)} Multi-appareils</strong> — Compatible tous vos appareils (PC, mobile, tablette) pour une utilisation flexible`,
      `<strong>${e(2)} Mises à jour gratuites</strong> — Contenu toujours à jour sans coût supplémentaire, beneficie des dernières améliorations`,
      `<strong>${e(3)} Support dédié</strong> — Assistance technique réactive et professionnelle pour vous accompagner à chaque étape`,
      `<strong>${e(4)} Qualité professionnelle</strong> — Contenu créé par des experts du domaine, rigoureusement sélectionné et validé`,
    ],
    ctaLabel: "Téléchargez maintenant",
    howItWorks: `Après votre achat, vous recevrez un accès instantané à ${"{name}"}. Téléchargez et utilisez immédiatement, sur tous vos appareils.`,
    testimonialText: "Téléchargement instantané, qualité au top ! Le contenu est exactement ce qui m'attertait. Support client très réactif.",
  },
  SERVICE: {
    label: "service / prestation",
    article: "un service",
    features: (e: (i: number, plan?: keyof typeof EMOJI_SETS) => string, tc: { adjectives: string[] }) => [
      `<strong>${e(0)} Expertise confirmée</strong> — Un prestataire qualifié et expérimenté, spécialisé dans son domaine d'expertise`,
      `<strong>${e(1)} Résultat ${tc.adjectives[0]}</strong> — Un travail soigné et professionnel, adapté à vos besoins spécifiques`,
      `<strong>${e(2)} Réactivité</strong> — Prise en charge rapide de votre demande, délais respectés et communication fluide`,
      `<strong>${e(3)} Accompagnement personnalisé</strong> — Un suivi individuel tout au long du processus, de la demande à la livraison`,
      `<strong>${e(4)} Satisfaction garantie</strong> — Résultat conforme à vos attentes ou prise en charge sans frais supplémentaires`,
    ],
    ctaLabel: "Réservez ce service",
    howItWorks: `Après votre achat, vous recevrez les coordonnées du prestataire pour planifier ${"{name}"}. Notre équipe vous accompagne tout au long du processus.`,
    testimonialText: "Service de qualité, très professionnel. Le prestataire a répondu à toutes mes attentes. Je recommande vivement !",
  },
  COMMUNITY: {
    label: "espace membre / communauté",
    article: "un accès à une communauté",
    features: (e: (i: number, set?: keyof typeof EMOJI_SETS) => string, tc: { adjectives: string[] }) => [
      `<strong>${e(0)} Accès exclusif</strong> — Rejoignez une communauté privée de membres passionnés et engagés`,
      `<strong>${e(1)} Contenus premium</strong> — Accédez à des ressources, formations et contenus réservés aux membres`,
      `<strong>${e(2)} Échange et networking</strong> — Interagissez avec d'autres membres, partagez vos expériences et apprenez ensemble`,
      `<strong>${e(3)} Événements privés</strong> — Participez à des sessions exclusives, lives et ateliers réservés aux membres`,
      `<strong>${e(4)} Évolution continue</strong> — La communauté grandit et s'enrichit régulièrement de nouveaux contenus et fonctionnalités`,
    ],
    ctaLabel: "Rejoignez la communauté",
    howItWorks: `Après votre achat, vous recevrez un lien d'invitation pour rejoindre ${"{name}"}. Connectez-vous et commencez à interagir immédiatement.`,
    testimonialText: "Communauté très active et bienveillante. Les contenus sont de qualité et les échanges enrichissants. Je recommande !",
  },
  BUNDLE: {
    label: "pack / ensemble",
    article: "un pack",
    features: (e: (i: number, set?: keyof typeof EMOJI_SETS) => string, tc: { adjectives: string[] }) => [
      `<strong>${e(0)} Valeur exceptionnelle</strong> — Un ensemble complet à prix réduit, bien plus avantageux que des achats séparés`,
      `<strong>${e(1)} Cohérence ${tc.adjectives[0]}</strong> — Des éléments soigneusement sélectionnés pour fonctionner ensemble parfaitement`,
      `<strong>${e(2)} Variété</strong> — Découvrez plusieurs produits ou services complémentaires dans un seul pack`,
      `<strong>${e(3)} Économies</strong> — Bénéficiez d'une réduction significative par rapport à l'achat de chaque élément séparément`,
      `<strong>${e(4)} Polyvalence</strong> — Adaptez l'utilisation du pack à vos différents besoins et projets`,
    ],
    ctaLabel: "Obtenez le pack",
    howItWorks: `Après votre achat, vous recevrez l'ensemble des éléments du pack ${"{name}"}. Chaque composant est accessible selon son type (livraison, téléchargement, accès...).`,
    testimonialText: "Rapport qualité-prix imbattable pour ce pack. Les éléments sont cohérents et complémentaires. Très satisfait de mon achat !",
  },
  RESERVATION: {
    label: "réservation / événement",
    article: "une réservation",
    features: (e: (i: number, set?: keyof typeof EMOJI_SETS) => string, tc: { adjectives: string[] }) => [
      `<strong>${e(0)} Place garantie</strong> — Réservez votre spot en toute sécurité, disponibilité confirmée immédiatement`,
      `<strong>${e(1)} Expérience ${tc.adjectives[0]}</strong> — Un événement soigneusement organisé pour une expérience inoubliable`,
      `<strong>${e(2)} Flexibilité</strong> — Possibilité d'annulation ou de report selon les conditions de l'événement`,
      `<strong>${e(3)} Détails complets</strong> — Toutes les informations pratiques (lieu, horaires, programme) communiquées après réservation`,
      `<strong>${e(4)} Accompagnement</strong> — Un service client disponible pour répondre à vos questions avant et après la réservation`,
    ],
    ctaLabel: "Réservez votre place",
    howItWorks: `Après votre achat, vous recevrez une confirmation avec tous les détails pratiques de ${"{name}"} (adresse, horaires, programme). Présentez-vous le jour J avec votre confirmation.`,
    testimonialText: "Réservation simple et rapide. L'événement était exactement comme décrit. Organisation impeccable, je recommande !",
  },
}

function getTypeVocabulary(type?: string) {
  return TYPE_VOCABULARY[type || "PHYSICAL"] || TYPE_VOCABULARY.PHYSICAL
}

function generateDescription(opts: GenerateOptions): string {
  const { name, type, category, subcategory, tone, detailed, emojis } = opts
  const tv = getTypeVocabulary(type)
  const categoryText = category ? ` dans la catégorie ${category}${subcategory ? ` > ${subcategory}` : ""}` : ""
  const tc = TONE_CONFIG[tone || "professionnel"] || TONE_CONFIG.professionnel
  const e = emojis ? (i: number, set: keyof typeof EMOJI_SETS = "features") => pickEmoji(set, i) : () => ""

  const allFeatures = tv.features(e, tc)
  const featuresList = allFeatures.map((f) => `<li>${f}</li>`).join("\n")

  const extraSections = detailed ? `
<h3>Avantages détaillés</h3>
<ul>
${emojis ? "🎯 " : ""}<li><strong>Adapté à votre besoin</strong> — Ce ${tv.label} a été pensé pour répondre précisément aux attentes des clients les plus exigeants</li>
${emojis ? "💡 " : ""}<li><strong>Rapport qualité-prix ${tc.adjectives[3]}</strong> — Une offre compétitive sans compromis sur la qualité ou les fonctionnalités</li>
${emojis ? "🛡️ " : ""}<li><strong>Garantie et support</strong> — Service client réactif et politique de retour flexible pour votre tranquillité d'esprit</li>
${emojis ? "🔄 " : ""}<li><strong>Évolutif</strong> — Conçu pour s'adapter à l'évolution de vos besoins dans le temps</li>
</ul>

<h3>Comment ça marche</h3>
<p>${emojis ? "🚀 " : ""}${tv.howItWorks.replace("{name}", name)}</p>

<h3>Ce que disent nos clients</h3>
<p>${emojis ? "⭐ " : ""}"${tv.testimonialText}"</p>
<p>${emojis ? "👏 " : ""}"Rapport qualité-prix imbattable, le service client est très réactif. Une expérience satisfaisante à 100%."</p>
` : ""

  return `<h2>${name}</h2>

<p>Découvrez <strong>${name}</strong>, ${tv.article} ${categoryText} qui s'impose comme un choix ${tc.adjectives[1]} pour les exigences les plus élevées. Ce ${tv.label} allie qualité, performance et un rapport qualité-prix ${tc.adjectives[3]}.</p>

<h3>Caractéristiques principales</h3>
<ul>
${featuresList}
</ul>

<h3>Pourquoi choisir ${name} ?</h3>

<p>Notre engagement envers la qualité fait la différence. Chaque détail a été pensé pour vous offrir une expérience ${tc.adjectives[0]} et durable. ${name} est ${tc.adjectives[2]} pour ceux qui ne font aucun compromis sur l'excellence.</p>
${extraSections}
<p><strong>${e(0, "cta")} ${tv.ctaLabel}</strong> et profitez d'un service client réactif. Ne manquez pas cette opportunité de découvrir un ${tv.label} qui fera toute la différence !</p>`
}

function generateTitle(opts: GenerateOptions): string {
  const { name, category, tone, emojis } = opts
  const tc = TONE_CONFIG[tone || "professionnel"] || TONE_CONFIG.professionnel
  const e = emojis ? "✨ " : ""
  const cat = category ? ` — ${category}` : ""

  const templates = [
    `${e}${name}${cat} | ${tc.adjectives[0].charAt(0).toUpperCase() + tc.adjectives[0].slice(1)} & ${tc.adjectives[3]}`,
    `${e}${name} — Le ${tc.adjectives[1]} par excellence${cat}`,
    `${e}${name} ${tc.adjectives[2].charAt(0).toUpperCase() + tc.adjectives[2].slice(1)}${cat}`,
  ]

  return `<p>${templates[Math.floor(Math.random() * templates.length)]}</p>`
}

function generateShortDescription(opts: GenerateOptions): string {
  const { name, type, category, tone, emojis } = opts
  const tv = getTypeVocabulary(type)
  const tc = TONE_CONFIG[tone || "professionnel"] || TONE_CONFIG.professionnel
  const e = emojis ? "🔥 " : ""
  const cat = category ? ` dans ${category}` : ""

  const templates = [
    `<p>${e}${name} — ${tc.adjectives[0].charAt(0).toUpperCase() + tc.adjectives[0].slice(1)}, ${tc.adjectives[3]} et conçu pour vous satisfaire. ${tc.adjectives[2].charAt(0).toUpperCase() + tc.adjectives[2].slice(1)}${cat}.</p>`,
    `<p>${e}Découvrez ${name}, ${tv.article}${cat} qui combine qualité et performance. ${tc.adjectives[2].charAt(0).toUpperCase() + tc.adjectives[2].slice(1)} pour les clients les plus exigeants.</p>`,
  ]

  return templates[Math.floor(Math.random() * templates.length)]
}

function generateSeo(opts: GenerateOptions): string {
  const { name, category, tone } = opts
  const tc = TONE_CONFIG[tone || "professionnel"] || TONE_CONFIG.professionnel

  const seoTitle = `${name} — ${tc.adjectives[0].charAt(0).toUpperCase() + tc.adjectives[0].slice(1)}${category ? ` | ${category}` : ""} | Achat en ligne`
  const seoDesc = `Découvrez ${name}${category ? ` dans la catégorie ${category}` : ""}. ${tc.adjectives[2].charAt(0).toUpperCase() + tc.adjectives[2].slice(1)}, ${tc.adjectives[3]} et de qualité supérieure. Commandez maintenant !`

  return `<div>
<p><strong>Titre SEO :</strong> ${seoTitle}</p>
<p><strong>Meta description :</strong> ${seoDesc}</p>
</div>`
}

function improveText(currentText: string, name: string, tone?: string, emojis?: boolean): string {
  const tc = TONE_CONFIG[tone || "professionnel"] || TONE_CONFIG.professionnel
  const e = emojis ? "✨ " : ""

  const cleanText = currentText
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()

  const sentences = cleanText.split(/[.!?]+/).filter((s) => s.trim().length > 10)

  const paragraphs = sentences.map((s, i) => {
    const trimmed = s.trim()
    if (i === 0) return `<p><strong>${e}${name}</strong> — ${trimmed}.</p>`
    if (i % 3 === 0) return `<h3>${trimmed.charAt(0).toUpperCase() + trimmed.slice(1)}</h3>`
    return `<p>${trimmed}.</p>`
  })

  return paragraphs.join("\n\n")
}

export const POST = withRateLimit(
  async function POST(req: Request) {
  try {
    const body = await req.json()
    const { name, type, category, action, tone, currentText, prompt, subcategory, emojis, detailed, contentType } = body

    if (!name && action !== "improve") {
      return NextResponse.json({ error: "Le nom du produit est requis" }, { status: 400 })
    }

    const opts: GenerateOptions = {
      name: name || "",
      type,
      category,
      subcategory,
      tone: tone || "professionnel",
      detailed: detailed || false,
      emojis: emojis || false,
      prompt,
      contentType,
    }

    let description: string

    switch (action) {
      case "generate":
        if (contentType === "title") {
          description = generateTitle(opts)
        } else if (contentType === "short-description") {
          description = generateShortDescription(opts)
        } else if (contentType === "seo") {
          description = generateSeo(opts)
        } else {
          description = generateDescription(opts)
        }
        break
      case "improve":
        description = improveText(currentText || "", name || "", tone, emojis)
        break
      case "benefits":
        description = generateDescription({ ...opts, detailed: true })
        break
      case "summary":
        description = generateShortDescription(opts)
        break
      default:
        description = generateDescription(opts)
    }

    return NextResponse.json({ description })
  } catch (error) {
    return NextResponse.json({ error: "Erreur lors de la génération" }, { status: 500 });
  }
},
  { limit: 10, window: 60_000, keyPrefix: "ai-describe" }
);
