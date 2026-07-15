"use client"

import { WizardData, STEP_LABELS } from "@/types/product"
import { formatPrice } from "@/lib/utils"
import { Eye, Edit } from "lucide-react"

interface StepPreviewProps {
  data: WizardData
  onStepClick: (step: string) => void
}

export default function StepPreview({ data, onStepClick }: StepPreviewProps) {
  const sections = [
    { step: "general", label: "Informations", fields: [
      { label: "Nom", value: data.name },
      { label: "Catégorie", value: data.categoryId },
      { label: "Description", value: data.description?.replace(/<[^>]*>/g, "").substring(0, 150) + "..." },
      { label: "Description courte", value: data.shortDescription },
    ]},
    { step: "media-banner", label: "Médias", fields: [
      { label: "Bannière", value: data.bannerUrl ? "✓ Ajoutée" : "✗ Non définie" },
      { label: "Images", value: `${data.images.length} image(s)` },
      { label: "Vidéo", value: data.videoUrl || "Aucune" },
    ]},
    { step: "pricing-marketing", label: "Prix & Marketing", fields: [
      { label: "Type", value: data.priceType === "free" ? "Gratuit" : data.priceType === "fixed" ? "Prix fixe" : "Prix variable" },
      { label: "Prix", value: data.priceType !== "free" ? `${data.price} ${data.currency}` : "Gratuit" },
      { label: "Prix barré", value: data.comparePrice > 0 ? `${data.comparePrice} ${data.currency}` : "—" },
      { label: "Réduction auto", value: data.autoDiscount ? `${data.autoDiscountValue}% si ${data.salesLimit}+ unités` : "Désactivée" },
      { label: "Compte à rebours", value: data.countdownEnabled ? "Activé" : "Désactivé" },
      { label: "Visibilité", value: data.hideFromStore ? "Masqué (lien privé)" : "Publié" },
      { label: "CTA", value: data.ctaText || "Par défaut" },
    ]},
  ]

  if (data.productType === "PHYSICAL") {
    sections.push({
      step: "logistics", label: "Logistique", fields: [
        { label: "Stock", value: `${data.stock} unités` },
        { label: "Poids", value: data.weight ? `${data.weight} kg` : "—" },
        { label: "Dimensions", value: data.dimensions || "—" },
        { label: "Livraison", value: data.shippingEnabled ? `${data.shippingCost} ${data.currency}` : "Désactivée" },
        { label: "Garantie", value: data.warranty || "—" },
      ],
    })
  }

  if (data.productType === "DIGITAL") {
    sections.push({
      step: "files-visuals", label: "Fichiers", fields: [
        { label: "Fichier", value: data.fileName || "Aucun" },
        { label: "Max téléchargements", value: data.maxDownloads ? String(data.maxDownloads) : "Illimité" },
        { label: "Version", value: data.version || "—" },
      ],
    })
    sections.push({
      step: "post-purchase", label: "Post-Achat", fields: [
        { label: "Instructions", value: data.postPurchaseQuill ? "✓ Rédigées" : "✗ Non définies" },
      ],
    })
  }

  if (data.productType === "SERVICE") {
    sections.push({
      step: "requirements", label: "Exigences", fields: [
        { label: "Délai", value: data.deliveryDelay || "—" },
        { label: "Mode", value: data.locationType },
        { label: "Options payantes", value: `${data.paidOptions.length} option(s)` },
      ],
    })
  }

  if (data.productType === "COMMUNITY") {
    sections.push({
      step: "access-config", label: "Adhésion", fields: [
        { label: "Type d'accès", value: data.accessType },
        { label: "Abonnement", value: data.accessType === "subscription" ? `${data.subscriptionPrice} ${data.currency}/${data.subscriptionInterval}` : "—" },
        { label: "Accès privé", value: data.privateAccess ? "Oui" : "Non" },
      ],
    })
  }

  if (data.productType === "BUNDLE") {
    sections.push({
      step: "bundle-selection", label: "Produits du pack", fields: [
        { label: "Nombre de produits", value: `${data.bundleProducts.length}` },
        { label: "Prix réel cumulé", value: `${data.bundleProducts.reduce((s, p) => s + p.price, 0).toLocaleString()} ${data.currency}` },
        { label: "Réduction pack", value: data.bundleDiscount ? `${data.bundleDiscount}%` : "—" },
      ],
    })
  }

  if (data.productType === "SERVICE") {
    sections.push({
      step: "planning-venue", label: "Planning", fields: [
        { label: "Date début", value: data.eventDate ? `${data.eventDate} ${data.eventTime}` : "—" },
        { label: "Date fin", value: data.eventEndDate ? `${data.eventEndDate} ${data.eventEndTime}` : "—" },
        { label: "Mode", value: data.eventMode },
        { label: "Places max", value: data.maxSeats ? String(data.maxSeats) : "Illimité" },
        { label: "Catégories billets", value: `${data.ticketCategories.length} catégorie(s)` },
      ],
    })
  }

  if (data.faqItems.length > 0) {
    sections.push({
      step: "general", label: "FAQ", fields: data.faqItems.map((f, i) => ({
        label: `Q${i + 1}`,
        value: f.question,
      })),
    })
  }

  sections.push({
    step: "seo", label: "SEO Google", fields: [
      { label: "Titre SEO", value: data.seoTitle || "—" },
      { label: "Meta description", value: data.seoDescription ? data.seoDescription.substring(0, 80) + "..." : "—" },
      { label: "Slug", value: data.slug },
      { label: "Masqué boutique", value: data.hideFromStore ? "Oui" : "Non" },
    ],
  })

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">Aperçu Final</h2>
        <p className="mt-1 text-sm text-gray-500">
          Vérifiez les informations avant de publier
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-gray-200">
        <div className="bg-gradient-to-r from-[#7126b6] to-purple-400 p-6 text-white">
          <div className="text-xs font-medium uppercase tracking-wider opacity-80">
            {data.productType}
          </div>
          <h3 className="mt-1 text-xl font-bold">{data.name || "Nom du produit"}</h3>
          <div className="mt-2 flex items-center gap-3">
            {data.priceType !== "free" && (
              <span className="text-2xl font-bold">{formatPrice(data.price)}</span>
            )}
            {data.comparePrice > data.price && (
              <span className="text-sm line-through opacity-60">{formatPrice(data.comparePrice)}</span>
            )}
            {data.priceType === "free" && (
              <span className="rounded-lg bg-white/20 px-3 py-1 text-sm font-medium">Gratuit</span>
            )}
          </div>
          {data.images[0] && (
            <img
              src={data.images[0].url}
              alt={data.images[0].alt || data.name}
              className="mt-3 h-24 w-24 rounded-lg object-cover"
            />
          )}
        </div>
      </div>

      <div className="space-y-4">
        {sections.map((section, si) => (
          <div key={si} className="rounded-xl border border-gray-200 p-4">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-[#0f172a]">{section.label}</h4>
              <button
                onClick={() => onStepClick(section.step)}
                className="flex items-center gap-1 text-xs text-[#7126b6] hover:underline"
              >
                <Edit className="h-3 w-3" /> Modifier
              </button>
            </div>
            <div className="mt-3 space-y-2">
              {section.fields.map((field, fi) => (
                <div key={fi} className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">{field.label}</span>
                  <span className="font-medium text-[#0f172a] max-w-[60%] truncate">{field.value}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
