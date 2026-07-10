import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

interface TicketInput {
  subject: string;
  description: string;
  category: "technique" | "paiement" | "boutique" | "produit" | "compte" | "autre";
  priority: "low" | "medium" | "high" | "urgent";
  userId?: string;
}

function autoAssign(category: string): { assignedTo: string | null; assignedName: string | null } {
  switch (category) {
    case "technique":
      return { assignedTo: "admin", assignedName: "Administrateur" };
    case "contenu":
    case "produit":
    case "boutique":
      return { assignedTo: "moderator", assignedName: "Modérateur" };
    case "paiement":
    case "litige":
      return { assignedTo: "owner", assignedName: "Propriétaire" };
    default:
      return { assignedTo: "admin", assignedName: "Administrateur" };
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || "all";
    const priority = searchParams.get("priority") || "all";
    const category = searchParams.get("category") || "all";
    const search = searchParams.get("search") || "";
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "20");

    const settingsResult = await pool.query(
      `SELECT value FROM "SiteSettings" WHERE key = 'support_tickets'`
    );

    let tickets: any[] = [];
    if (settingsResult.rows.length > 0 && settingsResult.rows[0].value) {
      tickets = JSON.parse(settingsResult.rows[0].value);
    }

    const userRole = session.user.role;
    const userId = session.user.id;

    if (userRole !== "ADMIN" && userRole !== "OWNER" && userRole !== "MODERATOR") {
      tickets = tickets.filter((t: any) => t.userId === userId);
    }

    if (status !== "all") {
      tickets = tickets.filter((t: any) => t.status === status);
    }
    if (priority !== "all") {
      tickets = tickets.filter((t: any) => t.priority === priority);
    }
    if (category !== "all") {
      tickets = tickets.filter((t: any) => t.category === category);
    }
    if (search) {
      const q = search.toLowerCase();
      tickets = tickets.filter(
        (t: any) =>
          t.subject.toLowerCase().includes(q) ||
          t.description.toLowerCase().includes(q) ||
          t.userName.toLowerCase().includes(q) ||
          t.userEmail.toLowerCase().includes(q)
      );
    }

    tickets.sort((a: any, b: any) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    const total = tickets.length;
    const offset = (page - 1) * limit;
    const paginatedTickets = tickets.slice(offset, offset + limit);

    const allFiltered = status === "all" && priority === "all" && category === "all" && !search
      ? tickets
      : (() => {
          let all = [...tickets];
          if (userRole !== "ADMIN" && userRole !== "OWNER" && userRole !== "MODERATOR") {
            all = all.filter((t: any) => t.userId === userId);
          }
          return all;
        })();

    const stats = {
      total: allFiltered.length,
      open: allFiltered.filter((t: any) => t.status === "open").length,
      pending: allFiltered.filter((t: any) => t.status === "pending").length,
      resolved: allFiltered.filter((t: any) => t.status === "resolved").length,
      closed: allFiltered.filter((t: any) => t.status === "closed").length,
      urgent: allFiltered.filter((t: any) => t.priority === "urgent").length,
      high: allFiltered.filter((t: any) => t.priority === "high").length,
      medium: allFiltered.filter((t: any) => t.priority === "medium").length,
      low: allFiltered.filter((t: any) => t.priority === "low").length,
    };

    return NextResponse.json({
      tickets: paginatedTickets,
      stats,
      pagination: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error("[Support Tickets] Error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    const body: TicketInput = await req.json();
    const { subject, description, category, priority, userId: bodyUserId } = body;

    if (!subject || !description || !category) {
      return NextResponse.json(
        { error: "Sujet, description et catégorie requis" },
        { status: 400 }
      );
    }

    const pool = getAuthPool();
    const userId = bodyUserId || session?.user?.id;
    if (!userId) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    let userName = "Utilisateur";
    let userEmail = "";

    const userResult = await pool.query(
      `SELECT name, email FROM "User" WHERE id = $1`,
      [userId]
    );
    if (userResult.rows.length > 0) {
      userName = userResult.rows[0].name || "Utilisateur";
      userEmail = userResult.rows[0].email;
    }

    const { assignedTo, assignedName } = autoAssign(category);
    const ticketId = `ticket_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
    const now = new Date().toISOString();

    const newTicket = {
      id: ticketId,
      subject,
      description,
      category,
      priority: priority || "medium",
      status: "open",
      userId,
      userName,
      userEmail,
      assignedTo,
      assignedName,
      createdAt: now,
      updatedAt: now,
      messages: [
        {
          senderId: userId,
          senderRole: "user",
          content: description,
          contentType: "text",
          createdAt: now,
        },
      ],
    };

    const settingsResult = await pool.query(
      `SELECT value FROM "SiteSettings" WHERE key = 'support_tickets'`
    );

    let tickets: any[] = [];
    if (settingsResult.rows.length > 0 && settingsResult.rows[0].value) {
      tickets = JSON.parse(settingsResult.rows[0].value);
    }
    tickets.push(newTicket);

    if (settingsResult.rows.length > 0) {
      await pool.query(
        `UPDATE "SiteSettings" SET value = $1 WHERE key = 'support_tickets'`,
        [JSON.stringify(tickets)]
      );
    } else {
      await pool.query(
        `INSERT INTO "SiteSettings" (key, value) VALUES ('support_tickets', $1)`,
        [JSON.stringify(tickets)]
      );
    }

    await pool.query(
      `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", metadata, "createdAt")
       VALUES ($1, 'SUPPORT_TICKET_CREATE', 'SUPPORT_TICKET', $2, $3, NOW())`,
      [
        userId,
        ticketId,
        JSON.stringify({
          subject,
          description,
          category,
          priority: priority || "medium",
          status: "open",
          userId,
          userName,
          userEmail,
          assignedTo,
        }),
      ]
    );

    await pool.query(
      `INSERT INTO "ChatMessage" ("ticketId", "senderId", "senderRole", content, "contentType", metadata, "createdAt")
       VALUES ($1, $2, 'user', $3, 'text', $4, NOW())`,
      [
        ticketId,
        userId,
        description,
        JSON.stringify({ category, priority: priority || "medium" }),
      ]
    );

    return NextResponse.json({
      success: true,
      ticket: newTicket,
    }, { status: 201 });
  } catch (error) {
    console.error("[Support Tickets] Error creating ticket:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const userRole = session.user.role;
    if (userRole !== "ADMIN" && userRole !== "OWNER" && userRole !== "MODERATOR") {
      return NextResponse.json({ error: "Non autorisé — rôle insuffisant" }, { status: 403 });
    }

    const body = await req.json();
    const { ticketId, status, assignedTo, priority, assignedName } = body;

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId requis" }, { status: 400 });
    }

    const pool = getAuthPool();

    const settingsResult = await pool.query(
      `SELECT value FROM "SiteSettings" WHERE key = 'support_tickets'`
    );

    let tickets: any[] = [];
    if (settingsResult.rows.length > 0 && settingsResult.rows[0].value) {
      tickets = JSON.parse(settingsResult.rows[0].value);
    }

    const ticketIndex = tickets.findIndex((t: any) => t.id === ticketId);
    if (ticketIndex === -1) {
      return NextResponse.json({ error: "Ticket non trouvé" }, { status: 404 });
    }

    const ticket = tickets[ticketIndex];
    const beforeState = { ...ticket };

    if (status) ticket.status = status;
    if (assignedTo !== undefined) ticket.assignedTo = assignedTo;
    if (assignedName !== undefined) ticket.assignedName = assignedName;
    if (priority) ticket.priority = priority;
    ticket.updatedAt = new Date().toISOString();

    tickets[ticketIndex] = ticket;

    await pool.query(
      `UPDATE "SiteSettings" SET value = $1 WHERE key = 'support_tickets'`,
      [JSON.stringify(tickets)]
    );

    const metadata: Record<string, any> = {
      ticketId,
      updatedAt: ticket.updatedAt,
    };
    if (status) metadata.status = status;
    if (assignedTo !== undefined) metadata.assignedTo = assignedTo;
    if (priority) metadata.priority = priority;
    metadata.beforeState = beforeState;

    await pool.query(
      `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", metadata, "createdAt")
       VALUES ($1, 'SUPPORT_TICKET_UPDATE', 'SUPPORT_TICKET', $2, $3, NOW())`,
      [session.user.id, ticketId, JSON.stringify(metadata)]
    );

    return NextResponse.json({ success: true, ticket });
  } catch (error) {
    console.error("[Support Tickets] Error updating ticket:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
