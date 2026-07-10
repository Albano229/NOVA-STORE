import webPush from "web-push";
import { getAuthPool } from "@/lib/auth-pool";

const VAPID_PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!;
const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY!;
const VAPID_SUBJECT = process.env.VAPID_SUBJECT || "mailto:nova.store.bj@gmail.com";

if (VAPID_PUBLIC_KEY && VAPID_PRIVATE_KEY) {
  webPush.setVapidDetails(VAPID_SUBJECT, VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);
}

export interface PushPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  url?: string;
  tag?: string;
  data?: Record<string, unknown>;
}

export async function subscribeUser(
  userId: string,
  subscription: { endpoint: string; p256dh: string; auth: string },
  userAgent?: string
) {
  const pool = getAuthPool();
  await pool.query(
    `INSERT INTO "PushSubscription" ("userId", "endpoint", "p256dh", "auth", "userAgent", "isActive", "createdAt", "updatedAt")
     VALUES ($1, $2, $3, $4, $5, true, NOW(), NOW())
     ON CONFLICT ("userId", "endpoint") DO UPDATE SET "isActive" = true, "updatedAt" = NOW()`,
    [userId, subscription.endpoint, subscription.p256dh, subscription.auth, userAgent || null]
  );
}

export async function unsubscribeUser(userId: string, endpoint: string) {
  const pool = getAuthPool();
  await pool.query(
    `UPDATE "PushSubscription" SET "isActive" = false, "updatedAt" = NOW() WHERE "userId" = $1 AND "endpoint" = $2`,
    [userId, endpoint]
  );
}

export async function sendPushToUser(userId: string, payload: PushPayload) {
  const pool = getAuthPool();
  const result = await pool.query(
    `SELECT endpoint, p256dh, auth FROM "PushSubscription" WHERE "userId" = $1 AND "isActive" = true`,
    [userId]
  );

  const subscriptions = result.rows;
  let sent = 0;
  const failedEndpoints: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || "/brand/icon-192.png",
          badge: payload.badge || "/brand/icon-96.png",
          url: payload.url || "/",
          tag: payload.tag || "nova-notification",
          data: payload.data || {},
        })
      );
      sent++;
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        failedEndpoints.push(sub.endpoint);
      }
    }
  }

  if (failedEndpoints.length > 0) {
    await pool.query(
      `UPDATE "PushSubscription" SET "isActive" = false, "updatedAt" = NOW() WHERE endpoint = ANY($1)`,
      [failedEndpoints]
    );
  }

  return { sent, total: subscriptions.length, failed: failedEndpoints.length };
}

export async function sendPushToUsers(userIds: string[], payload: PushPayload) {
  const pool = getAuthPool();
  const result = await pool.query(
    `SELECT "userId", endpoint, p256dh, auth FROM "PushSubscription" WHERE "userId" = ANY($1) AND "isActive" = true`,
    [userIds]
  );

  const subscriptions = result.rows;
  let sent = 0;
  const failedEndpoints: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || "/brand/icon-192.png",
          badge: payload.badge || "/brand/icon-96.png",
          url: payload.url || "/",
          tag: payload.tag || "nova-notification",
          data: payload.data || {},
        })
      );
      sent++;
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        failedEndpoints.push(sub.endpoint);
      }
    }
  }

  if (failedEndpoints.length > 0) {
    await pool.query(
      `UPDATE "PushSubscription" SET "isActive" = false, "updatedAt" = NOW() WHERE endpoint = ANY($1)`,
      [failedEndpoints]
    );
  }

  return { sent, total: subscriptions.length, failed: failedEndpoints.length };
}

export async function sendPushToAll(payload: PushPayload) {
  const pool = getAuthPool();
  const result = await pool.query(
    `SELECT "userId", endpoint, p256dh, auth FROM "PushSubscription" WHERE "isActive" = true`
  );

  const subscriptions = result.rows;
  let sent = 0;
  const failedEndpoints: string[] = [];

  for (const sub of subscriptions) {
    try {
      await webPush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: { p256dh: sub.p256dh, auth: sub.auth },
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          icon: payload.icon || "/brand/icon-192.png",
          badge: payload.badge || "/brand/icon-96.png",
          url: payload.url || "/",
          tag: payload.tag || "nova-notification",
          data: payload.data || {},
        })
      );
      sent++;
    } catch (error: any) {
      if (error.statusCode === 410 || error.statusCode === 404) {
        failedEndpoints.push(sub.endpoint);
      }
    }
  }

  if (failedEndpoints.length > 0) {
    await pool.query(
      `UPDATE "PushSubscription" SET "isActive" = false, "updatedAt" = NOW() WHERE endpoint = ANY($1)`,
      [failedEndpoints]
    );
  }

  return { sent, total: subscriptions.length, failed: failedEndpoints.length };
}

export function getVapidPublicKey() {
  return VAPID_PUBLIC_KEY;
}
