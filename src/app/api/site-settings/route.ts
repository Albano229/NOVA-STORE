import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

const PUBLIC_KEYS = [
  "siteName", "siteDescription", "logo", "favicon", "primaryColor", "secondaryColor", "currency",
  "contactEmail", "contactPhone", "siteUrl",
  "facebookUrl", "instagramUrl", "twitterUrl", "youtubeUrl", "tiktokUrl",
  "heroTitle", "heroSubtitle", "heroCtaText",
  "showTestimonials", "showFeatures", "showPricing", "showStats", "showCategories", "showMarquee", "showResources",
];

export async function GET() {
  try {
    const pool = getAuthPool();
    const result = await pool.query(
      `SELECT key, value FROM "SiteSettings" WHERE key = ANY($1)`,
      [PUBLIC_KEYS]
    );
    const settings: Record<string, string> = {};
    result.rows.forEach((s) => {
      settings[s.key] = s.value;
    });
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({});
  }
}
