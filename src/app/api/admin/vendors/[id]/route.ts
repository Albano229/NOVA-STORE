import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    const pool = getAuthPool();

    if (typeof body.isActive === "boolean") {
      const result = await pool.query(
        `UPDATE "User" SET "isActive" = $1, "updatedAt" = NOW() WHERE id = $2 RETURNING id, name, email, "isActive"`,
        [body.isActive, id]
      );

      if (result.rows.length === 0) {
        return NextResponse.json({ error: "Vendeur non trouvé" }, { status: 404 });
      }

      await pool.query(
        `INSERT INTO "AuditLog" ("id", "action", "entityType", "entityId", "metadata", "userId", "createdAt")
         VALUES (gen_random_uuid(), $1, 'VENDOR', $2, $3, $4, NOW())`,
        [
          body.isActive ? "VENDOR_ACTIVATED" : "VENDOR_DEACTIVATED",
          id,
          `Vendeur ${body.isActive ? "activé" : "désactivé"} par ${session.user.name || session.user.email}`,
          session.user.id,
        ]
      );

      return NextResponse.json(result.rows[0]);
    }

    if (body.commissionRate !== undefined) {
      const shopResult = await pool.query(`SELECT id FROM "Shop" WHERE "userId" = $1`, [id]);
      if (shopResult.rows.length === 0) {
        return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
      }

      const shopId = shopResult.rows[0].id;
      await pool.query(
        `UPDATE "Shop" SET "commissionRate" = $1, "updatedAt" = NOW() WHERE id = $2`,
        [body.commissionRate, shopId]
      );

      await pool.query(
        `INSERT INTO "AuditLog" ("id", "action", "entityType", "entityId", "metadata", "userId", "createdAt")
         VALUES (gen_random_uuid(), $1, 'SHOP', $2, $3, $4, NOW())`,
        [
          "COMMISSION_RATE_UPDATED",
          shopId,
          `Taux de commission modifié à ${body.commissionRate}%`,
          session.user.id,
        ]
      );

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
  } catch (error) {
    console.error("Error updating vendor:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getAuthPool();

    const result = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.image, u."isActive", u."createdAt",
        s.id as "shopId", s.name as "shopName", s.slug as "shopSlug", s."isVerified", s."commissionRate",
        COALESCE(pc.cnt, 0)::int as "productCount",
        COALESCE(oc.cnt, 0)::int as "orderCount",
        COALESCE(os.total, 0)::numeric as "totalRevenue",
        COALESCE(comm.total, 0)::numeric as "totalCommissions",
        COALESCE(comm.pending, 0)::numeric as "pendingCommissions",
        COALESCE(po.total, 0)::numeric as "totalPaidOut",
        COALESCE(po.pending, 0)::numeric as "pendingPayouts"
      FROM "User" u
      LEFT JOIN "Shop" s ON s."userId" = u.id
      LEFT JOIN (SELECT "shopId", COUNT(*) AS cnt FROM "Product" GROUP BY "shopId") pc ON pc."shopId" = s.id
      LEFT JOIN (SELECT "shopId", COUNT(*) AS cnt FROM "Order" GROUP BY "shopId") oc ON oc."shopId" = s.id
      LEFT JOIN (
        SELECT "shopId", SUM(CASE WHEN "paymentStatus" = 'COMPLETED' THEN "total" ELSE 0 END) as total
        FROM "Order" GROUP BY "shopId"
      ) os ON os."shopId" = s.id
      LEFT JOIN (
        SELECT "shopId", SUM("amount") as total, SUM(CASE WHEN "status" = 'PENDING' THEN "amount" ELSE 0 END) as pending
        FROM "Commission" GROUP BY "shopId"
      ) comm ON comm."shopId" = s.id
      LEFT JOIN (
        SELECT "shopId",
          SUM(CASE WHEN "status" = 'COMPLETED' THEN "amount" ELSE 0 END) as total,
          SUM(CASE WHEN "status" = 'PENDING' THEN "amount" ELSE 0 END) as pending
        FROM "VendorPayout" GROUP BY "shopId"
      ) po ON po."shopId" = s.id
      WHERE u.id = $1
      GROUP BY u.id, s.id, pc.cnt, oc.cnt, os.total, comm.total, comm.pending, po.total, po.pending`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Vendeur non trouvé" }, { status: 404 });
    }

    const r = result.rows[0];
    const vendor = {
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      image: r.image,
      isActive: r.isActive,
      createdAt: r.createdAt,
      shop: r.shopId ? {
        id: r.shopId,
        name: r.shopName,
        slug: r.shopSlug,
        isVerified: r.isVerified,
        commissionRate: r.commissionRate,
        productCount: r.productCount,
        orderCount: r.orderCount,
        totalRevenue: parseFloat(r.totalRevenue) || 0,
        totalCommissions: parseFloat(r.totalCommissions) || 0,
        pendingCommissions: parseFloat(r.pendingCommissions) || 0,
        totalPaidOut: parseFloat(r.totalPaidOut) || 0,
        pendingPayouts: parseFloat(r.pendingPayouts) || 0,
        availableBalance: (parseFloat(r.totalRevenue) || 0) - (parseFloat(r.totalPaidOut) || 0) - (parseFloat(r.pendingCommissions) || 0),
      } : null,
    };

    const [ordersResult, payoutsResult, txResult] = await Promise.all([
      r.shopId ? pool.query(
        `SELECT o.*, u.name as "customerName", u.email as "customerEmail"
         FROM "Order" o LEFT JOIN "User" u ON u.id = o."userId"
         WHERE o."shopId" = $1 ORDER BY o."createdAt" DESC LIMIT 20`,
        [r.shopId]
      ) : { rows: [] },
      r.shopId ? pool.query(
        `SELECT * FROM "VendorPayout" WHERE "shopId" = $1 ORDER BY "createdAt" DESC`,
        [r.shopId]
      ) : { rows: [] },
      r.shopId ? pool.query(
        `SELECT o.id, o."orderNumber", o.total as amount, o."paymentMethod", o."paymentStatus", o."createdAt",
         c.amount as commission, c.rate as "commissionRate", u.name as "customerName"
         FROM "Order" o
         LEFT JOIN "Commission" c ON c."orderId" = o.id
         LEFT JOIN "User" u ON u.id = o."userId"
         WHERE o."shopId" = $1 AND o."paymentStatus" = 'COMPLETED'
         ORDER BY o."createdAt" DESC LIMIT 20`,
        [r.shopId]
      ) : { rows: [] },
    ]);

    return NextResponse.json({
      vendor,
      orders: ordersResult.rows,
      payouts: payoutsResult.rows,
      transactions: txResult.rows,
    });
  } catch (error) {
    console.error("Error fetching vendor detail:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
