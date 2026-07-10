import { Pool } from "pg";

export async function getVendorShop(
  pool: Pool,
  userId: string,
  shopId?: string
) {
  if (shopId) {
    const result = await pool.query(
      `SELECT * FROM "Shop" WHERE "id" = $1 AND "userId" = $2 LIMIT 1`,
      [shopId, userId]
    );
    return result.rows[0] || null;
  }

  const result = await pool.query(
    `SELECT * FROM "Shop" WHERE "userId" = $1 ORDER BY "createdAt" ASC LIMIT 1`,
    [userId]
  );
  return result.rows[0] || null;
}
