import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  try {
    const { slug } = await params;
    const pool = getAuthPool();

    const productResult = await pool.query(
      `SELECT
        p.*,
        json_build_object('id', s.id, 'name', s.name, 'slug', s.slug, 'logo', s.logo, 'isVerified', s."isVerified") AS shop,
        json_build_object('id', c.id, 'name', c.name, 'slug', c.slug) AS category,
        COALESCE(
          (SELECT json_agg(json_build_object('id', pi.id, 'url', pi.url, 'alt', pi.alt, 'position', pi."position") ORDER BY pi."position" ASC)
           FROM "ProductImage" pi WHERE pi."productId" = p.id),
          '[]'::json
        ) AS images,
        (SELECT row_to_json(df) FROM "DigitalFile" df WHERE df."productId" = p.id) AS "digitalFile",
        (SELECT row_to_json(po) FROM "PhysicalOption" po WHERE po."productId" = p.id) AS "physicalOpt"
      FROM "Product" p
      LEFT JOIN "Shop" s ON s.id = p."shopId"
      LEFT JOIN "Category" c ON c.id = p."categoryId"
      WHERE p.slug = $1`,
      [slug]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    const product = productResult.rows[0];

    const reviewsResult = await pool.query(
      `SELECT
        r.id, r.rating, r.comment, r."createdAt",
        json_build_object('name', u.name, 'image', u.image) AS user
      FROM "Review" r
      LEFT JOIN "User" u ON u.id = r."userId"
      WHERE r."productId" = $1
      ORDER BY r."createdAt" DESC
      LIMIT 10`,
      [product.id]
    );

    return NextResponse.json({
      ...product,
      reviews: reviewsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
