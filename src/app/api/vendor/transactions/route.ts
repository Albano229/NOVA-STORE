import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR", "OWNER", "ADMIN", "MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const limit = parseInt(searchParams.get("limit") || "50");
    const offset = parseInt(searchParams.get("offset") || "0");

    const salesResult = await pool.query(
      `SELECT
        o.id as "orderId",
        o."orderNumber",
        o.total as amount,
        o."paymentMethod",
        o."paymentStatus",
        o."createdAt",
        o.status as "orderStatus",
        c.amount as commission,
        c.rate as "commissionRate",
        c.status as "commissionStatus",
        u.name as "customerName",
        u.email as "customerEmail"
      FROM "Order" o
      LEFT JOIN "Commission" c ON c."orderId" = o.id
      LEFT JOIN "User" u ON u.id = o."userId"
      WHERE o."shopId" = $1 AND o."paymentStatus" = 'COMPLETED'
      ORDER BY o."createdAt" DESC
      LIMIT $2 OFFSET $3`,
      [shop.id, limit, offset]
    );

    const payoutsResult = await pool.query(
      `SELECT
        id,
        amount,
        method,
        status,
        "accountInfo",
        "createdAt"
      FROM "VendorPayout"
      WHERE "shopId" = $1
      ORDER BY "createdAt" DESC
      LIMIT $2 OFFSET $3`,
      [shop.id, limit, offset]
    );

    const allTransactions = [
      ...salesResult.rows.map((r) => ({
        type: "SALE" as const,
        id: r.orderId,
        reference: r.orderNumber,
        amount: parseFloat(r.amount),
        commission: r.commission ? parseFloat(r.commission) : 0,
        netAmount: parseFloat(r.amount) - (r.commission ? parseFloat(r.commission) : 0),
        method: r.paymentMethod,
        status: r.orderStatus,
        customer: r.customerName || r.customerEmail,
        createdAt: r.createdAt,
      })),
      ...payoutsResult.rows.map((r) => ({
        type: "PAYOUT" as const,
        id: r.id,
        reference: r.id.slice(0, 8),
        amount: parseFloat(r.amount),
        commission: 0,
        netAmount: -parseFloat(r.amount),
        method: r.method,
        status: r.status,
        customer: null,
        createdAt: r.createdAt,
      })),
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const filtered = type
      ? allTransactions.filter((t) => t.type === type)
      : allTransactions;

    return NextResponse.json({
      transactions: filtered.slice(0, limit),
      total: allTransactions.length,
    });
  } catch (error) {
    console.error("Error fetching vendor transactions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
