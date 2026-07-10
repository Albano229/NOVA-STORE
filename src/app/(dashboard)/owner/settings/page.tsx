"use client"

import { useEffect, useState } from "react"
import toast from "react-hot-toast"
import {
  Palette, Layout, Globe, CreditCard, Save, Loader2,
  Upload, Eye, EyeOff, ToggleLeft, ToggleRight, Link2,
  Mail, Phone, ExternalLink, MessageCircle, AtSign, Video,
  Sparkles, Star, DollarSign, Shield, Zap
} from "lucide-react"
import { ImageUploader } from "@/components/ui/image-uploader"

interface Settings {
  [key: string]: string | boolean | number
}

type TabId = "appearance" | "landing" | "general" | "payments"

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "appearance", label: "Apparence", icon: Palette },
  { id: "landing", label: "Landing Page", icon: Layout },
  { id: "general", label: "Général", icon: Globe },
  { id: "payments", label: "Paiements", icon: CreditCard },
]

const PAYMENT_METHODS = [
  { key: "payStripe", label: "Stripe (Carte bancaire)", icon: "💳" },
  { key: "payFlutterwave", label: "Flutterwave (Mobile Money)", icon: "📱" },
  { key: "payFedaPay", label: "FedaPay", icon: "🏦" },
  { key: "payPaypal", label: "PayPal", icon: "🅿️" },
  { key: "payOrangeMoney", label: "Orange Money", icon: "🟠" },
  { key: "payWave", label: "Wave", icon: "🌊" },
  { key: "payMtnMoney", label: "MTN Mobile Money", icon: "🟡" },
]

export default function OwnerSettingsPage() {
  const [settings, setSettings] = useState<Settings>({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [activeTab, setActiveTab] = useState<TabId>("appearance")
  const [showApiKeys, setShowApiKeys] = useState<Record<string, boolean>>({})

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => toast.error("Erreur lors du chargement"))
      .finally(() => setLoading(false))
  }, [])

  const update = (key: string, value: string | boolean | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }))
  }

  const handleSave = async (keys: string[]) => {
    setSaving(true)
    const payload: Settings = {}
    keys.forEach((key) => {
      if (settings[key] !== undefined) payload[key] = settings[key]
    })
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        const saved = await res.json()
        setSettings(saved)
        toast.success("Paramètres sauvegardés")
      } else {
        toast.error("Erreur lors de la sauvegarde")
      }
    } catch {
      toast.error("Erreur réseau")
    }
    setSaving(false)
  }

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#7126b6] border-t-transparent" />
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-6xl">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#0f172a]">Paramètres Plateforme</h1>
        <p className="text-sm text-gray-500">Configurez l'apparence, le contenu et les paiements de votre marketplace</p>
      </div>

      <div className="flex flex-col gap-6 md:flex-row">
        <aside className="w-full flex-shrink-0 md:w-56">
          <nav className="space-y-1">
            {TABS.map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium transition ${
                    activeTab === tab.id
                      ? "bg-[#7126b6] text-white"
                      : "text-gray-600 hover:bg-gray-100"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              )
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0 space-y-6">
          {activeTab === "appearance" && <AppearanceTab settings={settings} update={update} onSave={() => handleSave(APPEARANCE_KEYS)} saving={saving} />}
          {activeTab === "landing" && <LandingTab settings={settings} update={update} onSave={() => handleSave(LANDING_KEYS)} saving={saving} />}
          {activeTab === "general" && <GeneralTab settings={settings} update={update} onSave={() => handleSave(GENERAL_KEYS)} saving={saving} />}
          {activeTab === "payments" && <PaymentsTab settings={settings} update={update} onSave={() => handleSave(PAYMENTS_KEYS)} saving={saving} showApiKeys={showApiKeys} setShowApiKeys={setShowApiKeys} />}
        </div>
      </div>
    </div>
  )
}

const APPEARANCE_KEYS = ["siteName", "logo", "favicon", "primaryColor", "secondaryColor"]
const LANDING_KEYS = ["heroTitle", "heroSubtitle", "heroCtaText", "showTestimonials", "showFeatures", "showPricing", "showStats", "showCategories", "showMarquee", "showResources"]
const GENERAL_KEYS = ["siteName", "siteDescription", "contactEmail", "contactPhone", "siteUrl", "facebookUrl", "instagramUrl", "twitterUrl", "youtubeUrl", "tiktokUrl"]
const PAYMENTS_KEYS = ["commissionRate", "payStripe", "payStripeKey", "payFlutterwave", "payFlutterwaveKey", "payFedaPay", "payFedaPayKey", "payPaypal", "payPaypalKey", "payOrangeMoney", "payWave", "payMtnMoney", "minPayout"]

function SectionCard({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-5 flex items-center gap-2">
        <div className="rounded-lg bg-[#7126b6]/10 p-2">
          <Icon className="h-5 w-5 text-[#7126b6]" />
        </div>
        <h2 className="text-lg font-semibold text-[#0f172a]">{title}</h2>
      </div>
      {children}
    </div>
  )
}

function SaveButton({ onClick, saving }: { onClick: () => void; saving: boolean }) {
  return (
    <div className="flex justify-end">
      <button
        onClick={onClick}
        disabled={saving}
        className="flex items-center gap-2 rounded-xl bg-[#7126b6] px-6 py-2.5 text-sm font-medium text-white transition hover:bg-[#5e1f9a] disabled:opacity-50"
      >
        {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
        {saving ? "Enregistrement..." : "Enregistrer"}
      </button>
    </div>
  )
}

function AppearanceTab({ settings, update, onSave, saving }: { settings: Settings; update: (k: string, v: any) => void; onSave: () => void; saving: boolean }) {
  return (
    <>
      <SectionCard title="Logo & Favicon" icon={Upload}>
        <div className="grid gap-6 sm:grid-cols-2">
          <ImageUploader
            label="Logo du site"
            value={(settings.logo as string) || ""}
            onChange={(url) => update("logo", url)}
            folder="settings/logo"
            accept="image/jpeg,image/png,image/webp,image/svg+xml"
            maxSizeMB={5}
          />
          <ImageUploader
            label="Favicon"
            value={(settings.favicon as string) || ""}
            onChange={(url) => update("favicon", url)}
            folder="settings/favicon"
            accept="image/png,image/x-icon,image/svg+xml,image/webp"
            maxSizeMB={2}
          />
        </div>
      </SectionCard>

      <SectionCard title="Couleurs du thème" icon={Palette}>
        <p className="mb-4 text-sm text-gray-500">Ces couleurs s'appliquent sur tout le site dynamiquement</p>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Couleur principale</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={(settings.primaryColor as string) || "#7126b6"}
                onChange={(e) => update("primaryColor", e.target.value)}
                className="h-12 w-12 cursor-pointer rounded-lg border border-gray-200"
              />
              <input
                type="text"
                value={(settings.primaryColor as string) || "#7126b6"}
                onChange={(e) => update("primaryColor", e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
              />
            </div>
            <div className="mt-3 h-8 rounded-lg" style={{ backgroundColor: (settings.primaryColor as string) || "#7126b6" }} />
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700">Couleur secondaire</label>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={(settings.secondaryColor as string) || "#a855f7"}
                onChange={(e) => update("secondaryColor", e.target.value)}
                className="h-12 w-12 cursor-pointer rounded-lg border border-gray-200"
              />
              <input
                type="text"
                value={(settings.secondaryColor as string) || "#a855f7"}
                onChange={(e) => update("secondaryColor", e.target.value)}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm font-mono focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
              />
            </div>
            <div className="mt-3 h-8 rounded-lg" style={{ backgroundColor: (settings.secondaryColor as string) || "#a855f7" }} />
          </div>
        </div>
      </SectionCard>

      <SaveButton onClick={onSave} saving={saving} />
    </>
  )
}

function ToggleSwitch({ enabled, onChange, label }: { enabled: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex cursor-pointer items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3 transition hover:bg-gray-100">
      <span className="text-sm font-medium text-[#0f172a]">{label}</span>
      <div className="relative">
        <input type="checkbox" checked={enabled} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
        <div className="h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-[#7126b6] transition-colors" />
        <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
      </div>
    </label>
  )
}

function LandingTab({ settings, update, onSave, saving }: { settings: Settings; update: (k: string, v: any) => void; onSave: () => void; saving: boolean }) {
  return (
    <>
      <SectionCard title="Hero - Section principale" icon={Sparkles}>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Titre principal</label>
            <input
              type="text"
              value={(settings.heroTitle as string) || ""}
              onChange={(e) => update("heroTitle", e.target.value)}
              placeholder="La plateforme N°1 pour vendre vos produits"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Sous-titre</label>
            <textarea
              value={(settings.heroSubtitle as string) || ""}
              onChange={(e) => update("heroSubtitle", e.target.value)}
              placeholder="Créez votre boutique en 5 minutes..."
              rows={2}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6] resize-none"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Texte du bouton CTA</label>
            <input
              type="text"
              value={(settings.heroCtaText as string) || ""}
              onChange={(e) => update("heroCtaText", e.target.value)}
              placeholder="Créer ma boutique gratuitement"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Sections activées" icon={ToggleLeft}>
        <div className="space-y-2">
          <ToggleSwitch
            enabled={settings.showTestimonials !== false}
            onChange={(v) => update("showTestimonials", v)}
            label="Témoignages"
          />
          <ToggleSwitch
            enabled={settings.showFeatures !== false}
            onChange={(v) => update("showFeatures", v)}
            label="Fonctionnalités"
          />
          <ToggleSwitch
            enabled={settings.showPricing !== false}
            onChange={(v) => update("showPricing", v)}
            label="Tarifs"
          />
          <ToggleSwitch
            enabled={settings.showStats !== false}
            onChange={(v) => update("showStats", v)}
            label="Statistiques"
          />
          <ToggleSwitch
            enabled={settings.showCategories !== false}
            onChange={(v) => update("showCategories", v)}
            label="Catégories de vente"
          />
          <ToggleSwitch
            enabled={settings.showMarquee !== false}
            onChange={(v) => update("showMarquee", v)}
            label="Bandeau défilant"
          />
          <ToggleSwitch
            enabled={settings.showResources !== false}
            onChange={(v) => update("showResources", v)}
            label="Ressources"
          />
        </div>
      </SectionCard>

      <SaveButton onClick={onSave} saving={saving} />
    </>
  )
}

function GeneralTab({ settings, update, onSave, saving }: { settings: Settings; update: (k: string, v: any) => void; onSave: () => void; saving: boolean }) {
  return (
    <>
      <SectionCard title="Informations de la plateforme" icon={Globe}>
        <div className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">Nom de la plateforme</label>
              <input
                type="text"
                value={(settings.siteName as string) || ""}
                onChange={(e) => update("siteName", e.target.value)}
                placeholder="NOVA STORE"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">URL du site</label>
              <input
                type="url"
                value={(settings.siteUrl as string) || ""}
                onChange={(e) => update("siteUrl", e.target.value)}
                placeholder="https://nova-store-ashy.vercel.app"
                className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Description</label>
            <textarea
              value={(settings.siteDescription as string) || ""}
              onChange={(e) => update("siteDescription", e.target.value)}
              placeholder="Marketplace multi-vendeurs nouvelle génération"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6] resize-none"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Contact" icon={Mail}>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Email de contact</label>
            <input
              type="email"
              value={(settings.contactEmail as string) || ""}
              onChange={(e) => update("contactEmail", e.target.value)}
              placeholder="contact@novastore.com"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Téléphone</label>
            <input
              type="tel"
              value={(settings.contactPhone as string) || ""}
              onChange={(e) => update("contactPhone", e.target.value)}
              placeholder="+229 XX XX XX XX"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Réseaux sociaux" icon={Link2}>
        <div className="space-y-3">
          {[
            { key: "facebookUrl", label: "Facebook", icon: ExternalLink, placeholder: "https://facebook.com/..." },
            { key: "instagramUrl", label: "Instagram", icon: AtSign, placeholder: "https://instagram.com/..." },
            { key: "twitterUrl", label: "Twitter / X", icon: MessageCircle, placeholder: "https://twitter.com/..." },
            { key: "youtubeUrl", label: "YouTube", icon: Video, placeholder: "https://youtube.com/..." },
            { key: "tiktokUrl", label: "TikTok", icon: Zap, placeholder: "https://tiktok.com/..." },
          ].map(({ key, label, icon: Icon, placeholder }) => (
            <div key={key} className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gray-100">
                <Icon className="h-5 w-5 text-gray-600" />
              </div>
              <input
                type="url"
                value={(settings[key] as string) || ""}
                onChange={(e) => update(key, e.target.value)}
                placeholder={placeholder}
                className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
              />
            </div>
          ))}
        </div>
      </SectionCard>

      <SaveButton onClick={onSave} saving={saving} />
    </>
  )
}

function PaymentsTab({ settings, update, onSave, saving, showApiKeys, setShowApiKeys }: {
  settings: Settings; update: (k: string, v: any) => void; onSave: () => void; saving: boolean;
  showApiKeys: Record<string, boolean>; setShowApiKeys: React.Dispatch<React.SetStateAction<Record<string, boolean>>>
}) {
  return (
    <>
      <SectionCard title="Commission plateforme" icon={DollarSign}>
        <div className="space-y-4">
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">
              Taux de commission sur chaque vente (%)
            </label>
            <div className="flex items-center gap-3">
              <input
                type="range"
                min="0"
                max="50"
                step="0.5"
                value={(settings.commissionRate as number) ?? 10}
                onChange={(e) => update("commissionRate", parseFloat(e.target.value))}
                className="flex-1 accent-[#7126b6]"
              />
              <span className="w-16 rounded-lg border border-gray-300 px-3 py-2 text-center text-sm font-bold text-[#7126b6]">
                {(settings.commissionRate as number) ?? 10}%
              </span>
            </div>
            <p className="mt-1 text-xs text-gray-400">Pourcentage prélevé sur chaque vente par les vendeurs</p>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium text-gray-700">Retrait minimum (FCFA)</label>
            <input
              type="number"
              value={(settings.minPayout as number) ?? 5000}
              onChange={(e) => update("minPayout", parseInt(e.target.value) || 0)}
              min="0"
              className="w-full rounded-lg border border-gray-300 px-4 py-2.5 text-sm focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
            />
          </div>
        </div>
      </SectionCard>

      <SectionCard title="Moyens de paiement" icon={Shield}>
        <p className="mb-4 text-sm text-gray-500">Activez ou désactivez les moyens de paiement acceptés sur la plateforme</p>
        <div className="space-y-3">
          {PAYMENT_METHODS.map(({ key, label, icon }) => (
            <div key={key} className="flex items-center justify-between rounded-xl border border-gray-100 bg-gray-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">{icon}</span>
                <span className="text-sm font-medium text-[#0f172a]">{label}</span>
              </div>
              <label className="relative inline-flex cursor-pointer items-center">
                <input
                  type="checkbox"
                  checked={settings[key] !== false}
                  onChange={(e) => update(key, e.target.checked)}
                  className="peer sr-only"
                />
                <div className="h-6 w-11 rounded-full bg-gray-300 peer-checked:bg-[#7126b6] transition-colors" />
                <div className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:translate-x-5" />
              </label>
            </div>
          ))}
        </div>
      </SectionCard>

      <SectionCard title="Clés API" icon={Zap}>
        <p className="mb-4 text-sm text-gray-500">Configurez les clés des providers de paiement</p>
        <div className="space-y-4">
          {[
            { key: "payStripeKey", label: "Stripe Publishable Key", provider: "payStripe" },
            { key: "payFlutterwaveKey", label: "Flutterwave Public Key", provider: "payFlutterwave" },
            { key: "payFedaPayKey", label: "FedaPay Public Key", provider: "payFedaPay" },
            { key: "payPaypalKey", label: "PayPal Client ID", provider: "payPaypal" },
          ].map(({ key, label, provider }) => (
            <div key={key}>
              <label className="mb-1.5 block text-sm font-medium text-gray-700">{label}</label>
              <div className="flex items-center gap-2">
                <input
                  type={showApiKeys[key] ? "text" : "password"}
                  value={(settings[key] as string) || ""}
                  onChange={(e) => update(key, e.target.value)}
                  placeholder={settings[provider] ? "Clé configurée" : "Non configuré"}
                  className="flex-1 rounded-lg border border-gray-300 px-4 py-2.5 text-sm font-mono focus:border-[#7126b6] focus:outline-none focus:ring-1 focus:ring-[#7126b6]"
                />
                <button
                  type="button"
                  onClick={() => setShowApiKeys((prev) => ({ ...prev, [key]: !prev[key] }))}
                  className="rounded-lg border border-gray-300 p-2.5 text-gray-500 hover:bg-gray-50"
                >
                  {showApiKeys[key] ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>
          ))}
        </div>
      </SectionCard>

      <SaveButton onClick={onSave} saving={saving} />
    </>
  )
}
