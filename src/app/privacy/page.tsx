import Link from "next/link";

export const metadata = {
  title: "개인정보처리방침 | Sidedock",
  description: "Sidedock 개인정보처리방침",
};

const LAST_UPDATED = "2026년 5월 31일";
const EFFECTIVE_DATE = "2026년 5월 31일";

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      {/* 헤더 */}
      <div className="mb-12">
        <Link
          href="/"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-700"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          홈으로
        </Link>
        <div className="flex items-center gap-3 mb-3">
          <span className="rounded-lg bg-green-50 px-2.5 py-1 font-mono text-xs font-semibold text-green-700">
            PRIVACY
          </span>
          <span className="font-mono text-xs text-slate-400">v1.0.0</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-slate-500">
          최종 수정일: {LAST_UPDATED} &nbsp;·&nbsp; 시행일: {EFFECTIVE_DATE}
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="mb-12 rounded-2xl border border-green-100 bg-green-50 p-6">
        <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-widest text-green-600">TL;DR</p>
        <p className="text-sm leading-relaxed text-slate-700">
          Sidedock은 서비스 운영에 필요한 최소한의 정보만 수집합니다. 광고 목적으로 개인정보를 판매하거나 제3자에게 무단 제공하지 않습니다.
          회원은 언제든지 자신의 데이터를 수정하거나 삭제(계정 탈퇴)를 요청할 수 있습니다.
        </p>
      </div>

      <div className="space-y-12 text-slate-700">

        {/* 수집 항목 */}
        <Section num="01" title="수집하는 개인정보 항목">
          <p className="mb-4 text-sm leading-relaxed">
            Sidedock은 소셜 OAuth(Google, Kakao)를 통해서만 가입을 지원합니다. 직접 비밀번호를 수집하거나 저장하지 않습니다.
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">항목</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">수집 경로</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">필수 여부</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { item: "이메일 주소", source: "Google / Kakao OAuth", required: true },
                  { item: "소셜 프로필 이름", source: "Google / Kakao OAuth", required: true },
                  { item: "소셜 프로필 이미지 URL", source: "Google / Kakao OAuth", required: false },
                  { item: "닉네임(username)", source: "온보딩 폼 직접 입력", required: true },
                  { item: "표시 이름(display name)", source: "온보딩 폼 직접 입력", required: true },
                  { item: "자기소개(bio)", source: "프로필 설정", required: false },
                  { item: "웹사이트 URL", source: "프로필 설정", required: false },
                  { item: "Twitter URL", source: "프로필 설정", required: false },
                  { item: "IP 주소 / 접속 로그", source: "서버 자동 수집", required: false },
                ].map(({ item, source, required }) => (
                  <tr key={item} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{item}</td>
                    <td className="px-4 py-3 text-slate-500">{source}</td>
                    <td className="px-4 py-3">
                      {required ? (
                        <span className="rounded-full bg-blue-50 px-2 py-0.5 font-mono text-xs text-blue-600">필수</span>
                      ) : (
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 font-mono text-xs text-slate-400">선택</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 수집 목적 */}
        <Section num="02" title="수집 및 이용 목적">
          <ul className="space-y-3 text-sm">
            {[
              { icon: "👤", title: "회원 식별 및 인증", desc: "소셜 OAuth 기반 로그인 처리, 계정 관리" },
              { icon: "🚀", title: "서비스 제공", desc: "제품 등록, 업보트, 댓글, Dev Log 등 핵심 기능 운영" },
              { icon: "🛡️", title: "부정 이용 방지", desc: "중복 계정 탐지, 스팸/어뷰징 차단" },
              { icon: "📊", title: "서비스 개선", desc: "익명화된 이용 통계 분석 (개인 식별 불가)" },
              { icon: "📢", title: "서비스 공지", desc: "중요한 정책 변경 및 공지 사항 전달 (이메일)" },
            ].map(({ icon, title, desc }) => (
              <li key={title} className="flex items-start gap-3">
                <span className="mt-0.5 flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg bg-slate-100 text-sm">
                  {icon}
                </span>
                <div>
                  <p className="font-semibold text-slate-900">{title}</p>
                  <p className="text-slate-500">{desc}</p>
                </div>
              </li>
            ))}
          </ul>
        </Section>

        {/* 보유 기간 */}
        <Section num="03" title="개인정보 보유 및 이용 기간">
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">구분</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">보유 기간</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">근거</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {[
                  { type: "회원 계정 정보", period: "회원 탈퇴 즉시 삭제", basis: "서비스 이용 계약 종료" },
                  { type: "게시 콘텐츠 (제품·댓글·Dev Log)", period: "탈퇴 즉시 삭제 (또는 익명화)", basis: "서비스 이용 계약 종료" },
                  { type: "서버 접속 로그", period: "최대 3개월", basis: "통신비밀보호법" },
                  { type: "결제 정보", period: "해당 없음 (유료 기능 없음)", basis: "—" },
                ].map(({ type, period, basis }) => (
                  <tr key={type} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-medium text-slate-900">{type}</td>
                    <td className="px-4 py-3 text-slate-600">{period}</td>
                    <td className="px-4 py-3 text-slate-400">{basis}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        {/* 제3자 제공 */}
        <Section num="04" title="개인정보의 제3자 제공">
          <p className="mb-4 text-sm leading-relaxed">
            Sidedock은 원칙적으로 회원의 개인정보를 외부에 제공하지 않습니다. 다만, 다음의 경우는 예외입니다.
          </p>
          <ul className="space-y-2 text-sm">
            {[
              "회원이 직접 동의한 경우",
              "법령의 규정에 따라 수사기관 등 법적 의무에 따른 요청이 있는 경우",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-blue-50 font-mono text-xs font-bold text-blue-500">
                  {i + 1}
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* 처리 위탁 */}
        <Section num="05" title="개인정보 처리 위탁">
          <p className="mb-4 text-sm leading-relaxed">
            서비스 운영을 위해 아래 업체에 개인정보 처리를 위탁합니다.
          </p>
          <div className="overflow-hidden rounded-xl border border-slate-200">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50">
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">수탁 업체</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">위탁 내용</th>
                  <th className="px-4 py-3 text-left font-semibold text-slate-700">소재지</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {[
                  { vendor: "Supabase Inc.", task: "데이터베이스 및 인증 인프라 운영", country: "미국" },
                  { vendor: "Vercel Inc.", task: "웹 애플리케이션 호스팅", country: "미국" },
                  { vendor: "Google LLC", task: "OAuth 인증 (Google 로그인)", country: "미국" },
                  { vendor: "Kakao Corp.", task: "OAuth 인증 (카카오 로그인)", country: "대한민국" },
                ].map(({ vendor, task, country }) => (
                  <tr key={vendor} className="hover:bg-slate-50">
                    <td className="px-4 py-3 font-mono text-xs font-semibold text-slate-900">{vendor}</td>
                    <td className="px-4 py-3 text-slate-600">{task}</td>
                    <td className="px-4 py-3 text-slate-400">{country}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-slate-400">
            * Supabase, Vercel은 미국 소재 서버를 사용합니다. 국외 이전에 동의한 것으로 간주합니다.
          </p>
        </Section>

        {/* 쿠키 */}
        <Section num="06" title="쿠키(Cookie) 및 세션">
          <p className="mb-4 text-sm leading-relaxed">
            서비스는 로그인 상태 유지를 위해 Supabase가 발급하는 인증 토큰을 쿠키 또는 로컬 스토리지에 저장합니다.
          </p>
          <CodeBlock lines={[
            "// 사용하는 쿠키",
            "sb-<project_id>-auth-token  // Supabase 세션 토큰 (인증 필수)",
            "",
            "// 사용하지 않는 것",
            "// - 광고 추적 쿠키",
            "// - 제3자 분석 쿠키 (Google Analytics 등)",
            "// - 행동 타겟팅 쿠키",
          ]} />
          <p className="mt-3 text-sm text-slate-500">
            브라우저 설정에서 쿠키를 거부할 수 있으나, 로그인 기능이 작동하지 않을 수 있습니다.
          </p>
        </Section>

        {/* 정보주체의 권리 */}
        <Section num="07" title="정보주체의 권리">
          <p className="mb-4 text-sm leading-relaxed">
            회원은 자신의 개인정보에 대해 다음과 같은 권리를 행사할 수 있습니다.
          </p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
            {[
              { icon: "👁️", title: "열람", desc: "수집된 정보 확인" },
              { icon: "✏️", title: "수정", desc: "프로필에서 직접 변경" },
              { icon: "🗑️", title: "삭제", desc: "계정 탈퇴 요청" },
              { icon: "🚫", title: "처리 정지", desc: "특정 목적 이용 거부" },
              { icon: "📦", title: "이동", desc: "데이터 내보내기 요청" },
              { icon: "📝", title: "동의 철회", desc: "서비스 탈퇴로 처리" },
            ].map(({ icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-slate-100 bg-white p-4 text-center">
                <div className="mb-2 text-2xl">{icon}</div>
                <p className="text-sm font-semibold text-slate-900">{title}</p>
                <p className="text-xs text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
          <p className="mt-4 text-xs text-slate-400">
            권리 행사는 아래 이메일로 요청하세요. 10일 이내 처리됩니다.
          </p>
        </Section>

        {/* 미성년자 */}
        <Section num="08" title="미성년자 보호">
          <p className="text-sm leading-relaxed">
            Sidedock은 만 14세 미만 아동의 개인정보를 의도적으로 수집하지 않습니다.
            만 14세 미만인 경우 서비스 이용을 삼가 주세요. 만 14세 미만 아동의 정보가 수집된 것이 확인될 경우 즉시 삭제 조치합니다.
          </p>
        </Section>

        {/* 보안 */}
        <Section num="09" title="개인정보 보호 조치">
          <p className="mb-4 text-sm leading-relaxed">
            Sidedock은 개인정보 보호를 위해 다음과 같은 기술적·관리적 조치를 취합니다.
          </p>
          <CodeBlock lines={[
            "// 기술적 조치",
            "✓ HTTPS (TLS 1.3) 전송 암호화",
            "✓ Supabase Row Level Security (RLS) — 본인 데이터만 접근 가능",
            "✓ OAuth 전용 인증 (비밀번호 직접 저장 없음)",
            "✓ 환경 변수 분리 — API 키 소스코드 미포함",
            "",
            "// 관리적 조치",
            "✓ 최소 권한 원칙 — 필요한 데이터만 수집",
            "✓ 정기적인 의존성 보안 업데이트",
            "✓ 개인정보 처리 내역 기록 유지",
          ]} />
        </Section>

        {/* 개인정보 보호책임자 */}
        <Section num="10" title="개인정보 보호책임자">
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
            <div className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="mb-0.5 font-mono text-xs text-slate-400">개인정보 보호책임자</p>
                <p className="font-semibold text-slate-900">Sidedock 운영팀</p>
              </div>
              <div>
                <p className="mb-0.5 font-mono text-xs text-slate-400">이메일</p>
                <a href="mailto:privacy@sidedock.io" className="font-medium text-blue-600 hover:underline">
                  privacy@sidedock.io
                </a>
              </div>
              <div className="sm:col-span-2">
                <p className="mb-0.5 font-mono text-xs text-slate-400">처리 기간</p>
                <p className="text-slate-600">요청 접수 후 영업일 10일 이내</p>
              </div>
            </div>
            <p className="mt-4 border-t border-slate-200 pt-4 text-xs text-slate-400">
              개인정보 침해에 대한 신고·상담은{" "}
              <a href="https://privacy.kisa.or.kr" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                개인정보침해신고센터(privacy.kisa.or.kr)
              </a>{" "}
              또는{" "}
              <a href="https://www.kopico.go.kr" target="_blank" rel="noopener noreferrer" className="underline hover:text-slate-600">
                개인정보분쟁조정위원회(kopico.go.kr)
              </a>
              에 문의하실 수 있습니다.
            </p>
          </div>
        </Section>

        {/* 하단 링크 */}
        <div className="flex items-center gap-4 border-t border-slate-100 pt-8 text-sm text-slate-400">
          <Link href="/terms" className="hover:text-slate-700 hover:underline">이용약관</Link>
          <span>·</span>
          <span className="font-medium text-slate-700">개인정보처리방침</span>
          <span>·</span>
          <Link href="/" className="hover:text-slate-700 hover:underline">홈으로</Link>
        </div>

      </div>
    </div>
  );
}

function Section({ num, title, children }: { num: string; title: string; children: React.ReactNode }) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-xs font-bold text-slate-300">§{num}</span>
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
      </div>
      {children}
    </section>
  );
}

function CodeBlock({ lines }: { lines: string[] }) {
  return (
    <div className="overflow-x-auto rounded-xl border border-slate-200 bg-navy-950 p-4">
      <pre className="font-mono text-xs leading-relaxed text-slate-300">
        {lines.map((line, i) => (
          <div key={i} className={line.startsWith("//") ? "text-slate-500" : line === "" ? "h-3" : ""}>
            {line}
          </div>
        ))}
      </pre>
    </div>
  );
}
