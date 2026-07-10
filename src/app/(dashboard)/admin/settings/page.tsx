"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import {
  Globe,
  Palette,
  DollarSign,
  CreditCard,
  Shield,
  Server,
  Save,
  Loader2,
  Store,
  Key,
  Eye,
  EyeOff,
  AlertTriangle,
  Bell,
  Bot,
  Percent,
  Wrench,
  Lock,
  Users,
  Fingerprint,
  Package,
  Upload,
} from "lucide-react";
import { ImageUploader } from "@/components/ui/image-uploader";

interface Settings {
  [key: string]: string | boolean | number;
}

const CURRENCIES = [
  { value: "FCFA", label: "FCFA (Franc CFA)" },
  { value: "USD", label: "USD (Dollar)" },
  { value: "EUR", label: "EUR (Euro)" },
];

const PAYOUT_METHODS = [
  { value: "stripe", label: "Stripe" },
  { value: "paypal", label: "PayPal" },
  { value: "flutterwave", label: "Flutterwave" },
  { value: "bank_transfer", label: "Virement bancaire" },
  { value: "mobile_money", label: "Mobile Money" },
];

type TabId = "general" | "business" | "payments" | "taxes" | "system" | "security";

const TABS: { id: TabId; label: string; icon: React.ElementType }[] = [
  { id: "general", label: "Général", icon: Globe },
  { id: "business", label: "Business", icon: Store },
  { id: "payments", label: "Paiements", icon: CreditCard },
  { id: "taxes", label: "Taxes", icon: Percent },
  { id: "system", label: "Système", icon: Server },
  { id: "security", label: "Sécurité", icon: Shield },
];

export default function AdminSettingsPage() {
  const [settings, setSettings] = useState<Settings>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<TabId>("general");
  const [showStripeKey, setShowStripeKey] = useState(false);
  const [showPaypalKey, setShowPaypalKey] = useState(false);
  const [showFlutterwaveKey, setShowFlutterwaveKey] = useState(false);

  useEffect(() => {
    fetch("/api/admin/settings")
      .then((r) => r.json())
      .then((data) => setSettings(data))
      .catch(() => toast.error("Erreur lors du chargement"))
      .finally(() => setLoading(false));
  }, []);

  const update = (key: string, value: string | boolean | number) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async (keys: string[]) => {
    setSaving(true);
    const payload: Settings = {};
    keys.forEach((key) => {
      if (settings[key] !== undefined) payload[key] = settings[key];
    });
    try {
      const res = await fetch("/api/admin/settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (res.ok) {
        const saved = await res.json();
        setSettings(saved);
        toast.success("Paramètres sauvegardés");
      } else {
        toast.error("Erreur lors de la sauvegarde");
      }
    } catch {
      toast.error("Erreur réseau");
    }
    setSaving(false);
  };

  const Toggle = ({
    label,
    value,
    onChange,
    description,
  }: {
    label: string;
    value: boolean;
    onChange: () => void;
    description?: string;
  }) => (
    <label className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4 cursor-pointer hover:bg-gray-50/80 transition-colors">
      <div className="flex-1 mr-4">
        <span className="text-sm font-medium text-[#0f172a]">{label}</span>
        {description && (
          <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">{description}</p>
        )}
      </div>
      <div
        onClick={(e) => {
          e.preventDefault();
          onChange();
        }}
        className={`relative h-6 w-11 shrink-0 cursor-pointer rounded-full transition-colors ${
          value ? "bg-[#7126b6]" : "bg-gray-300"
        }`}
      >
        <div
          className={`absolute top-0.5 h-5 w-5 rounded-full bg-white dark:bg-gray-800 shadow-sm dark:shadow-gray-800/20 transition-transform ${
            value ? "translate-x-5" : "translate-x-0.5"
          }`}
        />
      </div>
    </label>
  );

  const SaveButton = ({ onClick, keys }: { onClick: () => void; keys: string[] }) => (
    <div className="flex justify-end pt-2">
      <Button onClick={onClick} disabled={saving} className="gap-2">
        {saving ? (
          <Loader2 className="h-4 w-4 animate-spin" />
        ) : (
          <Save className="h-4 w-4" />
        )}
        Sauvegarder
      </Button>
    </div>
  );

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 w-24 animate-pulse rounded-lg bg-gray-200" />
          ))}
        </div>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-48 animate-pulse rounded-2xl bg-gray-200" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-[#0f172a]">Paramètres plateforme</h1>
        <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
          Configuration globale de la plateforme
        </p>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <aside className="lg:w-64 shrink-0">
          <nav className="flex lg:flex-col gap-2 overflow-x-auto pb-2 lg:pb-0">
            {TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2.5 whitespace-nowrap rounded-xl px-4 py-3 text-sm font-medium transition-all ${
                    isActive
                      ? "bg-[#0f172a] text-white shadow-md shadow-[#0f172a]/20"
                      : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-[#0f172a]"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  {tab.label}
                </button>
              );
            })}
          </nav>
        </aside>

        <div className="flex-1 min-w-0">
          {activeTab === "general" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-indigo-100 p-2">
                    <Globe className="h-5 w-5 text-[#7126b6]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">
                    Identité du site
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Nom du site"
                    id="siteName"
                    value={(settings.siteName as string) || ""}
                    onChange={(e) => update("siteName", e.target.value)}
                    placeholder="NOVA STORE"
                  />
                  <Input
                    label="URL du site"
                    id="siteUrl"
                    value={(settings.siteUrl as string) || ""}
                    onChange={(e) => update("siteUrl", e.target.value)}
                    placeholder="https://novastore.com"
                  />
                </div>
                <div className="mt-4">
                  <label
                    htmlFor="siteDescription"
                    className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                  >
                    Description
                  </label>
                  <textarea
                    id="siteDescription"
                    value={(settings.siteDescription as string) || ""}
                    onChange={(e) => update("siteDescription", e.target.value)}
                    placeholder="Marketplace multi-vendeurs nouvelle génération"
                    rows={3}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 resize-none"
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-violet-100 p-2">
                    <Eye className="h-5 w-5 text-violet-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">
                    Logo & Favicon
                  </h2>
                </div>
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
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-pink-100 p-2">
                    <Palette className="h-5 w-5 text-pink-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">Couleurs</h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Couleur principale
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={(settings.primaryColor as string) || "#7126b6"}
                        onChange={(e) => update("primaryColor", e.target.value)}
                        className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <Input
                        id="primaryColor"
                        value={(settings.primaryColor as string) || "#7126b6"}
                        onChange={(e) => update("primaryColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Couleur secondaire
                    </label>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={(settings.secondaryColor as string) || "#7c3aed"}
                        onChange={(e) => update("secondaryColor", e.target.value)}
                        className="h-10 w-10 cursor-pointer rounded-lg border border-gray-200 dark:border-gray-700"
                      />
                      <Input
                        id="secondaryColor"
                        value={(settings.secondaryColor as string) || "#7c3aed"}
                        onChange={(e) => update("secondaryColor", e.target.value)}
                        className="flex-1"
                      />
                    </div>
                  </div>
                </div>
              </Card>

              <SaveButton
                keys={["siteName", "siteUrl", "siteDescription", "logo", "favicon", "primaryColor", "secondaryColor"]}
                onClick={() =>
                  handleSave([
                    "siteName",
                    "siteUrl",
                    "siteDescription",
                    "logo",
                    "favicon",
                    "primaryColor",
                    "secondaryColor",
                  ])
                }
              />
            </div>
          )}

          {activeTab === "business" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <DollarSign className="h-5 w-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">
                    Tarification
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Commission plateforme (%)"
                    id="commissionRate"
                    type="number"
                    value={String(settings.commissionRate ?? 5)}
                    onChange={(e) =>
                      update("commissionRate", parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    max="50"
                  />
                  <div className="w-full">
                    <label
                      htmlFor="currency"
                      className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Devise
                    </label>
                    <select
                      id="currency"
                      value={(settings.currency as string) || "FCFA"}
                      onChange={(e) => update("currency", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                    >
                      {CURRENCIES.map((c) => (
                        <option key={c.value} value={c.value}>
                          {c.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-emerald-100 p-2">
                    <Store className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">
                    Marketplace
                  </h2>
                </div>
                <div className="space-y-3">
                  <Toggle
                    label="Marketplace active"
                    description="Activer ou désactiver toute la plateforme"
                    value={!!settings.marketplaceActive}
                    onChange={() => update("marketplaceActive", !settings.marketplaceActive)}
                  />
                  <Toggle
                    label="Inscription vendeurs"
                    description="Autoriser les nouveaux vendeurs à s'inscrire"
                    value={!!settings.vendorRegistrationActive}
                    onChange={() =>
                      update("vendorRegistrationActive", !settings.vendorRegistrationActive)
                    }
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Package className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">
                    Types de produits
                  </h2>
                </div>
                <div className="space-y-3">
                  <Toggle
                    label="Produits physiques"
                    description="Permettre la vente de produits physiques"
                    value={!!settings.allowPhysical}
                    onChange={() => update("allowPhysical", !settings.allowPhysical)}
                  />
                  <Toggle
                    label="Produits digitaux"
                    description="Permettre la vente de fichiers numériques"
                    value={!!settings.allowDigital}
                    onChange={() => update("allowDigital", !settings.allowDigital)}
                  />
                  <Toggle
                    label="Services"
                    description="Permettre la prestation de services"
                    value={!!settings.allowServices}
                    onChange={() => update("allowServices", !settings.allowServices)}
                  />
                  <Toggle
                    label="Bundles"
                    description="Permettre les packs et lots de produits"
                    value={!!settings.allowBundles}
                    onChange={() => update("allowBundles", !settings.allowBundles)}
                  />
                  <Toggle
                    label="Communauté"
                    description="Activer les fonctionnalités communautaires"
                    value={!!settings.allowCommunity}
                    onChange={() => update("allowCommunity", !settings.allowCommunity)}
                  />
                </div>
              </Card>

              <SaveButton
                keys={[
                  "commissionRate",
                  "currency",
                  "marketplaceActive",
                  "vendorRegistrationActive",
                  "allowPhysical",
                  "allowDigital",
                  "allowServices",
                  "allowBundles",
                  "allowCommunity",
                ]}
                onClick={() =>
                  handleSave([
                    "commissionRate",
                    "currency",
                    "marketplaceActive",
                    "vendorRegistrationActive",
                    "allowPhysical",
                    "allowDigital",
                    "allowServices",
                    "allowBundles",
                    "allowCommunity",
                  ])
                }
              />
            </div>
          )}

          {activeTab === "payments" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-indigo-100 p-2">
                    <Key className="h-5 w-5 text-[#7126b6]" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">
                    Clés API de paiement
                  </h2>
                </div>
                <div className="space-y-4">
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Stripe — Clé publiable
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showStripeKey ? "text" : "password"}
                          value={(settings.stripeKey as string) || ""}
                          onChange={(e) => update("stripeKey", e.target.value)}
                          placeholder="pk_live_..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm transition-colors placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowStripeKey(!showStripeKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
                        >
                          {showStripeKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      PayPal — Client ID
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showPaypalKey ? "text" : "password"}
                          value={(settings.paypalKey as string) || ""}
                          onChange={(e) => update("paypalKey", e.target.value)}
                          placeholder="AeA..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm transition-colors placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPaypalKey(!showPaypalKey)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
                        >
                          {showPaypalKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                  <div>
                    <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">
                      Flutterwave — Clé publique
                    </label>
                    <div className="flex items-center gap-2">
                      <div className="relative flex-1">
                        <input
                          type={showFlutterwaveKey ? "text" : "password"}
                          value={(settings.flutterwaveKey as string) || ""}
                          onChange={(e) => update("flutterwaveKey", e.target.value)}
                          placeholder="FLWPUBK-..."
                          className="w-full rounded-lg border border-gray-300 px-3 py-2.5 pr-10 text-sm transition-colors placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowFlutterwaveKey(!showFlutterwaveKey)
                          }
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 dark:text-gray-500 hover:text-gray-600 dark:text-gray-400"
                        >
                          {showFlutterwaveKey ? (
                            <EyeOff className="h-4 w-4" />
                          ) : (
                            <Eye className="h-4 w-4" />
                          )}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-green-100 p-2">
                    <CreditCard className="h-5 w-5 text-green-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">
                    Retraits vendeurs
                  </h2>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <Input
                    label="Montant minimum de retrait"
                    id="minPayout"
                    type="number"
                    value={String(settings.minPayout ?? 5000)}
                    onChange={(e) =>
                      update("minPayout", parseFloat(e.target.value) || 0)
                    }
                    min="0"
                    placeholder="5000"
                  />
                  <div className="w-full">
                    <label
                      htmlFor="payoutMethod"
                      className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300"
                    >
                      Méthode de retrait par défaut
                    </label>
                    <select
                      id="payoutMethod"
                      value={(settings.payoutMethod as string) || "stripe"}
                      onChange={(e) => update("payoutMethod", e.target.value)}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm transition-colors focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                    >
                      {PAYOUT_METHODS.map((m) => (
                        <option key={m.value} value={m.value}>
                          {m.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Card>

              <SaveButton
                keys={["stripeKey", "paypalKey", "flutterwaveKey", "minPayout", "payoutMethod"]}
                onClick={() =>
                  handleSave([
                    "stripeKey",
                    "paypalKey",
                    "flutterwaveKey",
                    "minPayout",
                    "payoutMethod",
                  ])
                }
              />
            </div>
          )}

          {activeTab === "taxes" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <Percent className="h-5 w-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">Configuration des taxes</h2>
                </div>
                <p className="text-sm text-gray-500 mb-4">
                  Définissez le taux de taxe par défaut appliqué à toutes les commandes.
                </p>
                <div className="max-w-xs">
                  <Input
                    label="Taux de taxe par défaut (%)"
                    id="defaultTaxRate"
                    type="number"
                    value={String(settings.defaultTaxRate ?? 0)}
                    onChange={(e) => update("defaultTaxRate", parseFloat(e.target.value) || 0)}
                    min="0"
                    max="100"
                    step="0.1"
                  />
                </div>
                <p className="mt-3 text-xs text-gray-400">
                  Pour des règles avancées par pays/région, consultez la page{" "}
                  <a href="/admin/taxes" className="text-[#7126b6] hover:underline">Gestion des taxes</a>.
                </p>
              </Card>
              <SaveButton
                keys={["defaultTaxRate"]}
                onClick={() => handleSave(["defaultTaxRate"])}
              />
            </div>
          )}

          {activeTab === "system" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-violet-100 p-2">
                    <Bot className="h-5 w-5 text-violet-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">Intelligence artificielle</h2>
                </div>
                <div className="space-y-3">
                  <Toggle
                    label="IA activée"
                    description="Activer les fonctionnalités d'IA (descriptions auto, recommandations, etc.)"
                    value={!!settings.aiEnabled}
                    onChange={() => update("aiEnabled", !settings.aiEnabled)}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-blue-100 p-2">
                    <Bell className="h-5 w-5 text-blue-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">Notifications</h2>
                </div>
                <div className="space-y-3">
                  <Toggle
                    label="Notifications activées"
                    description="Système de notifications push et in-app"
                    value={!!settings.notificationsEnabled}
                    onChange={() =>
                      update("notificationsEnabled", !settings.notificationsEnabled)
                    }
                  />
                  <Toggle
                    label="Système d'emails"
                    description="Envoi d'emails transactionnels et marketing"
                    value={!!settings.emailsEnabled}
                    onChange={() => update("emailsEnabled", !settings.emailsEnabled)}
                  />
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-orange-100 p-2">
                    <Wrench className="h-5 w-5 text-orange-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">Maintenance</h2>
                </div>
                <div className="space-y-4">
                  <Toggle
                    label="Mode maintenance"
                    description="Mettre le site en pause — seuls les admins pourront se connecter"
                    value={!!settings.maintenanceMode}
                    onChange={() =>
                      update("maintenanceMode", !settings.maintenanceMode)
                    }
                  />
                  {settings.maintenanceMode && (
                    <div className="flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
                      <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-500" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">
                          Mode maintenance actif
                        </p>
                        <p className="mt-1 text-xs text-amber-600">
                          Le site est actuellement en pause. Seuls les administrateurs
                          peuvent accéder au panneau. Les clients et vendeurs verront une
                          page de maintenance.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </Card>

              <SaveButton
                keys={["aiEnabled", "notificationsEnabled", "emailsEnabled", "maintenanceMode"]}
                onClick={() =>
                  handleSave([
                    "aiEnabled",
                    "notificationsEnabled",
                    "emailsEnabled",
                    "maintenanceMode",
                  ])
                }
              />
            </div>
          )}

          {activeTab === "security" && (
            <div className="space-y-6">
              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-red-100 p-2">
                    <Lock className="h-5 w-5 text-red-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">
                    Sessions actives
                  </h2>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="rounded-xl bg-indigo-100 p-3">
                    <Users className="h-6 w-6 text-[#7126b6]" />
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-[#0f172a]">—</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">sessions actives</p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                  Fonctionnalité à venir — permet de suivre et révoquer les sessions
                  actives des administrateurs.
                </p>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-amber-100 p-2">
                    <Key className="h-5 w-5 text-amber-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">Clés API</h2>
                </div>
                <div className="space-y-3">
                  {[
                    { label: "Stripe", key: "stripeKey", prefix: "pk_live_" },
                    { label: "PayPal", key: "paypalKey", prefix: "AeA..." },
                    { label: "Flutterwave", key: "flutterwaveKey", prefix: "FLWPUBK-" },
                  ].map((item) => {
                    const val = (settings[item.key] as string) || "";
                    const masked =
                      val.length > 12
                        ? val.substring(0, 8) + "••••••••" + val.substring(val.length - 4)
                        : val
                        ? "••••••••••••"
                        : "Non configuré";
                    return (
                      <div
                        key={item.key}
                        className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 p-4"
                      >
                        <div>
                          <p className="text-sm font-medium text-[#0f172a]">
                            {item.label}
                          </p>
                          <p className="mt-0.5 font-mono text-xs text-gray-400 dark:text-gray-500">
                            {masked}
                          </p>
                        </div>
                        <span
                          className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium ${
                            val
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {val ? "Configuré" : "Non défini"}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-6">
                <div className="flex items-center gap-2 mb-5">
                  <div className="rounded-lg bg-emerald-100 p-2">
                    <Fingerprint className="h-5 w-5 text-emerald-600" />
                  </div>
                  <h2 className="text-lg font-semibold text-[#0f172a]">
                    Authentification à deux facteurs
                  </h2>
                </div>
                <div className="flex items-center gap-4 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
                  <div className="rounded-xl bg-emerald-100 p-3">
                    <Shield className="h-6 w-6 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-[#0f172a]">2FA</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      Status : <span className="font-medium text-gray-700 dark:text-gray-300">À configurer</span>
                    </p>
                  </div>
                </div>
                <p className="mt-3 text-xs text-gray-400 dark:text-gray-500">
                  Fonctionnalité à venir — activez la double authentification pour
                  renforcer la sécurité des comptes administrateurs.
                </p>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
