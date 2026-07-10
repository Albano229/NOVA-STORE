import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { getAuthPool } from "@/lib/auth-pool";
import {
  welcomeEmail,
  orderConfirmationEmail,
  orderStatusEmail,
  vendorNewOrderEmail,
  paymentConfirmationEmail,
} from "@/lib/email-templates";

interface NotificationPayload {
  type: "WELCOME" | "ORDER_CONFIRMED" | "ORDER_SHIPPED" | "ORDER_DELIVERED" | "ORDER_CANCELLED" | "NEW_ORDER_VENDOR" | "PAYMENT_CONFIRMED";
  recipientId: string;
  recipientPhone?: string;
  recipientEmail?: string;
  data: {
    userName?: string;
    vendorName?: string;
    customerName?: string;
    orderId?: string;
    orderNumber?: string;
    amount?: number;
    status?: string;
    trackingNumber?: string;
    items?: { name: string; quantity: number; price: number }[];
    subtotal?: number;
    shipping?: number;
    discount?: number;
    paymentMethod?: string;
    shippingAddress?: string;
    transactionId?: string;
    cancelReason?: string;
  };
}

async function sendWhatsAppNotification(phone: string, message: string): Promise<boolean> {
  const token = process.env.WHATSAPP_API_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

  if (!token || !phoneNumberId || !phone) return false;

  try {
    const res = await fetch(
      `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          messaging_product: "whatsapp",
          to: phone.replace(/[\s+]/g, ""),
          type: "text",
          text: { body: message },
        }),
      }
    );
    return res.ok;
  } catch {
    return false;
  }
}

async function sendEmailNotification(
  email: string,
  subject: string,
  htmlBody: string
): Promise<boolean> {
  const smtpHost = process.env.SMTP_HOST;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;

  if (!smtpHost || !smtpUser || !smtpPass || !email) return false;

  try {
    const nodemailer = await import("nodemailer");
    const transporter = nodemailer.default.createTransport({
      host: smtpHost,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === "true",
      auth: { user: smtpUser, pass: smtpPass },
    });

    await transporter.sendMail({
      from: process.env.SMTP_FROM || "NOVA Store <noreply@novastore.com>",
      to: email,
      subject,
      html: htmlBody,
    });
    return true;
  } catch {
    return false;
  }
}

function buildNotificationMessage(payload: NotificationPayload): string {
  const { type, data } = payload;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://nova-store-ashy.vercel.app";

  switch (type) {
    case "WELCOME":
      return `🎉 Bienvenue sur NOVA Store ! Votre compte a été créé avec succès. Découvrez nos produits: ${siteUrl}/products`;
    case "ORDER_CONFIRMED":
      return `✅ Commande #${data.orderNumber} confirmée!\n\nBonjour, votre commande chez ${data.vendorName} a été confirmée.\nTotal: ${data.amount?.toLocaleString()} FCFA\n\nSuivez votre commande: ${siteUrl}/account/orders`;
    case "ORDER_SHIPPED":
      return `🚚 Commande #${data.orderNumber} expédiée!\n\nVotre commande a été expédiée.${data.trackingNumber ? `\nN° de suivi: ${data.trackingNumber}` : ""}\n\nSuivez: ${siteUrl}/account/orders`;
    case "ORDER_DELIVERED":
      return `📦 Commande #${data.orderNumber} livrée!\n\nVotre commande a été livrée avec succès.\nMerci pour votre achat sur NOVA Store!`;
    case "ORDER_CANCELLED":
      return `❌ Commande #${data.orderNumber} annulée.\n\n${data.vendorName} a annulé votre commande.\nContactez le support: ${siteUrl}/help`;
    case "NEW_ORDER_VENDOR":
      return `🔔 Nouvelle commande #${data.orderNumber}!\n\nClient: ${data.customerName}\nMontant: ${data.amount?.toLocaleString()} FCFA\n\nConnectez-vous pour traiter: ${siteUrl}/vendor/orders`;
    case "PAYMENT_CONFIRMED":
      return `💳 Paiement confirmé!\n\nCommande #${data.orderNumber}\nMontant: ${data.amount?.toLocaleString()} FCFA\n\nSuivez: ${siteUrl}/account/orders`;
    default:
      return "";
  }
}

function buildEmailContent(payload: NotificationPayload): { subject: string; html: string } {
  const { type, data } = payload;

  switch (type) {
    case "WELCOME":
      return welcomeEmail(data.userName || "Client");
    case "ORDER_CONFIRMED":
      return orderConfirmationEmail({
        userName: data.customerName || "Client",
        orderNumber: data.orderNumber || "",
        vendorName: data.vendorName || "",
        items: data.items || [],
        subtotal: data.subtotal || 0,
        shipping: data.shipping || 0,
        discount: data.discount || 0,
        total: data.amount || 0,
        paymentMethod: data.paymentMethod || "",
        shippingAddress: data.shippingAddress || "",
      });
    case "ORDER_SHIPPED":
      return orderStatusEmail({
        userName: data.customerName || "Client",
        orderNumber: data.orderNumber || "",
        status: "shipped",
        vendorName: data.vendorName,
        trackingNumber: data.trackingNumber,
      });
    case "ORDER_DELIVERED":
      return orderStatusEmail({
        userName: data.customerName || "Client",
        orderNumber: data.orderNumber || "",
        status: "delivered",
        vendorName: data.vendorName,
      });
    case "ORDER_CANCELLED":
      return orderStatusEmail({
        userName: data.customerName || "Client",
        orderNumber: data.orderNumber || "",
        status: "cancelled",
        vendorName: data.vendorName,
        cancelReason: data.cancelReason,
      });
    case "NEW_ORDER_VENDOR":
      return vendorNewOrderEmail({
        vendorName: data.vendorName || "Vendeur",
        orderNumber: data.orderNumber || "",
        customerName: data.customerName || "Client",
        items: data.items || [],
        total: data.amount || 0,
        paymentMethod: data.paymentMethod || "",
        shippingAddress: data.shippingAddress || "",
      });
    case "PAYMENT_CONFIRMED":
      return paymentConfirmationEmail({
        userName: data.customerName || "Client",
        orderNumber: data.orderNumber || "",
        amount: data.amount || 0,
        paymentMethod: data.paymentMethod || "",
        transactionId: data.transactionId,
      });
    default:
      return { subject: "Notification NOVA Store", html: "" };
  }
}

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || !["OWNER", "ADMIN", "MODERATOR", "VENDOR"].includes(session.user.role)) {
      return NextResponse.json({ error: "Non autorisé" }, { status: 401 });
    }

    const payload: NotificationPayload = await req.json();
    const { type, recipientId, recipientPhone, recipientEmail, data } = payload;

    if (!type || !recipientId) {
      return NextResponse.json({ error: "Paramètres invalides" }, { status: 400 });
    }

    const pool = getAuthPool();

    await pool.query(
      `INSERT INTO "Notification" ("id", "userId", "title", "message", "type", "link", "createdAt")
       VALUES (gen_random_uuid(), $1, $2, $3, $4, $5, NOW())`,
      [
        recipientId,
        type.replace(/_/g, " "),
        buildNotificationMessage(payload),
        type,
        `/account/orders`,
      ]
    );

    let whatsappSent = false;
    let emailSent = false;

    if (recipientPhone) {
      whatsappSent = await sendWhatsAppNotification(recipientPhone, buildNotificationMessage(payload));
    }

    if (recipientEmail) {
      const emailContent = buildEmailContent(payload);
      if (emailContent.html) {
        emailSent = await sendEmailNotification(recipientEmail, emailContent.subject, emailContent.html);
      }
    }

    return NextResponse.json({
      success: true,
      whatsapp: whatsappSent,
      email: emailSent,
    });
  } catch (error) {
    console.error("Error sending notification:", error);
    return NextResponse.json({ error: "Erreur serveur" }, { status: 500 });
  }
}
