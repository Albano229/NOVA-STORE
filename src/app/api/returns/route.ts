import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");
    const pool = getAuthPool();

    let query = "";
    let params: any[] = [];

    if (session.user.role === "ADMIN" || session.user.role === "OWNER") {
      query = `SELECT rr.*, o."orderNumber", u.name as "userName", u.email as "userEmail", s.name as "shopName"
               FROM "ReturnRequest" rr
               JOIN "Order" o ON o.id = rr."orderId"
               JOIN "User" u ON u.id = rr."userId"
               JOIN "Shop" s ON s.id = rr."shopId"`;
      params = [];
    } else if (session.user.role === "VENDOR") {
      query = `SELECT rr.*, o."orderNumber", u.name as "userName", u.email as "userEmail", s.name as "shopName"
               FROM "ReturnRequest" rr
               JOIN "Order" o ON o.id = rr."orderId"
               JOIN "User" u ON u.id = rr."userId"
               JOIN "Shop" s ON s.id = rr."shopId"
               WHERE rr."shopId" IN (SELECT id FROM "Shop" WHERE "userId" = $1)`;
      params = [session.user.id];
    } else {
      query = `SELECT rr.*, o."orderNumber", s.name as "shopName"
               FROM "ReturnRequest" rr
               JOIN "Order" o ON o.id = rr."orderId"
               JOIN "Shop" s ON s.id = rr."shopId"
               WHERE rr."userId" = $1`;
      params = [session.user.id];
    }

    if (status) {
      const paramIdx = params.length + 1;
      query += ` AND rr.status = $${paramIdx}`;
      params.push(status);
    }

    query += ` ORDER BY rr."createdAt" DESC`;

    const result = await pool.query(query, params);
    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Error fetching returns:", error);
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
    const { orderId, orderItemId, reason, description } = body;

    if (!orderId || !reason) {
      return NextResponse.json({ error: "Données invalides" }, { status: 400 });
    }

    const pool = getAuthPool();

    const orderResult = await pool.query(
      `SELECT id, "shopId", "userId" FROM "Order" WHERE id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const order = orderResult.rows[0];

    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    let refundAmount = 0;
    if (orderItemId) {
      const itemResult = await pool.query(
        `SELECT price, quantity FROM "OrderItem" WHERE id = $1 AND "orderId" = $2`,
        [orderItemId, orderId]
      );
      if (itemResult.rows.length > 0) {
        refundAmount = itemResult.rows[0].price * itemResult.rows[0].quantity;
      }
    } else {
      const totalResult = await pool.query(
        `SELECT total FROM "Order" WHERE id = $1`,
        [orderId]
      );
      if (totalResult.rows.length > 0) {
        refundAmount = totalResult.rows[0].total;
      }
    }

    const result = await pool.query(
      `INSERT INTO "ReturnRequest" ("orderId", "orderItemId", "userId", "shopId", "reason", "description", "refundAmount")
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING *`,
      [orderId, orderItemId || null, session.user.id, order.shopId, reason, description || null, refundAmount]
    );

    return NextResponse.json(result.rows[0], { status: 201 });
  } catch (error) {
    console.error("Error creating return request:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
