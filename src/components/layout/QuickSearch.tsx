"use client";

import { useEffect, useRef, useState, type KeyboardEvent } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { matchesSearchQuery, sortSearchResults } from "@/lib/search";
import HighlightText from "./HighlightText";
import PopularSearches from "./PopularSearches";

type SearchTab = "products" | "devlogs";

type ProductResult = {
  id: string;
  slug: string;
  name: string;
  tagline: string | null;
  description?: string | null;
  thumbnail_url: string | null;
  category: string | null;
  categories: string[] | null;
  created_at?: string | null;
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
            .select("id, slug, name, tagline, description, thumbnail_url, category, categories, created_at")
            .eq("status", "published")
            .limit(50),
          supabase
            .from("devlog_posts")
            .select("id, slug, title, content, thumbnail_url, tags, author:profiles(display_name, username)")
            .limit(50),
        ]);

        const allProducts = ((productsRes.data ?? []) as Array<Record<string, unknown>>)
          .filter((item) => matchesSearchQuery(item, "products", search)) as ProductResult[];
        const allDevlogs = ((devlogsRes.data ?? []) as Array<Record<string, unknown>>)
          .filter((item) => matchesSearchQuery(item, "devlogs", search)) as DevlogResult[];

        const rankedProducts = sortSearchResults(allProducts, "products", search, "relevance");
        const rankedDevlogs = sortSearchResults(allDevlogs, "devlogs", search, "relevance");

        setProducts(rankedProducts.slice(0, 12));
        setDevlogs(rankedDevlogs.slice(0, 12));
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

  const handleTagSelect = (term: string, targetTab: SearchTab) => {
    setOpen(false);
    setQuery(term);
    router.push(`/search?q=${encodeURIComponent(term)}${targetTab === "devlogs" ? "&tab=devlogs" : ""}`);
  };

  return (
    <div className="relative" ref={panelRef}>
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="inline-flex items-center justify-center rounded-full border border-slate-200 px-2.5 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:bg-slate-50 sm:px-3.5 dark:border-navy-700 dark:text-slate-200 dark:hover:border-navy-600 dark:hover:bg-navy-800"
      >
        <span aria-hidden="true">🔎</span>
        <span className="ml-1 hidden sm:inline">조회하기</span>
      </button>

      {open && (
        <div className="fixed left-3 right-3 top-16 z-[60] max-h-[80vh] overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xl sm:absolute sm:left-auto sm:right-0 sm:top-11 sm:w-[min(92vw,440px)] dark:border-navy-800 dark:bg-navy-900">
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

            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
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

          <div className="max-h-[min(70vh,640px)] overflow-y-auto p-2 pb-4">
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
              <div
                key={item.id}
                className="rounded-xl px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-navy-800"
              >
                <button
                  type="button"
                  onClick={() => handleSelect(`/products/${item.slug}`)}
                  className="flex w-full items-start gap-3 text-left"
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
                  </div>
                </button>
                <div className="mt-2 flex flex-wrap gap-1">
                  {item.category ? (
                    <button
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleTagSelect(item.category ?? "", "products");
                      }}
                      className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 transition hover:bg-blue-100 dark:bg-blue-500/15 dark:text-blue-300 dark:hover:bg-blue-500/25"
                    >
                      {item.category}
                    </button>
                  ) : null}
                  {(item.categories ?? []).slice(0, 2).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleTagSelect(tag, "products");
                      }}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 transition hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-300 dark:hover:bg-navy-700"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}

            {tab === "devlogs" && devlogs.map((item) => (
              <div
                key={item.id}
                className="rounded-xl px-3 py-2.5 transition hover:bg-slate-50 dark:hover:bg-navy-800"
              >
                <button
                  type="button"
                  onClick={() => handleSelect(`/devlog/${item.slug ?? item.id}`)}
                  className="flex w-full items-start gap-3 text-left"
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
                  </div>
                </button>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {item.author?.display_name || item.author?.username ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-navy-800 dark:text-slate-300">
                      {item.author?.display_name || item.author?.username}
                    </span>
                  ) : null}
                  {(item.tags ?? []).slice(0, 2).map((tag) => (
                    <button
                      key={tag}
                      type="button"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleTagSelect(tag, "devlogs");
                      }}
                      className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 transition hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-300 dark:hover:bg-navy-700"
                    >
                      #{tag}
                    </button>
                  ))}
                </div>
              </div>
            ))}
            <div className="sticky bottom-0 mt-2 border-t border-slate-100 bg-white/95 px-3 py-3 backdrop-blur dark:border-navy-800 dark:bg-navy-900/95">
              <button
                type="button"
                onClick={() => {
                  const trimmed = query.trim();
                  setOpen(false);
                  router.push(trimmed ? `/search?q=${encodeURIComponent(trimmed)}${tab === "devlogs" ? "&tab=devlogs" : ""}` : "/search");
                }}
                className="flex w-full items-center justify-center rounded-xl border border-blue-200 bg-blue-50 px-3 py-2.5 text-sm font-semibold text-blue-700 transition hover:border-blue-300 hover:bg-blue-100 dark:border-blue-500/30 dark:bg-blue-500/10 dark:text-blue-300 dark:hover:bg-blue-500/20"
              >
                <span>전체 결과 보기</span>
                <span className="ml-2 text-base leading-none">→</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
