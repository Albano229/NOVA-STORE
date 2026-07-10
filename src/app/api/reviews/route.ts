import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400 });
    }

    const pool = getAuthPool();

    const result = await pool.query(
      `SELECT
        r.id, r.rating, r.comment, r."createdAt",
        json_build_object(
          'name', u.name,
          'image', u.image
        ) AS "user"
      FROM "Review" r
      LEFT JOIN "User" u ON u.id = r."userId"
      WHERE r."productId" = $1
      ORDER BY r."createdAt" DESC`,
      [productId]
    );

    return NextResponse.json({ reviews: result.rows });
  } catch (error) {
    console.error("Error fetching reviews:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, rating, comment } = body;

    if (!productId || !rating || rating < 1 || rating > 5) {
      return NextResponse.json(
        { error: "Données invalides" },
        { status: 400 }
      );
    }

    const pool = getAuthPool();

    // 1. Vérifier que l'utilisateur a acheté ce produit (commande livrée/payée)
    const purchaseCheck = await pool.query(
      `SELECT o.id
       FROM "OrderItem" oi
       JOIN "Order" o ON o.id = oi."orderId"
       WHERE oi."productId" = $1
         AND o."userId" = $2
         AND o."paymentStatus" = 'COMPLETED'
         AND o.status != 'CANCELLED'
       LIMIT 1`,
      [productId, session.user.id]
    );

    if (purchaseCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Seuls les clients ayant acheté ce produit peuvent laisser un avis." },
        { status: 403 }
      );
    }

    // 2. Vérifier si l'utilisateur a déjà laissé un avis
    const existingReview = await pool.query(
      `SELECT id FROM "Review" WHERE "userId" = $1 AND "productId" = $2`,
      [session.user.id, productId]
    );

    if (existingReview.rows.length > 0) {
      return NextResponse.json(
        { error: "Vous avez déjà laissé un avis pour ce produit." },
        { status: 409 }
      );
    }

    // 3. Récupérer le shopId du produit
    const productResult = await pool.query(
      `SELECT "shopId" FROM "Product" WHERE id = $1`,
      [productId]
    );

    if (productResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Produit non trouvé" },
        { status: 404 }
      );
    }

    const shopId = productResult.rows[0].shopId;

    // 4. Créer l'avis
    const newReview = await pool.query(
      `INSERT INTO "Review" ("id", "userId", "productId", "shopId", "rating", "comment", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, NOW(), NOW())
       RETURNING id, rating, comment, "createdAt"`,
      [session.user.id, productId, shopId, rating, comment || null]
    );

    // 5. Recalculer la moyenne automatiquement
    const statsResult = await pool.query(
      `SELECT COALESCE(AVG(rating), 0)::float AS "avgRating",
              COUNT(*)::int AS "reviewCount"
       FROM "Review"
       WHERE "productId" = $1`,
      [productId]
    );

    const { avgRating, reviewCount } = statsResult.rows[0];

    await pool.query(
      `UPDATE "Product"
       SET "avgRating" = $1, "reviewCount" = $2, "updatedAt" = NOW()
       WHERE id = $3`,
      [Math.round(avgRating * 10) / 10, reviewCount, productId]
    );

    // 6. Aussi recalculer la moyenne du shop (si les colonnes existent)
    try {
      const shopStats = await pool.query(
        `SELECT COALESCE(AVG(r.rating), 0)::float AS "avgRating",
                COUNT(*)::int AS "reviewCount"
         FROM "Review" r
         WHERE r."shopId" = $1`,
        [shopId]
      );

      const shopStatsData = shopStats.rows[0];
      await pool.query(
        `UPDATE "Shop"
         SET "updatedAt" = NOW()
         WHERE id = $1`,
        [shopId]
      );
    } catch {
      // Shop may not have avgRating/reviewCount columns - safe to ignore
    }

    return NextResponse.json(
      {
        success: true,
        review: newReview.rows[0],
        stats: { avgRating, reviewCount },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating review:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
