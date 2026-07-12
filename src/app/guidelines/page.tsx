import Link from "next/link";

export const metadata = {
  title: "제품 등록 가이드라인 | Sidedock",
  description: "Sidedock에 제품을 등록하는 방법과 기준을 안내합니다.",
};

function Section({
  num,
  title,
  children,
}: {
  num: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section>
      <div className="mb-4 flex items-center gap-3">
        <span className="font-mono text-xs font-bold text-slate-300">{num}</span>
        <h2 className="text-lg font-bold text-slate-900 dark:text-slate-100">{title}</h2>
      </div>
      <div className="pl-8">{children}</div>
    </section>
  );
}

function CheckItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-green-50 font-mono text-xs font-bold text-green-600">
        ✓
      </span>
      {children}
    </li>
  );
}

function CrossItem({ children }: { children: React.ReactNode }) {
  return (
    <li className="flex items-start gap-2 text-sm leading-relaxed">
      <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-red-50 font-mono text-xs font-bold text-red-500">
        ✕
      </span>
      {children}
    </li>
  );
}

function TipCard({
  emoji,
  title,
  children,
}: {
  emoji: string;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm dark:border-navy-800 dark:bg-navy-900">
      <div className="mb-2 flex items-center gap-2">
        <span className="text-xl">{emoji}</span>
        <span className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</span>
      </div>
      <div className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">{children}</div>
    </div>
  );
}

export default function GuidelinesPage() {
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
        <div className="mb-3 flex items-center gap-3">
          <span className="rounded-lg bg-violet-50 px-2.5 py-1 font-mono text-xs font-semibold text-violet-600">
            GUIDELINES
          </span>
          <span className="font-mono text-xs text-slate-400">v1.0.0</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 dark:text-slate-100">제품 등록 가이드라인</h1>
        <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">
          Sidedock에 제품을 올리기 전에 꼭 읽어주세요. 좋은 제품이 더 잘 발견되도록 함께 만들어가는 기준입니다.
        </p>
      </div>

      {/* TL;DR 카드 */}
      <div className="mb-12 rounded-2xl border border-violet-100 bg-violet-50 p-6 dark:border-violet-500/20 dark:bg-violet-500/10">
        <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-widest text-violet-500">TL;DR</p>
        <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300">
          실제로 만든 제품을 솔직하게 소개해 주세요. 좋은 썸네일과 명확한 설명이 있으면 더 많은 사람에게 닿습니다.
          심사는 보통 <strong>1~3일</strong> 이내에 완료되며, 반려 시 사유를 알림으로 알려드립니다.
        </p>
      </div>

      <div className="space-y-14 text-slate-700 dark:text-slate-300">

        {/* 01. 어떤 제품을 올릴 수 있나요? */}
        <Section num="01" title="어떤 제품을 올릴 수 있나요?">
          <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Sidedock은 <strong>직접 만든 제품</strong>을 공유하는 공간입니다. 사이드 프로젝트부터 스타트업 제품까지 모두 환영합니다.
          </p>
          <ul className="mb-5 space-y-2">
            <CheckItem>AI 툴, SaaS, 웹 서비스, 모바일 앱</CheckItem>
            <CheckItem>개발자 도구, 브라우저 확장, CLI 툴</CheckItem>
            <CheckItem>디자인 툴, 생산성 앱, 교육 서비스</CheckItem>
            <CheckItem>오픈소스 프로젝트 (실제 사용 가능한 것)</CheckItem>
            <CheckItem>사이드 프로젝트 — 아직 초기 단계여도 괜찮습니다</CheckItem>
          </ul>
          <ul className="space-y-2">
            <CrossItem>아직 개발 전인 아이디어만 있는 제품</CrossItem>
            <CrossItem>타인이 만든 제품 (메이커 동의 없이 등록 불가)</CrossItem>
            <CrossItem>랜딩 페이지만 있고 실제 기능이 없는 제품</CrossItem>
            <CrossItem>홍보성 링크 / 어필리에이트 링크만 있는 제품</CrossItem>
          </ul>
        </Section>

        {/* 02. 메이커 vs 헌터 */}
        <Section num="02" title="메이커 등록 vs 헌터 등록">
          <div className="mb-5 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
              <p className="mb-2 text-sm font-bold text-blue-700 dark:text-blue-300">🔨 메이커 (Maker)</p>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                직접 만든 제품을 올립니다. 제품에 대한 질문에 직접 답변하고 업데이트를 공유할 수 있습니다.
                메이커로 등록하면 프로필에 "제작자" 배지가 표시됩니다.
              </p>
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-5 dark:border-amber-500/20 dark:bg-amber-500/10">
              <p className="mb-2 text-sm font-bold text-amber-700 dark:text-amber-300">🔍 헌터 (Hunter)</p>
              <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                이미 공개된 제품을 발견해 커뮤니티에 소개합니다. ChatGPT, Cursor 같은
                공개 서비스도 등록할 수 있습니다. 단, 아래 조건을 지켜주세요.
              </p>
            </div>
          </div>

          {/* 헌터 등록 조건 */}
          <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-navy-800 dark:bg-navy-800">
            <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-slate-400">헌터 등록 조건</p>
            <ul className="mb-3 space-y-2">
              <CheckItem>제품 설명은 <strong>직접 작성</strong>하세요. 공식 사이트 문구를 그대로 복붙하면 저작권 침해입니다.</CheckItem>
              <CheckItem>이미지는 <strong>직접 캡처한 스크린샷</strong>이나 공식 프레스킷(Press Kit) 이미지를 사용하세요.</CheckItem>
              <CheckItem>이미 <strong>공개 출시된 제품</strong>만 등록할 수 있습니다. 비공개·스텔스 단계 제품은 불가합니다.</CheckItem>
              <CheckItem>메이커가 삭제를 요청하면 즉시 처리됩니다. (<a href="mailto:contact@sidedock.io" className="text-blue-500 hover:underline">contact@sidedock.io</a>)</CheckItem>
            </ul>
            <ul className="space-y-2">
              <CrossItem>공식 사이트 이미지를 무단 다운로드해 업로드하는 행위</CrossItem>
              <CrossItem>제품 설명을 원문에서 그대로 복사·붙여넣기</CrossItem>
              <CrossItem>비공개 베타 또는 출시 전 제품 무단 등록</CrossItem>
            </ul>
          </div>
        </Section>

        {/* 03. 좋은 제품 설명 작성법 */}
        <Section num="03" title="좋은 제품 설명 작성법">
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <TipCard emoji="🏷️" title="제품 이름">
              실제 서비스 이름을 그대로 쓰세요. 과장된 수식어(예: "세계 최고의")는 피해주세요.
            </TipCard>
            <TipCard emoji="💬" title="한 줄 소개 (tagline)">
              "누구를 위해, 무엇을 해주는 제품인지"를 한 문장으로 담으세요.
              예: <em>"개발자를 위한 AI 코드 리뷰 도구"</em>
            </TipCard>
            <TipCard emoji="📝" title="제품 설명">
              주요 기능 3가지, 해결하는 문제, 차별점을 포함하면 좋습니다.
              마크다운 문법(목록, 굵게 등)을 활용해 가독성을 높여보세요.
            </TipCard>
            <TipCard emoji="🏷️" title="카테고리 & 태그">
              가장 잘 맞는 카테고리를 선택하고, 태그는 핵심 키워드 위주로 5개 이내로 입력하세요.
            </TipCard>
          </div>

          {/* 예시 비교 */}
          <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-navy-800">
            <div className="grid grid-cols-2 divide-x divide-slate-100 dark:divide-navy-800">
              <div className="bg-red-50 p-4 dark:bg-red-500/10">
                <p className="mb-2 font-mono text-xs font-bold text-red-400 dark:text-red-300">✕ 이런 설명은 피하세요</p>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  "혁신적인 AI 기반의 세계 최초 차세대 플랫폼입니다. 모든 문제를 해결해드립니다. 지금 바로 가입하세요!!!"
                </p>
              </div>
              <div className="bg-green-50 p-4 dark:bg-green-500/10">
                <p className="mb-2 font-mono text-xs font-bold text-green-600 dark:text-green-300">✓ 이런 설명을 추천해요</p>
                <p className="text-xs leading-relaxed text-slate-500 dark:text-slate-400">
                  "PR을 올리면 AI가 코드 품질, 보안 취약점, 스타일 가이드를 자동으로 리뷰해줍니다. GitHub Actions와 연동되며 무료로 시작할 수 있습니다."
                </p>
              </div>
            </div>
          </div>
        </Section>

        {/* 04. 이미지 가이드 */}
        <Section num="04" title="이미지 가이드">
          <div className="mb-4 overflow-hidden rounded-2xl border border-slate-100 bg-slate-50 dark:border-navy-800 dark:bg-navy-800">
            <div className="divide-y divide-slate-100 dark:divide-navy-800">
              {[
                { label: "썸네일 권장 크기", value: "1200 × 630 px (16:9 비율)" },
                { label: "파일 형식", value: "JPG, PNG, WebP" },
                { label: "파일 크기", value: "최대 5MB" },
                { label: "갤러리 이미지", value: "최대 5장 (스크린샷, 기능 소개 등)" },
              ].map(({ label, value }) => (
                <div key={label} className="flex items-center gap-4 px-5 py-3">
                  <span className="w-36 flex-shrink-0 font-mono text-xs font-semibold text-slate-500 dark:text-slate-400">{label}</span>
                  <span className="text-sm text-slate-700 dark:text-slate-300">{value}</span>
                </div>
              ))}
            </div>
          </div>
          <ul className="space-y-2">
            <CheckItem>제품 로고나 대표 화면을 썸네일로 사용하세요</CheckItem>
            <CheckItem>갤러리에는 주요 기능 스크린샷을 넣으면 전환율이 높아집니다</CheckItem>
            <CrossItem>저작권이 있는 이미지, 타인의 사진을 무단 사용하지 마세요</CrossItem>
            <CrossItem>텍스트가 너무 많은 이미지는 가독성이 떨어집니다</CrossItem>
          </ul>
        </Section>

        {/* 05. 심사 기준 */}
        <Section num="05" title="심사 기준 및 프로세스">
          <div className="mb-6 flex items-center gap-0 overflow-hidden rounded-2xl border border-slate-100 dark:border-navy-800">
            {[
              { step: "01", label: "제출", desc: "심사 대기 상태로 등록", color: "bg-slate-50 dark:bg-navy-800" },
              { step: "02", label: "검토", desc: "운영팀 1~3일 내 확인", color: "bg-blue-50 dark:bg-blue-500/10" },
              { step: "03", label: "공개", desc: "승인 시 즉시 노출", color: "bg-green-50 dark:bg-green-500/10" },
            ].map(({ step, label, desc, color }, i) => (
              <div key={step} className={`flex-1 ${color} px-4 py-4 ${i < 2 ? "border-r border-slate-100 dark:border-navy-800" : ""}`}>
                <p className="font-mono text-xs font-bold text-slate-400">{step}</p>
                <p className="mt-1 text-sm font-bold text-slate-900 dark:text-slate-100">{label}</p>
                <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>

          <p className="mb-3 text-sm font-semibold text-slate-700 dark:text-slate-300">다음에 해당하면 반려될 수 있습니다:</p>
          <ul className="space-y-2">
            <CrossItem>실제 접속·사용이 불가능한 제품 (URL 오류, 준비 중 페이지 등)</CrossItem>
            <CrossItem>동일 제품 중복 등록 (재출시·업데이트는 운영팀에 문의)</CrossItem>
            <CrossItem>설명이 너무 부족하거나 허위·과장된 내용 포함</CrossItem>
            <CrossItem>이용약관 제6조의 금지 행위에 해당하는 콘텐츠</CrossItem>
            <CrossItem>메이커 동의 없이 타인의 제품을 헌터로 등록한 경우</CrossItem>
          </ul>

          <div className="mt-5 rounded-xl border border-blue-100 bg-blue-50 p-4 text-sm text-blue-800 dark:border-blue-500/20 dark:bg-blue-500/10 dark:text-blue-300">
            💡 반려된 경우 사유를 확인 후 내용을 수정하여 재제출할 수 있습니다. 문의는 아래 이메일로 보내주세요.
          </div>
        </Section>

        {/* 06. Dev Log */}
        <Section num="06" title="Dev Log 작성 가이드">
          <p className="mb-4 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Dev Log는 제품 개발 과정, 기술 인사이트, 런칭 후기 등을 자유롭게 공유하는 공간입니다.
            심사 없이 즉시 공개되며, 마크다운 문법을 지원합니다.
          </p>
          <ul className="mb-4 space-y-2">
            <CheckItem>개발 과정의 실패와 배움을 솔직하게 나눠주세요</CheckItem>
            <CheckItem>기술 스택 선택 이유, 아키텍처 결정 등 구체적인 내용이 좋습니다</CheckItem>
            <CheckItem>런칭 후 지표 공유 (트래픽, 사용자 수 등)는 커뮤니티에 큰 도움이 됩니다</CheckItem>
          </ul>
          <ul className="space-y-2">
            <CrossItem>홍보 목적의 단순 광고성 글은 삭제될 수 있습니다</CrossItem>
            <CrossItem>타인의 글을 복사하거나 AI로만 생성된 내용을 그대로 붙여넣지 마세요</CrossItem>
          </ul>
        </Section>

        {/* 07. 커뮤니티 에티켓 */}
        <Section num="07" title="커뮤니티 에티켓">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {[
              { emoji: "🤝", title: "서로를 응원해요", desc: "댓글은 건설적인 피드백 위주로, 비방·비하 표현은 자제해 주세요." },
              { emoji: "🚀", title: "진정성 있는 부스트", desc: "실제로 좋다고 생각하는 제품에만 Boost해 주세요. 상호 부스트 조작은 금지입니다." },
              { emoji: "💬", title: "질문에 답변해요", desc: "메이커라면 댓글 질문에 성실히 답변해 주세요. 커뮤니티의 신뢰가 쌓입니다." },
              { emoji: "📣", title: "스팸 없는 홍보", desc: "자신의 제품을 소개하는 건 좋지만, 다른 글에 반복적으로 홍보 댓글을 다는 건 금지입니다." },
            ].map(({ emoji, title, desc }) => (
              <TipCard key={title} emoji={emoji} title={title}>{desc}</TipCard>
            ))}
          </div>
        </Section>

      </div>

      {/* 문의 */}
      <div className="mt-16 rounded-2xl border border-slate-200 bg-slate-50 p-6 dark:border-navy-800 dark:bg-navy-800">
        <p className="mb-1 font-mono text-xs font-semibold uppercase tracking-widest text-slate-400">Contact</p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          가이드라인 관련 문의 또는 헌터 등록 협의:{" "}
          <a href="mailto:contact@sidedock.io" className="font-medium text-blue-600 hover:underline">
            contact@sidedock.io
          </a>
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Link
            href="/terms"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 dark:border-navy-800 dark:bg-navy-900 dark:text-slate-300"
          >
            이용약관 →
          </Link>
          <Link
            href="/privacy"
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-slate-400 dark:border-navy-800 dark:bg-navy-900 dark:text-slate-300"
          >
            개인정보처리방침 →
          </Link>
          <Link
            href="/submit"
            className="rounded-lg bg-slate-900 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-slate-700"
          >
            제품 등록하기 →
          </Link>
        </div>
      </div>
    </div>
  );
}
