import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const result = await pool.query(
      `SELECT w.id, w."productId", w."variantId", w."createdAt",
        p.name, p.slug, p.price, p."comparePrice", p."avgRating", p."reviewCount",
        (SELECT url FROM "ProductImage" WHERE "productId" = p.id ORDER BY "position" LIMIT 1) AS image,
        json_build_object('id', s.id, 'name', s.name, 'slug', s.slug) AS shop
       FROM "Wishlist" w
       JOIN "Product" p ON p.id = w."productId"
       LEFT JOIN "Shop" s ON s.id = p."shopId"
       WHERE w."userId" = $1
       ORDER BY w."createdAt" DESC`,
      [session.user.id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching wishlist:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { productId, variantId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400 });
    }

    const pool = getAuthPool();

    const existing = await pool.query(
      `SELECT id FROM "Wishlist"
       WHERE "userId" = $1 AND "productId" = $2 AND "variantId" = ${variantId ? "$3" : "NULL"}`,
      variantId
        ? [session.user.id, productId, variantId]
        : [session.user.id, productId]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ message: "Déjà dans la liste", wishlistId: existing.rows[0].id });
    }

    const result = await pool.query(
      `INSERT INTO "Wishlist" ("userId", "productId", "variantId", "createdAt")
       VALUES ($1, $2, $3, NOW())
       RETURNING *`,
      [session.user.id, productId, variantId || null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error adding to wishlist:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { productId } = await req.json();
    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400 });
    }

    const pool = getAuthPool();
    await pool.query(
      `DELETE FROM "Wishlist" WHERE "userId" = $1 AND "productId" = $2`,
      [session.user.id, productId]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error removing from wishlist:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
