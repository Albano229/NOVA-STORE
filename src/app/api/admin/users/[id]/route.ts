import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getAuthPool();

    const target = await pool.query(`SELECT "role" FROM "User" WHERE "id" = $1`, [id]);
    if (target.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    if (target.rows[0].role === "OWNER") {
      return NextResponse.json({ error: "Impossible de modifier le propriétaire" }, { status: 403 });
    }

    const body = await req.json();
    const sets: string[] = [];
    const vals: string[] = [];
    let idx = 1;

    if (body.role !== undefined) {
      if (!["ADMIN", "MODERATOR", "VENDOR", "CLIENT"].includes(body.role)) {
        return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
      }
      sets.push(`"role" = $${idx}`);
      vals.push(body.role);
      idx++;
    }
    if (body.isActive !== undefined) {
      sets.push(`"isActive" = $${idx}`);
      vals.push(body.isActive);
      idx++;
    }
    if (body.name !== undefined) {
      sets.push(`"name" = $${idx}`);
      vals.push(body.name);
      idx++;
    }
    if (body.phone !== undefined) {
      sets.push(`"phone" = $${idx}`);
      vals.push(body.phone);
      idx++;
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à modifier" }, { status: 400 });
    }

    sets.push(`"updatedAt" = NOW()`);
    vals.push(id);

    const result = await pool.query(
      `UPDATE "User" SET ${sets.join(", ")} WHERE "id" = $${idx} RETURNING "id", "name", "email", "phone", "role", "isActive", "createdAt"`,
      vals
    );

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating user:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Seul le propriétaire peut supprimer un compte" }, { status: 403 });
    }

    const { id } = await params;
    const pool = getAuthPool();

    const target = await pool.query(`SELECT "role" FROM "User" WHERE "id" = $1`, [id]);
    if (target.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    if (target.rows[0].role === "OWNER") {
      return NextResponse.json({ error: "Impossible de supprimer le propriétaire" }, { status: 403 });
    }

    await pool.query(`DELETE FROM "User" WHERE "id" = $1`, [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting user:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
