"use client"

import { type WizardData, type ProductType, PRODUCT_TYPES } from "@/types/product"
import { formatPrice } from "@/lib/utils"
import {
  Package,
  Check,
  ImageIcon,
  DollarSign,
  Search,
  Settings,
  ShoppingBag,
  Edit3,
} from "lucide-react"

interface Props {
  data: WizardData
}

const TYPE_LABELS: Record<string, string> = {
  PHYSICAL: "Produit physique",
  DIGITAL: "Produit digital",
  SERVICE: "Service",
  COMMUNITY: "Communauté",
  BUNDLE: "Pack / Bundle",
  RESERVATION: "Réservation / Événement",
}

function Section({ icon: Icon, title, children }: { icon: any; title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="h-4 w-4 text-[#7126b6]" />
        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
      </div>
      {children}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  if (!value && value !== 0) return null
  return (
    <div>
      <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{label}</p>
      <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{value}</p>
    </div>
  )
}

export default function StepReview({ data }: Props) {
  const typeName = data.productType ? TYPE_LABELS[data.productType] : "Non défini"
  const typeInfo = PRODUCT_TYPES.find((t) => t.type === data.productType)

  return (
    <div className="space-y-6">
      <div className="text-center">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
          <Check className="h-8 w-8 text-[#7126b6]" />
        </div>
        <h2 className="mt-4 text-xl font-bold text-gray-900 dark:text-gray-100">Vérification finale</h2>
        <p className="text-gray-500 dark:text-gray-400 dark:text-gray-500 mt-1">Vérifiez les informations avant publication</p>
      </div>

      <Section icon={Package} title="Type">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${typeInfo?.color || "from-gray-400 to-gray-500"} flex items-center justify-center`}>
            <span className="text-white text-lg">{typeName[0]}</span>
          </div>
          <div>
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{typeName}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">{typeInfo?.description}</p>
          </div>
        </div>
      </Section>

      <Section icon={Edit3} title="Informations">
        <div className="space-y-2">
          <Field label="Nom" value={data.name} />
          <Field label="Catégorie" value={data.categoryId} />
          <Field label="Sous-catégorie" value={data.subcategoryId} />
          <Field label="Marque" value={data.brand} />
        </div>
      </Section>

      <Section icon={Edit3} title="Description">
        <div className="text-sm text-gray-700 dark:text-gray-300 prose prose-sm max-w-none break-words overflow-wrap-anywhere" dangerouslySetInnerHTML={{ __html: data.description || "<p class='text-gray-400 dark:text-gray-500'>Aucune description</p>" }} />
      </Section>

      <Section icon={ImageIcon} title="Médias">
        <div className="flex gap-2 overflow-x-auto">
          {data.images.length > 0 ? data.images.map((img, idx) => (
            <img key={idx} src={img.url} alt={img.alt} className="h-16 w-16 rounded-lg object-cover flex-shrink-0" />
          )) : (
            <p className="text-sm text-gray-400 dark:text-gray-500">Aucune image</p>
          )}
        </div>
        {data.videoUrl && <p className="mt-2 text-xs text-gray-500 dark:text-gray-400 dark:text-gray-500">Vidéo: {data.videoUrl}</p>}
      </Section>

      <Section icon={DollarSign} title="Prix">
        <div className="space-y-2">
          <Field label="Type de prix" value={data.priceType === "fixed" ? "Fixe" : data.priceType === "variable" ? "Variable" : "Gratuit"} />
          {data.priceType === "fixed" && (
            <>
              <Field label="Prix" value={`${data.price?.toLocaleString()} ${data.currency}`} />
              {data.comparePrice ? <Field label="Prix barré" value={`${data.comparePrice.toLocaleString()} ${data.currency}`} /> : null}
            </>
          )}
          {data.priceType === "variable" && (
            <div className="space-y-1">
              {data.variants.map((v, idx) => (
                <p key={idx} className="text-xs text-gray-600 dark:text-gray-400 dark:text-gray-500">• {v.name}: {v.price?.toLocaleString()} {data.currency} (stock: {v.stock})</p>
              ))}
            </div>
          )}
        </div>
      </Section>

      {data.seoTitle && (
        <Section icon={Search} title="SEO">
          <div className="space-y-2">
            <Field label="Titre SEO" value={data.seoTitle} />
            <Field label="Description SEO" value={data.seoDescription} />
            <Field label="Mots-clés" value={data.seoKeywords} />
            <Field label="Slug" value={`/products/${data.slug}`} />
          </div>
        </Section>
      )}

      {data.productType && (
        <Section icon={Settings} title="Paramètres spécifiques">
          <div className="space-y-2">
            {data.productType === "PHYSICAL" && (
              <>
                <Field label="Stock" value={data.stock} />
                <Field label="SKU" value={data.sku} />
                <Field label="Poids" value={`${data.weight} kg`} />
                <Field label="Dimensions" value={data.dimensions} />
                <Field label="Garantie" value={data.warranty} />
              </>
            )}
            {data.productType === "DIGITAL" && (
              <>
                <Field label="Fichier" value={data.fileName || data.fileUrl} />
                <Field label="Max téléchargements" value={data.maxDownloads || "Illimité"} />
                <Field label="Version" value={data.version} />
                <Field label="Durée d'accès" value={data.accessDuration} />
              </>
            )}
            {data.productType === "SERVICE" && (
              <>
                <Field label="Durée" value={data.duration} />
                <Field label="Mode" value={data.locationType === "online" ? "En ligne" : data.locationType === "offline" ? "Présentiel" : "Les deux"} />
                <Field label="Zone" value={data.zone} />
              </>
            )}
            {data.productType === "COMMUNITY" && (
              <>
                <Field label="Type d'accès" value={data.accessType} />
                <Field label="Info" value={data.communityInfo} />
              </>
            )}
            {data.productType === "BUNDLE" && (
              <>
                <Field label="Réduction pack" value={`${data.bundleDiscount}%`} />
                <Field label="Éléments" value={data.bundleItems.length} />
              </>
            )}
            {data.productType === "RESERVATION" && (
              <>
                <Field label="Date" value={data.eventDate} />
                <Field label="Heure" value={data.eventTime} />
                <Field label="Durée" value={data.eventDuration} />
                <Field label="Places" value={data.maxSeats} />
                <Field label="Lieu" value={data.eventLocation} />
              </>
            )}
          </div>
        </Section>
      )}

      {data.postPurchaseInstructions && (
        <Section icon={ShoppingBag} title="Après l'achat">
          <p className="text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap">{data.postPurchaseInstructions}</p>
        </Section>
      )}

      <Section icon={Package} title="Publication">
        <div className="space-y-2">
          <Field label="Visibilité" value={data.visibility === "published" ? "Publié" : "Brouillon"} />
          <Field label="Mis en avant" value={data.isFeatured ? "Oui" : "Non"} />
          <Field label="CTA" value={data.ctaText} />
        </div>
      </Section>
    </div>
  )
}
