import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

const AUTOMATION_DEFAULTS = [
  { key: "email_confirmation", title: "Email de confirmation", description: "Envoyer automatiquement un email de confirmation au client après chaque commande.", enabled: true },
  { key: "abandoned_cart", title: "Relance panier abandonné", description: "Envoyer un email de relance 24h après qu'un client ait abandonné son panier.", enabled: false },
  { key: "new_order_notification", title: "Notification nouvelle commande", description: "Recevoir une notification push et par email dès qu'une nouvelle commande est passée.", enabled: true },
  { key: "weekly_report", title: "Rapport hebdomadaire", description: "Recevoir un résumé chaque semaine avec les ventes, revenus et statistiques de votre boutique.", enabled: false },
];

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) {
      return NextResponse.json(AUTOMATION_DEFAULTS, { status: 200 });
    }

    const savedResult = await pool.query(
      `SELECT * FROM "SiteSettings" WHERE "key" = $1 LIMIT 1`,
      [`automations_${shop.id}`]
    );

    let automations = AUTOMATION_DEFAULTS;
    if (savedResult.rows.length > 0) {
      try {
        const parsed = JSON.parse(savedResult.rows[0].value || "[]");
        automations = AUTOMATION_DEFAULTS.map((def) => {
          const found = parsed.find((s: any) => s.key === def.key);
          return { ...def, enabled: found?.enabled ?? def.enabled };
        });
      } catch {}
    }

    return NextResponse.json(automations);
  } catch (error) {
    console.error("Error fetching automations:", error);
    return NextResponse.json(AUTOMATION_DEFAULTS, { status: 200 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) {
      return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });
    }

    const body = await req.json();
    const { automations } = body;

    if (!Array.isArray(automations)) {
      return NextResponse.json({ error: "Format invalide" }, { status: 400 });
    }

    const key = `automations_${shop.id}`;
    const value = JSON.stringify(automations);

    const existingResult = await pool.query(
      `SELECT "key" FROM "SiteSettings" WHERE "key" = $1`,
      [key]
    );

    if (existingResult.rows.length > 0) {
      await pool.query(
        `UPDATE "SiteSettings" SET "value" = $1 WHERE "key" = $2`,
        [value, key]
      );
    } else {
      await pool.query(
        `INSERT INTO "SiteSettings" ("id", "key", "value") VALUES (gen_random_uuid(), $1, $2)`,
        [key, value]
      );
    }

    return NextResponse.json({ message: "Automatisations sauvegardées" });
  } catch (error) {
    console.error("Error saving automations:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
