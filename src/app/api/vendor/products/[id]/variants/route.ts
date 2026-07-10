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
    const productResult = await pool.query(`SELECT * FROM "Product" WHERE "id" = $1`, [id]);
    const product = productResult.rows[0];
    if (!product || product.shopId !== shop.id) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    const result = await pool.query(
      `SELECT * FROM "ProductVariant" WHERE "productId" = $1 ORDER BY "createdAt" ASC`,
      [id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching variants:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const { id } = await params;
    const productResult = await pool.query(`SELECT * FROM "Product" WHERE "id" = $1`, [id]);
    const product = productResult.rows[0];
    if (!product || product.shopId !== shop.id) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    const body = await req.json();
    const { name, price, stock, sku, options } = body;

    if (!name || price === undefined) {
      return NextResponse.json({ error: "Le nom et le prix sont requis" }, { status: 400 });
    }

    const result = await pool.query(
      `INSERT INTO "ProductVariant" ("id", "productId", "name", "price", "stock", "sku", "options", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [id, name, parseFloat(String(price)), stock !== undefined ? parseInt(String(stock)) : 0, sku || null, options ? JSON.stringify(options) : null]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating variant:", error);
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
    const body = await req.json();
    const { variantId, name, price, stock, sku, options } = body;

    if (!variantId) {
      return NextResponse.json({ error: "variantId requis" }, { status: 400 });
    }

    const variantResult = await pool.query(`SELECT * FROM "ProductVariant" WHERE "id" = $1`, [variantId]);
    const variant = variantResult.rows[0];
    if (!variant || variant.productId !== id) {
      return NextResponse.json({ error: "Variante non trouvée" }, { status: 404 });
    }

    const productResult = await pool.query(`SELECT * FROM "Product" WHERE "id" = $1`, [id]);
    const product = productResult.rows[0];
    if (!product || product.shopId !== shop.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name !== undefined) { fields.push(`"name" = $${idx}`); values.push(name); idx++; }
    if (price !== undefined) { fields.push(`"price" = $${idx}`); values.push(parseFloat(String(price))); idx++; }
    if (stock !== undefined) { fields.push(`"stock" = $${idx}`); values.push(parseInt(String(stock))); idx++; }
    if (sku !== undefined) { fields.push(`"sku" = $${idx}`); values.push(sku); idx++; }
    if (options !== undefined) { fields.push(`"options" = $${idx}`); values.push(JSON.stringify(options)); idx++; }

    if (fields.length === 0) {
      return NextResponse.json(variant);
    }

    values.push(variantId);
    const updatedResult = await pool.query(
      `UPDATE "ProductVariant" SET ${fields.join(", ")} WHERE "id" = $${idx} RETURNING *`,
      values
    );

    return NextResponse.json(updatedResult.rows[0]);
  } catch (error) {
    console.error("Error updating variant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
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
    const body = await req.json();
    const { variantId } = body;

    if (!variantId) {
      return NextResponse.json({ error: "variantId requis" }, { status: 400 });
    }

    const variantResult = await pool.query(`SELECT * FROM "ProductVariant" WHERE "id" = $1`, [variantId]);
    const variant = variantResult.rows[0];
    if (!variant || variant.productId !== id) {
      return NextResponse.json({ error: "Variante non trouvée" }, { status: 404 });
    }

    const productResult = await pool.query(`SELECT * FROM "Product" WHERE "id" = $1`, [id]);
    const product = productResult.rows[0];
    if (!product || product.shopId !== shop.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    await pool.query(`DELETE FROM "ProductVariant" WHERE "id" = $1`, [variantId]);
    return NextResponse.json({ message: "Variante supprimée" });
  } catch (error) {
    console.error("Error deleting variant:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
