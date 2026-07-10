"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Store,
  Gift,
  Clock,
  Percent,
  ArrowRight,
  ArrowLeft,
  Upload,
  Camera,
  Image as ImageIcon,
  CheckCircle2,
  Smartphone,
  CreditCard,
  Wallet,
  Check,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useSiteSettings } from "@/contexts/site-settings-context";
import { BRAND } from "@/lib/brand";

interface OnboardingState {
  shopName: string;
  shopDescription: string;
  logo: string;
  banner: string;
  phone: string;
  email: string;
  address: string;
  city: string;
  paymentMethods: string[];
  firstProduct: { name: string; price: number; type: string } | null;
  shopId: string;
  shopSlug: string;
}

const TOTAL_STEPS = 7;

const STEP_LABELS = [
  "Bienvenue",
  "Boutique",
  "Image",
  "Contact",
  "Paiement",
  "Produit",
  "Terminé",
];

export default function OnboardingPage() {
  const router = useRouter();
  const { settings } = useSiteSettings();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [state, setState] = useState<OnboardingState>({
    shopName: "",
    shopDescription: "",
    logo: "",
    banner: "",
    phone: "",
    email: "",
    address: "",
    city: "",
    paymentMethods: [],
    firstProduct: null,
    shopId: "",
    shopSlug: "",
  });

  const updateState = (updates: Partial<OnboardingState>) => {
    setState((prev) => ({ ...prev, ...updates }));
    setErrors({});
  };

  const validateStep2 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!state.shopName || state.shopName.length < 2) {
      newErrors.shopName = "Le nom doit contenir au moins 2 caractères";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateStep4 = (): boolean => {
    const newErrors: Record<string, string> = {};
    if (!state.city || state.city.length < 2) {
      newErrors.city = "La ville est requise";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (step === 2 && !validateStep2()) return;
    if (step === 4 && !validateStep4()) return;
    if (step < TOTAL_STEPS) setStep(step + 1);
  };

  const handleBack = () => {
    if (step > 1) setStep(step - 1);
  };

  const handleFinish = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/vendor/onboarding", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          shopName: state.shopName,
          shopDescription: state.shopDescription,
          logo: state.logo,
          banner: state.banner,
          phone: state.phone,
          email: state.email,
          address: state.address,
          city: state.city,
          paymentMethods: state.paymentMethods,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setErrors({ submit: data.error || "Erreur lors de la création" });
        setLoading(false);
        return;
      }

      setState((prev) => ({
        ...prev,
        shopId: data.id,
        shopSlug: data.slug,
      }));
      setStep(7);
    } catch {
      setErrors({ submit: "Erreur de connexion" });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateProduct = async () => {
    if (!state.firstProduct) return;
    setLoading(true);
    try {
      await fetch("/api/vendor/products", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: state.firstProduct.name,
          price: state.firstProduct.price,
          productType: state.firstProduct.type,
        }),
      });
    } catch {
      // Product creation is optional
    } finally {
      setLoading(false);
    }
  };

  const togglePaymentMethod = (method: string) => {
    setState((prev) => {
      const methods = prev.paymentMethods.includes(method)
        ? prev.paymentMethods.filter((m) => m !== method)
        : [...prev.paymentMethods, method];
      return { ...prev, paymentMethods: methods };
    });
  };

  const handleFileUpload = async (
    file: File,
    folder: string
  ): Promise<string | null> => {
    const formData = new FormData();
    formData.append("file", file);
    formData.append("folder", folder);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await res.json();
      if (res.ok) return data.url;
      return null;
    } catch {
      return null;
    }
  };

  const renderProgressBar = () => (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-2">
        {STEP_LABELS.map((label, i) => {
          const stepNum = i + 1;
          const isActive = stepNum === step;
          const isCompleted = stepNum < step;
          return (
            <div key={i} className="flex flex-col items-center flex-1">
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
            </div>
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
      case 1:
        return <Step1Welcome />;
      case 2:
        return <Step2ShopInfo />;
      case 3:
        return <Step3Branding />;
      case 4:
        return <Step4Contact />;
      case 5:
        return <Step5Payment />;
      case 6:
        return <Step6Product />;
      case 7:
        return <Step7Done />;
      default:
        return null;
    }
  };

  const Step1Welcome = () => (
    <div className="text-center space-y-8">
      <div className="flex justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-purple-100">
          <Store className="h-12 w-12 text-[#7126b6]" />
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Bienvenue sur {settings.siteName || BRAND.name} !
        </h1>
        <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
          Créez votre boutique en quelques étapes simples. C&apos;est rapide et
          gratuit.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
            <Gift className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">
            Gratuit pour toujours
          </h3>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-blue-100">
            <Clock className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">
            5 minutes de configuration
          </h3>
        </div>
        <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-purple-100">
            <Percent className="h-6 w-6 text-purple-600" />
          </div>
          <h3 className="mt-3 font-semibold text-gray-900 dark:text-gray-100">
            Commission de seulement 5%
          </h3>
        </div>
      </div>

      <Button
        onClick={() => setStep(2)}
        size="lg"
        className="gap-2 px-8"
      >
        Commencer
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );

  const Step2ShopInfo = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Informations de la boutique
        </h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Donnez un nom et une description à votre boutique
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Nom de la boutique *"
          id="shopName"
          placeholder="Ex: Boutique Mode Paris"
          value={state.shopName}
          onChange={(e) => updateState({ shopName: e.target.value })}
          error={errors.shopName}
        />
        <Textarea
          label="Description"
          id="shopDescription"
          placeholder="Décrivez ce que vous vendez..."
          value={state.shopDescription}
          onChange={(e) => updateState({ shopDescription: e.target.value })}
        />
      </div>
    </div>
  );

  const Step3Branding = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Image de marque</h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Personnalisez l&apos;apparence de votre boutique
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Logo
          </label>
          <label
            className="flex flex-col items-center justify-center w-32 h-32 mx-auto rounded-full border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-[#7126b6] transition-colors overflow-hidden"
          >
            {state.logo ? (
              <img
                src={state.logo}
                alt="Logo"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <Camera className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
                <span className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  Ajouter un logo
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await handleFileUpload(file, "shops/logos");
                  if (url) updateState({ logo: url });
                }
              }}
            />
          </label>
        </div>

        {/* Banner upload */}
        <div>
          <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
            Bannière
          </label>
          <label className="flex flex-col items-center justify-center w-full h-32 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/50 cursor-pointer hover:border-[#7126b6] transition-colors overflow-hidden">
            {state.banner ? (
              <img
                src={state.banner}
                alt="Banner"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="text-center">
                <ImageIcon className="mx-auto h-8 w-8 text-gray-400 dark:text-gray-500" />
                <span className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Ajouter une bannière
                </span>
              </div>
            )}
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={async (e) => {
                const file = e.target.files?.[0];
                if (file) {
                  const url = await handleFileUpload(file, "shops/banners");
                  if (url) updateState({ banner: url });
                }
              }}
            />
          </label>
        </div>
      </div>

      <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
        Ces éléments rendront votre boutique plus professionnelle.
      </p>
    </div>
  );

  const Step4Contact = () => (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
          Contact et localisation
        </h2>
        <p className="mt-1 text-gray-500 dark:text-gray-400">
          Comment vos clients peuvent-ils vous contacter ?
        </p>
      </div>

      <div className="space-y-4">
        <Input
          label="Téléphone"
          id="phone"
          type="tel"
          placeholder="+229 XX XX XX XX"
          value={state.phone}
          onChange={(e) => updateState({ phone: e.target.value })}
        />
        <Input
          label="Email"
          id="email"
          type="email"
          placeholder="contact@maboutique.com"
          value={state.email}
          onChange={(e) => updateState({ email: e.target.value })}
        />
        <Input
          label="Adresse"
          id="address"
          placeholder="Quartier, rue..."
          value={state.address}
          onChange={(e) => updateState({ address: e.target.value })}
        />
        <Input
          label="Ville *"
          id="city"
          placeholder="Cotonou"
          value={state.city}
          onChange={(e) => updateState({ city: e.target.value })}
          error={errors.city}
        />
        <Input
          label="Pays"
          id="country"
          value="Bénin"
          disabled
        />
      </div>
    </div>
  );

  const Step5Payment = () => {
    const methods = [
      {
        id: "mobile_money",
        label: "Mobile Money",
        desc: "Wave, Moov Money, MTN",
        icon: Smartphone,
      },
      {
        id: "card",
        label: "Carte bancaire",
        desc: "Visa, Mastercard",
        icon: CreditCard,
      },
      {
        id: "paypal",
        label: "PayPal",
        desc: "Paiement international",
        icon: Wallet,
      },
    ];

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Moyens de paiement
          </h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            Choisissez comment vous souhaitez être payé
          </p>
        </div>

        <div className="space-y-3">
          {methods.map((method) => {
            const selected = state.paymentMethods.includes(method.id);
            return (
              <button
                key={method.id}
                onClick={() => togglePaymentMethod(method.id)}
                className={`flex w-full items-center gap-4 rounded-xl border-2 p-4 text-left transition-all ${
                  selected
                    ? "border-[#7126b6] bg-purple-50"
                    : "border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:border-gray-600"
                }`}
              >
                <div
                  className={`flex h-12 w-12 items-center justify-center rounded-lg ${
                    selected ? "bg-purple-100" : "bg-gray-100 dark:bg-gray-700"
                  }`}
                >
                  <method.icon
                    className={`h-6 w-6 ${selected ? "text-[#7126b6]" : "text-gray-500 dark:text-gray-400"}`}
                  />
                </div>
                <div className="flex-1">
                  <p className="font-semibold text-gray-900 dark:text-gray-100">{method.label}</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{method.desc}</p>
                </div>
                <div
                  className={`flex h-6 w-6 items-center justify-center rounded-full border-2 ${
                    selected
                      ? "border-[#7126b6] bg-[#7126b6]"
                      : "border-gray-300 dark:border-gray-600"
                  }`}
                >
                  {selected && <Check className="h-4 w-4 text-white" />}
                </div>
              </button>
            );
          })}
        </div>

        <p className="text-sm text-gray-400 dark:text-gray-500 text-center">
          Vous pourrez modifier ces options plus tard dans les paramètres.
        </p>
      </div>
    );
  };

  const Step6Product = () => {
    const [showForm, setShowForm] = useState(false);

    return (
      <div className="space-y-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Ajoutez votre premier produit
          </h2>
          <p className="mt-1 text-gray-500 dark:text-gray-400">
            C&apos;est optionnel, vous pouvez le faire plus tard.
          </p>
        </div>

        {!showForm ? (
          <div className="flex flex-col gap-3">
            <Button
              onClick={() => setShowForm(true)}
              size="lg"
              className="gap-2"
            >
              <Upload className="h-5 w-5" />
              Ajouter un produit maintenant
            </Button>
            <Button
              onClick={() => setStep(7)}
              variant="outline"
              size="lg"
            >
              Passer cette étape
            </Button>
          </div>
        ) : (
          <div className="space-y-4 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6">
            <Input
              label="Nom du produit"
              id="productName"
              placeholder="Ex: T-Shirt Premium"
              value={state.firstProduct?.name || ""}
              onChange={(e) =>
                updateState({
                  firstProduct: {
                    name: e.target.value,
                    price: state.firstProduct?.price || 0,
                    type: state.firstProduct?.type || "PHYSICAL",
                  },
                })
              }
            />
            <Input
              label="Prix (FCFA)"
              id="productPrice"
              type="number"
              placeholder="Ex: 15000"
              value={state.firstProduct?.price || ""}
              onChange={(e) =>
                updateState({
                  firstProduct: {
                    name: state.firstProduct?.name || "",
                    price: parseFloat(e.target.value) || 0,
                    type: state.firstProduct?.type || "PHYSICAL",
                  },
                })
              }
            />
            <div>
              <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
                Type
              </label>
              <div className="flex gap-4">
                {["PHYSICAL", "DIGITAL"].map((type) => (
                  <label
                    key={type}
                    className={`flex items-center gap-2 cursor-pointer rounded-lg border px-4 py-2 ${
                      state.firstProduct?.type === type
                        ? "border-[#7126b6] bg-purple-50 text-[#7126b6]"
                        : "border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                    }`}
                  >
                    <input
                      type="radio"
                      name="productType"
                      value={type}
                      checked={state.firstProduct?.type === type}
                      onChange={() =>
                        updateState({
                          firstProduct: {
                            name: state.firstProduct?.name || "",
                            price: state.firstProduct?.price || 0,
                            type,
                          },
                        })
                      }
                      className="hidden"
                    />
                    {type === "PHYSICAL" ? "Physique" : "Digital"}
                  </label>
                ))}
              </div>
            </div>

            <div className="flex gap-3 pt-2">
              <Button
                onClick={async () => {
                  await handleCreateProduct();
                  setStep(7);
                }}
                disabled={!state.firstProduct?.name || !state.firstProduct?.price}
                className="gap-2"
              >
                Sauvegarder et continuer
                <ChevronRight className="h-4 w-4" />
              </Button>
              <Button
                onClick={() => setStep(7)}
                variant="outline"
              >
                Passer
              </Button>
            </div>
          </div>
        )}
      </div>
    );
  };

  const Step7Done = () => (
      <div className="text-center space-y-8">
      <div className="flex justify-center">
        <div className="flex h-24 w-24 items-center justify-center rounded-full bg-green-100">
          <CheckCircle2 className="h-12 w-12 text-green-600" />
        </div>
      </div>

      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
          Votre boutique est prête !
        </h1>
        <p className="mt-3 text-lg text-gray-500 dark:text-gray-400">
          Félicitations ! Votre boutique a été créée avec succès.
        </p>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 text-left max-w-md mx-auto space-y-3">
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">Nom</span>
          <p className="font-semibold text-gray-900 dark:text-gray-100">{state.shopName}</p>
        </div>
        <div>
          <span className="text-sm text-gray-500 dark:text-gray-400">URL</span>
          <p className="font-medium text-[#7126b6] break-all">
            {typeof window !== "undefined" ? window.location.host : ""}/shops/{state.shopSlug}
          </p>
        </div>
        <a
          href={`/shops/${state.shopSlug}`}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 text-sm font-medium text-[#7126b6] hover:underline mt-2"
        >
          Visiter ma boutique
          <ArrowRight className="h-4 w-4" />
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-2xl mx-auto">
        <Link
          href="/vendor/products/new"
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center hover:border-purple-300 transition-colors"
        >
          <p className="font-medium text-gray-900 dark:text-gray-100">Ajoutez plus de produits</p>
        </Link>
        <Link
          href="/vendor/settings"
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center hover:border-purple-300 transition-colors"
        >
          <p className="font-medium text-gray-900 dark:text-gray-100">
            Personnalisez les paramètres
          </p>
        </Link>
        <Link
          href="/vendor"
          className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 text-center hover:border-purple-300 transition-colors"
        >
          <p className="font-medium text-gray-900 dark:text-gray-100">Passez à la boutique</p>
        </Link>
      </div>

      <Button
        onClick={() => router.push("/vendor")}
        size="lg"
        className="gap-2 px-8"
      >
        Accéder à mon tableau de bord
        <ArrowRight className="h-5 w-5" />
      </Button>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-800/50">
      <div className="mx-auto max-w-2xl px-4 py-8">
        <p className="mb-4 text-center text-sm text-gray-500 dark:text-gray-400">
          Étape {step} sur {TOTAL_STEPS}
        </p>

        {renderProgressBar()}

        <div className="rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 md:p-8 shadow-sm">
          {errors.submit && (
            <div className="mb-6 rounded-lg bg-red-50 p-3 text-sm text-red-700">
              {errors.submit}
            </div>
          )}

          {renderStep()}

          {step > 1 && step < 7 && (
            <div className="mt-8 flex items-center justify-between">
              <Button
                onClick={handleBack}
                variant="ghost"
                className="gap-2"
              >
                <ArrowLeft className="h-4 w-4" />
                Retour
              </Button>

              {step < 6 ? (
                <Button
                  onClick={handleNext}
                  className="gap-2"
                >
                  Suivant
                  <ArrowRight className="h-4 w-4" />
                </Button>
              ) : (
                <Button
                  onClick={handleFinish}
                  disabled={loading}
                  className="gap-2 bg-[#7126b6] hover:bg-[#5e1f99]"
                >
                  {loading ? "Création..." : "Terminer"}
                  <Check className="h-4 w-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
