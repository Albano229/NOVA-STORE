"use client"

import { WizardData } from "@/types/product"
import { Clock, MapPin, Globe, Plus, Trash2 } from "lucide-react"

interface StepRequirementsProps {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
}

export default function StepRequirements({ data, onChange }: StepRequirementsProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">Exigences & Options</h2>
        <p className="mt-1 text-sm text-gray-500">
          Délais, modalités et informations complémentaires du service
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Délai de livraison estimé</label>
          <div className="mt-1 flex items-center gap-2">
            <Clock className="h-4 w-4 text-gray-400" />
            <input
              type="text"
              value={data.deliveryDelay}
              onChange={(e) => onChange({ deliveryDelay: e.target.value })}
              placeholder="Ex: 3-5 jours"
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Mode de prestation</label>
          <div className="mt-1 flex gap-2">
            {[
              { value: "online", label: "En ligne", icon: Globe },
              { value: "offline", label: "Présentiel", icon: MapPin },
              { value: "both", label: "Les deux", icon: null },
            ].map((m) => (
              <button
                key={m.value}
                onClick={() => onChange({ locationType: m.value as any })}
                className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2 text-sm transition ${
                  data.locationType === m.value
                    ? "border-[#7126b6] bg-purple-50 text-[#7126b6]"
                    : "border-gray-300 text-gray-600 hover:bg-gray-50"
                }`}
              >
                {m.icon && <m.icon className="h-4 w-4" />}
                {m.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {(data.locationType === "offline" || data.locationType === "both") && (
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Zone d&apos;intervention</label>
          <input
            type="text"
            value={data.zone}
            onChange={(e) => onChange({ zone: e.target.value })}
            placeholder="Ex: Cotonou et environs"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
      )}

      <div className="rounded-xl border border-gray-200 p-5">
        <h4 className="text-sm font-medium text-[#0f172a]">Options payantes additionnelles</h4>
        <p className="mt-1 text-xs text-gray-500">
          Ajoutez des services en supplément (ex: &quot;Fichiers sources : +10 000 FCFA&quot;)
        </p>
        {data.paidOptions.length > 0 && (
          <div className="mt-3 space-y-2">
            {data.paidOptions.map((opt, i) => (
              <div key={i} className="rounded-lg bg-gray-50 p-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                <input
                  type="text"
                  value={opt.name}
                  onChange={(e) => {
                    const updated = data.paidOptions.map((o, oi) =>
                      oi === i ? { ...o, name: e.target.value } : o
                    )
                    onChange({ paidOptions: updated })
                  }}
                  placeholder="Nom de l'option"
                  className="w-full sm:flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:border-[#7126b6] focus:outline-none"
                />
                <div className="flex items-center gap-2">
                  <input
                    type="number"
                    value={opt.price || ""}
                    onChange={(e) => {
                      const updated = data.paidOptions.map((o, oi) =>
                        oi === i ? { ...o, price: Number(e.target.value) } : o
                      )
                      onChange({ paidOptions: updated })
                    }}
                    placeholder="Prix"
                    min={0}
                    className="w-full sm:w-24 rounded border border-gray-200 px-2 py-1 text-sm focus:border-[#7126b6] focus:outline-none"
                  />
                  <span className="text-xs text-gray-400">FCFA</span>
                  <button
                    onClick={() => {
                      const updated = data.paidOptions.filter((_, oi) => oi !== i)
                      onChange({ paidOptions: updated })
                    }}
                    className="flex-shrink-0 text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        <button
          onClick={() => {
            onChange({ paidOptions: [...data.paidOptions, { name: "", price: 0 }] })
          }}
          className="mt-3 flex items-center gap-2 text-sm text-[#7126b6] hover:underline"
        >
          <Plus className="h-4 w-4" /> Ajouter une option payante
        </button>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#0f172a]">Formulaire client (optionnel)</label>
        <p className="text-xs text-gray-400">
          Informations à collecter au moment de la commande
        </p>
        <textarea
          value={data.clientForm}
          onChange={(e) => onChange({ clientForm: e.target.value })}
          placeholder="Ex: Nom complet, numéro de téléphone, description du projet..."
          rows={3}
          className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
        />
      </div>
    </div>
  )
}
