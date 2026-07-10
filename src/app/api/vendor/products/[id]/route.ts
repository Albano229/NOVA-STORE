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
      `SELECT p.*, c."name" AS "categoryName", p."requiresShippingAddress",
              COALESCE(
                (SELECT json_agg(jsonb_build_object('id', pi."id", 'url', pi."url", 'position', pi."position") ORDER BY pi."position")
                 FROM "ProductImage" pi WHERE pi."productId" = p."id"), '[]'
              ) AS "images",
              (SELECT jsonb_build_object('id', df."id", 'fileUrl', df."fileUrl", 'externalUrl', df."externalUrl", 'fileName', df."fileName", 'fileSize', df."fileSize", 'fileType', df."fileType", 'maxDownloads', df."maxDownloads")
               FROM "DigitalFile" df WHERE df."productId" = p."id" LIMIT 1) AS "digitalFile",
              (SELECT jsonb_build_object('id', po."id", 'shippingEnabled', po."shippingEnabled", 'shippingCost', po."shippingCost", 'shippingCountries', po."shippingCountries")
               FROM "PhysicalOption" po WHERE po."productId" = p."id" LIMIT 1) AS "physicalOpt"
       FROM "Product" p
       LEFT JOIN "Category" c ON c."id" = p."categoryId"
       WHERE p."id" = $1 AND p."shopId" = $2`,
      [id, shop.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error fetching product:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowedFields = [
      "name", "description", "price", "comparePrice", "discountPercent", "sku",
      "stock", "weight", "categoryId", "isActive", "isFeatured", "isHidden",
      "videoUrl", "seoTitle", "seoDescription", "seoKeywords", "productType", "slug",
      "requiresShippingAddress",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        fields.push(`"${field}" = $${idx}`);
        values.push(body[field]);
        idx++;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json(product);
    }

    fields.push(`"updatedAt" = NOW()`);
    values.push(id);

    const updatedResult = await pool.query(
      `UPDATE "Product" SET ${fields.join(", ")} WHERE "id" = $${idx} RETURNING *`,
      values
    );

    return NextResponse.json(updatedResult.rows[0]);
  } catch (error) {
    console.error("Error updating product:", error);
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
    const productResult = await pool.query(`SELECT * FROM "Product" WHERE "id" = $1`, [id]);
    const product = productResult.rows[0];
    if (!product || product.shopId !== shop.id) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    await pool.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [id]);
    await pool.query(`DELETE FROM "DigitalFile" WHERE "productId" = $1`, [id]);
    await pool.query(`DELETE FROM "PhysicalOption" WHERE "productId" = $1`, [id]);
    await pool.query(`DELETE FROM "ProductVariant" WHERE "productId" = $1`, [id]);
    await pool.query(`DELETE FROM "Product" WHERE "id" = $1`, [id]);

    return NextResponse.json({ message: "Produit supprimé" });
  } catch (error) {
    console.error("Error deleting product:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
