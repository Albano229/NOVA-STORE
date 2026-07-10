import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import bcrypt from "bcryptjs";

export async function GET(request: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const role = searchParams.get("role") || "ALL";

    const pool = getAuthPool();

    let where = `WHERE u."role" IN ('OWNER', 'ADMIN', 'MODERATOR')`;
    const params: string[] = [];
    let idx = 1;

    if (role && role !== "ALL") {
      where += ` AND u."role" = $${idx}`;
      params.push(role);
      idx++;
    }

    const query = `
      SELECT
        u."id", u."name", u."email", u."phone", u."image", u."role",
        u."isActive", u."createdAt", u."updatedAt"
      FROM "User" u
      ${where}
      ORDER BY
        CASE u."role"
          WHEN 'OWNER' THEN 1
          WHEN 'ADMIN' THEN 2
          WHEN 'MODERATOR' THEN 3
        END,
        u."createdAt" DESC
    `;

    const result = await pool.query(query, params);

    const statsQuery = `
      SELECT
        COUNT(*)::int as "totalAdmins",
        COUNT(*) FILTER (WHERE "role" = 'ADMIN')::int as "totalAdminsCount",
        COUNT(*) FILTER (WHERE "role" = 'MODERATOR')::int as "totalModerators",
        COUNT(*) FILTER (WHERE "role" = 'OWNER')::int as "totalOwners",
        COUNT(*) FILTER (WHERE "isActive" = true AND "role" IN ('OWNER', 'ADMIN', 'MODERATOR'))::int as "activeStaff",
        COUNT(*) FILTER (WHERE "isActive" = false AND "role" IN ('OWNER', 'ADMIN', 'MODERATOR'))::int as "inactiveStaff"
      FROM "User"
      WHERE "role" IN ('OWNER', 'ADMIN', 'MODERATOR')
    `;
    const stats = await pool.query(statsQuery);

    const roles = {
      OWNER: {
        permissions: [
          "Accès complet à tout",
          "Gestion des administrateurs",
          "Paramètres plateforme",
          "Paiements & finances",
          "Suppression de comptes",
          "Configuration système",
          "Audit logs",
        ],
      },
      ADMIN: {
        permissions: [
          "Gestion des utilisateurs",
          "Gestion des produits",
          "Gestion des commandes",
          "Gestion des paiements",
          "Analytiques & rapports",
          "Paramètres boutique",
        ],
      },
      MODERATOR: {
        permissions: [
          "Gestion des produits",
          "Gestion des commandes",
          "Lecture utilisateurs",
          "Rapports & signalements",
        ],
      },
    };

    return NextResponse.json({
      members: result.rows,
      stats: {
        totalAdmins: stats.rows[0].totalAdminsCount,
        totalModerators: stats.rows[0].totalModerators,
        totalOwners: stats.rows[0].totalOwners,
        activeStaff: stats.rows[0].activeStaff,
        inactiveStaff: stats.rows[0].inactiveStaff,
      },
      roles,
    });
  } catch (error) {
    console.error("Error fetching team:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Seul le propriétaire peut créer du staff" }, { status: 403 });
    }

    const body = await req.json();
    const { name, email, password, role, phone } = body;

    if (!name || !email || !password || !role) {
      return NextResponse.json(
        { error: "name, email, password et role sont requis" },
        { status: 400 }
      );
    }

    if (!["ADMIN", "MODERATOR"].includes(role)) {
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
      `INSERT INTO "User" (name, email, password, phone, role, "emailVerified", "isActive", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, NOW(), true, NOW(), NOW())
       RETURNING "id", "name", "email", "phone", "role", "isActive", "createdAt"`,
      [name, email, hashedPassword, phone || null, role]
    );

    return NextResponse.json({
      message: "Membre créé avec succès",
      member: userResult.rows[0],
    }, { status: 201 });
  } catch (error: any) {
    console.error("Error creating team member:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors de la création" },
      { status: 500 }
    );
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Seul le propriétaire peut modifier le staff" }, { status: 403 });
    }

    const body = await req.json();
    const { userId, role, isActive } = body;

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 });
    }

    const pool = getAuthPool();

    const target = await pool.query(`SELECT "role" FROM "User" WHERE "id" = $1`, [userId]);
    if (target.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    if (target.rows[0].role === "OWNER") {
      return NextResponse.json({ error: "Impossible de modifier le propriétaire" }, { status: 403 });
    }

    const sets: string[] = [];
    const vals: string[] = [];
    let idx = 1;

    if (role !== undefined) {
      if (!["ADMIN", "MODERATOR"].includes(role)) {
        return NextResponse.json({ error: "Rôle invalide" }, { status: 400 });
      }
      sets.push(`"role" = $${idx}`);
      vals.push(role);
      idx++;
    }

    if (isActive !== undefined) {
      sets.push(`"isActive" = $${idx}`);
      vals.push(isActive);
      idx++;
    }

    if (sets.length === 0) {
      return NextResponse.json({ error: "Aucune donnée à modifier" }, { status: 400 });
    }

    sets.push(`"updatedAt" = NOW()`);
    vals.push(userId);

    const result = await pool.query(
      `UPDATE "User" SET ${sets.join(", ")} WHERE "id" = $${idx} RETURNING "id", "name", "email", "phone", "role", "isActive", "createdAt"`,
      vals
    );

    if (role !== undefined) {
      try {
        await pool.query(
          `INSERT INTO "AuditLog" ("id", "userId", "action", "entityType", "entityId", "beforeState", "afterState", "metadata", "createdAt")
           VALUES (gen_random_uuid()::text, $1, 'ROLE_CHANGE', 'User', $2, $3, $4, $5, NOW())`,
          [
            session.user.id,
            userId,
            JSON.stringify({ role: target.rows[0].role }),
            JSON.stringify({ role }),
            JSON.stringify({ source: "admin_team" }),
          ]
        );
      } catch {
        // audit log optional
      }
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating team member:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== "OWNER") {
      return NextResponse.json({ error: "Seul le propriétaire peut supprimer du staff" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "userId est requis" }, { status: 400 });
    }

    const pool = getAuthPool();

    const target = await pool.query(`SELECT "role" FROM "User" WHERE "id" = $1`, [userId]);
    if (target.rows.length === 0) {
      return NextResponse.json({ error: "Utilisateur non trouvé" }, { status: 404 });
    }
    if (target.rows[0].role === "OWNER") {
      return NextResponse.json({ error: "Impossible de supprimer le propriétaire" }, { status: 403 });
    }

    await pool.query(`DELETE FROM "User" WHERE "id" = $1`, [userId]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting team member:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
