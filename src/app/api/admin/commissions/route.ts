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

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    const pool = getAuthPool();

    let query = `
      SELECT 
        c.*,
        json_build_object('orderNumber', o."orderNumber", 'total', o.total, 'createdAt', o."createdAt") AS "order",
        json_build_object('name', sh.name) AS shop
      FROM "Commission" c
      LEFT JOIN "Order" o ON o.id = c."orderId"
      LEFT JOIN "Shop" sh ON sh.id = c."shopId"
    `;
    const params: any[] = [];

    if (status) {
      params.push(status);
      query += ` WHERE c.status = $1`;
    }

    query += ` ORDER BY c."createdAt" DESC`;

    const result = await pool.query(query, params);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching commissions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
