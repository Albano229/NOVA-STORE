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
    const { isActive } = body;

    const pool = getAuthPool();

    const result = await pool.query(
      `UPDATE "Product" SET "isActive" = $1, "updatedAt" = NOW() WHERE "id" = $2
       RETURNING "id", "name", "isActive"`,
      [isActive, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Produit non trouvé" }, { status: 404 });
    }

    try {
      await pool.query(
        `INSERT INTO "AuditLog" ("id", "userId", "action", "entityType", "entityId", "afterState", "metadata", "createdAt")
         VALUES (gen_random_uuid()::text, $1, 'PRODUCT_MODERATION', 'Product', $2, $3, $4, NOW())`,
        [session.user.id, id, JSON.stringify({ isActive }), JSON.stringify({ source: "moderator" })]
      );
    } catch {
      // audit log optional
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error moderating product:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
