import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || !["ADMIN", "MODERATOR", "OWNER"].includes(session.user.role)) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const pool = getAuthPool();

  const pendingProducts = await pool.query(
    `SELECT COUNT(*)::int AS count FROM "Product" WHERE "isActive" = false`
  );
  const reportedStores = await pool.query(
    `SELECT COUNT(*)::int AS count FROM "Shop" WHERE "isVerified" = false`
  );
  const reportedOrders = await pool.query(
    `SELECT COUNT(*)::int AS count FROM "Order" WHERE "status" = 'CANCELLED'`
  );
  const reportedUsers = await pool.query(
    `SELECT COUNT(*)::int AS count FROM "User" WHERE "isActive" = false AND "role" = 'CLIENT'`
  );
  const fraudAlerts = await pool.query(
    `SELECT COUNT(*)::int AS count FROM "Payment" WHERE "status" = 'FAILED'`
  );

  return NextResponse.json({
    pendingProducts: pendingProducts.rows[0].count,
    reportedStores: reportedStores.rows[0].count,
    reportedOrders: reportedOrders.rows[0].count,
    reportedUsers: reportedUsers.rows[0].count,
    fraudAlerts: fraudAlerts.rows[0].count,
  });
}
