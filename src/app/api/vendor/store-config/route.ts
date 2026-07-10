import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);

    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    const configResult = await pool.query(
      `SELECT * FROM "StoreConfig" WHERE "shopId" = $1`,
      [shop.id]
    );

    return NextResponse.json({ shopId: shop.id, config: configResult.rows.length > 0 ? configResult.rows : null });
  } catch (error) {
    console.error("Error fetching store config:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    const body = await req.json();
    const { shopId, ...configData } = body;

    const existingResult = await pool.query(
      `SELECT * FROM "StoreConfig" WHERE "shopId" = $1`,
      [shop.id]
    );

    if (existingResult.rows.length > 0) {
      const fields: string[] = [];
      const values: any[] = [];
      let idx = 1;

      for (const [key, value] of Object.entries(configData)) {
        fields.push(`"${key}" = $${idx}`);
        values.push(typeof value === "object" ? JSON.stringify(value) : value);
        idx++;
      }

      if (fields.length > 0) {
        values.push(shop.id);
        await pool.query(
          `UPDATE "StoreConfig" SET ${fields.join(", ")} WHERE "shopId" = $${idx}`,
          values
        );
      }
    } else {
      const keys = Object.keys(configData);
      const cols = ["id", "shopId", ...keys.map((k) => `"${k}"`)].join(", ");
      const placeholders = Array.from({ length: keys.length + 2 }, (_, i) => `$${i + 1}`).join(", ");
      const values = [require("crypto").randomUUID(), shop.id, ...Object.values(configData).map((v) => typeof v === "object" ? JSON.stringify(v) : v)];

      await pool.query(
        `INSERT INTO "StoreConfig" (${cols}) VALUES (${placeholders})`,
        values
      );
    }

    const updatedConfig = await pool.query(
      `SELECT * FROM "StoreConfig" WHERE "shopId" = $1`,
      [shop.id]
    );

    return NextResponse.json(updatedConfig.rows[0] || {});
  } catch (error) {
    console.error("Error updating store config:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
