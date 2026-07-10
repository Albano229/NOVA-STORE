import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

const BOOLEAN_KEYS = new Set([
  "marketplaceActive", "vendorRegistrationActive",
  "allowPhysical", "allowDigital", "allowServices", "allowBundles", "allowCommunity",
  "aiEnabled", "notificationsEnabled", "emailsEnabled", "maintenanceMode",
  "showTestimonials", "showFeatures", "showPricing", "showStats",
  "showCategories", "showMarquee", "showResources",
  "payStripe", "payFlutterwave", "payFedaPay", "payPaypal",
  "payOrangeMoney", "payWave", "payMtnMoney",
]);

const NUMBER_KEYS = new Set([
  "commissionRate", "minPayout",
]);

function parseValue(key: string, raw: string): string | boolean | number {
  if (BOOLEAN_KEYS.has(key)) {
    return raw === "true" || raw === "1";
  }
  if (NUMBER_KEYS.has(key)) {
    const n = parseFloat(raw);
    return isNaN(n) ? 0 : n;
  }
  return raw;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const result = await pool.query(`SELECT key, value FROM "SiteSettings"`);
    const settingsObj: Record<string, string | boolean | number> = {};
    result.rows.forEach((s) => {
      settingsObj[s.key] = parseValue(s.key, s.value);
    });

    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error("Error fetching settings:", error);
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
    const pool = getAuthPool();

    for (const [key, value] of Object.entries(body)) {
      const strValue = typeof value === "boolean" ? String(value) : String(value);
      await pool.query(
        `INSERT INTO "SiteSettings" (id, key, value) VALUES ($1, $2, $3)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        [`setting_${key}`, key, strValue]
      );
    }

    const result = await pool.query(`SELECT key, value FROM "SiteSettings"`);
    const settingsObj: Record<string, string | boolean | number> = {};
    result.rows.forEach((s) => {
      settingsObj[s.key] = parseValue(s.key, s.value);
    });

    return NextResponse.json(settingsObj);
  } catch (error) {
    console.error("Error saving settings:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
