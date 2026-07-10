import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const ticketId = searchParams.get("ticketId");

    if (!ticketId) {
      return NextResponse.json({ error: "ticketId requis" }, { status: 400 });
    }

    const pool = getAuthPool();

    const settingsResult = await pool.query(
      `SELECT value FROM "SiteSettings" WHERE key = 'support_tickets'`
    );

    let ticket: any = null;
    if (settingsResult.rows.length > 0 && settingsResult.rows[0].value) {
      const tickets = JSON.parse(settingsResult.rows[0].value);
      ticket = tickets.find((t: any) => t.id === ticketId);
    }

    if (!ticket) {
      return NextResponse.json({ error: "Ticket non trouvé" }, { status: 404 });
    }

    const userRole = session.user.role;
    if (userRole !== "ADMIN" && userRole !== "OWNER" && userRole !== "MODERATOR" && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    const dbMessages = await pool.query(
      `SELECT cm.*, u.name AS "senderName"
       FROM "ChatMessage" cm
       LEFT JOIN "User" u ON u.id = cm."senderId"
       WHERE cm."ticketId" = $1
       ORDER BY cm."createdAt" ASC`,
      [ticketId]
    );

    const messages = dbMessages.rows.map((row: any) => ({
      id: row.id,
      ticketId: row.ticketId,
      senderId: row.senderId,
      senderName: row.senderName || "Inconnu",
      senderRole: row.senderRole,
      content: row.content,
      contentType: row.contentType,
      metadata: row.metadata,
      createdAt: row.createdAt,
    }));

    const settingsMessages = ticket.messages || [];
    const allMessages = [...messages, ...settingsMessages];

    const uniqueMessages = allMessages.reduce((acc: any[], msg: any) => {
      const exists = acc.find(
        (m) =>
          m.senderId === msg.senderId &&
          m.content === msg.content &&
          Math.abs(new Date(m.createdAt).getTime() - new Date(msg.createdAt).getTime()) < 1000
      );
      if (!exists) acc.push(msg);
      return acc;
    }, []);

    uniqueMessages.sort((a: any, b: any) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());

    return NextResponse.json({
      messages: uniqueMessages,
      ticket: {
        id: ticket.id,
        subject: ticket.subject,
        status: ticket.status,
        priority: ticket.priority,
        category: ticket.category,
      },
    });
  } catch (error) {
    console.error("[Support Messages] Error fetching messages:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const {
      ticketId,
      content,
      contentType,
      senderRole: bodySenderRole,
    } = body;

    if (!ticketId || !content) {
      return NextResponse.json({ error: "ticketId et content requis" }, { status: 400 });
    }

    const pool = getAuthPool();

    const settingsResult = await pool.query(
      `SELECT value FROM "SiteSettings" WHERE key = 'support_tickets'`
    );

    let tickets: any[] = [];
    let ticketIndex = -1;
    if (settingsResult.rows.length > 0 && settingsResult.rows[0].value) {
      tickets = JSON.parse(settingsResult.rows[0].value);
      ticketIndex = tickets.findIndex((t: any) => t.id === ticketId);
    }

    if (ticketIndex === -1) {
      return NextResponse.json({ error: "Ticket non trouvé" }, { status: 404 });
    }

    const ticket = tickets[ticketIndex];
    const userRole = session.user.role;

    if (userRole !== "ADMIN" && userRole !== "OWNER" && userRole !== "MODERATOR" && ticket.userId !== session.user.id) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 403 });
    }

    if (ticket.status === "closed") {
      return NextResponse.json({ error: "Ce ticket est fermé" }, { status: 400 });
    }

    const senderRole = bodySenderRole || (userRole === "ADMIN" || userRole === "OWNER" || userRole === "MODERATOR" ? "admin" : "user");

    const dbResult = await pool.query(
      `INSERT INTO "ChatMessage" ("ticketId", "senderId", "senderRole", content, "contentType", metadata, "createdAt")
       VALUES ($1, $2, $3, $4, $5, $6, NOW())
       RETURNING *`,
      [
        ticketId,
        session.user.id,
        senderRole,
        content,
        contentType || "text",
        JSON.stringify({ userName: session.user.name, userRole: session.user.role }),
      ]
    );

    const newMessage = dbResult.rows[0];

    const now = new Date().toISOString();
    ticket.updatedAt = now;
    if (senderRole === "admin" && ticket.status === "open") {
      ticket.status = "pending";
    }
    ticket.messages = ticket.messages || [];
    ticket.messages.push({
      senderId: session.user.id,
      senderRole,
      content,
      contentType: contentType || "text",
      createdAt: now,
    });

    tickets[ticketIndex] = ticket;

    await pool.query(
      `UPDATE "SiteSettings" SET value = $1 WHERE key = 'support_tickets'`,
      [JSON.stringify(tickets)]
    );

    await pool.query(
      `INSERT INTO "AuditLog" ("userId", action, "entityType", "entityId", metadata, "createdAt")
       VALUES ($1, 'SUPPORT_TICKET_REPLY', 'SUPPORT_TICKET', $2, $3, NOW())`,
      [
        session.user.id,
        ticketId,
        JSON.stringify({
          ticketId,
          replyAuthor: session.user.name || session.user.email,
          replyAuthorRole: userRole,
          replyContent: content,
          senderRole,
        }),
      ]
    );

    const senderUser = await pool.query(
      `SELECT name FROM "User" WHERE id = $1`,
      [session.user.id]
    );

    return NextResponse.json({
      success: true,
      message: {
        id: newMessage.id,
        ticketId: newMessage.ticketId,
        senderId: newMessage.senderId,
        senderName: senderUser.rows[0]?.name || session.user.name,
        senderRole: newMessage.senderRole,
        content: newMessage.content,
        contentType: newMessage.contentType,
        metadata: newMessage.metadata,
        createdAt: newMessage.createdAt,
      },
    }, { status: 201 });
  } catch (error) {
    console.error("[Support Messages] Error sending message:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
