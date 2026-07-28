"use client";

import { useRouter, useSearchParams } from "next/navigation";

export default function SearchSortSelector({
  currentQuery,
  currentTab,
  currentSort,
}: {
  currentQuery: string;
  currentTab: "products" | "devlogs";
  currentSort: "relevance" | "newest";
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handleChange = (value: "relevance" | "newest") => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("sort", value);
    if (currentQuery) params.set("q", currentQuery);
    if (currentTab === "devlogs") params.set("tab", "devlogs");
    else params.delete("tab");
    router.push(`/search?${params.toString()}`);
  };

  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200/80 bg-slate-50/70 px-2 py-1.5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-900/5 dark:border-navy-700 dark:bg-navy-900/70 dark:ring-white/5 sm:gap-2 sm:px-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-slate-500 dark:text-slate-400 sm:text-[11px]">
        정렬
      </span>
      <div className="flex items-center rounded-full bg-white/80 p-1 shadow-inner shadow-slate-900/5 dark:bg-navy-800/80 dark:shadow-black/20">
        {(["relevance", "newest"] as const).map((value) => {
          const isActive = currentSort === value;
          const label = value === "relevance" ? "관련도순" : "최신순";

          return (
            <button
              key={value}
              type="button"
              aria-pressed={isActive}
              onClick={() => handleChange(value)}
              className={`rounded-full px-2.5 py-1 text-sm font-medium transition sm:px-3 sm:py-1.5 ${
                isActive
                  ? "bg-slate-900 text-white shadow-sm dark:bg-blue-500/20 dark:text-blue-100"
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-navy-700 dark:hover:text-slate-100"
              }`}
            >
              {label}
            </button>
          );
        })}
      </div>
    </div>
  );
}
