"use client"

import { WizardData } from "@/types/product"
import { CATEGORIES } from "@/types/product"
import { useState, useEffect, useMemo } from "react"
import dynamic from "next/dynamic"
import AssistantIA from "@/components/ui/assistant-ia"

const QuillEditor = dynamic(() => import("@/components/ui/quill-editor"), { ssr: false })

interface StepGeneralProps {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
}

export default function StepGeneral({ data, onChange }: StepGeneralProps) {
  const [prevProductType, setPrevProductType] = useState(data.productType)

  useEffect(() => {
    if (prevProductType !== data.productType) {
      setPrevProductType(data.productType)
      if (prevProductType !== null) {
        onChange({ categoryId: "", subcategoryId: "" })
      }
    }
  }, [data.productType, prevProductType, onChange])

  const categories = useMemo(() => {
    if (!data.productType) return []
    return CATEGORIES[data.productType] || []
  }, [data.productType])

  const subcategories = useMemo(() => {
    if (!data.categoryId) return []
    const cat = categories.find((c) => c.id === data.categoryId)
    return cat?.subcategories || []
  }, [data.categoryId, categories])

  const generateSlug = (name: string) => {
    return name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "")
  }

  const handleNameChange = (name: string) => {
    onChange({ name, slug: generateSlug(name) })
  }

  const categoryName = categories.find((c) => c.id === data.categoryId)?.name || ""
  const subcategoryName = subcategories.find((s) => s.id === data.subcategoryId)?.name || ""

  const title =
    data.productType === "SERVICE" ? "Présentation du Service" :
    data.productType === "COMMUNITY" ? "Description de la Communauté" :
    data.productType === "BUNDLE" ? "Composition du Pack" :
    data.productType === "BOOKING" ? "Programme de l'Événement" :
    "Informations Générales"

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">
          Décrivez votre produit pour attirer les acheteurs
        </p>
      </div>

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#0f172a]">
          {data.productType === "COMMUNITY" ? "Nom du club ou du groupe" :
           data.productType === "BUNDLE" ? "Nom du pack promotionnel" :
           data.productType === "BOOKING" ? "Titre de l'événement" :
           "Nom du produit"}
          <span className="text-red-500"> *</span>
        </label>
        <input
          type="text"
          value={data.name}
          onChange={(e) => handleNameChange(e.target.value)}
          placeholder="Ex: T-shirt Premium Coton Bio"
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0f172a]">
            Catégorie <span className="text-red-500">*</span>
          </label>
          <select
            value={data.categoryId}
            onChange={(e) => onChange({ categoryId: e.target.value, subcategoryId: "" })}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          >
            <option value="">Sélectionner...</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>
        <div className="space-y-2">
          <label className="block text-sm font-medium text-[#0f172a]">Sous-catégorie</label>
          <select
            value={data.subcategoryId}
            onChange={(e) => onChange({ subcategoryId: e.target.value })}
            disabled={!data.categoryId}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6] disabled:opacity-50"
          >
            <option value="">Sélectionner...</option>
            {subcategories.map((sub) => (
              <option key={sub.id} value={sub.id}>{sub.name}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="block text-sm font-medium text-[#0f172a]">
            Description {data.productType === "COMMUNITY" ? "de la communauté" : "du produit"}
          </label>
          <AssistantIA
            contentType="description"
            productName={data.name}
            category={categoryName}
            subcategory={subcategoryName}
            productType={data.productType || ""}
            onGenerated={(text) => onChange({ description: text })}
            buttonLabel="Assistant IA Description du produit"
            buttonSize="sm"
          />
        </div>
        <div className="rounded-lg border border-gray-200 bg-gray-50 p-1">
          <QuillEditor
            value={data.description}
            onChange={(val: string) => onChange({ description: val })}
            placeholder="Décrivez votre produit en détail..."
          />
        </div>
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <div>
            <label className="block text-sm font-medium text-[#0f172a]">Courte description</label>
            <p className="text-xs text-gray-400">Résumé court affiché dans les listes de produits</p>
          </div>
          <AssistantIA
            contentType="short-description"
            productName={data.name}
            category={categoryName}
            productType={data.productType || ""}
            onGenerated={(text) => onChange({ shortDescription: text.replace(/<[^>]*>/g, "") })}
            buttonLabel="Suggérer"
            buttonSize="sm"
          />
        </div>
        <textarea
          value={data.shortDescription}
          onChange={(e) => onChange({ shortDescription: e.target.value })}
          placeholder="Description courte en une ou deux phrases..."
          rows={2}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
        />
      </div>

      {(data.productType === "PHYSICAL" || data.productType === "BUNDLE") && (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#0f172a]">Marque</label>
            <input
              type="text"
              value={data.brand}
              onChange={(e) => onChange({ brand: e.target.value })}
              placeholder="Ex: Nike, Samsung..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>
          <div className="space-y-2">
            <label className="block text-sm font-medium text-[#0f172a]">SKU</label>
            <input
              type="text"
              value={data.sku}
              onChange={(e) => onChange({ sku: e.target.value })}
              placeholder="Ex: TSH-PRE-001"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>
        </div>
      )}
    </div>
  )
}
