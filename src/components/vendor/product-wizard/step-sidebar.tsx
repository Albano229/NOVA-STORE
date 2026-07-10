"use client"

import { Layers, FileText, Image, Tag, Truck, Package, CheckCircle, ClipboardList, KeyRound, Boxes, MapPin, Search, Eye } from "lucide-react"

const ICON_MAP: Record<string, any> = {
  Layers, FileText, Image, Tag, Truck, Package, CheckCircle, ClipboardList, KeyRound, Boxes, MapPin, Search, Eye,
}

interface StepSidebarProps {
  steps: string[]
  currentStep: string
  onStepClick: (step: string) => void
  labels: Record<string, string>
  icons: Record<string, string>
}

export default function StepSidebar({ steps, currentStep, onStepClick, labels, icons }: StepSidebarProps) {
  const currentIdx = steps.indexOf(currentStep)

  return (
    <div className="sticky top-6">
      <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm">
        <div className="space-y-1">
          {steps.map((step, i) => {
            const IconComp = ICON_MAP[icons[step]] || Layers
            const isActive = step === currentStep
            const isCompleted = i < currentIdx

            return (
              <button
                key={step}
                onClick={() => onStepClick(step)}
                className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition ${
                  isActive
                    ? "bg-[#7126b6] text-white font-medium"
                    : isCompleted
                      ? "text-green-600 hover:bg-green-50"
                      : "text-gray-500 hover:bg-gray-50"
                }`}
              >
                <div className={`flex h-7 w-7 items-center justify-center rounded-lg ${
                  isActive
                    ? "bg-white/20"
                    : isCompleted
                      ? "bg-green-100"
                      : "bg-gray-100"
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-4 w-4" />
                  ) : (
                    <IconComp className="h-4 w-4" />
                  )}
                </div>
                <span>{labels[step] || step}</span>
              </button>
            )
          })}
        </div>

        <div className="mt-4 pt-4 border-t border-gray-100">
          <div className="flex items-center justify-between text-xs text-gray-400">
            <span>Progression</span>
            <span>{currentIdx + 1}/{steps.length}</span>
          </div>
          <div className="mt-2 h-2 rounded-full bg-gray-100">
            <div
              className="h-full rounded-full bg-[#7126b6] transition-all duration-300"
              style={{ width: `${((currentIdx + 1) / steps.length) * 100}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  )
}
