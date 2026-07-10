import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  try {
    const pool = getAuthPool();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) return NextResponse.json({ error: "Non autorisé" }, { status: 401 });

    const userId = session.user.id;

    const statsResult = await pool.query(
      `SELECT
        COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COALESCE(SUM("rewardAmount") FILTER (WHERE status = 'CONFIRMED'), 0) as total_earned,
        COUNT(*) as total_referrals
      FROM "Referral" WHERE "referrerId" = $1`,
      [userId]
    );

    const configResult = await pool.query(
      `SELECT * FROM "ReferralConfig" WHERE id = 'default'`
    );

    const referralsResult = await pool.query(
      `SELECT r.id, r.status, r."rewardAmount", r."rewardGivenAt", r."createdAt",
              u.name, u.email
      FROM "Referral" r
      JOIN "User" u ON u.id = r."refereeId"
      WHERE r."referrerId" = $1
      ORDER BY r."createdAt" DESC
      LIMIT 50`,
      [userId]
    );

    return NextResponse.json({
      stats: statsResult.rows[0],
      config: configResult.rows[0] || null,
      referrals: referralsResult.rows,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
