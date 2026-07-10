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
        pay."id", pay."amount", pay."currency", pay."method",
        pay."status", pay."transactionId", pay."createdAt",
        json_build_object(
          'orderNumber', o."orderNumber",
          'user', json_build_object('name', u."name", 'email', u."email")
        ) AS "order"
      FROM "Payment" pay
      LEFT JOIN "Order" o ON o."id" = pay."orderId"
      LEFT JOIN "User" u ON u."id" = o."userId"
      ORDER BY pay."createdAt" DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching moderator transactions:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
