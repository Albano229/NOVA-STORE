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
    const { status, reason } = body;

    if (!["APPROVED", "REJECTED", "COMPLETED"].includes(status)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const pool = getAuthPool();

    const existing = await pool.query(`SELECT * FROM "VendorPayout" WHERE id = $1`, [id]);
    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Retrait non trouvé" }, { status: 404 });
    }

    const payout = existing.rows[0];

    if (status === "APPROVED" && payout.status !== "PENDING") {
      return NextResponse.json({ error: "Ce retrait ne peut plus être approuvé" }, { status: 400 });
    }

    if (status === "REJECTED" && payout.status !== "PENDING") {
      return NextResponse.json({ error: "Ce retrait ne peut plus être rejeté" }, { status: 400 });
    }

    const client = await pool.connect();
    try {
      await client.query("BEGIN");

      const updateFields: string[] = [`"status" = $1`, `"updatedAt" = NOW()`];
      const updateParams: any[] = [status];

      if (status === "REJECTED" && reason) {
        updateFields.push(`"notes" = $2`);
        updateParams.push(reason);
      }

      updateParams.push(id);

      const result = await client.query(
        `UPDATE "VendorPayout" SET ${updateFields.join(", ")} WHERE id = $${updateParams.length} RETURNING *`,
        updateParams
      );

      if (status === "REJECTED") {
        await client.query(
          `UPDATE "Wallet" SET "balance" = "balance" + $1, "updatedAt" = NOW()
           WHERE "shopId" = $2`,
          [payout.amount, payout.shopId]
        );
      }

      await client.query(
        `INSERT INTO "AuditLog" ("id", "action", "entityType", "entityId", "metadata", "userId", "createdAt")
         VALUES (gen_random_uuid(), $1, 'PAYOUT', $2, $3, $4, NOW())`,
        [
          `PAYOUT_${status}`,
          id,
          `Retrait ${status === "APPROVED" ? "approuvé" : status === "REJECTED" ? "rejeté" : "marqué comme payé"}${reason ? `. Raison: ${reason}` : ""}`,
          session.user.id,
        ]
      );

      await client.query("COMMIT");
      return NextResponse.json(result.rows[0]);
    } catch (e) {
      await client.query("ROLLBACK");
      throw e;
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error updating payout:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
