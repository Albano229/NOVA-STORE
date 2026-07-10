"use client"

import { WizardData } from "@/types/product"
import { PREPARATION_DELAYS } from "@/types/product"
import { Truck, AlertTriangle } from "lucide-react"

interface StepLogisticsProps {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
}

export default function StepLogistics({ data, onChange }: StepLogisticsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">Logistique & Options</h2>
        <p className="mt-1 text-sm text-gray-500">Gestion du stock, expédition et informations de livraison</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Stock disponible</label>
          <input
            type="number"
            value={data.stock || ""}
            onChange={(e) => onChange({ stock: Number(e.target.value) })}
            placeholder="0"
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Alerte stock faible</label>
          <div className="mt-1 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-500" />
            <input
              type="number"
              value={data.lowStockAlert || ""}
              onChange={(e) => onChange({ lowStockAlert: Number(e.target.value) })}
              placeholder="5"
              min={0}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>
          <p className="mt-1 text-xs text-gray-400">Notification quand le stock atteint ce seuil</p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Poids (kg)</label>
          <input
            type="number"
            value={data.weight || ""}
            onChange={(e) => onChange({ weight: Number(e.target.value) })}
            placeholder="0.0"
            step="0.1"
            min={0}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Dimensions (L x l x h cm)</label>
          <input
            type="text"
            value={data.dimensions}
            onChange={(e) => onChange({ dimensions: e.target.value })}
            placeholder="Ex: 30 x 20 x 10"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#0f172a]">Délai de préparation</label>
        <select
          value={data.preparationDelay}
          onChange={(e) => onChange({ preparationDelay: e.target.value })}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
        >
          {PREPARATION_DELAYS.map((d) => (
            <option key={d.value} value={d.value}>{d.label}</option>
          ))}
        </select>
      </div>

      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-[#7126b6]" />
          <h4 className="text-sm font-medium text-[#0f172a]">Expédition & Livraison</h4>
        </div>
        <div className="mt-4 space-y-3">
          <div className="flex items-center gap-3">
            <button
              onClick={() => onChange({ shippingEnabled: !data.shippingEnabled })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                data.shippingEnabled ? "bg-[#7126b6]" : "bg-gray-300"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                data.shippingEnabled ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
            <span className="text-sm text-gray-700">Activer la livraison</span>
          </div>
          {data.shippingEnabled && (
            <div className="space-y-3">
              <div>
                <label className="block text-xs text-gray-500">Frais de livraison (FCFA)</label>
                <input
                  type="number"
                  value={data.shippingCost || ""}
                  onChange={(e) => onChange({ shippingCost: Number(e.target.value) })}
                  placeholder="0"
                  min={0}
                  className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none"
                />
              </div>
              <div className="flex items-center gap-3">
                <button
                  onClick={() => onChange({ collectDeliveryAddress: !data.collectDeliveryAddress })}
                  className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                    data.collectDeliveryAddress ? "bg-[#7126b6]" : "bg-gray-300"
                  }`}
                >
                  <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                    data.collectDeliveryAddress ? "translate-x-6" : "translate-x-1"
                  }`} />
                </button>
                <span className="text-sm text-gray-700">Demander l&apos;adresse de livraison au client</span>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Garantie</label>
          <textarea
            value={data.warranty}
            onChange={(e) => onChange({ warranty: e.target.value })}
            placeholder="Ex: 2 ans de garantie..."
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Politique de retour</label>
          <textarea
            value={data.returnPolicy}
            onChange={(e) => onChange({ returnPolicy: e.target.value })}
            placeholder="Ex: Retour sous 30 jours..."
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
      </div>
    </div>
  )
}
