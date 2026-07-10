"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { ArrowLeft, ArrowRight, Save, Send } from "lucide-react"
import { WizardData, INITIAL_WIZARD_DATA, getStepsForType, STEP_LABELS, STEP_ICONS } from "@/types/product"
import StepType from "@/components/vendor/product-wizard/step-type"
import StepGeneral from "@/components/vendor/product-wizard/step-general"
import StepMediaBanner from "@/components/vendor/product-wizard/step-media-banner"
import StepPricingMarketing from "@/components/vendor/product-wizard/step-pricing-marketing"
import StepLogistics from "@/components/vendor/product-wizard/step-logistics"
import StepFilesVisuals from "@/components/vendor/product-wizard/step-files-visuals"
import StepPostPurchase from "@/components/vendor/product-wizard/step-post-purchase"
import StepRequirements from "@/components/vendor/product-wizard/step-requirements"
import StepAccessConfig from "@/components/vendor/product-wizard/step-access-config"
import StepBundleSelection from "@/components/vendor/product-wizard/step-bundle-selection"
import StepPlanningVenue from "@/components/vendor/product-wizard/step-planning-venue"
import StepSeo from "@/components/vendor/product-wizard/step-seo"
import StepFaq from "@/components/vendor/product-wizard/step-faq"
import StepPreview from "@/components/vendor/product-wizard/step-preview"
import StepSidebar from "@/components/vendor/product-wizard/step-sidebar"
import { useWorkspace } from "@/contexts/workspace-context"
import toast from "react-hot-toast"

export default function NewProductPage() {
  const router = useRouter()
  const { currentShop } = useWorkspace()
  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [createdProductId, setCreatedProductId] = useState<string | undefined>()

  const steps = getStepsForType(data.productType)
  const currentIndex = steps.indexOf(data.step)

  const update = useCallback((updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  useEffect(() => {
    localStorage.removeItem("nova-wizard-draft")
    setData(INITIAL_WIZARD_DATA)
  }, [])

  useEffect(() => {
    const timer = setInterval(() => {
      localStorage.setItem("nova-wizard-draft", JSON.stringify(data))
    }, 30000)
    return () => clearInterval(timer)
  }, [data])

  const canGoNext = (): boolean => {
    if (data.step === "type") return !!data.productType
    return true
  }

  const goNext = () => {
    if (!canGoNext()) {
      toast.error("Veuillez sélectionner une option")
      return
    }
    const nextIndex = currentIndex + 1
    if (nextIndex < steps.length) {
      update({ step: steps[nextIndex] })
    }
  }

  const validateAllSteps = (): string[] => {
    const errors: string[] = []

    if (!data.productType) errors.push("Le type de produit est obligatoire")
    if (!data.name?.trim()) errors.push("Le nom du produit est obligatoire")
    if (!data.categoryId) errors.push("La catégorie est obligatoire")
    if (!data.shortDescription?.trim()) errors.push("La courte description est obligatoire")
    if (!data.priceType) errors.push("Le type de facturation est obligatoire")
    if (data.priceType !== "free" && (!data.price || data.price <= 0)) {
      errors.push("Le prix de vente est obligatoire")
    }

    return errors
  }

  const goPrev = () => {
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      update({ step: steps[prevIndex] })
    }
  }

  const handleSubmit = async (asDraft: boolean) => {
    if (!asDraft) {
      const validationErrors = validateAllSteps()
      if (validationErrors.length > 0) {
        validationErrors.forEach((err) => toast.error(err))
        return
      }
    }

    setIsSubmitting(true)
    try {
      const payload = {
        ...data,
        status: asDraft ? "draft" : "published",
        isActive: !asDraft,
        shopId: currentShop?.id,
      }
      const res = await fetch("/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const json = await res.json()

      if (!res.ok) {
        console.error("[PRODUCT_CREATE_ERROR]", {
          status: res.status,
          error: json.error,
          details: json.details,
          payload: { name: data.name, productType: data.productType, priceType: data.priceType },
        })
        throw new Error(json.error || json.details || "Erreur lors de la création du produit")
      }

      setCreatedProductId(json.id)
      localStorage.removeItem("nova-wizard-draft")
      toast.success(asDraft ? "Brouillon enregistré !" : "Produit publié avec succès !")
      router.push("/vendor/products")
    } catch (error) {
      console.error("[PRODUCT_CREATE_ERROR]", error)
      toast.error(error instanceof Error ? error.message : "Erreur lors de la création du produit")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (data.step) {
      case "type":
        return <StepType data={data} onChange={update} />
      case "general":
        return <StepGeneral data={data} onChange={update} />
      case "media-banner":
        return <StepMediaBanner data={data} onChange={update} productType={data.productType} />
      case "pricing-marketing":
        return <StepPricingMarketing data={data} onChange={update} productType={data.productType} />
      case "logistics":
        return <StepLogistics data={data} onChange={update} />
      case "files-visuals":
        return <StepFilesVisuals data={data} onChange={update} />
      case "post-purchase":
        return <StepPostPurchase data={data} onChange={update} productType={data.productType} />
      case "requirements":
        return <StepRequirements data={data} onChange={update} />
      case "access-config":
        return <StepAccessConfig data={data} onChange={update} />
      case "bundle-selection":
        return <StepBundleSelection data={data} onChange={update} />
      case "planning-venue":
        return <StepPlanningVenue data={data} onChange={update} />
      case "seo":
        return <StepSeo data={data} onChange={update} productId={createdProductId} />
      case "faq":
        return <StepFaq data={data} onChange={update} />
      case "preview":
        return <StepPreview data={data} onStepClick={(step) => update({ step })} />
      default:
        return null
    }
  }

  const isPreview = data.step === "preview"
  const isFirstStep = currentIndex === 0

  return (
    <div className="bg-gray-50 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0f172a]">Créer un produit</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data.productType ? `Type : ${data.productType}` : "Sélectionnez le type de produit"}
          </p>
        </div>

        <div className="flex gap-8 overflow-hidden">
          <div className="hidden w-64 flex-shrink-0 lg:block">
            <StepSidebar
              steps={steps}
              currentStep={data.step}
              onStepClick={(step) => update({ step })}
              labels={STEP_LABELS}
              icons={STEP_ICONS}
            />
          </div>

          <div className="flex-1 min-w-0">
            <div className="mb-4 lg:hidden">
              <div className="flex items-center justify-between text-xs text-gray-500 mb-2">
                <span className="font-medium truncate">{STEP_LABELS[data.step] || data.step}</span>
                <span className="flex-shrink-0 ml-2">{currentIndex + 1}/{steps.length}</span>
              </div>
              <div className="h-1.5 rounded-full bg-gray-200 overflow-hidden">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#7126b6] to-purple-500 transition-all duration-300"
                  style={{ width: `${((currentIndex + 1) / steps.length) * 100}%` }}
                />
              </div>
              <div className="mt-3 flex gap-2 overflow-x-auto pb-2 px-1 snap-x snap-mandatory scrollbar-hide">
                {steps.map((step, i) => {
                  const isActive = data.step === step
                  const isCompleted = i < currentIndex
                  return (
                    <button
                      key={step}
                      onClick={() => update({ step })}
                      className={`flex-shrink-0 snap-center flex items-center justify-center h-9 w-9 rounded-full text-xs font-bold transition-all duration-200 ${
                        isActive
                          ? "bg-[#7126b6] text-white ring-4 ring-purple-200 scale-110"
                          : isCompleted
                            ? "bg-[#7126b6] text-white"
                            : "bg-gray-100 text-gray-400"
                      }`}
                    >
                      {isCompleted ? (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        i + 1
                      )}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="rounded-2xl border border-gray-200 bg-white p-4 shadow-sm sm:p-6 overflow-hidden">
              {renderStep()}
            </div>

            <div className="mt-6 flex flex-wrap items-center justify-between gap-3">
              <button
                onClick={goPrev}
                disabled={isFirstStep}
                className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed sm:px-4"
              >
                <ArrowLeft className="h-4 w-4" />
                Précédent
              </button>

              <div className="flex items-center gap-2 sm:gap-3">
                <button
                  onClick={() => handleSubmit(true)}
                  disabled={isSubmitting}
                  className="flex items-center gap-2 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50 disabled:opacity-50 sm:px-4"
                >
                  <Save className="h-4 w-4" />
                  Brouillon
                </button>

                {isPreview ? (
                  <button
                    onClick={() => handleSubmit(false)}
                    disabled={isSubmitting}
                    className="flex items-center gap-2 rounded-lg bg-[#7126b6] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#5e1f9a] disabled:opacity-50 sm:px-6"
                  >
                    <Send className="h-4 w-4" />
                    {isSubmitting ? "Publication..." : "Publier"}
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    disabled={!canGoNext()}
                    className="flex items-center gap-2 rounded-lg bg-[#7126b6] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#5e1f9a] disabled:opacity-50 disabled:cursor-not-allowed sm:px-6"
                  >
                    Suivant
                    <ArrowRight className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

    </div>
  )
}
