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
        s."id", s."name", s."slug", s."isActive", s."isVerified", s."createdAt",
        json_build_object('name', u."name", 'email', u."email") AS "user",
        json_build_object(
          'products', (SELECT COUNT(*)::int FROM "Product" p WHERE p."shopId" = s."id"),
          'orders', (SELECT COUNT(*)::int FROM "Order" o WHERE o."shopId" = s."id")
        ) AS "_count"
      FROM "Shop" s
      LEFT JOIN "User" u ON u."id" = s."userId"
      ORDER BY s."createdAt" DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching moderator stores:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
