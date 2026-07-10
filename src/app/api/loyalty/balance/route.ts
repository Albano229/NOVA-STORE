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
      `SELECT COALESCE(SUM(points), 0) AS total_points
       FROM "LoyaltyPoint"
       WHERE "userId" = $1`,
      [session.user.id]
    );

    const historyResult = await pool.query(
      `SELECT lp.*, s."name" AS "shopName"
       FROM "LoyaltyPoint" lp
       LEFT JOIN "Shop" s ON s."id" = lp."shopId"
       WHERE lp."userId" = $1
       ORDER BY lp."createdAt" DESC
       LIMIT 50`,
      [session.user.id]
    );

    const byShopResult = await pool.query(
      `SELECT lp."shopId", s."name" AS "shopName", COALESCE(SUM(lp.points), 0) AS points
       FROM "LoyaltyPoint" lp
       LEFT JOIN "Shop" s ON s."id" = lp."shopId"
       WHERE lp."userId" = $1
       GROUP BY lp."shopId", s."name"
       ORDER BY points DESC`,
      [session.user.id]
    );

    return NextResponse.json({
      totalPoints: parseInt(result.rows[0]?.total_points || "0"),
      history: historyResult.rows,
      byShop: byShopResult.rows,
    });
  } catch (error) {
    console.error("Loyalty balance error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
