import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();

    const result = await pool.query(
      `SELECT s.*,
              json_build_object('products', (SELECT COUNT(*)::int FROM "Product" p WHERE p."shopId" = s."id")) AS "_count",
              (SELECT COUNT(*)::int FROM "Order" o WHERE o."shopId" = s."id") AS "ordersCount",
              COALESCE(
                (SELECT SUM(o."total") FROM "Order" o WHERE o."shopId" = s."id" AND o."paymentStatus" = 'COMPLETED'), 0
              ) AS "revenue"
       FROM "Shop" s
       WHERE s."userId" = $1
       ORDER BY s."createdAt" DESC`,
      [session.user.id]
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching vendor shops:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const body = await req.json();
    const { name, description, phone, email, address, city } = body;

    if (!name) {
      return NextResponse.json({ error: "Le nom est requis" }, { status: 400 });
    }

    const baseSlug = name
      .toLowerCase()
      .normalize("NFD")
      .replace(/[\u0300-\u036f]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");

    let slug = baseSlug;
    let counter = 1;
    let slugExists = true;

    while (slugExists) {
      const check = await pool.query(`SELECT "id" FROM "Shop" WHERE "slug" = $1 LIMIT 1`, [slug]);
      if (check.rows.length === 0) {
        slugExists = false;
      } else {
        slug = `${baseSlug}-${counter}`;
        counter++;
      }
    }

    const result = await pool.query(
      `INSERT INTO "Shop" ("id", "userId", "name", "slug", "description", "phone", "email", "address", "city", "isActive", "isVerified", "commissionRate", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, true, false, 5.0, NOW(), NOW())
       RETURNING *`,
      [session.user.id, name, slug, description || null, phone || null, email || null, address || null, city || null]
    );

    const shop = result.rows[0];

    await pool.query(
      `INSERT INTO "Wallet" ("id", "shopId", "balance", "pendingBalance", "currency", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, 0, 0, 'XOF', NOW(), NOW())`,
      [shop.id]
    );

    return NextResponse.json(
      { ...shop, _count: { products: 0 }, ordersCount: 0, revenue: 0 },
      { status: 201 }
    );
  } catch (error) {
    console.error("Error creating shop:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
