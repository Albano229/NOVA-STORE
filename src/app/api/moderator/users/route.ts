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
        u."id", u."name", u."email", u."role", u."isActive", u."createdAt"
      FROM "User" u
      ORDER BY u."createdAt" DESC
    `);

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching moderator users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
