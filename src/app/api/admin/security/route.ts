import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "all";
  const pool = getAuthPool();

  try {
    if (type === "sessions") {
      const result = await pool.query(
        `SELECT 
          s.id as "sessionId",
          s."sessionToken",
          s.expires,
          s."userId",
          u.name as "userName",
          u.email as "userEmail",
          u.role as "role",
          al."ipAddress" as "ipAddress",
          al."createdAt" as "lastActivity"
        FROM "Session" s
        LEFT JOIN "User" u ON u.id = s."userId"
        LEFT JOIN "AuditLog" al ON al."userId" = s."userId"
          AND al."action" IN ('LOGIN', 'LOGIN_FAILED')
        WHERE s.expires > NOW()
        ORDER BY al."createdAt" DESC NULLS LAST
        LIMIT 100`
      );

      const seen = new Set<string>();
      const sessions = result.rows.filter((row: any) => {
        if (seen.has(row.userId)) return false;
        seen.add(row.userId);
        return true;
      });

      return NextResponse.json({ activeSessions: sessions });
    }

    if (type === "logins") {
      const result = await pool.query(
        `SELECT 
          al."userId",
          u.name as "userName",
          u.email,
          al.action,
          al."ipAddress",
          al."createdAt"
        FROM "AuditLog" al
        LEFT JOIN "User" u ON u.id = al."userId"
        WHERE al.action IN ('LOGIN', 'LOGIN_FAILED', 'LOGOUT', 'REGISTER')
        ORDER BY al."createdAt" DESC
        LIMIT 200`
      );

      return NextResponse.json({ loginHistory: result.rows });
    }

    if (type === "failed") {
      const result = await pool.query(
        `SELECT 
          al.metadata->>'email' as "email",
          COUNT(*)::int as "attempts",
          MAX(al."createdAt") as "lastAttempt"
        FROM "AuditLog" al
        WHERE al.action = 'LOGIN_FAILED'
          AND al."createdAt" > NOW() - INTERVAL '24 hours'
        GROUP BY al.metadata->>'email'
        HAVING COUNT(*) >= 1
        ORDER BY COUNT(*) DESC`
      );

      return NextResponse.json({ failedAttempts: result.rows });
    }

    const [sessionsRes, todayLoginsRes, failedRes, blockedRes] = await Promise.all([
      pool.query(
        `SELECT COUNT(DISTINCT s."userId")::int as "count"
         FROM "Session" s
         WHERE s.expires > NOW()`
      ),
      pool.query(
        `SELECT COUNT(*)::int as "count"
         FROM "AuditLog"
         WHERE action = 'LOGIN'
           AND "createdAt" > NOW() - INTERVAL '24 hours'`
      ),
      pool.query(
        `SELECT COUNT(*)::int as "count"
         FROM "AuditLog"
         WHERE action = 'LOGIN_FAILED'
           AND "createdAt" > NOW() - INTERVAL '24 hours'`
      ),
      pool.query(
        `SELECT COUNT(DISTINCT metadata->>'ip')::int as "count"
         FROM "AuditLog"
         WHERE action = 'IP_BLOCKED'
           AND "createdAt" > NOW() - INTERVAL '7 days'`
      ),
    ]);

    return NextResponse.json({
      stats: {
        activeSessions: sessionsRes.rows[0]?.count || 0,
        todayLogins: todayLoginsRes.rows[0]?.count || 0,
        failedLogins: failedRes.rows[0]?.count || 0,
        blockedIPs: blockedRes.rows[0]?.count || 0,
      },
    });
  } catch (error: any) {
    console.error("[SECURITY-API]", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "OWNER") {
    return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
  }

  const body = await req.json();
  const pool = getAuthPool();

  try {
    if (body.action === "disconnect_user") {
      await pool.query(`DELETE FROM "Session" WHERE "userId" = $1`, [body.userId]);
      return NextResponse.json({ success: true });
    }

    if (body.action === "disconnect_all") {
      const result = await pool.query(`DELETE FROM "Session" WHERE "userId" != $1`, [session.user.id]);
      return NextResponse.json({ success: true, disconnected: result.rowCount });
    }

    if (body.action === "block_ip") {
      await pool.query(
        `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", metadata, "createdAt")
         VALUES ($1, 'IP_BLOCKED', 'IP', $2, $3, NOW())`,
        [session.user.id, body.ip, JSON.stringify({ ip: body.ip, reason: body.reason || "" })]
      );
      return NextResponse.json({ success: true });
    }

    if (body.action === "reset_sessions") {
      const result = await pool.query(`DELETE FROM "Session" WHERE "expires" < NOW() OR "userId" != $1`, [session.user.id]);
      return NextResponse.json({ success: true, cleared: result.rowCount });
    }

    if (body.action === "clear_audit_logs") {
      if (session.user.role !== "OWNER") {
        return NextResponse.json({ error: "Réservé au OWNER" }, { status: 403 });
      }
      const result = await pool.query(`DELETE FROM "AuditLog" WHERE "createdAt" < NOW() - INTERVAL '30 days'`);
      return NextResponse.json({ success: true, deleted: result.rowCount });
    }

    if (body.action === "block_email") {
      await pool.query(
        `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", metadata, "createdAt")
         VALUES ($1, 'EMAIL_BLOCKED', 'USER', $2, $3, NOW())`,
        [session.user.id, body.email, JSON.stringify({ email: body.email, reason: body.reason || "" })]
      );
      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Action inconnue" }, { status: 400 });
  } catch (error: any) {
    console.error("[SECURITY-API]", error.message);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
