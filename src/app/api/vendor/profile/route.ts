import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const result = await pool.query(
      `SELECT "id", "name", "email", "phone", "image", "role", "isActive", "createdAt"
       FROM "User"
       WHERE "id" = $1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const body = await request.json();
    const { name, phone } = body;

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (name) { fields.push(`"name" = $${idx}`); values.push(name); idx++; }
    if (phone !== undefined) { fields.push(`"phone" = $${idx}`); values.push(phone); idx++; }

    if (fields.length === 0) {
      const result = await pool.query(
        `SELECT "name", "phone" FROM "User" WHERE "id" = $1`,
        [session.user.id]
      );
      return NextResponse.json({ user: result.rows[0] });
    }

    values.push(session.user.id);
    const result = await pool.query(
      `UPDATE "User" SET ${fields.join(", ")} WHERE "id" = $${idx} RETURNING "name", "phone"`,
      values
    );

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  return PUT(request);
}
