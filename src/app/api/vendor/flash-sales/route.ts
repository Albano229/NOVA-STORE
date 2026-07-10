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
      `SELECT fs.*,
              json_build_object('id', p."id", 'name', p."name", 'slug', p."slug", 'price', p."price") AS "product",
              (SELECT json_agg(jsonb_build_object('id', pi."id", 'url', pi."url"))
               FROM "ProductImage" pi WHERE pi."productId" = p."id" ORDER BY pi."position" LIMIT 1) AS "images"
       FROM "FlashSale" fs
       INNER JOIN "Product" p ON p."id" = fs."productId"
       WHERE fs."shopId" = $1
       ORDER BY fs."createdAt" DESC`,
      [shop.id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching flash sales:", error);
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
    const { productId, salePrice, title, startsAt, endsAt, isActive } = body;

    if (!productId || salePrice === undefined || !startsAt || !endsAt) {
      return NextResponse.json(
        { error: "productId, salePrice, startsAt et endsAt sont requis" },
        { status: 400 }
      );
    }

    const productResult = await pool.query(`SELECT * FROM "Product" WHERE "id" = $1`, [productId]);
    const product = productResult.rows[0];
    if (!product || product.shopId !== shop.id) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    const result = await pool.query(
      `INSERT INTO "FlashSale" ("id", "shopId", "productId", "title", "salePrice", "originalPrice", "startsAt", "endsAt", "isActive")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [shop.id, productId, title || product.name, parseFloat(String(salePrice)), product.price, new Date(startsAt), new Date(endsAt), isActive !== false]
    );

    const flashSale = result.rows[0];

    const productData = await pool.query(
      `SELECT "id", "name", "slug", "price" FROM "Product" WHERE "id" = $1`,
      [productId]
    );

    return NextResponse.json({ ...flashSale, product: productData.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("Error creating flash sale:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
