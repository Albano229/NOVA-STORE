import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const search = searchParams.get("search") || "";
    const roleFilter = searchParams.get("role") || "ALL";

    const pool = getAuthPool();

    const conditions: string[] = [];
    const params: string[] = [];
    let idx = 1;

    if (search) {
      conditions.push(`(u."name" ILIKE $${idx} OR u."email" ILIKE $${idx})`);
      params.push(`%${search}%`);
      idx++;
    }

    if (roleFilter && roleFilter !== "ALL") {
      conditions.push(`u."role" = $${idx}`);
      params.push(roleFilter);
      idx++;
    }

    const where = conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const query = `
      SELECT
        u."id", u."name", u."email", u."phone", u."image", u."role",
        u."isActive", u."createdAt"
      FROM "User" u
      ${where}
      ORDER BY u."name" NULLS LAST, u."email" ASC
      LIMIT 50
    `;

    const result = await pool.query(query, params);

    return NextResponse.json({ users: result.rows });
  } catch (error) {
    console.error("Error fetching eligible users:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
