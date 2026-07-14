import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

interface FedaPayWebhook {
  event: string;
  data: {
    id: number;
    reference: string;
    status: string;
    amount: number;
    currency: { iso: string };
    description: string;
    token: string;
    customer: {
      email: string;
      firstname: string;
      lastname: string;
      phone_number: string;
    };
    meta?: {
      orderIds?: string;
      userId?: string;
    };
  };
}

async function markOrderPaid(pool: any, orderId: string, token: string, amount: number, currency: string) {
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
    [token, JSON.stringify({ fedapayToken: token, fedapayCurrency: currency }), orderId]
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
        [orderRow.userId, orderRow.shopId, orderId, earnedPoints, `Achat commande #${orderId} - ${amount} ${currency}`]
      );
    }
  } catch (e) {
    console.error("[FEDAPAY_WEBHOOK] Loyalty error:", e);
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
      [comm.shopId, vendorShare, currency || "XOF"]
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
    console.error("[FEDAPAY_WEBHOOK] Notification error:", e);
  }
}

async function markOrderFailed(pool: any, orderId: string) {
  await pool.query(
    `UPDATE "Payment" SET "status" = 'FAILED', "updatedAt" = NOW()
     WHERE "orderId" = $1 AND "status" = 'PENDING'`,
    [orderId]
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
    const body: FedaPayWebhook = await req.json();
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

    if (event === "transaction.successful" || data.status === "approved") {
      for (const orderId of orderIds) {
        await markOrderPaid(pool, orderId, data.token, data.amount, data.currency?.iso || "XOF");
      }
    } else if (
      event === "transaction.failed" ||
      event === "transaction.cancelled" ||
      data.status === "declined"
    ) {
      for (const orderId of orderIds) {
        await markOrderFailed(pool, orderId);
      }
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[FEDAPAY_WEBHOOK] Error:", error);
    return NextResponse.json({ received: true });
  }
}
