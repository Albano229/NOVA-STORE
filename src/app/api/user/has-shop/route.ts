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
      `SELECT COUNT(*)::int AS count FROM "Shop" WHERE "userId" = $1`,
      [session.user.id]
    );

    const hasShop = result.rows[0].count > 0;

    let shop = null;
    if (hasShop) {
      const shopResult = await pool.query(
        `SELECT "id", "name", "slug", "isActive", "isVerified"
         FROM "Shop" WHERE "userId" = $1
         ORDER BY "createdAt" DESC LIMIT 1`,
        [session.user.id]
      );
      shop = shopResult.rows[0] || null;
    }

    return NextResponse.json({ hasShop, shop });
  } catch (error) {
    console.error("Error checking shop:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
