import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import bcrypt from "bcryptjs";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const userId = session.user.id;

    const userResult = await pool.query(
      `SELECT "id", "name", "email", "phone", "image", "role", "isActive", "createdAt"
       FROM "User" WHERE "id" = $1`,
      [userId]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const user = userResult.rows[0];

    const shopsResult = await pool.query(
      `SELECT s."id", s."name", s."slug",
              (SELECT COUNT(*) FROM "Product" p WHERE p."shopId" = s."id")::int AS "productCount",
              (SELECT COUNT(*) FROM "Order" o WHERE o."shopId" = s."id")::int AS "orderCount",
              COALESCE((SELECT SUM(o."total") FROM "Order" o
               WHERE o."shopId" = s."id" AND o."paymentStatus" = 'COMPLETED'), 0)::float AS "revenue"
       FROM "Shop" s WHERE s."userId" = $1`,
      [userId]
    );

    const ordersResult = await pool.query(
      `SELECT COUNT(*)::int AS "totalOrders",
              COALESCE(SUM("total"), 0)::float AS "totalSpent"
       FROM "Order" WHERE "userId" = $1`,
      [userId]
    );

    const productsResult = await pool.query(
      `SELECT COUNT(*)::int AS "totalProducts"
       FROM "Product" WHERE "shopId" IN (SELECT "id" FROM "Shop" WHERE "userId" = $1)`,
      [userId]
    );

    const revenueResult = await pool.query(
      `SELECT COALESCE(SUM(o."total"), 0)::float AS "totalRevenue"
       FROM "Order" o
       JOIN "Shop" s ON s."id" = o."shopId"
       WHERE s."userId" = $1 AND o."paymentStatus" = 'COMPLETED'`,
      [userId]
    );

    const activityResult = await pool.query(
      `SELECT * FROM (
         SELECT 'commande' AS "action", 'Commande #' || o."orderNumber" AS "description", o."createdAt" AS "date"
         FROM "Order" o WHERE o."userId" = $1
         UNION ALL
         SELECT 'boutique' AS "action", 'Boutique créée: ' || s."name" AS "description", s."createdAt" AS "date"
         FROM "Shop" s WHERE s."userId" = $1
       ) sub
       ORDER BY "date" DESC LIMIT 10`,
      [userId]
    );

    const shops = shopsResult.rows.map((s) => ({
      ...s,
      revenue: parseFloat(s.revenue) || 0,
    }));

    const stats = {
      totalOrders: ordersResult.rows[0]?.totalOrders || 0,
      totalSpent: parseFloat(ordersResult.rows[0]?.totalSpent) || 0,
      totalProducts: productsResult.rows[0]?.totalProducts || 0,
      totalRevenue: parseFloat(revenueResult.rows[0]?.totalRevenue) || 0,
    };

    return NextResponse.json({
      user,
      shops,
      stats,
      recentActivity: activityResult.rows,
    });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const body = await request.json();
    const { name, phone, image } = body;

    const fields: string[] = [];
    const values: unknown[] = [];
    let idx = 1;

    if (name !== undefined) {
      fields.push(`"name" = $${idx}`);
      values.push(name);
      idx++;
    }
    if (phone !== undefined) {
      fields.push(`"phone" = $${idx}`);
      values.push(phone);
      idx++;
    }
    if (image !== undefined) {
      fields.push(`"image" = $${idx}`);
      values.push(image);
      idx++;
    }

    if (fields.length === 0) {
      return NextResponse.json({ error: "Aucun champ à modifier" }, { status: 400 });
    }

    fields.push(`"updatedAt" = NOW()`);
    values.push(session.user.id);
    const result = await pool.query(
      `UPDATE "User" SET ${fields.join(", ")} WHERE "id" = $${idx}
       RETURNING "id", "name", "email", "phone", "image", "role", "isActive", "createdAt"`,
      values
    );

    return NextResponse.json({ user: result.rows[0] });
  } catch (error) {
    console.error("Error updating profile:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const body = await request.json();
    const { currentPassword, newPassword } = body;

    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: "Tous les champs sont requis" }, { status: 400 });
    }

    if (newPassword.length < 8) {
      return NextResponse.json({ error: "Le nouveau mot de passe doit contenir au moins 8 caractères" }, { status: 400 });
    }

    const userResult = await pool.query(
      `SELECT "password" FROM "User" WHERE "id" = $1`,
      [session.user.id]
    );

    if (userResult.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }

    const user = userResult.rows[0];

    if (!user.password) {
      return NextResponse.json({ error: "Compte OAuth — utilisez la gestion de mot de passe du fournisseur" }, { status: 400 });
    }

    const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
    if (!isPasswordValid) {
      return NextResponse.json({ error: "Mot de passe actuel incorrect" }, { status: 400 });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 12);
    await pool.query(
      `UPDATE "User" SET "password" = $1, "updatedAt" = NOW() WHERE "id" = $2`,
      [hashedPassword, session.user.id]
    );

    return NextResponse.json({ message: "Mot de passe modifié avec succès" });
  } catch (error) {
    console.error("Error changing password:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
