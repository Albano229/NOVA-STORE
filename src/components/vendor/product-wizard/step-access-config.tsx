"use client"

import { WizardData } from "@/types/product"
import { SUBSCRIPTION_INTERVALS } from "@/types/product"
import { Crown, Users, Lock, Link as LinkIcon } from "lucide-react"

interface StepAccessConfigProps {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
}

export default function StepAccessConfig({ data, onChange }: StepAccessConfigProps) {
  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">Plan d&apos;Adhésion & Accès</h2>
        <p className="mt-1 text-sm text-gray-500">
          Configurez le type d&apos;accès et les options d&apos;adhésion
        </p>
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-medium text-[#0f172a]">Type d&apos;accès</label>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {[
            { value: "free", label: "Gratuit", icon: "🎉", desc: "Accès libre" },
            { value: "paid", label: "Payant", icon: "💰", desc: "Paiement unique" },
            { value: "subscription", label: "Abonnement", icon: "🔄", desc: "Recurrent" },
            { value: "invitation", label: "Sur invitation", icon: "✉️", desc: "Accès restreint" },
          ].map((opt) => (
            <button
              key={opt.value}
              onClick={() => onChange({ accessType: opt.value })}
              className={`rounded-xl border-2 p-4 text-left transition ${
                data.accessType === opt.value
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

      {data.accessType === "subscription" && (
        <div className="rounded-xl border border-[#7126b6] bg-purple-50 p-5">
          <div className="flex items-center gap-2">
            <Crown className="h-5 w-5 text-[#7126b6]" />
            <h4 className="text-sm font-medium text-[#0f172a]">Configuration de l&apos;abonnement</h4>
          </div>
          <div className="mt-4 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div>
              <label className="block text-xs text-gray-500">Prix de l&apos;abonnement</label>
              <input
                type="number"
                value={data.subscriptionPrice || ""}
                onChange={(e) => onChange({ subscriptionPrice: Number(e.target.value) })}
                placeholder="0"
                min={0}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none"
              />
            </div>
            <div>
              <label className="block text-xs text-gray-500">Fréquence</label>
              <select
                value={data.subscriptionInterval}
                onChange={(e) => onChange({ subscriptionInterval: e.target.value })}
                className="mt-1 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none"
              >
                {SUBSCRIPTION_INTERVALS.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <label className="block text-sm font-medium text-[#0f172a]">
          Instructions d&apos;intégration (après paiement)
        </label>
        <p className="text-xs text-gray-400">
          Liens d&apos;invitation vers le canal privé WhatsApp, Telegram ou Discord.
        </p>
        <div className="flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <Lock className="h-4 w-4" />
          Contenu visible uniquement après paiement confirmé
        </div>
        <textarea
          value={data.integrationInstructions}
          onChange={(e) => onChange({ integrationInstructions: e.target.value })}
          placeholder={"Ex: Lien d'invitation WhatsApp : https://chat.whatsapp.com/...\nLien Discord : https://discord.gg/..."}
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
        />
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={() => onChange({ privateAccess: !data.privateAccess })}
          className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
            data.privateAccess ? "bg-[#7126b6]" : "bg-gray-300"
          }`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition ${
            data.privateAccess ? "translate-x-6" : "translate-x-1"
          }`} />
        </button>
        <div>
          <span className="text-sm text-gray-700">Accès privé (sur invitation uniquement)</span>
          <p className="text-xs text-gray-400">Le contenu n&apos;est visible que pour les membres approuvés</p>
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-[#0f172a]">
          Description de la communauté
        </label>
        <textarea
          value={data.communityInfo}
          onChange={(e) => onChange({ communityInfo: e.target.value })}
          placeholder="Objectifs du groupe, charte de bonne conduite, avantages des membres..."
          rows={4}
          className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
        />
      </div>
    </div>
  )
}
