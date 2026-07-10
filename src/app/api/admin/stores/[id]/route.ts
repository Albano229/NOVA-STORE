import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const pool = getAuthPool();

  const shopResult = await pool.query(`
    SELECT s.*, json_build_object('id', u."id", 'name', u."name", 'email', u."email", 'phone', u."phone", 'image', u."image") AS "owner"
    FROM "Shop" s
    LEFT JOIN "User" u ON u."id" = s."userId"
    WHERE s."id" = $1
  `, [id]);

  if (shopResult.rows.length === 0) {
    return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
  }

  const shop = shopResult.rows[0];

  const [products, orders, revenueStats, commissionStats, topProducts, recentOrders] = await Promise.all([
    pool.query(`
      SELECT p."id", p."name", p."slug", p."price", p."productType", p."isActive", p."stock", p."createdAt",
        (SELECT url FROM "ProductImage" WHERE "productId" = p."id" ORDER BY position LIMIT 1) AS "imageUrl",
        COALESCE(oi.cnt, 0)::int AS "orderCount"
      FROM "Product" p
      LEFT JOIN (SELECT "productId", COUNT(*) AS cnt FROM "OrderItem" GROUP BY "productId") oi ON oi."productId" = p."id"
      WHERE p."shopId" = $1
      ORDER BY p."createdAt" DESC
    `, [id]),
    pool.query(`
      SELECT o."id", o."orderNumber", o."total", o."status", o."paymentStatus", o."createdAt",
        json_build_object('name', u."name", 'email', u."email") AS "customer"
      FROM "Order" o
      LEFT JOIN "User" u ON u."id" = o."userId"
      WHERE o."shopId" = $1
      ORDER BY o."createdAt" DESC
      LIMIT 50
    `, [id]),
    pool.query(`
      SELECT
        COALESCE(SUM("total") FILTER (WHERE "paymentStatus" = 'COMPLETED'), 0)::float AS "totalRevenue",
        COALESCE(SUM("total") FILTER (WHERE "paymentStatus" = 'COMPLETED' AND "createdAt" >= date_trunc('month', CURRENT_DATE)), 0)::float AS "monthRevenue",
        COALESCE(SUM("total") FILTER (WHERE "paymentStatus" = 'COMPLETED' AND "createdAt" >= CURRENT_DATE), 0)::float AS "todayRevenue",
        COUNT(*)::int AS "totalOrders",
        COUNT(*) FILTER (WHERE "status" = 'PENDING')::int AS "pendingOrders",
        COUNT(*) FILTER (WHERE "status" = 'DELIVERED')::int AS "deliveredOrders",
        COUNT(*) FILTER (WHERE "status" = 'CANCELLED')::int AS "cancelledOrders"
      FROM "Order" WHERE "shopId" = $1
    `, [id]),
    pool.query(`
      SELECT
        COALESCE(SUM("amount") FILTER (WHERE "status" = 'PAID'), 0)::float AS "totalPaidCommission",
        COALESCE(SUM("amount") FILTER (WHERE "status" = 'PENDING'), 0)::float AS "pendingCommission"
      FROM "Commission" WHERE "shopId" = $1
    `, [id]),
    pool.query(`
      SELECT p."id", p."name", p."price",
        COALESCE(SUM(oi."quantity"), 0)::int AS "totalSold",
        COALESCE(SUM(oi."quantity" * oi."price"), 0)::float AS "totalRevenue"
      FROM "Product" p
      LEFT JOIN "OrderItem" oi ON oi."productId" = p."id"
      LEFT JOIN "Order" o ON o."id" = oi."orderId" AND o."paymentStatus" = 'COMPLETED'
      WHERE p."shopId" = $1
      GROUP BY p."id", p."name", p."price"
      ORDER BY totalSold DESC
      LIMIT 10
    `, [id]),
    pool.query(`
      SELECT o."id", o."orderNumber", o."total", o."status", o."createdAt"
      FROM "Order" o WHERE o."shopId" = $1
      ORDER BY o."createdAt" DESC LIMIT 5
    `, [id]),
  ]);

  return NextResponse.json({
    shop,
    products: products.rows,
    orders: orders.rows,
    stats: {
      ...revenueStats.rows[0],
      ...commissionStats.rows[0],
    },
    topProducts: topProducts.rows,
    recentOrders: recentOrders.rows,
  });
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const pool = getAuthPool();

  const beforeResult = await pool.query(`SELECT * FROM "Shop" WHERE "id" = $1`, [id]);
  const before = beforeResult.rows[0] || null;

  const allowed = ["name", "slug", "description", "phone", "email", "address", "city", "isActive", "isVerified", "commissionRate"];
  const fields: string[] = [];
  const values: unknown[] = [];
  let idx = 1;

  for (const [key, value] of Object.entries(body)) {
    if (allowed.includes(key)) {
      fields.push(`"${key}" = $${idx}`);
      values.push(value);
      idx++;
    }
  }
  fields.push(`"updatedAt" = NOW()`);

  if (fields.length > 1) {
    values.push(id);
    const result = await pool.query(
      `UPDATE "Shop" SET ${fields.join(", ")} WHERE "id" = $${idx} RETURNING *`,
      values
    );
    const after = result.rows[0];

    const action = body.isActive === false ? "STORE_SUSPENDED" : body.isVerified !== undefined ? "STORE_VERIFIED" : "STORE_UPDATED";
    await pool.query(
      `INSERT INTO "AuditLog" ("userId", "action", "entityType", "entityId", "beforeState", "afterState", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [session.user.id, action, "Shop", id, JSON.stringify(before), JSON.stringify(after)]
    );

    return NextResponse.json(after);
  }

  return NextResponse.json(before);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Seul le propriétaire peut supprimer une boutique" }, { status: 403 });
  }

  const { id } = await params;
  const pool = getAuthPool();

  await pool.query(`DELETE FROM "ProductImage" WHERE "productId" IN (SELECT "id" FROM "Product" WHERE "shopId" = $1)`, [id]);
  await pool.query(`DELETE FROM "OrderItem" WHERE "orderId" IN (SELECT "id" FROM "Order" WHERE "shopId" = $1)`, [id]);
  await pool.query(`DELETE FROM "Order" WHERE "shopId" = $1`, [id]);
  await pool.query(`DELETE FROM "Commission" WHERE "shopId" = $1`, [id]);
  await pool.query(`DELETE FROM "Product" WHERE "shopId" = $1`, [id]);
  await pool.query(`DELETE FROM "Shop" WHERE "id" = $1`, [id]);

  return NextResponse.json({ success: true });
}
