import { NextResponse } from "next/server";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  try {
    const pool = getAuthPool();
    const result = await pool.query(
      `SELECT id, name, slug, image, icon, "productType", "parentId"
       FROM "Category"
       WHERE "isActive" = true
       ORDER BY name ASC`
    );

    const all = result.rows;
    const parents = all.filter((c) => !c.parentId);
    const childrenMap = new Map<string, any[]>();
    for (const c of all) {
      if (c.parentId) {
        if (!childrenMap.has(c.parentId)) childrenMap.set(c.parentId, []);
        childrenMap.get(c.parentId)!.push({ id: c.id, name: c.name, slug: c.slug });
      }
    }

    const hierarchical = parents.map((p) => ({
      ...p,
      subcategories: childrenMap.get(p.id) || [],
    }));

    return NextResponse.json(hierarchical);
  } catch (error) {
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
