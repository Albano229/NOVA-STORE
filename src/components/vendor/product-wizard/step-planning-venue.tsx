"use client"

import { WizardData } from "@/types/product"
import { Calendar, MapPin, Globe, Users, Plus, Trash2 } from "lucide-react"

interface StepPlanningVenueProps {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
}

export default function StepPlanningVenue({ data, onChange }: StepPlanningVenueProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">Planning & Lieu</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configurez les dates, heures et le lieu de l&apos;événement
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Date et heure de début</label>
          <input
            type="datetime-local"
            value={data.eventDate && data.eventTime ? `${data.eventDate}T${data.eventTime}` : ""}
            onChange={(e) => {
              const [date, time] = e.target.value.split("T")
              onChange({ eventDate: date || "", eventTime: time || "" })
            }}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Date et heure de fin</label>
          <input
            type="datetime-local"
            value={data.eventEndDate && data.eventEndTime ? `${data.eventEndDate}T${data.eventEndTime}` : ""}
            onChange={(e) => {
              const [date, time] = e.target.value.split("T")
              onChange({ eventEndDate: date || "", eventEndTime: time || "" })
            }}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Durée</label>
          <input
            type="text"
            value={data.eventDuration}
            onChange={(e) => onChange({ eventDuration: e.target.value })}
            placeholder="Ex: 2 jours, 3 heures"
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Places maximales</label>
          <div className="mt-1 flex items-center gap-2">
            <Users className="h-4 w-4 text-gray-400" />
            <input
              type="number"
              value={data.maxSeats || ""}
              onChange={(e) => onChange({ maxSeats: Number(e.target.value) })}
              placeholder="0 = illimité"
              min={0}
              className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-[#0f172a]">Mode de l&apos;événement</label>
        <div className="flex gap-2">
          {[
            { value: "online", label: "En ligne", icon: Globe },
            { value: "offline", label: "Présentiel", icon: MapPin },
            { value: "both", label: "Les deux", icon: null },
          ].map((m) => (
            <button
              key={m.value}
              onClick={() => onChange({ eventMode: m.value as any })}
              className={`flex flex-1 items-center justify-center gap-1 rounded-lg border px-3 py-2.5 text-sm transition ${
                data.eventMode === m.value
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

      {(data.eventMode === "online" || data.eventMode === "both") && (
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">URL secrète (Zoom, Meet, etc.)</label>
          <div className="mt-1 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-700">
            <Lock className="h-3 w-3" />
            Ce lien ne sera révélé qu&apos;après paiement
          </div>
          <input
            type="url"
            value={data.onlineUrl}
            onChange={(e) => onChange({ onlineUrl: e.target.value })}
            placeholder="https://zoom.us/j/..."
            className="mt-2 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
      )}

      {(data.eventMode === "offline" || data.eventMode === "both") && (
        <div>
          <label className="block text-sm font-medium text-[#0f172a]">Adresse physique complète</label>
          <textarea
            value={data.physicalAddress}
            onChange={(e) => onChange({ physicalAddress: e.target.value })}
            placeholder="Ex: Centre de conférences de Cotonou, 123 Avenue de la Paix..."
            rows={3}
            className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          />
        </div>
      )}

      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <Calendar className="h-5 w-5 text-[#7126b6]" />
          <h4 className="text-sm font-medium text-[#0f172a]">Catégories de billets</h4>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Créez des tarifs différenciés (Standard, VIP, VVIP)
        </p>
        {data.ticketCategories.length > 0 && (
          <div className="mt-3 space-y-2">
            {data.ticketCategories.map((cat, i) => (
              <div key={i} className="rounded-lg bg-gray-50 p-3 space-y-2 sm:space-y-0 sm:flex sm:items-center sm:gap-2">
                <input
                  type="text"
                  value={cat.name}
                  onChange={(e) => {
                    const updated = data.ticketCategories.map((tc, ti) =>
                      ti === i ? { ...tc, name: e.target.value } : tc
                    )
                    onChange({ ticketCategories: updated })
                  }}
                  placeholder="Nom (ex: Standard, VIP)"
                  className="w-full sm:flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:border-[#7126b6] focus:outline-none"
                />
                <div className="flex gap-2">
                  <input
                    type="number"
                    value={cat.price || ""}
                    onChange={(e) => {
                      const updated = data.ticketCategories.map((tc, ti) =>
                        ti === i ? { ...tc, price: Number(e.target.value) } : tc
                      )
                      onChange({ ticketCategories: updated })
                    }}
                    placeholder="Prix"
                    min={0}
                    className="w-full sm:w-24 rounded border border-gray-200 px-2 py-1 text-sm focus:border-[#7126b6] focus:outline-none"
                  />
                  <input
                    type="number"
                    value={cat.seats || ""}
                    onChange={(e) => {
                      const updated = data.ticketCategories.map((tc, ti) =>
                        ti === i ? { ...tc, seats: Number(e.target.value) } : tc
                      )
                      onChange({ ticketCategories: updated })
                    }}
                    placeholder="Places"
                    min={0}
                    className="w-full sm:w-20 rounded border border-gray-200 px-2 py-1 text-sm focus:border-[#7126b6] focus:outline-none"
                  />
                  <button
                    onClick={() => {
                      const updated = data.ticketCategories.filter((_, ti) => ti !== i)
                      onChange({ ticketCategories: updated })
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
            onChange({
              ticketCategories: [...data.ticketCategories, { name: "", price: 0, seats: 0 }],
            })
          }}
          className="mt-3 flex items-center gap-2 text-sm text-[#7126b6] hover:underline"
        >
          <Plus className="h-4 w-4" /> Ajouter une catégorie de billet
        </button>
      </div>
    </div>
  )
}

function Lock({ className }: { className?: string }) {
  return (
    <svg className={className} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2"/>
      <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
    </svg>
  )
}
