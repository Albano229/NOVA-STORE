import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export async function GET() {
  try {
    const pool = getAuthPool();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const result = await pool.query(
      `SELECT "referralCode" FROM "User" WHERE id = $1`,
      [session.user.id]
    );
    let code = result.rows[0]?.referralCode;

    if (!code) {
      code = generateCode();
      await pool.query(
        `UPDATE "User" SET "referralCode" = $1 WHERE id = $2`,
        [code, session.user.id]
      );
    }

    return NextResponse.json({ code });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
