import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { shopId, points } = body;

    if (!shopId || !points || points <= 0) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const pool = getAuthPool();

    const configResult = await pool.query(
      `SELECT * FROM "LoyaltyConfig" WHERE "shopId" = $1`,
      [shopId]
    );
    const config = configResult.rows[0];
    if (!config || !config.isEnabled) {
      return NextResponse.json({ error: "Programme de fidélité non actif" }, { status: 400 });
    }

    if (points < config.minRedeem) {
      return NextResponse.json(
        { error: `Minimum ${config.minRedeem} points requis` },
        { status: 400 }
      );
    }

    const balanceResult = await pool.query(
      `SELECT COALESCE(SUM(points), 0) AS balance FROM "LoyaltyPoint" WHERE "userId" = $1 AND "shopId" = $2`,
      [session.user.id, shopId]
    );
    const balance = parseInt(balanceResult.rows[0]?.balance || "0");

    if (balance < points) {
      return NextResponse.json({ error: "Solde insuffisant" }, { status: 400 });
    }

    const discount = points / config.redeemRate;

    await pool.query(
      `INSERT INTO "LoyaltyPoint" ("id", "userId", "shopId", "points", "type", "description", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, 'REDEEM', $4, NOW())`,
      [session.user.id, shopId, -points, `Échange de ${points} points en réduction de ${discount.toLocaleString()} FCFA`]
    );

    return NextResponse.json({
      success: true,
      discount,
      newBalance: balance - points,
    });
  } catch (error) {
    console.error("Loyalty redeem error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
