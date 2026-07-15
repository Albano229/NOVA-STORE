import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

function parseCSVLine(line: string): string[] {
  const result: string[] = [];
  let current = "";
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (inQuotes) {
      if (char === '"') {
        if (i + 1 < line.length && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ",") {
        result.push(current.trim());
        current = "";
      } else {
        current += char;
      }
    }
  }
  result.push(current.trim());
  return result;
}

function parseCSV(text: string): { headers: string[]; rows: string[][] } {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return { headers: [], rows: [] };
  const headers = parseCSVLine(lines[0]).map((h) => h.toLowerCase().replace(/\s+/g, ""));
  const rows = lines.slice(1).map((l) => parseCSVLine(l));
  return { headers, rows };
}

function slugify(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR", "OWNER", "ADMIN", "MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const formData = await req.formData();
    const file = formData.get("file") as File;
    if (!file) return NextResponse.json({ error: "Fichier requis" }, { status: 400 });

    const text = await file.text();
    const { headers, rows } = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "Fichier CSV vide" }, { status: 400 });
    }

    const fieldMap: Record<string, string> = {
      name: "name",
      nom: "name",
      productname: "name",
      description: "description",
      desc: "description",
      prix: "price",
      price: "price",
      compareprice: "comparePrice",
      compare_prix: "comparePrice",
      stock: "stock",
      quantite: "stock",
      sku: "sku",
      reference: "sku",
      category: "category",
      categorie: "category",
      producttype: "productType",
      type: "productType",
      brand: "brand",
      marque: "brand",
      weight: "weight",
      poids: "weight",
      isactive: "isActive",
      actif: "isActive",
      isfeatured: "isFeatured",
      vedette: "isFeatured",
      ishidden: "isHidden",
      cache: "isHidden",
      slug: "slug",
      remise: "discountPercent",
      discountpercent: "discountPercent",
    };

    const normalizedHeaders = headers.map((h) => fieldMap[h] || h);

    const catResult = await pool.query(`SELECT id, name, slug FROM "Category"`);
    const categories = catResult.rows;

    let created = 0;
    let skipped = 0;
    const errors: string[] = [];

    for (let i = 0; i < rows.length; i++) {
      const row = rows[i];
      const values: Record<string, string> = {};
      normalizedHeaders.forEach((h, idx) => {
        values[h] = row[idx] || "";
      });

      const name = values.name?.trim();
      if (!name) {
        skipped++;
        errors.push(`Ligne ${i + 2}: nom manquant`);
        continue;
      }

      const price = parseFloat(values.price) || 0;
      if (price <= 0) {
        skipped++;
        errors.push(`Ligne ${i + 2}: prix invalide pour "${name}"`);
        continue;
      }

      let categoryId = null;
      if (values.category) {
        const cat = categories.find(
          (c) => c.name.toLowerCase() === values.category.toLowerCase() || c.slug === values.category.toLowerCase()
        );
        if (cat) categoryId = cat.id;
      }

      const slug = values.slug || slugify(name);
      const existingSlug = await pool.query(`SELECT id FROM "Product" WHERE "slug" = $1`, [slug]);
      const finalSlug = existingSlug.rows.length > 0 ? `${slug}-${Date.now()}` : slug;

      const productType = ["PHYSICAL", "DIGITAL", "SERVICE", "BUNDLE", "COMMUNITY", "BOOKING"].includes(values.productType?.toUpperCase())
        ? values.productType.toUpperCase()
        : "PHYSICAL";

      await pool.query(
        `INSERT INTO "Product" ("id", "shopId", "name", "slug", "description", "productType", "price", "comparePrice", "discountPercent", "sku", "stock", "weight", "categoryId", "isActive", "isFeatured", "isHidden", "status", "createdAt", "updatedAt")
         VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, 'published', NOW(), NOW())`,
        [
          shop.id,
          name,
          finalSlug,
          values.description || null,
          productType,
          price,
          values.comparePrice ? parseFloat(values.comparePrice) : null,
          values.discountPercent ? parseFloat(values.discountPercent) : null,
          values.sku || null,
          parseInt(values.stock) || 0,
          values.weight ? parseFloat(values.weight) : null,
          categoryId,
          values.isActive !== "non",
          values.isFeatured === "oui",
          values.isHidden === "oui",
        ]
      );

      created++;
    }

    return NextResponse.json({
      success: true,
      created,
      skipped,
      errors: errors.slice(0, 20),
      total: rows.length,
    });
  } catch (error) {
    console.error("Import error:", error);
    return NextResponse.json({ error: "Erreur lors de l'import" }, { status: 500 });
  }
}
