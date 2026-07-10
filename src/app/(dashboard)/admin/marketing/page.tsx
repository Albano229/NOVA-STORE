"use client";

import { useEffect, useState, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import toast from "react-hot-toast";
import {
  Megaphone,
  Tag,
  ImagePlus,
  BarChart3,
  Plus,
  Trash2,
  ToggleLeft,
  ToggleRight,
  X,
  RefreshCw,
  Copy,
  ExternalLink,
  Calendar,
  Users,
  Percent,
  DollarSign,
  Sparkles,
  Eye,
  EyeOff,
  TrendingUp,
  Zap,
  Palette,
} from "lucide-react";

interface Campaign {
  id: string;
  name: string;
  type: string;
  status: string;
  audience: string;
  discount: string;
  startDate: string;
  endDate: string;
  createdAt: string;
}

interface Coupon {
  id: string;
  code: string;
  type: string;
  value: number;
  minOrder: number;
  maxUses: number;
  usedCount: number;
  expiresAt: string;
  isActive: boolean;
}

interface Banner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface Stats {
  totalCampaigns: number;
  activeCampaigns: number;
  totalCoupons: number;
  activeCoupons: number;
  totalBanners: number;
  activeBanners: number;
  totalRedemptions: number;
}

interface MarketingData {
  campaigns: Campaign[];
  coupons: Coupon[];
  banners: Banner[];
  stats: Stats;
}

type Tab = "campaigns" | "coupons" | "banners" | "stats";

const TABS: { key: Tab; label: string; icon: typeof Megaphone }[] = [
  { key: "campaigns", label: "Campagnes", icon: Megaphone },
  { key: "coupons", label: "Coupons", icon: Tag },
  { key: "banners", label: "Bannières", icon: ImagePlus },
  { key: "stats", label: "Statistiques", icon: BarChart3 },
];

const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "numeric" });

const formatShortDate = (d: string) =>
  new Date(d).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });

function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "NOVA-";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

const defaultCampaign = {
  name: "",
  type: "promo",
  status: "active",
  audience: "all",
  discount: "",
  startDate: "",
  endDate: "",
};

const defaultCoupon = {
  code: "",
  type: "percent",
  value: 0,
  minOrder: 0,
  maxUses: 100,
  usedCount: 0,
  expiresAt: "",
  isActive: true,
};

const defaultBanner = {
  title: "",
  imageUrl: "",
  linkUrl: "",
  position: "home",
  isActive: true,
  startDate: "",
  endDate: "",
};

export default function MarketingPage() {
  const [data, setData] = useState<MarketingData>({
    campaigns: [],
    coupons: [],
    banners: [],
    stats: {
      totalCampaigns: 0,
      activeCampaigns: 0,
      totalCoupons: 0,
      activeCoupons: 0,
      totalBanners: 0,
      activeBanners: 0,
      totalRedemptions: 0,
    },
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<Tab>("campaigns");
  const [showModal, setShowModal] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [campaignForm, setCampaignForm] = useState(defaultCampaign);
  const [couponForm, setCouponForm] = useState(defaultCoupon);
  const [bannerForm, setBannerForm] = useState(defaultBanner);

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/admin/marketing");
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      setData(json);
    } catch {
      toast.error("Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleSave = async (
    action: string,
    itemType: string,
    item: Record<string, unknown>
  ) => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, itemType, item }),
      });
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      setData(json.data);
      setShowModal(null);
      toast.success("Sauvegardé avec succès");
    } catch {
      toast.error("Erreur lors de la sauvegarde");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (itemType: string, itemId: string) => {
    if (!confirm("Supprimer cet élément ?")) return;
    try {
      const res = await fetch(
        `/api/admin/marketing?itemType=${itemType}&itemId=${itemId}`,
        { method: "DELETE" }
      );
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      setData(json.data);
      toast.success("Supprimé");
    } catch {
      toast.error("Erreur lors de la suppression");
    }
  };

  const handleToggle = async (itemType: string, itemId: string) => {
    try {
      const res = await fetch("/api/admin/marketing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "toggle", itemType, item: { id: itemId } }),
      });
      if (!res.ok) throw new Error("Erreur");
      const json = await res.json();
      setData(json.data);
    } catch {
      toast.error("Erreur lors de la mise à jour");
    }
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Code copié !");
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-48 animate-pulse rounded-lg bg-gray-200" />
        <div className="h-12 w-96 animate-pulse rounded-xl bg-gray-100 dark:bg-gray-700" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-28 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-700" />
          ))}
        </div>
        <div className="h-96 animate-pulse rounded-2xl bg-gray-100 dark:bg-gray-700" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#0f172a]">Marketing</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            Gérez vos campagnes, coupons et bannières promotionnelles
          </p>
        </div>
        <button
          onClick={() => fetchData()}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 dark:border-gray-700 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-300 shadow-sm dark:shadow-gray-800/20 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700"
        >
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card hover className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Campagnes totales</span>
            <div className="rounded-xl bg-indigo-100 p-2.5">
              <Megaphone className="h-5 w-5 text-indigo-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#0f172a]">
            {data.stats.totalCampaigns}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            {data.stats.activeCampaigns} actives
          </p>
        </Card>

        <Card hover className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Coupons actifs</span>
            <div className="rounded-xl bg-emerald-100 p-2.5">
              <Tag className="h-5 w-5 text-emerald-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#0f172a]">
            {data.stats.activeCoupons}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            sur {data.stats.totalCoupons} total
          </p>
        </Card>

        <Card hover className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Bannières</span>
            <div className="rounded-xl bg-amber-100 p-2.5">
              <ImagePlus className="h-5 w-5 text-amber-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#0f172a]">
            {data.stats.activeBanners}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
            sur {data.stats.totalBanners} total
          </p>
        </Card>

        <Card hover className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Utilisations</span>
            <div className="rounded-xl bg-purple-100 p-2.5">
              <TrendingUp className="h-5 w-5 text-purple-600" />
            </div>
          </div>
          <p className="mt-3 text-2xl font-bold text-[#0f172a]">
            {data.stats.totalRedemptions}
          </p>
          <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">total redemptions</p>
        </Card>
      </div>

      <div className="flex items-center gap-1 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-1 shadow-sm dark:shadow-gray-800/20">
        {TABS.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`relative flex items-center gap-2 rounded-lg px-4 py-2.5 text-sm font-medium transition-colors ${
              activeTab === tab.key
                ? "bg-[#0f172a] text-white shadow-sm dark:shadow-gray-800/20"
                : "text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-700 dark:text-gray-300"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "campaigns" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0f172a]">Campagnes</h2>
            <button
              onClick={() => {
                setCampaignForm(defaultCampaign);
                setShowModal("campaign");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-white shadow-sm dark:shadow-gray-800/20 transition-colors hover:bg-[#1e293b]"
            >
              <Plus className="h-4 w-4" />
              Nouvelle campagne
            </button>
          </div>

          {data.campaigns.length === 0 ? (
            <Card className="p-12 text-center">
              <Megaphone className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucune campagne</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Créez votre première campagne promotionnelle
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.campaigns.map((campaign) => (
                <Card key={campaign.id} hover className="p-5">
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="truncate text-base font-semibold text-[#0f172a]">
                          {campaign.name}
                        </h3>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            campaign.status === "active"
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {campaign.status === "active" ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <div className="mt-2 flex flex-wrap items-center gap-2">
                        <span className="inline-flex items-center rounded-full bg-indigo-50 px-2.5 py-0.5 text-xs font-medium text-indigo-700">
                          {campaign.type === "promo"
                            ? "Promo"
                            : campaign.type === "flash"
                            ? "Flash"
                            : "Saisonnière"}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-blue-50 px-2.5 py-0.5 text-xs font-medium text-blue-700">
                          <Users className="mr-1 h-3 w-3" />
                          {campaign.audience === "all"
                            ? "Tous"
                            : campaign.audience === "vendors"
                            ? "Vendeurs"
                            : "Clients"}
                        </span>
                        <span className="inline-flex items-center rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-medium text-amber-700">
                          {campaign.discount}
                        </span>
                      </div>
                      <div className="mt-3 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                        <Calendar className="h-3 w-3" />
                        {formatShortDate(campaign.startDate)} — {formatShortDate(campaign.endDate)}
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => handleToggle("campaign", campaign.id)}
                        className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                        title={campaign.status === "active" ? "Désactiver" : "Activer"}
                      >
                        {campaign.status === "active" ? (
                          <ToggleRight className="h-5 w-5 text-emerald-500" />
                        ) : (
                          <ToggleLeft className="h-5 w-5" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete("campaign", campaign.id)}
                        className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "coupons" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0f172a]">Coupons</h2>
            <button
              onClick={() => {
                setCouponForm({ ...defaultCoupon, code: generateCouponCode() });
                setShowModal("coupon");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-white shadow-sm dark:shadow-gray-800/20 transition-colors hover:bg-[#1e293b]"
            >
              <Plus className="h-4 w-4" />
              Nouveau coupon
            </button>
          </div>

          {data.coupons.length === 0 ? (
            <Card className="p-12 text-center">
              <Tag className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucun coupon</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Créez votre premier coupon de réduction
              </p>
            </Card>
          ) : (
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-700/50 bg-gray-50/50 dark:bg-gray-800/30 text-xs font-medium uppercase tracking-wider text-gray-400 dark:text-gray-500">
                      <th className="px-5 py-3">Code</th>
                      <th className="px-5 py-3">Type</th>
                      <th className="px-5 py-3">Valeur</th>
                      <th className="px-5 py-3">Min. commande</th>
                      <th className="px-5 py-3">Utilisations</th>
                      <th className="px-5 py-3">Expiration</th>
                      <th className="px-5 py-3">Statut</th>
                      <th className="px-5 py-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                    {data.coupons.map((coupon) => (
                      <tr key={coupon.id} className="hover:bg-gray-50/50 dark:bg-gray-800/30 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-2">
                            <code className="rounded-md bg-gray-100 dark:bg-gray-700 px-2 py-1 text-xs font-bold text-[#0f172a]">
                              {coupon.code}
                            </code>
                            <button
                              onClick={() => copyCode(coupon.code)}
                              className="rounded p-1 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                            >
                              <Copy className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              coupon.type === "percent"
                                ? "bg-indigo-50 text-indigo-700"
                                : "bg-emerald-50 text-emerald-700"
                            }`}
                          >
                            {coupon.type === "percent" ? (
                              <Percent className="mr-1 h-3 w-3" />
                            ) : (
                              <DollarSign className="mr-1 h-3 w-3" />
                            )}
                            {coupon.type === "percent" ? "Pourcentage" : "Montant"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-medium text-[#0f172a]">
                          {coupon.type === "percent" ? `${coupon.value}%` : `${coupon.value} FCFA`}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">
                          {coupon.minOrder > 0 ? `${coupon.minOrder.toLocaleString("fr-FR")} FCFA` : "—"}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">
                          {coupon.usedCount}/{coupon.maxUses}
                        </td>
                        <td className="px-5 py-3.5 text-gray-600 dark:text-gray-400">
                          {formatDate(coupon.expiresAt)}
                        </td>
                        <td className="px-5 py-3.5">
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              coupon.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {coupon.isActive ? "Actif" : "Inactif"}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1">
                            <button
                              onClick={() => handleToggle("coupon", coupon.id)}
                              className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
                            >
                              {coupon.isActive ? (
                                <Eye className="h-4 w-4 text-emerald-500" />
                              ) : (
                                <EyeOff className="h-4 w-4" />
                              )}
                            </button>
                            <button
                              onClick={() => handleDelete("coupon", coupon.id)}
                              className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-red-50 hover:text-red-500"
                            >
                              <Trash2 className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>
          )}
        </section>
      )}

      {activeTab === "banners" && (
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-[#0f172a]">Bannières</h2>
            <button
              onClick={() => {
                setBannerForm(defaultBanner);
                setShowModal("banner");
              }}
              className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-white shadow-sm dark:shadow-gray-800/20 transition-colors hover:bg-[#1e293b]"
            >
              <Plus className="h-4 w-4" />
              Nouvelle bannière
            </button>
          </div>

          {data.banners.length === 0 ? (
            <Card className="p-12 text-center">
              <ImagePlus className="mx-auto h-12 w-12 text-gray-300" />
              <p className="mt-4 text-sm font-medium text-gray-500 dark:text-gray-400">Aucune bannière</p>
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Créez votre première bannière promotionnelle
              </p>
            </Card>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {data.banners.map((banner) => (
                <Card key={banner.id} hover className="overflow-hidden">
                  <div className="relative h-40 bg-gray-100 dark:bg-gray-700">
                    {banner.imageUrl ? (
                      <img
                        src={banner.imageUrl}
                        alt={banner.title}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center">
                        <ImagePlus className="h-10 w-10 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute left-3 top-3 flex gap-1.5">
                      <span
                        className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium backdrop-blur-sm ${
                          banner.isActive
                            ? "bg-emerald-500/90 text-white"
                            : "bg-gray-500/90 text-white"
                        }`}
                      >
                        {banner.isActive ? "Active" : "Inactive"}
                      </span>
                      <span className="inline-flex items-center rounded-full bg-black/50 px-2 py-0.5 text-xs font-medium text-white backdrop-blur-sm">
                        {banner.position === "home"
                          ? "Accueil"
                          : banner.position === "category"
                          ? "Catégorie"
                          : "Boutique"}
                      </span>
                    </div>
                    <div className="absolute right-3 top-3 flex gap-1">
                      <button
                        onClick={() => handleToggle("banner", banner.id)}
                        className="rounded-lg bg-white/90 p-1.5 text-gray-600 dark:text-gray-400 shadow-sm dark:shadow-gray-800/20 backdrop-blur-sm hover:bg-white dark:bg-gray-800"
                      >
                        {banner.isActive ? (
                          <Eye className="h-4 w-4 text-emerald-500" />
                        ) : (
                          <EyeOff className="h-4 w-4" />
                        )}
                      </button>
                      <button
                        onClick={() => handleDelete("banner", banner.id)}
                        className="rounded-lg bg-white/90 p-1.5 text-gray-600 dark:text-gray-400 shadow-sm dark:shadow-gray-800/20 backdrop-blur-sm hover:bg-white dark:bg-gray-800 hover:text-red-500"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  <div className="p-4">
                    <h3 className="font-semibold text-[#0f172a]">{banner.title}</h3>
                    {banner.linkUrl && (
                      <a
                        href={banner.linkUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700"
                      >
                        <ExternalLink className="h-3 w-3" />
                        {banner.linkUrl.length > 30
                          ? banner.linkUrl.slice(0, 30) + "..."
                          : banner.linkUrl}
                      </a>
                    )}
                    <div className="mt-2 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
                      <Calendar className="h-3 w-3" />
                      {formatShortDate(banner.startDate)} — {formatShortDate(banner.endDate)}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </section>
      )}

      {activeTab === "stats" && (
        <section className="space-y-6">
          <h2 className="text-lg font-semibold text-[#0f172a]">Statistiques marketing</h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total campagnes</span>
                <div className="rounded-xl bg-indigo-100 p-2.5">
                  <Megaphone className="h-5 w-5 text-indigo-600" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">
                {data.stats.totalCampaigns}
              </p>
            </Card>
            <Card hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Campagnes actives</span>
                <div className="rounded-xl bg-emerald-100 p-2.5">
                  <Zap className="h-5 w-5 text-emerald-600" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">
                {data.stats.activeCampaigns}
              </p>
            </Card>
            <Card hover className="p-5">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500 dark:text-gray-400">Total utilisations</span>
                <div className="rounded-xl bg-purple-100 p-2.5">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
              <p className="mt-3 text-2xl font-bold text-[#0f172a]">
                {data.stats.totalRedemptions}
              </p>
            </Card>
          </div>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-indigo-100 p-2">
                <Sparkles className="h-4 w-4 text-indigo-600" />
              </div>
              <h3 className="font-semibold text-[#0f172a]">Performance des campagnes</h3>
            </div>
            {data.campaigns.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                Aucune campagne créée pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {data.campaigns.map((campaign) => {
                  const daysLeft = Math.max(
                    0,
                    Math.ceil(
                      (new Date(campaign.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
                    )
                  );
                  return (
                    <div
                      key={campaign.id}
                      className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-gray-700/50 p-4 transition-colors hover:bg-gray-50/50 dark:bg-gray-800/30"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50">
                        <Megaphone className="h-5 w-5 text-indigo-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <p className="truncate text-sm font-medium text-[#0f172a]">
                            {campaign.name}
                          </p>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              campaign.status === "active"
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {campaign.status === "active" ? "Active" : "Inactive"}
                          </span>
                        </div>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                          {campaign.discount} • {campaign.audience === "all" ? "Tous" : campaign.audience === "vendors" ? "Vendeurs" : "Clients"}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[#0f172a]">{daysLeft}j restants</p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">{formatShortDate(campaign.startDate)} — {formatShortDate(campaign.endDate)}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-amber-100 p-2">
                <BarChart3 className="h-4 w-4 text-amber-600" />
              </div>
              <h3 className="font-semibold text-[#0f172a]">Performance des coupons</h3>
            </div>
            {data.coupons.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                Aucun coupon créé pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {data.coupons.map((coupon) => {
                  const usagePercent =
                    coupon.maxUses > 0
                      ? Math.round((coupon.usedCount / coupon.maxUses) * 100)
                      : 0;
                  return (
                    <div
                      key={coupon.id}
                      className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-gray-700/50 p-4 transition-colors hover:bg-gray-50/50 dark:bg-gray-800/30"
                    >
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-50">
                        <Tag className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <code className="text-sm font-bold text-[#0f172a]">{coupon.code}</code>
                          <span
                            className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                              coupon.isActive
                                ? "bg-emerald-100 text-emerald-700"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                            }`}
                          >
                            {coupon.isActive ? "Actif" : "Inactif"}
                          </span>
                        </div>
                        <div className="mt-1 h-1.5 w-full overflow-hidden rounded-full bg-gray-100 dark:bg-gray-700">
                          <div
                            className="h-full rounded-full bg-emerald-500 transition-all"
                            style={{ width: `${Math.min(usagePercent, 100)}%` }}
                          />
                        </div>
                        <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                          {coupon.usedCount}/{coupon.maxUses} utilisations ({usagePercent}%)
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-[#0f172a]">
                          {coupon.type === "percent" ? `${coupon.value}%` : `${coupon.value} FCFA`}
                        </p>
                        <p className="text-xs text-gray-400 dark:text-gray-500">
                          Exp: {formatShortDate(coupon.expiresAt)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-blue-100 p-2">
                <Palette className="h-4 w-4 text-blue-600" />
              </div>
              <h3 className="font-semibold text-[#0f172a]">Performance des bannières</h3>
            </div>
            {data.banners.length === 0 ? (
              <p className="py-8 text-center text-sm text-gray-400 dark:text-gray-500">
                Aucune bannière créée pour le moment
              </p>
            ) : (
              <div className="space-y-3">
                {data.banners.map((banner) => (
                  <div
                    key={banner.id}
                    className="flex items-center gap-4 rounded-xl border border-gray-100 dark:border-gray-700/50 p-4 transition-colors hover:bg-gray-50/50 dark:bg-gray-800/30"
                  >
                    <div className="h-12 w-20 flex-shrink-0 overflow-hidden rounded-lg bg-gray-100 dark:bg-gray-700">
                      {banner.imageUrl ? (
                        <img
                          src={banner.imageUrl}
                          alt={banner.title}
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center">
                          <ImagePlus className="h-5 w-5 text-gray-300" />
                        </div>
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p className="truncate text-sm font-medium text-[#0f172a]">
                          {banner.title}
                        </p>
                        <span
                          className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                            banner.isActive
                              ? "bg-emerald-100 text-emerald-700"
                              : "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400"
                          }`}
                        >
                          {banner.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-gray-500">
                        Position: {banner.position === "home" ? "Accueil" : banner.position === "category" ? "Catégorie" : "Boutique"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-400 dark:text-gray-500">
                        {formatShortDate(banner.startDate)} — {formatShortDate(banner.endDate)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-6">
            <div className="flex items-center gap-2 mb-4">
              <div className="rounded-lg bg-purple-100 p-2">
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </div>
              <h3 className="font-semibold text-[#0f172a]">Graphique des performances</h3>
            </div>
            <div className="flex h-64 items-center justify-center rounded-xl border-2 border-dashed border-gray-200 dark:border-gray-700 bg-gray-50/50 dark:bg-gray-800/30">
              <div className="text-center">
                <BarChart3 className="mx-auto h-10 w-10 text-gray-300" />
                <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
                  Graphique des performances marketing
                </p>
                <p className="text-xs text-gray-300">Bientôt disponible</p>
              </div>
            </div>
          </Card>
        </section>
      )}

      {showModal === "campaign" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 px-6 py-4">
              <h3 className="text-lg font-semibold text-[#0f172a]">Nouvelle campagne</h3>
              <button
                onClick={() => setShowModal(null)}
                className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <Input
                label="Nom de la campagne"
                placeholder="Ex: Soldes d'été"
                value={campaignForm.name}
                onChange={(e) => setCampaignForm({ ...campaignForm, name: e.target.value })}
              />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <select
                    value={campaignForm.type}
                    onChange={(e) => setCampaignForm({ ...campaignForm, type: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                  >
                    <option value="promo">Promo</option>
                    <option value="flash">Flash</option>
                    <option value="seasonal">Saisonnière</option>
                  </select>
                </div>
                <Input
                  label="Réduction"
                  placeholder="Ex: 20% ou 5000 FCFA"
                  value={campaignForm.discount}
                  onChange={(e) => setCampaignForm({ ...campaignForm, discount: e.target.value })}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Audience</label>
                <select
                  value={campaignForm.audience}
                  onChange={(e) => setCampaignForm({ ...campaignForm, audience: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                >
                  <option value="all">Tous</option>
                  <option value="vendors">Vendeurs</option>
                  <option value="clients">Clients</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date de début"
                  type="date"
                  value={campaignForm.startDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, startDate: e.target.value })}
                />
                <Input
                  label="Date de fin"
                  type="date"
                  value={campaignForm.endDate}
                  onChange={(e) => setCampaignForm({ ...campaignForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700/50 px-6 py-4">
              <button
                onClick={() => setShowModal(null)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={() =>
                  handleSave("create", "campaign", {
                    ...campaignForm,
                    status: "active",
                  })
                }
                disabled={saving || !campaignForm.name || !campaignForm.startDate || !campaignForm.endDate}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-white shadow-sm dark:shadow-gray-800/20 transition-colors hover:bg-[#1e293b] disabled:opacity-50"
              >
                {saving ? "Création..." : "Créer la campagne"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "coupon" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 px-6 py-4">
              <h3 className="text-lg font-semibold text-[#0f172a]">Nouveau coupon</h3>
              <button
                onClick={() => setShowModal(null)}
                className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Code du coupon</label>
                <div className="flex gap-2">
                  <Input
                    placeholder="NOVA-XXXXXX"
                    value={couponForm.code}
                    onChange={(e) => setCouponForm({ ...couponForm, code: e.target.value.toUpperCase() })}
                    className="flex-1 font-mono"
                  />
                  <button
                    onClick={() => setCouponForm({ ...couponForm, code: generateCouponCode() })}
                    className="shrink-0 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-3 py-2.5 text-sm font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                  >
                    Auto
                  </button>
                </div>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="flex flex-col gap-1.5">
                  <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Type</label>
                  <select
                    value={couponForm.type}
                    onChange={(e) => setCouponForm({ ...couponForm, type: e.target.value })}
                    className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                  >
                    <option value="percent">Pourcentage (%)</option>
                    <option value="amount">Montant (FCFA)</option>
                  </select>
                </div>
                <Input
                  label={couponForm.type === "percent" ? "Pourcentage" : "Montant (FCFA)"}
                  type="number"
                  placeholder={couponForm.type === "percent" ? "10" : "5000"}
                  value={couponForm.value || ""}
                  onChange={(e) => setCouponForm({ ...couponForm, value: Number(e.target.value) })}
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Commande minimum (FCFA)"
                  type="number"
                  placeholder="0"
                  value={couponForm.minOrder || ""}
                  onChange={(e) => setCouponForm({ ...couponForm, minOrder: Number(e.target.value) })}
                />
                <Input
                  label="Utilisations max"
                  type="number"
                  placeholder="100"
                  value={couponForm.maxUses || ""}
                  onChange={(e) => setCouponForm({ ...couponForm, maxUses: Number(e.target.value) })}
                />
              </div>
              <Input
                label="Date d'expiration"
                type="date"
                value={couponForm.expiresAt}
                onChange={(e) => setCouponForm({ ...couponForm, expiresAt: e.target.value })}
              />
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700/50 px-6 py-4">
              <button
                onClick={() => setShowModal(null)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={() =>
                  handleSave("create", "coupon", {
                    ...couponForm,
                    usedCount: 0,
                    isActive: true,
                  })
                }
                disabled={saving || !couponForm.code || !couponForm.value || !couponForm.expiresAt}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-white shadow-sm dark:shadow-gray-800/20 transition-colors hover:bg-[#1e293b] disabled:opacity-50"
              >
                {saving ? "Création..." : "Créer le coupon"}
              </button>
            </div>
          </div>
        </div>
      )}

      {showModal === "banner" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="w-full max-w-lg rounded-2xl bg-white dark:bg-gray-800 shadow-xl">
            <div className="flex items-center justify-between border-b border-gray-100 dark:border-gray-700/50 px-6 py-4">
              <h3 className="text-lg font-semibold text-[#0f172a]">Nouvelle bannière</h3>
              <button
                onClick={() => setShowModal(null)}
                className="rounded-lg p-1.5 text-gray-400 dark:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-600 dark:text-gray-400"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="space-y-4 px-6 py-5">
              <Input
                label="Titre"
                placeholder="Ex: Promo été 2025"
                value={bannerForm.title}
                onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
              />
              <Input
                label="URL de l'image"
                placeholder="https://..."
                value={bannerForm.imageUrl}
                onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
              />
              {bannerForm.imageUrl && (
                <div className="h-32 overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
                  <img
                    src={bannerForm.imageUrl}
                    alt="Aperçu"
                    className="h-full w-full object-cover"
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                    }}
                  />
                </div>
              )}
              <Input
                label="URL de destination"
                placeholder="https://..."
                value={bannerForm.linkUrl}
                onChange={(e) => setBannerForm({ ...bannerForm, linkUrl: e.target.value })}
              />
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium text-gray-700 dark:text-gray-300">Position</label>
                <select
                  value={bannerForm.position}
                  onChange={(e) => setBannerForm({ ...bannerForm, position: e.target.value })}
                  className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-[#0f172a] focus:outline-none focus:ring-2 focus:ring-[#0f172a]/20"
                >
                  <option value="home">Accueil</option>
                  <option value="category">Catégorie</option>
                  <option value="shop">Boutique</option>
                </select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Date de début"
                  type="date"
                  value={bannerForm.startDate}
                  onChange={(e) => setBannerForm({ ...bannerForm, startDate: e.target.value })}
                />
                <Input
                  label="Date de fin"
                  type="date"
                  value={bannerForm.endDate}
                  onChange={(e) => setBannerForm({ ...bannerForm, endDate: e.target.value })}
                />
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 border-t border-gray-100 dark:border-gray-700/50 px-6 py-4">
              <button
                onClick={() => setShowModal(null)}
                className="rounded-lg px-4 py-2.5 text-sm font-medium text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700"
              >
                Annuler
              </button>
              <button
                onClick={() =>
                  handleSave("create", "banner", {
                    ...bannerForm,
                    isActive: true,
                  })
                }
                disabled={saving || !bannerForm.title || !bannerForm.imageUrl || !bannerForm.startDate || !bannerForm.endDate}
                className="inline-flex items-center gap-2 rounded-xl bg-[#0f172a] px-4 py-2.5 text-sm font-medium text-white shadow-sm dark:shadow-gray-800/20 transition-colors hover:bg-[#1e293b] disabled:opacity-50"
              >
                {saving ? "Création..." : "Créer la bannière"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
