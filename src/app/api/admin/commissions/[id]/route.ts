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
    const body = await req.json();

    const pool = getAuthPool();
    const paidAt = body.status === "PAID" ? new Date().toISOString() : null;
    const result = await pool.query(
      `UPDATE "Commission" SET status = $1, "paidAt" = $2 WHERE id = $3 RETURNING *`,
      [body.status, paidAt, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Commission non trouvée" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating commission:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
