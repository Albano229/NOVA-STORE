import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

function escapeCSV(value: string | number | null | undefined): string {
  if (value === null || value === undefined) return "";
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR", "OWNER", "ADMIN", "MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const result = await pool.query(
      `SELECT p.*, c."name" AS "categoryName"
       FROM "Product" p
       LEFT JOIN "Category" c ON c."id" = p."categoryId"
       WHERE p."shopId" = $1
       ORDER BY p."createdAt" DESC`,
      [shop.id]
    );

    const headers = [
      "name", "description", "price", "comparePrice", "discountPercent",
      "stock", "sku", "category", "productType", "brand", "weight",
      "isActive", "isFeatured", "isHidden", "slug",
    ];

    const rows = result.rows.map((p: any) =>
      headers.map((h) => {
        if (h === "category") return escapeCSV(p.categoryName);
        if (h === "isActive" || h === "isFeatured" || h === "isHidden") return p[h] ? "oui" : "non";
        return escapeCSV(p[h]);
      }).join(",")
    );

    const csv = [headers.join(","), ...rows].join("\n");

    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="produits-${shop.id.slice(0, 8)}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
