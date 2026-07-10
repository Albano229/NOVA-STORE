import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

interface MarketingCampaign {
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

interface MarketingCoupon {
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

interface MarketingBanner {
  id: string;
  title: string;
  imageUrl: string;
  linkUrl: string;
  position: string;
  isActive: boolean;
  startDate: string;
  endDate: string;
}

interface MarketingData {
  campaigns: MarketingCampaign[];
  coupons: MarketingCoupon[];
  banners: MarketingBanner[];
}

function parseMarketingData(value: string | null): MarketingData {
  if (!value) return { campaigns: [], coupons: [], banners: [] };
  try {
    const parsed = JSON.parse(value);
    return {
      campaigns: Array.isArray(parsed.campaigns) ? parsed.campaigns : [],
      coupons: Array.isArray(parsed.coupons) ? parsed.coupons : [],
      banners: Array.isArray(parsed.banners) ? parsed.banners : [],
    };
  } catch {
    return { campaigns: [], coupons: [], banners: [] };
  }
}

function computeStats(data: MarketingData) {
  const now = new Date().toISOString();
  const activeCampaigns = data.campaigns.filter(
    (c) => c.status === "active" || (c.startDate <= now && c.endDate >= now)
  ).length;
  const activeCoupons = data.coupons.filter((c) => c.isActive).length;
  const activeBanners = data.banners.filter((b) => b.isActive).length;
  const totalRedemptions = data.coupons.reduce((sum, c) => sum + (c.usedCount || 0), 0);

  return {
    totalCampaigns: data.campaigns.length,
    activeCampaigns,
    totalCoupons: data.coupons.length,
    activeCoupons,
    totalBanners: data.banners.length,
    activeBanners,
    totalRedemptions,
  };
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const result = await pool.query(`SELECT value FROM "SiteSettings" WHERE key = 'marketing'`);
    const data = parseMarketingData(result.rows[0]?.value || null);
    const stats = computeStats(data);

    return NextResponse.json({ ...data, stats });
  } catch (error) {
    console.error("Error fetching marketing data:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { action, itemType, item } = body;

    const pool = getAuthPool();
    const result = await pool.query(`SELECT value FROM "SiteSettings" WHERE key = 'marketing'`);
    const data = parseMarketingData(result.rows[0]?.value || null);

    if (action === "create") {
      const newItem = {
        ...item,
        id: `${itemType}_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
        createdAt: new Date().toISOString(),
      };
      if (itemType === "campaign") data.campaigns.push(newItem);
      else if (itemType === "coupon") data.coupons.push(newItem);
      else if (itemType === "banner") data.banners.push(newItem);
      else return NextResponse.json({ error: "Type d'élément invalide" }, { status: 400 });
    } else if (action === "update") {
      const list =
        itemType === "campaign"
          ? data.campaigns
          : itemType === "coupon"
          ? data.coupons
          : itemType === "banner"
          ? data.banners
          : null;
      if (!list) return NextResponse.json({ error: "Type d'élément invalide" }, { status: 400 });

      const idx = list.findIndex((el: { id: string }) => el.id === item.id);
      if (idx === -1) return NextResponse.json({ error: "Élément non trouvé" }, { status: 404 });
      list[idx] = { ...list[idx], ...item };
    } else if (action === "toggle") {
      const list =
        itemType === "campaign"
          ? data.campaigns
          : itemType === "coupon"
          ? data.coupons
          : itemType === "banner"
          ? data.banners
          : null;
      if (!list) return NextResponse.json({ error: "Type d'élément invalide" }, { status: 400 });

      const idx = list.findIndex((el: { id: string }) => el.id === item.id);
      if (idx === -1) return NextResponse.json({ error: "Élément non trouvé" }, { status: 404 });

      if (itemType === "campaign") {
        const campaign = list[idx] as { status: string };
        campaign.status = campaign.status === "active" ? "inactive" : "active";
      } else {
        (list[idx] as MarketingCoupon | MarketingBanner).isActive =
          !(list[idx] as MarketingCoupon | MarketingBanner).isActive;
      }
    } else {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    await pool.query(
      `INSERT INTO "SiteSettings" (key, value) VALUES ('marketing', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(data)]
    );

    const stats = computeStats(data);
    return NextResponse.json({ message: "Sauvegardé", data: { ...data, stats } });
  } catch (error) {
    console.error("Error saving marketing data:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const itemType = searchParams.get("itemType");
    const itemId = searchParams.get("itemId");

    if (!itemType || !itemId) {
      return NextResponse.json({ error: "Paramètres manquants" }, { status: 400 });
    }

    const pool = getAuthPool();
    const result = await pool.query(`SELECT value FROM "SiteSettings" WHERE key = 'marketing'`);
    const data = parseMarketingData(result.rows[0]?.value || null);

    let removed = false;
    if (itemType === "campaign") {
      const len = data.campaigns.length;
      data.campaigns = data.campaigns.filter((c) => c.id !== itemId);
      removed = data.campaigns.length < len;
    } else if (itemType === "coupon") {
      const len = data.coupons.length;
      data.coupons = data.coupons.filter((c) => c.id !== itemId);
      removed = data.coupons.length < len;
    } else if (itemType === "banner") {
      const len = data.banners.length;
      data.banners = data.banners.filter((b) => b.id !== itemId);
      removed = data.banners.length < len;
    }

    if (!removed) {
      return NextResponse.json({ error: "Élément non trouvé" }, { status: 404 });
    }

    await pool.query(
      `INSERT INTO "SiteSettings" (key, value) VALUES ('marketing', $1)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [JSON.stringify(data)]
    );

    const stats = computeStats(data);
    return NextResponse.json({ message: "Supprimé", data: { ...data, stats } });
  } catch (error) {
    console.error("Error deleting marketing item:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
