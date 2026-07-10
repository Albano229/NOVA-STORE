import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { slug } = await params;
    const pool = getAuthPool();

    const shopResult = await pool.query(`SELECT id FROM "Shop" WHERE slug = $1`, [slug]);
    if (shopResult.rows.length === 0) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    const shopId = shopResult.rows[0].id;

    const existing = await pool.query(
      `SELECT 1 FROM "ShopFollow" WHERE "userId" = $1 AND "shopId" = $2`,
      [session.user.id, shopId]
    );

    if (existing.rows.length > 0) {
      return NextResponse.json({ message: "Déjà suivi" }, { status: 200 });
    }

    await pool.query(
      `INSERT INTO "ShopFollow" ("userId", "shopId") VALUES ($1, $2)`,
      [session.user.id, shopId]
    );

    return NextResponse.json({ message: "Boutique suivie" }, { status: 201 });
  } catch (error) {
    console.error("Error following shop:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ slug: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { slug } = await params;
    const pool = getAuthPool();

    const shopResult = await pool.query(`SELECT id FROM "Shop" WHERE slug = $1`, [slug]);
    if (shopResult.rows.length === 0) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    const shopId = shopResult.rows[0].id;

    const existing = await pool.query(
      `SELECT 1 FROM "ShopFollow" WHERE "userId" = $1 AND "shopId" = $2`,
      [session.user.id, shopId]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ message: "Non suivi" }, { status: 200 });
    }

    await pool.query(
      `DELETE FROM "ShopFollow" WHERE "userId" = $1 AND "shopId" = $2`,
      [session.user.id, shopId]
    );

    return NextResponse.json({ message: "Suivi retiré" }, { status: 200 });
  } catch (error) {
    console.error("Error unfollowing shop:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
