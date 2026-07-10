import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "30d";

    let dateInterval = "30 days";
    if (period === "7d") dateInterval = "7 days";
    else if (period === "90d") dateInterval = "90 days";
    else if (period === "1y") dateInterval = "1 year";

    const pool = getAuthPool();

    const overviewQ = await pool.query(`
      SELECT
        COALESCE(SUM(CASE WHEN "paymentStatus" = 'COMPLETED' THEN "total" ELSE 0 END), 0)::float as "totalRevenue",
        COALESCE(SUM(CASE WHEN "paymentStatus" = 'COMPLETED' AND "createdAt" >= date_trunc('month', NOW()) THEN "total" ELSE 0 END), 0)::float as "monthRevenue",
        COALESCE(SUM(CASE WHEN "paymentStatus" = 'COMPLETED' AND "createdAt" >= date_trunc('day', NOW()) THEN "total" ELSE 0 END), 0)::float as "todayRevenue",
        COUNT(*)::int as "totalOrders",
        COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('month', NOW()))::int as "monthOrders"
      FROM "Order"
    `).catch(() => ({ rows: [{ totalRevenue: 0, monthRevenue: 0, todayRevenue: 0, totalOrders: 0, monthOrders: 0 }] }));

    const usersQ = await pool.query(`
      SELECT COUNT(*)::int as "totalUsers",
        COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('month', NOW()))::int as "monthUsers"
      FROM "User"
    `).catch(() => ({ rows: [{ totalUsers: 0, monthUsers: 0 }] }));

    const vendorsQ = await pool.query(`SELECT COUNT(*)::int as "totalVendors" FROM "User" WHERE "role" = 'VENDOR'`)
      .catch(() => ({ rows: [{ totalVendors: 0 }] }));

    const shopsQ = await pool.query(`SELECT COUNT(*)::int as "totalShops" FROM "Shop"`)
      .catch(() => ({ rows: [{ totalShops: 0 }] }));

    const revenueChartQ = await pool.query(`
      SELECT
        to_char(date_trunc('day', "createdAt"), 'YYYY-MM-DD') as date,
        COALESCE(SUM(CASE WHEN "paymentStatus" = 'COMPLETED' THEN "total" ELSE 0 END), 0)::float as revenue,
        COUNT(*)::int as orders
      FROM "Order"
      WHERE "createdAt" >= NOW() - INTERVAL '${dateInterval}'
      GROUP BY date_trunc('day', "createdAt")
      ORDER BY date ASC
    `).catch(() => ({ rows: [] }));

    const topVendorsQ = await pool.query(`
      SELECT u."id", u."name", u."email",
        COALESCE(SUM(CASE WHEN o."paymentStatus" = 'COMPLETED' THEN o."total" ELSE 0 END), 0)::float as revenue,
        COUNT(o."id")::int as orders
      FROM "User" u
      LEFT JOIN "Shop" sh ON sh."userId" = u."id"
      LEFT JOIN "Order" o ON o."shopId" = sh."id"
      WHERE u."role" = 'VENDOR'
      GROUP BY u."id"
      ORDER BY revenue DESC LIMIT 10
    `).catch(() => ({ rows: [] }));

    const topShopsQ = await pool.query(`
      SELECT sh."id", sh."name", sh."slug",
        COALESCE(SUM(CASE WHEN o."paymentStatus" = 'COMPLETED' THEN o."total" ELSE 0 END), 0)::float as revenue,
        COUNT(o."id")::int as orders
      FROM "Shop" sh
      LEFT JOIN "Order" o ON o."shopId" = sh."id"
      GROUP BY sh."id"
      ORDER BY revenue DESC LIMIT 10
    `).catch(() => ({ rows: [] }));

    const topProductsQ = await pool.query(`
      SELECT p."id", p."name", p."price"::float,
        COALESCE(SUM(oi."quantity"), 0)::int as "salesCount",
        COALESCE(SUM(oi."quantity" * oi."price"), 0)::float as revenue,
        sh."name" as "shopName"
      FROM "Product" p
      LEFT JOIN "OrderItem" oi ON oi."productId" = p."id"
      LEFT JOIN "Shop" sh ON sh."id" = p."shopId"
      GROUP BY p."id", sh."name"
      ORDER BY "salesCount" DESC LIMIT 10
    `).catch(() => ({ rows: [] }));

    const topCategoriesQ = await pool.query(`
      SELECT c."name",
        COUNT(DISTINCT p."id")::int as "productCount",
        COALESCE(SUM(oi."quantity"), 0)::int as "totalSales"
      FROM "Category" c
      LEFT JOIN "Product" p ON p."categoryId" = c."id"
      LEFT JOIN "OrderItem" oi ON oi."productId" = p."id"
      GROUP BY c."id"
      ORDER BY "totalSales" DESC LIMIT 10
    `).catch(() => ({ rows: [] }));

    const avgOrderQ = await pool.query(`
      SELECT COALESCE(AVG("total"), 0)::float as "avgOrder"
      FROM "Order" WHERE "paymentStatus" = 'COMPLETED'
    `).catch(() => ({ rows: [{ avgOrder: 0 }] }));

    const o = overviewQ.rows[0];
    const u = usersQ.rows[0];

    return NextResponse.json({
      overview: {
        totalRevenue: parseFloat(o.totalRevenue) || 0,
        monthRevenue: parseFloat(o.monthRevenue) || 0,
        weekRevenue: 0,
        todayRevenue: parseFloat(o.todayRevenue) || 0,
        totalOrders: o.totalOrders || 0,
        monthOrders: o.monthOrders || 0,
        totalUsers: u.totalUsers || 0,
        monthUsers: u.monthUsers || 0,
        totalVendors: vendorsQ.rows[0]?.totalVendors || 0,
        totalShops: shopsQ.rows[0]?.totalShops || 0,
        avgOrderValue: parseFloat(avgOrderQ.rows[0]?.avgOrder) || 0,
        conversionRate: 0,
      },
      revenueChart: revenueChartQ.rows,
      salesChart: revenueChartQ.rows,
      usersChart: [],
      topVendors: topVendorsQ.rows,
      topShops: topShopsQ.rows,
      topProducts: topProductsQ.rows,
      topCategories: topCategoriesQ.rows,
      recentActivity: [],
      conversion: {
        rate: 0,
        abandonedCart: 0,
        avgOrder: parseFloat(avgOrderQ.rows[0]?.avgOrder) || 0,
        returnRate: 0,
      },
    });
  } catch (error) {
    console.error("Error fetching analytics:", error);
    return NextResponse.json({
      overview: { totalRevenue: 0, monthRevenue: 0, weekRevenue: 0, todayRevenue: 0, totalOrders: 0, monthOrders: 0, totalUsers: 0, monthUsers: 0, totalVendors: 0, totalShops: 0, avgOrderValue: 0, conversionRate: 0 },
      revenueChart: [],
      salesChart: [],
      usersChart: [],
      topVendors: [],
      topShops: [],
      topProducts: [],
      topCategories: [],
      recentActivity: [],
      conversion: { rate: 0, abandonedCart: 0, avgOrder: 0, returnRate: 0 },
    });
  }
}
