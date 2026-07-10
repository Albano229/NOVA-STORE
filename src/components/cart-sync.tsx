"use client";

import { useEffect, useRef } from "react";
import { useSession } from "next-auth/react";
import { useCartStore } from "@/stores/cart";

export function CartSync() {
  const { data: session, status } = useSession();
  const loadFromServer = useCartStore((s) => s.loadFromServer);
  const clearCart = useCartStore((s) => s.clearCart);
  const _synced = useCartStore((s) => s._synced);
  const hasSyncedRef = useRef(false);

  useEffect(() => {
    if (status === "loading") return;

    if (session?.user?.id && !hasSyncedRef.current) {
      hasSyncedRef.current = true;
      fetch("/api/cart")
        .then((res) => res.json())
        .then((data) => {
          if (data.items && Array.isArray(data.items)) {
            loadFromServer(data.items);
          }
        })
        .catch(console.error);
    }

    if (!session?.user?.id && hasSyncedRef.current) {
      hasSyncedRef.current = false;
    }
  }, [session, status, loadFromServer]);

  return null;
}
