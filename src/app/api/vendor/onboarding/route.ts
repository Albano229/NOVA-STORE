import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const body = await req.json();
    const {
      shopName,
      shopDescription,
      logo,
      banner,
      phone,
      email,
      address,
      city,
      country,
      storeType,
      primaryColor,
      secondaryColor,
      theme,
    } = body;

    if (!shopName || shopName.length < 2) {
      return NextResponse.json(
        { error: "Le nom de la boutique est requis (2 caractères min.)" },
        { status: 400 }
      );
    }

    const baseSlug = shopName
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

    const shopResult = await pool.query(
      `INSERT INTO "Shop" ("id", "userId", "name", "slug", "description", "logo", "banner", "phone", "email", "address", "city", "country", "storeType", "commissionRate", "isActive", "isVerified", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, 5.0, true, false, NOW(), NOW())
       RETURNING *`,
      [
        session.user.id,
        shopName,
        slug,
        shopDescription || null,
        logo || null,
        banner || null,
        phone || null,
        email || null,
        address || null,
        city || null,
        country || "Bénin",
        storeType || "PHYSICAL",
      ]
    );

    const shop = shopResult.rows[0];

    await pool.query(
      `INSERT INTO "Wallet" ("id", "shopId", "balance", "pendingBalance", "currency", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, 0, 0, 'XOF', NOW(), NOW())`,
      [shop.id]
    );

    await pool.query(
      `INSERT INTO "StoreConfig" ("id", "shopId", "primaryColor", "secondaryColor", "theme", "createdAt", "updatedAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, NOW(), NOW())`,
      [
        shop.id,
        primaryColor || "#7126b6",
        secondaryColor || "#1e40af",
        theme || "moderne",
      ]
    );

    return NextResponse.json(shop, { status: 201 });
  } catch (error) {
    console.error("Error during onboarding:", error);
    return NextResponse.json(
      {
        error: "Erreur lors de la création de la boutique",
        details: error instanceof Error ? error.message : "Erreur inconnue",
      },
      { status: 500 }
    );
  }
}
