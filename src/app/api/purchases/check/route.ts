import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ hasPurchased: false });
    }

    const { searchParams } = new URL(req.url);
    const productId = searchParams.get("productId");

    if (!productId) {
      return NextResponse.json({ hasPurchased: false });
    }

    const pool = getAuthPool();

    const result = await pool.query(
      `SELECT o.id AS "orderId", o.status, o."paymentStatus"
       FROM "OrderItem" oi
       JOIN "Order" o ON o.id = oi."orderId"
       WHERE oi."productId" = $1
         AND o."userId" = $2
         AND o."paymentStatus" = 'COMPLETED'
         AND o.status != 'CANCELLED'
       LIMIT 1`,
      [productId, session.user.id]
    );

    if (result.rows.length > 0) {
      const order = result.rows[0];

      const digitalFile = await pool.query(
        `SELECT "fileUrl", "fileName" FROM "DigitalFile" WHERE "productId" = $1`,
        [productId]
      );

      return NextResponse.json({
        hasPurchased: true,
        orderId: order.orderId,
        accessGranted: true,
        downloadUrl: digitalFile.rows[0]?.fileUrl || null,
      });
    }

    return NextResponse.json({ hasPurchased: false });
  } catch (error) {
    console.error("Error checking purchase:", error);
    return NextResponse.json({ hasPurchased: false });
  }
}
