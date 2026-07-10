"use client"

import { useState } from "react"
import { Plus, Trash2, GripVertical, Upload, X, Image as ImageIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"

export interface VariantOption {
  name: string
  values: string[]
}

export interface Variant {
  name: string
  sku: string
  price: number
  stock: number
  image: string
  options: Record<string, string>
}

interface VariantManagerProps {
  options: VariantOption[]
  variants: Variant[]
  onOptionsChange: (options: VariantOption[]) => void
  onVariantsChange: (variants: Variant[]) => void
  isPhysical?: boolean
  currency?: string
}

function generateCombinations(options: VariantOption[]): Record<string, string>[] {
  if (options.length === 0 || options.some((o) => o.values.length === 0)) return []
  const combinations: Record<string, string>[] = [{}]
  for (const option of options) {
    const newCombinations: Record<string, string>[] = []
    for (const combo of combinations) {
      for (const value of option.values) {
        newCombinations.push({ ...combo, [option.name]: value })
      }
    }
    combinations.length = 0
    combinations.push(...newCombinations)
  }
  return combinations
}

function variantNameFromOptions(opts: Record<string, string>): string {
  return Object.values(opts).join(" / ")
}

export default function VariantManager({
  options,
  variants,
  onOptionsChange,
  onVariantsChange,
  isPhysical = true,
  currency = "XOF",
}: VariantManagerProps) {
  const [newOptionName, setNewOptionName] = useState("")
  const [uploadingIndex, setUploadingIndex] = useState<number | null>(null)

  const addOption = () => {
    if (!newOptionName.trim()) return
    if (options.some((o) => o.name.toLowerCase() === newOptionName.trim().toLowerCase())) return
    onOptionsChange([...options, { name: newOptionName.trim(), values: [] }])
    setNewOptionName("")
  }

  const removeOption = (index: number) => {
    const removed = options[index]
    onOptionsChange(options.filter((_, i) => i !== index))
    const newVariants = variants.map((v) => {
      const { [removed.name]: _, ...rest } = v.options
      return { ...v, options: rest, name: variantNameFromOptions(rest) }
    })
    onVariantsChange(newVariants.filter((v) => v.name))
  }

  const addValue = (optionIndex: number, value: string) => {
    if (!value.trim()) return
    const opt = options[optionIndex]
    if (opt.values.includes(value.trim())) return
    const updated = options.map((o, i) =>
      i === optionIndex ? { ...o, values: [...o.values, value.trim()] } : o
    )
    onOptionsChange(updated)
  }

  const removeValue = (optionIndex: number, valueIndex: number) => {
    const opt = options[optionIndex]
    const removedValue = opt.values[valueIndex]
    const updated = options.map((o, i) =>
      i === optionIndex ? { ...o, values: o.values.filter((_, vi) => vi !== valueIndex) } : o
    )
    onOptionsChange(updated)
    const newVariants = variants.map((v) => {
      if (v.options[opt.name] === removedValue) {
        const { [opt.name]: _, ...rest } = v.options
        return { ...v, options: rest, name: variantNameFromOptions(rest) }
      }
      return v
    })
    onVariantsChange(newVariants.filter((v) => v.name))
  }

  const syncVariants = () => {
    const combos = generateCombinations(options)
    const existingMap = new Map(variants.map((v) => [v.name, v]))
    const newVariants = combos.map((combo) => {
      const name = variantNameFromOptions(combo)
      const existing = existingMap.get(name)
      return existing || { name, sku: "", price: 0, stock: 0, image: "", options: combo }
    })
    onVariantsChange(newVariants)
  }

  const updateVariantField = (index: number, field: keyof Variant, value: any) => {
    onVariantsChange(variants.map((v, i) => (i === index ? { ...v, [field]: value } : v)))
  }

  const removeVariant = (index: number) => {
    onVariantsChange(variants.filter((_, i) => i !== index))
  }

  const handleImageUpload = async (index: number, file: File) => {
    setUploadingIndex(index)
    try {
      const formData = new FormData()
      formData.append("file", file)
      const res = await fetch("/api/upload", { method: "POST", body: formData })
      if (res.ok) {
        const data = await res.json()
        updateVariantField(index, "image", data.url || data.fileUrl)
      }
    } catch {}
    setUploadingIndex(null)
  }

  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <h4 className="text-sm font-semibold text-[#0f172a] mb-3">Groupes d&apos;options</h4>
        <p className="text-xs text-gray-500 mb-4">
          Définissez les attributs (Couleur, Taille, etc.) puis ajoutez leurs valeurs possibles.
        </p>

        {options.map((opt, oi) => (
          <div key={oi} className="mb-3 rounded-lg border border-gray-200 bg-white p-3">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-[#0f172a]">{opt.name}</span>
              <button onClick={() => removeOption(oi)} className="text-red-500 hover:text-red-700">
                <Trash2 className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {opt.values.map((val, vi) => (
                <span key={vi} className="inline-flex items-center gap-1 rounded-full bg-purple-100 px-2.5 py-1 text-xs font-medium text-purple-700">
                  {val}
                  <button onClick={() => removeValue(oi, vi)} className="hover:text-purple-900">
                    <X className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder={`Ajouter une valeur à "${opt.name}"`}
                className="flex-1 rounded-lg border border-gray-200 px-3 py-1.5 text-xs focus:border-[#7126b6] focus:outline-none"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault()
                    addValue(oi, (e.target as HTMLInputElement).value)
                    ;(e.target as HTMLInputElement).value = ""
                  }
                }}
              />
              <button
                onClick={(e) => {
                  const input = (e.currentTarget.previousElementSibling as HTMLInputElement)
                  addValue(oi, input.value)
                  input.value = ""
                }}
                className="text-xs text-[#7126b6] hover:text-[#5e1f9a] font-medium px-2"
              >
                Ajouter
              </button>
            </div>
          </div>
        ))}

        <div className="flex gap-2">
          <input
            type="text"
            value={newOptionName}
            onChange={(e) => setNewOptionName(e.target.value)}
            placeholder="Nom de l'attribut (ex: Couleur)"
            className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault()
                addOption()
              }
            }}
          />
          <Button type="button" variant="outline" size="sm" onClick={addOption}>
            <Plus className="mr-1 h-3.5 w-3.5" /> Attribut
          </Button>
        </div>

        {options.length > 0 && options.some((o) => o.values.length > 0) && (
          <Button type="button" variant="outline" size="sm" className="mt-3 w-full" onClick={syncVariants}>
            Générer les combinaisons ({generateCombinations(options).length} variants)
          </Button>
        )}
      </div>

      {variants.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-semibold text-[#0f172a]">Variantes ({variants.length})</h4>
          {variants.map((variant, vi) => (
            <div key={vi} className="rounded-xl border border-gray-200 p-4">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <GripVertical className="h-4 w-4 text-gray-300" />
                  <span className="text-sm font-medium text-[#0f172a]">
                    {variant.name || `Variante ${vi + 1}`}
                  </span>
                </div>
                <button onClick={() => removeVariant(vi)} className="text-red-500 hover:text-red-700">
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <Input
                  label="Nom"
                  value={variant.name}
                  onChange={(e) => updateVariantField(vi, "name", e.target.value)}
                  placeholder="ex: Rouge / Taille M"
                />
                {isPhysical && (
                  <Input
                    label="SKU"
                    value={variant.sku}
                    onChange={(e) => updateVariantField(vi, "sku", e.target.value)}
                    placeholder="SKU-001"
                  />
                )}
                <Input
                  label={`Prix (${currency})`}
                  type="number"
                  value={variant.price || ""}
                  onChange={(e) => updateVariantField(vi, "price", Number(e.target.value))}
                  placeholder="0"
                  min={0}
                />
                {isPhysical && (
                  <Input
                    label="Stock"
                    type="number"
                    value={variant.stock || ""}
                    onChange={(e) => updateVariantField(vi, "stock", Number(e.target.value))}
                    placeholder="0"
                    min={0}
                  />
                )}
                <div className="sm:col-span-2">
                  <label className="text-xs font-medium text-gray-700 mb-1 block">Image de la variante</label>
                  <div className="flex items-center gap-3">
                    {variant.image ? (
                      <div className="relative h-16 w-16 rounded-lg overflow-hidden border border-gray-200">
                        <img src={variant.image} alt={variant.name} className="h-full w-full object-cover" />
                        <button
                          onClick={() => updateVariantField(vi, "image", "")}
                          className="absolute top-0.5 right-0.5 h-4 w-4 rounded-full bg-red-500 text-white flex items-center justify-center"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    ) : (
                      <label className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border-2 border-dashed border-gray-300 hover:border-[#7126b6] transition">
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleImageUpload(vi, file)
                          }}
                        />
                        {uploadingIndex === vi ? (
                          <div className="h-4 w-4 animate-spin rounded-full border-2 border-[#7126b6] border-t-transparent" />
                        ) : (
                          <ImageIcon className="h-5 w-5 text-gray-400" />
                        )}
                      </label>
                    )}
                    <p className="text-xs text-gray-400">Optionnel — image spécifique à cette variante</p>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
