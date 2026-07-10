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

    const pool = getAuthPool();
    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search") || "";
    const status = searchParams.get("status") || "ALL";
    const sort = searchParams.get("sort") || "newest";

    let whereClause = `WHERE u.role = 'VENDOR'`;
    const params: any[] = [];

    if (search) {
      params.push(`%${search}%`);
      whereClause += ` AND (u.name ILIKE $${params.length} OR u.email ILIKE $${params.length} OR s.name ILIKE $${params.length})`;
    }

    if (status === "ACTIVE") {
      whereClause += ` AND u."isActive" = true`;
    } else if (status === "INACTIVE") {
      whereClause += ` AND u."isActive" = false`;
    } else if (status === "VERIFIED") {
      whereClause += ` AND s."isVerified" = true`;
    } else if (status === "UNVERIFIED") {
      whereClause += ` AND (s."isVerified" = false OR s."isVerified" IS NULL)`;
    } else if (status === "WITH_SHOP") {
      whereClause += ` AND s.id IS NOT NULL`;
    } else if (status === "NO_SHOP") {
      whereClause += ` AND s.id IS NULL`;
    }

    let orderClause = `ORDER BY u."createdAt" DESC`;
    if (sort === "name_asc") orderClause = `ORDER BY u.name ASC NULLS LAST`;
    else if (sort === "name_desc") orderClause = `ORDER BY u.name DESC NULLS LAST`;
    else if (sort === "oldest") orderClause = `ORDER BY u."createdAt" ASC`;

    const result = await pool.query(
      `SELECT 
        u.id, u.name, u.email, u.phone, u.image, u.role, u."isActive", u."createdAt", u."updatedAt",
        s.id as "shopId", s.name as "shopName", s.slug as "shopSlug", s.description as "shopDescription",
        s.phone as "shopPhone", s.email as "shopEmail", s.address as "shopAddress", s.city as "shopCity",
        s."isActive" as "shopIsActive", s."isVerified" as "shopIsVerified", s."commissionRate",
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
        SELECT "shopId", 
          SUM(CASE WHEN "paymentStatus" = 'COMPLETED' THEN "total" ELSE 0 END) as total
        FROM "Order" GROUP BY "shopId"
      ) os ON os."shopId" = s.id
      LEFT JOIN (
        SELECT "shopId",
          SUM("amount") as total,
          SUM(CASE WHEN "status" = 'PENDING' THEN "amount" ELSE 0 END) as pending
        FROM "Commission" GROUP BY "shopId"
      ) comm ON comm."shopId" = s.id
      LEFT JOIN (
        SELECT "shopId",
          SUM(CASE WHEN "status" = 'COMPLETED' THEN "amount" ELSE 0 END) as total,
          SUM(CASE WHEN "status" = 'PENDING' THEN "amount" ELSE 0 END) as pending
        FROM "VendorPayout" GROUP BY "shopId"
      ) po ON po."shopId" = s.id
      LEFT JOIN "Wallet" w ON w."shopId" = s.id
      ${whereClause}
      GROUP BY u.id, s.id, pc.cnt, oc.cnt, os.total, comm.total, comm.pending, po.total, po.pending, w."balance", w."pendingBalance"
      ${orderClause}`,
      params
    );

    const vendors = result.rows.map((r) => ({
      id: r.id,
      name: r.name,
      email: r.email,
      phone: r.phone,
      image: r.image,
      isActive: r.isActive,
      createdAt: r.createdAt,
      updatedAt: r.updatedAt,
      shop: r.shopId ? {
        id: r.shopId,
        name: r.shopName,
        slug: r.shopSlug,
        description: r.shopDescription,
        phone: r.shopPhone,
        email: r.shopEmail,
        address: r.shopAddress,
        city: r.shopCity,
        isActive: r.shopIsActive,
        isVerified: r.shopIsVerified,
        commissionRate: r.commissionRate,
        productCount: r.productCount,
        orderCount: r.orderCount,
        totalRevenue: parseFloat(r.totalRevenue) || 0,
        totalCommissions: parseFloat(r.totalCommissions) || 0,
        pendingCommissions: parseFloat(r.pendingCommissions) || 0,
        totalPaidOut: parseFloat(r.totalPaidOut) || 0,
        pendingPayouts: parseFloat(r.pendingPayouts) || 0,
        walletBalance: parseFloat(r.balance) || 0,
        walletPendingBalance: parseFloat(r.pendingBalance) || 0,
        availableBalance: parseFloat(r.balance) || 0,
      } : null,
    }));

    const stats = {
      total: vendors.length,
      active: vendors.filter((v) => v.isActive).length,
      inactive: vendors.filter((v) => !v.isActive).length,
      withShop: vendors.filter((v) => v.shop).length,
      verified: vendors.filter((v) => v.shop?.isVerified).length,
      totalRevenue: vendors.reduce((s, v) => s + (v.shop?.totalRevenue || 0), 0),
      totalCommissions: vendors.reduce((s, v) => s + (v.shop?.totalCommissions || 0), 0),
      totalPaidOut: vendors.reduce((s, v) => s + (v.shop?.totalPaidOut || 0), 0),
    };

    return NextResponse.json({ vendors, stats });
  } catch (error) {
    console.error("Error fetching vendors:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
