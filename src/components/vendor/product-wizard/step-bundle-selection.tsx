"use client"

import { WizardData } from "@/types/product"
import { Search, Trash2, Plus, Calculator } from "lucide-react"
import { useState, useEffect } from "react"

interface StepBundleSelectionProps {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
}

export default function StepBundleSelection({ data, onChange }: StepBundleSelectionProps) {
  const [searchQuery, setSearchQuery] = useState("")
  const [searchResults, setSearchResults] = useState<any[]>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([])
      return
    }
    const timer = setTimeout(async () => {
      setSearching(true)
      try {
        const res = await fetch(`/api/products?search=${encodeURIComponent(searchQuery)}`)
        const json = await res.json()
        const products = Array.isArray(json) ? json : json.products || []
        setSearchResults(products.filter((p: any) => !data.bundleProducts.find((bp) => bp.productId === p.id)))
      } catch { /* empty */ }
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery, data.bundleProducts])

  const addProduct = (product: any) => {
    onChange({
      bundleProducts: [
        ...data.bundleProducts,
        { productId: product.id, name: product.name, price: product.price },
      ],
    })
    setSearchQuery("")
    setSearchResults([])
  }

  const removeProduct = (productId: string) => {
    onChange({ bundleProducts: data.bundleProducts.filter((p) => p.productId !== productId) })
  }

  const totalRealPrice = data.bundleProducts.reduce((sum, p) => sum + p.price, 0)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">Sélection des Produits du Pack</h2>
        <p className="mt-1 text-sm text-gray-500">
          Recherchez et sélectionnez les produits à inclure dans le bundle
        </p>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Rechercher un produit par nom..."
          className="w-full rounded-lg border border-gray-300 py-2.5 pl-10 pr-4 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
        />
        {searching && (
          <div className="absolute right-3 top-3 text-xs text-gray-400">Recherche...</div>
        )}
        {searchResults.length > 0 && (
          <div className="absolute z-10 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg">
            {searchResults.slice(0, 5).map((product) => (
              <button
                key={product.id}
                onClick={() => addProduct(product)}
                className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-gray-50"
              >
                <div>
                  <p className="text-sm font-medium text-[#0f172a]">{product.name}</p>
                  <p className="text-xs text-gray-500">{product.price?.toLocaleString()} FCFA</p>
                </div>
                <Plus className="h-4 w-4 text-[#7126b6]" />
              </button>
            ))}
          </div>
        )}
      </div>

      {data.bundleProducts.length > 0 ? (
        <div className="space-y-3">
          {data.bundleProducts.map((item, i) => (
            <div key={item.productId} className="flex items-center justify-between gap-2 rounded-xl border border-gray-200 p-4">
              <div className="flex min-w-0 items-center gap-3">
                <span className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-purple-100 text-xs font-medium text-[#7126b6]">
                  {i + 1}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-sm font-medium text-[#0f172a]">{item.name}</p>
                  <p className="text-xs text-gray-500">{item.price.toLocaleString()} FCFA</p>
                </div>
              </div>
              <button
                onClick={() => removeProduct(item.productId)}
                className="flex-shrink-0 text-red-500 hover:text-red-700"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <div className="flex items-center gap-2">
              <Calculator className="h-5 w-5 text-[#7126b6]" />
              <span className="text-sm font-medium text-[#0f172a]">Prix total réel cumulé</span>
            </div>
            <p className="mt-1 text-2xl font-bold text-[#7126b6]">
              {totalRealPrice.toLocaleString()} FCFA
            </p>
            <p className="text-xs text-gray-500">
              Le prix du pack sera inférieur à ce montant grâce à la réduction.
            </p>
          </div>
        </div>
      ) : (
        <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-8 text-center">
          <Search className="mx-auto h-8 w-8 text-gray-300" />
          <p className="mt-2 text-sm text-gray-500">
            Recherchez et sélectionnez les produits à inclure dans le pack
          </p>
        </div>
      )}
    </div>
  )
}
