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
      `SELECT s."id", s."name", s."slug"
       FROM "Shop" s
       WHERE s."userId" = $1
       ORDER BY s."createdAt" ASC
       LIMIT 1`,
      [session.user.id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ success: true, shop: result.rows[0] });
  } catch (error) {
    console.error("Error fetching default shop:", error);
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
    const { shopId } = body;

    if (!shopId) {
      return NextResponse.json({ error: "shopId requis" }, { status: 400 });
    }

    const result = await pool.query(
      `SELECT "id", "name", "slug" FROM "Shop" WHERE "id" = $1 AND "userId" = $2`,
      [shopId, session.user.id]
    );

    const shop = result.rows[0];
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    return NextResponse.json({ success: true, shop });
  } catch (error) {
    console.error("Error setting default shop:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
