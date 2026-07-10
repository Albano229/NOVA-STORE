import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const pool = getAuthPool();

    const result = await pool.query(
      `SELECT rr.*, o."orderNumber", o.total as "orderTotal", o."paymentMethod",
              u.name as "userName", u.email as "userEmail",
              s.name as "shopName"
       FROM "ReturnRequest" rr
       JOIN "Order" o ON o.id = rr."orderId"
       JOIN "User" u ON u.id = rr."userId"
       JOIN "Shop" s ON s.id = rr."shopId"
       WHERE rr.id = $1`,
      [id]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    const ret = result.rows[0];

    if (session.user.role !== "ADMIN" && session.user.role !== "OWNER") {
      const isOwner = ret.userId === session.user.id;
      const isVendor = await pool.query(
        `SELECT id FROM "Shop" WHERE id = $1 AND "userId" = $2`,
        [ret.shopId, session.user.id]
      );
      if (!isOwner && isVendor.rows.length === 0) {
        return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
      }
    }

    let items: any[] = [];
    if (ret.orderItemId) {
      const itemResult = await pool.query(
        `SELECT * FROM "OrderItem" WHERE id = $1`,
        [ret.orderItemId]
      );
      items = itemResult.rows;
    } else {
      const itemsResult = await pool.query(
        `SELECT * FROM "OrderItem" WHERE "orderId" = $1`,
        [ret.orderId]
      );
      items = itemsResult.rows;
    }

    return NextResponse.json({ ...ret, items });
  } catch (error) {
    console.error("Error fetching return:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();
    const { status: newStatus, adminNotes, refundMethod } = body;

    const pool = getAuthPool();

    const existing = await pool.query(
      `SELECT rr.*, s."userId" as "shopUserId"
       FROM "ReturnRequest" rr
       JOIN "Shop" s ON s.id = rr."shopId"
       WHERE rr.id = $1`,
      [id]
    );

    if (existing.rows.length === 0) {
      return NextResponse.json({ error: "Demande introuvable" }, { status: 404 });
    }

    const ret = existing.rows[0];
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "OWNER";
    const isVendor = ret.shopUserId === session.user.id;

    if (!isAdmin && !isVendor) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const validStatuses = ["PENDING", "APPROVED", "REJECTED", "REFUNDED"];
    if (newStatus && !validStatuses.includes(newStatus)) {
      return NextResponse.json({ error: "Statut invalide" }, { status: 400 });
    }

    const result = await pool.query(
      `UPDATE "ReturnRequest"
       SET status = COALESCE($1, status),
           "adminNotes" = COALESCE($2, "adminNotes"),
           "refundMethod" = COALESCE($3, "refundMethod"),
           "updatedAt" = NOW()
       WHERE id = $4
       RETURNING *`,
      [newStatus || null, adminNotes || null, refundMethod || null, id]
    );

    if (newStatus === "REFUNDED" && ret.orderId) {
      await pool.query(
        `UPDATE "Order" SET status = 'REFUNDED' WHERE id = $1`,
        [ret.orderId]
      );
    }

    return NextResponse.json(result.rows[0]);
  } catch (error) {
    console.error("Error updating return:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
