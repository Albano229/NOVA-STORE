import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const walletResult = await pool.query(
      `SELECT * FROM "Wallet" WHERE "shopId" = $1 LIMIT 1`,
      [shop.id]
    );

    if (walletResult.rows.length === 0) {
      await pool.query(
        `INSERT INTO "Wallet" ("id", "shopId", "balance", "pendingBalance", "currency", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, 0, 0, 'XOF', NOW(), NOW())`,
        [shop.id]
      );
      return NextResponse.json({
        balance: 0,
        pendingBalance: 0,
        currency: "XOF",
        totalEarned: 0,
        totalPaid: 0,
      });
    }

    const wallet = walletResult.rows[0];

    const [totalEarnedResult, totalPaidResult] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM("total"), 0)::numeric AS sum FROM "Order" WHERE "shopId" = $1 AND "paymentStatus" = 'COMPLETED'`,
        [shop.id]
      ),
      pool.query(
        `SELECT COALESCE(SUM("amount"), 0)::numeric AS sum FROM "VendorPayout" WHERE "shopId" = $1 AND "status" = 'COMPLETED'`,
        [shop.id]
      ),
    ]);

    const totalEarned = parseFloat(totalEarnedResult.rows[0].sum) || 0;
    const totalPaid = parseFloat(totalPaidResult.rows[0].sum) || 0;

    return NextResponse.json({
      balance: wallet.balance,
      pendingBalance: wallet.pendingBalance,
      currency: wallet.currency,
      totalEarned,
      totalPaid,
      availableBalance: wallet.balance,
    });
  } catch (error) {
    console.error("Error fetching balance:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
