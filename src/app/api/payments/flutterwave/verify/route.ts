import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const txRef = searchParams.get("tx_ref");
    const transactionId = searchParams.get("transaction_id");

    if (!txRef && !transactionId) {
      return NextResponse.redirect(new URL("/account/orders?payment=error", req.url));
    }

    const pool = getAuthPool();

    const paymentResult = await pool.query(
      `SELECT p.*, o."id" as "orderId", o."userId", o."shopId"
       FROM "Payment" p
       JOIN "Order" o ON o."id" = p."orderId"
       WHERE p."transactionId" LIKE $1
       ORDER BY p."createdAt" DESC LIMIT 1`,
      [`%${txRef || transactionId}%`]
    );

    if (paymentResult.rows.length === 0) {
      return NextResponse.redirect(new URL("/account/orders?payment=error", req.url));
    }

    const payment = paymentResult.rows[0];
    if (payment.status === "COMPLETED") {
      return NextResponse.redirect(new URL("/account/orders?success=true", req.url));
    }

    const flutterwaveKey = process.env.FLUTTERWAVE_SECRET_KEY;
    if (!flutterwaveKey || !transactionId) {
      return NextResponse.redirect(new URL("/account/orders?success=true", req.url));
    }

    const fwRes = await fetch(`https://api.flutterwave.com/v3/transactions/${transactionId}/verify`, {
      headers: { Authorization: `Bearer ${flutterwaveKey}` },
    });

    if (fwRes.ok) {
      const { data } = await fwRes.json();
      if (data?.status === "successful") {
        return NextResponse.redirect(new URL("/account/orders?success=true", req.url));
      }
    }

    return NextResponse.redirect(new URL("/account/orders?payment=failed", req.url));
  } catch (error) {
    console.error("[FLUTTERWAVE_VERIFY] Error:", error);
    return NextResponse.redirect(new URL("/account/orders?payment=error", req.url));
  }
}
