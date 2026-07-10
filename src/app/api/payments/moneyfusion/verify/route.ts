import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

interface MoneyFusionVerifyResponse {
  statut: boolean;
  message: string;
  data: {
    tokenPay: string;
    Montant: number;
    frais: number;
    statut: "pending" | "paid" | "failed" | "no paid";
    personal_Info: { userId: string; orderId: string }[];
    numeroTransaction: string;
    createdAt: string;
  };
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const token = searchParams.get("token");

  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL || "https://nova-store-ashy.vercel.app";

  if (!token) {
    return NextResponse.redirect(`${siteUrl}/account/orders`);
  }

  try {
    const verifyRes = await fetch(
      `https://www.pay.moneyfusion.net/paiementNotif/${token}`,
      { signal: AbortSignal.timeout(10000) }
    );

    if (!verifyRes.ok) {
      return NextResponse.redirect(`${siteUrl}/account/orders?payment=error`);
    }

    const verifyData: MoneyFusionVerifyResponse = await verifyRes.json();

    if (!verifyData.statut || !verifyData.data) {
      return NextResponse.redirect(`${siteUrl}/account/orders?payment=failed`);
    }

    const { statut: paymentStatus, personal_Info } = verifyData.data;

    if (paymentStatus === "paid" && personal_Info?.length > 0) {
      const pool = getAuthPool();

      for (const info of personal_Info) {
        if (!info.orderId) continue;

        const paymentResult = await pool.query(
          `SELECT p."status" FROM "Payment" p WHERE p."orderId" = $1`,
          [info.orderId]
        );

        if (
          paymentResult.rows.length > 0 &&
          paymentResult.rows[0].status !== "COMPLETED"
        ) {
          await pool.query(
            `UPDATE "Payment" SET "status" = 'COMPLETED', "updatedAt" = NOW()
             WHERE "orderId" = $1 AND "status" != 'COMPLETED'`,
            [info.orderId]
          );

          await pool.query(
            `UPDATE "Order" SET "paymentStatus" = 'COMPLETED', "updatedAt" = NOW()
             WHERE "id" = $1 AND "paymentStatus" != 'COMPLETED'`,
            [info.orderId]
          );

          const commissionResult = await pool.query(
            `SELECT c.id, c.amount, c."shopId" FROM "Commission" c
             WHERE c."orderId" = $1 AND status = 'PENDING'`,
            [info.orderId]
          );

          if (commissionResult.rows.length > 0) {
            const comm = commissionResult.rows[0];
            await pool.query(
              `UPDATE "Commission" SET "status" = 'PAID', "paidAt" = NOW(), "updatedAt" = NOW()
               WHERE "orderId" = $1 AND status = 'PENDING'`,
              [info.orderId]
            );

            const orderResult = await pool.query(
              `SELECT "total" FROM "Order" WHERE "id" = $1`,
              [info.orderId]
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
            const orderRow = await pool.query(
              `SELECT "userId", "shopId", "total" FROM "Order" WHERE "id" = $1`,
              [info.orderId]
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
                  [userId, shopId, info.orderId, earnedPoints, `Achat commande #${info.orderId} - ${total.toLocaleString()} FCFA`]
                );
              }
            }
          } catch (e) {
            console.error("[LOYALTY] Error earning points:", e);
          }
        }
      }

      return NextResponse.redirect(`${siteUrl}/account/orders?success=true`);
    }

    if (paymentStatus === "pending") {
      return NextResponse.redirect(`${siteUrl}/account/orders?payment=pending`);
    }

    return NextResponse.redirect(`${siteUrl}/account/orders?payment=failed`);
  } catch (error) {
    console.error("[MoneyFusion Verify] Error:", error);
    return NextResponse.redirect(`${siteUrl}/account/orders?payment=error`);
  }
}
