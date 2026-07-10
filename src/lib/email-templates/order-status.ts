import { baseEmailTemplate, primaryButton, sectionDivider, infoBox, SITE_URL, BRAND_COLOR } from "./base";

type StatusType = "shipped" | "delivered" | "cancelled";

const statusConfig: Record<StatusType, { emoji: string; title: string; color: string; message: string }> = {
  shipped: {
    emoji: "🚚",
    title: "Commande expédiée",
    color: "#8b5cf6",
    message: "Votre commande est en route vers vous !",
  },
  delivered: {
    emoji: "📦",
    title: "Commande livrée",
    color: "#10b981",
    message: "Votre commande a été livrée avec succès.",
  },
  cancelled: {
    emoji: "❌",
    title: "Commande annulée",
    color: "#ef4444",
    message: "Votre commande a été annulée.",
  },
};

export function orderStatusEmail(data: {
  userName: string;
  orderNumber: string;
  status: StatusType;
  vendorName?: string;
  trackingNumber?: string;
  cancelReason?: string;
}): { subject: string; html: string } {
  const { userName, orderNumber, status, vendorName, trackingNumber, cancelReason } = data;
  const config = statusConfig[status];

  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,${config.color},${config.color}cc);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">${config.emoji}</span>
      </div>
      <h2 style="margin:0;color:#0f172a;font-size:22px;font-weight:700;">${config.title}</h2>
      <p style="margin:8px 0 0;color:#64748b;font-size:14px;">Commande #${orderNumber}</p>
    </div>

    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Bonjour <strong>${userName}</strong>,
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
      ${config.message}
    </p>

    ${trackingNumber ? `
    <div style="background:linear-gradient(135deg,${BRAND_COLOR}08,${BRAND_COLOR}15);border:1px solid ${BRAND_COLOR}20;border-radius:12px;padding:20px;margin:20px 0;text-align:center;">
      <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">Numéro de suivi</p>
      <p style="margin:0;color:${BRAND_COLOR};font-size:20px;font-weight:700;letter-spacing:1px;">${trackingNumber}</p>
    </div>
    ` : ""}

    ${vendorName ? infoBox("Vendeur", vendorName) : ""}

    ${status === "cancelled" && cancelReason ? `
    <div style="background:#fef2f2;border:1px solid #fecaca;border-radius:10px;padding:16px 20px;margin:20px 0;">
      <p style="margin:0;color:#991b1b;font-size:14px;">
        <strong>Raison de l'annulation :</strong><br/>
        ${cancelReason}
      </p>
    </div>
    ` : ""}

    ${status === "shipped" ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;color:#166534;font-size:14px;">
        <strong>📋 Que faire maintenant ?</strong><br/>
        Vous pouvez suivre votre colis en temps réel avec le numéro de suivi ci-dessus.
      </p>
    </div>
    ` : ""}

    ${status === "delivered" ? `
    <div style="background:#f0fdf4;border:1px solid #bbf7d0;border-radius:10px;padding:16px 20px;margin:24px 0;">
      <p style="margin:0;color:#166534;font-size:14px;">
        <strong>⭐ Votre avis compte !</strong><br/>
        N'hésitez pas à laisser un avis sur les produits que vous avez reçus.
      </p>
    </div>
    ${primaryButton("Laisser un avis", `${SITE_URL}/account/orders`)}
    ` : ""}

    ${primaryButton("Voir ma commande", `${SITE_URL}/account/orders`)}

    ${sectionDivider()}

    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
      Des questions ? Contactez le support via votre espace client.
    </p>
  `;

  return {
    subject: `Commande #${orderNumber} — ${config.title}`,
    html: baseEmailTemplate(content),
  };
}
