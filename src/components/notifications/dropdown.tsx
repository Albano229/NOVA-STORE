"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import {
  Bell,
  Ticket,
  MessageSquare,
  AlertTriangle,
  Zap,
  Settings,
  Check,
} from "lucide-react";

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  userId: string | null;
  role: string | null;
  read: boolean;
  createdAt: string;
}

const typeIcon: Record<string, typeof Bell> = {
  ticket_created: Ticket,
  ticket_reply: MessageSquare,
  ticket_escalated: AlertTriangle,
  ai_escalation: Zap,
  system: Settings,
};

const typeColor: Record<string, string> = {
  ticket_created: "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
  ticket_reply: "bg-indigo-100 text-indigo-600 dark:bg-indigo-900/30 dark:text-indigo-400",
  ticket_escalated: "bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400",
  ai_escalation: "bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400",
  system: "bg-gray-100 text-gray-600 dark:bg-zinc-800 dark:text-zinc-400",
};

function timeAgo(dateStr: string): string {
  const seconds = Math.floor(
    (Date.now() - new Date(dateStr).getTime()) / 1000
  );
  if (seconds < 60) return "à l'instant";
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `il y a ${days}j`;
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
  });
}

export function NotificationsDropdown() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const fetchNotifications = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications");
      if (res.ok) {
        const data = await res.json();
        setNotifications(data.notifications || []);
        setUnreadCount(data.unreadCount || 0);
      }
    } catch {
      // silent
    }
  }, []);

  const markAsRead = useCallback(
    async (id: string) => {
      try {
        const res = await fetch("/api/notifications", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ notificationId: id }),
        });
        if (res.ok) {
          setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: true } : n))
          );
          setUnreadCount((prev) => Math.max(0, prev - 1));
        }
      } catch {
        // silent
      }
    },
    []
  );

  const markAllRead = useCallback(async () => {
    try {
      const res = await fetch("/api/notifications", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ markAllRead: true }),
      });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, [fetchNotifications]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen(!open)}
        className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
      >
        <Bell className="h-5 w-5" />
        {unreadCount > 0 && (
          <span className="absolute right-1 top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
            {unreadCount > 99 ? "99+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full z-50 mt-2 w-80 sm:w-96 rounded-xl border border-gray-200 bg-white shadow-xl dark:border-zinc-800 dark:bg-zinc-900">
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3 dark:border-zinc-800">
            <h3 className="text-sm font-bold text-[#0f172a] dark:text-zinc-50">
              Notifications
            </h3>
            {unreadCount > 0 && (
              <button
                onClick={markAllRead}
                className="flex items-center gap-1 text-xs font-medium text-indigo-600 hover:text-indigo-800"
              >
                <Check className="h-3.5 w-3.5" />
                Tout marquer lu
              </button>
            )}
          </div>

          <div className="max-h-96 overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <Bell className="mx-auto h-10 w-10 text-gray-300 dark:text-zinc-600" />
                <p className="mt-2 text-sm text-gray-500 dark:text-zinc-400">
                  Aucune notification
                </p>
              </div>
            ) : (
              notifications.map((n) => {
                const Icon = typeIcon[n.type] || Bell;
                const color = typeColor[n.type] || typeColor.system;
                return (
                  <button
                    key={n.id}
                    onClick={() => {
                      if (!n.read) markAsRead(n.id);
                    }}
                    className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-gray-50 dark:hover:bg-zinc-800 ${
                      !n.read ? "bg-indigo-50/40 dark:bg-indigo-900/10" : ""
                    }`}
                  >
                    <div
                      className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${color}`}
                    >
                      <Icon className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <p
                          className={`text-sm font-medium ${
                            !n.read ? "text-[#0f172a] dark:text-zinc-50" : "text-gray-700 dark:text-zinc-300"
                          }`}
                        >
                          {n.title}
                        </p>
                        {!n.read && (
                          <span className="h-2 w-2 shrink-0 rounded-full bg-indigo-500" />
                        )}
                      </div>
                      <p className="mt-0.5 text-xs text-gray-500 line-clamp-2 dark:text-zinc-400">
                        {n.message}
                      </p>
                      <p className="mt-1 text-[10px] text-gray-400 dark:text-zinc-500">
                        {timeAgo(n.createdAt)}
                      </p>
                    </div>
                  </button>
                );
              })
            )}
          </div>

          {notifications.length > 0 && (
            <div className="border-t border-gray-100 px-4 py-2.5 dark:border-zinc-800">
              <p className="text-center text-xs text-gray-400 dark:text-zinc-500">
                {unreadCount > 0
                  ? `${unreadCount} non lue${unreadCount > 1 ? "s" : ""}`
                  : "Tout est lu"}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
