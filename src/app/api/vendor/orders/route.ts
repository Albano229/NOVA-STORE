import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let query = `
      SELECT o.*,
             json_build_object('name', u."name", 'email', u."email") AS "user",
             COALESCE(
               (SELECT json_agg(jsonb_build_object('id', oi."id", 'productId', oi."productId", 'quantity', oi."quantity", 'price', oi."price", 'name', oi."name", 'variantId', oi."variantId"))
                FROM "OrderItem" oi WHERE oi."orderId" = o."id"), '[]'
             ) AS "items"
      FROM "Order" o
      LEFT JOIN "User" u ON u."id" = o."userId"
      WHERE o."shopId" = $1
    `;
    const params: any[] = [shop.id];

    if (status) {
      params.push(status);
      query += ` AND o."status" = $${params.length}`;
    }

    query += ` ORDER BY o."createdAt" DESC`;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching vendor orders:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
