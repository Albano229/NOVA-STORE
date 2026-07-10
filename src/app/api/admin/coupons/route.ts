import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "OWNER"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const search = searchParams.get("search") || "";

    let query = `SELECT c.*, u.name as "creatorName", s.name as "shopName"
                 FROM "Coupon" c
                 LEFT JOIN "User" u ON u.id = c."createdBy"
                 LEFT JOIN "Shop" s ON s.id = c."shopId"`;
    const conditions: string[] = [];
    const params: any[] = [];

    if (status === "active") {
      conditions.push(`c."isActive" = true`);
    } else if (status === "expired") {
      conditions.push(`c."isActive" = false`);
    }

    if (search) {
      params.push(`%${search}%`);
      conditions.push(`c.code ILIKE $${params.length}`);
    }

    if (conditions.length > 0) {
      query += ` WHERE ${conditions.join(" AND ")}`;
    }

    query += ` ORDER BY c."createdAt" DESC`;

    const result = await pool.query(query, params);

    const statsResult = await pool.query(`
      SELECT
        COUNT(*) as total,
        COUNT(*) FILTER (WHERE "isActive" = true) as active,
        COUNT(*) FILTER (WHERE "isActive" = false) as inactive,
        COALESCE(SUM("usedCount"), 0) as total_uses
      FROM "Coupon"
    `);

    return NextResponse.json({
      coupons: result.rows,
      stats: statsResult.rows[0],
    });
  } catch (error) {
    console.error("[Admin Coupons] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "OWNER"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const {
      code,
      description,
      discountType,
      discountValue,
      minOrderAmount,
      maxDiscount,
      usageLimit,
      perUserLimit,
      shopId,
      productIds,
      startsAt,
      endsAt,
    } = body;

    if (!code || !discountType || !discountValue) {
      return NextResponse.json(
        { error: "Code, type et valeur de réduction requis" },
        { status: 400 }
      );
    }

    const pool = getAuthPool();

    const existing = await pool.query(
      `SELECT id FROM "Coupon" WHERE code = $1`,
      [code.toUpperCase()]
    );
    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Ce code promo existe déjà" },
        { status: 409 }
      );
    }

    const result = await pool.query(
      `INSERT INTO "Coupon" (code, description, "discountType", "discountValue", "minOrderAmount", "maxDiscount", "usageLimit", "perUserLimit", "shopId", "productIds", "isActive", "startsAt", "endsAt", "createdBy", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, true, $11, $12, $13, NOW(), NOW())
       RETURNING *`,
      [
        code.toUpperCase(),
        description || null,
        discountType,
        discountValue,
        minOrderAmount || null,
        maxDiscount || null,
        usageLimit || null,
        perUserLimit || 1,
        shopId || null,
        productIds ? JSON.stringify(productIds) : null,
        startsAt || null,
        endsAt || null,
        session.user.id,
      ]
    );

    await pool.query(
      `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", metadata, "createdAt")
       VALUES ($1, 'COUPON_CREATE', 'COUPON', $2, $3, NOW())`,
      [
        session.user.id,
        result.rows[0].id,
        JSON.stringify({ code: code.toUpperCase(), discountType, discountValue }),
      ]
    );

    return NextResponse.json({ success: true, coupon: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("[Admin Coupons] Error creating coupon:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
