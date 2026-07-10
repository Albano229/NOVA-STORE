import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { getAuthPool } from "@/lib/auth-pool";
import { registerSchema } from "@/validators";
import { withRateLimit } from "@/lib/api-rate-limit";

function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export const POST = withRateLimit(
  async function POST(req: Request) {
  try {
    const body = await req.json();

    let validatedData;
    try {
      validatedData = registerSchema.parse(body);
    } catch (parseError: any) {
      return NextResponse.json(
        { error: parseError.errors?.[0]?.message || "Données invalides" },
        { status: 400 }
      );
    }

    const pool = getAuthPool();

    const existing = await pool.query(
      `SELECT id FROM "User" WHERE email = $1`,
      [validatedData.email]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(validatedData.password, 12);
    const myCode = generateReferralCode();

    const referralCode = (body as any).referralCode?.toUpperCase().trim() || null;
    let referredById: string | null = null;

    if (referralCode) {
      const referrerResult = await pool.query(
        `SELECT id FROM "User" WHERE UPPER("referralCode") = $1`,
        [referralCode]
      );
      if (referrerResult.rows.length > 0) {
        referredById = referrerResult.rows[0].id;
      }
    }

    const result = await pool.query(
      `INSERT INTO "User" (id, name, email, password, phone, role, "isActive", "referralCode", "referredById", "createdAt", "updatedAt")
       VALUES (gen_random_uuid()::text, $1, $2, $3, $4, $5, true, $6, $7, NOW(), NOW())
       RETURNING id, name, email, role`,
      [validatedData.name, validatedData.email, hashedPassword, validatedData.phone || null, validatedData.role, myCode, referredById]
    );

    const user = result.rows[0];

    if (referredById) {
      const configResult = await pool.query(
        `SELECT "rewardAmount" FROM "ReferralConfig" WHERE id = 'default'`
      );
      const rewardAmount = configResult.rows[0]?.rewardAmount || 500;

      await pool.query(
        `INSERT INTO "Referral" (id, "referrerId", "refereeId", code, status, "rewardAmount", "createdAt")
         VALUES (gen_random_uuid()::text, $1, $2, $3, 'PENDING', $4, NOW())`,
        [referredById, user.id, referralCode, rewardAmount]
      );
    }

    return NextResponse.json({
      message: "Compte créé avec succès",
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
      },
    });
  } catch (error: any) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création du compte" },
      { status: 500 }
    );
  }
},
  { limit: 5, window: 60_000, keyPrefix: "auth-register" }
);
