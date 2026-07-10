"use client"

import { WizardData, VariantOption } from "@/types/product"
import { CURRENCIES, CTA_COLORS } from "@/types/product"
import { Tag, Percent, Eye, EyeOff, Clock, Truck } from "lucide-react"
import { useState } from "react"
import { useI18n } from "@/i18n/context"
import { getCtaOptions } from "@/lib/cta-options"
import VariantManager from "./VariantManager"

interface StepPricingMarketingProps {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
  productType: string | null
}

export default function StepPricingMarketing({ data, onChange, productType }: StepPricingMarketingProps) {
  const [showCountdown, setShowCountdown] = useState(data.countdownEnabled)
  const isPhysicalOrBundle = productType === "PHYSICAL" || productType === "BUNDLE"
  const { t } = useI18n()
  const CTA_OPTIONS = getCtaOptions(t)

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">Prix, Marketing & Visibilité</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configurez la tarification, les promotions et la visibilité sur la boutique
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-[#0f172a]">Type de facturation</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            { value: "free", label: "Gratuit", icon: "🎉", desc: "Sans frais" },
            { value: "fixed", label: "Prix Fixe", icon: "💰", desc: "Un seul tarif" },
            { value: "variable", label: "Prix Variable", icon: "📊", desc: "Déclinaisons" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ priceType: opt.value as any })}
              className={`rounded-xl border-2 p-4 text-left transition ${
                data.priceType === opt.value
                  ? "border-[#7126b6] bg-purple-50"
                  : "border-gray-200 hover:border-gray-300"
              }`}
            >
              <div className="text-2xl">{opt.icon}</div>
              <div className="mt-2 text-sm font-medium">{opt.label}</div>
              <div className="text-xs text-gray-500">{opt.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {data.priceType === "free" && (
        <div className="rounded-xl border border-green-200 bg-green-50 p-6 text-center">
          <div className="text-4xl">🎉</div>
          <h3 className="mt-2 text-lg font-semibold text-green-800">Produit Gratuit</h3>
          <p className="text-sm text-green-600">Les champs de prix sont désactivés. Le produit sera disponible gratuitement.</p>
        </div>
      )}

      {data.priceType === "fixed" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0f172a]">Prix de vente actuel</label>
            <div className="mt-1 flex gap-2">
              <input
                type="number"
                value={data.price || ""}
                onChange={(e) => onChange({ price: Number(e.target.value) })}
                placeholder="0"
                min={0}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
              />
              <select
                value={data.currency}
                onChange={(e) => onChange({ currency: e.target.value })}
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
              >
                {CURRENCIES.map((c) => (
                  <option key={c.code} value={c.code}>{c.symbol} — {c.name}</option>
                ))}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0f172a]">Prix barré / d&apos;origine (optionnel)</label>
            <p className="text-xs text-gray-400">Pour afficher une réduction visuelle sur la boutique</p>
            <input
              type="number"
              value={data.comparePrice || ""}
              onChange={(e) => onChange({ comparePrice: Number(e.target.value) })}
              placeholder="0"
              min={0}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
            {data.comparePrice > data.price && data.price > 0 && (
              <p className="mt-1 text-sm font-medium text-green-600">
                Réduction : -{Math.round(((data.comparePrice - data.price) / data.comparePrice) * 100)}%
              </p>
            )}
          </div>
        </div>
      )}

      {data.priceType === "variable" && (
        <VariantManager
          options={(data.variantOptions as VariantOption[]) || []}
          variants={data.variants}
          onOptionsChange={(opts) => onChange({ variantOptions: opts } as any)}
          onVariantsChange={(variants) => onChange({ variants })}
          isPhysical={isPhysicalOrBundle}
          currency={data.currency}
        />
      )}

      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <Percent className="h-5 w-5 text-[#7126b6]" />
          <div>
            <h4 className="text-sm font-medium text-[#0f172a]">Réduction Automatique (Smart Discount)</h4>
            <p className="text-xs text-gray-500">Offrir une réduction quand le client achète plus</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => onChange({ autoDiscount: !data.autoDiscount })}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              data.autoDiscount ? "bg-[#7126b6]" : "bg-gray-300"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              data.autoDiscount ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
          <span className="text-sm text-gray-700">Activer les réductions sur la quantité</span>
        </div>
        {data.autoDiscount && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500">Si le client achète (unités)</label>
              <input
                type="number"
                value={data.salesLimit || ""}
                onChange={(e) => onChange({ salesLimit: Number(e.target.value) })}
                placeholder="Ex: 3"
                min={1}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Réduction (%)</label>
              <input
                type="number"
                value={data.autoDiscountValue || ""}
                onChange={(e) => onChange({ autoDiscountValue: Number(e.target.value) })}
                placeholder="Ex: 10"
                min={1}
                max={100}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <Clock className="h-5 w-5 text-[#7126b6]" />
          <div>
            <h4 className="text-sm font-medium text-[#0f172a]">Compte à Rebours (Urgence Marketing / FOMO)</h4>
            <p className="text-xs text-gray-500">Planifier une promotion avec date de début et de fin</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          <button
            onClick={() => {
              setShowCountdown(!showCountdown)
              onChange({ countdownEnabled: !data.countdownEnabled })
            }}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              data.countdownEnabled ? "bg-[#7126b6]" : "bg-gray-300"
            }`}
          >
            <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
              data.countdownEnabled ? "translate-x-6" : "translate-x-1"
            }`} />
          </button>
          <span className="text-sm text-gray-700">Activer le compte à rebours</span>
        </div>
        {data.countdownEnabled && (
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500">Début de la promotion</label>
              <input
                type="datetime-local"
                value={data.countdownStartDate}
                onChange={(e) => onChange({ countdownStartDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Fin de la promotion</label>
              <input
                type="datetime-local"
                value={data.countdownEndDate}
                onChange={(e) => onChange({ countdownEndDate: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none"
              />
            </div>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <Tag className="h-5 w-5 text-[#7126b6]" />
          <h4 className="text-sm font-medium text-[#0f172a]">Texte du Bouton d&apos;Appel à l&apos;Action (CTA)</h4>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Personnalisez le texte du bouton d&apos;achat affiché sur la boutique.
        </p>
        <div className="mt-3 space-y-2">
          <select
            value={CTA_OPTIONS.find((o) => o.value === data.ctaText) ? data.ctaText : "__custom__"}
            onChange={(e) => {
              if (e.target.value !== "__custom__") {
                onChange({ ctaText: e.target.value })
              } else {
                onChange({ ctaText: "" })
              }
            }}
            className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
          >
            <option value="__custom__">✏️ Personnalisé...</option>
            {Object.entries(CTA_OPTIONS.reduce((acc, opt) => {
              if (!acc[opt.category]) acc[opt.category] = []
              acc[opt.category].push(opt)
              return acc
            }, {} as Record<string, typeof CTA_OPTIONS>)).map(([category, options]) => (
              <optgroup key={category} label={category}>
                {options.map((opt) => (
                  <option key={opt.value} value={opt.value}>
                    {opt.icon} {opt.label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          {(!CTA_OPTIONS.find((o) => o.value === data.ctaText) && data.ctaText !== "") || !CTA_OPTIONS.find((o) => o.value === data.ctaText) ? (
            <input
              type="text"
              value={data.ctaText}
              onChange={(e) => onChange({ ctaText: e.target.value })}
              placeholder="Texte personnalisé du bouton..."
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          ) : null}
        </div>
        {data.ctaText && (
          <div className="mt-3 rounded-lg border border-gray-200 bg-gray-50 p-3">
            <p className="text-xs text-gray-500">Aperçu du bouton :</p>
            <button
              className="mt-2 rounded-lg px-5 py-2.5 text-sm font-semibold text-white transition"
              style={{ backgroundColor: data.ctaColor }}
              onClick={(e) => e.preventDefault()}
            >
              {data.ctaText}
            </button>
          </div>
        )}
        <div className="mt-3">
          <label className="block text-xs text-gray-500">Couleur du bouton</label>
          <div className="mt-2 flex flex-wrap gap-2">
            {CTA_COLORS.map((c) => (
              <button
                key={c.value}
                onClick={() => onChange({ ctaColor: c.value })}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  data.ctaColor === c.value ? "border-[#0f172a] scale-110" : "border-gray-200"
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          {data.hideFromStore ? <EyeOff className="h-5 w-5 text-amber-500" /> : <Eye className="h-5 w-5 text-green-500" />}
          <h4 className="text-sm font-medium text-[#0f172a]">Visibilité & Publication</h4>
        </div>
        <div className="mt-4 space-y-3">
          <label className={`flex items-center gap-3 rounded-lg border p-3 transition cursor-pointer ${
            !data.hideFromStore ? "border-green-300 bg-green-50" : "border-gray-200 hover:bg-gray-50"
          }`}>
            <input
              type="radio"
              name="visibility"
              checked={!data.hideFromStore}
              onChange={() => onChange({ hideFromStore: false })}
              className="text-green-600 focus:ring-green-500"
            />
            <div>
              <div className="text-sm font-medium text-[#0f172a]">Publier immédiatement</div>
              <div className="text-xs text-gray-500">Visible par tout le monde sur NOVA Store</div>
            </div>
          </label>
          <label className={`flex items-center gap-3 rounded-lg border p-3 transition cursor-pointer ${
            data.hideFromStore ? "border-amber-300 bg-amber-50" : "border-gray-200 hover:bg-gray-50"
          }`}>
            <input
              type="radio"
              name="visibility"
              checked={data.hideFromStore}
              onChange={() => onChange({ hideFromStore: true })}
              className="text-amber-600 focus:ring-amber-500"
            />
            <div>
              <div className="text-sm font-medium text-[#0f172a]">Masqué sur la boutique / Lien privé</div>
              <div className="text-xs text-gray-500">
                Le produit n&apos;apparaît ni dans les recherches ni dans les catégories.
                Accessible uniquement via son URL.
              </div>
            </div>
          </label>
        </div>
      </div>
      <div className="rounded-xl border border-gray-200 p-5">
        <div className="flex items-center gap-3">
          <Truck className="h-5 w-5 text-[#7126b6]" />
          <div>
            <h4 className="text-sm font-medium text-[#0f172a]">Adresse de livraison</h4>
            <p className="text-xs text-gray-500">Le client doit-il fournir une adresse pour cette commande ?</p>
          </div>
        </div>
        <div className="mt-4 flex items-center gap-3">
          {isPhysicalOrBundle ? (
            <span className="relative inline-flex h-6 w-11 items-center rounded-full bg-[#7126b6] opacity-60">
              <span className="inline-block h-4 w-4 translate-x-6 transform rounded-full bg-white" />
            </span>
          ) : (
            <button
              onClick={() => onChange({ requiresShippingAddress: data.requiresShippingAddress === false ? true : false })}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
                data.requiresShippingAddress !== false ? "bg-[#7126b6]" : "bg-gray-300"
              }`}
            >
              <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
                data.requiresShippingAddress !== false ? "translate-x-6" : "translate-x-1"
              }`} />
            </button>
          )}
          <span className="text-sm text-gray-700">
            {isPhysicalOrBundle
              ? "Obligatoire pour les produits physiques"
              : data.requiresShippingAddress !== false
                ? "Adresse requise"
                : "Pas d'adresse requise"}
          </span>
        </div>
        {data.requiresShippingAddress === false && !isPhysicalOrBundle && (
          <p className="mt-2 text-xs text-gray-400">
            Utile pour les produits numériques, services ou communautés où aucune livraison physique n&apos;est nécessaire.
          </p>
        )}
      </div>
    </div>
  )
}
