import pg from 'pg';
const pool = new pg.Pool({
  connectionString: 'postgresql://postgres.weehcolbvkqqlzmlqcgc:ZgOeSsmSayKMeqqf@aws-0-eu-central-1.pooler.supabase.com:5432/postgres'
});
try {
  await pool.query(`
    ALTER TABLE "Product"
    ADD COLUMN IF NOT EXISTS "seoKeywords" TEXT,
    ADD COLUMN IF NOT EXISTS "brand" TEXT,
    ADD COLUMN IF NOT EXISTS "dimensions" TEXT,
    ADD COLUMN IF NOT EXISTS "ctaText" TEXT,
    ADD COLUMN IF NOT EXISTS "ctaColor" TEXT,
    ADD COLUMN IF NOT EXISTS "postPurchaseInstructions" TEXT,
    ADD COLUMN IF NOT EXISTS "warranty" TEXT,
    ADD COLUMN IF NOT EXISTS "returnPolicy" TEXT,
    ADD COLUMN IF NOT EXISTS "metadata" JSONB;
  `);
  console.log('Migration complete!');
} catch (e) {
  console.error('Migration error:', e.message);
} finally {
  await pool.end();
}
