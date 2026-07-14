"use client";

import { useCartStore } from "@/stores/cart";
import { useCurrency } from "@/contexts/currency-context";
import { useSession } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";
import {
  ShieldCheck,
  MapPin,
  User,
  Phone,
  Mail,
  Home,
  Globe,
  ChevronDown,
  Truck,
  Info,
  Tag,
  X,
  Loader2,
  CheckCircle,
} from "lucide-react";
import { PHONE_CODES, COUNTRY_CURRENCY_MAP, getCountryFields } from "@/lib/currencies";

interface ClientInfo {
  firstName: string;
  lastName: string;
  email: string;
  phoneCode: string;
  phone: string;
  address: string;
  postalCode: string;
  city: string;
  country: string;
  notes: string;
}

  type PaymentMethod = "STRIPE" | "MOBILE_MONEY" | "EXPRESS_PAY";

export default function CheckoutPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const { items, getTotal, getVendorGroups, clearCart } = useCartStore();
  const { currency, formatConvertedPrice, convertPrice } = useCurrency();
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("STRIPE");
  const [loading, setLoading] = useState(false);
  const [phoneCodeOpen, setPhoneCodeOpen] = useState(false);
  const [countryOpen, setCountryOpen] = useState(false);
  const [couponCode, setCouponCode] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);
  const [appliedCoupon, setAppliedCoupon] = useState<{ code: string; discount: number; type: string; value: number } | null>(null);

  const defaultCountry = PHONE_CODES.find((c) => c.code === "BJ");

  const [clientInfo, setClientInfo] = useState<ClientInfo>({
    firstName: session?.user?.name?.split(" ")[0] || "",
    lastName: session?.user?.name?.split(" ").slice(1).join(" ") || "",
    email: session?.user?.email || "",
    phoneCode: defaultCountry?.dial || "+229",
    phone: "",
    address: "",
    postalCode: "",
    city: "",
    country: "BJ",
    notes: "",
  });

  const vendorGroups = getVendorGroups();
  const needsShippingAddress = items.some((item) => item.requiresShippingAddress !== false);

  if (items.length === 0) {
    router.push("/cart");
    return null;
  }

  const countryFields = getCountryFields(clientInfo.country);
  const selectedCountry = PHONE_CODES.find((c) => c.code === clientInfo.country);

  const isFCFA = currency.code === "XOF" || currency.code === "XAF";
  const isInternational = !isFCFA;

  const paymentMethods: Array<{ id: PaymentMethod; label: string; icon: string; desc: string; brands: string[]; available: boolean }> = [
    { id: "MOBILE_MONEY", label: "Mobile Money", icon: "📱", desc: "Payer par mobile", brands: ["MTN", "Moov", "Wave", "Celtis", "Orange"], available: true },
    { id: "STRIPE", label: "Carte bancaire", icon: "💳", desc: "Payer par carte", brands: ["Visa", "Mastercard", "EuroCard"], available: true },
    { id: "EXPRESS_PAY", label: "Paiements rapides", icon: "⚡", desc: "Payer en un clic", brands: ["Apple Pay", "Google Pay"], available: isInternational },
  ];

  const getApiPaymentMethod = (method: PaymentMethod): string => {
    if (method === "MOBILE_MONEY") {
      return isFCFA ? "MONEYFUSION" : "FLUTTERWAVE";
    }
    if (method === "EXPRESS_PAY") {
      return "FLUTTERWAVE";
    }
    if (method === "STRIPE") {
      return isFCFA ? "MONEYFUSION" : "FLUTTERWAVE";
    }
    return isFCFA ? "MONEYFUSION" : "FLUTTERWAVE";
  };

  const updateClientInfo = (field: keyof ClientInfo, value: string) => {
    setClientInfo((prev) => {
      const next = { ...prev, [field]: value };
      if (field === "country") {
        const newPhone = PHONE_CODES.find((c) => c.code === value);
        if (newPhone) next.phoneCode = newPhone.dial;
        if (!COUNTRY_CURRENCY_MAP[value]) {
          // Country without known currency, keep current
        }
      }
      return next;
    });
  };

  const validateClientInfo = (): boolean => {
    if (!clientInfo.firstName.trim()) { toast.error("Le prénom est requis"); return false; }
    if (!clientInfo.lastName.trim()) { toast.error("Le nom est requis"); return false; }
    if (!clientInfo.email.trim()) { toast.error("L'email est requis"); return false; }
    if (!clientInfo.phone.trim()) { toast.error("Le téléphone est requis"); return false; }
    if (needsShippingAddress) {
      if (!clientInfo.address.trim()) { toast.error("L'adresse est requise"); return false; }
      if (!clientInfo.city.trim()) { toast.error("La ville est requise"); return false; }
    }
    return true;
  };

  const validateCoupon = async () => {
    if (!couponCode.trim()) return;
    setCouponLoading(true);
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          code: couponCode,
          orderTotal: getTotal(),
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "Code invalide");
        return;
      }
      setAppliedCoupon({
        code: data.coupon.code,
        discount: data.discount,
        type: data.coupon.discountType,
        value: data.coupon.discountValue,
      });
      toast.success(`Réduction de ${data.discount} appliquée !`);
    } catch {
      toast.error("Erreur lors de la validation du code promo");
    } finally {
      setCouponLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode("");
  };

  const getDiscountedTotal = () => {
    const total = getTotal();
    if (!appliedCoupon) return total;
    return Math.max(0, total - appliedCoupon.discount);
  };

  const handleCheckout = async () => {
    if (!validateClientInfo()) return;

    setLoading(true);
    try {
      const apiPaymentMethod = getApiPaymentMethod(paymentMethod);

      const shippingAddress = needsShippingAddress ? {
        firstName: clientInfo.firstName || "",
        lastName: clientInfo.lastName || "",
        email: clientInfo.email || "",
        phone: `${clientInfo.phoneCode}${clientInfo.phone}`,
        address: clientInfo.address || "",
        postalCode: clientInfo.postalCode || "",
        city: clientInfo.city || "",
        country: clientInfo.country || "BJ",
        countryName: selectedCountry?.country || clientInfo.country || "Bénin",
      } : { firstName: "Non applicable", lastName: "Digital", address: "Non applicable (Digital)", city: "N/A", country: "N/A", phone: `${clientInfo.phoneCode}${clientInfo.phone}`, email: clientInfo.email || "", postalCode: "", countryName: "N/A" };

      const orders = [];
      for (const [shopId, shopItems] of Object.entries(vendorGroups)) {
        const shopSubtotal = shopItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
        const shopProportion = shopSubtotal / getTotal();
        const shopDiscount = appliedCoupon ? Math.round(appliedCoupon.discount * shopProportion * 100) / 100 : 0;

        const orderPayload = {
          shopId: shopId || "",
          paymentMethod: apiPaymentMethod,
          currency: currency.code || "XOF",
          items: shopItems.map((item) => ({
            productId: item.productId || "",
            variantId: item.variantId || null,
            quantity: item.quantity || 1,
            price: item.price || 0,
          })),
          subtotal: shopSubtotal || 0,
          discount: shopDiscount || 0,
          shippingAddress,
          clientName: `${clientInfo.firstName || ""} ${clientInfo.lastName || ""}`.trim() || "Client",
          clientEmail: clientInfo.email || "",
          clientPhone: `${clientInfo.phoneCode}${clientInfo.phone}` || "",
          notes: clientInfo.notes || "",
          couponCode: appliedCoupon?.code || null,
        };

        const res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(orderPayload),
        });

        if (!res.ok) {
          const errorBody = await res.json();
          console.error("[CHECKOUT] Erreur API [" + res.status + "]:", errorBody.error);
          throw new Error(errorBody.error || "Erreur lors de la commande");
        }

        orders.push(await res.json());
      }

      const paymentRes = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orderIds: orders.map((o: any) => o.id),
          paymentMethod: apiPaymentMethod,
          currency: currency.code,
          amount: getDiscountedTotal(),
          couponCode: appliedCoupon?.code || null,
          customerEmail: clientInfo.email,
          customerName: `${clientInfo.firstName} ${clientInfo.lastName}`,
          customerPhone: `${clientInfo.phoneCode}${clientInfo.phone}`,
        }),
      });

      const paymentData = await paymentRes.json();

      clearCart();

      if (paymentData.redirectUrl) {
        window.location.href = paymentData.redirectUrl;
        return;
      }

      toast.success("Commande passée avec succès !");
      router.push("/account/orders");
    } catch (error: any) {
      console.error("[CHECKOUT] Erreur:", error?.message);
      toast.error(error.message || "Erreur lors de la commande");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-[#0f172a] dark:text-white">Paiement</h1>
        <div className="flex items-center gap-2 text-sm text-gray-500">
          <Globe className="h-4 w-4" />
          {currency.code}
        </div>
      </div>

      <div className="mt-8 grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          {/* Customer Info */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-[#0f172a] dark:text-white flex items-center gap-2">
              <User className="h-5 w-5 text-[#7126b6]" />
              {needsShippingAddress ? "Vos informations & livraison" : "Vos informations"}
            </h2>
            {!needsShippingAddress && (
              <p className="mt-1 text-xs text-gray-400">Aucune adresse de livraison requise pour cette commande.</p>
            )}
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prénom *</label>
                <input
                  type="text"
                  value={clientInfo.firstName}
                  onChange={(e) => updateClientInfo("firstName", e.target.value)}
                  placeholder="Jean"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#7126b6] focus:ring-1 focus:ring-[#7126b6] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nom *</label>
                <input
                  type="text"
                  value={clientInfo.lastName}
                  onChange={(e) => updateClientInfo("lastName", e.target.value)}
                  placeholder="Dupont"
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#7126b6] focus:ring-1 focus:ring-[#7126b6] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input
                    type="email"
                    value={clientInfo.email}
                    onChange={(e) => updateClientInfo("email", e.target.value)}
                    placeholder="jean@example.com"
                    className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-[#7126b6] focus:ring-1 focus:ring-[#7126b6] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Pays *</label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <select
                    value={clientInfo.country}
                    onChange={(e) => updateClientInfo("country", e.target.value)}
                    className="w-full appearance-none rounded-lg border border-gray-300 pl-10 pr-8 py-2.5 text-sm focus:border-[#7126b6] focus:ring-1 focus:ring-[#7126b6] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  >
                    {PHONE_CODES.map((c) => (
                      <option key={c.code} value={c.code}>{c.country} ({c.dial})</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Téléphone *</label>
                <div className="flex">
                  <div className="relative flex-shrink-0">
                    <select
                      value={clientInfo.phoneCode}
                      onChange={(e) => updateClientInfo("phoneCode", e.target.value)}
                      className="h-full rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 px-2 py-2.5 text-sm focus:outline-none dark:border-gray-600 dark:bg-gray-600 dark:text-white"
                    >
                      {PHONE_CODES.map((c) => (
                        <option key={c.code} value={c.dial}>{c.dial}</option>
                      ))}
                    </select>
                  </div>
                  <input
                    type="tel"
                    value={clientInfo.phone}
                    onChange={(e) => updateClientInfo("phone", e.target.value.replace(/\D/g, ""))}
                    placeholder={selectedCountry?.format || "XX XX XX XX"}
                    className="w-full rounded-r-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#7126b6] focus:ring-1 focus:ring-[#7126b6] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                  />
                </div>
              </div>
              {needsShippingAddress && (
                <>
                  <div className="sm:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Adresse *</label>
                    <div className="relative">
                      <Home className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={clientInfo.address}
                        onChange={(e) => updateClientInfo("address", e.target.value)}
                        placeholder="Quartier, rue, numéro..."
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-[#7126b6] focus:ring-1 focus:ring-[#7126b6] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{countryFields.postalLabel}</label>
                    <input
                      type="text"
                      value={clientInfo.postalCode}
                      onChange={(e) => updateClientInfo("postalCode", e.target.value)}
                      placeholder={countryFields.postalPlaceholder}
                      className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#7126b6] focus:ring-1 focus:ring-[#7126b6] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">{countryFields.cityLabel} *</label>
                    <div className="relative">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                      <input
                        type="text"
                        value={clientInfo.city}
                        onChange={(e) => updateClientInfo("city", e.target.value)}
                        placeholder="Cotonou"
                        className="w-full rounded-lg border border-gray-300 pl-10 pr-3 py-2.5 text-sm focus:border-[#7126b6] focus:ring-1 focus:ring-[#7126b6] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      />
                    </div>
                  </div>
                </>
              )}
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Notes (optionnel)</label>
                <textarea
                  value={clientInfo.notes}
                  onChange={(e) => updateClientInfo("notes", e.target.value)}
                  placeholder="Instructions de livraison..."
                  rows={2}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#7126b6] focus:ring-1 focus:ring-[#7126b6] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                />
              </div>
            </div>
          </div>

          {/* Payment Method */}
          <div className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
            <h2 className="text-lg font-semibold text-[#0f172a] dark:text-white">Mode de paiement</h2>
            <div className="mt-4 space-y-3">
              {paymentMethods.filter((m) => m.available).map((method) => {
                const isSelected = paymentMethod === method.id;
                return (
                  <button
                    key={method.id}
                    onClick={() => setPaymentMethod(method.id)}
                    className={cn(
                      "w-full flex items-center gap-4 rounded-xl border-2 p-4 text-left transition-all",
                      isSelected
                        ? "border-[#7126b6] bg-[#f3e8ff] shadow-sm dark:bg-[#7126b6]/20"
                        : "border-gray-200 hover:border-gray-300 hover:bg-gray-50 dark:border-gray-600 dark:hover:border-gray-500 dark:hover:bg-gray-700/50"
                    )}
                  >
                    <span className="text-2xl flex-shrink-0">{method.icon}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-[#0f172a] dark:text-white">{method.label}</span>
                        {isSelected && <span className="h-2 w-2 rounded-full bg-[#7126b6]" />}
                      </div>
                      <span className="text-xs text-gray-500 dark:text-gray-400">{method.desc}</span>
                    </div>
                    <div className="flex flex-wrap gap-1 justify-end max-w-[140px]">
                      {method.brands.map((brand) => (
                        <span
                          key={brand}
                          className={cn(
                            "inline-block rounded-full px-2 py-0.5 text-[10px] font-medium",
                            brand === "Visa" && "bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300",
                            brand === "Mastercard" && "bg-red-50 text-red-700 dark:bg-red-900/30 dark:text-red-300",
                            brand === "EuroCard" && "bg-green-50 text-green-700 dark:bg-green-900/30 dark:text-green-300",
                            brand === "MTN" && "bg-yellow-50 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300",
                            brand === "Moov" && "bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-300",
                            brand === "Wave" && "bg-cyan-50 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-300",
                            brand === "Celtis" && "bg-orange-50 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300",
                            brand === "Orange" && "bg-orange-50 text-orange-600 dark:bg-orange-900/30 dark:text-orange-300",
                            brand === "Apple Pay" && "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200",
                            brand === "Google Pay" && "bg-gray-50 text-gray-600 dark:bg-gray-700 dark:text-gray-300",
                          )}
                        >
                          {brand}
                        </span>
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Orders by Vendor */}
          {Object.entries(vendorGroups).map(([shopId, shopItems]) => (
            <div key={shopId} className="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-800">
              <div className="flex items-center gap-2">
                <Truck className="h-4 w-4 text-[#7126b6]" />
                <h3 className="text-sm font-semibold text-[#0f172a] dark:text-white">
                  Commande — {shopItems[0].shopName}
                </h3>
              </div>
              <div className="mt-4 divide-y divide-gray-100 dark:divide-gray-700">
                {shopItems.map((item) => (
                  <div key={item.productId} className="flex justify-between py-3">
                    <div>
                      <p className="text-sm font-medium text-[#0f172a] dark:text-white break-words">{item.name}</p>
                      <p className="text-xs text-gray-500">Qté: {item.quantity} × {formatConvertedPrice(item.price, item.currency !== currency.code ? item.currency : undefined)}</p>
                    </div>
                    <p className="text-sm font-semibold text-[#0f172a] dark:text-white">
                      {formatConvertedPrice(item.price * item.quantity, item.currency !== currency.code ? item.currency : undefined)}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Order Summary */}
        <div className="rounded-xl border border-gray-200 bg-white p-6 h-fit dark:border-gray-700 dark:bg-gray-800">
          <h2 className="text-lg font-semibold text-[#0f172a] dark:text-white">Résumé de la commande</h2>
          <div className="mt-4 space-y-3">
            {Object.entries(vendorGroups).map(([shopId, shopItems]) => (
              <div key={shopId} className="flex justify-between text-sm">
                <span className="text-gray-500">{shopItems[0].shopName}</span>
                <span className="dark:text-white">{formatConvertedPrice(shopItems.reduce((sum, item) => sum + item.price * item.quantity, 0))}</span>
              </div>
            ))}
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Livraison</span>
              {needsShippingAddress ? (
                <span className="text-green-600 font-medium">Gratuite</span>
              ) : (
                <span className="text-gray-400">N/A</span>
              )}
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Devise</span>
              <span className="font-medium dark:text-white">{currency.code} ({currency.symbol})</span>
            </div>

            {/* Coupon Input */}
            <div className="pt-2">
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg bg-green-50 px-3 py-2.5 dark:bg-green-900/20">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-600" />
                    <div>
                      <span className="text-sm font-mono font-bold text-green-700 dark:text-green-400">
                        {appliedCoupon.code}
                      </span>
                      <span className="ml-2 text-xs text-green-600 dark:text-green-400">
                        -{formatConvertedPrice(appliedCoupon.discount)}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={removeCoupon}
                    className="rounded p-1 text-green-600 hover:bg-green-100 dark:text-green-400"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      value={couponCode}
                      onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                      placeholder="Code promo"
                      className="w-full rounded-lg border border-gray-300 pl-9 pr-3 py-2.5 text-sm uppercase font-mono focus:border-[#7126b6] focus:ring-1 focus:ring-[#7126b6] focus:outline-none dark:border-gray-600 dark:bg-gray-700 dark:text-white"
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          validateCoupon();
                        }
                      }}
                    />
                  </div>
                  <button
                    onClick={validateCoupon}
                    disabled={couponLoading || !couponCode.trim()}
                    className="rounded-lg border border-[#7126b6] px-4 py-2.5 text-sm font-medium text-[#7126b6] hover:bg-[#f3e8ff] disabled:opacity-50 transition-colors"
                  >
                    {couponLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      "Appliquer"
                    )}
                  </button>
                </div>
              )}
            </div>

            {/* Discount line */}
            {appliedCoupon && (
              <div className="flex justify-between text-sm">
                <span className="text-green-600 font-medium">Réduction</span>
                <span className="text-green-600 font-medium">-{formatConvertedPrice(appliedCoupon.discount)}</span>
              </div>
            )}

            <div className="border-t border-gray-200 pt-3 dark:border-gray-700">
              <div className="flex justify-between">
                <span className="text-base font-semibold text-[#0f172a] dark:text-white">Total</span>
                <span className="text-lg font-bold text-[#0f172a] dark:text-white">{formatConvertedPrice(getDiscountedTotal())}</span>
              </div>
            </div>
          </div>

          <div className="mt-4 flex items-center gap-2 rounded-lg bg-green-50 p-3 text-sm text-green-700 dark:bg-green-900/20 dark:text-green-400">
            <ShieldCheck className="h-4 w-4 flex-shrink-0" />
            Paiement 100% sécurisé
          </div>

          <Button onClick={handleCheckout} className="mt-6 w-full" size="lg" disabled={loading}>
            {loading ? "Traitement en cours..." : `Payer ${formatConvertedPrice(getDiscountedTotal())}`}
          </Button>
        </div>
      </div>
    </div>
  );
}
