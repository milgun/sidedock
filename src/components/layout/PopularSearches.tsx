"use client";

import Link from "next/link";

const DEFAULT_TERMS = ["AI", "SaaS", "Next.js", "마케팅", "디자인", "개발 도구"];

export default function PopularSearches({
  query,
  onSelect,
}: {
  query?: string;
  onSelect?: (term: string) => void;
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 via-white to-blue-50/70 p-4 shadow-sm dark:border-navy-800 dark:from-navy-900 dark:via-navy-900 dark:to-blue-950/40">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">인기 검색어</p>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">많이 찾는 키워드를 바로 확인해보세요.</p>
        </div>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        {DEFAULT_TERMS.map((term) => (
          <Link
            key={term}
            href={`/search?q=${encodeURIComponent(term)}`}
            onClick={() => onSelect?.(term)}
            className="rounded-full border border-slate-200 bg-white/80 px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:border-blue-300 hover:text-blue-700 dark:border-navy-700 dark:bg-navy-800/70 dark:text-slate-300 dark:hover:border-blue-500/50 dark:hover:text-blue-300"
          >
            #{term}
          </Link>
        ))}
      </div>
      {query ? (
        <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
          현재 검색어 <span className="font-semibold text-slate-700 dark:text-slate-200">{query}</span>로 다시 검색해보세요.
        </p>
      ) : null}
    </div>
  );
}
