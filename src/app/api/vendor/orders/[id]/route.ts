import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import { getVendorShop } from "@/lib/vendor-shop";

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const { id } = await params;
    const result = await pool.query(
      `SELECT o.*,
              json_build_object('name', u."name", 'email', u."email", 'phone', u."phone") AS "user",
              COALESCE(
                (SELECT json_agg(jsonb_build_object('id', oi."id", 'productId', oi."productId", 'quantity', oi."quantity", 'price', oi."price", 'name', oi."name", 'variantId', oi."variantId'))
                 FROM "OrderItem" oi WHERE oi."orderId" = o."id"), '[]'
              ) AS "items"
       FROM "Order" o
       LEFT JOIN "User" u ON u."id" = o."userId"
       WHERE o."id" = $1`,
      [id]
    );

    const order = result.rows[0];
    if (!order || order.shopId !== shop.id) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["VENDOR","OWNER","ADMIN","MODERATOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const pool = getAuthPool();
    const shop = await getVendorShop(pool, session.user.id);
    if (!shop) return NextResponse.json({ error: "Boutique non trouvée" }, { status: 404 });

    const { id } = await params;
    const body = await req.json();
    const { status } = body;

    const orderResult = await pool.query(`SELECT * FROM "Order" WHERE "id" = $1`, [id]);
    const order = orderResult.rows[0];
    if (!order || order.shopId !== shop.id) {
      return NextResponse.json({ error: "Commande non trouvée" }, { status: 404 });
    }

    const updatedResult = await pool.query(
      `UPDATE "Order" SET "status" = $1, "updatedAt" = NOW() WHERE "id" = $2 RETURNING *`,
      [status, id]
    );

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nova-store-ashy.vercel.app";
    const statusMap: Record<string, string> = {
      CONFIRMED: "ORDER_CONFIRMED",
      SHIPPED: "ORDER_SHIPPED",
      DELIVERED: "ORDER_DELIVERED",
      CANCELLED: "ORDER_CANCELLED",
    };

    if (statusMap[status]) {
      try {
        const userResult = await pool.query(
          `SELECT id, name, email, phone FROM "User" WHERE id = $1`,
          [order.userId]
        );
        if (userResult.rows.length > 0) {
          const user = userResult.rows[0];
          await fetch(`${siteUrl}/api/notifications/send`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: statusMap[status],
              recipientId: user.id,
              recipientPhone: user.phone,
              recipientEmail: user.email,
              data: {
                orderId: id,
                orderNumber: order.orderNumber,
                vendorName: shop.name,
                amount: order.total,
                trackingNumber: status === "SHIPPED" ? order.trackingNumber : undefined,
              },
            }),
          });
        }
      } catch {}
    }

    return NextResponse.json(updatedResult.rows[0]);
  } catch (error) {
    console.error("Error updating order:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
