import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

function parseTicket(row: any) {
  const meta = row.metadata || {};
  return {
    id: row.id,
    subject: meta.subject || "Sans sujet",
    message: meta.message || "",
    priority: meta.priority || "medium",
    status: meta.status || "open",
    userId: meta.userId || row.userId,
    userName: meta.userName || "",
    userEmail: meta.userEmail || "",
    userRole: meta.userRole || "CLIENT",
    assignedTo: meta.assignedTo || null,
    category: meta.category || "other",
    responses: meta.responses || [],
    createdAt: row.createdAt,
    updatedAt: meta.updatedAt || row.createdAt,
  };
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const priority = searchParams.get("priority") || "all";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "50");

    const pool = getAuthPool();

    const result = await pool.query(
      `SELECT al.*, u.name AS "userName", u.email AS "userEmail", u.role AS "userRole"
       FROM "AuditLog" al
       LEFT JOIN "User" u ON u.id = al."userId"
       WHERE al."entityType" = 'SUPPORT_TICKET' AND al.action IN ('SUPPORT_TICKET_CREATE', 'SUPPORT_TICKET_UPDATE', 'SUPPORT_TICKET_REPLY')
       ORDER BY al."createdAt" DESC
       LIMIT 500`,
      []
    );

    const ticketMap = new Map<string, any>();

    for (const row of result.rows) {
      const ticket = parseTicket(row);
      const meta = row.metadata || {};

      if (row.action === "SUPPORT_TICKET_CREATE" || !ticketMap.has(ticket.id)) {
        ticketMap.set(ticket.id, ticket);
      }

      if (row.action === "SUPPORT_TICKET_UPDATE") {
        const existing = ticketMap.get(ticket.id);
        if (existing) {
          if (meta.status) existing.status = meta.status;
          if (meta.assignedTo !== undefined) existing.assignedTo = meta.assignedTo;
          if (meta.priority) existing.priority = meta.priority;
          existing.updatedAt = row.createdAt;
        }
      }

      if (row.action === "SUPPORT_TICKET_REPLY") {
        const existing = ticketMap.get(ticket.id);
        if (existing) {
          existing.responses = [
            ...existing.responses,
            {
              id: row.id,
              author: meta.replyAuthor || "Admin",
              authorRole: meta.replyAuthorRole || "ADMIN",
              content: meta.replyContent || "",
              createdAt: row.createdAt,
            },
          ];
          existing.updatedAt = row.createdAt;
        }
      }
    }

    let tickets = Array.from(ticketMap.values());

    if (status !== "all") {
      tickets = tickets.filter((t) => t.status === status);
    }
    if (priority !== "all") {
      tickets = tickets.filter((t) => t.priority === priority);
    }
    if (search) {
      const q = search.toLowerCase();
      tickets = tickets.filter(
        (t) =>
          t.subject.toLowerCase().includes(q) ||
          t.message.toLowerCase().includes(q) ||
          t.userName.toLowerCase().includes(q) ||
          t.userEmail.toLowerCase().includes(q)
      );
    }

    const total = tickets.length;
    const offset = (page - 1) * limit;
    const paginatedTickets = tickets.slice(offset, offset + limit);

    const allTickets = Array.from(ticketMap.values());
    const stats = {
      total: allTickets.length,
      open: allTickets.filter((t) => t.status === "open").length,
      pending: allTickets.filter((t) => t.status === "pending").length,
      resolved: allTickets.filter((t) => t.status === "resolved").length,
      urgent: allTickets.filter((t) => t.priority === "urgent").length,
      high: allTickets.filter((t) => t.priority === "high").length,
      medium: allTickets.filter((t) => t.priority === "medium").length,
      low: allTickets.filter((t) => t.priority === "low").length,
    };

    return NextResponse.json({ tickets: paginatedTickets, stats, total, page, limit });
  } catch (error) {
    console.error("Error fetching support tickets:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { subject, message, priority, userId, category } = body;

    if (!subject || !message) {
      return NextResponse.json({ error: "Sujet et message requis" }, { status: 400 });
    }

    const pool = getAuthPool();
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;

    let userName = "";
    let userEmail = "";
    let userRole = "CLIENT";

    if (userId) {
      const userResult = await pool.query(`SELECT name, email, role FROM "User" WHERE id = $1`, [userId]);
      if (userResult.rows.length > 0) {
        userName = userResult.rows[0].name || "";
        userEmail = userResult.rows[0].email;
        userRole = userResult.rows[0].role;
      }
    } else {
      userName = session.user.name || session.user.email || "";
      userEmail = session.user.email || "";
      userRole = session.user.role || "ADMIN";
    }

    const metadata = {
      subject,
      message,
      priority: priority || "medium",
      category: category || "other",
      status: "open",
      userId: userId || session.user.id,
      userName,
      userEmail,
      userRole,
      assignedTo: null,
      responses: [],
      updatedAt: new Date().toISOString(),
    };

    await pool.query(
      `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", metadata, "createdAt")
       VALUES ($1, 'SUPPORT_TICKET_CREATE', 'SUPPORT_TICKET', $2, $3, NOW())`,
      [session.user.id, ticketId, JSON.stringify(metadata)]
    );

    return NextResponse.json({ success: true, ticketId }, { status: 201 });
  } catch (error) {
    console.error("Error creating support ticket:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user.role !== "ADMIN" && session.user.role !== "OWNER")) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { ticketId, status, assignedTo, priority, replyContent } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId requis" }, { status: 400 });
    }

    const pool = getAuthPool();

    if (replyContent) {
      const metadata = {
        ticketId,
        replyAuthor: session.user.name || session.user.email,
        replyAuthorRole: session.user.role,
        replyContent,
      };

      await pool.query(
        `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", metadata, "createdAt")
         VALUES ($1, 'SUPPORT_TICKET_REPLY', 'SUPPORT_TICKET', $2, $3, NOW())`,
        [session.user.id, ticketId, JSON.stringify(metadata)]
      );

      return NextResponse.json({ success: true });
    }

    const metadata: Record<string, any> = { ticketId, updatedAt: new Date().toISOString() };
    if (status) metadata.status = status;
    if (assignedTo !== undefined) metadata.assignedTo = assignedTo;
    if (priority) metadata.priority = priority;

    await pool.query(
      `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", metadata, "createdAt")
       VALUES ($1, 'SUPPORT_TICKET_UPDATE', 'SUPPORT_TICKET', $2, $3, NOW())`,
      [session.user.id, ticketId, JSON.stringify(metadata)]
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating support ticket:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
