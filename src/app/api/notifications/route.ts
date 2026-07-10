import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  userId: string | null;
  role: string | null;
  read: boolean;
  createdAt: string;
}

async function getNotifications(): Promise<Notification[]> {
  const pool = getAuthPool();
  const result = await pool.query(
    `SELECT value FROM "SiteSettings" WHERE key = 'notifications'`
  );
  if (result.rows.length === 0) return [];
  try {
    return JSON.parse(result.rows[0].value || "[]");
  } catch {
    return [];
  }
}

async function saveNotifications(notifications: Notification[]) {
  const pool = getAuthPool();
  await pool.query(
    `INSERT INTO "SiteSettings" (key, value) VALUES ('notifications', $1)
     ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value`,
    [JSON.stringify(notifications)]
  );
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const unreadOnly = searchParams.get("unread") === "true";

    const all = await getNotifications();

    const userNotifications = all.filter((n) => {
      if (n.userId && n.userId !== session.user.id) return false;
      if (n.role && n.role !== session.user.role) return false;
      return true;
    });

    const filtered = unreadOnly
      ? userNotifications.filter((n) => !n.read)
      : userNotifications;

    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    const unreadCount = userNotifications.filter((n) => !n.read).length;

    return NextResponse.json({
      notifications: filtered.slice(0, 50),
      unreadCount,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { type, title, message, userId, role } = body;

    if (!type || !title || !message) {
      return NextResponse.json(
        { error: "type, title et message requis" },
        { status: 400 }
      );
    }

    const validTypes = [
      "ticket_created",
      "ticket_reply",
      "ticket_escalated",
      "ai_escalation",
      "system",
    ];
    if (!validTypes.includes(type)) {
      return NextResponse.json({ error: "Type invalide" }, { status: 400 });
    }

    const all = await getNotifications();

    const notification: Notification = {
      id: `notif_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      type,
      title,
      message,
      userId: userId || null,
      role: role || null,
      read: false,
      createdAt: new Date().toISOString(),
    };

    all.unshift(notification);

    if (all.length > 200) {
      all.splice(200);
    }

    await saveNotifications(all);

    return NextResponse.json({ success: true, notification }, { status: 201 });
  } catch (error) {
    console.error("Error creating notification:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { notificationId, markAllRead } = body;

    if (!notificationId && !markAllRead) {
      return NextResponse.json(
        { error: "notificationId ou markAllRead requis" },
        { status: 400 }
      );
    }

    const all = await getNotifications();

    if (markAllRead) {
      for (const n of all) {
        if (n.userId && n.userId !== session.user.id) continue;
        if (n.role && n.role !== session.user.role) continue;
        n.read = true;
      }
    } else {
      const idx = all.findIndex((n) => n.id === notificationId);
      if (idx === -1) {
        return NextResponse.json(
          { error: "Notification introuvable" },
          { status: 404 }
        );
      }
      all[idx].read = true;
    }

    await saveNotifications(all);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating notification:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
