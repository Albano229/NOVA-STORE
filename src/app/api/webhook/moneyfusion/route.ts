import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

interface MoneyFusionWebhook {
  event: string;
  tokenPay: string;
  Montant: number;
  frais: number;
  numeroTransaction: string;
  nomclient: string;
  numeroSend: string;
  personal_Info: { userId: string; orderId: string }[];
  return_url: string;
  webhook_url: string;
  createdAt: string;
}

export async function POST(req: Request) {
  try {
    const body: MoneyFusionWebhook = await req.json();
    const { event, tokenPay, Montant, frais, personal_Info } = body;

    if (!event || !tokenPay) {
      return NextResponse.json({ received: true });
    }

    if (
      !personal_Info ||
      !Array.isArray(personal_Info) ||
      personal_Info.length === 0
    ) {
      return NextResponse.json({ received: true });
    }

    const pool = getAuthPool();

    const orderIds = personal_Info
      .map((info) => info.orderId)
      .filter((id): id is string => !!id);

    if (orderIds.length === 0) {
      return NextResponse.json({ received: true });
    }

    for (const orderId of orderIds) {
      const paymentResult = await pool.query(
        `SELECT p.*, o."total", o."paymentStatus"
         FROM "Payment" p
         JOIN "Order" o ON o."id" = p."orderId"
         WHERE p."orderId" = $1`,
        [orderId]
      );

      if (paymentResult.rows.length === 0) continue;

      const payment = paymentResult.rows[0];

      if (
        payment.status === "COMPLETED" &&
        event !== "payin.session.cancelled"
      ) {
        continue;
      }

      if (event === "payin.session.completed") {
        if (Math.abs(payment.total - Montant) > 0.01) {
          console.error(
            `[MoneyFusion Webhook] Amount mismatch for order ${orderId}: expected ${payment.total}, got ${Montant}`
          );
          continue;
        }

        await pool.query(
          `UPDATE "Payment" SET "status" = 'COMPLETED', "metadata" = COALESCE("metadata", '{}')::jsonb || $1::jsonb, "updatedAt" = NOW()
           WHERE "orderId" = $2`,
          [
            JSON.stringify({
              moneyFusionToken: tokenPay,
              moneyFusionFrais: frais,
              moneyFusionTransaction: body.numeroTransaction,
            }),
            orderId,
          ]
        );

        await pool.query(
          `UPDATE "Order" SET "paymentStatus" = 'COMPLETED', "updatedAt" = NOW()
           WHERE "id" = $1 AND "paymentStatus" != 'COMPLETED'`,
          [orderId]
        );

        try {
          const orderRow = await pool.query(
            `SELECT "userId", "shopId", "total" FROM "Order" WHERE "id" = $1`,
            [orderId]
          );
          if (orderRow.rows.length > 0) {
            const { userId, shopId, total } = orderRow.rows[0];
            const configRes = await pool.query(
              `SELECT "isEnabled", "pointsPerCurrency" FROM "LoyaltyConfig" WHERE "shopId" = $1`,
              [shopId]
            );
            const cfg = configRes.rows[0];
            if (cfg?.isEnabled && total > 0) {
              const earnedPoints = Math.floor(total * (cfg.pointsPerCurrency || 1));
              await pool.query(
                `INSERT INTO "LoyaltyPoint" ("id", "userId", "shopId", "orderId", "points", "type", "description", "createdAt")
                 VALUES (gen_random_uuid(), $1, $2, $3, $4, 'EARN', $5, NOW())`,
                [userId, shopId, orderId, earnedPoints, `Achat commande #${orderId} - ${total.toLocaleString()} FCFA`]
              );
            }
          }
        } catch (e) {
          console.error("[LOYALTY] Error earning points:", e);
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

          const orderResult = await pool.query(
            `SELECT "total" FROM "Order" WHERE "id" = $1`,
            [orderId]
          );
          if (orderResult.rows.length > 0) {
            const orderTotal = parseFloat(orderResult.rows[0].total) || 0;
            const vendorShare = orderTotal - comm.amount;

            await pool.query(
              `INSERT INTO "Wallet" ("id", "shopId", "balance", "pendingBalance", "currency", "createdAt", "updatedAt")
               VALUES (gen_random_uuid(), $1, $2, 0, 'XOF', NOW(), NOW())
               ON CONFLICT ("shopId") DO UPDATE SET
                 "pendingBalance" = "Wallet"."pendingBalance" + $2,
                 "updatedAt" = NOW()`,
              [comm.shopId, vendorShare]
            );
          }
        }

        try {
          const orderResult = await pool.query(
            `SELECT o."userId", o."shopId" FROM "Order" o WHERE o."id" = $1`,
            [orderId]
          );

          if (orderResult.rows.length > 0) {
            const order = orderResult.rows[0];
            const notifBody = JSON.stringify({
              type: "PAYMENT_CONFIRMED",
              userId: order.userId,
              orderId,
              shopId: order.shopId,
            });

            await fetch(
              `${process.env.NEXT_PUBLIC_SITE_URL || "https://nova-store-ashy.vercel.app"}/api/notifications/send`,
              {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: notifBody,
              }
            );
          }
        } catch (notifError) {
          console.error(
            `[MoneyFusion Webhook] Notification error for order ${orderId}:`,
            notifError
          );
        }
      } else if (event === "payin.session.cancelled") {
        await pool.query(
          `UPDATE "Payment" SET "status" = 'FAILED', "metadata" = COALESCE("metadata", '{}')::jsonb || $1::jsonb, "updatedAt" = NOW()
           WHERE "orderId" = $2`,
          [
            JSON.stringify({
              moneyFusionToken: tokenPay,
              cancelledAt: new Date().toISOString(),
            }),
            orderId,
          ]
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
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("[MoneyFusion Webhook] Error:", error);
    return NextResponse.json({ received: true });
  }
}
