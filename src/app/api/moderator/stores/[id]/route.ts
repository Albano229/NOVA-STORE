import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["ADMIN", "MODERATOR", "OWNER"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await request.json();
    const { isActive, isVerified } = body;

    const pool = getAuthPool();

    const sets: string[] = [];
    const vals: unknown[] = [];
    let idx = 1;

    if (isActive !== undefined) {
      sets.push(`"isActive" = $${idx}`);
      vals.push(isActive);
      idx++;
    }
    if (isVerified !== undefined) {
      sets.push(`"isVerified" = $${idx}`);
      vals.push(isVerified);
      idx++;
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à modifier" }, { status: 400 });
    }

    sets.push(`"updatedAt" = NOW()`);
    vals.push(id);

    const result = await pool.query(
      `UPDATE "Shop" SET ${sets.join(", ")} WHERE "id" = $${idx}
       RETURNING "id", "name", "isActive", "isVerified"`,
      vals
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    try {
      await pool.query(
        `INSERT INTO "AuditLog" ("id", "userId", "action", "entityType", "entityId", "afterState", "metadata", "createdAt")
         VALUES (gen_random_uuid()::text, $1, 'STORE_MODERATION', 'Shop', $2, $3, $4, NOW())`,
        [session.user.id, id, JSON.stringify(body), JSON.stringify({ source: "moderator" })]
      );
    } catch {
      // audit log optional
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error moderating store:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
