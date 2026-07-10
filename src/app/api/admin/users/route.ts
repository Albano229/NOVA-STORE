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

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const role = searchParams.get("role") || "";
    const status = searchParams.get("status") || "";
    const sort = searchParams.get("sort") || "newest";

    const pool = getAuthPool();

    let where = "WHERE 1=1";
    const params: string[] = [];
    let idx = 1;

    if (search) {
      where += ` AND (u."name" ILIKE $${idx} OR u."email" ILIKE $${idx})`;
      params.push(`%${search}%`);
      idx++;
    }
    if (role && role !== "ALL") {
      where += ` AND u."role" = $${idx}`;
      params.push(role);
      idx++;
    }
    if (status === "active") {
      where += ` AND u."isActive" = true`;
    } else if (status === "inactive") {
      where += ` AND u."isActive" = false`;
    }

    let orderBy = 'ORDER BY u."createdAt" DESC';
    if (sort === "oldest") orderBy = 'ORDER BY u."createdAt" ASC';
    else if (sort === "name") orderBy = 'ORDER BY u."name" ASC';
    else if (sort === "email") orderBy = 'ORDER BY u."email" ASC';

    const query = `
      SELECT
        u."id", u."name", u."email", u."phone", u."image", u."role",
        u."isActive", u."createdAt", u."updatedAt",
        COALESCE(shops_agg.shops, '[]') as "shops",
        COALESCE(prod_agg.count, 0)::int as "productCount",
        COALESCE(order_agg.count, 0)::int as "orderCount",
        COALESCE(order_agg.total, 0)::float as "totalSpent"
      FROM "User" u
      LEFT JOIN LATERAL (
        SELECT json_agg(json_build_object('id', s."id", 'name', s."name", 'slug', s."slug", 'isActive', s."isActive")) as shops
        FROM "Shop" s WHERE s."userId" = u."id"
      ) shops_agg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count FROM "Product" p WHERE p."shopId" IN (SELECT id FROM "Shop" WHERE "userId" = u."id")
      ) prod_agg ON true
      LEFT JOIN LATERAL (
        SELECT COUNT(*) as count, COALESCE(SUM(o."total"), 0) as total
        FROM "Order" o WHERE o."userId" = u."id"
      ) order_agg ON true
      ${where}
      ${orderBy}
    `;

    const result = await pool.query(query, params);

    const statsQuery = `
      SELECT
        COUNT(*)::int as "total",
        COUNT(*) FILTER (WHERE "role" = 'CLIENT')::int as "clients",
        COUNT(*) FILTER (WHERE "role" = 'VENDOR')::int as "vendors",
        COUNT(*) FILTER (WHERE "role" = 'ADMIN')::int as "admins",
        COUNT(*) FILTER (WHERE "role" = 'MODERATOR')::int as "moderators",
        COUNT(*) FILTER (WHERE "role" = 'OWNER')::int as "owners",
        COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE)::int as "today",
        COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('month', CURRENT_DATE))::int as "thisMonth",
        COUNT(*) FILTER (WHERE "isActive" = true)::int as "active",
        COUNT(*) FILTER (WHERE "isActive" = false)::int as "inactive"
      FROM "User"
    `;
    const stats = await pool.query(statsQuery);

    const recentQuery = `
      SELECT "id", "name", "email", "image", "role", "createdAt"
      FROM "User" ORDER BY "createdAt" DESC LIMIT 10
    `;
    const recent = await pool.query(recentQuery);

    return NextResponse.json({
      users: result.rows,
      stats: stats.rows[0],
      recent: recent.rows,
    });
  } catch (error) {
    console.error("Error fetching users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
