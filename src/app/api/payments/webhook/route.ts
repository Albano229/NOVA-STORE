import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const pool = getAuthPool();

    const { event, data } = body;

    if (event === "charge.completed" && data?.tx_ref) {
      const txRef = data.tx_ref;
      const orderId = txRef.split("-")[1];

      await pool.query(
        `UPDATE "Payment" SET "status" = 'COMPLETED', "updatedAt" = NOW() WHERE "orderId" = $1`,
        [orderId]
      );

      await pool.query(
        `UPDATE "Order" SET "paymentStatus" = 'COMPLETED', "updatedAt" = NOW() WHERE id = $1`,
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
        `SELECT c.id, c.amount, c."shopId"
         FROM "Commission" c
         WHERE c."orderId" = $1 AND c.status = 'PENDING'`,
        [orderId]
      );

      if (commissionResult.rows.length > 0) {
        const comm = commissionResult.rows[0];
        await pool.query(
          `UPDATE "Commission" SET "status" = 'PAID', "paidAt" = NOW(), "updatedAt" = NOW() WHERE id = $1`,
          [comm.id]
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
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Webhook error:", error);
    return NextResponse.json({ error: "Webhook processing failed" }, { status: 500 });
  }
}
