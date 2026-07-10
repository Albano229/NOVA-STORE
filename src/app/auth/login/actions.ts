"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import bcrypt from "bcryptjs";
import { getAuthPool } from "@/lib/auth-pool";
import { SignJWT, jwtVerify } from "jose";

const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET);

async function createSessionToken(user: { id: string; email: string; name: string | null; role: string }) {
  return new SignJWT({ id: user.id, email: user.email, name: user.name, role: user.role })
    .setProtectedHeader({ alg: "HS256", enc: "A256GCM" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(secret);
}

export async function loginAction(
  prevState: { error: string } | null,
  formData: FormData
): Promise<{ error: string }> {
  const email = formData.get("email") as string;
  const password = formData.get("password") as string;

  if (!email || !password) {
    return { error: "Email et mot de passe requis" };
  }

  try {
    const pool = getAuthPool();
    const result = await pool.query(
      `SELECT id, name, email, password, role, "isActive" FROM "User" WHERE email = $1`,
      [email]
    );
    const user = result.rows[0];

    if (!user || !user.password) {
      return { error: "Email ou mot de passe incorrect" };
    }

    if (!user.isActive) {
      return { error: "Compte désactivé" };
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return { error: "Email ou mot de passe incorrect" };
    }

    const token = await createSessionToken({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
    });

    const cookieStore = await cookies();
    cookieStore.set("next-auth.session-token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      maxAge: 30 * 24 * 60 * 60,
    });

    if (user.role === "ADMIN") {
      redirect("/admin");
    } else if (user.role === "VENDOR" || user.role === "MODERATOR") {
      try {
        const shopsResult = await pool.query(
          `SELECT id FROM "Shop" WHERE "userId" = $1 LIMIT 1`,
          [user.id]
        );
        if (shopsResult.rows.length === 0) {
          redirect("/vendor/onboarding");
        } else {
          redirect("/vendor");
        }
      } catch {
        redirect("/vendor");
      }
    } else {
      redirect("/");
    }
  } catch (e: any) {
    if (e?.message?.includes("NEXT_REDIRECT")) {
      throw e;
    }
    console.error("[LOGIN ERROR]", e);
    return { error: "Erreur de connexion au serveur" };
  }

  return { error: "" };
}
