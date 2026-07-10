import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body = await req.json().catch(() => ({}));
    const isAuthorized =
      (session?.user && session.user.role === "ADMIN") ||
      body.secret === process.env.MIGRATION_SECRET;

    if (!isAuthorized) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();

    await pool.query(`
      CREATE TABLE IF NOT EXISTS "Wallet" (
        "id" TEXT NOT NULL,
        "shopId" TEXT NOT NULL,
        "balance" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "pendingBalance" DOUBLE PRECISION NOT NULL DEFAULT 0,
        "currency" TEXT NOT NULL DEFAULT 'XOF',
        "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
        "updatedAt" TIMESTAMP(3) NOT NULL,
        CONSTRAINT "Wallet_pkey" PRIMARY KEY ("id")
      );
    `);

    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "Wallet" ADD CONSTRAINT "Wallet_shopId_key" UNIQUE ("shopId");
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        CREATE INDEX IF NOT EXISTS "Wallet_shopId_idx" ON "Wallet"("shopId");
      EXCEPTION WHEN duplicate_object THEN NULL;
      END $$;
    `);

    await pool.query(`
      DO $$ BEGIN
        ALTER TABLE "Product" ADD COLUMN "requiresShippingAddress" BOOLEAN NOT NULL DEFAULT true;
      EXCEPTION WHEN duplicate_column THEN NULL;
      END $$;
    `);

    const shopsResult = await pool.query(`SELECT "id" FROM "Shop"`);
    let created = 0;
    for (const shop of shopsResult.rows) {
      const existing = await pool.query(
        `SELECT "id" FROM "Wallet" WHERE "shopId" = $1 LIMIT 1`,
        [shop.id]
      );
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO "Wallet" ("id", "shopId", "balance", "pendingBalance", "currency", "createdAt", "updatedAt")
           VALUES (gen_random_uuid(), $1, 0, 0, 'XOF', NOW(), NOW())`,
          [shop.id]
        );
        created++;
      }
    }

    return NextResponse.json({
      message: "Migration terminée",
      tableCreated: true,
      walletsCreated: created,
      totalShops: shopsResult.rows.length,
    });
  } catch (error) {
    console.error("Migration error:", error);
    return NextResponse.json(
      { error: "Erreur lors de la migration", details: error instanceof Error ? error.message : "Unknown" },
      { status: 500 }
    );
  }
}
