import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getAuthPool();

    const existing = await pool.query(
      `SELECT r.id, r."productId", r."shopId", r."userId"
       FROM "Review" r WHERE r.id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Avis non trouvé" }, { status: 404 });
    }

    const review = existing.rows[0];

    if (review.userId !== session.user.id && session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await pool.query(`DELETE FROM "Review" WHERE id = $1`, [id]);

    const statsResult = await pool.query(
      `SELECT COALESCE(AVG(rating), 0)::float AS "avgRating",
              COUNT(*)::int AS "reviewCount"
       FROM "Review"
       WHERE "productId" = $1`,
      [review.productId]
    );

    const { avgRating, reviewCount } = statsResult.rows[0];

    await pool.query(
      `UPDATE "Product"
       SET "avgRating" = $1, "reviewCount" = $2, "updatedAt" = NOW()
       WHERE id = $3`,
      [Math.round(avgRating * 10) / 10, reviewCount, review.productId]
    );

    try {
      const shopStats = await pool.query(
        `SELECT COALESCE(AVG(r.rating), 0)::float AS "avgRating",
                COUNT(*)::int AS "reviewCount"
         FROM "Review" r
         WHERE r."shopId" = $1`,
        [review.shopId]
      );

      const shopStatsData = shopStats.rows[0];
      await pool.query(
        `UPDATE "Shop"
         SET "updatedAt" = NOW()
         WHERE id = $1`,
        [review.shopId]
      );
    } catch {
      // Shop may not have avgRating/reviewCount columns - safe to ignore
    }

    return NextResponse.json({
      success: true,
      stats: { avgRating, reviewCount },
    });
  } catch (error) {
    console.error("Error deleting review:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
