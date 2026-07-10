import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const pool = getAuthPool();
  const result = await pool.query(`SELECT key, value FROM "PlatformConfig"`);
  const configMap: Record<string, any> = {};
  result.rows.forEach((c) => { configMap[c.key] = c.value; });

  return NextResponse.json(configMap);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const pool = getAuthPool();

  for (const [key, value] of Object.entries(body)) {
    await pool.query(
      `INSERT INTO "PlatformConfig" (key, value) VALUES ($1, $2::jsonb)
       ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
      [key, JSON.stringify(value)]
    );
  }

  await pool.query(
    `INSERT INTO "AuditLog" ("userId", action, "entityType", afterState, "createdAt")
     VALUES ($1, $2, $3, $4, NOW())`,
    [session.user.id, "PLATFORM_CONFIG_UPDATE", "PlatformConfig", JSON.stringify(body)]
  );

  return NextResponse.json({ success: true });
}
