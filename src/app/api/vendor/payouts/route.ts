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

    const result = await pool.query(
      `SELECT * FROM "VendorPayout" WHERE "shopId" = $1 ORDER BY "createdAt" DESC`,
      [shop.id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching payouts:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const body = await req.json();
    const { amount, method } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Montant invalide" }, { status: 400 });
    }

    const walletResult = await pool.query(
      `SELECT * FROM "Wallet" WHERE "shopId" = $1 LIMIT 1`,
      [shop.id]
    );

    if (walletResult.rows.length === 0) {
      return NextResponse.json({ error: "Portefeuille introuvable" }, { status: 404 });
    }

    const wallet = walletResult.rows[0];
    if (wallet.balance < amount) {
      return NextResponse.json(
        { error: `Solde insuffisant. Disponible: ${wallet.balance} ${wallet.currency}` },
        { status: 400 }
      );
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      await client.query(
        `UPDATE "Wallet" SET "balance" = "balance" - $1, "updatedAt" = NOW()
         WHERE "shopId" = $2`,
        [amount, shop.id]
      );

      const result = await client.query(
        `INSERT INTO "VendorPayout" ("id", "shopId", "amount", "status", "method", "accountInfo", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, 'PENDING', $3, $4, NOW(), NOW())
         RETURNING *`,
        [shop.id, amount, method || null, JSON.stringify({ userId: session.user.id })]
      );

      await client.query("COMMIT");
      return NextResponse.json(result.rows[0]);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating payout:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
