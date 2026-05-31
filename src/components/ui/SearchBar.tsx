"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function SearchBar() {
  const router = useRouter();
  const [query, setQuery] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/products?q=${encodeURIComponent(query.trim())}`);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="relative w-full">
      <div className="flex items-center gap-3 rounded-2xl border border-gray-200 bg-white px-5 py-4 shadow-sm transition focus-within:border-gray-400 focus-within:shadow-md">
        {/* 검색 아이콘 */}
        <svg
          className="h-5 w-5 flex-shrink-0 text-gray-400"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z"
          />
        </svg>

        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="AI 툴, SaaS, 사이드 프로젝트 검색..."
          className="flex-1 bg-transparent text-sm text-gray-900 placeholder-gray-400 outline-none"
        />

        {/* 검색 버튼: 항상 렌더, query 없을 때 투명 처리로 크기 고정 */}
        <button
          type="submit"
          disabled={!query}
          className={`flex-shrink-0 rounded-xl bg-gray-900 px-4 py-1.5 text-xs font-semibold text-white transition-opacity hover:bg-gray-700 ${
            query ? "opacity-100" : "pointer-events-none opacity-0"
          }`}
        >
          검색
        </button>
      </div>
    </form>
  );
}
