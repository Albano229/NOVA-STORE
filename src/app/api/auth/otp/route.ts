import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";
import { SignJWT } from "jose";
import bcrypt from "bcryptjs";
import { withRateLimit } from "@/lib/api-rate-limit";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

async function ensureOtpTable(pool: any) {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS "OtpCode" (
      id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
      email TEXT NOT NULL,
      code TEXT NOT NULL,
      expiresAt TIMESTAMP WITH TIME ZONE NOT NULL,
      used BOOLEAN DEFAULT FALSE,
      "createdAt" TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )
  `);
}

async function createSessionToken(user: { id: string; email: string; name: string | null; role: string }) {
  return new SignJWT({ id: user.id, email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export const POST = withRateLimit(
  async function POST(req: Request) {
  try {
    const { email } = await req.json();

    if (!email || typeof email !== "string") {
      return NextResponse.json({ error: "Email requis" }, { status: 400 });
    }

    const pool = getAuthPool();
    await ensureOtpTable(pool);

    const code = generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    await pool.query(
      `INSERT INTO "OtpCode" (email, code, "expiresAt") VALUES ($1, $2, $3)`,
      [email.toLowerCase(), code, expiresAt.toISOString()]
    );

    console.log(`[OTP] Code pour ${email}: ${code}`);

    return NextResponse.json({ success: true, message: "Code envoyé" });
  } catch (error) {
    console.error("[OTP SEND ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
},
  { limit: 3, window: 60_000, keyPrefix: "auth-otp" }
);

export const PUT = withRateLimit(
  async function PUT(req: Request) {
  try {
    const { email, code } = await req.json();

    if (!email || !code) {
      return NextResponse.json({ error: "Email et code requis" }, { status: 400 });
    }

    const pool = getAuthPool();
    await ensureOtpTable(pool);

    const result = await pool.query(
      `SELECT id FROM "OtpCode"
       WHERE email = $1 AND code = $2 AND used = FALSE AND "expiresAt" > NOW()
       ORDER BY "createdAt" DESC LIMIT 1`,
      [email.toLowerCase(), code]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Code invalide ou expiré" }, { status: 400 });
    }

    await pool.query(
      `UPDATE "OtpCode" SET used = TRUE WHERE id = $1`,
      [result.rows[0].id]
    );

    let userResult = await pool.query(
      `SELECT id, name, email, role FROM "User" WHERE email = $1`,
      [email.toLowerCase()]
    );

    let user;
    if (userResult.rows.length === 0) {
      userResult = await pool.query(
        `INSERT INTO "User" (email, name, role, "emailVerified")
         VALUES ($1, $1, 'CLIENT', NOW())
         RETURNING id, name, email, role`,
        [email.toLowerCase()]
      );
    }
    user = userResult.rows[0];

    const token = await createSessionToken(user);

    const response = NextResponse.json({ success: true, role: user.role });
    response.cookies.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    return response;
  } catch (error) {
    console.error("[OTP VERIFY ERROR]", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
},
  { limit: 3, window: 60_000, keyPrefix: "auth-otp-verify" }
);
