import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

function safeFloat(value: unknown, fallback: number): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = parseFloat(String(value));
  return isNaN(n) ? fallback : n;
}

function safeInt(value: unknown, fallback: number): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? fallback : n;
}

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
  const pool = getAuthPool();
  const client = await pool.connect();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const { id } = await params;
    const productResult = await client.query(`SELECT * FROM "Product" WHERE "id" = $1`, [id]);
    const product = productResult.rows[0];
    if (!product || product.shopId !== shop.id) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    const body = await req.json();
    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    const allowedFields: Record<string, (v: any) => any> = {
      name: (v) => String(v || "").trim() || product.name,
      description: (v) => v || null,
      price: (v) => safeFloat(v, 0),
      comparePrice: (v) => v ? safeFloat(v, 0) : null,
      discountPercent: (v) => v ? safeFloat(v, 0) : null,
      sku: (v) => v || null,
      stock: (v) => safeInt(v, 0),
      weight: (v) => v ? safeFloat(v, 0) : null,
      categoryId: (v) => v || product.categoryId,
      isActive: (v) => v !== false,
      isFeatured: (v) => v === true,
      isHidden: (v) => v === true,
      videoUrl: (v) => v || null,
      seoTitle: (v) => v || null,
      seoDescription: (v) => v || null,
      seoKeywords: (v) => v || null,
      productType: (v) => v || "PHYSICAL",
      slug: (v) => {
        if (v && String(v).trim()) return String(v).trim();
        const base = (product.slug || product.name || "produit")
          .toLowerCase()
          .normalize("NFD")
          .replace(/[\u0300-\u036f]/g, "")
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/(^-|-$)/g, "");
        return `${base}-${Date.now()}`;
      },
      requiresShippingAddress: (v) => v !== false,
      brand: (v) => v || null,
      dimensions: (v) => v || null,
      ctaText: (v) => v || null,
      ctaColor: (v) => v || null,
      warranty: (v) => v || null,
      returnPolicy: (v) => v || null,
      postPurchaseInstructions: (v) => v || null,
      shortDescription: (v) => v || null,
    };

    for (const [field, sanitize] of Object.entries(allowedFields)) {
      if (body[field] !== undefined) {
        fields.push(`"${field}" = $${idx}`);
        values.push(sanitize(body[field]));
        idx++;
      }
    }

    const metadata = body.metadata;
    if (metadata && typeof metadata === "object") {
      const currentMeta = product.metadata && typeof product.metadata === "object" ? product.metadata : {};
      fields.push(`"metadata" = $${idx}`);
      values.push(JSON.stringify({ ...currentMeta, ...metadata }));
      idx++;
    }

    if (fields.length === 0) {
      return NextResponse.json(product);
    }

    fields.push(`"updatedAt" = NOW()`);
    values.push(id);

    await client.query("BEGIN");

    const updatedResult = await client.query(
      `UPDATE "Product" SET ${fields.join(", ")} WHERE "id" = $${idx} RETURNING *`,
      values
    );

    if (body.images && Array.isArray(body.images)) {
      await client.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [id]);
      for (let i = 0; i < body.images.length; i++) {
        const img = body.images[i];
        const url = typeof img === "string" ? img : (img?.url || img?.url === "" ? null : null);
        const realUrl = typeof img === "string" ? img : img?.url;
        if (realUrl && String(realUrl).trim()) {
          const alt = typeof img === "string" ? "" : (img?.alt || "");
          await client.query(
            `INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "position") VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
            [id, String(realUrl).trim(), alt || null, i]
          );
        }
      }
    }

    const pType = body.productType || product.productType;

    if (pType === "DIGITAL" && body.digitalFile) {
      const df = body.digitalFile;
      await client.query(`DELETE FROM "DigitalFile" WHERE "productId" = $1`, [id]);
      await client.query(
        `INSERT INTO "DigitalFile" ("id", "productId", "fileUrl", "externalUrl", "fileName", "fileSize", "fileType", "maxDownloads", "storagePath", "storageBucket")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          id,
          df.fileUrl || df.externalUrl || null,
          df.externalUrl || null,
          df.fileName || null,
          safeInt(df.fileSize, 0),
          df.fileType || null,
          safeInt(df.maxDownloads, 0),
          df.storagePath || null,
          df.storageBucket || "nova-files",
        ]
      );
    }

    if ((pType === "PHYSICAL") && body.physicalOption) {
      const po = body.physicalOption;
      await client.query(`DELETE FROM "PhysicalOption" WHERE "productId" = $1`, [id]);
      const sCountries = Array.isArray(po.shippingCountries) ? po.shippingCountries : [];
      await client.query(
        `INSERT INTO "PhysicalOption" ("id", "productId", "shippingEnabled", "shippingCost", "shippingCountries")
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [
          id,
          po.shippingEnabled !== false,
          safeFloat(po.shippingCost, 0),
          sCountries.length > 0 ? JSON.stringify(sCountries) : null,
        ]
      );
    }

    await client.query("COMMIT");

    return NextResponse.json(updatedResult.rows[0]);
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("[PRODUCT_UPDATE_ERROR]", {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      constraint: error?.constraint,
    });
    return NextResponse.json(
      {
        error: "Erreur lors de la mise à jour du produit",
        details: error?.message || "Erreur inconnue",
        detail: error?.detail || null,
        constraint: error?.constraint || null,
      },
      { status: 500 }
    );
  } finally {
    client.release();
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
