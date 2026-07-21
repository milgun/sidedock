interface ApprovedEmailProps {
  productName: string;
  slug: string;
}

interface RejectedEmailProps {
  productName: string;
  reason: string;
}

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

/** 승인 메일 — 배포 성공 톤 (녹색 프롬프트) */
export function ProductApprovedEmail({ productName, slug }: ApprovedEmailProps): string {
  const url = appUrl();
  const name = escapeHtml(productName);
  const productUrl = `${url}/products/${encodeURIComponent(slug)}`;

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>제품이 승인되었습니다</title>
</head>
<body style="margin:0; padding:0; background-color:#0d1117; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#161b22; border:1px solid #21262d; border-radius:16px; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Apple SD Gothic Neo','Pretendard',Roboto,'Helvetica Neue',sans-serif;">

          <!-- 헤더 -->
          <tr>
            <td style="padding:36px 40px 24px 40px;">
              <div style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace; font-size:14px; color:#7ee787; letter-spacing:0.5px;">
                $ deploy --status success
              </div>
              <div style="margin-top:8px; font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace; font-size:13px; color:#8b949e;">
                ✓ review passed &nbsp;·&nbsp; 🚀 now live
              </div>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:0 40px;">
              <h1 style="margin:0 0 16px 0; font-size:24px; line-height:1.4; color:#f0f6fc; font-weight:700;">
                축하해요, "${name}" 가 공개됐어요! 🎉
              </h1>
              <p style="margin:0 0 12px 0; font-size:15px; line-height:1.7; color:#c9d1d9;">
                심사를 통과했습니다. 이제 당신의 프로젝트가
                <strong style="color:#f0f6fc;">Sidedock</strong> 에 라이브로 올라갔어요.
              </p>
              <p style="margin:0 0 28px 0; font-size:15px; line-height:1.7; color:#c9d1d9;">
                같은 길을 걷는 메이커들이 업보트와 피드백으로 응원할 차례입니다.
                런칭 소식을 트위터나 커뮤니티에 공유해 첫 관심을 모아보세요.
              </p>
            </td>
          </tr>

          <!-- CTA 버튼 -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px; background:linear-gradient(135deg,#238636,#2ea043);">
                    <a href="${productUrl}"
                       style="display:inline-block; padding:13px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;">
                      내 제품 보러가기 →
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
                  궁금한 점이 있다면 언제든
                  <a href="mailto:contact@sidedock.io" style="color:#58a6ff; text-decoration:none;">contact@sidedock.io</a>
                  로 답장해주세요.
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

/** 반려 메일 — 빌드 실패 톤 (앰버 프롬프트, 하지만 격려 중심) */
export function ProductRejectedEmail({ productName, reason }: RejectedEmailProps): string {
  const url = appUrl();
  const name = escapeHtml(productName);
  const safeReason = escapeHtml(reason);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>제품 심사 결과 안내</title>
</head>
<body style="margin:0; padding:0; background-color:#0d1117; -webkit-font-smoothing:antialiased;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117; padding:40px 16px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px; background-color:#161b22; border:1px solid #21262d; border-radius:16px; overflow:hidden; font-family:-apple-system,BlinkMacSystemFont,'Segoe UI','Apple SD Gothic Neo','Pretendard',Roboto,'Helvetica Neue',sans-serif;">

          <!-- 헤더 -->
          <tr>
            <td style="padding:36px 40px 24px 40px;">
              <div style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace; font-size:14px; color:#f0883e; letter-spacing:0.5px;">
                $ deploy --status failed
              </div>
              <div style="margin-top:8px; font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace; font-size:13px; color:#8b949e;">
                ⚠ review did not pass &nbsp;·&nbsp; exit code 1
              </div>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:0 40px;">
              <h1 style="margin:0 0 16px 0; font-size:24px; line-height:1.4; color:#f0f6fc; font-weight:700;">
                "${name}" 는 이번엔 통과하지 못했어요
              </h1>
              <p style="margin:0 0 20px 0; font-size:15px; line-height:1.7; color:#c9d1d9;">
                아쉽지만 제출해주신 제품이 이번 심사를 통과하지 못했습니다.
                아래 사유를 확인해주세요.
              </p>
            </td>
          </tr>

          <!-- 반려 사유 (터미널 로그 스타일) -->
          <tr>
            <td style="padding:0 40px 24px 40px;">
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#0d1117; border:1px solid #30363d; border-radius:10px;">
                <tr>
                  <td style="padding:16px 18px;">
                    <div style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace; font-size:12px; color:#6e7681; margin-bottom:8px;">
                      # rejection reason
                    </div>
                    <div style="font-family:ui-monospace,SFMono-Regular,'SF Mono',Menlo,Consolas,monospace; font-size:14px; line-height:1.7; color:#f0883e; white-space:pre-wrap; word-break:break-word;">${safeReason}</div>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 격려 -->
          <tr>
            <td style="padding:0 40px;">
              <p style="margin:0 0 28px 0; font-size:15px; line-height:1.7; color:#c9d1d9;">
                괜찮아요, 대부분 사유를 반영해 수정한 뒤 재제출하면 통과합니다.
                아래에서 바로 고쳐서 다시 제출해보세요.
              </p>
            </td>
          </tr>

          <!-- CTA 버튼 -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px; border:1px solid #30363d; background-color:#21262d;">
                    <a href="${url}/submit"
                       style="display:inline-block; padding:13px 28px; font-size:15px; font-weight:600; color:#f0f6fc; text-decoration:none; border-radius:10px;">
                      수정하고 재제출 →
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
                  사유가 이해되지 않거나 이의가 있다면 언제든
                  <a href="mailto:contact@sidedock.io" style="color:#58a6ff; text-decoration:none;">contact@sidedock.io</a>
                  로 답장해주세요.
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
