"use client";

import Link from "next/link";

type Notification = {
  id: string;
  type: string;
  payload: Record<string, string>;
  read_at: string | null;
  created_at: string;
};

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const m = Math.floor(diff / 60000);
  if (m < 1) return "방금 전";
  if (m < 60) return `${m}분 전`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}시간 전`;
  const d = Math.floor(h / 24);
  if (d < 30) return `${d}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", {
    month: "long",
    day: "numeric",
  });
}

function notificationInfo(n: Notification): {
  icon: string;
  title: string;
  body?: string;
  href?: string;
} {
  const p = n.payload;
  switch (n.type) {
    case "product_approved":
      return {
        icon: "✅",
        title: `'${p.product_name}' 제품이 승인되었습니다!`,
        body: "축하합니다! 제품이 Sidedock에 공개되었습니다.",
        href: p.product_id ? `/products/${p.product_id}` : undefined,
      };
    case "product_rejected":
      return {
        icon: "❌",
        title: `'${p.product_name}' 제품이 반려되었습니다`,
        body: p.reason ? `사유: ${p.reason}` : "내용을 수정 후 재제출할 수 있습니다.",
        href: p.product_id ? `/products/${p.product_id}` : undefined,
      };
    case "product_submitted":
      return {
        icon: "📦",
        title: `'${p.product_name}' 심사 요청이 접수되었습니다`,
        body: p.resubmit ? "재제출된 제품입니다." : "새 제품 심사 요청입니다.",
        href: "/admin/moderation",
      };
    case "product_claimed":
      return {
        icon: "🙋",
        title: `'${p.product_name}' 소유권 요청이 접수되었습니다`,
        body: p.claimant_username
          ? `@${p.claimant_username} 님이 소유권을 요청했습니다.`
          : "소유권 요청을 확인하세요.",
        href: "/admin/claims",
      };
    case "product_claim_approved":
      return {
        icon: "🎉",
        title: `'${p.product_name}' 소유권이 승인되었습니다!`,
        body: "이제 이 제품을 직접 관리할 수 있습니다.",
        href: p.product_slug
          ? `/products/${p.product_slug}`
          : p.product_id
          ? `/products/${p.product_id}`
          : undefined,
      };
    case "product_claim_rejected":
      return {
        icon: "🚫",
        title: `'${p.product_name}' 소유권 요청이 반려되었습니다`,
        body: p.reason ? `사유: ${p.reason}` : "관리자에게 문의해주세요.",
        href: p.product_id ? `/products/${p.product_id}` : undefined,
      };
    case "upvote":
      return {
        icon: "🔼",
        title: `${p.actor_username ?? "누군가"} 님이 업보트했습니다`,
        body: `'${p.product_name}'`,
        href: p.product_id ? `/products/${p.product_id}` : undefined,
      };
    case "comment":
      return {
        icon: "💬",
        title: `${p.actor_username ?? "누군가"} 님이 댓글을 달았습니다`,
        body: p.comment_preview
          ? `'${p.product_name}' — "${p.comment_preview}${p.comment_preview.length >= 100 ? "..." : ""}"`
          : `'${p.product_name}'`,
        href: p.product_id ? `/products/${p.product_id}` : undefined,
      };
    default:
      return { icon: "🔔", title: "새 알림이 있습니다" };
  }
}

export default function NotificationsClient({
  initialNotifications,
}: {
  initialNotifications: Notification[];
}) {
  if (initialNotifications.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 py-20 text-center">
        <p className="text-4xl">🔔</p>
        <p className="mt-3 text-slate-500">아직 알림이 없습니다</p>
        <p className="mt-1 text-sm text-slate-400">
          제품이 승인되거나 댓글, 업보트가 달리면 알림이 옵니다.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {initialNotifications.map((n) => {
        const { icon, title, body, href } = notificationInfo(n);
        const inner = (
          <div
            className={`flex items-start gap-4 rounded-2xl border p-4 transition ${
              !n.read_at
                ? "border-blue-100 bg-blue-50/40"
                : "border-slate-100 bg-white hover:bg-slate-50"
            }`}
          >
            <span className="flex-shrink-0 text-2xl leading-none">{icon}</span>
            <div className="min-w-0 flex-1">
              <p
                className={`text-sm leading-relaxed ${
                  !n.read_at ? "font-semibold text-slate-900" : "text-slate-700"
                }`}
              >
                {title}
              </p>
              {body && (
                <p className="mt-0.5 text-xs text-slate-500 line-clamp-2">
                  {body}
                </p>
              )}
              <p className="mt-1 text-[11px] text-slate-400">
                {timeAgo(n.created_at)}
              </p>
            </div>
            {!n.read_at && (
              <span className="mt-1.5 h-2 w-2 flex-shrink-0 rounded-full bg-blue-500" />
            )}
          </div>
        );

        return href ? (
          <Link key={n.id} href={href} className="block">
            {inner}
          </Link>
        ) : (
          <div key={n.id}>{inner}</div>
        );
      })}
    </div>
  );
}
