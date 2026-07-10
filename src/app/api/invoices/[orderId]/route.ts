import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";

function generateInvoiceHTML(order: any, items: any[], shop: any, user: any, currency: string) {
  const fmt = (n: number) =>
    new Intl.NumberFormat("fr-FR", { minimumFractionDigits: 0, maximumFractionDigits: 0 }).format(n) + " " + currency;

  const itemRows = items
    .map(
      (item: any) => `
      <tr>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;">${item.name || "Produit"}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:center;">${item.quantity}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:right;">${fmt(item.price)}</td>
        <td style="padding:10px 12px;border-bottom:1px solid #e5e7eb;font-size:13px;color:#374151;text-align:right;font-weight:600;">${fmt(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Facture ${order.orderNumber} - NOVA STORE</title>
  <style>
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none !important; }
    }
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f9fafb; color: #111827; }
  </style>
</head>
<body>
  <div style="max-width:800px;margin:0 auto;background:#fff;padding:40px;">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:32px;border-bottom:3px solid #7126b6;padding-bottom:24px;">
      <div>
        <h1 style="font-size:28px;font-weight:800;color:#7126b6;letter-spacing:-0.5px;">NOVA STORE</h1>
        <p style="font-size:12px;color:#6b7280;margin-top:4px;">Marketplace multi-vendeurs</p>
      </div>
      <div style="text-align:right;">
        <h2 style="font-size:20px;font-weight:700;color:#0f172a;">FACTURE</h2>
        <p style="font-size:13px;color:#6b7280;margin-top:4px;">${order.orderNumber}</p>
        <p style="font-size:13px;color:#6b7280;">${new Date(order.createdAt).toLocaleDateString("fr-FR", { day: "numeric", month: "long", year: "numeric" })}</p>
      </div>
    </div>

    <div style="display:flex;justify-content:space-between;margin-bottom:32px;">
      <div>
        <h3 style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Vendeur</h3>
        <p style="font-size:14px;font-weight:600;color:#0f172a;">${shop.name || "Boutique"}</p>
      </div>
      <div style="text-align:right;">
        <h3 style="font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;margin-bottom:8px;">Client</h3>
        <p style="font-size:14px;font-weight:600;color:#0f172a;">${user.name || user.email}</p>
        <p style="font-size:13px;color:#6b7280;">${user.email}</p>
      </div>
    </div>

    <table style="width:100%;border-collapse:collapse;margin-bottom:24px;">
      <thead>
        <tr style="background:#f3f4f6;">
          <th style="padding:10px 12px;text-align:left;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Produit</th>
          <th style="padding:10px 12px;text-align:center;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Qté</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Prix</th>
          <th style="padding:10px 12px;text-align:right;font-size:11px;font-weight:600;color:#6b7280;text-transform:uppercase;letter-spacing:0.5px;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${itemRows}
      </tbody>
    </table>

    <div style="display:flex;justify-content:flex-end;">
      <div style="width:280px;">
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#6b7280;">
          <span>Sous-total</span>
          <span>${fmt(order.subtotal)}</span>
        </div>
        <div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#6b7280;">
          <span>Frais de livraison</span>
          <span>${fmt(order.shippingFee || 0)}</span>
        </div>
        ${order.tax > 0 ? `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#6b7280;">
          <span>Taxe</span>
          <span>${fmt(order.tax)}</span>
        </div>` : ""}
        ${order.discount > 0 ? `<div style="display:flex;justify-content:space-between;padding:8px 0;font-size:13px;color:#059669;">
          <span>Réduction</span>
          <span>-${fmt(order.discount)}</span>
        </div>` : ""}
        <div style="display:flex;justify-content:space-between;padding:12px 0;margin-top:4px;border-top:2px solid #0f172a;font-size:16px;font-weight:700;color:#0f172a;">
          <span>Total</span>
          <span>${fmt(order.total)}</span>
        </div>
      </div>
    </div>

    <div style="margin-top:40px;padding-top:20px;border-top:1px solid #e5e7eb;text-align:center;">
      <p style="font-size:12px;color:#9ca3af;">Merci pour votre achat !</p>
      <p style="font-size:12px;color:#9ca3af;margin-top:4px;">NOVA STORE &mdash; Marketplace multi-vendeurs</p>
    </div>
  </div>
</body>
</html>`;
}

export async function GET(
  req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const { orderId } = await params;
    const pool = getAuthPool();

    const orderResult = await pool.query(
      `SELECT o.*, s.name as "shopName", s."userId" as "shopUserId"
       FROM "Order" o
       JOIN "Shop" s ON s.id = o."shopId"
       WHERE o.id = $1`,
      [orderId]
    );

    if (orderResult.rows.length === 0) {
      return NextResponse.json({ error: "Commande introuvable" }, { status: 404 });
    }

    const order = orderResult.rows[0];

    const isOwner = order.userId === session.user.id;
    const isVendor = order.shopUserId === session.user.id;
    const isAdmin = session.user.role === "ADMIN" || session.user.role === "OWNER";

    if (!isOwner && !isVendor && !isAdmin) {
      return NextResponse.json({ error: "Accès refusé" }, { status: 403 });
    }

    const itemsResult = await pool.query(
      `SELECT * FROM "OrderItem" WHERE "orderId" = $1`,
      [orderId]
    );

    const userResult = await pool.query(
      `SELECT name, email FROM "User" WHERE id = $1`,
      [order.userId]
    );

    const settingsResult = await pool.query(
      `SELECT value FROM "SiteSettings" WHERE key = 'currency'`
    );
    const currency = settingsResult.rows.length > 0 ? settingsResult.rows[0].value : "XOF";

    const html = generateInvoiceHTML(
      order,
      itemsResult.rows,
      { name: order.shopName },
      userResult.rows[0] || { name: "Client", email: "" },
      currency
    );

    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html; charset=utf-8",
      },
    });
  } catch (error) {
    console.error("Error generating invoice:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
