import { baseEmailTemplate, primaryButton, sectionDivider, SITE_URL, SITE_NAME, BRAND_COLOR } from "./base";

export function welcomeEmail(userName: string): { subject: string; html: string } {
  const content = `
    <div style="text-align:center;margin-bottom:24px;">
      <div style="width:64px;height:64px;background:linear-gradient(135deg,${BRAND_COLOR},#a855f7);border-radius:50%;display:inline-flex;align-items:center;justify-content:center;margin-bottom:16px;">
        <span style="font-size:28px;">🎉</span>
      </div>
      <h2 style="margin:0;color:#0f172a;font-size:22px;font-weight:700;">Bienvenue sur ${SITE_NAME} !</h2>
    </div>
    
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 16px;">
      Bonjour <strong>${userName}</strong>,
    </p>
    <p style="color:#475569;font-size:15px;line-height:1.7;margin:0 0 24px;">
      Nous sommes ravis de vous compter parmi nous ! Votre compte a été créé avec succès.
      Découvrez des milliers de produits de nos vendeurs partenaires.
    </p>

    <div style="background:linear-gradient(135deg,${BRAND_COLOR}08,${BRAND_COLOR}15);border:1px solid ${BRAND_COLOR}20;border-radius:12px;padding:24px;margin:24px 0;">
      <h3 style="margin:0 0 12px;color:${BRAND_COLOR};font-size:16px;">🚀 Ce que vous pouvez faire :</h3>
      <table role="presentation" cellpadding="0" cellspacing="0" style="width:100%;">
        <tr>
          <td style="padding:6px 0;color:#475569;font-size:14px;">🛍️ Explorer nos boutiques et produits</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#475569;font-size:14px;">💝 Ajouter des produits à votre liste de souhaits</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#475569;font-size:14px;">🛒 Commander en quelques clics</td>
        </tr>
        <tr>
          <td style="padding:6px 0;color:#475569;font-size:14px;">⭐ Laisser des avis sur vos achats</td>
        </tr>
      </table>
    </div>

    ${primaryButton("Commencer mes achats", `${SITE_URL}/products`)}

    ${sectionDivider()}

    <p style="color:#94a3b8;font-size:13px;text-align:center;margin:0;">
      Besoin d'aide ? Contactez-nous à <a href="mailto:support@novastore.com" style="color:${BRAND_COLOR};text-decoration:none;">support@novastore.com</a>
    </p>
  `;

  return {
    subject: `Bienvenue sur ${SITE_NAME} ! 🎉`,
    html: baseEmailTemplate(content),
  };
}
