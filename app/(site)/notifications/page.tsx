"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import {
  Bell,
  CheckCheck,
  Loader2,
  LogIn,
  Package,
  ShieldCheck,
  Wallet,
  MessageSquare,
  Info,
} from "lucide-react";

type Notification = {
  id: string;
  title: string;
  message: string;
  type: string;
  isRead: boolean;
  createdAt: string;
};

const TYPE_ICON: Record<string, React.ElementType> = {
  order: Package,
  payment: Wallet,
  wallet: Wallet,
  message: MessageSquare,
  security: ShieldCheck,
  info: Info,
};

const formatTime = (value: string) =>
  new Date(value).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [filter, setFilter] = useState<"all" | "unread">("all");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [marking, setMarking] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/notifications?limit=50", {
      credentials: "same-origin",
      signal: controller.signal,
    })
      .then(async (res) => {
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          throw new Error(
            res.status === 401
              ? "Please log in to view your notifications."
              : (data?.error ?? "Could not load notifications."),
          );
        }
        return data;
      })
      .then((data) => {
        setNotifications(data.notifications ?? []);
        setUnreadCount(data.unreadCount ?? 0);
      })
      .catch((err) => {
        if (err?.name === "AbortError") return;
        setError(err.message);
      })
      .finally(() => {
        if (!controller.signal.aborted) setLoading(false);
      });

    return () => controller.abort();
  }, []);

  const markRead = async (notification: Notification) => {
    if (notification.isRead) return;

    setNotifications((current) =>
      current.map((item) =>
        item.id === notification.id ? { ...item, isRead: true } : item,
      ),
    );
    setUnreadCount((count) => Math.max(0, count - 1));

    const res = await fetch(`/api/notifications/${notification.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isRead: true }),
    });

    if (!res.ok) {
      setNotifications((current) =>
        current.map((item) =>
          item.id === notification.id ? { ...item, isRead: false } : item,
        ),
      );
      setUnreadCount((count) => count + 1);
    }
  };

  const markAllRead = async () => {
    if (unreadCount === 0) return;
    setMarking(true);
    try {
      const res = await fetch("/api/notifications/read-all", {
        method: "PATCH",
      });
      if (res.ok) {
        setNotifications((current) =>
          current.map((item) => ({ ...item, isRead: true })),
        );
        setUnreadCount(0);
      }
    } finally {
      setMarking(false);
    }
  };

  const visible = notifications.filter(
    (notification) => filter === "all" || !notification.isRead,
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC]">
      <div className="max-w-3xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold ext-primary-black mb-2">
              Notifications
            </h1>
            <p className="text-gray-text text-sm">
              {unreadCount > 0
                ? `${unreadCount} unread notification${unreadCount === 1 ? "" : "s"}`
                : "You are all caught up"}
            </p>
          </div>
          <button
            onClick={() => void markAllRead()}
            disabled={marking || unreadCount === 0}
            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-foundation-gray bg-white text-primary-black font-medium hover:border-primary hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {marking ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCheck className="w-4 h-4" />
            )}
            Mark all read
          </button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24 text-gray-text">
            <Loader2 className="w-6 h-6 animate-spin mr-3 text-primary" />
            Loading notifications…
          </div>
        ) : error ? (
          <div className="bg-white rounded-2xl border border-foundation-gray p-10 text-center">
            <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
            <h2 className="text-lg font-bold text-primary-black mb-2">
              {error === "Please log in to view your notifications."
                ? "Log in to view notifications"
                : "Could not load notifications"}
            </h2>
            <p className="text-sm text-gray-text mb-5">{error}</p>
            <Link
              href="/auth/login?next=/notifications"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-primary text-white font-semibold hover:bg-primary-hover transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Log in
            </Link>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-1 bg-white rounded-xl border border-foundation-gray p-1 mb-5 w-fit">
              {(
                [
                  { id: "all", label: "All" },
                  { id: "unread", label: `Unread (${unreadCount})` },
                ] as const
              ).map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setFilter(tab.id)}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${
                    filter === tab.id
                      ? "bg-primary text-white shadow-sm"
                      : "text-gray-text hover:text-primary-black"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {visible.length === 0 ? (
              <div className="bg-white rounded-2xl border border-foundation-gray p-12 text-center">
                <Bell className="w-10 h-10 mx-auto mb-3 text-gray-300" />
                <p className="text-sm text-gray-text">
                  {filter === "unread"
                    ? "No unread notifications."
                    : "No notifications yet. Order and payment updates will appear here."}
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {visible.map((notification) => {
                  const Icon = TYPE_ICON[notification.type] ?? Info;
                  return (
                    <button
                      key={notification.id}
                      onClick={() => void markRead(notification)}
                      className={`w-full text-left bg-white rounded-2xl border p-5 transition-all hover:border-primary/40 ${
                        notification.isRead
                          ? "border-foundation-gray/30 shadow-sm"
                          : "border-primary/30 shadow-sm"
                      }`}
                    >
                      <div className="flex gap-4">
                        <div
                          className={`w-10 h-10 rounded-lg flex items-center justify-center shrink-0 ${
                            notification.isRead
                              ? "bg-primary-gray text-gray-text"
                              : "bg-secondary text-primary"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-3">
                            <p
                              className={`text-sm ${
                                notification.isRead
                                  ? "font-medium text-primary-black"
                                  : "font-bold text-primary-black"
                              }`}
                            >
                              {notification.title}
                            </p>
                            {!notification.isRead && (
                              <span className="w-2 h-2 rounded-full bg-primary shrink-0 mt-1.5" />
                            )}
                          </div>
                          <p className="text-sm text-gray-text mt-1">
                            {notification.message}
                          </p>
                          <p className="text-xs text-[#B0B0B0] mt-2">
                            {formatTime(notification.createdAt)}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}
