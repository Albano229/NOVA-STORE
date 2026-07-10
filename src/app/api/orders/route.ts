import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { generateOrderNumber } from "@/lib/utils";
import { withRateLimit } from "@/lib/api-rate-limit";

export const POST = withRateLimit(
  async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { shopId, paymentMethod, items, subtotal, shippingAddress, clientName, clientEmail, clientPhone, notes, couponCode, discount } = body;

    if (!shopId || !paymentMethod || !items?.length || subtotal == null) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const shippingFee = 0;
    const discountAmount = discount || 0;

    const pool = getAuthPool();

    let tax = 0;
    try {
      const taxRulesResult = await pool.query(
        `SELECT value FROM "SiteSettings" WHERE key = 'taxRules'`
      );
      const defaultTaxResult = await pool.query(
        `SELECT value FROM "SiteSettings" WHERE key = 'defaultTaxRate'`
      );
      const defaultTaxRate = defaultTaxResult.rows.length > 0 ? parseFloat(defaultTaxResult.rows[0].value) || 0 : 0;

      if (taxRulesResult.rows.length > 0) {
        let rules: { country: string; rate: number; active: boolean }[] = [];
        try { rules = JSON.parse(taxRulesResult.rows[0].value); } catch {}
        const country = shippingAddress?.country || "";
        const matched = rules.find((r) => r.active && r.country.toUpperCase() === country.toUpperCase());
        if (matched) {
          tax = Math.round(subtotal * matched.rate / 100);
        } else {
          tax = Math.round(subtotal * defaultTaxRate / 100);
        }
      } else {
        tax = Math.round(subtotal * defaultTaxRate / 100);
      }
    } catch {}

    const total = subtotal + shippingFee + tax - discountAmount;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const productIds = items.map((item: any) => item.productId);
      const variantIds = items.filter((item: any) => item.variantId).map((item: any) => item.variantId);
      const productsResult = await client.query(
        `SELECT id, name, stock, "productType" FROM "Product" WHERE id = ANY($1)`,
        [productIds]
      );
      const productMap = new Map(productsResult.rows.map((p) => [p.id, p]));

      let variantMap = new Map();
      if (variantIds.length > 0) {
        const variantsResult = await client.query(
          `SELECT id, name, stock, "productId" FROM "ProductVariant" WHERE id = ANY($1)`,
          [variantIds]
        );
        variantMap = new Map(variantsResult.rows.map((v) => [v.id, v]));
      }

      for (const item of items) {
        const product = productMap.get(item.productId);
        const isPhysical = product?.productType === "PHYSICAL";

        if (item.variantId) {
          const variant = variantMap.get(item.variantId);
          if (!variant) {
            await client.query("ROLLBACK");
            return NextResponse.json({ error: `Variante ${item.variantId} introuvable` }, { status: 404 });
          }
          if (isPhysical && variant.stock < item.quantity) {
            await client.query("ROLLBACK");
            return NextResponse.json({ error: `Stock insuffisant pour ${variant.name}` }, { status: 400 });
          }
        } else {
          if (!product) {
            await client.query("ROLLBACK");
            return NextResponse.json({ error: `Produit ${item.productId} introuvable` }, { status: 404 });
          }
          if (isPhysical && product.stock < item.quantity) {
            await client.query("ROLLBACK");
            return NextResponse.json({ error: `Stock insuffisant pour ${product.name}` }, { status: 400 });
          }
        }
      }

      const orderNumber = generateOrderNumber();

      const orderResult = await client.query(
        `INSERT INTO "Order" ("orderNumber", "userId", "shopId", "subtotal", "shippingFee", "tax", "discount", "total", "paymentMethod", "shippingAddress", "notes")
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
         RETURNING *`,
        [orderNumber, session.user.id, shopId, subtotal, shippingFee, tax, discountAmount, total, paymentMethod, shippingAddress ? JSON.stringify(shippingAddress) : null, notes || null]
      );
      const order = orderResult.rows[0];

      for (const item of items) {
        const product = productMap.get(item.productId);
        const variant = item.variantId ? variantMap.get(item.variantId) : null;
        await client.query(
          `INSERT INTO "OrderItem" ("orderId", "productId", "variantId", "name", "price", "quantity")
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [order.id, item.productId, item.variantId || null, variant?.name || product?.name || item.productId, item.price, item.quantity]
        );
      }

      for (const item of items) {
        const product = productMap.get(item.productId);
        const isPhysical = product?.productType === "PHYSICAL";

        if (isPhysical) {
          if (item.variantId) {
            await client.query(
              `UPDATE "ProductVariant"
               SET stock = stock - $1
               WHERE id = $2`,
              [item.quantity, item.variantId]
            );
          }
          await client.query(
            `UPDATE "Product"
             SET stock = stock - $1, "soldCount" = "soldCount" + $1
             WHERE id = $2`,
            [item.quantity, item.productId]
          );
        } else {
          await client.query(
            `UPDATE "Product"
             SET "soldCount" = "soldCount" + $1
             WHERE id = $2`,
            [item.quantity, item.productId]
          );
        }
      }

      const shopResult = await client.query(
        `SELECT "commissionRate" FROM "Shop" WHERE id = $1`,
        [shopId]
      );
      if (shopResult.rows.length > 0) {
        const commissionRate = shopResult.rows[0].commissionRate;
        const commissionAmount = (total * commissionRate) / 100;
        await client.query(
          `INSERT INTO "Commission" ("orderId", "shopId", amount, rate)
           VALUES ($1, $2, $3, $4)`,
          [order.id, shopId, commissionAmount, commissionRate]
        );
      }

      if (couponCode && discountAmount > 0) {
        const couponResult = await client.query(
          `SELECT id FROM "Coupon" WHERE code = $1 AND "isActive" = true`,
          [couponCode.toUpperCase()]
        );
        if (couponResult.rows.length > 0) {
          const couponId = couponResult.rows[0].id;
          await client.query(
            `INSERT INTO "CouponUsage" ("couponId", "userId", "orderId", amount)
             VALUES ($1, $2, $3, $4)`,
            [couponId, session.user.id, order.id, discountAmount]
          );
          await client.query(
            `UPDATE "Coupon" SET "usedCount" = "usedCount" + 1 WHERE id = $1`,
            [couponId]
          );
        }
      }

      await client.query("COMMIT");

      const itemsResult = await client.query(
        `SELECT * FROM "OrderItem" WHERE "orderId" = $1`,
        [order.id]
      );

      const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nova-store-ashy.vercel.app";

      try {
        const vendorUserResult = await pool.query(
          `SELECT u.id, u.name, u.email, u.phone FROM "User" u JOIN "Shop" s ON s."userId" = u.id WHERE s.id = $1`,
          [shopId]
        );
        if (vendorUserResult.rows.length > 0) {
          const vendor = vendorUserResult.rows[0];
          await fetch(`${siteUrl}/api/notifications/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: "NEW_ORDER_VENDOR",
              recipientId: vendor.id,
              recipientPhone: vendor.phone,
              recipientEmail: vendor.email,
              data: {
                orderId: order.id,
                orderNumber,
                customerName: clientName,
                amount: total,
              },
            }),
          });
        }
      } catch {}

      return NextResponse.json({ ...order, items: itemsResult.rows });
    } catch (txError) {
      await client.query("ROLLBACK");
      throw txError;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error creating order:", error);
    return NextResponse.json({ error: "Erreur lors de la création de la commande" }, { status: 500 });
  }
},
  { limit: 20, window: 60_000, keyPrefix: "orders" }
);

export const GET = withRateLimit(
  async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const pool = getAuthPool();

    const conditions: string[] = [`o."userId" = $1`];
    const params: any[] = [session.user.id];
    let paramIdx = 2;

    if (status) {
      conditions.push(`o.status = $${paramIdx}`);
      params.push(status);
      paramIdx++;
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const result = await pool.query(
      `SELECT
        o.*,
        json_build_object('name', s.name) AS shop,
        COALESCE(
          (SELECT json_agg(json_build_object('id', oi.id, 'productId', oi."productId", 'name', oi.name, 'price', oi.price, 'quantity', oi.quantity, 'image', oi.image))
           FROM "OrderItem" oi WHERE oi."orderId" = o.id),
          '[]'::json
        ) AS items
      FROM "Order" o
      LEFT JOIN "Shop" s ON s.id = o."shopId"
      ${whereClause}
      ORDER BY o."createdAt" DESC`,
      params
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
},
  { limit: 20, window: 60_000, keyPrefix: "orders" }
);
