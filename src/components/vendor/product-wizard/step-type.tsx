"use client"

import { PRODUCT_TYPES, type WizardData, type ProductType } from "@/types/product"
import {
  Package,
  Download,
  Users,
  Boxes,
  Calendar,
  Check,
} from "lucide-react"

const iconMap: Record<string, React.ElementType> = {
  Package,
  Download,
  Users,
  Boxes,
  Calendar,
}

interface StepTypeProps {
  data: WizardData
  onChange: (data: Partial<WizardData>) => void
}

export default function StepType({ data, onChange }: StepTypeProps) {
  const handleSelect = (type: ProductType) => {
    onChange({
      productType: type,
      ctaText: PRODUCT_TYPES.find((t) => t.type === type)?.defaultCta || "",
      step: "general" as string,
    })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">Type de produit</h2>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          Sélectionnez le type de produit que vous souhaitez créer
        </p>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {PRODUCT_TYPES.map((pt) => {
          const Icon = iconMap[pt.icon]
          const isSelected = data.productType === pt.type

          return (
            <button
              key={pt.type}
              type="button"
              onClick={() => handleSelect(pt.type)}
              className={`relative flex flex-col items-center gap-2 rounded-xl border-2 p-4 text-center transition-all duration-200 ${
                isSelected
                  ? "border-[#7126b6] bg-purple-50 shadow-md ring-2 ring-purple-200"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-500 hover:shadow-sm"
              }`}
            >
              {isSelected && (
                <div className="absolute top-2 right-2 w-5 h-5 bg-[#7126b6] rounded-full flex items-center justify-center">
                  <Check size={12} className="text-white" />
                </div>
              )}

              <div
                className={`w-10 h-10 rounded-xl bg-gradient-to-br ${pt.color} flex items-center justify-center`}
              >
                {Icon && <Icon size={20} className="text-white" />}
              </div>

              <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">{pt.label}</span>
              <span className="text-[11px] text-gray-500 dark:text-gray-400 leading-tight">{pt.description}</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
