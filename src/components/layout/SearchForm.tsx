"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState, type FormEvent } from "react";

export default function SearchForm({
  initialQuery,
  initialTab,
}: {
  initialQuery?: string;
  initialTab?: "products" | "devlogs";
}) {
  const router = useRouter();
  const [query, setQuery] = useState(initialQuery ?? "");

  useEffect(() => {
    setQuery(initialQuery ?? "");
  }, [initialQuery]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      router.push("/search");
      return;
    }
    router.push(`/search?q=${encodeURIComponent(trimmed)}${initialTab === "devlogs" ? "&tab=devlogs" : ""}`);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2 sm:flex-row">
      <label className="flex-1">
        <span className="sr-only">검색어</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="제품, Dev Log를 검색해보세요"
          className="w-full rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-base text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 sm:text-sm dark:border-navy-700 dark:bg-navy-800 dark:text-slate-100 dark:placeholder-slate-500"
        />
      </label>
      <button
        type="submit"
        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 sm:w-auto"
      >
        검색
      </button>
    </form>
  );
}
