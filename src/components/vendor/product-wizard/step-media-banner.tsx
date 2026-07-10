"use client"

import { WizardData } from "@/types/product"
import { Upload, Image as ImageIcon, X } from "lucide-react"
import { useCallback, useState } from "react"

interface StepMediaBannerProps {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
  productType: string | null
}

export default function StepMediaBanner({ data, onChange, productType }: StepMediaBannerProps) {
  const [uploading, setUploading] = useState(false)

  const handleBannerUpload = useCallback(async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (json.url) onChange({ bannerUrl: json.url })
    } catch { /* empty */ }
    setUploading(false)
  }, [onChange])

  const handleImageUpload = useCallback(async (file: File) => {
    setUploading(true)
    const formData = new FormData()
    formData.append("file", file)
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      const json = await res.json()
      if (json.url) {
        const newImages = [...data.images, { url: json.url, alt: "", position: data.images.length }]
        onChange({ images: newImages })
      }
    } catch { /* empty */ }
    setUploading(false)
  }, [data.images, onChange])

  const removeImage = (index: number) => {
    const newImages = data.images.filter((_, i) => i !== index).map((img, i) => ({ ...img, position: i }))
    onChange({ images: newImages })
  }

  const isCommunity = productType === "COMMUNITY"
  const isBundle = productType === "BUNDLE"
  const isReservation = productType === "RESERVATION"
  const title = isCommunity
    ? "Design de l'Espace"
    : isBundle
      ? "Identité Visuelle du Pack"
      : isReservation
        ? "Affiche & Bannière"
        : "Médias du Produit"
  const bannerLabel = isCommunity
    ? "Grande bannière d'accueil de la communauté"
    : isBundle
      ? "Grande bannière publicitaire du pack"
      : isReservation
        ? "Grande bannière événementielle"
        : "Grande bannière publicitaire du produit"

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">
          Ajoutez les visuels pour présenter votre {productType?.toLowerCase()}
        </p>
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#0f172a]">
          {bannerLabel}
        </label>
        <p className="text-xs text-gray-400">Format recommandé : 1200x400px. La bannière sera affichée en pleine largeur sur la fiche produit.</p>
        {data.bannerUrl ? (
          <div className="relative overflow-hidden rounded-xl border border-gray-200">
            <img src={data.bannerUrl} alt="Bannière" className="h-48 w-full object-cover" />
            <button
              onClick={() => onChange({ bannerUrl: "" })}
              className="absolute right-2 top-2 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ) : (
          <label className="flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-8 transition hover:border-[#7126b6] hover:bg-purple-50">
            <Upload className="mb-2 h-8 w-8 text-gray-400" />
            <span className="text-sm text-gray-500">
              {uploading ? "Téléversement..." : "Cliquez ou glissez une image ici"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleBannerUpload(file)
              }}
            />
          </label>
        )}
      </div>

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#0f172a]">
          {isBundle ? "Image carrée de présentation du lot" : isCommunity ? "Photo de profil ou logo circulaire" : "Image de couverture principale"}
        </label>
        <p className="text-xs text-gray-400">
          {isBundle
            ? "Image groupant visuellement les articles du lot (format carré recommandé)"
            : isCommunity
              ? "Logo circulaire de la marque ou du club"
              : "Première image visible sur la boutique (format carré recommandé)"}
        </p>
        <div className="flex flex-wrap gap-4">
          {data.images.map((img, i) => (
            <div key={i} className="group relative h-32 w-32 flex-shrink-0 overflow-hidden rounded-xl border-2 border-gray-200">
              <img src={img.url} alt={img.alt || `Image ${i + 1}`} className="h-full w-full object-cover" />
              {i === 0 && (
                <span className="absolute left-1 top-1 rounded bg-[#7126b6] px-1.5 py-0.5 text-[10px] font-medium text-white">
                  Couverture
                </span>
              )}
              <button
                onClick={() => removeImage(i)}
                className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white transition hover:bg-black/80"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {data.images.length < 5 && (
            <label className="flex h-32 w-32 cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 transition hover:border-[#7126b6]">
              <ImageIcon className="mb-1 h-6 w-6 text-gray-400" />
              <span className="text-xs text-gray-400">Ajouter</span>
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleImageUpload(file)
                }}
              />
            </label>
          )}
        </div>
        <p className="text-xs text-gray-400">Maximum 5 images. La première image sera utilisée comme couverture sur la boutique.</p>
      </div>

      {(isCommunity || isBundle || isReservation) && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0f172a]">
            {isReservation ? "Flyer officiel (Format affiche)" : "Image supplémentaire"}
          </label>
          <label className="flex cursor-pointer items-center gap-3 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 p-4 transition hover:border-[#7126b6] hover:bg-purple-50">
            <Upload className="h-5 w-5 text-gray-400" />
            <span className="text-sm text-gray-500">
              {uploading ? "Téléversement..." : "Cliquez pour téléverser"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleImageUpload(file)
              }}
            />
          </label>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#0f172a]">Vidéo (optionnel)</label>
        <input
          type="url"
          value={data.videoUrl}
          onChange={(e) => onChange({ videoUrl: e.target.value })}
          placeholder="URL YouTube ou Vimeo"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
        />
        {data.videoUrl && (
          <div className="mt-2 aspect-video overflow-hidden rounded-lg bg-gray-100">
            <iframe
              src={data.videoUrl.replace("watch?v=", "embed/")}
              className="h-full w-full"
              allowFullScreen
            />
          </div>
        )}
      </div>
    </div>
  )
}
