import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "MODERATOR", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();

    const result = await pool.query(`
      SELECT
        o."id", o."orderNumber", o."total", o."status", o."paymentStatus",
        o."createdAt",
        json_build_object('name', u."name", 'email', u."email") AS "user",
        json_build_object('name', s."name") AS "shop"
      FROM "Order" o
      LEFT JOIN "User" u ON u."id" = o."userId"
      LEFT JOIN "Shop" s ON s."id" = o."shopId"
      ORDER BY o."createdAt" DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching moderator orders:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
