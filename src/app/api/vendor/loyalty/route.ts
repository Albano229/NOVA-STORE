import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR", "OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const configResult = await pool.query(`SELECT * FROM "LoyaltyConfig" WHERE "shopId" = $1`, [shop.id]);
    const statsResult = await pool.query(
      `SELECT COUNT(DISTINCT "userId") AS members, COALESCE(SUM(points), 0) AS totalPointsEarned
       FROM "LoyaltyPoint" WHERE "shopId" = $1 AND type = 'EARN'`,
      [shop.id]
    );

    return NextResponse.json({
      config: configResult.rows[0] || {
        isEnabled: true,
        pointsPerCurrency: 1.0,
        redeemRate: 100.0,
        minRedeem: 500,
      },
      stats: statsResult.rows[0],
    });
  } catch (error) {
    console.error("Loyalty config GET error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR", "OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const body = await req.json();
    const { isEnabled, pointsPerCurrency, redeemRate, minRedeem } = body;

    await pool.query(
      `INSERT INTO "LoyaltyConfig" ("id", "shopId", "isEnabled", "pointsPerCurrency", "redeemRate", "minRedeem", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW(), NOW())
       ON CONFLICT ("shopId") DO UPDATE SET
         "isEnabled" = EXCLUDED."isEnabled",
         "pointsPerCurrency" = EXCLUDED."pointsPerCurrency",
         "redeemRate" = EXCLUDED."redeemRate",
         "minRedeem" = EXCLUDED."minRedeem",
         "updatedAt" = NOW()`,
      [
        shop.id,
        isEnabled !== false,
        pointsPerCurrency || 1.0,
        redeemRate || 100.0,
        minRedeem || 500,
      ]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Loyalty config PATCH error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
