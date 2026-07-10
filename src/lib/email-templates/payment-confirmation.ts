import { baseEmailTemplate, primaryButton, sectionDivider, infoBox, SITE_URL, BRAND_COLOR } from "./base";

export function paymentConfirmationEmail(data: {
  userName: string;
  orderNumber: string;
  amount: number;
  paymentMethod: string;
  transactionId?: string;
}): { subject: string; html: string } {
  const { userName, orderNumber, amount, paymentMethod, transactionId } = data;

  const paymentLabels: Record<string, string> = {
    STRIPE: "Carte bancaire",
    FLUTTERWAVE: "Mobile Money",
    FEDAPAY: "FedaPay",
    PAYPAL: "PayPal",
  };

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,#10b981,#059669);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">💳</span>
      </div>
      <h2 style="margin:0;color:#0f172a;font-size:22px;font-weight:700;">Paiement confirmé</h2>
      <p style="margin:8px 0 0;color:#64748b;font-size:14px;">Votre paiement a été traité avec succès</p>
    </div>

    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Bonjour <strong>${userName}</strong>,
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Nous confirmons la bonne réception de votre paiement pour la commande <strong>#${orderNumber}</strong>.
    </p>

    <div style="background:linear-gradient(135deg,#10b98110,#10b98120);border:1px solid #10b98130;border-radius:12px;padding:24px;margin:24px 0;text-align:center;">
      <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Montant payé</p>
      <p style="margin:0;color:#059669;font-size:32px;font-weight:700;">${amount.toLocaleString("fr-FR")} FCFA</p>
    </div>

    <div style="display:flex;gap:12px;margin:20px 0;">
      ${infoBox("Commande", `#${orderNumber}`)}
      ${infoBox("Méthode", paymentLabels[paymentMethod] || paymentMethod)}
    </div>

    ${transactionId ? infoBox("Référence transaction", transactionId) : ""}

    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;color:#166534;font-size:14px;">
        <strong>✅ Prochaines étapes :</strong><br/>
        Votre commande est maintenant en cours de préparation par le vendeur.
      </p>
    </div>

    ${primaryButton("Suivre ma commande", `${SITE_URL}/account/orders`)}

    ${sectionDivider()}

    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
      Conservez cet email comme preuve de paiement.
    </p>
  `;

  return {
    subject: `Paiement confirmé — Commande #${orderNumber} 💳`,
    html: baseEmailTemplate(content),
  };
}
