import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const shop = searchParams.get("shop") || "";
    const status = searchParams.get("status") || "ALL";
    const payment = searchParams.get("payment") || "ALL";
    const sort = searchParams.get("sort") || "newest";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");
    const offset = (page - 1) * limit;

    const pool = getAuthPool();

    let where = "WHERE 1=1";
    const params: string[] = [];
    let idx = 1;

    if (search) {
      where += ` AND (o."orderNumber" ILIKE $${idx} OR u."name" ILIKE $${idx} OR u."email" ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (shop) {
      where += ` AND sh."name" ILIKE $${idx}`;
      params.push(`%${shop}%`);
      idx++;
    }
    if (status !== "ALL") {
      where += ` AND o."status" = $${idx}`;
      params.push(status);
      idx++;
    }
    if (payment !== "ALL") {
      where += ` AND o."paymentStatus" = $${idx}`;
      params.push(payment);
      idx++;
    }

    let orderBy = 'ORDER BY o."createdAt" DESC';
    if (sort === "oldest") orderBy = 'ORDER BY o."createdAt" ASC';
    else if (sort === "amount_desc") orderBy = 'ORDER BY o."total" DESC';

    const query = `
      SELECT
        o."id", o."orderNumber", o."total", o."status", o."paymentStatus",
        o."paymentMethod", o."trackingNumber", o."notes",
        o."createdAt", o."updatedAt",
        json_build_object('id', u."id", 'name', u."name", 'email', u."email") AS "customer",
        json_build_object('id', sh."id", 'name', sh."name", 'slug', sh."slug") AS "shop",
        COALESCE(items_agg.items, '[]'::json) AS "items",
        (SELECT json_build_object('method', pay."method", 'amount', pay."amount", 'status', pay."status")
         FROM "Payment" pay WHERE pay."orderId" = o."id" LIMIT 1) AS "payment",
        (SELECT json_build_object('amount', c."amount", 'rate', c."rate", 'status', c."status")
         FROM "Commission" c WHERE c."orderId" = o."id" LIMIT 1) AS "commission"
      FROM "Order" o
      LEFT JOIN "User" u ON u."id" = o."userId"
      LEFT JOIN "Shop" sh ON sh."id" = o."shopId"
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('id', oi."id", 'name', oi."name", 'quantity', oi."quantity", 'price', oi."price")) AS items
        FROM "OrderItem" oi WHERE oi."orderId" = o."id"
      ) items_agg ON true
      ${where}
      ${orderBy}
      LIMIT $${idx} OFFSET $${idx + 1}
    `;

    params.push(String(limit), String(offset));
    const result = await pool.query(query, params);

    const countParams = params.slice(0, -2);
    const countQuery = `
      SELECT COUNT(*)::int AS "total"
      FROM "Order" o
      LEFT JOIN "User" u ON u."id" = o."userId"
      LEFT JOIN "Shop" sh ON sh."id" = o."shopId"
      ${where}
    `;
    const countResult = await pool.query(countQuery, countParams);

    const statsQuery = `
      SELECT
        COUNT(*)::int AS "total",
        COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE)::int AS "today",
        COUNT(*) FILTER (WHERE "status" = 'PENDING')::int AS "pending",
        COUNT(*) FILTER (WHERE "status" = 'PROCESSING')::int AS "processing",
        COUNT(*) FILTER (WHERE "status" = 'SHIPPED')::int AS "shipped",
        COUNT(*) FILTER (WHERE "status" = 'DELIVERED')::int AS "delivered",
        COUNT(*) FILTER (WHERE "status" = 'CANCELLED')::int AS "cancelled",
        COALESCE(SUM("total") FILTER (WHERE "paymentStatus" = 'COMPLETED'), 0)::float AS "totalVolume"
      FROM "Order"
    `;
    const stats = await pool.query(statsQuery);

    const commissionQuery = `
      SELECT
        COALESCE(SUM("amount") FILTER (WHERE "status" = 'PAID'), 0)::float AS "totalCommission",
        COALESCE(SUM("amount") FILTER (WHERE "status" = 'PENDING'), 0)::float AS "pendingCommission"
      FROM "Commission"
    `;
    const commission = await pool.query(commissionQuery);

    return NextResponse.json({
      orders: result.rows,
      pagination: { page, limit, total: countResult.rows[0].total, totalPages: Math.ceil(countResult.rows[0].total / limit) },
      stats: { ...stats.rows[0], ...commission.rows[0] },
    });
  } catch (error) {
    console.error("Error fetching orders:", error);
    return NextResponse.json({
      orders: [],
      pagination: { page: 1, limit: 20, total: 0, totalPages: 0 },
      stats: { total: 0, today: 0, pending: 0, processing: 0, shipped: 0, delivered: 0, cancelled: 0, totalVolume: 0, totalCommission: 0, pendingCommission: 0 },
    });
  }
}
