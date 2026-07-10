import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const entityType = searchParams.get("entityType") || "all";
  const action = searchParams.get("action") || "";
  const dateFrom = searchParams.get("dateFrom") || "";
  const dateTo = searchParams.get("dateTo") || "";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const pool = getAuthPool();

  const conditions: string[] = [];
  const params: any[] = [];
  let paramIndex = 1;

  if (search) {
    conditions.push(
      `(u.name ILIKE $${paramIndex} OR u.email ILIKE $${paramIndex} OR al.action ILIKE $${paramIndex} OR al."entityId" ILIKE $${paramIndex})`
    );
    params.push(`%${search}%`);
    paramIndex++;
  }

  if (entityType && entityType !== "all") {
    conditions.push(`al."entityType" = $${paramIndex}`);
    params.push(entityType);
    paramIndex++;
  }

  if (action) {
    conditions.push(`al.action ILIKE $${paramIndex}`);
    params.push(`%${action}%`);
    paramIndex++;
  }

  if (dateFrom) {
    conditions.push(`al."createdAt" >= $${paramIndex}`);
    params.push(dateFrom);
    paramIndex++;
  }

  if (dateTo) {
    conditions.push(`al."createdAt" <= ($${paramIndex}::date + interval '1 day')`);
    params.push(dateTo);
    paramIndex++;
  }

  const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  const countResult = await pool.query(
    `SELECT COUNT(*) FROM "AuditLog" al LEFT JOIN "User" u ON u.id = al."userId" ${whereClause}`,
    params
  );
  const total = parseInt(countResult.rows[0].count);

  const logsResult = await pool.query(
    `SELECT 
      al.id,
      al."userId",
      al.action,
      al."entityType",
      al."entityId",
      al."beforeState",
      al."afterState",
      al.metadata,
      al."createdAt",
      json_build_object('id', u.id, 'name', u.name, 'email', u.email) AS "user"
    FROM "AuditLog" al
    LEFT JOIN "User" u ON u.id = al."userId"
    ${whereClause}
    ORDER BY al."createdAt" DESC
    LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`,
    [...params, limit, offset]
  );

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const statsResult = await pool.query(`
    SELECT
      COUNT(*) AS total,
      COUNT(*) FILTER (WHERE "createdAt" >= $1) AS today,
      COUNT(*) FILTER (WHERE "entityType" = 'Product') AS product_changes,
      COUNT(*) FILTER (WHERE "entityType" = 'Shop') AS shop_changes,
      COUNT(*) FILTER (WHERE action ILIKE '%role%') AS role_changes,
      COUNT(*) FILTER (WHERE "entityType" = 'Payment' OR action ILIKE '%payment%') AS payments,
      COUNT(*) FILTER (WHERE action ILIKE '%login%' OR action ILIKE '%connexion%') AS logins
    FROM "AuditLog"
  `, [todayStart.toISOString()]);

  const stats = statsResult.rows[0];

  return NextResponse.json({
    logs: logsResult.rows,
    stats: {
      total: parseInt(stats.total),
      today: parseInt(stats.today),
      productChanges: parseInt(stats.product_changes),
      shopChanges: parseInt(stats.shop_changes),
      roleChanges: parseInt(stats.role_changes),
      payments: parseInt(stats.payments),
      logins: parseInt(stats.logins),
    },
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const pool = getAuthPool();

  const result = await pool.query(
    `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", "beforeState", "afterState", metadata, "createdAt")
     VALUES ($1, $2, $3, $4, $5, $6, $7, NOW()) RETURNING *`,
    [
      session.user.id,
      body.action,
      body.entityType,
      body.entityId,
      body.beforeState ? JSON.stringify(body.beforeState) : null,
      body.afterState ? JSON.stringify(body.afterState) : null,
      body.metadata ? JSON.stringify(body.metadata) : null,
    ]
  );

  return NextResponse.json(result.rows[0]);
}
