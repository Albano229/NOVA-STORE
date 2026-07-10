import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const { id } = await params;
    const result = await pool.query(
      `SELECT fs.*,
              json_build_object('id', p."id", 'name', p."name", 'slug', p."slug", 'price', p."price") AS "product",
              (SELECT json_agg(jsonb_build_object('id', pi."id", 'url', pi."url"))
               FROM "ProductImage" pi WHERE pi."productId" = p."id" ORDER BY pi."position" LIMIT 1) AS "images"
       FROM "FlashSale" fs
       INNER JOIN "Product" p ON p."id" = fs."productId"
       WHERE fs."id" = $1`,
      [id]
    );

    const flashSale = result.rows[0];
    if (!flashSale || flashSale.shopId !== shop.id) {
      return NextResponse.json({ error: "Vente flash non trouvée" }, { status: 404 });
    }

    return NextResponse.json(flashSale);
  } catch (error) {
    console.error("Error fetching flash sale:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const { id } = await params;
    const existingResult = await pool.query(`SELECT * FROM "FlashSale" WHERE "id" = $1`, [id]);
    const flashSale = existingResult.rows[0];
    if (!flashSale || flashSale.shopId !== shop.id) {
      return NextResponse.json({ error: "Vente flash non trouvée" }, { status: 404 });
    }

    const body = await req.json();
    const { salePrice, title, startsAt, endsAt, isActive } = body;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (salePrice !== undefined) { fields.push(`"salePrice" = $${idx}`); values.push(parseFloat(String(salePrice))); idx++; }
    if (title !== undefined) { fields.push(`"title" = $${idx}`); values.push(title); idx++; }
    if (startsAt !== undefined) { fields.push(`"startsAt" = $${idx}`); values.push(new Date(startsAt)); idx++; }
    if (endsAt !== undefined) { fields.push(`"endsAt" = $${idx}`); values.push(new Date(endsAt)); idx++; }
    if (isActive !== undefined) { fields.push(`"isActive" = $${idx}`); values.push(isActive); idx++; }

    if (fields.length === 0) {
      return NextResponse.json(flashSale);
    }

    values.push(id);
    const updatedResult = await pool.query(
      `UPDATE "FlashSale" SET ${fields.join(", ")} WHERE "id" = $${idx} RETURNING *`,
      values
    );

    const updated = updatedResult.rows[0];
    const productResult = await pool.query(
      `SELECT "id", "name", "slug", "price" FROM "Product" WHERE "id" = $1`,
      [updated.productId]
    );

    return NextResponse.json({ ...updated, product: productResult.rows[0] });
  } catch (error) {
    console.error("Error updating flash sale:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  return PUT(req, { params });
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const { id } = await params;
    const existingResult = await pool.query(`SELECT * FROM "FlashSale" WHERE "id" = $1`, [id]);
    const flashSale = existingResult.rows[0];
    if (!flashSale || flashSale.shopId !== shop.id) {
      return NextResponse.json({ error: "Vente flash non trouvée" }, { status: 404 });
    }

    await pool.query(`DELETE FROM "FlashSale" WHERE "id" = $1`, [id]);
    return NextResponse.json({ message: "Vente flash supprimée" });
  } catch (error) {
    console.error("Error deleting flash sale:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
