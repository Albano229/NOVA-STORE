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
  const shop = searchParams.get("shop") || "";
  const vendor = searchParams.get("vendor") || "";
  const type = searchParams.get("type") || "ALL";
  const status = searchParams.get("status") || "ALL";
  const category = searchParams.get("category") || "ALL";
  const sort = searchParams.get("sort") || "newest";
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const offset = (page - 1) * limit;

  const pool = getAuthPool();

  let where = "WHERE 1=1";
  const params: string[] = [];
  let idx = 1;

  if (search) {
    where += ` AND (p."name" ILIKE $${idx} OR p."sku" ILIKE $${idx})`;
    params.push(`%${search}%`);
    idx++;
  }
  if (shop) {
    where += ` AND sh."name" ILIKE $${idx}`;
    params.push(`%${shop}%`);
    idx++;
  }
  if (vendor) {
    where += ` AND u."name" ILIKE $${idx}`;
    params.push(`%${vendor}%`);
    idx++;
  }
  if (type !== "ALL") {
    where += ` AND p."productType" = $${idx}`;
    params.push(type);
    idx++;
  }
  if (status === "active") where += ` AND p."isActive" = true`;
  else if (status === "inactive") where += ` AND p."isActive" = false`;
  else if (status === "featured") where += ` AND p."isFeatured" = true`;
  else if (status === "hidden") where += ` AND p."isHidden" = true`;

  if (category !== "ALL") {
    where += ` AND cat."slug" = $${idx}`;
    params.push(category);
    idx++;
  }

  let orderBy = 'ORDER BY p."createdAt" DESC';
  if (sort === "oldest") orderBy = 'ORDER BY p."createdAt" ASC';
  else if (sort === "name") orderBy = 'ORDER BY p."name" ASC';
  else if (sort === "price_asc") orderBy = 'ORDER BY p."price" ASC';
  else if (sort === "price_desc") orderBy = 'ORDER BY p."price" DESC';
  else if (sort === "sales") orderBy = 'ORDER BY COALESCE(sales.cnt, 0) DESC';
  else if (sort === "revenue") orderBy = 'ORDER BY COALESCE(rev.total, 0) DESC';

  const query = `
    SELECT
      p."id", p."name", p."slug", p."description", p."price", p."comparePrice",
      p."discountPercent", p."sku", p."stock", p."weight", p."productType",
      p."isActive", p."isFeatured", p."isHidden", p."videoUrl",
      p."seoTitle", p."seoDescription", p."createdAt", p."updatedAt",
      json_build_object('id', sh."id", 'name', sh."name", 'slug', sh."slug") AS "shop",
      json_build_object('id', u."id", 'name', u."name", 'email', u."email") AS "vendor",
      json_build_object('name', cat."name", 'slug', cat."slug") AS "category",
      COALESCE(img.images, '[]'::json) AS "images",
      COALESCE(sales.cnt, 0)::int AS "salesCount",
      COALESCE(rev.total, 0)::float AS "revenue",
      COALESCE(df."fileType", '') AS "digitalFileType",
      COALESCE(df."fileUrl", '') AS "digitalFileUrl",
      COALESCE(df."maxDownloads", 0)::int AS "maxDownloads",
      COALESCE(po."shippingEnabled", false) AS "shippingEnabled",
      COALESCE(po."shippingCost", 0)::float AS "shippingCost"
    FROM "Product" p
    LEFT JOIN "Shop" sh ON sh."id" = p."shopId"
    LEFT JOIN "User" u ON u."id" = sh."userId"
    LEFT JOIN "Category" cat ON cat."id" = p."categoryId"
    LEFT JOIN LATERAL (
      SELECT json_agg(json_build_object('id', pi."id", 'url', pi."url", 'position', pi."position") ORDER BY pi."position") AS images
      FROM "ProductImage" pi WHERE pi."productId" = p."id"
    ) img ON true
    LEFT JOIN (SELECT "productId", COUNT(*) AS cnt FROM "OrderItem" oi JOIN "Order" o ON o."id" = oi."orderId" AND o."paymentStatus" = 'COMPLETED' GROUP BY "productId") sales ON sales."productId" = p."id"
    LEFT JOIN (SELECT "productId", SUM(oi."quantity" * oi."price") AS total FROM "OrderItem" oi JOIN "Order" o ON o."id" = oi."orderId" AND o."paymentStatus" = 'COMPLETED' GROUP BY "productId") rev ON rev."productId" = p."id"
    LEFT JOIN "DigitalFile" df ON df."productId" = p."id"
    LEFT JOIN "PhysicalOption" po ON po."productId" = p."id"
    ${where}
    ${orderBy}
    LIMIT $${idx} OFFSET $${idx + 1}
  `;

  params.push(String(limit), String(offset));
  const result = await pool.query(query, params);

  const countParams = params.slice(0, -2);
  const countQuery = `
    SELECT COUNT(*)::int AS "total"
    FROM "Product" p
    LEFT JOIN "Shop" sh ON sh."id" = p."shopId"
    LEFT JOIN "User" u ON u."id" = sh."userId"
    LEFT JOIN "Category" cat ON cat."id" = p."categoryId"
    ${where}
  `;
  const countResult = await pool.query(countQuery, countParams);

  const statsQuery = `
    SELECT
      COUNT(*)::int AS "total",
      COUNT(*) FILTER (WHERE "isActive" = true)::int AS "active",
      COUNT(*) FILTER (WHERE "isActive" = false)::int AS "inactive",
      COUNT(*) FILTER (WHERE "isFeatured" = true)::int AS "featured",
      COUNT(*) FILTER (WHERE "isHidden" = true)::int AS "hidden",
      COUNT(*) FILTER (WHERE "productType" = 'PHYSICAL')::int AS "physical",
      COUNT(*) FILTER (WHERE "productType" = 'DIGITAL')::int AS "digital",
      COUNT(*) FILTER (WHERE "productType" = 'SERVICE')::int AS "service",
      COUNT(*) FILTER (WHERE "productType" = 'COMMUNITY')::int AS "community",
      COUNT(*) FILTER (WHERE "productType" = 'BUNDLE')::int AS "bundle",
      COUNT(*) FILTER (WHERE "createdAt" >= CURRENT_DATE)::int AS "today"
    FROM "Product"
  `;
  const stats = await pool.query(statsQuery);

  const topBySalesQuery = `
    SELECT p."id", p."name", p."price", p."productType",
      sh."name" AS "shopName",
      COALESCE(sales.cnt, 0)::int AS "salesCount",
      COALESCE(rev.total, 0)::float AS "revenue"
    FROM "Product" p
    LEFT JOIN "Shop" sh ON sh."id" = p."shopId"
    LEFT JOIN (SELECT "productId", COUNT(*) AS cnt FROM "OrderItem" oi JOIN "Order" o ON o."id" = oi."orderId" AND o."paymentStatus" = 'COMPLETED' GROUP BY "productId") sales ON sales."productId" = p."id"
    LEFT JOIN (SELECT "productId", SUM(oi."quantity" * oi."price") AS total FROM "OrderItem" oi JOIN "Order" o ON o."id" = oi."orderId" AND o."paymentStatus" = 'COMPLETED' GROUP BY "productId") rev ON rev."productId" = p."id"
    ORDER BY sales.cnt DESC NULLS LAST
    LIMIT 10
  `;
  const topBySales = await pool.query(topBySalesQuery);

  return NextResponse.json({
    products: result.rows,
    pagination: {
      page,
      limit,
      total: countResult.rows[0].total,
      totalPages: Math.ceil(countResult.rows[0].total / limit),
    },
    stats: stats.rows[0],
    topProducts: topBySales.rows,
  });
}
