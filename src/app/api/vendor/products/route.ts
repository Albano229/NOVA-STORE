import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

function safeInt(value: unknown, fallback: number): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = parseInt(String(value), 10);
  return isNaN(n) ? fallback : n;
}

function safeFloat(value: unknown, fallback: number): number {
  if (value === null || value === undefined || value === "") return fallback;
  const n = parseFloat(String(value));
  return isNaN(n) ? fallback : n;
}

function safeStr(value: unknown): string | null {
  if (value === null || value === undefined) return null;
  const s = String(value).trim();
  return s === "" ? null : s;
}

export async function POST(req: Request) {
  const pool = getAuthPool();
  const client = await pool.connect();
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const {
      name, description, price, comparePrice, discountPercent, sku, stock, weight,
      categoryId, subcategoryId, isActive, isFeatured, isHidden, videoUrl, seoTitle, seoDescription,
      seoKeywords, slug: customSlug, productType, images, variants, shopId,
      ctaText, ctaColor, ctaStyle, priceType, currency, dimensions, brand,
      postPurchaseInstructions, postPurchaseQuill, warranty, returnPolicy,
      fileUrl, externalUrl, fileName, fileSize, fileType, maxDownloads, version, accessDuration,
      storagePath, storageBucket,
      duration, availability, locationType, zone, clientForm,
      isSubscription, subscriptionPrice, subscriptionInterval, privateAccess, accessType, communityInfo,
      bundleDiscount, bundleItems, bundleProducts,
      eventDate, eventTime, eventDuration, eventLocation, maxSeats, availabilitySchedule,
      shippingEnabled, shippingCost, shippingCountries, preparationDelay, collectDeliveryAddress, requiresShippingAddress,
      autoDiscount, autoDiscountType, autoDiscountValue, salesLimit,
      countdownStartDate, countdownEndDate, countdownEnabled,
      customButton, hideFromStore, faqItems, shortDescription, status,
    } = body;

    const shop = await getVendorShop(pool, session.user.id, shopId);
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    const pType = safeStr(productType) || "PHYSICAL";
    const finalPrice = priceType === "free" ? 0 : safeFloat(price, 0);
    const productStatus = status === "draft" ? "draft" : "published";

    if (!name?.trim()) {
      return NextResponse.json({ error: "Le nom du produit est requis" }, { status: 400 });
    }
    if (!categoryId) {
      return NextResponse.json({ error: "La catégorie est requise" }, { status: 400 });
    }
    if (!priceType) {
      return NextResponse.json({ error: "Le type de facturation est requis" }, { status: 400 });
    }
    if (priceType !== "free" && finalPrice <= 0) {
      return NextResponse.json({ error: "Le prix de vente est requis pour un produit non gratuit" }, { status: 400 });
    }

    const slug = (customSlug || name)
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    const existingProduct = await client.query(`SELECT "id" FROM "Product" WHERE "slug" = $1 LIMIT 1`, [slug]);
    const finalSlug = existingProduct.rows.length > 0 ? `${slug}-${Date.now()}` : slug;

    await client.query("BEGIN");

    const productResult = await client.query(
      `INSERT INTO "Product" ("id", "shopId", "name", "slug", "description", "productType", "price", "comparePrice", "discountPercent", "sku", "stock", "weight", "categoryId", "isActive", "isFeatured", "isHidden", "videoUrl", "seoTitle", "seoDescription", "seoKeywords", "brand", "dimensions", "ctaText", "ctaColor", "postPurchaseInstructions", "warranty", "returnPolicy", "status", "requiresShippingAddress", "metadata", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26, $27, $28, $29, NOW(), NOW())
       RETURNING *`,
      [
        shop.id,
        name.trim(),
        finalSlug,
        safeStr(description),
        pType,
        finalPrice,
        comparePrice ? safeFloat(comparePrice, 0) : null,
        discountPercent ? safeFloat(discountPercent, 0) : null,
        safeStr(sku),
        safeInt(stock, 0),
        weight ? safeFloat(weight, 0) : null,
        categoryId,
        isActive !== false,
        isFeatured === true,
        isHidden === true,
        safeStr(videoUrl),
        safeStr(seoTitle),
        safeStr(seoDescription),
        safeStr(seoKeywords),
        safeStr(brand),
        safeStr(dimensions),
        safeStr(ctaText),
        safeStr(ctaColor),
        safeStr(postPurchaseInstructions),
        safeStr(warranty),
        safeStr(returnPolicy),
        productStatus,
        pType === "PHYSICAL" ? true : (requiresShippingAddress !== false),
        JSON.stringify({
          autoDiscount: autoDiscount ?? false,
          autoDiscountType: autoDiscountType ?? "percentage",
          autoDiscountValue: safeFloat(autoDiscountValue, 0),
          salesLimit: safeInt(salesLimit, 0),
          countdownEnabled: countdownEnabled ?? false,
          countdownStartDate: countdownStartDate ?? null,
          countdownEndDate: countdownEndDate ?? null,
          customButton: customButton ?? null,
          hideFromStore: hideFromStore ?? false,
          faqItems: Array.isArray(faqItems) ? faqItems : [],
          collectDeliveryAddress: collectDeliveryAddress ?? false,
          shortDescription: shortDescription ?? null,
          postPurchaseQuill: postPurchaseQuill ?? null,
          priceType: priceType ?? "fixed",
          currency: currency ?? "XOF",
        }),
      ]
    );
    const product = productResult.rows[0];

    const imageArr = Array.isArray(images) ? images : [];
    for (let i = 0; i < imageArr.length; i++) {
      const img = imageArr[i];
      const url = typeof img === "string" ? img : img?.url;
      const alt = typeof img === "string" ? "" : (img?.alt || "");
      if (url) {
        await client.query(
          `INSERT INTO "ProductImage" ("id", "productId", "url", "alt", "position") VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
          [product.id, url, alt || null, i]
        );
      }
    }

    if (pType === "DIGITAL") {
      await client.query(
        `INSERT INTO "DigitalFile" ("id", "productId", "fileUrl", "externalUrl", "fileName", "fileSize", "fileType", "maxDownloads", "storagePath", "storageBucket")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9)`,
        [
          product.id,
          safeStr(fileUrl) || safeStr(externalUrl),
          safeStr(externalUrl),
          safeStr(fileName),
          safeInt(fileSize, 0),
          safeStr(fileType),
          safeInt(maxDownloads, 0),
          safeStr(storagePath),
          safeStr(storageBucket) || "nova-files",
        ]
      );
    }

    if (pType === "PHYSICAL") {
      const sCountries = Array.isArray(shippingCountries) ? shippingCountries : [];
      await client.query(
        `INSERT INTO "PhysicalOption" ("id", "productId", "shippingEnabled", "shippingCost", "shippingCountries")
         VALUES (gen_random_uuid(), $1, $2, $3, $4)`,
        [
          product.id,
          shippingEnabled !== false,
          safeFloat(shippingCost, 0),
          sCountries.length > 0 ? JSON.stringify(sCountries) : null,
        ]
      );
    }

    if (Array.isArray(variants)) {
      for (const v of variants) {
        if (!v.name) continue;
        await client.query(
          `INSERT INTO "ProductVariant" ("id", "productId", "name", "sku", "price", "stock", "options")
           VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6)`,
          [
            product.id,
            v.name,
            safeStr(v.sku),
            safeFloat(v.price, 0),
            safeInt(v.stock, 0),
            v.options ? JSON.stringify(v.options) : null,
          ]
        );
      }
    }

    await client.query("COMMIT");

    const fullResult = await pool.query(
      `SELECT p.*, c."name" AS "categoryName", p."requiresShippingAddress",
              json_agg(DISTINCT jsonb_build_object('id', pi."id", 'url', pi."url", 'alt', pi."alt", 'position', pi."position")) FILTER (WHERE pi."id" IS NOT NULL) AS "images",
              jsonb_build_object('id', df."id", 'fileUrl', df."fileUrl", 'externalUrl', df."externalUrl", 'fileName', df."fileName", 'fileSize', df."fileSize", 'fileType', df."fileType", 'maxDownloads', df."maxDownloads") AS "digitalFile",
              jsonb_build_object('id', po."id", 'shippingEnabled', po."shippingEnabled", 'shippingCost', po."shippingCost", 'shippingCountries', po."shippingCountries") AS "physicalOpt"
       FROM "Product" p
       LEFT JOIN "Category" c ON c."id" = p."categoryId"
       LEFT JOIN "ProductImage" pi ON pi."productId" = p."id"
       LEFT JOIN "DigitalFile" df ON df."productId" = p."id"
       LEFT JOIN "PhysicalOption" po ON po."productId" = p."id"
       WHERE p."id" = $1
       GROUP BY p."id", c."name", df."id", df."fileUrl", df."externalUrl", df."fileName", df."fileSize", df."fileType", df."maxDownloads", po."id", po."shippingEnabled", po."shippingCost", po."shippingCountries"`,
      [product.id]
    );

    return NextResponse.json(fullResult.rows[0], { status: 201 });
  } catch (error: any) {
    try { await client.query("ROLLBACK"); } catch {}
    console.error("[PRODUCT_CREATE_ERROR]", {
      message: error?.message,
      code: error?.code,
      detail: error?.detail,
      constraint: error?.constraint,
      table: error?.table,
      column: error?.column,
    });
    return NextResponse.json(
      {
        error: "Erreur lors de la création du produit",
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

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const { searchParams } = new URL(req.url);
    const shopId = searchParams.get("shopId") || undefined;

    const shop = await getVendorShop(pool, session.user.id, shopId);
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

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
       WHERE p."shopId" = $1
       ORDER BY p."createdAt" DESC`,
      [shop.id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching vendor products:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
