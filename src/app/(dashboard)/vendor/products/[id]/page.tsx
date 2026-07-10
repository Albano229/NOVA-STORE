"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter, useParams } from "next/navigation"
import { ArrowLeft, ArrowRight, Save, Send, Loader2 } from "lucide-react"
import { WizardData, INITIAL_WIZARD_DATA, getStepsForType, STEP_LABELS, STEP_ICONS } from "@/types/product"
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
import toast from "react-hot-toast"

function mapProductToWizard(raw: any): WizardData {
  const digitalFile = raw.digitalFile || {}
  const physicalOpt = raw.physicalOpt || {}
  const images = Array.isArray(raw.images)
    ? raw.images.map((img: any) => ({ url: img.url, alt: img.alt || "", position: img.position || 0 }))
    : []

  return {
    ...INITIAL_WIZARD_DATA,
    productType: raw.productType,
    name: raw.name || "",
    shortDescription: raw.shortDescription || "",
    categoryId: raw.categoryId || "",
    subcategoryId: raw.subcategoryId || "",
    price: raw.price || 0,
    comparePrice: raw.comparePrice || 0,
    currency: raw.currency || "XOF",
    brand: raw.brand || "",
    sku: raw.sku || "",
    description: raw.description || "",
    bannerUrl: raw.bannerUrl || "",
    images,
    videoUrl: raw.videoUrl || "",
    stock: raw.stock || 0,
    lowStockAlert: raw.lowStockAlert || 5,
    weight: raw.weight || 0,
    dimensions: raw.dimensions || "",
    variants: raw.variants || [],
    variantOptions: raw.variantOptions || [],
    shippingEnabled: physicalOpt.shippingEnabled ?? true,
    shippingCost: physicalOpt.shippingCost || 0,
    shippingCountries: physicalOpt.shippingCountries || [],
    preparationDelay: raw.preparationDelay || "immediate",
    collectDeliveryAddress: raw.collectDeliveryAddress || false,
    carriers: raw.carriers || [],
    fileUrl: digitalFile.fileUrl || raw.fileUrl || "",
    externalUrl: digitalFile.externalUrl || raw.externalUrl || "",
    fileName: digitalFile.fileName || raw.fileName || "",
    fileSize: digitalFile.fileSize || raw.fileSize || 0,
    fileType: digitalFile.fileType || raw.fileType || "",
    storagePath: raw.storagePath || "",
    storageBucket: raw.storageBucket || "",
    maxDownloads: digitalFile.maxDownloads || raw.maxDownloads || 0,
    version: raw.version || "",
    accessDuration: raw.accessDuration || "",
    accessType: raw.accessType || "lifetime",
    duration: raw.duration || "",
    availability: raw.availability || "",
    locationType: raw.locationType || "online",
    clientForm: raw.clientForm || "",
    zone: raw.zone || "",
    deliveryDelay: raw.deliveryDelay || "",
    paidOptions: raw.paidOptions || [],
    isSubscription: raw.isSubscription || false,
    subscriptionPrice: raw.subscriptionPrice || 0,
    subscriptionInterval: raw.subscriptionInterval || "monthly",
    privateAccess: raw.privateAccess || false,
    communityInfo: raw.communityInfo || "",
    communityBannerUrl: raw.communityBannerUrl || "",
    communityLogoUrl: raw.communityLogoUrl || "",
    integrationInstructions: raw.integrationInstructions || "",
    bundleProducts: raw.bundleProducts || [],
    bundleDiscount: raw.bundleDiscount || 0,
    bundleItems: raw.bundleItems || [],
    bundleBannerUrl: raw.bundleBannerUrl || "",
    bundleSquareImage: raw.bundleSquareImage || "",
    bundleTotalRealPrice: raw.bundleTotalRealPrice || 0,
    eventDate: raw.eventDate || "",
    eventTime: raw.eventTime || "",
    eventEndDate: raw.eventEndDate || "",
    eventEndTime: raw.eventEndTime || "",
    eventDuration: raw.eventDuration || "",
    eventLocation: raw.eventLocation || "",
    eventMode: raw.eventMode || "online",
    onlineUrl: raw.onlineUrl || "",
    physicalAddress: raw.physicalAddress || "",
    maxSeats: raw.maxSeats || 0,
    ticketCategories: raw.ticketCategories || [],
    availabilitySchedule: raw.availabilitySchedule || "",
    seoTitle: raw.seoTitle || "",
    seoDescription: raw.seoDescription || "",
    seoKeywords: raw.seoKeywords || "",
    slug: raw.slug || "",
    customUrl: raw.customUrl || "",
    visibility: raw.visibility || "published",
    isFeatured: raw.isFeatured || false,
    publishAt: raw.publishAt || "",
    ctaText: raw.ctaText || "",
    ctaColor: raw.ctaColor || "#3b82f6",
    ctaStyle: raw.ctaStyle || "solid",
    priceType: raw.priceType || "fixed",
    warranty: raw.warranty || "",
    returnPolicy: raw.returnPolicy || "",
    postPurchaseInstructions: raw.postPurchaseInstructions || "",
    postPurchaseQuill: raw.postPurchaseQuill || "",
    autoDiscount: raw.autoDiscount || false,
    autoDiscountType: raw.autoDiscountType || "percentage",
    autoDiscountValue: raw.autoDiscountValue || 0,
    salesLimit: raw.salesLimit || 0,
    countdownStartDate: raw.countdownStartDate || "",
    countdownEndDate: raw.countdownEndDate || "",
    countdownEnabled: raw.countdownEnabled || false,
    customButton: raw.customButton || "",
    hideFromStore: raw.hideFromStore || false,
    faqItems: raw.faqItems || [],
    requirementQuestions: raw.requirementQuestions || [],
  }
}

export default function EditProductPage() {
  const router = useRouter()
  const params = useParams()
  const productId = params.id as string

  const [data, setData] = useState<WizardData>(INITIAL_WIZARD_DATA)
  const [loading, setLoading] = useState(true)
  const [isSubmitting, setIsSubmitting] = useState(false)

  const steps = getStepsForType(data.productType)
  const currentIndex = steps.indexOf(data.step)

  const update = useCallback((updates: Partial<WizardData>) => {
    setData((prev) => ({ ...prev, ...updates }))
  }, [])

  useEffect(() => {
    async function fetchProduct() {
      try {
        const res = await fetch(`/api/vendor/products/${productId}`)
        if (!res.ok) throw new Error("Produit non trouvé")
        const product = await res.json()
        const wizardData = mapProductToWizard(product)
        setData({ ...wizardData, step: "general" })
      } catch (err) {
        toast.error("Impossible de charger le produit")
        router.push("/vendor/products")
      } finally {
        setLoading(false)
      }
    }
    fetchProduct()
  }, [productId, router])

  const canGoNext = (): boolean => {
    return true
  }

  const goNext = () => {
    if (!canGoNext()) {
      toast.error("Veuillez remplir les champs obligatoires")
      return
    }
    const nextIndex = currentIndex + 1
    if (nextIndex < steps.length) {
      update({ step: steps[nextIndex] })
    }
  }

  const goPrev = () => {
    const prevIndex = currentIndex - 1
    if (prevIndex >= 0) {
      update({ step: steps[prevIndex] })
    }
  }

  const handleSubmit = async (asDraft: boolean) => {
    setIsSubmitting(true)
    try {
      const payload = {
        name: data.name,
        shortDescription: data.shortDescription,
        description: data.description,
        categoryId: data.categoryId,
        subcategoryId: data.subcategoryId,
        price: data.price,
        comparePrice: data.comparePrice,
        currency: data.currency,
        brand: data.brand,
        sku: data.sku,
        productType: data.productType,
        bannerUrl: data.bannerUrl,
        videoUrl: data.videoUrl,
        stock: data.stock,
        weight: data.weight,
        dimensions: data.dimensions,
        seoTitle: data.seoTitle,
        seoDescription: data.seoDescription,
        seoKeywords: data.seoKeywords,
        slug: data.slug,
        isActive: !asDraft,
        isFeatured: data.isFeatured,
        isHidden: data.visibility === "hidden",
      }

      const res = await fetch(`/api/vendor/products/${productId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const json = await res.json()
        throw new Error(json.error || "Erreur lors de la mise à jour")
      }

      toast.success("Produit mis à jour avec succès !")
      router.push("/vendor/products")
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Erreur lors de la mise à jour")
    } finally {
      setIsSubmitting(false)
    }
  }

  const renderStep = () => {
    switch (data.step) {
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
        return <StepSeo data={data} onChange={update} productId={productId} />
      case "faq":
        return <StepFaq data={data} onChange={update} />
      case "preview":
        return <StepPreview data={data} onStepClick={(step) => update({ step })} />
      default:
        return null
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-[#7126b6]" />
      </div>
    )
  }

  const isPreview = data.step === "preview"
  const isFirstStep = currentIndex === 0

  return (
    <div className="bg-gray-50 overflow-hidden">
      <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-[#0f172a]">Modifier le produit</h1>
          <p className="mt-1 text-sm text-gray-500">
            {data.name || "Chargement..."}
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
                    {isSubmitting ? "Mise à jour..." : "Mettre à jour"}
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
