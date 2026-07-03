interface WelcomeEmailProps {
  username: string;
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

export function WelcomeEmail({ username }: WelcomeEmailProps): string {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://sidedock.io";
  const name = escapeHtml(username);

  return `<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Sidedock에 오신 것을 환영합니다</title>
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
                $ welcome --to sidedock
              </div>
            </td>
          </tr>

          <!-- 본문 -->
          <tr>
            <td style="padding:0 40px;">
              <h1 style="margin:0 0 16px 0; font-size:24px; line-height:1.4; color:#f0f6fc; font-weight:700;">
                반가워요, ${name}님 👋
              </h1>
              <p style="margin:0 0 12px 0; font-size:15px; line-height:1.7; color:#c9d1d9;">
                <strong style="color:#f0f6fc;">Sidedock</strong> 가입을 축하합니다!<br />
                이제 당신의 사이드 프로젝트를 세상에 선보일 준비가 끝났어요.
              </p>
              <p style="margin:0 0 28px 0; font-size:15px; line-height:1.7; color:#c9d1d9;">
                만들고 있는 무언가가 있다면, 망설이지 말고 공유해보세요.
                같은 길을 걷는 메이커들이 당신의 프로젝트를 기다리고 있습니다.
              </p>
            </td>
          </tr>

          <!-- CTA 버튼 -->
          <tr>
            <td style="padding:0 40px 32px 40px;">
              <table role="presentation" cellpadding="0" cellspacing="0">
                <tr>
                  <td style="border-radius:10px; background:linear-gradient(135deg,#238636,#2ea043);">
                    <a href="${appUrl}"
                       style="display:inline-block; padding:13px 28px; font-size:15px; font-weight:600; color:#ffffff; text-decoration:none; border-radius:10px;">
                      프로젝트 둘러보기 →
                    </a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- 빠른 시작 가이드 -->
          <tr>
            <td style="padding:0 40px 8px 40px;">
              <div style="border-top:1px solid #21262d; padding-top:24px;">
                <p style="margin:0 0 14px 0; font-size:13px; color:#8b949e; font-weight:600; text-transform:uppercase; letter-spacing:0.5px;">
                  이렇게 시작해보세요
                </p>
                <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
                  <tr>
                    <td style="padding:6px 0; font-size:14px; color:#c9d1d9;">
                      <span style="color:#7ee787; font-family:ui-monospace,monospace;">01</span>&nbsp;&nbsp;프로필을 완성하고 나를 소개하기
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; font-size:14px; color:#c9d1d9;">
                      <span style="color:#7ee787; font-family:ui-monospace,monospace;">02</span>&nbsp;&nbsp;첫 프로젝트 등록하기
                    </td>
                  </tr>
                  <tr>
                    <td style="padding:6px 0; font-size:14px; color:#c9d1d9;">
                      <span style="color:#7ee787; font-family:ui-monospace,monospace;">03</span>&nbsp;&nbsp;마음에 드는 프로젝트에 업보트 남기기
                    </td>
                  </tr>
                </table>
              </div>
            </td>
          </tr>

          <!-- 푸터 -->
          <tr>
            <td style="padding:28px 40px 36px 40px;">
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
