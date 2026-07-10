import { baseEmailTemplate, primaryButton, sectionDivider, infoBox, orderItemRow, SITE_URL, BRAND_COLOR } from "./base";

interface OrderItem {
  name: string;
  quantity: number;
  price: number;
}

export function orderConfirmationEmail(data: {
  userName: string;
  orderNumber: string;
  vendorName: string;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  discount: number;
  total: number;
  paymentMethod: string;
  shippingAddress: string;
}): { subject: string; html: string } {
  const { userName, orderNumber, vendorName, items, subtotal, shipping, discount, total, paymentMethod, shippingAddress } = data;

  const itemsHtml = items.map((item) =>
    orderItemRow(item.name, item.quantity, `${item.price.toLocaleString("fr-FR")} FCFA`)
  ).join("");

  const paymentLabels: Record<string, string> = {
    STRIPE: "Carte bancaire",
    FLUTTERWAVE: "Mobile Money",
    FEDAPAY: "FedaPay",
    PAYPAL: "PayPal",
  };

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">✅</span>
      </div>
      <h2 style="margin:0;color:#0f172a;font-size:22px;font-weight:700;">Commande confirmée !</h2>
      <p style="margin:8px 0 0;color:#64748b;font-size:14px;">Merci pour votre achat</p>
    </div>

    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Bonjour <strong>${userName}</strong>,
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Votre commande a été enregistrée avec succès. Voici le récapitulatif :
    </p>

    ${infoBox("Numéro de commande", `#${orderNumber}`)}

    <div style="margin:20px 0;">
      <p style="margin:0 0 8px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Articles commandés</p>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;border-collapse:collapse;">
        <thead>
          <tr style="border-bottom:2px solid #e2e8f0;">
            <td style="padding:8px 0;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Produit</td>
            <td style="padding:8px 0;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;text-align:center;">Qté</td>
            <td style="padding:8px 0;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;text-align:right;">Prix</td>
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
          <td style="padding:4px 0;color:#64748b;font-size:14px;">Sous-total</td>
          <td style="padding:4px 0;color:#0f172a;font-size:14px;text-align:right;">${subtotal.toLocaleString("fr-FR")} FCFA</td>
        </tr>
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:14px;">Livraison</td>
          <td style="padding:4px 0;color:#10b981;font-size:14px;text-align:right;font-weight:500;">Gratuite</td>
        </tr>
        ${discount > 0 ? `
        <tr>
          <td style="padding:4px 0;color:#64748b;font-size:14px;">Réduction</td>
          <td style="padding:4px 0;color:#ef4444;font-size:14px;text-align:right;">-${discount.toLocaleString("fr-FR")} FCFA</td>
        </tr>
        ` : ""}
        <tr style="border-top:2px solid #e2e8f0;">
          <td style="padding:12px 0 4px;color:#0f172a;font-size:16px;font-weight:700;">Total</td>
          <td style="padding:12px 0 4px;color:${BRAND_COLOR};font-size:18px;font-weight:700;text-align:right;">${total.toLocaleString("fr-FR")} FCFA</td>
        </tr>
      </table>
    </div>

    <div style="display:flex;gap:12px;margin:20px 0;">
      ${infoBox("Boutique", vendorName)}
      ${infoBox("Paiement", paymentLabels[paymentMethod] || paymentMethod)}
    </div>

    ${infoBox("Adresse de livraison", shippingAddress)}

    <div style="background:#fef3c7;border:1px solid #fcd34d;border-radius:10px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;color:#92400e;font-size:14px;">
        <strong>📋 Prochaines étapes :</strong><br/>
        Le vendeur va préparer votre commande. Vous recevrez une notification lors de l'expédition.
      </p>
    </div>

    ${primaryButton("Suivre ma commande", `${SITE_URL}/account/orders`)}

    ${sectionDivider()}

    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
      Des questions ? Répondez à cet email ou contactez le support.
    </p>
  `;

  return {
    subject: `Commande #${orderNumber} confirmée ✅`,
    html: baseEmailTemplate(content),
  };
}
