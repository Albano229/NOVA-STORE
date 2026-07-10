import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const { shopId } = await params;

    const result = await pool.query(
      `SELECT s.*,
              (SELECT COUNT(*)::int FROM "Product" p WHERE p."shopId" = s."id") AS "productCount",
              (SELECT COUNT(*)::int FROM "Order" o WHERE o."shopId" = s."id") AS "ordersCount",
              COALESCE(
                (SELECT SUM(o."total") FROM "Order" o WHERE o."shopId" = s."id" AND o."paymentStatus" = 'COMPLETED'), 0
              ) AS "revenue"
       FROM "Shop" s
       WHERE s."id" = $1 AND s."userId" = $2`,
      [shopId, session.user.id]
    );

    const shop = result.rows[0];
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    return NextResponse.json(shop);
  } catch (error) {
    console.error("Error fetching shop:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const { shopId } = await params;

    const shopResult = await pool.query(
      `SELECT * FROM "Shop" WHERE "id" = $1 AND "userId" = $2`,
      [shopId, session.user.id]
    );
    const shop = shopResult.rows[0];
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    const body = await req.json();
    const { name, description, phone, email, address, city, country, logo, banner } = body;

    const updatedResult = await pool.query(
      `UPDATE "Shop" SET
        "name" = COALESCE($1, "name"),
        "description" = $2,
        "phone" = $3,
        "email" = $4,
        "address" = $5,
        "city" = $6,
        "country" = $7,
        "logo" = $8,
        "banner" = $9,
        "updatedAt" = NOW()
       WHERE "id" = $10
       RETURNING *`,
      [
        name || shop.name,
        description !== undefined ? description : shop.description,
        phone !== undefined ? phone : shop.phone,
        email !== undefined ? email : shop.email,
        address !== undefined ? address : shop.address,
        city !== undefined ? city : shop.city,
        country !== undefined ? country : shop.country,
        logo !== undefined ? logo : shop.logo,
        banner !== undefined ? banner : shop.banner,
        shop.id,
      ]
    );

    return NextResponse.json(updatedResult.rows[0]);
  } catch (error) {
    console.error("Error updating shop:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ shopId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const { shopId } = await params;

    const shopResult = await pool.query(
      `SELECT * FROM "Shop" WHERE "id" = $1 AND "userId" = $2`,
      [shopId, session.user.id]
    );
    const shop = shopResult.rows[0];
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    const ordersCountResult = await pool.query(
      `SELECT COUNT(*)::int AS count FROM "Order" WHERE "shopId" = $1`,
      [shop.id]
    );
    if (ordersCountResult.rows[0].count > 0) {
      return NextResponse.json(
        { error: "Impossible de supprimer une boutique avec des commandes" },
        { status: 400 }
      );
    }

    await pool.query(`DELETE FROM "ProductImage" WHERE "productId" IN (SELECT "id" FROM "Product" WHERE "shopId" = $1)`, [shop.id]);
    await pool.query(`DELETE FROM "DigitalFile" WHERE "productId" IN (SELECT "id" FROM "Product" WHERE "shopId" = $1)`, [shop.id]);
    await pool.query(`DELETE FROM "PhysicalOption" WHERE "productId" IN (SELECT "id" FROM "Product" WHERE "shopId" = $1)`, [shop.id]);
    await pool.query(`DELETE FROM "ProductVariant" WHERE "productId" IN (SELECT "id" FROM "Product" WHERE "shopId" = $1)`, [shop.id]);
    await pool.query(`DELETE FROM "Product" WHERE "shopId" = $1`, [shop.id]);
    await pool.query(`DELETE FROM "FlashSale" WHERE "shopId" = $1`, [shop.id]);
    await pool.query(`DELETE FROM "StoreConfig" WHERE "shopId" = $1`, [shop.id]);
    await pool.query(`DELETE FROM "Shop" WHERE "id" = $1`, [shop.id]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting shop:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
