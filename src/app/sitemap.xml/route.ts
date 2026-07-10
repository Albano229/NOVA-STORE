import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

function escapeXml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function buildUrl(loc: string, lastmod: string, changefreq: string, priority: string): string {
  return `  <url>\n    <loc>${escapeXml(loc)}</loc>\n    <lastmod>${lastmod}</lastmod>\n    <changefreq>${changefreq}</changefreq>\n    <priority>${priority}</priority>\n  </url>`;
}

function fallbackXml(baseUrl: string): string {
  const now = new Date().toISOString().split("T")[0];
  const urls = [
    buildUrl(baseUrl, now, "daily", "1.0"),
    buildUrl(`${baseUrl}/products`, now, "daily", "0.9"),
    buildUrl(`${baseUrl}/stores`, now, "weekly", "0.8"),
    buildUrl(`${baseUrl}/auth/login`, now, "monthly", "0.3"),
    buildUrl(`${baseUrl}/auth/register`, now, "monthly", "0.3"),
  ];

  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;
}

export async function GET() {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nova-store-ashy.vercel.app";
  const now = new Date().toISOString().split("T")[0];

  const staticUrls = [
    buildUrl(baseUrl, now, "daily", "1.0"),
    buildUrl(`${baseUrl}/products`, now, "daily", "0.9"),
    buildUrl(`${baseUrl}/stores`, now, "weekly", "0.8"),
    buildUrl(`${baseUrl}/auth/login`, now, "monthly", "0.3"),
    buildUrl(`${baseUrl}/auth/register`, now, "monthly", "0.3"),
  ];

  try {
    const pool = getAuthPool();

    const [productsResult, shopsResult] = await Promise.all([
      pool.query(
        `SELECT slug, "updatedAt" FROM "Product" WHERE "isActive" = true ORDER BY "updatedAt" DESC LIMIT 5000`
      ),
      pool.query(
        `SELECT slug, "updatedAt" FROM "Shop" WHERE "isActive" = true ORDER BY "updatedAt" DESC LIMIT 1000`
      ),
    ]);

    const productUrls = productsResult.rows.map((p: any) =>
      buildUrl(
        `${baseUrl}/product/${p.slug}`,
        p.updatedAt.toISOString().split("T")[0],
        "daily",
        "0.7"
      )
    );

    const shopUrls = shopsResult.rows.map((s: any) =>
      buildUrl(
        `${baseUrl}/shop/${s.slug}`,
        s.updatedAt.toISOString().split("T")[0],
        "weekly",
        "0.8"
      )
    );

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${staticUrls.join("\n")}
${productUrls.join("\n")}
${shopUrls.join("\n")}
</urlset>`;

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Cache-Control": "public, max-age=3600, s-maxage=3600",
      },
    });
  } catch (error) {
    console.error("Sitemap generation error:", error);

    const xml = fallbackXml(baseUrl);

    return new NextResponse(xml, {
      status: 200,
      headers: {
        "Content-Type": "text/xml; charset=utf-8",
        "Cache-Control": "public, max-age=300, s-maxage=300",
      },
    });
  }
}
