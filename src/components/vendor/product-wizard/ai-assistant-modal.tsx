"use client"

import { useState } from "react"
import { Sparkles, X, Loader2, Wand2, Copy, Check } from "lucide-react"
import { ProductType } from "@/types/product"

interface AIAssistantModalProps {
  isOpen: boolean
  onClose: () => void
  onInsert: (data: any) => void
  productType: ProductType | null
  currentStep: string
  productName: string
  currentData?: any
}

const STEP_CONTEXTS: Record<string, { label: string; placeholder: string; icon: string }> = {
  "general": { label: "Description du produit", placeholder: "Ex: Rédige un ton luxueux, mets l'accent sur la qualité...", icon: "📝" },
  "media-banner": { label: "Médias du produit", placeholder: "Ex: Suggère des idées de visuels pour la bannière...", icon: "🖼️" },
  "pricing-marketing": { label: "Tarification & Promotion", placeholder: "Ex: Suggère un prix compétitif pour ce type de produit...", icon: "💰" },
  "seo": { label: "Référencement SEO", placeholder: "Ex: Génère un titre SEO et une meta description percutants...", icon: "🔍" },
  "faq": { label: "Questions fréquentes", placeholder: "Ex: Génère les 3 questions les plus posées par les clients...", icon: "❓" },
  "post-purchase": { label: "Instructions post-achat", placeholder: "Ex: Rédige les instructions de téléchargement...", icon: "📦" },
  "logistics": { label: "Logistique & Livraison", placeholder: "Ex: Suggère des informations de livraison...", icon: "🚚" },
  "files-visuals": { label: "Fichiers & Visuels", placeholder: "Ex: Décris le contenu du fichier à télécharger...", icon: "📁" },
  "requirements": { label: "Exigences du service", placeholder: "Ex: Rédige la méthodologie du service...", icon: "📋" },
  "access-config": { label: "Configuration d'accès", placeholder: "Ex: Rédige les instructions d'intégration...", icon: "🔑" },
  "bundle-selection": { label: "Sélection du pack", placeholder: "Ex: Rédige la présentation du pack...", icon: "📦" },
  "planning-venue": { label: "Planning & Lieu", placeholder: "Ex: Crée un programme heure par heure...", icon: "📅" },
  "preview": { label: "Aperçu final", placeholder: "Ex: Optimise l'ensemble de la fiche produit...", icon: "👁️" },
}

export default function AIAssistantModal({
  isOpen,
  onClose,
  onInsert,
  productType,
  currentStep,
  productName,
  currentData,
}: AIAssistantModalProps) {
  const [prompt, setPrompt] = useState("")
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")

  const context = STEP_CONTEXTS[currentStep] || STEP_CONTEXTS["general"]

  const handleGenerate = async () => {
    if (!prompt.trim() && !productName) return
    setLoading(true)
    setError("")
    setResult(null)

    try {
      const res = await fetch("/api/ai/assistant", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          prompt: prompt || `Génère le contenu pour ${productName}`,
          productType,
          currentStep,
          productName,
          currentData,
        }),
      })

      if (!res.ok) throw new Error("Erreur lors de la génération")
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError("Une erreur est survenue. Réessayez.")
    }
    setLoading(false)
  }

  const handleInsert = () => {
    if (!result?.data) return
    onInsert(result.data)
    setResult(null)
    setPrompt("")
    onClose()
  }

  const handleCopy = () => {
    if (!result?.data) return
    const text = result.data.description || result.data.seoTitle || JSON.stringify(result.data)
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center" onClick={onClose}>
      <div
        className="relative w-full max-w-lg rounded-t-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden sm:rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-gradient-to-r from-[#7126b6] to-purple-500 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/20">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Assistant IA</h3>
                <p className="text-xs text-white/80">{context.label}</p>
              </div>
            </div>
            <button onClick={onClose} className="rounded-lg p-2 text-white/80 hover:bg-white/20 transition">
              <X className="h-5 w-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {productType && (
            <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2">
              <span className="text-sm">📦</span>
              <span className="text-xs font-medium text-[#7126b6]">Type : {productType}</span>
              {productName && (
                <>
                  <span className="text-gray-300">|</span>
                  <span className="text-xs text-gray-600 truncate">{productName}</span>
                </>
              )}
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Votre consigne
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder={context.placeholder}
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6] resize-none"
              onKeyDown={(e) => {
                if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  handleGenerate()
                }
              }}
            />
            <p className="mt-1 text-xs text-gray-400">
              Ctrl+Entrée pour générer rapidement
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            {[
              "Rédige un ton professionnel",
              "Mets l'accent sur les bénéfices",
              "Ton luxe et premium",
              "Oriente vers la conversion",
              "Adapte au marché béninois",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => setPrompt(suggestion)}
                className="rounded-full border border-gray-200 px-3 py-1 text-xs text-gray-600 hover:border-[#7126b6] hover:text-[#7126b6] transition"
              >
                {suggestion}
              </button>
            ))}
          </div>

          {error && (
            <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
              {error}
            </div>
          )}

          {result && (
            <div className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-700">Résultat généré</span>
                <span className="rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700">
                  {result.action === "description" && "Description"}
                  {result.action === "seo" && "SEO"}
                  {result.action === "faq" && "FAQ"}
                  {result.action === "autoFill" && "Auto-remplissage"}
                </span>
              </div>

              {result.data?.description && (
                <div
                  className="prose prose-sm max-h-48 overflow-y-auto text-sm text-gray-700"
                  dangerouslySetInnerHTML={{ __html: result.data.description }}
                />
              )}
              {result.data?.seoTitle && (
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Titre SEO :</span>
                    <p className="text-sm font-medium text-[#0f172a]">{result.data.seoTitle}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Meta description :</span>
                    <p className="text-sm text-gray-700">{result.data.seoDescription}</p>
                  </div>
                </div>
              )}
              {result.data?.faqItems && (
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {result.data.faqItems.map((item: any, i: number) => (
                    <div key={i} className="rounded-lg bg-white p-3 border border-gray-100">
                      <p className="text-sm font-medium text-[#0f172a]">Q{i + 1}: {item.question}</p>
                      <p className="mt-1 text-xs text-gray-600">{item.answer}</p>
                    </div>
                  ))}
                </div>
              )}
              {result.data?.shortDescription && (
                <div className="space-y-2">
                  <div>
                    <span className="text-xs text-gray-500">Description courte :</span>
                    <p className="text-sm text-gray-700">{result.data.shortDescription}</p>
                  </div>
                  <div>
                    <span className="text-xs text-gray-500">Texte CTA :</span>
                    <p className="text-sm font-medium text-[#7126b6]">{result.data.ctaText}</p>
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="flex flex-wrap gap-3">
            <button
              onClick={handleGenerate}
              disabled={loading || (!prompt.trim() && !productName)}
              className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-[#7126b6] px-4 py-3 text-sm font-medium text-white transition hover:bg-[#5e1f9a] disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Génération en cours...
                </>
              ) : (
                <>
                  <Wand2 className="h-4 w-4" />
                  Générer avec l&apos;IA
                </>
              )}
            </button>

            {result && (
              <>
                <button
                  onClick={handleCopy}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50 transition"
                >
                  {copied ? <Check className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copié" : "Copier"}
                </button>
                <button
                  onClick={handleInsert}
                  className="flex items-center gap-2 rounded-lg bg-green-600 px-4 py-3 text-sm font-medium text-white hover:bg-green-700 transition"
                >
                  Insérer
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
