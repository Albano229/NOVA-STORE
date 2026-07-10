"use client";

import { useRouter } from "next/navigation";
import { useState, useCallback } from "react";
import Link from "next/link";
import {
  Store,
  ArrowRight,
  ArrowLeft,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Smartphone,
  Check,
  Loader2,
  Package,
  Wrench,
  Calendar,
  HelpCircle,
  Palette,
  Globe,
  MapPin,
  Phone,
  Mail,
  ShoppingBag,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";

interface WizardState {
  experience: string;
  shopName: string;
  logo: string;
  banner: string;
  description: string;
  storeTypes: string[];
  country: string;
  city: string;
  address: string;
  phone: string;
  email: string;
  primaryColor: string;
  secondaryColor: string;
  theme: string;
}

const TOTAL_STEPS = 6;

const STEP_LABELS = [
  "Bienvenue",
  "Boutique",
  "Type",
  "Coordonnées",
  "Apparence",
  "Résumé",
];

const STORE_TYPE_OPTIONS = [
  { id: "PHYSICAL", label: "Produits physiques", desc: "Vêtements, appareils, accessoires, alimentation", icon: Package },
  { id: "DIGITAL", label: "Produits digitaux", desc: "Ebooks, formations, logiciels, fichiers numériques", icon: Smartphone },
  { id: "SERVICE", label: "Services", desc: "Consultation, réparation, coaching, prestations", icon: Wrench },
  { id: "BOOKING", label: "Réservations / événements", desc: "Réservation de salles, événements, rendez-vous", icon: Calendar },
  { id: "OTHER", label: "Autre", desc: "Autre type de produit ou service", icon: HelpCircle },
];

const THEME_PRESETS = [
  { id: "moderne", label: "Moderne", primary: "#7126b6", secondary: "#1e40af" },
  { id: "elegant", label: "Élégant", primary: "#111827", secondary: "#6b7280" },
  { id: "chaleureux", label: "Chaleureux", primary: "#dc2626", secondary: "#f59e0b" },
  { id: "nature", label: "Nature", primary: "#059669", secondary: "#10b981" },
  { id: "ocean", label: "Océan", primary: "#0284c7", secondary: "#0ea5e9" },
  { id: "custom", label: "Personnalisé", primary: "#7126b6", secondary: "#7c3aed" },
];

const COUNTRIES = [
  "Bénin", "Togo", "Niger", "Burkina Faso", "Côte d'Ivoire",
  "Sénégal", "Mali", "Cameroun", "République du Congo", "Gabon", "France", "Autre",
];

function Step1Welcome({ state, update }: { state: WizardState; update: (u: Partial<WizardState>) => void }) {
  return (
    <div className="flex flex-col items-center justify-center text-center space-y-8 py-8">
      <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-100">
        <Store className="h-12 w-12 text-[#7126b6]" />
      </div>
      <div className="space-y-3">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">Bienvenue sur Nova Store</h1>
        <p className="text-lg text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Créez votre boutique en quelques étapes et commencez à vendre.
        </p>
      </div>
      <div className="w-full max-w-sm space-y-4">
        <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Avez-vous déjà vendu en ligne ?</p>
        <div className="flex gap-3">
          <button
            type="button"
            onClick={() => update({ experience: "debutant" })}
            className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${
              state.experience === "debutant"
                ? "border-[#7126b6] bg-purple-50 text-[#7126b6]"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
            }`}
          >
            <ShoppingBag className="mx-auto h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Débutant</span>
          </button>
          <button
            type="button"
            onClick={() => update({ experience: "experimente" })}
            className={`flex-1 rounded-xl border-2 p-4 text-center transition-all ${
              state.experience === "experimente"
                ? "border-[#7126b6] bg-purple-50 text-[#7126b6]"
                : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:border-gray-300"
            }`}
          >
            <CheckCircle2 className="mx-auto h-6 w-6 mb-2" />
            <span className="text-sm font-medium">Expérimenté</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function Step2ShopInfo({ state, update, errors, uploadFile }: { state: WizardState; update: (u: Partial<WizardState>) => void; errors: Record<string, string>; uploadFile: (file: File, folder: string) => Promise<string | null> }) {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Informations de la boutique</h2>
        <p className="text-gray-500 dark:text-gray-400">Donnez un nom et une identité à votre boutique</p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Nom de la boutique *</label>
          <input
            type="text"
            value={state.shopName}
            onChange={(e) => update({ shopName: e.target.value })}
            placeholder="Ex: Ma Super Boutique"
            autoComplete="off"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
          />
          {errors.shopName && <p className="mt-1 text-sm text-red-600">{errors.shopName}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
          <textarea
            value={state.description}
            onChange={(e) => update({ description: e.target.value })}
            placeholder="Décrivez ce que vous vendez..."
            rows={3}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20 min-h-[100px] resize-y"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Logo (optionnel)</label>
            <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-[#7126b6] transition-colors overflow-hidden">
              {state.logo ? (
                <img src={state.logo} alt="Logo" className="w-full h-full object-contain p-2" />
              ) : (
                <div className="text-center">
                  <Camera className="mx-auto h-6 w-6 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ajouter</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast.loading("Upload...");
                    const url = await uploadFile(file, "shops/logos");
                    toast.dismiss();
                    if (url) { update({ logo: url }); toast.success("Logo uploadé"); }
                  }
                }}
              />
            </label>
          </div>
          <div>
            <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">Bannière (optionnel)</label>
            <label className="flex flex-col items-center justify-center h-28 rounded-xl border-2 border-dashed border-gray-300 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-[#7126b6] transition-colors overflow-hidden">
              {state.banner ? (
                <img src={state.banner} alt="Banner" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center">
                  <ImageIcon className="mx-auto h-6 w-6 text-gray-400 dark:text-gray-500" />
                  <span className="text-xs text-gray-500 dark:text-gray-400 mt-1">Ajouter</span>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={async (e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    toast.loading("Upload...");
                    const url = await uploadFile(file, "shops/banners");
                    toast.dismiss();
                    if (url) { update({ banner: url }); toast.success("Bannière uploadée"); }
                  }
                }}
              />
            </label>
          </div>
        </div>
      </div>
    </div>
  );
}

function Step3StoreType({ state, update, errors }: { state: WizardState; update: (u: Partial<WizardState>) => void; errors: Record<string, string> }) {
  const toggle = (typeId: string) => {
    const types = state.storeTypes.includes(typeId)
      ? state.storeTypes.filter((t) => t !== typeId)
      : [...state.storeTypes, typeId];
    update({ storeTypes: types });
  };

  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Type de boutique</h2>
        <p className="text-gray-500 dark:text-gray-400">Que souhaitez-vous vendre ?</p>
      </div>
      {errors.storeTypes && (
        <p className="text-sm text-red-600 text-center">{errors.storeTypes}</p>
      )}
      <div className="space-y-3">
        {STORE_TYPE_OPTIONS.map((option) => {
          const selected = state.storeTypes.includes(option.id);
          return (
            <button
              key={option.id}
              type="button"
              onClick={() => toggle(option.id)}
              className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                selected
                  ? "border-[#7126b6] bg-purple-50"
                  : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300"
              }`}
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                selected ? "bg-purple-100" : "bg-gray-100 dark:bg-gray-700"
              }`}>
                <option.icon className={`h-6 w-6 ${selected ? "text-[#7126b6]" : "text-gray-500 dark:text-gray-400"}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{option.label}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 truncate">{option.desc}</p>
              </div>
              <div className={`flex h-6 w-6 items-center justify-center rounded-full border-2 flex-shrink-0 ${
                selected ? "border-[#7126b6] bg-[#7126b6]" : "border-gray-300"
              }`}>
                {selected && <Check className="h-4 w-4 text-white" />}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function Step4Contact({ state, update, errors }: { state: WizardState; update: (u: Partial<WizardState>) => void; errors: Record<string, string> }) {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Coordonnées</h2>
        <p className="text-gray-500 dark:text-gray-400">Où êtes-vous situé ?</p>
      </div>
      <div className="space-y-4">
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Globe className="h-4 w-4" /> Pays *
          </label>
          <select
            value={state.country}
            onChange={(e) => update({ country: e.target.value })}
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
          >
            {COUNTRIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <MapPin className="h-4 w-4" /> Ville *
          </label>
          <input
            type="text"
            value={state.city}
            onChange={(e) => update({ city: e.target.value })}
            placeholder="Ex: Cotonou"
            autoComplete="address-level2"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
          />
          {errors.city && <p className="mt-1 text-sm text-red-600">{errors.city}</p>}
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-300">Adresse complète (optionnel)</label>
          <input
            type="text"
            value={state.address}
            onChange={(e) => update({ address: e.target.value })}
            placeholder="Quartier, rue, numéro"
            autoComplete="street-address"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Phone className="h-4 w-4" /> Téléphone boutique (optionnel)
          </label>
          <input
            type="tel"
            value={state.phone}
            onChange={(e) => update({ phone: e.target.value })}
            placeholder="+229 XX XX XX XX"
            autoComplete="tel"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
          />
        </div>
        <div>
          <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
            <Mail className="h-4 w-4" /> Email public boutique (optionnel)
          </label>
          <input
            type="email"
            value={state.email}
            onChange={(e) => update({ email: e.target.value })}
            placeholder="contact@maboutique.com"
            autoComplete="email"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm placeholder:text-gray-400 dark:text-gray-500 focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
          />
        </div>
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Les coordonnées privées de votre compte ne seront pas affichées publiquement.
      </p>
    </div>
  );
}

function Step5Appearance({ state, update }: { state: WizardState; update: (u: Partial<WizardState>) => void }) {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Personnalisation</h2>
        <p className="text-gray-500 dark:text-gray-400">Choisissez l&apos;apparence de votre boutique</p>
      </div>
      <div className="space-y-5">
        <div>
          <label className="mb-3 block text-sm font-medium text-gray-700 dark:text-gray-300">Style du thème</label>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            {THEME_PRESETS.map((preset) => (
              <button
                key={preset.id}
                type="button"
                onClick={() => update({
                  theme: preset.id,
                  primaryColor: preset.primary,
                  secondaryColor: preset.secondary,
                })}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-3 text-center transition-all ${
                  state.theme === preset.id
                    ? "border-[#7126b6] bg-purple-50"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300"
                }`}
              >
                <div className="flex gap-1">
                  <div className="h-5 w-5 rounded-full" style={{ backgroundColor: preset.primary }} />
                  <div className="h-5 w-5 rounded-full" style={{ backgroundColor: preset.secondary }} />
                </div>
                <span className="text-xs font-medium text-gray-700 dark:text-gray-300">{preset.label}</span>
              </button>
            ))}
          </div>
        </div>
        {state.theme === "custom" && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Palette className="h-4 w-4" /> Principale
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={state.primaryColor}
                  onChange={(e) => update({ primaryColor: e.target.value })}
                  className="h-10 w-10 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={state.primaryColor}
                  onChange={(e) => update({ primaryColor: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-2 text-sm font-medium text-gray-700 dark:text-gray-300">
                <Palette className="h-4 w-4" /> Secondaire
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={state.secondaryColor}
                  onChange={(e) => update({ secondaryColor: e.target.value })}
                  className="h-10 w-10 rounded-lg border border-gray-300 cursor-pointer"
                />
                <input
                  type="text"
                  value={state.secondaryColor}
                  onChange={(e) => update({ secondaryColor: e.target.value })}
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                />
              </div>
            </div>
          </div>
        )}
      </div>
      <p className="text-xs text-gray-400 dark:text-gray-500 text-center">
        Toutes les options restent modifiables dans Paramètres → Apparence.
      </p>
    </div>
  );
}

function Step6Review({ state }: { state: WizardState }) {
  return (
    <div className="space-y-6 py-4">
      <div className="text-center space-y-2">
        <div className="flex justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Résumé de votre boutique</h2>
        <p className="text-gray-500 dark:text-gray-400">Vérifiez les informations avant de créer</p>
      </div>
      <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 space-y-4">
        {state.banner && (
          <div className="overflow-hidden rounded-xl h-24">
            <img src={state.banner} alt="Bannière" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-center gap-3">
          {state.logo ? (
            <img src={state.logo} alt="Logo" className="h-14 w-14 rounded-xl object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-xl text-lg font-bold text-white" style={{ backgroundColor: state.primaryColor }}>
              {state.shopName ? state.shopName.charAt(0).toUpperCase() : "S"}
            </div>
          )}
          <div>
            <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">{state.shopName || "Ma boutique"}</h3>
            <div className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400">
              <MapPin className="h-3.5 w-3.5" />
              {state.city || "Ville"}, {state.country}
            </div>
          </div>
        </div>
        {state.description && (
          <p className="text-sm text-gray-600 dark:text-gray-400">{state.description}</p>
        )}
        <div className="flex flex-wrap gap-2">
          {state.storeTypes.map((type) => {
            const opt = STORE_TYPE_OPTIONS.find((o) => o.id === type);
            return opt ? (
              <span key={type} className="rounded-full bg-purple-50 px-3 py-1 text-xs font-medium text-[#7126b6]">
                {opt.label}
              </span>
            ) : null;
          })}
        </div>
        <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
          <div className="flex gap-1.5">
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: state.primaryColor }} />
            <div className="h-4 w-4 rounded-full" style={{ backgroundColor: state.secondaryColor }} />
          </div>
          <span>Thème {state.theme}</span>
        </div>
        {(state.phone || state.email) && (
          <div className="space-y-1 text-sm text-gray-500 dark:text-gray-400">
            {state.phone && <div className="flex items-center gap-2"><Phone className="h-3.5 w-3.5" /> {state.phone}</div>}
            {state.email && <div className="flex items-center gap-2"><Mail className="h-3.5 w-3.5" /> {state.email}</div>}
          </div>
        )}
      </div>
    </div>
  );
}

export default function CreateStorePage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [state, setState] = useState<WizardState>({
    experience: "",
    shopName: "",
    logo: "",
    banner: "",
    description: "",
    storeTypes: [],
    country: "Bénin",
    city: "",
    address: "",
    phone: "",
    email: "",
    primaryColor: "#7126b6",
    secondaryColor: "#1e40af",
    theme: "moderne",
  });

  const updateState = useCallback((updates: Partial<WizardState>) => {
    setState((prev) => ({ ...prev, ...updates }));
    setErrors({});
  }, []);

  const uploadFile = useCallback(async (file: File, folder: string): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      const data = await res.json();
      if (res.ok && data.url) return data.url;
      toast.error(data.error || "Erreur upload");
      return null;
    } catch {
      toast.error("Erreur réseau");
      return null;
    }
  }, []);

  const validateStep = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};
    if (step === 2 && (!state.shopName || state.shopName.length < 2)) {
      newErrors.shopName = "Le nom doit contenir au moins 2 caractères";
    }
    if (step === 3 && state.storeTypes.length === 0) {
      newErrors.storeTypes = "Sélectionnez au moins un type de boutique";
    }
    if (step === 4 && (!state.city || state.city.length < 2)) {
      newErrors.city = "La ville est requise";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [step, state.shopName, state.storeTypes.length, state.city]);

  const handleNext = useCallback(() => {
    if (!validateStep()) return;
    if (step < TOTAL_STEPS) setStep(step + 1);
  }, [validateStep, step]);

  const handleBack = useCallback(() => {
    if (step > 1) setStep(step - 1);
  }, [step]);

  const handleFinish = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: state.shopName,
          shopDescription: state.description,
          logo: state.logo,
          banner: state.banner,
          phone: state.phone,
          email: state.email,
          address: state.address,
          city: state.city,
          country: state.country,
          storeType: state.storeTypes[0] || "PHYSICAL",
          primaryColor: state.primaryColor,
          secondaryColor: state.secondaryColor,
          theme: state.theme,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Erreur lors de la création");
        setLoading(false);
        return;
      }

      toast.success("Boutique créée avec succès !");
      router.push(`/stores/${data.id}/dashboard`);
    } catch {
      toast.error("Erreur de connexion");
    } finally {
      setLoading(false);
    }
  }, [state, router]);

  const renderProgressBar = () => (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-2">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isCompleted = stepNum < step;
          const isClickable = stepNum < step;
          return (
            <button
              key={i}
              type="button"
              disabled={!isClickable}
              onClick={() => isClickable && setStep(stepNum)}
              className={`flex flex-col items-center flex-1 ${isClickable ? "cursor-pointer" : "cursor-default"}`}
            >
              <div
                className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
                  isCompleted
                    ? "bg-[#7126b6] text-white"
                    : isActive
                      ? "bg-[#7126b6] text-white ring-4 ring-purple-100"
                      : "bg-gray-200 text-gray-500 dark:text-gray-400"
                }`}
              >
                {isCompleted ? <Check className="h-4 w-4" /> : stepNum}
              </div>
              <span
                className={`mt-1 text-[10px] font-medium hidden md:block ${
                  isActive || isCompleted ? "text-[#7126b6]" : "text-gray-400 dark:text-gray-500"
                }`}
              >
                {label}
              </span>
            </button>
          );
        })}
      </div>
      <div className="h-2 w-full rounded-full bg-gray-200 mt-3">
        <div
          className="h-2 rounded-full bg-[#7126b6] transition-all duration-500"
          style={{ width: `${((step - 1) / (TOTAL_STEPS - 1)) * 100}%` }}
        />
      </div>
    </div>
  );

  const renderStep = () => {
    switch (step) {
      case 1: return <Step1Welcome state={state} update={updateState} />;
      case 2: return <Step2ShopInfo state={state} update={updateState} errors={errors} uploadFile={uploadFile} />;
      case 3: return <Step3StoreType state={state} update={updateState} errors={errors} />;
      case 4: return <Step4Contact state={state} update={updateState} errors={errors} />;
      case 5: return <Step5Appearance state={state} update={updateState} />;
      case 6: return <Step6Review state={state} />;
      default: return null;
    }
  };

  return (
    <div className="flex min-h-[100dvh] flex-col bg-gray-50 dark:bg-gray-800/50">
      <div className="flex-1 overflow-y-auto">
        <div className="mx-auto max-w-lg px-4 py-6">
          <Link href="/stores" className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:text-gray-300 mb-4">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>
          {renderProgressBar()}
          <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 md:p-6 shadow-sm dark:shadow-gray-800/20">
            {renderStep()}
          </div>
        </div>
      </div>
      <div className="border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-4">
        <div className="mx-auto max-w-lg flex items-center justify-between">
          {step > 1 ? (
            <Button onClick={handleBack} variant="ghost" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Précédent
            </Button>
          ) : <div />}
          {step < TOTAL_STEPS ? (
            <Button onClick={handleNext} className="gap-2 bg-[#7126b6] hover:bg-[#5e1f99]">
              Continuer
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button onClick={handleFinish} disabled={loading} className="gap-2 bg-[#7126b6] hover:bg-[#5e1f99]">
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Création...
                </>
              ) : (
                <>
                  Créer ma boutique
                  <Check className="h-4 w-4" />
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
