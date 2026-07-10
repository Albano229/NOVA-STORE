"use client"

import { type WizardData, type FaqItem } from "@/types/product"
import { Plus, Trash2, HelpCircle } from "lucide-react"

interface Props {
  data: WizardData
  onChange: (d: Partial<WizardData>) => void
}

export default function StepFaq({ data, onChange }: Props) {
  const addFaq = () => {
    onChange({ faqItems: [...data.faqItems, { question: "", answer: "" }] })
  }

  const removeFaq = (idx: number) => {
    onChange({ faqItems: data.faqItems.filter((_, i) => i !== idx) })
  }

  const updateFaq = (idx: number, field: keyof FaqItem, value: string) => {
    const updated = [...data.faqItems]
    updated[idx] = { ...updated[idx], [field]: value }
    onChange({ faqItems: updated })
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100">FAQ</h2>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Ajoutez des questions fréquentes pour vos clients</p>
      </div>

      <div className="space-y-4">
        {data.faqItems.map((faq, idx) => (
          <div key={idx} className="rounded-xl border border-gray-200 p-4 dark:border-gray-700">
            <div className="mb-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <HelpCircle className="h-4 w-4 text-[#7126b6]" />
                <span className="text-sm font-medium text-gray-900 dark:text-gray-100">Question {idx + 1}</span>
              </div>
              <button onClick={() => removeFaq(idx)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              value={faq.question}
              onChange={(e) => updateFaq(idx, "question", e.target.value)}
              placeholder="Question..."
              className="mb-2 w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none dark:border-gray-600"
            />
            <textarea
              value={faq.answer}
              onChange={(e) => updateFaq(idx, "answer", e.target.value)}
              placeholder="Réponse..."
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-[#7126b6] focus:outline-none dark:border-gray-600"
            />
          </div>
        ))}

        <button
          onClick={addFaq}
          className="w-full rounded-xl border-2 border-dashed border-gray-300 py-3 text-sm font-medium text-gray-600 hover:border-[#7126b6] hover:text-[#7126b6] dark:border-gray-600 dark:text-gray-400"
        >
          <Plus className="mr-1 inline h-4 w-4" />
          Ajouter une question
        </button>
      </div>
    </div>
  )
}
