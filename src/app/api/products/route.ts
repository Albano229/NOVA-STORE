import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "12");
    const search = searchParams.get("search") || "";
    const category = searchParams.get("category") || "";
    const type = searchParams.get("type") || "";
    const minPrice = parseFloat(searchParams.get("minPrice") || "0");
    const maxPrice = parseFloat(searchParams.get("maxPrice") || "999999999");
    const sort = searchParams.get("sort") || "newest";

    const pool = getAuthPool();
    const offset = (page - 1) * limit;

    const conditions: string[] = [
      `p."isActive" = true`,
      `p."isHidden" = false`,
      `p."price" >= $1`,
      `p."price" <= $2`,
    ];
    const params: any[] = [minPrice, maxPrice];
    let paramIdx = 3;

    if (search) {
      conditions.push(`(p."name" ILIKE $${paramIdx} OR p."description" ILIKE $${paramIdx})`);
      params.push(`%${search}%`);
      paramIdx++;
    }

    if (category) {
      conditions.push(`c."slug" = $${paramIdx}`);
      params.push(category);
      paramIdx++;
    }

    if (type) {
      const typeMap: Record<string, string> = {
        physical: "PHYSICAL",
        digital: "DIGITAL",
        service: "BOOKING",
        subscription: "SUBSCRIPTION",
        bundle: "BUNDLE",
      };
      const dbType = typeMap[type.toLowerCase()] || type.toUpperCase();
      conditions.push(`p."productType" = $${paramIdx}`);
      params.push(dbType);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const orderClause = (() => {
      switch (sort) {
        case "price_asc": return `p."price" ASC`;
        case "price_desc": return `p."price" DESC`;
        case "popular": return `p."soldCount" DESC`;
        case "rating": return `p."avgRating" DESC`;
        default: return `p."createdAt" DESC`;
      }
    })();

    const countResult = await pool.query(
      `SELECT COUNT(*)::int AS total
       FROM "Product" p
       LEFT JOIN "Category" c ON c.id = p."categoryId"
       ${whereClause}`,
      params
    );
    const total = countResult.rows[0].total;

    const productsResult = await pool.query(
      `SELECT
        p.id, p.name, p.slug, p.description, p.price, p."comparePrice",
        p."discountPercent", p.stock, p."productType", p."isFeatured", p."createdAt",
        p."avgRating", p."reviewCount", p."soldCount",
        json_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'logo', s.logo) AS shop,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) AS category,
        COALESCE(
          (SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'alt', pi.alt, 'position', pi."position") ORDER BY pi."position" ASC)
           FROM "ProductImage" pi WHERE pi."productId" = p.id LIMIT 1),
          '[]'::json
        ) AS images,
        (SELECT COUNT(*)::int FROM "ProductVariant" pv WHERE pv."productId" = p.id AND pv."isActive" = true) AS "variantCount",
        (SELECT MIN(pv.price) FROM "ProductVariant" pv WHERE pv."productId" = p.id AND pv."isActive" = true) AS "minVariantPrice",
        (SELECT MAX(pv.price) FROM "ProductVariant" pv WHERE pv."productId" = p.id AND pv."isActive" = true) AS "maxVariantPrice"
      FROM "Product" p
      LEFT JOIN "Shop" s ON s.id = p."shopId"
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      ${whereClause}
      ORDER BY ${orderClause}
      LIMIT $${paramIdx} OFFSET $${paramIdx + 1}`,
      [...params, limit, offset]
    );

    return NextResponse.json({
      products: productsResult.rows,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("Error fetching products:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
