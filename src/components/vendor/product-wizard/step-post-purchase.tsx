"use client"

import { WizardData } from "@/types/product"
import dynamic from "next/dynamic"
import { Shield, Lock } from "lucide-react"

const QuillEditor = dynamic(() => import("@/components/ui/quill-editor"), { ssr: false })

interface StepPostPurchaseProps {
  data: WizardData
  onChange: (updates: Partial<WizardData>) => void
  productType: string | null
}

export default function StepPostPurchase({ data, onChange, productType }: StepPostPurchaseProps) {
  const title = productType === "DIGITAL"
    ? "Expérience Post-Achat & Instructions"
    : productType === "COMMUNITY"
      ? "Instructions d'Intégration"
      : productType === "RESERVATION"
        ? "Instructions d'Accès Post-Achat"
        : "Instructions Post-Achat"

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-lg font-semibold text-[#0f172a]">{title}</h2>
        <p className="mt-1 text-sm text-gray-500">
          Ces informations sont confidentielles et ne seront révélées qu&apos;après validation du paiement.
        </p>
        <div className="mt-2 flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-700">
          <Lock className="h-4 w-4" />
          Contenu sécurisé — visible uniquement après paiement confirmé
        </div>
      </div>

      {productType === "DIGITAL" && (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-[#0f172a]">Limite du nombre de téléchargements par client</label>
            <input
              type="number"
              value={data.maxDownloads || ""}
              onChange={(e) => onChange({ maxDownloads: Number(e.target.value) })}
              placeholder="0 = illimité"
              min={0}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-[#0f172a]">Date d&apos;expiration du lien de téléchargement</label>
            <input
              type="datetime-local"
              value={data.accessDuration}
              onChange={(e) => onChange({ accessDuration: e.target.value })}
              className="mt-1 w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
            <p className="mt-1 text-xs text-gray-400">Laisser vide pour un accès permanent</p>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <label className="block text-sm font-medium text-[#0f172a]">
          {productType === "DIGITAL"
            ? "Instructions secrètes après achat"
            : productType === "COMMUNITY"
              ? "Message secret & Instructions d'intégration"
              : productType === "RESERVATION"
                ? "Instructions d'accès (lien Zoom, code d'accès, ticket PDF)"
                : "Instructions post-achat"}
        </label>
        <p className="text-xs text-gray-400">
          {productType === "DIGITAL"
            ? "Écrivez les consignes qui s'afficheront sur l'écran de remerciement et dans l'email de confirmation."
            : productType === "COMMUNITY"
              ? "Liens d'invitation uniques vers le canal privé WhatsApp, Telegram ou Discord."
              : productType === "RESERVATION"
                ? "Code d'accès, lien de réunion en ligne ou ticket PDF délivré après paiement."
                : "Instructions affichées uniquement après le paiement validé."}
        </p>
        <div className="mt-2 rounded-lg border border-gray-200 bg-gray-50 p-1">
          <QuillEditor
            value={data.postPurchaseQuill}
            onChange={(val: string) => onChange({ postPurchaseQuill: val })}
            placeholder="Ex: Merci pour votre achat ! Étape 1 : ... Étape 2 : ..."
          />
        </div>
      </div>

      {productType === "SERVICE" && (
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 p-5">
            <h4 className="text-sm font-medium text-[#0f172a]">Questionnaire obligatoire post-achat</h4>
            <p className="mt-1 text-xs text-gray-500">
              Le client devra soumettre ses documents ou consignes après le paiement.
            </p>
            {data.requirementQuestions.length > 0 && (
              <div className="mt-3 space-y-2">
                {data.requirementQuestions.map((q, i) => (
                  <div key={i} className="flex items-center gap-2 rounded-lg bg-gray-50 p-3">
                    <span className="text-xs text-gray-500">{i + 1}.</span>
                    <input
                      type="text"
                      value={q.label}
                      onChange={(e) => {
                        const updated = data.requirementQuestions.map((rq, ri) =>
                          ri === i ? { ...rq, label: e.target.value } : rq
                        )
                        onChange({ requirementQuestions: updated })
                      }}
                      placeholder="Question (ex: Décrivez votre projet)"
                      className="flex-1 rounded border border-gray-200 px-2 py-1 text-sm focus:border-[#7126b6] focus:outline-none"
                    />
                    <select
                      value={q.type}
                      onChange={(e) => {
                        const updated = data.requirementQuestions.map((rq, ri) =>
                          ri === i ? { ...rq, type: e.target.value as "text" | "file" } : rq
                        )
                        onChange({ requirementQuestions: updated })
                      }}
                      className="rounded border border-gray-200 px-2 py-1 text-xs"
                    >
                      <option value="text">Texte</option>
                      <option value="file">Fichier</option>
                    </select>
                    <button
                      onClick={() => {
                        const updated = data.requirementQuestions.filter((_, ri) => ri !== i)
                        onChange({ requirementQuestions: updated })
                      }}
                      className="text-xs text-red-500 hover:text-red-700"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
            <button
              onClick={() => {
                onChange({
                  requirementQuestions: [...data.requirementQuestions, { label: "", type: "text", required: true }],
                })
              }}
              className="mt-3 flex items-center gap-2 text-sm text-[#7126b6] hover:underline"
            >
              + Ajouter une question
            </button>
          </div>
        </div>
      )}

      <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-green-600" />
          <span className="text-sm font-medium text-[#0f172a]">Sécurité</span>
        </div>
        <p className="mt-1 text-xs text-gray-500">
          Le contenu saisi ici est stocké de manière sécurisée et ne sera révélé qu&apos;une fois la commande marquée comme &quot;Payé&quot; dans la base de données.
        </p>
      </div>
    </div>
  )
}
