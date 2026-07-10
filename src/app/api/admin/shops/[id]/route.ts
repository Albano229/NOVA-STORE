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
    const result = await pool.query(
      `UPDATE "Shop" SET "isVerified" = $1, "commissionRate" = $2, "updatedAt" = NOW() WHERE id = $3 RETURNING *`,
      [body.isVerified, body.commissionRate, id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating shop:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
