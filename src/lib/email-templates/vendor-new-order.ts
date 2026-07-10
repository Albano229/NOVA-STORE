import { baseEmailTemplate, primaryButton, sectionDivider, infoBox, SITE_URL, BRAND_COLOR } from "./base";

export function vendorNewOrderEmail(data: {
  vendorName: string;
  orderNumber: string;
  customerName: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  paymentMethod: string;
  shippingAddress: string;
}): { subject: string; html: string } {
  const { vendorName, orderNumber, customerName, items, total, paymentMethod, shippingAddress } = data;

  const itemsHtml = items.map((item) => `
    <tr>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;">${item.name}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;text-align:center;">×${item.quantity}</td>
      <td style="padding:10px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${item.price.toLocaleString("fr-FR")} FCFA</td>
    </tr>
  `).join("");

  const paymentLabels: Record<string, string> = {
    STRIPE: "Carte bancaire",
    FLUTTERWAVE: "Mobile Money",
    FEDAPAY: "FedaPay",
    PAYPAL: "PayPal",
  };

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#f59e0b,#d97706);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">🔔</span>
      </div>
      <h2 style="margin:0;color:#0f172a;font-size:22px;font-weight:700;">Nouvelle commande !</h2>
      <p style="margin:8px 0 0;color:#64748b;font-size:14px;">Une nouvelle commande a été passée dans votre boutique</p>
    </div>

    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Bonjour <strong>${vendorName}</strong>,
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Vous avez reçu une nouvelle commande. Voici les détails :
    </p>

    <div style="display:flex;gap:12px;margin:20px 0;">
      ${infoBox("Commande", `#${orderNumber}`)}
      ${infoBox("Client", customerName)}
    </div>

    <div style="margin:20px 0;">
      <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Articles commandés</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #e2e8f0;">
            <td style="padding:8px 0;color:#94a3b8;font-size:11px;text-transform:uppercase;">Produit</td>
            <td style="padding:8px 0;color:#94a3b8;font-size:11px;text-transform:uppercase;text-align:center;">Qté</td>
            <td style="padding:8px 0;color:#94a3b8;font-size:11px;text-transform:uppercase;text-align:right;">Prix</td>
          </tr>
        </thead>
        <tbody>
          ${itemsHtml}
        </tbody>
      </table>
    </div>

    <div style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:20px 0;">
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:14px;">Paiement</td>
          <td style="padding:4px 0;color:#0f172a;font-size:14px;text-align:right;">${paymentLabels[paymentMethod] || paymentMethod}</td>
        </tr>
        <tr style="border-top:1px solid #e2e8f0;">
          <td style="padding:12px 0 4px;color:#0f172a;font-size:16px;font-weight:700;">Total</td>
          <td style="padding:12px 0 4px;color:${BRAND_COLOR};font-size:18px;font-weight:700;text-align:right;">${total.toLocaleString("fr-FR")} FCFA</td>
        </tr>
      </table>
    </div>

    ${infoBox("Adresse de livraison", shippingAddress)}

    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;color:#92400e;font-size:14px;">
        <strong>⚡ Action requise :</strong><br/>
        Préparez et expédiez la commande dans les plus brefs délais pour maintenir un excellent service.
      </p>
    </div>

    ${primaryButton("Gérer la commande", `${SITE_URL}/vendor/orders`)}

    ${sectionDivider()}

    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
      Vous recevez cet email pour chaque nouvelle commande.
    </p>
  `;

  return {
    subject: `Nouvelle commande #${orderNumber} 🛒`,
    html: baseEmailTemplate(content),
  };
}
