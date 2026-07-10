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

  const productResult = await pool.query(`
    SELECT p.*,
      json_build_object('id', sh."id", 'name', sh."name", 'slug', sh."slug", 'phone', sh."phone", 'email', sh."email") AS "shop",
      json_build_object('id', u."id", 'name', u."name", 'email', u."email", 'phone', u."phone", 'image', u."image") AS "vendor",
      json_build_object('name', cat."name", 'slug', cat."slug") AS "category"
    FROM "Product" p
    LEFT JOIN "Shop" sh ON sh."id" = p."shopId"
    LEFT JOIN "User" u ON u."id" = sh."userId"
    LEFT JOIN "Category" cat ON cat."id" = p."categoryId"
    WHERE p."id" = $1
  `, [id]);

  if (productResult.rows.length === 0) {
    return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
  }

  const product = productResult.rows[0];

  const [images, digitalFile, physicalOpt, salesStats, recentOrders, reviews] = await Promise.all([
    pool.query(`SELECT * FROM "ProductImage" WHERE "productId" = $1 ORDER BY "position"`, [id]),
    pool.query(`SELECT * FROM "DigitalFile" WHERE "productId" = $1`, [id]),
    pool.query(`SELECT * FROM "PhysicalOption" WHERE "productId" = $1`, [id]),
    pool.query(`
      SELECT
        COUNT(*)::int AS "totalSales",
        COALESCE(SUM(oi."quantity"), 0)::int AS "unitsSold",
        COALESCE(SUM(oi."quantity" * oi."price"), 0)::float AS "totalRevenue"
      FROM "OrderItem" oi
      JOIN "Order" o ON o."id" = oi."orderId" AND o."paymentStatus" = 'COMPLETED'
      WHERE oi."productId" = $1
    `, [id]),
    pool.query(`
      SELECT o."id", o."orderNumber", o."total", o."status", o."createdAt",
        json_build_object('name', u."name", 'email', u."email") AS "customer"
      FROM "OrderItem" oi
      JOIN "Order" o ON o."id" = oi."orderId"
      LEFT JOIN "User" u ON u."id" = o."userId"
      WHERE oi."productId" = $1
      ORDER BY o."createdAt" DESC LIMIT 20
    `, [id]),
    pool.query(`
      SELECT r.*, json_build_object('name', u."name", 'image', u."image") AS "user"
      FROM "Review" r
      LEFT JOIN "User" u ON u."id" = r."userId"
      WHERE r."productId" = $1
      ORDER BY r."createdAt" DESC LIMIT 20
    `, [id]),
  ]);

  return NextResponse.json({
    product,
    images: images.rows,
    digitalFile: digitalFile.rows[0] || null,
    physicalOpt: physicalOpt.rows[0] || null,
    stats: salesStats.rows[0],
    recentOrders: recentOrders.rows,
    reviews: reviews.rows,
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

  const beforeResult = await pool.query(`SELECT * FROM "Product" WHERE "id" = $1`, [id]);
  const before = beforeResult.rows[0] || null;

  const allowed = ["name", "slug", "description", "price", "comparePrice", "discountPercent", "sku", "stock", "weight", "categoryId", "productType", "isActive", "isFeatured", "isHidden", "videoUrl", "seoTitle", "seoDescription"];
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
      `UPDATE "Product" SET ${fields.join(", ")} WHERE "id" = $${idx} RETURNING *`,
      values
    );
    const after = result.rows[0];

    const action = body.isActive === false ? "PRODUCT_SUSPENDED" : body.isFeatured !== undefined ? "PRODUCT_FEATURED" : "PRODUCT_UPDATED";
    await pool.query(
      `INSERT INTO "AuditLog" ("userId", "action", "entityType", "entityId", "beforeState", "afterState", "createdAt") VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
      [session.user.id, action, "Product", id, JSON.stringify(before), JSON.stringify(after)]
    );

    return NextResponse.json(after);
  }

  return NextResponse.json(before);
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Seul le propriétaire peut supprimer un produit" }, { status: 403 });
  }

  const { id } = await params;
  const pool = getAuthPool();

  await pool.query(`DELETE FROM "ProductImage" WHERE "productId" = $1`, [id]);
  await pool.query(`DELETE FROM "DigitalFile" WHERE "productId" = $1`, [id]);
  await pool.query(`DELETE FROM "PhysicalOption" WHERE "productId" = $1`, [id]);
  await pool.query(`DELETE FROM "Review" WHERE "productId" = $1`, [id]);
  await pool.query(`DELETE FROM "OrderItem" WHERE "productId" = $1`, [id]);
  await pool.query(`DELETE FROM "Product" WHERE "id" = $1`, [id]);

  return NextResponse.json({ success: true });
}
