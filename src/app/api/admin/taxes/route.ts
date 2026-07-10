import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

interface TaxRule {
  id: string;
  name: string;
  country: string;
  rate: number;
  active: boolean;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const result = await pool.query(
      `SELECT value FROM "SiteSettings" WHERE key = 'taxRules'`
    );

    let taxRules: TaxRule[] = [];
    if (result.rows.length > 0) {
      try {
        taxRules = JSON.parse(result.rows[0].value);
      } catch {
        taxRules = [];
      }
    }

    const defaultResult = await pool.query(
      `SELECT value FROM "SiteSettings" WHERE key = 'defaultTaxRate'`
    );
    const defaultTaxRate = defaultResult.rows.length > 0 ? parseFloat(defaultResult.rows[0].value) || 0 : 0;

    return NextResponse.json({ taxRules, defaultTaxRate });
  } catch (error) {
    console.error("Error fetching tax rules:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { taxRules, defaultTaxRate } = body;
    const pool = getAuthPool();

    if (taxRules !== undefined) {
      await pool.query(
        `INSERT INTO "SiteSettings" (id, key, value) VALUES ($1, 'taxRules', $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        ["setting_taxRules", JSON.stringify(taxRules)]
      );
    }

    if (defaultTaxRate !== undefined) {
      await pool.query(
        `INSERT INTO "SiteSettings" (id, key, value) VALUES ($1, 'defaultTaxRate', $2)
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
        ["setting_defaultTaxRate", String(defaultTaxRate)]
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error saving tax rules:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
