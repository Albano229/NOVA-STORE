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

  const orderResult = await pool.query(`
    SELECT o.*,
      json_build_object('id', u."id", 'name', u."name", 'email', u."email", 'phone', u."phone") AS "customer",
      json_build_object('id', sh."id", 'name', sh."name", 'slug', sh."slug") AS "shop",
      json_build_object('id', vu."id", 'name', vu."name", 'email', vu."email") AS "vendor"
    FROM "Order" o
    LEFT JOIN "User" u ON u."id" = o."userId"
    LEFT JOIN "Shop" sh ON sh."id" = o."shopId"
    LEFT JOIN "User" vu ON vu."id" = sh."userId"
    WHERE o."id" = $1
  `, [id]);

  if (orderResult.rows.length === 0) {
    return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
  }

  const order = orderResult.rows[0];

  const [items, payment, commission] = await Promise.all([
    pool.query(`
      SELECT oi.*, p."productType",
        (SELECT url FROM "ProductImage" WHERE "productId" = oi."productId" ORDER BY "position" LIMIT 1) AS "imageUrl"
      FROM "OrderItem" oi
      LEFT JOIN "Product" p ON p."id" = oi."productId"
      WHERE oi."orderId" = $1
    `, [id]),
    pool.query(`SELECT * FROM "Payment" WHERE "orderId" = $1 LIMIT 1`, [id]),
    pool.query(`SELECT * FROM "Commission" WHERE "orderId" = $1 LIMIT 1`, [id]),
  ]);

  return NextResponse.json({
    order,
    items: items.rows,
    payment: payment.rows[0] || null,
    commission: commission.rows[0] || null,
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

  const beforeResult = await pool.query(`SELECT * FROM "Order" WHERE "id" = $1`, [id]);
  const before = beforeResult.rows[0] || null;

  const allowed = ["status", "paymentStatus"];
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
      `UPDATE "Order" SET ${fields.join(", ")} WHERE "id" = $${idx} RETURNING *`,
      values
    );
    const after = result.rows[0];

    let action = "ORDER_UPDATED";
    if (body.status === "CANCELLED") action = "ORDER_CANCELLED";
    else if (body.status === "REFUNDED") action = "ORDER_REFUNDED";
    else if (body.status === "DELIVERED") action = "ORDER_DELIVERED";

    await pool.query(
      `INSERT INTO "AuditLog" ("userId", "action", "entityType", "entityId", "beforeState", "afterState", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [session.user.id, action, "Order", id, JSON.stringify(before), JSON.stringify(after)]
    );

    return NextResponse.json(after);
  }

  return NextResponse.json(before);
}
