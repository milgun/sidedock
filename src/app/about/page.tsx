import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sidedock.io";

export const metadata: Metadata = {
  title: { absolute: "Sidedock 소개 — 한국 메이커를 위한 런칭·발견 플랫폼" },
  description:
    "한국 메이커들의 AI 툴, SaaS, 사이드 프로젝트를 발견하고 공유하는 플랫폼 Sidedock을 소개합니다.",
  alternates: { canonical: "/about" },
  openGraph: {
    title: "Sidedock 소개 — 한국 메이커를 위한 런칭·발견 플랫폼",
    description:
      "한국 메이커들의 AI 툴, SaaS, 사이드 프로젝트를 발견하고 공유하는 플랫폼 Sidedock을 소개합니다.",
    type: "website",
    locale: "ko_KR",
    images: [{ url: "/og-default.png", width: 1200, height: 630 }],
  },
};

const aboutJsonLd = {
  "@context": "https://schema.org",
  "@type": "AboutPage",
  name: "Sidedock 소개",
  url: `${APP_URL}/about`,
  inLanguage: "ko-KR",
  mainEntity: {
    "@type": "Organization",
    name: "Sidedock",
    alternateName: "사이드독",
    url: APP_URL,
    logo: `${APP_URL}/apple-touch-icon.png`,
    description:
      "한국의 1인 개발자와 스타트업이 AI 툴·SaaS·사이드 프로젝트를 런칭하고 평가받고 홍보하는 프로덕트 발견 플랫폼.",
  },
};

/* ─────────────────────────────────────────────
   Small reusable primitives
───────────────────────────────────────────── */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="rounded-full border border-white/20 bg-white/10 px-3 py-1 font-mono text-xs font-semibold text-cyan-300">
      {children}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-3 font-mono text-[11px] font-bold uppercase tracking-widest text-slate-400">
      {children}
    </p>
  );
}

function FeatureRow({
  icon,
  title,
  desc,
}: {
  icon: string;
  title: string;
  desc: string;
}) {
  return (
    <li className="flex items-start gap-4">
      <span className="mt-0.5 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl bg-blue-50 text-lg">
        {icon}
      </span>
      <div>
        <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{title}</p>
        <p className="mt-0.5 text-sm leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
      </div>
    </li>
  );
}

/* ─────────────────────────────────────────────
   Page
───────────────────────────────────────────── */

const MAKER_GOAL = 100;

export default async function AboutPage() {
  const supabase = await createClient();

  // 실제 launch 등록 메이커 수 (source='launch' & status='published' 기준 unique maker_id)
  const { count: makerCount } = await supabase
    .from("products")
    .select("maker_id", { count: "exact", head: true })
    .eq("source", "launch")
    .eq("status", "published");

  const joined = Math.max(1, makerCount ?? 1); // 0이어도 최소 1 표시 (운영자 포함)
  const pct = Math.min(Math.round((joined / MAKER_GOAL) * 100), 100);

  return (
    <div className="mx-auto max-w-3xl px-4 py-16">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(aboutJsonLd) }}
      />
      {/* Back */}
      <Link
        href="/"
        className="mb-10 inline-flex items-center gap-1.5 text-sm text-slate-400 transition hover:text-slate-700"
      >
        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        홈으로
      </Link>

      {/* ── Hero ── */}
      <section className="relative mb-16 overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-blue-700 px-8 py-14 shadow-xl">
        {/* Decorative blobs */}
        <div
          className="pointer-events-none absolute -right-12 -top-12 h-64 w-64 rounded-full opacity-20 blur-3xl"
          style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)" }}
        />
        <div
          className="pointer-events-none absolute -bottom-10 left-1/4 h-48 w-48 rounded-full opacity-10 blur-2xl"
          style={{ background: "radial-gradient(circle, #818cf8 0%, transparent 70%)" }}
        />
        <div className="relative">
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge>한국 메이커 플랫폼</Badge>
            <Badge>무료 등록</Badge>
            <Badge>오픈 베타</Badge>
          </div>
          <h1 className="text-3xl font-black leading-tight text-white sm:text-4xl">
            Why Sidedock?
          </h1>
          <p className="mt-3 max-w-lg text-base leading-relaxed text-blue-200">
            한국의 AI 툴 · SaaS · 사이드 프로젝트를 발견하고,
            공유하고, 함께 성장하는 공간입니다.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/submit"
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-bold text-navy-900 shadow transition hover:bg-blue-50 dark:bg-slate-200 dark:hover:bg-slate-100"
            >
              🚀 프로젝트 등록하기
            </Link>
            <Link
              href="/launches"
              className="rounded-xl border border-white/25 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              둘러보기 →
            </Link>
          </div>
        </div>
      </section>

      <div className="space-y-16">

        {/* ── What is Sidedock ── */}
        <section>
          <SectionLabel>01 — Sidedock이란?</SectionLabel>
          <h2 className="mb-4 text-xl font-black text-slate-900 dark:text-slate-100">
            한국 메이커를 위한 론칭 플랫폼
          </h2>
          <p className="text-sm leading-relaxed text-slate-600 dark:text-slate-300">
            Sidedock은 혼자 혹은 소규모 팀이 만든 제품을 세상에 알리는 공간입니다.
            Product Hunt가 글로벌 영어권을 위한 플랫폼이라면, Sidedock은{" "}
            <strong>한국어를 쓰는 메이커</strong>들을 위한 동일한 경험을 제공합니다.
          </p>
          <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-5 font-mono text-xs text-slate-500 dark:border-navy-800 dark:bg-navy-950 dark:text-slate-400">
            <span className="text-blue-600 dark:text-blue-400">const</span>{" "}
            <span className="text-slate-900 dark:text-slate-100">sidedock</span>{" "}
            <span className="text-blue-600 dark:text-blue-400">=</span> &#123;<br />
            &nbsp;&nbsp;target&nbsp;&nbsp;: <span className="text-green-600 dark:text-emerald-400">&quot;한국 메이커&quot;</span>,<br />
            &nbsp;&nbsp;language: <span className="text-green-600 dark:text-emerald-400">&quot;한국어&quot;</span>,<br />
            &nbsp;&nbsp;focus&nbsp;&nbsp;: <span className="text-green-600 dark:text-emerald-400">&quot;AI 툴 · SaaS · 사이드프로젝트&quot;</span>,<br />
            &nbsp;&nbsp;cost&nbsp;&nbsp;&nbsp;: <span className="text-green-600 dark:text-emerald-400">&quot;무료&quot;</span>,<br />
            &#125;;
          </div>
        </section>

        {/* ── For whom ── */}
        <section>
          <SectionLabel>02 — 누구를 위한 서비스인가요?</SectionLabel>
          <h2 className="mb-6 text-xl font-black text-slate-900 dark:text-slate-100">
            만드는 사람이라면 누구든
          </h2>
          <ul className="space-y-5">
            <FeatureRow icon="🧑‍💻" title="1인 개발자" desc="혼자 만든 사이드 프로젝트를 홍보하고 초기 사용자를 확보하세요." />
            <FeatureRow icon="⚒️" title="인디해커" desc="수익화 중인 제품을 공유하고 피드백과 Boost(=upvote)를 받으세요." />
            <FeatureRow icon="🤖" title="AI 서비스 제작자" desc="AI 기반 툴을 한국 시장에 빠르게 노출시키세요." />
            <FeatureRow icon="🚀" title="초기 스타트업" desc="PMF 탐색 단계에서 실제 사용자 반응을 테스트하세요." />
          </ul>
        </section>

        {/* ── Benefits ── */}
        <section>
          <SectionLabel>03 — 등록하면 무엇이 좋나요?</SectionLabel>
          <h2 className="mb-6 text-xl font-black text-slate-900 dark:text-slate-100">
            등록 한 번으로 얻는 것들
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {[
              { icon: "🏠", title: "메인 페이지 노출", desc: "Sidedock 홈에 제품이 직접 노출됩니다. 별도 광고 없이도 가시성을 확보하세요." },
              { icon: "🔍", title: "Google 검색 인덱싱", desc: "제품 페이지가 Google에 인덱싱되어 한국어 검색 결과에 노출됩니다." },
              { icon: "🧪", title: "얼리어답터 피드백", desc: "실제로 써보고 싶어하는 얼리어답터에게 직접 피드백을 받으세요." },
              { icon: "📝", title: "Dev Log로 신뢰 구축", desc: "개발 과정을 기록하고 팔로워를 만드세요. 제품보다 사람을 먼저 보여줍니다." },
              { icon: "💬", title: "실사용자 댓글·반응", desc: "커뮤니티의 진짜 반응을 확인하고 다음 방향을 잡으세요." },
              { icon: "⬆️", title: "Boost → Hot Products", desc: "Boost가 쌓이면 Hot Products에 노출되어 더 많은 사람에게 닿습니다." },
            ].map(({ icon, title, desc }) => (
              <div
                key={title}
                className="rounded-2xl border border-slate-100 bg-white p-5 shadow-sm transition hover:border-blue-100 hover:shadow-md dark:border-navy-800 dark:bg-navy-900"
              >
                <div className="mb-2 text-2xl">{icon}</div>
                <p className="text-sm font-bold text-slate-900 dark:text-slate-100">{title}</p>
                <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-400">{desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* ── First 100 Makers ── */}
        <section>
          <SectionLabel>04 — Early Access</SectionLabel>
          <h2 className="mb-2 text-xl font-black text-slate-900 dark:text-slate-100">
            🎁 First 100 Makers
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            초기 등록 메이커에게만 제공되는 혜택입니다. 지금 바로 합류하세요.
          </p>
          <div className="overflow-hidden rounded-2xl border border-amber-100 bg-gradient-to-br from-amber-50 to-orange-50 p-6 dark:border-amber-500/20 dark:from-amber-500/10 dark:to-orange-500/10">
            {/* Live counter */}
            <div className="mb-6">
              <div className="mb-2 flex items-end justify-between">
                <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-100 px-3 py-1 font-mono text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-500" />
                  모집 중
                </span>
                <span className="font-mono text-sm font-bold text-slate-700 dark:text-slate-200">
                  <span className="text-2xl text-amber-600 dark:text-amber-400">{joined}</span>
                  <span className="text-slate-400"> / {MAKER_GOAL}</span>
                </span>
              </div>
              {/* Progress bar */}
              <div className="h-2 overflow-hidden rounded-full bg-amber-100 dark:bg-amber-500/20">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-amber-400 to-orange-400 transition-all"
                  style={{ width: `${pct}%` }}
                />
              </div>
              <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
                당신이 <strong className="text-amber-700 dark:text-amber-300">{joined + 1}번째 메이커</strong>가 될 수 있습니다.
              </p>
            </div>
            {/* Benefits */}
            <ul className="space-y-3">
              {[
                "메인 페이지 우선 노출",
                "운영자 큐레이션 후보 선정",
                "Product of the Week 선정 대상",
                "영구 무료 이용",
                "운영자 직접 피드백 제공",
              ].map((item) => (
                <li key={item} className="flex items-center gap-3 text-sm font-medium text-slate-700 dark:text-slate-200">
                  <span className="flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-amber-200 font-mono text-xs font-bold text-amber-700 dark:bg-amber-500/20 dark:text-amber-300">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── vs Product Hunt ── */}
        <section>
          <SectionLabel>05 — Product Hunt vs Sidedock</SectionLabel>
          <h2 className="mb-2 text-xl font-black text-slate-900 dark:text-slate-100">
            &quot;왜 Product Hunt가 아닌가요?&quot;
          </h2>
          <p className="mb-6 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
            Product Hunt는 훌륭한 플랫폼입니다. 두 플랫폼은 경쟁 관계가 아니라 <strong>대상이 다릅니다.</strong>
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-100 bg-slate-50 p-5 dark:border-navy-800 dark:bg-navy-800">
              <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-slate-400">
                Product Hunt
              </p>
              <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
                {["글로벌 커뮤니티", "영어 중심", "대규모 경쟁", "해외 사용자 타깃"].map((t) => (
                  <li key={t} className="flex items-center gap-2">
                    <span className="h-1.5 w-1.5 rounded-full bg-slate-300" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-5 dark:border-blue-500/20 dark:bg-blue-500/10">
              <p className="mb-3 font-mono text-xs font-bold uppercase tracking-widest text-blue-500">
                Sidedock
              </p>
              <ul className="space-y-2 text-sm text-slate-700 dark:text-slate-300">
                {["한국 메이커 커뮤니티", "한국어 중심", "초기 프로젝트 친화적", "Dev Log 지원", "한국어 SEO"].map((t) => (
                  <li key={t} className="flex items-center gap-2 font-medium">
                    <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                    {t}
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <p className="mt-4 text-center text-xs text-slate-400">
            둘 다 써도 됩니다. 단, 한국 사용자를 원한다면 Sidedock이 더 직접적입니다.
          </p>
        </section>

        {/* ── Cost / Policy ── */}
        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-green-100 bg-green-50 p-6 dark:border-green-500/20 dark:bg-green-500/10">
            <p className="mb-1 font-mono text-xs font-bold uppercase tracking-widest text-green-600">
              비용
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">무료</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              등록부터 Dev Log 작성, 댓글까지 모든 기능이 완전 무료입니다.
            </p>
          </div>
          <div className="rounded-2xl border border-blue-100 bg-blue-50 p-6 dark:border-blue-500/20 dark:bg-blue-500/10">
            <p className="mb-1 font-mono text-xs font-bold uppercase tracking-widest text-blue-600">
              운영 정책
            </p>
            <p className="text-2xl font-black text-slate-900 dark:text-slate-100">메이커 중심</p>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              초기 단계에는 실제 메이커가 만든 제품을 큐레이션하여 소개합니다.
            </p>
          </div>
        </section>

        {/* ── About operator ── */}
        <section>
          <SectionLabel>06 — 운영자 소개</SectionLabel>
          <div className="rounded-2xl border border-slate-100 bg-white p-6 shadow-sm dark:border-navy-800 dark:bg-navy-900">
            <div className="flex items-start gap-4">
              <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-navy-800 to-blue-600 text-lg font-black text-white shadow">
                S
              </div>
              <div>
                <p className="font-bold text-slate-900 dark:text-slate-100">혼자 만들고, 혼자 운영합니다.</p>
                <p className="mt-1 text-sm leading-relaxed text-slate-500 dark:text-slate-400">
                  Sidedock은 개인 개발자가 직접 만들고 운영하는 플랫폼입니다.
                  한국 메이커 생태계를 응원하는 마음으로 시작했습니다.
                  피드백은 언제든 환영합니다.
                </p>
                <p className="mt-3 inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1 font-mono text-xs font-semibold text-amber-700">
                  <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
                  현재 First 100 Makers를 모집 중입니다
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* ── CTA ── */}
        <section className="rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-900 to-navy-900 p-10 text-center shadow-xl dark:border-white/10">
          <p className="mb-2 font-mono text-xs font-bold uppercase tracking-widest text-cyan-400">
            지금 바로 시작하세요
          </p>
          <h2 className="mb-3 text-2xl font-black text-white">
            Build Something.{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Launch Here.
            </span>
          </h2>
          <p className="mb-8 text-sm leading-relaxed text-slate-400">
            프로젝트 등록은 5분이면 됩니다. 오늘 만든 것을 오늘 공유하세요.
          </p>
          <div className="flex flex-wrap justify-center gap-3">
            <Link
              href="/submit"
              className="rounded-xl bg-white px-6 py-3 text-sm font-bold text-navy-900 shadow transition hover:bg-blue-50 dark:bg-slate-200 dark:hover:bg-slate-100"
            >
              🚀 프로젝트 등록하기
            </Link>
            <Link
              href="/guidelines"
              className="rounded-xl border border-white/20 bg-white/10 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              등록 가이드라인 →
            </Link>
          </div>
        </section>

      </div>
    </div>
  );
}
