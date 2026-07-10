import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    const result = await pool.query(
      `SELECT u."id", u."name", u."email", u."phone",
              COUNT(o."id")::int AS "orderCount",
              COALESCE(SUM(o."total"), 0)::numeric AS "totalSpent",
              MAX(o."createdAt") AS "lastOrder"
       FROM "Order" o
       INNER JOIN "User" u ON u."id" = o."userId"
       WHERE o."shopId" = $1
       GROUP BY u."id", u."name", u."email", u."phone"
       ORDER BY SUM(o."total") DESC`,
      [shop.id]
    );

    return NextResponse.json({ clients: result.rows });
  } catch (error) {
    console.error("Error fetching clients:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
