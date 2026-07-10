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

    const orderResult = await pool.query(
      `SELECT o.*,
        json_build_object('id', s.id, 'name', s.name, 'slug', s.slug) AS shop
      FROM "Order" o
      LEFT JOIN "Shop" s ON s.id = o."shopId"
      WHERE o.id = $1 AND (o."userId" = $2 OR $3 = ANY(ARRAY['ADMIN', 'OWNER']))`,
      [id, session.user.id, session.user.role]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json(
        { error: "Commande non trouvée" },
        { status: 404 }
      );
    }

    const order = orderResult.rows[0];

    const [itemsResult, paymentResult] = await Promise.all([
      pool.query(
        `SELECT oi.id, oi."orderId", oi."productId", oi."variantId", oi.name,
                oi.price, oi.quantity, oi.image
         FROM "OrderItem" oi
         WHERE oi."orderId" = $1`,
        [id]
      ),
      pool.query(
        `SELECT id, "orderId", method, status, amount, "transactionId", "createdAt"
         FROM "Payment" WHERE "orderId" = $1 LIMIT 1`,
        [id]
      ),
    ]);

    return NextResponse.json({
      ...order,
      items: itemsResult.rows,
      payment: paymentResult.rows[0] || null,
    });
  } catch (error) {
    console.error("Error fetching order:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}
