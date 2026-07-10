import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "OWNER"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getAuthPool();

    const result = await pool.query(
      `SELECT c.*, u.name as "creatorName", s.name as "shopName"
       FROM "Coupon" c
       LEFT JOIN "User" u ON u.id = c."createdBy"
       LEFT JOIN "Shop" s ON s.id = c."shopId"
       WHERE c.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Coupon non trouvé" }, { status: 404 });
    }

    const usages = await pool.query(
      `SELECT cu.*, u.name as "userName", u.email as "userEmail"
       FROM "CouponUsage" cu
       LEFT JOIN "User" u ON u.id = cu."userId"
       WHERE cu."couponId" = $1
       ORDER BY cu."createdAt" DESC
       LIMIT 50`,
      [id]
    );

    return NextResponse.json({
      coupon: result.rows[0],
      usages: usages.rows,
    });
  } catch (error) {
    console.error("[Admin Coupon] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "OWNER"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const pool = getAuthPool();

    const fields: string[] = [];
    const values: any[] = [];
    let paramIndex = 1;

    const allowedFields = [
      "description", "discountType", "discountValue", "minOrderAmount",
      "maxDiscount", "usageLimit", "perUserLimit", "isActive",
      "startsAt", "endsAt", "shopId", "productIds",
    ];

    for (const field of allowedFields) {
      if (body[field] !== undefined) {
        const dbField = field === "discountType" ? '"discountType"'
          : field === "discountValue" ? '"discountValue"'
          : field === "minOrderAmount" ? '"minOrderAmount"'
          : field === "maxDiscount" ? '"maxDiscount"'
          : field === "usageLimit" ? '"usageLimit"'
          : field === "perUserLimit" ? '"perUserLimit"'
          : field === "isActive" ? '"isActive"'
          : field === "startsAt" ? '"startsAt"'
          : field === "endsAt" ? '"endsAt"'
          : field === "shopId" ? '"shopId"'
          : field === "productIds" ? '"productIds"'
          : field;
        fields.push(`${dbField} = $${paramIndex}`);
        values.push(field === "productIds" ? JSON.stringify(body[field]) : body[field]);
        paramIndex++;
      }
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
    }

    fields.push(`"updatedAt" = NOW()`);
    values.push(id);

    const result = await pool.query(
      `UPDATE "Coupon" SET ${fields.join(", ")} WHERE id = $${paramIndex} RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Coupon non trouvé" }, { status: 404 });
    }

    await pool.query(
      `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", metadata, "createdAt")
       VALUES ($1, 'COUPON_UPDATE', 'COUPON', $2, $3, NOW())`,
      [session.user.id, id, JSON.stringify({ changes: body })]
    );

    return NextResponse.json({ success: true, coupon: result.rows[0] });
  } catch (error) {
    console.error("[Admin Coupon] Error updating:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["ADMIN", "OWNER"].includes(session.user.role || "")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getAuthPool();

    const existing = await pool.query(
      `SELECT id, code FROM "Coupon" WHERE id = $1`,
      [id]
    );
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Coupon non trouvé" }, { status: 404 });
    }

    await pool.query(`DELETE FROM "CouponUsage" WHERE "couponId" = $1`, [id]);
    await pool.query(`DELETE FROM "Coupon" WHERE id = $1`, [id]);

    await pool.query(
      `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", metadata, "createdAt")
       VALUES ($1, 'COUPON_DELETE', 'COUPON', $2, $3, NOW())`,
      [session.user.id, id, JSON.stringify({ code: existing.rows[0].code })]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("[Admin Coupon] Error deleting:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
