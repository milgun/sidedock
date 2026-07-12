import Link from "next/link";
import Image from "next/image";
import type { ProductWithMaker } from "@/types";
import UpvoteButton from "./UpvoteButton";

interface ProductCardProps {
  product: ProductWithMaker;
  rank?: number;
  variant?: "list" | "grid";
  userId: string | null;
  context?: "hot" | "launch-feed" | "launch-rank";
  nowMs?: number;
}

export const CATEGORY_LABELS: Record<string, string> = {
  "ai-tool":           "AI 툴",
  "saas":              "SaaS",
  "dev-tool":          "개발 툴",
  "productivity":      "생산성",
  "design":            "디자인",
  "marketing":         "마케팅",
  "mobile-app":        "모바일 앱",
  "browser-extension": "브라우저 확장",
  "desktop-app":       "데스크탑 앱",
  "game":              "게임",
  "api":               "API / 백엔드",
  "education":         "교육",
  "finance":           "금융 / 핀테크",
  "health":            "헬스 / 웰니스",
  "social":            "소셜",
  "ecommerce":         "이커머스",
  "media":             "미디어",
  "other":             "기타",
};

export const CATEGORY_COLORS: Record<string, string> = {
  "ai-tool":           "bg-purple-50 text-purple-600 dark:bg-purple-500/15 dark:text-purple-300",
  "saas":              "bg-blue-50 text-blue-600 dark:bg-blue-500/15 dark:text-blue-300",
  "dev-tool":          "bg-emerald-50 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  "productivity":      "bg-orange-50 text-orange-600 dark:bg-orange-500/15 dark:text-orange-300",
  "design":            "bg-pink-50 text-pink-600 dark:bg-pink-500/15 dark:text-pink-300",
  "marketing":         "bg-yellow-50 text-yellow-700 dark:bg-yellow-500/15 dark:text-yellow-300",
  "mobile-app":        "bg-sky-50 text-sky-600 dark:bg-sky-500/15 dark:text-sky-300",
  "browser-extension": "bg-violet-50 text-violet-600 dark:bg-violet-500/15 dark:text-violet-300",
  "desktop-app":       "bg-indigo-50 text-indigo-600 dark:bg-indigo-500/15 dark:text-indigo-300",
  "game":              "bg-red-50 text-red-600 dark:bg-red-500/15 dark:text-red-300",
  "api":               "bg-teal-50 text-teal-700 dark:bg-teal-500/15 dark:text-teal-300",
  "education":         "bg-amber-50 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  "finance":           "bg-lime-50 text-lime-700 dark:bg-lime-500/15 dark:text-lime-300",
  "health":            "bg-rose-50 text-rose-600 dark:bg-rose-500/15 dark:text-rose-300",
  "social":            "bg-cyan-50 text-cyan-600 dark:bg-cyan-500/15 dark:text-cyan-300",
  "ecommerce":         "bg-emerald-50 text-emerald-600 dark:bg-emerald-500/15 dark:text-emerald-300",
  "media":             "bg-fuchsia-50 text-fuchsia-600 dark:bg-fuchsia-500/15 dark:text-fuchsia-300",
  "other":             "bg-slate-100 text-slate-500 dark:bg-navy-800 dark:text-slate-300",
};

function ProductIcon({
  url,
  name,
  size = 48,
}: {
  url: string | null;
  name: string;
  size?: number;
}) {
  const roundedCls = size === 64 ? "rounded-2xl" : "rounded-xl";
  const sizeCls = size === 64 ? "h-16 w-16" : "h-12 w-12";

  return (
    <div
      className={`${sizeCls} ${roundedCls} flex flex-shrink-0 items-center justify-center overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-black/5 dark:from-slate-300 dark:to-slate-400 dark:ring-0`}
    >
      {url ? (
        <Image
          src={url}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <span
          className={`font-black text-slate-400 ${size === 64 ? "text-2xl" : "text-xl"}`}
        >
          {name[0]?.toUpperCase()}
        </span>
      )}
    </div>
  );
}

// ── Grid Card (New Arrivals) ────────────────────────────────────────────────
function GridCard({
  product,
  userId,
}: {
  product: ProductWithMaker;
  userId: string | null;
}) {
  const cats = product.categories?.length ? product.categories : [product.category];

  return (
    <div className="group relative flex flex-col gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg cursor-pointer dark:border-navy-800 dark:bg-navy-900 dark:hover:border-blue-500/40">
      {/* Full-cover link */}
      <Link
        href={`/products/${product.slug}`}
        className="absolute inset-0 rounded-2xl"
        aria-hidden="true"
        tabIndex={-1}
      />
      <ProductIcon url={product.thumbnail_url} name={product.name} size={64} />
      <div className="min-w-0 flex-1">
        <p className="font-semibold leading-tight text-slate-900 group-hover:text-blue-700 dark:text-slate-100 dark:group-hover:text-blue-400">
          {product.name}
        </p>
        <p className="mt-0.5 line-clamp-1 text-xs text-slate-400">
          {product.tagline}
        </p>
      </div>
      <div className="relative z-10 flex flex-col gap-2">
        <div className="flex flex-wrap gap-1">
          {cats.map((cat) => (
            <span key={cat} className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other}`}>
              {CATEGORY_LABELS[cat] ?? cat}
            </span>
          ))}
        </div>
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/products/${product.slug}#comments`}
            className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-2 py-0.5 text-xs text-slate-400 transition hover:border-slate-300 hover:text-slate-600 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-navy-600 dark:hover:text-slate-300"
          >
            <CommentIcon />
            {product.comment_count}
          </Link>
          <UpvoteButton
            productId={product.id}
            initialCount={product.upvote_count}
            initialHasUpvoted={product.has_upvoted ?? false}
            userId={userId}
            variant="grid"
          />
        </div>
      </div>
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function timeAgo(dateStr: string, nowMs: number): string {
  const diff = nowMs - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60_000);
  const hours = Math.floor(diff / 3_600_000);
  const days = Math.floor(diff / 86_400_000);
  if (minutes < 60) return `${minutes}분 전`;
  if (hours < 24) return `${hours}시간 전`;
  if (days === 1) return "어제";
  return `${days}일 전`;
}

// ── List Card (Rankings) ───────────────────────────────────────────────────
function ListCard({
  product,
  rank,
  userId,
  context = "hot",
  nowMs = 0,
}: {
  product: ProductWithMaker;
  rank?: number;
  userId: string | null;
  context?: "hot" | "launch-feed" | "launch-rank";
  nowMs?: number;
}) {
  const cats = product.categories?.length ? product.categories : [product.category];
  const isNew =
    context === "launch-feed" &&
    nowMs > 0 &&
    nowMs - new Date(product.created_at).getTime() < 72 * 3_600_000;

  return (
    <div className="relative flex cursor-pointer items-center gap-3 border-b border-slate-100 bg-white px-3 py-3.5 transition last:border-0 hover:bg-slate-50/70 first:rounded-t-2xl last:rounded-b-2xl dark:border-navy-800 dark:bg-navy-900 dark:hover:bg-navy-800/50">
      {/* Full-cover link */}
      <Link
        href={`/products/${product.slug}`}
        className="absolute inset-0"
        aria-hidden="true"
        tabIndex={-1}
      />

      {/* Rank / Badge column */}
      {context === "hot" && rank !== undefined && (
        <span
          className={`w-8 flex-shrink-0 text-center leading-none ${
            rank <= 3
              ? "text-xl"
              : "font-mono text-sm font-bold text-slate-300"
          }`}
        >
          {rank === 1 ? "🥇" : rank === 2 ? "🥈" : rank === 3 ? "🥉" : rank}
        </span>
      )}
      {context === "launch-rank" && rank !== undefined && (
        <span className="w-6 flex-shrink-0 text-center font-mono text-sm font-bold text-slate-300">
          {rank}
        </span>
      )}
      {context === "launch-feed" && (
        <div className="flex w-10 flex-shrink-0 items-center justify-center">
          {isNew ? (
            <span className="rounded-full bg-blue-500 px-1.5 py-0.5 text-[9px] font-black leading-none tracking-wide text-white">
              NEW
            </span>
          ) : (
            <span className="text-center text-[10px] leading-tight text-slate-300">
              {timeAgo(product.created_at, nowMs)}
            </span>
          )}
        </div>
      )}

      <ProductIcon url={product.thumbnail_url} name={product.name} />

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline gap-x-2">
          <span className="font-semibold text-slate-900 dark:text-slate-100">{product.name}</span>
          <span className="hidden text-slate-300 sm:inline dark:text-slate-600">—</span>
          <span className="hidden truncate text-sm text-slate-500 sm:block dark:text-slate-400">
            {product.tagline}
          </span>
        </div>
        <p className="mt-0.5 truncate text-sm text-slate-500 sm:hidden">
          {product.tagline}
        </p>
        <div className="mt-1 flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
          {cats.map((cat) => (
            <span key={cat} className={`rounded-full px-2 py-0.5 text-xs font-medium ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other}`}>
              {CATEGORY_LABELS[cat] ?? cat}
            </span>
          ))}
          {context === "launch-feed" && (
            <span className="text-xs text-blue-400">
              {timeAgo(product.created_at, nowMs)}
            </span>
          )}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-0">
          {product.maker && (
            <span className="flex items-center gap-1 text-xs text-slate-400">
              <span
                className={
                  product.source === "curated" || product.maker_type === "hunter"
                    ? "font-semibold text-violet-500"
                    : "font-semibold text-blue-500"
                }
              >
                {product.source === "curated" || product.maker_type === "hunter" ? "큐레이터" : "메이커"}
              </span>
              {product.maker.display_name ?? product.maker.username}
            </span>
          )}
          {context === "hot" &&
            product.tags.slice(0, 2).map((tag) => (
              <span key={tag} className="text-xs text-slate-300">
                · {tag}
              </span>
            ))}
        </div>
      </div>

      <div className="relative z-10 flex flex-shrink-0 items-center gap-1.5">
        {context !== "launch-feed" && (
          <Link
            href={`/products/${product.slug}#comments`}
            className="hidden items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-400 transition hover:border-slate-300 hover:text-slate-600 sm:flex dark:border-navy-700 dark:bg-navy-800 dark:hover:border-navy-600 dark:hover:text-slate-300"
          >
            <CommentIcon />
            <span className="font-medium">{product.comment_count}</span>
          </Link>
        )}
        <UpvoteButton
          productId={product.id}
          initialCount={product.upvote_count}
          initialHasUpvoted={product.has_upvoted ?? false}
          userId={userId}
          variant="list"
        />
      </div>
    </div>
  );
}

export default function ProductCard({
  product,
  rank,
  variant = "list",
  userId,
  context = "hot",
  nowMs,
}: ProductCardProps) {
  if (variant === "grid") {
    return <GridCard product={product} userId={userId} />;
  }
  return <ListCard product={product} rank={rank} userId={userId} context={context} nowMs={nowMs} />;
}

function CommentIcon() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  );
}

