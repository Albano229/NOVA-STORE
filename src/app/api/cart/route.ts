import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ items: [] });
    }

    const pool = getAuthPool();
    const result = await pool.query(
      `SELECT 
        ci.id, ci."productId", ci."variantId", ci.quantity,
        p.name, p.price, p.slug,
        COALESCE(
          (SELECT json_agg(pi.url) FROM "ProductImage" pi WHERE pi."productId" = p.id ORDER BY pi."position" LIMIT 1),
          '[]'::json
        ) as images,
        s.id as "shopId", s.name as "shopName",
        p.stock,
        pv.name as "variantName", pv.price as "variantPrice", pv.stock as "variantStock", pv.image as "variantImage", pv.options as "variantOptions"
       FROM "CartItem" ci
       JOIN "Cart" c ON c.id = ci."cartId"
       JOIN "Product" p ON p.id = ci."productId"
       JOIN "Shop" s ON s.id = p."shopId"
       LEFT JOIN "ProductVariant" pv ON pv.id = ci."variantId"
       WHERE c."userId" = $1
       ORDER BY ci."createdAt" DESC`,
      [session.user.id]
    );

    const items = result.rows.map((r) => ({
      id: r.id,
      productId: r.productId,
      variantId: r.variantId || undefined,
      name: r.variantName ? `${r.name} — ${r.variantName}` : r.name,
      price: r.variantPrice ? parseFloat(r.variantPrice) : parseFloat(r.price),
      currency: "XOF",
      image: r.variantImage || (Array.isArray(r.images) && r.images.length > 0 ? r.images[0] : "/placeholder.png"),
      shopId: r.shopId,
      shopName: r.shopName,
      quantity: r.quantity,
      stock: r.variantStock ?? r.stock ?? 0,
      selectedOptions: r.variantOptions || undefined,
    }));

    return NextResponse.json({ items });
  } catch (error) {
    console.error("Error fetching cart:", error);
    return NextResponse.json({ items: [] });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, variantId, quantity = 1 } = body;

    if (!productId) {
      return NextResponse.json({ error: "productId requis" }, { status: 400 });
    }

    const pool = getAuthPool();

    let cartResult = await pool.query(`SELECT id FROM "Cart" WHERE "userId" = $1`, [session.user.id]);
    let cartId: string;

    if (cartResult.rows.length === 0) {
      const newCart = await pool.query(
        `INSERT INTO "Cart" ("id", "userId", "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, NOW(), NOW()) RETURNING id`,
        [session.user.id]
      );
      cartId = newCart.rows[0].id;
    } else {
      cartId = cartResult.rows[0].id;
    }

    const existingItem = await pool.query(
      `SELECT id, quantity FROM "CartItem" WHERE "cartId" = $1 AND "productId" = $2 AND COALESCE("variantId", '') = COALESCE($3, '')`,
      [cartId, productId, variantId || null]
    );

    if (existingItem.rows.length > 0) {
      await pool.query(
        `UPDATE "CartItem" SET quantity = quantity + $1, "updatedAt" = NOW() WHERE id = $2`,
        [quantity, existingItem.rows[0].id]
      );
    } else {
      await pool.query(
        `INSERT INTO "CartItem" ("id", "cartId", "productId", "variantId", quantity, "createdAt", "updatedAt") VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())`,
        [cartId, productId, variantId || null, quantity]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error adding to cart:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { productId, variantId, quantity } = body;

    if (!productId || quantity === undefined) {
      return NextResponse.json({ error: "productId et quantity requis" }, { status: 400 });
    }

    const pool = getAuthPool();
    const cartResult = await pool.query(`SELECT id FROM "Cart" WHERE "userId" = $1`, [session.user.id]);
    if (cartResult.rows.length === 0) {
      return NextResponse.json({ error: "Panier non trouvé" }, { status: 404 });
    }

    if (quantity <= 0) {
      await pool.query(
        `DELETE FROM "CartItem" WHERE "cartId" = $1 AND "productId" = $2 AND COALESCE("variantId", '') = COALESCE($3, '')`,
        [cartResult.rows[0].id, productId, variantId || null]
      );
    } else {
      await pool.query(
        `UPDATE "CartItem" SET quantity = $1, "updatedAt" = NOW() WHERE "cartId" = $2 AND "productId" = $3 AND COALESCE("variantId", '') = COALESCE($4, '')`,
        [quantity, cartResult.rows[0].id, productId, variantId || null]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating cart:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");
    const variantId = searchParams.get("variantId");

    const pool = getAuthPool();
    const cartResult = await pool.query(`SELECT id FROM "Cart" WHERE "userId" = $1`, [session.user.id]);
    if (cartResult.rows.length === 0) {
      return NextResponse.json({ success: true });
    }

    if (productId) {
      await pool.query(
        `DELETE FROM "CartItem" WHERE "cartId" = $1 AND "productId" = $2 AND COALESCE("variantId", '') = COALESCE($3, '')`,
        [cartResult.rows[0].id, productId, variantId || null]
      );
    } else {
      await pool.query(`DELETE FROM "CartItem" WHERE "cartId" = $1`, [cartResult.rows[0].id]);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error clearing cart:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
