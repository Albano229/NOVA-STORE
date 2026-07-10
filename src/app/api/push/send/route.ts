import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { sendPushToUser, sendPushToUsers, sendPushToAll } from "@/lib/push";

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["OWNER", "ADMIN"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const body = await req.json();
    const { target, userIds, title, body: msgBody, url, tag } = body;

    if (!title || !msgBody) {
      return NextResponse.json({ error: "title et body requis" }, { status: 400 });
    }

    const payload = {
      title,
      body: msgBody,
      url: url || "/",
      tag: tag || "admin-broadcast",
    };

    let result;
    if (target === "all") {
      result = await sendPushToAll(payload);
    } else if (target === "users" && userIds?.length) {
      result = await sendPushToUsers(userIds, payload);
    } else {
      return NextResponse.json({ error: "target invalide" }, { status: 400 });
    }

    return NextResponse.json({ success: true, ...result });
  } catch (error) {
    console.error("Push send error:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
