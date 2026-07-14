import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";
import crypto from "crypto";

interface FlutterwaveWebhook {
  event: string;
  data: {
    id: number;
    tx_ref: string;
    flw_ref: string;
    device_fingerprint: string;
    amount: number;
    currency: string;
    status: string;
    charge_response_code: string;
    charge_response_message: string;
    created_at: string;
    customer: {
      id: number;
      name: string;
      phone_number: string;
      email: string;
    };
    meta?: {
      orderIds?: string;
      userId?: string;
    };
  };
}

function verifyFlutterwaveSignature(req: Request, body: string): boolean {
  const secretKey = process.env.FLUTTERWAVE_SECRET_KEY;
  if (!secretKey) return true;

  const signature = req.headers.get("verif-hash");
  if (!signature) return true;

  const hmac = crypto.createHmac("sha256", secretKey);
  hmac.update(body);
  const hash = hmac.digest("hex");
  return hash === signature;
}

async function markOrderPaid(pool: any, orderId: string, txRef: string, flwRef: string, amount: number) {
  const paymentResult = await pool.query(
    `SELECT p.*, o."total", o."paymentStatus", o."shopId", o."userId"
     FROM "Payment" p
     JOIN "Order" o ON o."id" = p."orderId"
     WHERE p."orderId" = $1`,
    [orderId]
  );

  if (paymentResult.rows.length === 0) return;
  const payment = paymentResult.rows[0];
  if (payment.status === "COMPLETED") return;

  await pool.query(
    `UPDATE "Payment" SET "status" = 'COMPLETED', "transactionId" = $1,
     "metadata" = COALESCE("metadata", '{}')::jsonb || $2::jsonb, "updatedAt" = NOW()
     WHERE "orderId" = $3`,
    [flwRef, JSON.stringify({ flutterwaveTxRef: txRef, flutterwaveFlwRef: flwRef }), orderId]
  );

  await pool.query(
    `UPDATE "Order" SET "paymentStatus" = 'COMPLETED', "updatedAt" = NOW()
     WHERE "id" = $1 AND "paymentStatus" != 'COMPLETED'`,
    [orderId]
  );

  try {
    const orderRow = paymentResult.rows[0];
    const configRes = await pool.query(
      `SELECT "isEnabled", "pointsPerCurrency" FROM "LoyaltyConfig" WHERE "shopId" = $1`,
      [orderRow.shopId]
    );
    const cfg = configRes.rows[0];
    if (cfg?.isEnabled && orderRow.total > 0) {
      const earnedPoints = Math.floor(orderRow.total * (cfg.pointsPerCurrency || 1));
      await pool.query(
        `INSERT INTO "LoyaltyPoint" ("id", "userId", "shopId", "orderId", "points", "type", "description", "createdAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, 'EARN', $5, NOW())`,
        [orderRow.userId, orderRow.shopId, orderId, earnedPoints, `Achat commande #${orderId} - ${amount} ${payment.currency}`]
      );
    }
  } catch (e) {
    console.error("[FLUTTERWAVE_WEBHOOK] Loyalty error:", e);
  }

  const commissionResult = await pool.query(
    `SELECT c.id, c.amount, c."shopId" FROM "Commission" c
     WHERE c."orderId" = $1 AND c.status = 'PENDING'`,
    [orderId]
  );

  if (commissionResult.rows.length > 0) {
    const comm = commissionResult.rows[0];
    await pool.query(
      `UPDATE "Commission" SET "status" = 'PAID', "paidAt" = NOW(), "updatedAt" = NOW()
       WHERE "orderId" = $1 AND status = 'PENDING'`,
      [orderId]
    );

    const orderTotal = parseFloat(payment.total) || 0;
    const vendorShare = orderTotal - comm.amount;

    await pool.query(
      `INSERT INTO "Wallet" ("id", "shopId", "balance", "pendingBalance", "currency", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, 0, $3, NOW(), NOW())
       ON CONFLICT ("shopId") DO UPDATE SET
         "pendingBalance" = "Wallet"."pendingBalance" + $2,
         "updatedAt" = NOW()`,
      [comm.shopId, vendorShare, payment.currency || "XOF"]
    );
  }

  try {
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nova-store-ashy.vercel.app";
    await fetch(`${siteUrl}/api/notifications/send`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "PAYMENT_CONFIRMED",
        userId: payment.userId,
        orderId,
        shopId: payment.shopId,
      }),
    });
  } catch (e) {
    console.error("[FLUTTERWAVE_WEBHOOK] Notification error:", e);
  }
}

async function markOrderFailed(pool: any, orderId: string, txRef: string) {
  await pool.query(
    `UPDATE "Payment" SET "status" = 'FAILED', "metadata" = COALESCE("metadata", '{}')::jsonb || $1::jsonb, "updatedAt" = NOW()
     WHERE "orderId" = $2`,
    [JSON.stringify({ flutterwaveFailedAt: new Date().toISOString() }), orderId]
  );

  await pool.query(
    `UPDATE "Order" SET "paymentStatus" = 'FAILED', "updatedAt" = NOW()
     WHERE "id" = $1 AND "paymentStatus" = 'PENDING'`,
    [orderId]
  );

  await pool.query(
    `UPDATE "Product" SET "stock" = "stock" + oi."quantity", "updatedAt" = NOW()
     FROM "OrderItem" oi
     WHERE oi."orderId" = $1 AND oi."productId" = "Product"."id"`,
    [orderId]
  );
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();

    if (!verifyFlutterwaveSignature(req, rawBody)) {
      console.error("[FLUTTERWAVE_WEBHOOK] Invalid signature");
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    const body: FlutterwaveWebhook = JSON.parse(rawBody);
    const { event, data } = body;

    if (!event || !data) {
      return NextResponse.json({ received: true });
    }

    const meta = data.meta as any;
    const orderIds = meta?.orderIds
      ? meta.orderIds.split(",").filter((id: string) => !!id)
      : [];

    if (orderIds.length === 0) {
      return NextResponse.json({ received: true });
    }

    const pool = getAuthPool();

    if (event === "charge.completed" && data.status === "successful") {
      for (const orderId of orderIds) {
        await markOrderPaid(pool, orderId, data.tx_ref, data.flw_ref, data.amount);
      }
    } else if (
      (event === "charge.completed" && data.status === "failed") ||
      event === "charge.cancelled"
    ) {
      for (const orderId of orderIds) {
        await markOrderFailed(pool, orderId, data.tx_ref);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[FLUTTERWAVE_WEBHOOK] Error:", error);
    return NextResponse.json({ received: true });
  }
}
