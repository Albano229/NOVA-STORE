import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "all";
    const status = searchParams.get("status") || "all";
    const pool = getAuthPool();

    const [reportsResult, flaggedProductsResult, suspiciousShopsResult, suspiciousUsersResult, recentActionsResult] =
      await Promise.all([
        pool.query(`
          SELECT al."id", al."action", al."entityType", al."entityId", al."beforeState", al."afterState", al."metadata", al."createdAt",
                 json_build_object('id', u."id", 'name', u."name", 'email', u."email") as "user"
          FROM "AuditLog" al
          LEFT JOIN "User" u ON u."id" = al."userId"
          WHERE al."action" IN ('PRODUCT_SUSPENDED','PRODUCT_REPORTED','STORE_SUSPENDED','STORE_REPORTED','USER_SUSPENDED','USER_BANNED','USER_REPORTED','REVIEW_FLAGGED','CONTENT_REMOVED','CONTENT_FLAGGED')
          ORDER BY al."createdAt" DESC
          LIMIT 100
        `),
        pool.query(`
          SELECT p."id", p."name", p."slug", p."isActive", p."productType", p."createdAt",
                 json_build_object('id', s."id", 'name', s."name", 'slug', s."slug") as "shop",
                 json_build_object('id', v."id", 'name', v."name", 'email', v."email") as "vendor",
                 CASE WHEN p."isActive" = false THEN 'high' WHEN (SELECT COUNT(*)::int FROM "Review" r WHERE r."productId" = p."id" AND r."rating" <= 2) > 2 THEN 'medium' ELSE 'low' END as "riskLevel",
                 CASE WHEN p."isActive" = false THEN 'suspended' WHEN (SELECT COUNT(*)::int FROM "Review" r WHERE r."productId" = p."id" AND r."rating" <= 2) > 2 THEN 'bad_reviews' ELSE 'flagged' END as "riskType"
          FROM "Product" p
          LEFT JOIN "Shop" s ON s."id" = p."shopId"
          LEFT JOIN "User" v ON v."id" = s."userId"
          WHERE p."isActive" = false
             OR (SELECT COUNT(*)::int FROM "Review" r WHERE r."productId" = p."id" AND r."rating" <= 2) > 2
             OR (SELECT COUNT(*)::int FROM "AuditLog" a WHERE a."entityType" = 'PRODUCT' AND a."entityId" = p."id" AND a."action" LIKE '%SUSPENDED%') > 0
          ORDER BY p."createdAt" DESC
          LIMIT 50
        `),
        pool.query(`
          SELECT s."id", s."name", s."slug", s."isActive", s."isVerified", s."createdAt",
                 json_build_object('id', v."id", 'name', v."name", 'email', v."email") as "owner",
                 (SELECT COUNT(*)::int FROM "Product" p WHERE p."shopId" = s."id") as "productCount",
                 (SELECT ROUND(COALESCE(AVG(r."rating"), 0), 1) FROM "Product" p LEFT JOIN "Review" r ON r."productId" = p."id" WHERE p."shopId" = s."id") as "avgRating",
                 (SELECT COUNT(*)::int FROM "AuditLog" a WHERE a."entityType" = 'SHOP' AND a."entityId" = s."id") as "auditCount",
                 CASE WHEN s."isVerified" = false THEN 'unverified' WHEN (SELECT ROUND(COALESCE(AVG(r."rating"), 0), 1) FROM "Product" p LEFT JOIN "Review" r ON r."productId" = p."id" WHERE p."shopId" = s."id") < 3 THEN 'low_rating' ELSE 'normal' END as "suspicionType"
          FROM "Shop" s
          LEFT JOIN "User" v ON v."id" = s."userId"
          WHERE s."isVerified" = false
             OR s."isActive" = false
             OR (SELECT ROUND(COALESCE(AVG(r."rating"), 0), 1) FROM "Product" p LEFT JOIN "Review" r ON r."productId" = p."id" WHERE p."shopId" = s."id") < 3
             OR (SELECT COUNT(*)::int FROM "AuditLog" a WHERE a."entityType" = 'SHOP' AND a."entityId" = s."id" AND a."action" LIKE '%SUSPENDED%') > 0
          ORDER BY s."createdAt" DESC
          LIMIT 50
        `),
        pool.query(`
          SELECT u."id", u."name", u."email", u."role", u."isActive", u."createdAt",
                 (SELECT COUNT(*)::int FROM "Payment" pay
                    INNER JOIN "Order" o ON o."id" = pay."orderId"
                    WHERE o."userId" = u."id" AND pay."status" = 'FAILED') as "failedPayments",
                 (SELECT COUNT(*)::int FROM "Shop" sh WHERE sh."userId" = u."id") as "shopCount",
                 CASE WHEN u."isActive" = false THEN 'banned' WHEN (SELECT COUNT(*)::int FROM "Payment" pay INNER JOIN "Order" o ON o."id" = pay."orderId" WHERE o."userId" = u."id" AND pay."status" = 'FAILED') > 3 THEN 'fraud_risk' ELSE 'active' END as "suspicionType"
          FROM "User" u
          WHERE u."isActive" = false
             OR (SELECT COUNT(*)::int FROM "Payment" pay INNER JOIN "Order" o ON o."id" = pay."orderId" WHERE o."userId" = u."id" AND pay."status" = 'FAILED') > 3
          ORDER BY u."createdAt" DESC
          LIMIT 50
        `),
        pool.query(`
          SELECT al."id", al."action", al."entityType", al."entityId", al."createdAt",
                 json_build_object('name', u."name", 'email', u."email") as "user"
          FROM "AuditLog" al
          LEFT JOIN "User" u ON u."id" = al."userId"
          WHERE al."createdAt" >= NOW() - INTERVAL '7 days'
          ORDER BY al."createdAt" DESC
          LIMIT 30
        `),
      ]);

    let reports = reportsResult.rows;
    if (type === "products") reports = reports.filter((r: any) => r.entityType === "PRODUCT");
    else if (type === "shops") reports = reports.filter((r: any) => r.entityType === "SHOP");
    else if (type === "users") reports = reports.filter((r: any) => r.entityType === "USER");
    else if (type === "comments") reports = reports.filter((r: any) => r.entityType === "REVIEW");

    if (status === "pending") reports = reports.filter((r: any) => !r.afterState || r.afterState?.resolved === false);
    else if (status === "resolved") reports = reports.filter((r: any) => r.afterState?.resolved === true);

    const totalReports = reportsResult.rows.length;
    const pendingReports = reportsResult.rows.filter((r: any) => !r.afterState || r.afterState?.resolved === false).length;
    const resolvedReports = totalReports - pendingReports;

    const flaggedCount = flaggedProductsResult.rows.length;
    const suspendedShops = suspiciousShopsResult.rows.filter((s: any) => s.isActive === false).length;
    const bannedUsers = suspiciousUsersResult.rows.filter((u: any) => u.isActive === false).length;

    const todayResult = await pool.query(
      `SELECT COUNT(*)::int as count FROM "AuditLog" WHERE "createdAt" >= CURRENT_DATE`
    );
    const todayActions = todayResult.rows[0]?.count || 0;

    return NextResponse.json({
      reports,
      flaggedProducts: flaggedProductsResult.rows,
      suspiciousShops: suspiciousShopsResult.rows,
      suspiciousUsers: suspiciousUsersResult.rows,
      stats: {
        totalReports,
        pendingReports,
        resolvedReports,
        flaggedProducts: flaggedCount,
        suspendedShops,
        bannedUsers,
        todayActions,
      },
      recentActions: recentActionsResult.rows,
    });
  } catch (error) {
    console.error("Error fetching moderation data:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { action, entityType, entityId, reason, details } = body;
    const pool = getAuthPool();

    if (!action || !entityType || !entityId) {
      return NextResponse.json({ error: "Données manquantes" }, { status: 400 });
    }

    const validActions: Record<string, { sql: string; params: any[] }> = {
      DELETE_CONTENT: {
        sql: `UPDATE "Product" SET "isActive" = false WHERE "id" = $1 RETURNING "id", "name"`,
        params: [entityId],
      },
      BLOCK_USER: {
        sql: `UPDATE "User" SET "isActive" = false WHERE "id" = $1 RETURNING "id", "name", "email"`,
        params: [entityId],
      },
      SUSPEND_SHOP: {
        sql: `UPDATE "Shop" SET "isActive" = false WHERE "id" = $1 RETURNING "id", "name"`,
        params: [entityId],
      },
      UNSUSPEND_SHOP: {
        sql: `UPDATE "Shop" SET "isActive" = true WHERE "id" = $1 RETURNING "id", "name"`,
        params: [entityId],
      },
      WARN_USER: {
        sql: `SELECT "id", "name", "email" FROM "User" WHERE "id" = $1`,
        params: [entityId],
      },
      ESCALATE: {
        sql: `SELECT "id", "name" FROM "AuditLog" WHERE "id" = $1`,
        params: [entityId],
      },
    };

    const validAction = validActions[action];
    if (!validAction) {
      return NextResponse.json({ error: "Action invalide" }, { status: 400 });
    }

    const entityResult = await pool.query(validAction.sql, validAction.params);
    const entity = entityResult.rows[0];

    await pool.query(
      `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", "beforeState", "afterState", metadata, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())`,
      [
        session.user.id,
        action,
        entityType,
        entityId,
        null,
        JSON.stringify({ resolved: true, actionBy: session.user.id }),
        JSON.stringify({ reason: reason || null, details: details || null, entityName: entity?.name || entity?.email || null }),
      ]
    );

    return NextResponse.json({ success: true, action, entity });
  } catch (error) {
    console.error("Error executing moderation action:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
