import Link from "next/link";

export const metadata = {
  title: "이용약관 | Sidedock",
  description: "Sidedock 서비스 이용약관",
};

const LAST_UPDATED = "2026년 5월 31일";
const EFFECTIVE_DATE = "2026년 5월 31일";

export default function TermsPage() {
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
          <span className="rounded-lg bg-blue-50 px-2.5 py-1 font-mono text-xs font-semibold text-blue-600">
            LEGAL
          </span>
          <span className="font-mono text-xs text-slate-400">v1.0.0</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900">이용약관</h1>
        <p className="mt-2 text-sm text-slate-500">
          최종 수정일: {LAST_UPDATED} &nbsp;·&nbsp; 시행일: {EFFECTIVE_DATE}
        </p>
      </div>

      {/* 요약 카드 */}
      <div className="mb-12 rounded-2xl border border-blue-100 bg-blue-50 p-6">
        <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-widest text-blue-500">TL;DR</p>
        <p className="text-sm leading-relaxed text-slate-700">
          Sidedock은 한국 메이커들을 위한 제품 공유 커뮤니티입니다. 만든 것을 등록하고, 피드백을 주고받고, 서로 응원하는 공간입니다.
          불법 콘텐츠 업로드, 타인 사칭, 스팸 행위는 금지됩니다. 서비스는 현재 상태("as-is")로 제공됩니다.
        </p>
      </div>

      <div className="space-y-12 text-slate-700">

        {/* 제1조 */}
        <Section num="01" title="목적">
          <p>
            이 약관은 Sidedock(이하 "서비스")이 제공하는 모든 서비스의 이용 조건 및 절차, 회원과 서비스 간의 권리·의무 및 책임 사항을 규정함을 목적으로 합니다.
          </p>
        </Section>

        {/* 제2조 */}
        <Section num="02" title="정의">
          <dl className="space-y-3">
            {[
              { term: "서비스", def: "Sidedock이 운영하는 웹사이트 및 관련 서비스 일체" },
              { term: "회원", def: "서비스에 가입하여 이용약관에 동의한 자" },
              { term: "메이커(Maker)", def: "서비스에 직접 개발한 제품을 등록하는 회원" },
              { term: "제품(Product)", def: "메이커가 서비스에 등록한 AI 툴, SaaS, 사이드 프로젝트 등" },
              { term: "Dev Log", def: "회원이 제품 개발 과정을 기록한 게시물" },
              { term: "업보트(Upvote)", def: "다른 회원의 제품에 지지를 표현하는 기능" },
            ].map(({ term, def }) => (
              <div key={term} className="flex gap-4">
                <dt className="w-36 flex-shrink-0 font-mono text-sm font-semibold text-slate-900">{term}</dt>
                <dd className="text-sm leading-relaxed">{def}</dd>
              </div>
            ))}
          </dl>
        </Section>

        {/* 제3조 */}
        <Section num="03" title="약관의 게시 및 변경">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li>서비스는 이 약관의 내용을 서비스 내에 게시합니다.</li>
            <li>서비스는 관련 법령을 위배하지 않는 범위에서 약관을 개정할 수 있습니다.</li>
            <li>약관이 변경되는 경우, 변경 사항을 시행일 7일 전부터 서비스 공지사항 또는 이메일로 고지합니다.</li>
            <li>변경된 약관에 동의하지 않는 회원은 회원 탈퇴를 요청할 수 있으며, 변경 시행일 이후 계속 이용 시 약관 변경에 동의한 것으로 봅니다.</li>
          </ol>
        </Section>

        {/* 제4조 */}
        <Section num="04" title="회원가입 및 계정">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li>서비스는 Google, Kakao 등 소셜 OAuth를 통한 회원가입만을 지원합니다. 별도의 비밀번호를 저장하지 않습니다.</li>
            <li>회원은 가입 시 닉네임(username)을 설정해야 하며, 닉네임은 영문 소문자·숫자·밑줄(_)만 사용 가능하고 3~20자여야 합니다.</li>
            <li>타인을 사칭하거나 허위 정보를 등록하는 경우 서비스 이용이 제한될 수 있습니다.</li>
            <li>계정 보안은 회원 본인의 책임이며, 소셜 로그인 계정 탈취 등으로 인한 피해에 대해 서비스는 책임을 지지 않습니다.</li>
            <li>1인 1계정 원칙을 준수해야 하며, 다중 계정 생성은 금지됩니다.</li>
          </ol>
        </Section>

        {/* 제5조 */}
        <Section num="05" title="서비스 이용">
          <p className="mb-4 text-sm leading-relaxed">서비스를 통해 다음 기능을 이용할 수 있습니다.</p>
          <CodeBlock lines={[
            "// 누구나 (비로그인 포함)",
            "GET  /           → 메인 피드 열람",
            "GET  /launches   → 신규 런치 목록 열람",
            "GET  /hot        → Hot Products 열람",
            "GET  /products/:id → 제품 상세 열람",
            "",
            "// 로그인 회원",
            "POST /submit     → 제품 등록 (검토 후 공개)",
            "POST /upvote     → 업보트",
            "POST /comment    → 댓글 작성",
            "POST /devlog/new → Dev Log 작성",
            "GET  /profile/:username → 프로필 열람",
          ]} />
        </Section>

        {/* 제6조 */}
        <Section num="06" title="금지 행위">
          <p className="mb-3 text-sm">다음 행위는 엄격히 금지됩니다. 위반 시 사전 통보 없이 계정이 정지 또는 삭제될 수 있습니다.</p>
          <ul className="space-y-2 text-sm">
            {[
              "타인의 저작권·상표권·특허권 등 지식재산권을 침해하는 콘텐츠 게시",
              "음란물, 혐오 표현, 폭력적 콘텐츠 게시",
              "다른 회원 또는 제3자를 사칭하거나 허위 정보 유포",
              "스팸, 광고성 도배 행위 (본인의 실제 제품 등록 제외)",
              "악성 코드, 피싱 링크 등 보안 위협 요소 게시",
              "서비스 시스템에 대한 무단 접근 · DoS 공격 · 크롤링 남용",
              "다중 계정 생성을 통한 업보트 조작",
              "관련 법령에 위반되는 모든 행위",
            ].map((item, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-50 font-mono text-xs font-bold text-red-500">
                  ✕
                </span>
                {item}
              </li>
            ))}
          </ul>
        </Section>

        {/* 제7조 */}
        <Section num="07" title="제품 등록 및 검토">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li>등록된 제품은 운영팀의 검토를 거친 후 공개됩니다. 검토 기간은 통상 2~3일입니다.</li>
            <li>운영팀은 다음 기준에 따라 제품을 반려할 수 있습니다.
              <ul className="mt-2 ml-4 space-y-1 list-disc text-slate-500">
                <li>실제 서비스하지 않는 제품 또는 테스트 목적의 등록</li>
                <li>제6조에 해당하는 콘텐츠 포함</li>
                <li>중복 등록 (동일 제품의 재등록 시 운영팀 협의 필요)</li>
                <li>허위 또는 과장된 설명</li>
              </ul>
            </li>
            <li>공개된 제품도 추후 정책 위반이 확인되면 비공개 처리될 수 있습니다.</li>
            <li>제품 등록자(메이커)는 자신이 등록한 제품에 대한 모든 책임을 집니다.</li>
          </ol>
        </Section>

        {/* 제8조 */}
        <Section num="08" title="지식재산권">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li>서비스의 로고, UI, 소스 코드 등에 대한 저작권은 서비스에 귀속됩니다.</li>
            <li>회원이 게시한 콘텐츠(제품 설명, 댓글, Dev Log 등)의 저작권은 해당 회원에게 있습니다.</li>
            <li>회원은 서비스에 콘텐츠를 게시함으로써, 서비스가 해당 콘텐츠를 서비스 운영·홍보 목적으로 사용할 수 있는 비독점적·무상의 라이선스를 서비스에 부여합니다.</li>
          </ol>
        </Section>

        {/* 제9조 */}
        <Section num="09" title="서비스 제공 및 중단">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li>서비스는 연중 24시간 제공을 원칙으로 하되, 시스템 점검·장애·천재지변 등의 사유로 일시 중단될 수 있습니다.</li>
            <li>서비스는 서비스 전부 또는 일부를 사전 고지 후 변경하거나 종료할 수 있습니다.</li>
            <li>서비스 중단으로 인한 손해에 대해, 서비스의 고의 또는 중과실이 없는 한 책임을 지지 않습니다.</li>
          </ol>
        </Section>

        {/* 제10조 */}
        <Section num="10" title="면책 조항">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm leading-relaxed text-amber-800">
            <p className="mb-2 font-semibold">⚠️ 주의 사항</p>
            <p>
              서비스는 현재 상태("as-is")로 제공되며, 서비스의 가용성·정확성·완전성에 대해 보증하지 않습니다.
              회원 간 또는 회원과 제3자 간에 발생하는 분쟁에 대해 서비스는 관여하지 않습니다.
              등록된 제품의 품질·안전성에 대한 책임은 전적으로 해당 메이커에게 있습니다.
            </p>
          </div>
        </Section>

        {/* 제11조 */}
        <Section num="11" title="분쟁 해결">
          <ol className="list-decimal space-y-2 pl-5 text-sm leading-relaxed">
            <li>이 약관에서 발생하는 분쟁에 관한 소송의 관할 법원은 대한민국 법원으로 합니다.</li>
            <li>준거법은 대한민국 법령을 따릅니다.</li>
            <li>분쟁 발생 시 먼저 아래 연락처로 문의해 주세요.</li>
          </ol>
        </Section>

        {/* 문의 */}
        <div className="rounded-2xl border border-slate-200 bg-slate-50 p-6">
          <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">Contact</p>
          <p className="text-sm text-slate-600">
            이용약관 관련 문의:{" "}
            <a href="mailto:contact@sidedock.io" className="font-medium text-blue-600 hover:underline">
              contact@sidedock.io
            </a>
          </p>
          <p className="mt-1 text-xs text-slate-400">
            개인정보 관련 문의는{" "}
            <Link href="/privacy" className="underline hover:text-slate-600">개인정보처리방침</Link>
            을 참고하세요.
          </p>
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
