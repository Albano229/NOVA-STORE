"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import {
  Settings,
  Palette,
  Store,
  Truck,
  Share2,
  Package,
  Save,
  Loader2,
  Eye,
  Globe,
} from "lucide-react";

interface StoreConfig {
  primaryColor: string;
  secondaryColor: string;
  fontFamily: string;
  theme: string;
  darkMode: boolean;
  showFeatured: boolean;
  showCategories: boolean;
  showReviews: boolean;
  showBanners: boolean;
  currency: string;
  globalDiscount: number;
  couponsEnabled: boolean;
  whatsapp: string;
  instagram: string;
  facebook: string;
  emailSupport: string;
  defaultShippingCost: number;
  shippingDelay: string;
  physicalEnabled: boolean;
  digitalEnabled: boolean;
  serviceEnabled: boolean;
  variantEnabled: boolean;
  aiDescriptions: boolean;
  showPublicContact: boolean;
}

export default function VendorSettingsPage() {
  const [config, setConfig] = useState<StoreConfig>({
    primaryColor: "#7126b6",
    secondaryColor: "#7c3aed",
    fontFamily: "Inter",
    theme: "moderne",
    darkMode: false,
    showFeatured: true,
    showCategories: true,
    showReviews: true,
    showBanners: true,
    currency: "XOF",
    globalDiscount: 0,
    couponsEnabled: true,
    whatsapp: "",
    instagram: "",
    facebook: "",
    emailSupport: "",
    defaultShippingCost: 0,
    shippingDelay: "",
    physicalEnabled: true,
    digitalEnabled: true,
    serviceEnabled: false,
    variantEnabled: true,
    aiDescriptions: true,
    showPublicContact: false,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<"design" | "sections" | "marketing" | "contact" | "shipping" | "products">("design");

  useEffect(() => {
    Promise.all([
      fetch("/api/vendor/store-config").then((r) => r.json()).catch(() => ({})),
      fetch("/api/vendor/shop").then((r) => r.json()).catch(() => ({})),
    ])
      .then(([configData, shopData]) => {
        if (configData.config) setConfig((prev) => ({ ...prev, ...configData.config }));
        if (shopData.showPublicContact !== undefined) {
          setConfig((prev) => ({ ...prev, showPublicContact: shopData.showPublicContact }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const updateConfig = (key: keyof StoreConfig, value: any) => {
    setConfig((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const [configRes] = await Promise.all([
        fetch("/api/vendor/store-config", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(config),
        }),
        fetch("/api/vendor/shop", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ showPublicContact: config.showPublicContact }),
        }),
      ]);
      if (configRes.ok) {
        toast.success("Paramètres sauvegardés");
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch {
      toast.error("Erreur");
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-48 animate-pulse rounded bg-gray-200" />
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-40 animate-pulse rounded-xl bg-gray-200" />
        ))}
      </div>
    );
  }

  const tabs = [
    { id: "design" as const, label: "Design", icon: Palette },
    { id: "sections" as const, label: "Sections", icon: Eye },
    { id: "marketing" as const, label: "Marketing", icon: Globe },
    { id: "contact" as const, label: "Contact", icon: Share2 },
    { id: "shipping" as const, label: "Livraison", icon: Truck },
    { id: "products" as const, label: "Produits", icon: Package },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Paramètres boutique</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">Personnalisez l&apos;apparence et le comportement de votre boutique</p>
        </div>
        <Button onClick={handleSave} disabled={saving} className="gap-2">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
          Sauvegarder
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 whitespace-nowrap rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "bg-[#7126b6] text-white shadow-sm dark:shadow-gray-800/20"
                : "bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 hover:bg-gray-200"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {/* Design Tab */}
      {activeTab === "design" && (
        <div className="space-y-6">
          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <Palette className="h-5 w-5 text-[#7126b6]" />
              <h2 className="text-lg font-semibold text-[#0f172a]">Apparence</h2>
            </div>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Couleur principale</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig("primaryColor", e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <Input
                    id="primaryColor"
                    value={config.primaryColor}
                    onChange={(e) => updateConfig("primaryColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Couleur secondaire</label>
                <div className="flex items-center gap-3">
                  <input
                    type="color"
                    value={config.secondaryColor}
                    onChange={(e) => updateConfig("secondaryColor", e.target.value)}
                    className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
                  />
                  <Input
                    id="secondaryColor"
                    value={config.secondaryColor}
                    onChange={(e) => updateConfig("secondaryColor", e.target.value)}
                    className="flex-1"
                  />
                </div>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Police</label>
                <select
                  value={config.fontFamily}
                  onChange={(e) => updateConfig("fontFamily", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                >
                  <option value="Inter">Inter</option>
                  <option value="Poppins">Poppins</option>
                  <option value="Montserrat">Montserrat</option>
                  <option value="Roboto">Roboto</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Thème</label>
                <select
                  value={config.theme}
                  onChange={(e) => updateConfig("theme", e.target.value)}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                >
                  <option value="moderne">Moderne</option>
                  <option value="minimal">Minimal</option>
                  <option value="classique">Classique</option>
                </select>
              </div>
            </div>
            <div className="mt-4">
              <label className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer">
                <span className="text-sm text-[#0f172a]">Mode sombre</span>
                <div
                  onClick={() => updateConfig("darkMode", !config.darkMode)}
                  className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${config.darkMode ? "bg-[#7126b6]" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20 transition-transform ${config.darkMode ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </label>
            </div>
          </Card>
        </div>
      )}

      {/* Sections Tab */}
      {activeTab === "sections" && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Eye className="h-5 w-5 text-[#7126b6]" />
            <h2 className="text-lg font-semibold text-[#0f172a]">Sections de la boutique</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: "showFeatured" as const, label: "Produits en vedette" },
              { key: "showCategories" as const, label: "Catégories" },
              { key: "showReviews" as const, label: "Avis clients" },
              { key: "showBanners" as const, label: "Bannières promotionnelles" },
            ].map((section) => (
              <label key={section.key} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <span className="text-sm text-[#0f172a]">{section.label}</span>
                <div
                  onClick={() => updateConfig(section.key, !config[section.key])}
                  className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${config[section.key] ? "bg-[#7126b6]" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20 transition-transform ${config[section.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </label>
            ))}
          </div>
        </Card>
      )}

      {/* Marketing Tab */}
      {activeTab === "marketing" && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="h-5 w-5 text-[#7126b6]" />
            <h2 className="text-lg font-semibold text-[#0f172a]">Marketing</h2>
          </div>
          <div className="space-y-4">
            <Input label="Réduction globale (%)" id="globalDiscount" type="number" value={config.globalDiscount.toString()} onChange={(e) => updateConfig("globalDiscount", parseFloat(e.target.value) || 0)} min="0" max="50" />
            <label className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer">
              <span className="text-sm text-[#0f172a]">Coupons actifs</span>
              <div
                onClick={() => updateConfig("couponsEnabled", !config.couponsEnabled)}
                className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${config.couponsEnabled ? "bg-[#7126b6]" : "bg-gray-300"}`}
              >
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20 transition-transform ${config.couponsEnabled ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </label>
          </div>
        </Card>
      )}

      {/* Contact Tab */}
      {activeTab === "contact" && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Share2 className="h-5 w-5 text-[#7126b6]" />
            <h2 className="text-lg font-semibold text-[#0f172a]">Réseaux & Contact</h2>
          </div>
          <div className="space-y-4">
            <label className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-4 cursor-pointer">
              <div>
                <span className="text-sm font-medium text-[#0f172a]">Afficher mes coordonnées de contact sur ma boutique publique</span>
                <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
                  Si désactivé, seuls le nom de la boutique et la description seront visibles
                </p>
              </div>
              <div
                onClick={() => updateConfig("showPublicContact", !config.showPublicContact)}
                className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${config.showPublicContact ? "bg-[#7126b6]" : "bg-gray-300"}`}
              >
                <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20 transition-transform ${config.showPublicContact ? "translate-x-5" : "translate-x-0.5"}`} />
              </div>
            </label>
            <Input label="WhatsApp" id="whatsapp" value={config.whatsapp} onChange={(e) => updateConfig("whatsapp", e.target.value)} placeholder="+229 52 23 63 14" />
            <Input label="Instagram" id="instagram" value={config.instagram} onChange={(e) => updateConfig("instagram", e.target.value)} placeholder="@votre_boutique" />
            <Input label="Facebook" id="facebook" value={config.facebook} onChange={(e) => updateConfig("facebook", e.target.value)} placeholder="https://facebook.com/..." />
            <Input label="Email support" id="emailSupport" type="email" value={config.emailSupport} onChange={(e) => updateConfig("emailSupport", e.target.value)} placeholder="support@boutique.com" />
          </div>
        </Card>
      )}

      {/* Shipping Tab */}
      {activeTab === "shipping" && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Truck className="h-5 w-5 text-[#7126b6]" />
            <h2 className="text-lg font-semibold text-[#0f172a]">Livraison</h2>
          </div>
          <div className="space-y-4">
            <Input label="Frais de livraison par défaut (FCFA)" id="defaultShippingCost" type="number" value={config.defaultShippingCost.toString()} onChange={(e) => updateConfig("defaultShippingCost", parseFloat(e.target.value) || 0)} min="0" />
            <Input label="Délai de livraison estimé" id="shippingDelay" value={config.shippingDelay} onChange={(e) => updateConfig("shippingDelay", e.target.value)} placeholder="3-5 jours ouvrables" />
          </div>
        </Card>
      )}

      {/* Products Tab */}
      {activeTab === "products" && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Package className="h-5 w-5 text-[#7126b6]" />
            <h2 className="text-lg font-semibold text-[#0f172a]">Types de produits</h2>
          </div>
          <div className="space-y-3">
            {[
              { key: "physicalEnabled" as const, label: "Produits physiques", icon: "📦" },
              { key: "digitalEnabled" as const, label: "Produits digitaux", icon: "📁" },
              { key: "serviceEnabled" as const, label: "Services", icon: "⚡" },
              { key: "variantEnabled" as const, label: "Variantes activées", icon: "🎨" },
              { key: "aiDescriptions" as const, label: "IA pour descriptions", icon: "✨" },
            ].map((feature) => (
              <label key={feature.key} className="flex items-center justify-between rounded-lg border border-gray-200 dark:border-gray-700 p-3 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700">
                <div className="flex items-center gap-3">
                  <span>{feature.icon}</span>
                  <span className="text-sm text-[#0f172a]">{feature.label}</span>
                </div>
                <div
                  onClick={() => updateConfig(feature.key, !config[feature.key])}
                  className={`relative h-6 w-11 cursor-pointer rounded-full transition-colors ${config[feature.key] ? "bg-[#7126b6]" : "bg-gray-300"}`}
                >
                  <div className={`absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20 transition-transform ${config[feature.key] ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
              </label>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
