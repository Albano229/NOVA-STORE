import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const search = searchParams.get("search") || "";
  const status = searchParams.get("status") || "ALL";
  const type = searchParams.get("type") || "ALL";
  const sort = searchParams.get("sort") || "newest";
  const vendor = searchParams.get("vendor") || "";

  const pool = getAuthPool();

  let where = "WHERE 1=1";
  const params: string[] = [];
  let idx = 1;

  if (search) {
    where += ` AND (s."name" ILIKE $${idx} OR u."name" ILIKE $${idx} OR u."email" ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }
  if (status !== "ALL") {
    if (status === "active") where += ` AND s."isActive" = true`;
    else if (status === "inactive") where += ` AND s."isActive" = false`;
    else if (status === "verified") where += ` AND s."isVerified" = true`;
    else if (status === "unverified") where += ` AND s."isVerified" = false`;
  }
  if (vendor) {
    where += ` AND u."name" ILIKE $${idx}`;
    params.push(`%${vendor}%`);
    idx++;
  }

  let orderBy = 'ORDER BY s."createdAt" DESC';
  if (sort === "oldest") orderBy = 'ORDER BY s."createdAt" ASC';
  else if (sort === "name") orderBy = 'ORDER BY s."name" ASC';
  else if (sort === "revenue") orderBy = 'ORDER BY rev.total DESC NULLS LAST';
  else if (sort === "orders") orderBy = 'ORDER BY oc.cnt DESC NULLS LAST';
  else if (sort === "products") orderBy = 'ORDER BY pc.cnt DESC NULLS LAST';

  const query = `
    SELECT
      s."id", s."name", s."slug", s."description", s."phone", s."email",
      s."address", s."city", s."isActive", s."isVerified", s."commissionRate",
      s."createdAt", s."updatedAt",
      json_build_object('id', u."id", 'name', u."name", 'email', u."email", 'image', u."image") AS "owner",
      COALESCE(pc.cnt, 0)::int AS "productCount",
      COALESCE(oc.cnt, 0)::int AS "orderCount",
      COALESCE(rev.total, 0)::float AS "revenue",
      COALESCE(comm.total, 0)::float AS "commissionGenerated"
    FROM "Shop" s
    LEFT JOIN "User" u ON u."id" = s."userId"
    LEFT JOIN (SELECT "shopId", COUNT(*) AS cnt FROM "Product" GROUP BY "shopId") pc ON pc."shopId" = s."id"
    LEFT JOIN (SELECT "shopId", COUNT(*) AS cnt FROM "Order" GROUP BY "shopId") oc ON oc."shopId" = s."id"
    LEFT JOIN (SELECT "shopId", SUM("total") AS total FROM "Order" WHERE "paymentStatus" = 'COMPLETED' GROUP BY "shopId") rev ON rev."shopId" = s."id"
    LEFT JOIN (SELECT "shopId", SUM("amount") AS total FROM "Commission" WHERE "status" = 'PAID' GROUP BY "shopId") comm ON comm."shopId" = s."id"
    ${where}
    ${orderBy}
  `;

  const result = await pool.query(query, params);

  const statsQuery = `
    SELECT
      COUNT(*)::int AS "total",
      COUNT(*) FILTER (WHERE "isActive" = true)::int AS "active",
      COUNT(*) FILTER (WHERE "isActive" = false)::int AS "inactive",
      COUNT(*) FILTER (WHERE "isVerified" = true)::int AS "verified",
      COUNT(*) FILTER (WHERE "isVerified" = false)::int AS "unverified",
      COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE)::int AS "today",
      COUNT(*) FILTER (WHERE "createdAt" >= date_trunc('month', CURRENT_DATE))::int AS "thisMonth"
    FROM "Shop"
  `;
  const stats = await pool.query(statsQuery);

  const topQuery = `
    SELECT s."id", s."name", s."slug", u."name" AS "vendorName",
      COALESCE(rev.total, 0)::float AS "revenue",
      COALESCE(oc.cnt, 0)::int AS "orderCount"
    FROM "Shop" s
    LEFT JOIN "User" u ON u."id" = s."userId"
    LEFT JOIN (SELECT "shopId", SUM("total") AS total FROM "Order" WHERE "paymentStatus" = 'COMPLETED' GROUP BY "shopId") rev ON rev."shopId" = s."id"
    LEFT JOIN (SELECT "shopId", COUNT(*) AS cnt FROM "Order" GROUP BY "shopId") oc ON oc."shopId" = s."id"
    WHERE s."isActive" = true
    ORDER BY rev.total DESC NULLS LAST
    LIMIT 5
  `;
  const top = await pool.query(topQuery);

  return NextResponse.json({
    shops: result.rows,
    stats: stats.rows[0],
    topShops: top.rows,
  });
}
