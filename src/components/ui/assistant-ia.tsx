"use client"

import { useState, useRef, useEffect } from "react"
import { Sparkles, X, Loader2, Wand2, Copy, Check, Smile, Target } from "lucide-react"
import { cn } from "@/lib/utils"

interface AssistantIAProps {
  contentType: "description" | "title" | "short-description" | "seo" | "faq" | "custom"
  productName?: string
  category?: string
  subcategory?: string
  productType?: string
  currentText?: string
  onGenerated: (text: string) => void
  buttonLabel?: string
  buttonSize?: "sm" | "md"
  apiEndpoint?: string
}

const CONTENT_LABELS: Record<string, string> = {
  "description": "Description du produit",
  "title": "Titre du produit",
  "short-description": "Description courte",
  "seo": "Référencement SEO",
  "faq": "Questions fréquentes",
  "custom": "Contenu personnalisé",
}

const TONE_OPTIONS = [
  { value: "professionnel", label: "Professionnel", emoji: "💼" },
  { value: "decontracte", label: "Décontracté", emoji: "😊" },
  { value: "vendeur", label: "Percutant", emoji: "🎯" },
  { value: "fun", label: "Festif", emoji: "🎉" },
]

export default function AssistantIA({
  contentType,
  productName = "",
  category = "",
  subcategory = "",
  productType = "",
  currentText = "",
  onGenerated,
  buttonLabel,
  buttonSize = "md",
  apiEndpoint = "/api/ai/describe",
}: AssistantIAProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [prompt, setPrompt] = useState("")
  const [tone, setTone] = useState("professionnel")
  const [emojis, setEmojis] = useState(false)
  const [detailed, setDetailed] = useState(false)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState("")
  const [copied, setCopied] = useState(false)
  const [error, setError] = useState("")
  const modalRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    if (isOpen && textareaRef.current) {
      textareaRef.current.focus()
    }
  }, [isOpen])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside)
      return () => document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [isOpen])

  const buildPrompt = (): string => {
    const parts: string[] = []

    if (productName) parts.push(`Produit: "${productName}"`)
    if (category) parts.push(`Catégorie: "${category}"`)
    if (subcategory) parts.push(`Sous-catégorie: "${subcategory}"`)
    if (productType) parts.push(`Type: ${productType}`)

    const toneLabel = TONE_OPTIONS.find((t) => t.value === tone)?.label || "Professionnel"
    parts.push(`Ton: ${toneLabel}`)
    parts.push(`Emojis: ${emojis ? "oui, intègre des emojis dans le texte" : "non, texte sans emojis"}`)
    parts.push(`Longueur: ${detailed ? "longue, 250+ mots, sans limite maximale, très détaillée" : "libre, l'IA choisit la longueur la plus adaptée au produit"}`)

    if (currentText) parts.push(`Texte existant à améliorer: "${currentText.substring(0, 200)}"`)
    if (prompt.trim()) parts.push(`Instruction: "${prompt.trim()}"`)

    return parts.join(" | ")
  }

  const handleGenerate = async () => {
    if (!productName && contentType !== "custom") return

    setLoading(true)
    setError("")
    setResult("")

    try {
      const res = await fetch(apiEndpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: productName,
          type: productType,
          category,
          subcategory,
          action: currentText ? "improve" : "generate",
          tone,
          emojis,
          detailed,
          prompt: buildPrompt(),
          currentText: currentText || undefined,
          contentType,
        }),
      })

      if (!res.ok) throw new Error("Erreur lors de la génération")
      const data = await res.json()
      setResult(data.description || data.result || "")
    } catch {
      setError("Une erreur est survenue. Réessayez.")
    }
    setLoading(false)
  }

  const handleInsert = () => {
    if (!result) return
    onGenerated(result)
    setIsOpen(false)
    setResult("")
    setPrompt("")
  }

  const handleCopy = () => {
    if (!result) return
    const clean = result.replace(/<[^>]*>/g, "")
    navigator.clipboard.writeText(clean)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleRegenerate = () => {
    setResult("")
    handleGenerate()
  }

  const defaultLabel = buttonLabel || "✨ IA"
  const contentLabel = CONTENT_LABELS[contentType] || contentType

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className={cn(
          "flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 font-medium text-white transition hover:from-purple-600 hover:to-pink-600",
          buttonSize === "sm" ? "px-2.5 py-1.5 text-xs" : "px-3 py-1.5 text-xs"
        )}
        title={`Ouvrir l'assistant IA pour: ${contentLabel}`}
      >
        <Sparkles className={cn(buttonSize === "sm" ? "h-3 w-3" : "h-3.5 w-3.5")} />
        <span className="hidden sm:inline">{defaultLabel}</span>
        <span className="sm:hidden">IA</span>
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-[100] flex items-end justify-center bg-black/50 backdrop-blur-sm sm:items-center">
          <div
            ref={modalRef}
            className="relative w-full max-w-lg rounded-t-2xl bg-white shadow-2xl border border-gray-200 overflow-hidden sm:rounded-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header */}
            <div className="sticky top-0 z-10 bg-gradient-to-r from-purple-500 to-pink-500 px-5 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/20">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold text-white">Assistant IA</h3>
                    <p className="text-xs text-white/70">{contentLabel}</p>
                  </div>
                </div>
                <button
                  onClick={() => { setIsOpen(false); setResult(""); setPrompt("") }}
                  className="rounded-lg p-2 text-white/80 hover:bg-white/20 transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="p-5 space-y-4">
              {/* Contexte produit */}
              {productName && (
                <div className="flex items-center gap-2 rounded-lg bg-purple-50 px-3 py-2">
                  <span className="text-sm">📦</span>
                  <span className="text-xs font-medium text-purple-700 truncate">
                    {productName}
                    {category && <span className="text-purple-400"> · {category}</span>}
                  </span>
                </div>
              )}

              {/* 1. Champ instruction libre */}
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700">
                  Votre instruction
                </label>
                <textarea
                  ref={textareaRef}
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Ex: ton fun et jeune, mets en avant la qualité premium..."
                  rows={3}
                  className="w-full rounded-lg border border-gray-300 px-3.5 py-2.5 text-sm focus:border-purple-500 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
                      e.preventDefault()
                      handleGenerate()
                    }
                  }}
                />
                <p className="mt-1 text-[11px] text-gray-400">
                  Ctrl+Entrée pour générer · L&apos;instruction est optionnelle
                </p>
              </div>

              {/* 2. Emojis */}
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <Smile className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">Emojis</span>
                </div>
                <div className="flex gap-1">
                  <button
                    onClick={() => setEmojis(false)}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition",
                      !emojis
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    Non
                  </button>
                  <button
                    onClick={() => setEmojis(true)}
                    className={cn(
                      "flex-1 rounded-md px-2 py-1.5 text-[11px] font-medium transition",
                      emojis
                        ? "bg-purple-100 text-purple-700"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    )}
                  >
                    Oui 😊
                  </button>
                </div>
              </div>

              {/* 3. Ton avec labels */}
              <div className="rounded-lg border border-gray-200 p-3">
                <div className="mb-2 flex items-center gap-1.5">
                  <Target className="h-3.5 w-3.5 text-gray-500" />
                  <span className="text-xs font-medium text-gray-600">Ton</span>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-1.5">
                  {TONE_OPTIONS.map((t) => (
                    <button
                      key={t.value}
                      onClick={() => setTone(t.value)}
                      className={cn(
                        "flex flex-col items-center gap-1 rounded-lg px-2 py-2 text-[10px] font-medium transition",
                        tone === t.value
                          ? "bg-purple-100 text-purple-700 ring-1 ring-purple-300"
                          : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                      )}
                    >
                      <span className="text-base leading-none">{t.emoji}</span>
                      <span className="leading-tight">{t.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 4. Toggle Description détaillée */}
              <div className="flex items-center justify-between rounded-lg border border-gray-200 p-3">
                <div>
                  <span className="text-sm font-medium text-gray-700">Description détaillée</span>
                  <p className="text-[11px] text-gray-400">250+ mots, sans limite</p>
                </div>
                <button
                  onClick={() => setDetailed(!detailed)}
                  className={cn(
                    "relative inline-flex h-6 w-11 items-center rounded-full transition-colors",
                    detailed ? "bg-purple-500" : "bg-gray-300"
                  )}
                >
                  <span
                    className={cn(
                      "inline-block h-4 w-4 transform rounded-full bg-white shadow-sm transition-transform",
                      detailed ? "translate-x-6" : "translate-x-1"
                    )}
                  />
                </button>
              </div>

              {/* Erreur */}
              {error && (
                <div className="rounded-lg bg-red-50 p-3 text-sm text-red-600">
                  {error}
                </div>
              )}

              {/* Résultat */}
              {result && (
                <div className="rounded-xl border border-green-200 bg-green-50 p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-green-800">Résultat généré</span>
                    <span className="rounded-full bg-green-100 px-2 py-0.5 text-[10px] font-medium text-green-700">
                      {detailed ? "détaillé" : "standard"}
                    </span>
                  </div>
                  <div
                    className="prose prose-sm max-h-60 overflow-y-auto text-sm text-gray-700"
                    dangerouslySetInnerHTML={{ __html: result }}
                  />
                  <div className="flex gap-2">
                    <button
                      onClick={handleCopy}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-white transition"
                    >
                      {copied ? <Check className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                      {copied ? "Copié" : "Copier"}
                    </button>
                    <button
                      onClick={handleRegenerate}
                      disabled={loading}
                      className="flex items-center gap-1.5 rounded-lg border border-gray-300 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-white transition disabled:opacity-50"
                    >
                      <Wand2 className="h-3.5 w-3.5" />
                      Régénérer
                    </button>
                    <button
                      onClick={handleInsert}
                      className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-purple-600 px-3 py-2 text-xs font-medium text-white hover:bg-purple-700 transition"
                    >
                      <Sparkles className="h-3.5 w-3.5" />
                      Insérer
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 5. Footer — Bouton Générer */}
            <div className="sticky bottom-0 border-t border-gray-200 bg-gray-50 px-5 py-3">
              <button
                onClick={handleGenerate}
                disabled={loading || (!productName && contentType !== "custom")}
                className="flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-purple-500 to-pink-500 px-4 py-3 text-sm font-medium text-white transition hover:from-purple-600 hover:to-pink-600 disabled:opacity-50"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Génération en cours...
                  </>
                ) : (
                  <>
                    <Wand2 className="h-4 w-4" />
                    {result ? "Régénérer" : "Générer avec l'IA"}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}
