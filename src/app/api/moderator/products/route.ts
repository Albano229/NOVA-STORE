import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "MODERATOR", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();

    const result = await pool.query(`
      SELECT
        p."id", p."name", p."slug", p."price", p."productType",
        p."isActive", p."isHidden", p."createdAt",
        json_build_object('name', s."name", 'slug', s."slug") AS "shop",
        json_build_object('name', c."name") AS "category",
        COALESCE(
          (SELECT json_agg(json_build_object('url', pi."url"))
           FROM "ProductImage" pi WHERE pi."productId" = p."id"),
          '[]'::json
        ) AS "images"
      FROM "Product" p
      LEFT JOIN "Shop" s ON s."id" = p."shopId"
      LEFT JOIN "Category" c ON c."id" = p."categoryId"
      ORDER BY p."createdAt" DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching moderator products:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
