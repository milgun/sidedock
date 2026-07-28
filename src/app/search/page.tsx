import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import HighlightText from "@/components/layout/HighlightText";
import SearchForm from "@/components/layout/SearchForm";
import SearchSortSelector from "@/components/layout/SearchSortSelector";
import PopularSearches from "@/components/layout/PopularSearches";
import { sortSearchResults } from "@/lib/search";

function ResultIconPlaceholder({
  label,
  size = "md",
}: {
  label: string;
  size?: "md" | "sm";
}) {
  const sizeClass = size === "sm" ? "h-10 w-10 text-xl" : "h-16 w-16 text-2xl";

  return (
    <div
      className={`${sizeClass} flex flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-black/5 dark:from-slate-300 dark:to-slate-400 dark:ring-0`}
    >
      <span className="font-black text-slate-400">
        {label.trim().slice(0, 1).toUpperCase() || "•"}
      </span>
    </div>
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; tab?: string; sort?: string }>;
}) {
  const params = await searchParams;
  const query = (params.q ?? "").trim();
  const tab = params.tab === "devlogs" ? "devlogs" : "products";
  const sort = params.sort === "newest" ? "newest" : "relevance";

  const supabase = await createClient();

  let products: Array<{
    id: string;
    slug: string;
    name: string;
    tagline: string | null;
    description?: string | null;
    thumbnail_url: string | null;
    category: string | null;
    categories: string[] | null;
    created_at?: string | null;
  }> = [];
  let devlogs: Array<{
    id: string;
    slug: string | null;
    title: string;
    content: string;
    thumbnail_url: string | null;
    tags: string[] | null;
    created_at?: string | null;
    author?: { display_name?: string | null; username?: string | null } | null;
  }> = [];

  if (query) {
    const [productsRes, devlogsRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, slug, name, tagline, description, thumbnail_url, category, categories, created_at")
        .eq("status", "published")
        .or(`name.ilike.%${query}%,tagline.ilike.%${query}%,description.ilike.%${query}%`)
        .limit(20),
      supabase
        .from("devlog_posts")
        .select("id, slug, title, content, thumbnail_url, tags, created_at, author:profiles(display_name, username)")
        .or(`title.ilike.%${query}%,content.ilike.%${query}%`)
        .limit(20),
    ]);

    products = (productsRes.data ?? []) as typeof products;
    devlogs = (devlogsRes.data ?? []) as typeof devlogs;

    products = sortSearchResults(products, "products", query, sort);
    devlogs = sortSearchResults(devlogs, "devlogs", query, sort);
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-6 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-navy-800 dark:bg-navy-900">
        <h1 className="text-xl font-black text-slate-900 dark:text-slate-100">🔎 검색 결과</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {query ? `${query}에 대한 결과를 확인해보세요.` : "검색어를 입력해 제품과 Dev Log를 찾아보세요."}
        </p>
        <div className="mt-4">
          <SearchForm initialQuery={query} initialTab={tab} />
        </div>
      </div>

      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2">
          <Link
            href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "products"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>Product</span>
              {query ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">{products.length}</span> : null}
            </span>
          </Link>
          <Link
            href={query ? `/search?q=${encodeURIComponent(query)}&tab=devlogs` : "/search?tab=devlogs"}
            className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
              tab === "devlogs"
                ? "bg-blue-600 text-white"
                : "bg-slate-100 text-slate-600 dark:bg-navy-800 dark:text-slate-300"
            }`}
          >
            <span className="flex items-center gap-2">
              <span>Dev Log</span>
              {query ? <span className="rounded-full bg-white/20 px-2 py-0.5 text-[10px] font-semibold">{devlogs.length}</span> : null}
            </span>
          </Link>
        </div>
        {query ? (
          <SearchSortSelector
            currentQuery={query}
            currentTab={tab}
            currentSort={sort}
          />
        ) : null}
      </div>

      {!query ? (
        <div className="space-y-4">
          <PopularSearches query={query} />
          <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center text-sm text-slate-500 dark:border-navy-800 dark:bg-navy-900/50 dark:text-slate-400">
            검색어를 입력하면 제품과 Dev Log를 한 번에 찾아볼 수 있습니다.
          </div>
        </div>
      ) : tab === "products" ? (
        products.length > 0 ? (
          <div className="space-y-3">
            {products.map((item) => (
              <Link
                key={item.id}
                href={`/products/${item.slug}`}
                className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-navy-800 dark:bg-navy-900 dark:hover:border-blue-500/40"
              >
                <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-black/5 dark:from-slate-300 dark:to-slate-400 dark:ring-0">
                  {item.thumbnail_url ? (
                    <Image src={item.thumbnail_url} alt={item.name} width={64} height={64} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <span className="text-2xl font-black text-slate-400">{item.name.trim().slice(0, 1).toUpperCase() || "•"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <HighlightText text={item.name} query={query} className="block text-base font-semibold text-slate-900 dark:text-slate-100" />
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{item.tagline || "제품 상세 페이지로 이동합니다."}</p>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {item.category ? (
                      <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[10px] font-medium text-blue-700 dark:bg-blue-500/15 dark:text-blue-300">
                        {item.category}
                      </span>
                    ) : null}
                    {(item.categories ?? []).slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-navy-800 dark:text-slate-300">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-navy-800 dark:text-slate-400">
            일치하는 제품이 없습니다.
          </div>
        )
      ) : devlogs.length > 0 ? (
        <div className="space-y-3">
          {devlogs.map((item) => (
            <Link
              key={item.id}
              href={`/devlog/${item.slug ?? item.id}`}
              className="flex items-start gap-4 rounded-2xl border border-slate-200 bg-white p-4 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-navy-800 dark:bg-navy-900 dark:hover:border-blue-500/40"
            >
              <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-black/5 dark:from-slate-300 dark:to-slate-400 dark:ring-0">
                {item.thumbnail_url ? (
                  <Image src={item.thumbnail_url} alt={item.title} width={64} height={64} className="h-full w-full object-cover" unoptimized />
                ) : (
                  <span className="text-2xl font-black text-slate-400">{item.title.trim().slice(0, 1).toUpperCase() || "•"}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <HighlightText text={item.title} query={query} className="block text-base font-semibold text-slate-900 dark:text-slate-100" />
                <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{item.content.replace(/[#*`>\[\]!]/g, "").slice(0, 140)}</p>
                <div className="mt-2 flex flex-wrap items-center gap-1">
                  {item.author?.display_name || item.author?.username ? (
                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-navy-800 dark:text-slate-300">
                      {item.author?.display_name || item.author?.username}
                    </span>
                  ) : null}
                  {(item.tags ?? []).slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-navy-800 dark:text-slate-300">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-navy-800 dark:text-slate-400">
          일치하는 Dev Log가 없습니다.
        </div>
      )}
    </div>
  );
}
