import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  try {
    const pool = getAuthPool();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["OWNER", "ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const statsResult = await pool.query(
      `SELECT
        COUNT(*) as total_referrals,
        COUNT(*) FILTER (WHERE status = 'CONFIRMED') as confirmed,
        COUNT(*) FILTER (WHERE status = 'PENDING') as pending,
        COALESCE(SUM("rewardAmount") FILTER (WHERE status = 'CONFIRMED'), 0) as total_rewards,
        (SELECT COUNT(*) FROM "User" WHERE "referralCode" IS NOT NULL) as users_with_code
      FROM "Referral"`
    );

    const configResult = await pool.query(
      `SELECT * FROM "ReferralConfig" WHERE id = 'default'`
    );

    const topReferrersResult = await pool.query(
      `SELECT u.id, u.name, u.email, u."referralCode",
              COUNT(r.id) as referral_count,
              COALESCE(SUM(r."rewardAmount") FILTER (WHERE r.status = 'CONFIRMED'), 0) as total_earned
      FROM "User" u
      LEFT JOIN "Referral" r ON r."referrerId" = u.id
      WHERE u."referralCode" IS NOT NULL
      GROUP BY u.id, u.name, u.email, u."referralCode"
      HAVING COUNT(r.id) > 0
      ORDER BY referral_count DESC
      LIMIT 20`
    );

    const recentResult = await pool.query(
      `SELECT r.id, r.status, r."rewardAmount", r."createdAt",
              ref.name as referrer_name, ref.email as referrer_email,
              u.name as referee_name, u.email as referee_email
      FROM "Referral" r
      JOIN "User" ref ON ref.id = r."referrerId"
      JOIN "User" u ON u.id = r."refereeId"
      ORDER BY r."createdAt" DESC
      LIMIT 50`
    );

    return NextResponse.json({
      stats: statsResult.rows[0],
      config: configResult.rows[0] || null,
      topReferrers: topReferrersResult.rows,
      recent: recentResult.rows,
    });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const pool = getAuthPool();
    const session = await getServerSession(authOptions);
    if (!session?.user?.id || !["OWNER", "ADMIN"].includes((session.user as any).role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { rewardAmount, rewardType, minPurchaseAmount, maxReferralsPerUser, isActive } = body;

    await pool.query(
      `UPDATE "ReferralConfig" SET
        "rewardAmount" = COALESCE($1, "rewardAmount"),
        "rewardType" = COALESCE($2, "rewardType"),
        "minPurchaseAmount" = COALESCE($3, "minPurchaseAmount"),
        "maxReferralsPerUser" = COALESCE($4, "maxReferralsPerUser"),
        "isActive" = COALESCE($5, "isActive"),
        "updatedAt" = NOW()
      WHERE id = 'default'`,
      [rewardAmount, rewardType, minPurchaseAmount, maxReferralsPerUser, isActive]
    );

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
