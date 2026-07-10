import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request) {
  try {
    const pool = getAuthPool();
    const { searchParams } = new URL(req.url);
    const code = searchParams.get("code");
    if (!code) return NextResponse.json({ valid: false });

    const upperCode = code.toUpperCase().trim();
    const result = await pool.query(
      `SELECT id, name, email FROM "User" WHERE UPPER("referralCode") = $1`,
      [upperCode]
    );
    if (result.rows.length === 0) return NextResponse.json({ valid: false });

    const user = result.rows[0];
    return NextResponse.json({
      valid: true,
      referrerName: user.name || "Un ami",
    });
  } catch {
    return NextResponse.json({ valid: false });
  }
}
