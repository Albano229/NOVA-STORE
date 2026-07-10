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

    const result = await pool.query(
      `SELECT s.*,
              (SELECT COUNT(*)::int FROM "Product" p WHERE p."shopId" = s."id") AS "productCount"
       FROM "Shop" s
       WHERE s."userId" = $1
       LIMIT 1`,
      [session.user.id]
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

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

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
