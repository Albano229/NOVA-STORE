import { Pool } from "pg";

let authPool: Pool | null = null;

export function getAuthPool(): Pool {
  if (!authPool) {
    const url = process.env.DATABASE_URL || "";
    const parsed = new URL(url);
    console.log("[AUTH-POOL] Creating pool, host:", parsed.hostname, "port:", parsed.port);
    authPool = new Pool({
      host: parsed.hostname,
      port: Number(parsed.port) || 5432,
      database: parsed.pathname.replace("/", ""),
      user: parsed.username,
      password: parsed.password,
      ssl: { rejectUnauthorized: false },
      max: 2,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
    authPool.on("error", (err) => {
      console.error("[AUTH-POOL] Pool error:", err.message);
    });
  }
  return authPool;
}
