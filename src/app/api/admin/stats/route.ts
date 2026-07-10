import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();

    const [revenueResult, ordersCount, productsCount, vendorsCount, clientsCount, activeShops, inactiveShops, recentOrdersResult, recentVendorsResult, productTypes, commissions, payouts, chartRevenueResult, chartVendorsResult] = await Promise.all([
      pool.query(`SELECT COALESCE(SUM("total"), 0) as total FROM "Order" WHERE "paymentStatus" = 'COMPLETED'`),
      pool.query(`SELECT COUNT(*)::int as count FROM "Order"`),
      pool.query(`SELECT COUNT(*)::int as count FROM "Product"`),
      pool.query(`SELECT COUNT(*)::int as count FROM "User" WHERE "role" = 'VENDOR'`),
      pool.query(`SELECT COUNT(*)::int as count FROM "User" WHERE "role" = 'CLIENT'`),
      pool.query(`SELECT COUNT(*)::int as count FROM "Shop" WHERE "isActive" = true`),
      pool.query(`SELECT COUNT(*)::int as count FROM "Shop" WHERE "isActive" = false`),
      pool.query(`
        SELECT o."id", o."orderNumber", o."total", o."status", o."createdAt",
               json_build_object('name', u."name", 'email', u."email") as "user",
               json_build_object('name', s."name") as "shop"
        FROM "Order" o
        LEFT JOIN "User" u ON o."userId" = u."id"
        LEFT JOIN "Shop" s ON o."shopId" = s."id"
        ORDER BY o."createdAt" DESC LIMIT 8
      `),
      pool.query(`
        SELECT u."id", u."name", u."email", u."image",
               COALESCE(json_agg(json_build_object('name', sh."name")) FILTER (WHERE sh."id" IS NOT NULL), '[]') as "shops"
        FROM "User" u
        LEFT JOIN "Shop" sh ON sh."userId" = u."id"
        WHERE u."role" = 'VENDOR'
        GROUP BY u."id"
        ORDER BY u."createdAt" DESC LIMIT 6
      `),
      pool.query(`
        SELECT
          COUNT(*) FILTER (WHERE "productType" = 'PHYSICAL')::int as "physical",
          COUNT(*) FILTER (WHERE "productType" = 'DIGITAL')::int as "digital",
          COUNT(*) FILTER (WHERE "productType" = 'SERVICE')::int as "service"
        FROM "Product"
      `),
      pool.query(`SELECT COALESCE(SUM("amount"), 0) as total FROM "Commission" WHERE "status" = 'PAID'`),
      pool.query(`SELECT COALESCE(SUM("amount"), 0) as total FROM "VendorPayout" WHERE "status" = 'PENDING'`),
      // Monthly revenue chart: last 6 months
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') AS month,
               COALESCE(SUM("total"), 0)::numeric AS revenue
        FROM "Order"
        WHERE "paymentStatus" = 'COMPLETED'
          AND "createdAt" >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
      `),
      // Monthly vendors chart: last 6 months
      pool.query(`
        SELECT TO_CHAR(DATE_TRUNC('month', "createdAt"), 'Mon') AS month,
               COUNT(*)::int AS vendeurs
        FROM "User"
        WHERE "role" = 'VENDOR'
          AND "createdAt" >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
        GROUP BY DATE_TRUNC('month', "createdAt")
        ORDER BY DATE_TRUNC('month', "createdAt") ASC
      `),
    ]);

    return NextResponse.json({
      totalRevenue: parseFloat(revenueResult.rows[0]?.total || "0"),
      totalOrders: ordersCount.rows[0]?.count || 0,
      totalProducts: productsCount.rows[0]?.count || 0,
      totalVendors: vendorsCount.rows[0]?.count || 0,
      totalClients: clientsCount.rows[0]?.count || 0,
      activeBoutiques: activeShops.rows[0]?.count || 0,
      suspendedBoutiques: inactiveShops.rows[0]?.count || 0,
      physicalProducts: productTypes.rows[0]?.physical || 0,
      digitalProducts: productTypes.rows[0]?.digital || 0,
      serviceProducts: productTypes.rows[0]?.service || 0,
      earnedCommissions: parseFloat(commissions.rows[0]?.total || "0"),
      pendingPayouts: parseFloat(payouts.rows[0]?.total || "0"),
      recentOrders: recentOrdersResult.rows,
      recentVendors: recentVendorsResult.rows,
      chartRevenue: chartRevenueResult.rows.map((r) => ({
        month: r.month,
        revenue: parseFloat(r.revenue) || 0,
      })),
      chartVendors: chartVendorsResult.rows.map((r) => ({
        month: r.month,
        vendeurs: r.vendeurs,
      })),
    });
  } catch (error) {
    console.error("Error fetching admin stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
