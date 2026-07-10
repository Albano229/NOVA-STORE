import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const ids = searchParams.get("ids");

    if (!ids) {
      return NextResponse.json({ error: "ids requis" }, { status: 400 });
    }

    const idList = ids.split(",").filter(Boolean).slice(0, 4);
    if (idList.length === 0) {
      return NextResponse.json({ products: [] });
    }

    const pool = getAuthPool();
    const placeholders = idList.map((_, i) => `$${i + 1}`).join(",");

    const result = await pool.query(
      `SELECT p.*, c."name" AS "categoryName", s."name" AS "shopName", s."slug" AS "shopSlug",
              COALESCE(
                (SELECT json_agg(jsonb_build_object('id', pi."id", 'url', pi."url", 'alt', pi."alt") ORDER BY pi."position")
                 FROM "ProductImage" pi WHERE pi."productId" = p."id"), '[]'
              ) AS "images",
              (SELECT jsonb_build_object('shippingEnabled', po."shippingEnabled", 'shippingCost', po."shippingCost")
               FROM "PhysicalOption" po WHERE po."productId" = p."id" LIMIT 1) AS "physicalOpt",
              (SELECT jsonb_build_object('fileName', df."fileName", 'fileType', df."fileType", 'fileSize', df."fileSize")
               FROM "DigitalFile" df WHERE df."productId" = p."id" LIMIT 1) AS "digitalFile",
              (SELECT AVG(r."rating") FROM "Review" r WHERE r."productId" = p."id") AS "avgRating",
              (SELECT COUNT(*) FROM "Review" r WHERE r."productId" = p."id") AS "reviewCount"
       FROM "Product" p
       LEFT JOIN "Category" c ON c."id" = p."categoryId"
       LEFT JOIN "Shop" s ON s."id" = p."shopId"
       WHERE p."id" IN (${placeholders})`,
      idList
    );

    return NextResponse.json({ products: result.rows });
  } catch (error) {
    console.error("Compare error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
