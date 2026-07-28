"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sortSearchResults } from "@/lib/search";
import HighlightText from "./HighlightText";
import PopularSearches from "./PopularSearches";

type SearchTab = "products" | "devlogs";

type ProductResult = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  thumbnail_url: string | null;
  category: string | null;
  categories: string[] | null;
};

type DevlogResult = {
  id: string;
  slug: string | null;
  title: string;
  content: string;
  thumbnail_url: string | null;
  tags: string[] | null;
  author?: { display_name?: string | null; username?: string | null } | null;
};

export default function QuickSearch() {
  const router = useRouter();
  const panelRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<SearchTab>("products");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<ProductResult[]>([]);
  const [devlogs, setDevlogs] = useState<DevlogResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  useEffect(() => {
    if (!open) return;

    const timer = window.setTimeout(() => {
      const trimmed = query.trim();
      if (!trimmed) {
        setProducts([]);
        setDevlogs([]);
        setIsLoading(false);
        return;
      }

      const runSearch = async () => {
        setIsLoading(true);
        const supabase = createClient();
        const search = trimmed;

        const [productsRes, devlogsRes] = await Promise.all([
          supabase
            .from("products")
            .select("id, slug, name, tagline, thumbnail_url, category, categories")
            .eq("status", "published")
            .or(`name.ilike.%${search}%,tagline.ilike.%${search}%,description.ilike.%${search}%`)
            .limit(6),
          supabase
            .from("devlog_posts")
            .select("id, slug, title, content, thumbnail_url, tags, author:profiles(display_name, username)")
            .or(`title.ilike.%${search}%,content.ilike.%${search}%`)
            .limit(6),
        ]);

        const rankedProducts = sortSearchResults(
          (productsRes.data ?? []) as ProductResult[],
          "products",
          search,
          "relevance"
        );
        const rankedDevlogs = sortSearchResults(
          (devlogsRes.data ?? []) as DevlogResult[],
          "devlogs",
          search,
          "relevance"
        );

        setProducts(rankedProducts.slice(0, 6));
        setDevlogs(rankedDevlogs.slice(0, 6));
        setIsLoading(false);
      };

      void runSearch();
    }, 220);

    return () => window.clearTimeout(timer);
  }, [open, query]);

  const handleSelect = (href: string) => {
    setOpen(false);
    setQuery("");
    router.push(href);
  };

  const handleInputKeyDown = (event: KeyboardEvent<HTMLInputElement>) => {
    if (event.key !== "Enter") return;
    event.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) {
      setOpen(false);
      router.push("/search");
      return;
    }
    setOpen(false);
    router.push(`/search?q=${encodeURIComponent(trimmed)}${tab === "devlogs" ? "&tab=devlogs" : ""}`);
  };

  const handlePopularSelect = (term: string) => {
    setOpen(false);
    setQuery(term);
    router.push(`/search?q=${encodeURIComponent(term)}`);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="rounded-full border border-slate-200 px-3.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 dark:border-navy-700 dark:text-slate-200 dark:hover:border-navy-600 dark:hover:bg-navy-800"
      >
        🔎 조회하기
      </button>

      {open && (
        <div className="absolute right-0 top-11 z-50 w-[min(92vw,440px)] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl dark:border-navy-800 dark:bg-navy-900">
          <div className="border-b border-slate-100 p-3 dark:border-navy-800">
            <label className="block">
              <span className="sr-only">검색어</span>
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={handleInputKeyDown}
                placeholder={tab === "products" ? "제품 이름이나 설명으로 검색" : "게시글 제목이나 내용으로 검색"}
                className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm text-slate-900 outline-none transition focus:border-blue-400 focus:ring-2 focus:ring-blue-100 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-100 dark:placeholder-slate-500"
                autoFocus
              />
            </label>

            <div className="mt-3 flex gap-2">
              <button
                type="button"
                onClick={() => setTab("products")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  tab === "products"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span>Product</span>
                  {query.trim() ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">{products.length}</span> : null}
                </span>
              </button>
              <button
                type="button"
                onClick={() => setTab("devlogs")}
                className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${
                  tab === "devlogs"
                    ? "bg-blue-600 text-white"
                    : "bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300"
                }`}
              >
                <span className="flex items-center justify-center gap-2">
                  <span>Dev Log</span>
                  {query.trim() ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">{devlogs.length}</span> : null}
                </span>
              </button>
            </div>
          </div>

          <div className="max-h-[70vh] overflow-y-auto p-2">
            {isLoading && (
              <div className="px-3 py-4 text-sm text-slate-500 dark:text-slate-400">검색 중...</div>
            )}

            {!isLoading && !query.trim() && (
              <div className="space-y-3 px-3 py-4">
                <div className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-3 text-sm text-slate-600 dark:border-navy-800 dark:bg-navy-800/60 dark:text-slate-300">
                  제품, Dev Log를 검색해보세요. Enter를 누르면 전체 검색 결과 페이지로 이동합니다.
                </div>
                <PopularSearches query={query} onSelect={handlePopularSelect} />
              </div>
            )}

            {!isLoading && query.trim() && tab === "products" && products.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                일치하는 제품이 없습니다.
              </div>
            )}

            {!isLoading && query.trim() && tab === "devlogs" && devlogs.length === 0 && (
              <div className="px-3 py-6 text-center text-sm text-slate-500 dark:text-slate-400">
                일치하는 Dev Log가 없습니다.
              </div>
            )}

            {tab === "products" && products.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(`/products/${item.slug}`)}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-navy-800"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-black/5 dark:from-slate-300 dark:to-slate-400 dark:ring-0">
                  {item.thumbnail_url ? (
                    <Image src={item.thumbnail_url} alt="" width={40} height={40} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <span className="text-xl font-black text-slate-400">{item.name.trim().slice(0, 1).toUpperCase() || "•"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <HighlightText text={item.name} query={query} className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100" />
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {item.tagline || "제품 상세 페이지로 이동합니다."}
                  </p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.category ? (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                        {item.category}
                      </span>
                    ) : null}
                    {(item.categories ?? []).slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-navy-800 dark:text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}

            {tab === "devlogs" && devlogs.map((item) => (
              <button
                key={item.id}
                type="button"
                onClick={() => handleSelect(`/devlog/${item.slug ?? item.id}`)}
                className="flex w-full items-start gap-3 rounded-xl px-3 py-2.5 text-left transition hover:bg-slate-50 dark:hover:bg-navy-800"
              >
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-black/5 dark:from-slate-300 dark:to-slate-400 dark:ring-0">
                  {item.thumbnail_url ? (
                    <Image src={item.thumbnail_url} alt="" width={40} height={40} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <span className="text-xl font-black text-slate-400">{item.title.trim().slice(0, 1).toUpperCase() || "•"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <HighlightText text={item.title} query={query} className="block truncate text-sm font-semibold text-slate-900 dark:text-slate-100" />
                  <p className="mt-0.5 line-clamp-2 text-xs text-slate-500 dark:text-slate-400">
                    {item.content.replace(/[#*`>\[\]!]/g, "").slice(0, 90)}
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-1">
                    {item.author?.display_name || item.author?.username ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-navy-800 dark:text-slate-300">
                        {item.author?.display_name || item.author?.username}
                      </span>
                    ) : null}
                    {(item.tags ?? []).slice(0, 2).map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-navy-800 dark:text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </button>
            ))}
            <div className="mt-2 border-t border-slate-100 px-3 py-2 dark:border-navy-800">
              <button
                type="button"
                onClick={() => {
                  const trimmed = query.trim();
                  setOpen(false);
                  router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}${tab === "devlogs" ? "&tab=devlogs" : ""}` : "/search");
                }}
                className="text-sm font-medium text-blue-600 transition hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
              >
                전체 결과 보기 →
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
