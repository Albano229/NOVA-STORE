declare module "web-push" {
  interface PushSubscription {
    endpoint: string;
    keys?: {
      p256dh: string;
      auth: string;
    };
  }

  interface SendNotificationResult {
    statusCode: number;
    body: string;
    headers: Record<string, string>;
  }

  function setVapidDetails(
    subject: string | URL,
    publicKey: string,
    privateKey: string
  ): void;

  function generateVapidKeys(): {
    publicKey: string;
    privateKey: string;
  };

  function sendNotification(
    subscription: PushSubscription,
    payload: string | Buffer,
    options?: {
      TTL?: number;
      urgency?: string;
      topic?: string;
      proxy?: string;
      headers?: Record<string, string>;
    }
  ): Promise<SendNotificationResult>;

  function setGCMAPIKey(apiKey: string): void;

  function setAutoDetectContentEncoding(enable: boolean): void;

  export {
    setVapidDetails,
    generateVapidKeys,
    sendNotification,
    setGCMAPIKey,
    setAutoDetectContentEncoding,
    PushSubscription,
    SendNotificationResult,
  };

  export default {
    setVapidDetails,
    generateVapidKeys,
    sendNotification,
    setGCMAPIKey,
    setAutoDetectContentEncoding,
  };
}
