import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();

    const txQ = await pool.query(`
      SELECT p."id", p."orderId", p."method", p."amount", p."status", p."createdAt",
        o."orderNumber", o."total" AS "orderTotal",
        u."name" AS "customerName", u."email" AS "customerEmail",
        sh."name" AS "shopName",
        c."amount" AS "commissionAmount", c."status" AS "commissionStatus"
      FROM "Payment" p
      LEFT JOIN "Order" o ON o."id" = p."orderId"
      LEFT JOIN "User" u ON u."id" = o."userId"
      LEFT JOIN "Shop" sh ON sh."id" = o."shopId"
      LEFT JOIN "Commission" c ON c."orderId" = o."id"
      ORDER BY p."createdAt" DESC
    `).catch(() => ({ rows: [] }));

    const payoutsQ = await pool.query(`
      SELECT pt."id", pt."amount", pt."status", pt."method", pt."createdAt",
        u."name" AS "vendorName", sh."name" AS "shopName"
      FROM "VendorPayout" pt
      LEFT JOIN "User" u ON u."id" = pt."userId"
      LEFT JOIN "Shop" sh ON sh."id" = pt."shopId"
      ORDER BY pt."createdAt" DESC
    `).catch(() => ({ rows: [] }));

    const commissionsQ = await pool.query(`
      SELECT c."id", c."amount", c."rate", c."status", c."createdAt",
        o."orderNumber", sh."name" AS "shopName"
      FROM "Commission" c
      LEFT JOIN "Order" o ON o."id" = c."orderId"
      LEFT JOIN "Shop" sh ON sh."id" = c."shopId"
      ORDER BY c."createdAt" DESC
    `).catch(() => ({ rows: [] }));

    const statsQ = await pool.query(`
      SELECT
        COALESCE(SUM("amount") FILTER (WHERE "status" = 'COMPLETED'), 0)::float AS "totalRevenue",
        COALESCE(SUM("amount") FILTER (WHERE "status" = 'COMPLETED' AND "createdAt" >= CURRENT_DATE), 0)::float AS "todayRevenue",
        COALESCE(SUM("amount") FILTER (WHERE "status" = 'COMPLETED' AND "createdAt" >= date_trunc('month', CURRENT_DATE)), 0)::float AS "monthRevenue",
        COUNT(*)::int AS "totalTransactions",
        COUNT(*) FILTER (WHERE "status" = 'COMPLETED')::int AS "successfulTransactions",
        COUNT(*) FILTER (WHERE "status" = 'FAILED')::int AS "failedTransactions",
        COUNT(*) FILTER (WHERE "status" = 'PENDING')::int AS "pendingTransactions"
      FROM "Payment"
    `).catch(() => ({ rows: [{ totalRevenue: 0, todayRevenue: 0, monthRevenue: 0, totalTransactions: 0, successfulTransactions: 0, failedTransactions: 0, pendingTransactions: 0 }] }));

    const commStatsQ = await pool.query(`
      SELECT
        COALESCE(SUM("amount") FILTER (WHERE "status" = 'PAID'), 0)::float AS "totalCommissions",
        COALESCE(SUM("amount") FILTER (WHERE "status" = 'PENDING'), 0)::float AS "pendingCommissions"
      FROM "Commission"
    `).catch(() => ({ rows: [{ totalCommissions: 0, pendingCommissions: 0 }] }));

    return NextResponse.json({
      transactions: txQ.rows,
      payouts: payoutsQ.rows,
      commissions: commissionsQ.rows,
      refunds: [],
      stats: { ...statsQ.rows[0], ...commStatsQ.rows[0], totalRefunds: 0 },
    });
  } catch (error) {
    console.error("Error fetching payments:", error);
    return NextResponse.json({
      transactions: [],
      payouts: [],
      commissions: [],
      refunds: [],
      stats: { totalRevenue: 0, todayRevenue: 0, monthRevenue: 0, totalCommissions: 0, pendingCommissions: 0, totalTransactions: 0, successfulTransactions: 0, failedTransactions: 0, pendingTransactions: 0, totalRefunds: 0 },
    });
  }
}
