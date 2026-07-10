"use client"

import { WizardData } from "@/types/product"
import { Search, Save, Check, Loader2 } from "lucide-react"
import { useState, useEffect, useCallback } from "react"

interface StepSeoProps {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
  productId?: string
}

export default function StepSeo({ data, onChange, productId }: StepSeoProps) {
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved">("idle")

  const autoSave = useCallback(async () => {
    if (!productId) return
    setSaveStatus("saving")
    try {
      await fetch(`/api/vendor/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          seoTitle: data.seoTitle,
          seoDescription: data.seoDescription,
          seoKeywords: data.seoKeywords,
          slug: data.slug,
          customUrl: data.customUrl,
        }),
      })
      setSaveStatus("saved")
      setTimeout(() => setSaveStatus("idle"), 2000)
    } catch {
      setSaveStatus("idle")
    }
  }, [productId, data.seoTitle, data.seoDescription, data.seoKeywords, data.slug, data.customUrl])

  useEffect(() => {
    const timer = setTimeout(() => {
      if (data.seoTitle || data.seoDescription) autoSave()
    }, 2000)
    return () => clearTimeout(timer)
  }, [data.seoTitle, data.seoDescription, data.seoKeywords, data.slug])

  const seoTitleLen = data.seoTitle.length
  const seoDescLen = data.seoDescription.length
  const slug = data.slug || data.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "")

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">SEO Google</h2>
        <p className="mt-1 text-sm text-gray-500">
          Optimisez la visibilité de votre produit sur les moteurs de recherche
        </p>
        {productId && (
          <div className="mt-2 flex items-center gap-2">
            {saveStatus === "saving" && (
              <>
                <Loader2 className="h-3 w-3 animate-spin text-amber-500" />
                <span className="text-xs text-amber-600">Optimisation SEO en cours d&apos;enregistrement...</span>
              </>
            )}
            {saveStatus === "saved" && (
              <>
                <Check className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">Configuration SEO enregistrée</span>
              </>
            )}
          </div>
        )}
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-[#0f172a]">Titre SEO</label>
          <span className={`text-xs font-medium ${seoTitleLen > 60 ? "text-red-500" : "text-gray-400"}`}>
            {seoTitleLen} / 60 caractères{seoTitleLen > 60 ? " — Trop long !" : ""}
          </span>
        </div>
        <input
          type="text"
          value={data.seoTitle}
          onChange={(e) => onChange({ seoTitle: e.target.value })}
          placeholder={data.name || "Titre optimisé pour Google"}
          maxLength={80}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-[#0f172a]">Meta Description</label>
          <span className={`text-xs font-medium ${seoDescLen > 160 ? "text-red-500" : "text-gray-400"}`}>
            {seoDescLen} / 160 caractères{seoDescLen > 160 ? " — Trop long !" : ""}
          </span>
        </div>
        <textarea
          value={data.seoDescription}
          onChange={(e) => onChange({ seoDescription: e.target.value })}
          placeholder="Description concise pour les résultats Google..."
          maxLength={200}
          rows={3}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
        />
      </div>

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-gray-500" />
          <span className="text-sm font-medium text-[#0f172a]">Aperçu Google</span>
        </div>
        <div className="mt-3 rounded-lg bg-white p-4 shadow-sm">
          <p className="text-[#1a0dab] text-lg leading-snug hover:underline cursor-pointer">
            {data.seoTitle || data.name || "Titre du produit"} — NOVA Store
          </p>
          <p className="text-[#006621] text-sm mt-0.5">
            nova-store.vercel.app › produits › {slug}
          </p>
          <p className="text-[#545454] text-sm mt-1 line-clamp-2">
            {data.seoDescription || data.description?.replace(/<[^>]*>/g, "").substring(0, 160) || "Description du produit qui apparaîtra dans les résultats de recherche Google..."}
          </p>
        </div>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#0f172a]">Mots-clés SEO</label>
        <input
          type="text"
          value={data.seoKeywords}
          onChange={(e) => onChange({ seoKeywords: e.target.value })}
          placeholder="Ex: chaussures running, sneakers homme, basket sport"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
        />
        <p className="text-xs text-gray-400">Séparés par des virgules. Utile pour le référencement interne.</p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#0f172a]">URL personnalisée (slug)</label>
        <div className="rounded-lg border border-gray-300 px-4 py-2.5 text-sm">
          <span className="block truncate text-gray-400 text-xs sm:text-sm">nova-store.vercel.app/product/</span>
          <input
            type="text"
            value={data.slug}
            onChange={(e) => onChange({ slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-") })}
            placeholder={slug}
            className="mt-1 w-full border-none bg-transparent p-0 text-sm focus:outline-none"
          />
        </div>
      </div>

      {productId && (
        <button
          onClick={autoSave}
          className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#7126b6] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#5e1f9a] transition"
        >
          <Save className="h-4 w-4" />
          Enregistrer les paramètres SEO
        </button>
      )}
    </div>
  )
}
