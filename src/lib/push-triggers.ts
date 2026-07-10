import { sendPushToUser, sendPushToUsers } from "@/lib/push";

export async function pushOrderConfirmed(userId: string, orderNumber: string, vendorName: string, total: number) {
  await sendPushToUser(userId, {
    title: "Commande confirmée",
    body: `Votre commande #${orderNumber} chez ${vendorName} a été confirmée. Total: ${total.toLocaleString()} FCFA`,
    url: "/account/orders",
    tag: "order-confirmed",
    data: { orderId: orderNumber, type: "order" },
  });
}

export async function pushOrderShipped(userId: string, orderNumber: string, trackingNumber?: string) {
  await sendPushToUser(userId, {
    title: "Commande expédiée",
    body: `Votre commande #${orderNumber} a été expédiée.${trackingNumber ? ` N° suivi: ${trackingNumber}` : ""}`,
    url: "/account/orders",
    tag: "order-shipped",
    data: { orderId: orderNumber, type: "order" },
  });
}

export async function pushOrderDelivered(userId: string, orderNumber: string) {
  await sendPushToUser(userId, {
    title: "Commande livrée",
    body: `Votre commande #${orderNumber} a été livrée avec succès!`,
    url: "/account/orders",
    tag: "order-delivered",
    data: { orderId: orderNumber, type: "order" },
  });
}

export async function pushOrderCancelled(userId: string, orderNumber: string, vendorName: string) {
  await sendPushToUser(userId, {
    title: "Commande annulée",
    body: `${vendorName} a annulé votre commande #${orderNumber}.`,
    url: "/account/orders",
    tag: "order-cancelled",
    data: { orderId: orderNumber, type: "order" },
  });
}

export async function pushNewOrderVendor(vendorUserId: string, orderNumber: string, customerName: string, total: number) {
  await sendPushToUser(vendorUserId, {
    title: "Nouvelle commande",
    body: `Nouvelle commande #${orderNumber} de ${customerName}. Montant: ${total.toLocaleString()} FCFA`,
    url: "/vendor/orders",
    tag: "new-order-vendor",
    data: { orderId: orderNumber, type: "vendor-order" },
  });
}

export async function pushFlashSale(userIds: string[], productName: string, salePrice: number, shopName: string) {
  await sendPushToUsers(userIds, {
    title: "Vente flash",
    body: `${productName} en vente flash à ${salePrice.toLocaleString()} FCFA chez ${shopName}!`,
    url: "/products",
    tag: "flash-sale",
    data: { type: "flash-sale" },
  });
}

export async function pushTicketReply(userId: string, ticketId: string) {
  await sendPushToUser(userId, {
    title: "Nouvelle réponse",
    body: "Vous avez reçu une nouvelle réponse de support.",
    url: "/account/orders",
    tag: "ticket-reply",
    data: { ticketId, type: "support" },
  });
}

export async function pushAdminBroadcast(userIds: string[], title: string, message: string, url?: string) {
  await sendPushToUsers(userIds, {
    title,
    body: message,
    url: url || "/",
    tag: "admin-broadcast",
    data: { type: "broadcast" },
  });
}
