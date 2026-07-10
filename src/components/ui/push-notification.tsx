"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Bell, BellOff, X } from "lucide-react";

function urlBase64ToUint8Array(base64String: string) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, "+").replace(/_/g, "/");
  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);
  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

export function PushNotificationPrompt() {
  const { data: session } = useSession();
  const [show, setShow] = useState(false);
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  const checkSubscription = useCallback(async () => {
    if (!session?.user) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    try {
      const reg = await navigator.serviceWorker.ready;
      const existing = await reg.pushManager.getSubscription();
      setSubscribed(!!existing);

      if (!existing) {
        const dismissed = localStorage.getItem("nova-push-dismissed");
        if (!dismissed) {
          setTimeout(() => setShow(true), 5000);
        }
      }
    } catch {
      // silent
    }
  }, [session]);

  useEffect(() => {
    checkSubscription();
  }, [checkSubscription]);

  const handleSubscribe = async () => {
    setLoading(true);
    try {
      const reg = await navigator.serviceWorker.ready;
      const res = await fetch("/api/push/subscribe");
      const { publicKey } = await res.json();

      if (!publicKey) {
        setLoading(false);
        return;
      }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(publicKey),
      });

      const sub = subscription.toJSON();
      await fetch("/api/push/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          endpoint: sub.endpoint,
          p256dh: sub.keys?.p256dh,
          auth: sub.keys?.auth,
        }),
      });

      setSubscribed(true);
      setShow(false);
    } catch (err) {
      console.error("Push subscribe error:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDismiss = () => {
    setShow(false);
    localStorage.setItem("nova-push-dismissed", "true");
  };

  if (!session?.user || subscribed || !show) return null;

  return (
    <div className="fixed bottom-24 right-4 z-50 max-w-sm animate-in slide-in-from-bottom-5 duration-300">
      <div className="rounded-2xl border border-gray-200 bg-white p-5 shadow-2xl">
        <button
          onClick={handleDismiss}
          className="absolute right-3 top-3 rounded-full p-1 text-gray-400 hover:bg-gray-100"
        >
          <X className="h-4 w-4" />
        </button>
        <div className="flex items-start gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#7126b6]/10">
            <Bell className="h-5 w-5 text-[#7126b6]" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gray-900">
              Notifications push
            </h3>
            <p className="mt-1 text-xs text-gray-500">
              Restez informé de vos commandes, promotions et messages en temps réel.
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={handleSubscribe}
                disabled={loading}
                className="rounded-lg bg-[#7126b6] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#5c1e96] disabled:opacity-50"
              >
                {loading ? "Activation..." : "Activer"}
              </button>
              <button
                onClick={handleDismiss}
                className="rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-200"
              >
                Plus tard
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function PushToggle() {
  const { data: session } = useSession();
  const [subscribed, setSubscribed] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) return;

    navigator.serviceWorker.ready.then((reg) => {
      reg.pushManager.getSubscription().then((sub) => {
        setSubscribed(!!sub);
      });
    });
  }, [session]);

  const toggle = async () => {
    setLoading(true);
    try {
      if (subscribed) {
        const reg = await navigator.serviceWorker.ready;
        const sub = await reg.pushManager.getSubscription();
        if (sub) {
          await fetch("/api/push/subscribe", {
            method: "DELETE",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ endpoint: sub.endpoint }),
          });
          await sub.unsubscribe();
          setSubscribed(false);
        }
      } else {
        const reg = await navigator.serviceWorker.ready;
        const res = await fetch("/api/push/subscribe");
        const { publicKey } = await res.json();

        const subscription = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        });

        const sub = subscription.toJSON();
        await fetch("/api/push/subscribe", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            endpoint: sub.endpoint,
            p256dh: sub.keys?.p256dh,
            auth: sub.keys?.auth,
          }),
        });

        setSubscribed(true);
      }
    } catch (err) {
      console.error("Push toggle error:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!session?.user) return null;

  return (
    <button
      onClick={toggle}
      disabled={loading}
      className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm font-medium transition-colors hover:bg-gray-50 disabled:opacity-50"
      title={subscribed ? "Désactiver les notifications push" : "Activer les notifications push"}
    >
      {subscribed ? (
        <Bell className="h-4 w-4 text-[#7126b6]" />
      ) : (
        <BellOff className="h-4 w-4 text-gray-400" />
      )}
      <span className="hidden sm:inline">
        {subscribed ? "Push activé" : "Push désactivé"}
      </span>
    </button>
  );
}
