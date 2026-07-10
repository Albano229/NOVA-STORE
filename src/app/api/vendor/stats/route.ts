import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

    const [
      totalRevenueResult,
      todayRevenueResult,
      monthRevenueResult,
      lastMonthRevenueResult,
      totalOrdersResult,
      todayOrdersResult,
      totalProductsResult,
      pendingOrdersResult,
      uniqueClientsResult,
      recentOrdersResult,
      popularProductsResult,
      weeklySalesResult,
      monthlyRevenueResult,
    ] = await Promise.all([
      pool.query(
        `SELECT COALESCE(SUM("total"), 0)::numeric AS sum FROM "Order" WHERE "shopId" = $1 AND "paymentStatus" = 'COMPLETED'`,
        [shop.id]
      ),
      pool.query(
        `SELECT COALESCE(SUM("total"), 0)::numeric AS sum FROM "Order" WHERE "shopId" = $1 AND "paymentStatus" = 'COMPLETED' AND "createdAt" >= $2`,
        [shop.id, todayStart]
      ),
      pool.query(
        `SELECT COALESCE(SUM("total"), 0)::numeric AS sum FROM "Order" WHERE "shopId" = $1 AND "paymentStatus" = 'COMPLETED' AND "createdAt" >= $2`,
        [shop.id, monthStart]
      ),
      pool.query(
        `SELECT COALESCE(SUM("total"), 0)::numeric AS sum FROM "Order" WHERE "shopId" = $1 AND "paymentStatus" = 'COMPLETED' AND "createdAt" >= $2 AND "createdAt" < $3`,
        [shop.id, lastMonthStart, monthStart]
      ),
      pool.query(`SELECT COUNT(*)::int AS count FROM "Order" WHERE "shopId" = $1`, [shop.id]),
      pool.query(
        `SELECT COUNT(*)::int AS count FROM "Order" WHERE "shopId" = $1 AND "createdAt" >= $2`,
        [shop.id, todayStart]
      ),
      pool.query(`SELECT COUNT(*)::int AS count FROM "Product" WHERE "shopId" = $1`, [shop.id]),
      pool.query(`SELECT COUNT(*)::int AS count FROM "Order" WHERE "shopId" = $1 AND "status" = 'PENDING'`, [shop.id]),
      pool.query(
        `SELECT COUNT(DISTINCT "userId")::int AS count FROM "Order" WHERE "shopId" = $1`,
        [shop.id]
      ),
      pool.query(
        `SELECT o."id", o."orderNumber", o."total", o."status", o."paymentStatus", o."createdAt",
                json_build_object('name', u."name", 'email', u."email") AS "user"
         FROM "Order" o
         LEFT JOIN "User" u ON u."id" = o."userId"
         WHERE o."shopId" = $1
         ORDER BY o."createdAt" DESC
         LIMIT 5`,
        [shop.id]
      ),
      pool.query(
        `SELECT oi."name", SUM(oi."quantity")::int AS "sold", SUM(oi."quantity" * oi."price")::numeric AS "revenue"
         FROM "OrderItem" oi
         INNER JOIN "Order" o ON o."id" = oi."orderId"
         WHERE o."shopId" = $1 AND o."paymentStatus" = 'COMPLETED'
         GROUP BY oi."name"
         ORDER BY SUM(oi."quantity" * oi."price") DESC
         LIMIT 5`,
        [shop.id]
      ),
      // Weekly sales: last 7 days
      pool.query(
        `SELECT TO_CHAR(DATE(o."createdAt"), 'DD Mon') AS day,
                COALESCE(SUM(o."total"), 0)::numeric AS value
         FROM "Order" o
         WHERE o."shopId" = $1
           AND o."paymentStatus" = 'COMPLETED'
           AND o."createdAt" >= CURRENT_DATE - INTERVAL '6 days'
         GROUP BY DATE(o."createdAt")
         ORDER BY DATE(o."createdAt") ASC`,
        [shop.id]
      ),
      // Monthly revenue: last 6 months
      pool.query(
        `SELECT TO_CHAR(DATE_TRUNC('month', o."createdAt"), 'Mon') AS month,
                COALESCE(SUM(o."total"), 0)::numeric AS value
         FROM "Order" o
         WHERE o."shopId" = $1
           AND o."paymentStatus" = 'COMPLETED'
           AND o."createdAt" >= DATE_TRUNC('month', NOW()) - INTERVAL '5 months'
         GROUP BY DATE_TRUNC('month', o."createdAt")
         ORDER BY DATE_TRUNC('month', o."createdAt") ASC`,
        [shop.id]
      ),
    ]);

    const totalRevenue = parseFloat(totalRevenueResult.rows[0].sum) || 0;
    const todayRevenue = parseFloat(todayRevenueResult.rows[0].sum) || 0;
    const monthRevenue = parseFloat(monthRevenueResult.rows[0].sum) || 0;
    const lastMonthRevenue = parseFloat(lastMonthRevenueResult.rows[0].sum) || 0;

    const weeklySalesData = (() => {
      const db = weeklySalesResult.rows.map((r) => ({
        name: r.day,
        value: parseFloat(r.value) || 0,
      }));
      if (db.length === 0) {
        const days = ["Dim", "Lun", "Mar", "Mer", "Jeu", "Ven", "Sam"];
        return Array.from({ length: 7 }, (_, i) => {
          const d = new Date(now);
          d.setDate(d.getDate() - 6 + i);
          return { name: days[d.getDay()], value: 0 };
        });
      }
      return db;
    })();

    const monthlyRevenueData = (() => {
      const db = monthlyRevenueResult.rows.map((r) => ({
        name: r.month,
        value: parseFloat(r.value) || 0,
      }));
      return db;
    })();

    return NextResponse.json({
      totalRevenue,
      todayRevenue,
      monthRevenue,
      lastMonthRevenue,
      totalOrders: totalOrdersResult.rows[0].count,
      todayOrders: todayOrdersResult.rows[0].count,
      totalProducts: totalProductsResult.rows[0].count,
      pendingOrders: pendingOrdersResult.rows[0].count,
      uniqueClients: uniqueClientsResult.rows[0].count,
      recentOrders: recentOrdersResult.rows,
      popularProducts: popularProductsResult.rows.map((p) => ({
        name: p.name,
        sold: p.sold || 0,
        revenue: parseFloat(p.revenue) || 0,
      })),
      weeklySales: weeklySalesData,
      monthlyRevenue: monthlyRevenueData,
    });
  } catch (error) {
    console.error("Error fetching vendor stats:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
