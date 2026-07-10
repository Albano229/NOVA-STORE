const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://nova-store-ashy.vercel.app";
const SITE_NAME = "NOVA Store";
const BRAND_COLOR = "#7126b6";
const BRAND_LIGHT = "#f3e8ff";

export function baseEmailTemplate(content: string): string {
  return `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${SITE_NAME}</title>
</head>
<body style="margin:0;padding:0;background-color:#f8fafc;font-family:Arial,Helvetica,sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f8fafc;padding:40px 20px;">
    <tr>
      <td align="center">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;">
          <!-- Header -->
          <tr>
            <td style="background:linear-gradient(135deg,${BRAND_COLOR},#5e1f99);padding:32px 40px;border-radius:16px 16px 0 0;text-align:center;">
              <h1 style="margin:0;color:#ffffff;font-size:28px;font-weight:700;letter-spacing:-0.5px;">${SITE_NAME}</h1>
              <p style="margin:8px 0 0;color:rgba(255,255,255,0.8);font-size:13px;">Marketplace multivendeurs</p>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="background-color:#ffffff;padding:40px;border:1px solid #e2e8f0;border-top:none;">
              ${content}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color:#f8fafc;padding:24px 40px;border:1px solid #e2e8f0;border-top:none;border-radius:0 0 16px 16px;text-align:center;">
              <p style="margin:0 0 8px;color:#94a3b8;font-size:12px;">
                ${SITE_NAME} — Marketplace multivendeurs
              </p>
              <p style="margin:0;color:#cbd5e1;font-size:11px;">
                <a href="${SITE_URL}" style="color:${BRAND_COLOR};text-decoration:none;">Site web</a> · 
                <a href="${SITE_URL}/help" style="color:${BRAND_COLOR};text-decoration:none;">Aide</a> · 
                <a href="${SITE_URL}/profile" style="color:${BRAND_COLOR};text-decoration:none;">Mon compte</a>
              </p>
              <p style="margin:12px 0 0;color:#cbd5e1;font-size:10px;">
                Vous recevez cet email car vous avez un compte ${SITE_NAME}.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export function primaryButton(text: string, url: string): string {
  return `
  <div style="text-align:center;margin:24px 0;">
    <a href="${url}" style="display:inline-block;background-color:${BRAND_COLOR};color:#ffffff;padding:14px 36px;border-radius:10px;text-decoration:none;font-weight:600;font-size:15px;letter-spacing:0.2px;">
      ${text}
    </a>
  </div>`;
}

export function secondaryButton(text: string, url: string): string {
  return `
  <div style="text-align:center;margin:12px 0;">
    <a href="${url}" style="display:inline-block;background-color:#f1f5f9;color:#475569;padding:12px 28px;border-radius:10px;text-decoration:none;font-weight:500;font-size:14px;">
      ${text}
    </a>
  </div>`;
}

export function sectionDivider(): string {
  return `<hr style="border:none;border-top:1px solid #e2e8f0;margin:24px 0;" />`;
}

export function infoBox(label: string, value: string): string {
  return `
  <div style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:10px;padding:16px 20px;margin:12px 0;">
    <p style="margin:0 0 4px;color:#94a3b8;font-size:11px;text-transform:uppercase;letter-spacing:0.5px;">${label}</p>
    <p style="margin:0;color:#0f172a;font-size:16px;font-weight:600;">${value}</p>
  </div>`;
}

export function statusBadge(text: string, color: string): string {
  return `<span style="display:inline-block;background-color:${color}15;color:${color};padding:6px 16px;border-radius:20px;font-size:13px;font-weight:600;">${text}</span>`;
}

export function orderItemRow(name: string, qty: number, price: string): string {
  return `
  <tr>
    <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;color:#334155;font-size:14px;">${name}</td>
    <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;color:#64748b;font-size:14px;text-align:center;">×${qty}</td>
    <td style="padding:12px 0;border-bottom:1px solid #f1f5f9;color:#0f172a;font-size:14px;font-weight:600;text-align:right;">${price}</td>
  </tr>`;
}

export { SITE_URL, SITE_NAME, BRAND_COLOR, BRAND_LIGHT };
