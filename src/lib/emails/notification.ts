import { resend, EMAIL_FROM } from "@/lib/resend";
import { createAdminClient } from "@/lib/supabase/admin";
import type { NotificationPreferences } from "@/lib/actions/settings";

/** 사용자 입력이 HTML로 주입되는 것을 방지 */
function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function appUrl(): string {
  return process.env.NEXT_PUBLIC_APP_URL ?? "https://sidedock.io";
}

export type EngagementNotificationType = "comment" | "reply" | "devlog_comment" | "upvote";

interface EngagementEmailProps {
  type: EngagementNotificationType;
  actorName: string;
  productName: string;
  productHref: string;
  commentPreview?: string;
}

const preferenceForType: Record<EngagementNotificationType, keyof NotificationPreferences> = {
  comment: "email_comments",
  reply: "email_replies",
  devlog_comment: "email_comments",
  upvote: "email_upvotes",
};

const typeConfig: Record<EngagementNotificationType, {
  prompt: string;
  promptColor: string;
  status: string;
  subject: (productName: string) => string;
  heading: (productName: string) => string;
  ctaLabel: string;
  ctaGradient: string;
}> = {
  comment: {
    prompt: "$ notify --event comment",
    promptColor: "#58a6ff",
    status: "💬 new comment · thread active",
    subject: (productName) => `💬 "${productName}"에 새 댓글이 달렸어요`,
    heading: (productName) => `"${productName}"에 새 댓글이 달렸어요`,
    ctaLabel: "댓글 보러가기 →",
    ctaGradient: "linear-gradient(135deg,#1f6feb,#388bfd)",
  },
  reply: {
    prompt: "$ notify --event reply",
    promptColor: "#a371f7",
    status: "↩️ new reply · thread continues",
    subject: () => `↩️ 내 댓글에 답글이 달렸어요`,
    heading: () => `내 댓글에 답글이 달렸어요`,
    ctaLabel: "답글 보러가기 →",
    ctaGradient: "linear-gradient(135deg,#8957e5,#a371f7)",
  },
  devlog_comment: {
    prompt: "$ notify --target devlog",
    promptColor: "#f0883e",
    status: "📝 new comment · dev log active",
    subject: (productName) => `📝 "${productName}"에 새 댓글이 달렸어요`,
    heading: (productName) => `"${productName}"에 새 댓글이 달렸어요`,
    ctaLabel: "Dev Log 보러가기 →",
    ctaGradient: "linear-gradient(135deg,#db6d28,#f0883e)",
  },
  upvote: {
    prompt: "$ notify --event boost",
    promptColor: "#7ee787",
    status: "🔼 +1 boost received",
    subject: (productName) => `🔼 "${productName}"이(가) 업보트를 받았어요`,
    heading: (productName) => `"${productName}"이(가) 업보트를 받았어요`,
    ctaLabel: "내 제품 보러가기 →",
    ctaGradient: "linear-gradient(135deg,#238636,#2ea043)",
  },
};

/** 댓글 / 답글 / 업보트 알림 메일 — 기존 welcome/product-review와 동일한 터미널 카드 톤 */
function EngagementEmail({ type, actorName, productName, productHref, commentPreview }: EngagementEmailProps): string {
  const config = typeConfig[type];
  const name = escapeHtml(actorName);
  const product = escapeHtml(productName);
  const preview = commentPreview ? escapeHtml(commentPreview) : null;
  const url = `${appUrl()}${productHref}`;

  const bodyText =
    type === "upvote"
      ? `<strong style="color:#f0f6fc;">${name}</strong>님이 방금 "${product}" 프로젝트를 지지했어요.`
      : `<strong style="color:#f0f6fc;">${name}</strong>님이 댓글을 남겼습니다${type === "comment" || type === "devlog_comment" ? `, "${product}"에서` : ""}.`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>${escapeHtml(config.heading(productName))}</title>
</head>
<body style="margin:0; padding:0; background-color:#0d1117; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#161b22; border:1px solid #21262d; border-radius:16px; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Apple SD Gothic Neo','Pretendard',Roboto,'Helvetica Neue',sans-serif;">

          <!-- 헤더 -->
          <tr>
            <td style="padding:36px 40px 24px 40px;">
              <div style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace; font-size:14px; color:${config.promptColor}; letter-spacing:0.5px;">
                ${config.prompt}
              </div>
              <div style="margin-top:8px; font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace; font-size:13px; color:#8b949e;">
                ${config.status}
              </div>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:0 40px;">
              <h1 style="margin:0 0 16px 0; font-size:22px; line-height:1.4; color:#f0f6fc; font-weight:700;">
                ${escapeHtml(config.heading(productName))}
              </h1>
              <p style="margin:0 0 12px 0; font-size:15px; line-height:1.7; color:#c9d1d9;">
                ${bodyText}
              </p>
              ${preview ? `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117; border:1px solid #30363d; border-radius:10px; margin:4px 0 24px 0;">
                <tr>
                  <td style="padding:14px 16px;">
                    <div style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace; font-size:12px; color:#6e7681; margin-bottom:6px;">
                      # comment
                    </div>
                    <div style="font-size:14px; line-height:1.6; color:#e6edf3; white-space:pre-wrap; word-break:break-word;">${preview}</div>
                  </td>
                </tr>
              </table>` : `<div style="margin-bottom:16px;"></div>`}
            </td>
          </tr>

          <!-- CTA 버튼 -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px; background:${config.ctaGradient};">
                    <a href="${url}"
                       style="display:inline-block; padding:13px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;">
                      ${config.ctaLabel}
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="padding:8px 40px 36px 40px;">
              <div style="border-top:1px solid #21262d; padding-top:20px;">
                <p style="margin:0 0 4px 0; font-size:13px; line-height:1.6; color:#8b949e;">
                  이 알림을 받고 싶지 않다면
                  <a href="${appUrl()}/settings/notifications" style="color:#58a6ff; text-decoration:none;">알림 설정</a>
                  에서 언제든 끌 수 있어요.
                </p>
                <p style="margin:12px 0 0 0; font-size:12px; color:#6e7681;">
                  © ${new Date().getFullYear()} Sidedock · 메이커를 위한 공간
                </p>
              </div>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

export async function sendNotificationEmail({ userId, type, actorName, productName, productHref, commentPreview }: {
  userId: string;
  type: EngagementNotificationType;
  actorName: string;
  productName: string;
  productHref: string;
  commentPreview?: string;
}) {
  const preference = preferenceForType[type];
  if (!preference) return;

  const admin = createAdminClient();
  const [{ data: authUser }, { data: settings }] = await Promise.all([
    admin.auth.admin.getUserById(userId),
    admin.from("notification_preferences").select(preference).eq("user_id", userId).maybeSingle(),
  ]);
  if (settings && (settings as Record<string, boolean>)[preference] === false) return;
  const email = authUser.user?.email;
  if (!email) return;

  const config = typeConfig[type];
  await resend.emails.send({
    from: EMAIL_FROM,
    to: email,
    subject: config.subject(productName),
    html: EngagementEmail({ type, actorName, productName, productHref, commentPreview }),
  });
}