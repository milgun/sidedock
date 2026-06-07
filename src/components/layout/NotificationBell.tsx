"use client";

import { useState, useEffect, useRef, useMemo } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";
import type { User } from "@supabase/supabase-js";

type Notification = {
  id: string;
  type: string;
  payload: Record<string, string>;
  read_at: string | null;
  created_at: string;
};

interface NotificationBellProps {
  user: User;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  return `${Math.floor(h / 24)}일 전`;
}

function notificationInfo(n: Notification): {
  icon: string;
  text: string;
  href?: string;
} {
  const p = n.payload;
  switch (n.type) {
    case "product_approved":
      return {
        icon: "✅",
        text: `'${p.product_name}' 제품이 승인되었습니다!`,
        href: p.product_id ? `/products/${p.product_id}` : undefined,
      };
    case "product_rejected":
      return {
        icon: "❌",
        text: `'${p.product_name}' 제품이 반려되었습니다`,
        href: p.product_id ? `/products/${p.product_id}` : undefined,
      };
    case "product_submitted":
      return {
        icon: "📦",
        text: `'${p.product_name}' 심사 요청이 접수되었습니다`,
        href: "/admin/moderation",
      };
    case "upvote":
      return {
        icon: "🔼",
        text: `${p.actor_username ?? "누군가"} 님이 '${p.product_name}'을(를) 업보트했습니다`,
        href: p.product_id ? `/products/${p.product_id}` : undefined,
      };
    case "comment":
      return {
        icon: "💬",
        text: `${p.actor_username ?? "누군가"} 님이 '${p.product_name}'에 댓글을 달았습니다`,
        href: p.product_id ? `/products/${p.product_id}` : undefined,
      };
    case "reply":
      return {
        icon: "↩️",
        text: `${p.actor_username ?? "누군가"} 님이 내 댓글에 답글을 달았습니다`,
        href: p.product_id ? `/products/${p.product_id}` : undefined,
      };
    default:
      return { icon: "🔔", text: "새 알림이 있습니다" };
  }
}

export default function NotificationBell({ user }: NotificationBellProps) {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [ringing, setRinging] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const supabase = useMemo(() => createClient(), []);

  const unreadCount = notifications.filter((n) => !n.read_at).length;

  const markAllRead = async () => {
    await fetch("/api/notifications", { method: "PATCH" });
    setNotifications((prev) =>
      prev.map((n) => ({ ...n, read_at: n.read_at ?? new Date().toISOString() }))
    );
  };

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Fetch on mount
  useEffect(() => {
    fetch("/api/notifications")
      .then((res) => (res.ok ? res.json() : null))
      .then((data: { notifications: Notification[] } | null) => {
        if (data) setNotifications(data.notifications);
      });
  }, []);

  // Supabase Realtime — 새 알림 실시간 수신
  useEffect(() => {
    const channel = supabase
      .channel(`notifications:${user.id}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "notifications",
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          setNotifications((prev) => [payload.new as Notification, ...prev]);
          setRinging(true);
          setTimeout(() => setRinging(false), 1000);
        }
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [user.id, supabase]);

  const handleToggle = () => {
    const willOpen = !open;
    setOpen(willOpen);
    if (willOpen && unreadCount > 0) {
      void markAllRead();
    }
  };

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={handleToggle}
        aria-label="알림"
        className="relative flex h-8 w-8 items-center justify-center rounded-full text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
      >
        <svg
          xmlns="http://www.w3.org/2000/svg"
          className={`h-5 w-5 transition-transform ${ringing ? "animate-bell-ring" : ""}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
          />
        </svg>
        {unreadCount > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-0.5 text-[9px] font-bold text-white">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-10 z-50 w-80 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl">
          {/* Header */}
          <div className="flex items-center justify-between border-b border-slate-100 px-4 py-2.5">
            <h3 className="text-sm font-semibold text-slate-900">알림</h3>
            {unreadCount > 0 && (
              <button
                onClick={() => void markAllRead()}
                className="text-xs text-blue-500 hover:text-blue-700"
              >
                모두 읽음
              </button>
            )}
          </div>

          {/* List */}
          <div className="max-h-[360px] overflow-y-auto">
            {notifications.length === 0 ? (
              <div className="py-10 text-center">
                <p className="text-2xl">🔔</p>
                <p className="mt-2 text-sm text-slate-400">알림이 없습니다</p>
              </div>
            ) : (
              notifications.map((n) => {
                const { icon, text, href } = notificationInfo(n);
                const isUnread = !n.read_at;
                const inner = (
                  <div
                    className={`flex items-start gap-3 px-4 py-3 transition hover:bg-slate-50 ${
                      isUnread ? "bg-blue-50/60" : ""
                    }`}
                  >
                    <span className="mt-0.5 flex-shrink-0 text-base leading-none">
                      {icon}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p
                        className={`text-xs leading-relaxed ${
                          isUnread
                            ? "font-semibold text-slate-900"
                            : "text-slate-600"
                        }`}
                      >
                        {text}
                      </p>
                      <p className="mt-0.5 text-[11px] text-slate-400">
                        {timeAgo(n.created_at)}
                      </p>
                    </div>
                    {isUnread && (
                      <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
                    )}
                  </div>
                );

                return href ? (
                  <Link
                    key={n.id}
                    href={href}
                    onClick={() => setOpen(false)}
                    className="block"
                  >
                    {inner}
                  </Link>
                ) : (
                  <div key={n.id}>{inner}</div>
                );
              })
            )}
          </div>

          {/* Footer */}
          <div className="border-t border-slate-100 px-4 py-2.5 text-center">
            <Link
              href="/notifications"
              onClick={() => setOpen(false)}
              className="text-xs text-slate-500 hover:text-blue-600"
            >
              모든 알림 보기 →
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}
