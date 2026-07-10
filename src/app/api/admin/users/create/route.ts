import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import bcrypt from "bcryptjs";
import { slugify } from "@/lib/utils";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { name, email, password, role, phone, shopName } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "name, email, password et role sont requis" },
        { status: 400 }
      );
    }

    if (!["ADMIN", "VENDOR", "CLIENT"].includes(role)) {
      return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
    }

    if (password.length < 6) {
      return NextResponse.json(
        { error: "Le mot de passe doit contenir au moins 6 caractères" },
        { status: 400 }
      );
    }

    const pool = getAuthPool();

    const existingUser = await pool.query(`SELECT id FROM "User" WHERE email = $1`, [email]);
    if (existingUser.rows.length > 0) {
      return NextResponse.json(
        { error: "Un compte avec cet email existe déjà" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);

    const userResult = await pool.query(
      `INSERT INTO "User" (name, email, password, phone, role, "emailVerified", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), NOW(), NOW()) RETURNING *`,
      [name, email, hashedPassword, phone || null, role]
    );

    const user = userResult.rows[0];

    let shops: any[] = [];
    if (role === "VENDOR" && shopName) {
      const shopResult = await pool.query(
        `INSERT INTO "Shop" (name, slug, "userId", "createdAt", "updatedAt")
         VALUES ($1, $2, $3, NOW(), NOW()) RETURNING id, name, slug`,
        [shopName, slugify(shopName), user.id]
      );
      shops = shopResult.rows;
    }

    return NextResponse.json({
      message: "Utilisateur créé avec succès",
      user: { ...user, shops },
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating user:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création de l'utilisateur" },
      { status: 500 }
    );
  }
}
