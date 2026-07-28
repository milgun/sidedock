import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import HighlightText from "@/components/layout/HighlightText";
import SearchForm from "@/components/layout/SearchForm";
import SearchSortSelector from "@/components/layout/SearchSortSelector";
import PopularSearches from "@/components/layout/PopularSearches";
import { matchesSearchQuery, sortSearchResults } from "@/lib/search";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/components/product/ProductCard";
import UpvoteButton from "@/components/product/UpvoteButton";

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

function buildSearchHref(term: string, tab: "products" | "devlogs") {
  const params = new URLSearchParams({ q: term });
  if (tab === "devlogs") params.set("tab", "devlogs");
  return `/search?${params.toString()}`;
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

  let userId: string | null = null;

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
    upvote_count?: number | null;
    comment_count?: number | null;
    has_upvoted?: boolean;
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
    const [productsRes, devlogsRes, userRes] = await Promise.all([
      supabase
        .from("products")
        .select("id, slug, name, tagline, description, thumbnail_url, category, categories, created_at, upvote_count, comment_count")
        .eq("status", "published")
        .limit(100),
      supabase
        .from("devlog_posts")
        .select("id, slug, title, content, thumbnail_url, tags, created_at, author:profiles(display_name, username)")
        .limit(100),
      supabase.auth.getUser(),
    ]);

    userId = userRes.data.user?.id ?? null;

    products = ((productsRes.data ?? []) as Array<Record<string, unknown>>)
      .filter((item) => matchesSearchQuery(item, "products", query)) as typeof products;
    devlogs = ((devlogsRes.data ?? []) as Array<Record<string, unknown>>)
      .filter((item) => matchesSearchQuery(item, "devlogs", query)) as typeof devlogs;

    products = sortSearchResults(products, "products", query, sort);
    devlogs = sortSearchResults(devlogs, "devlogs", query, sort);

    if (userId && products.length > 0) {
      const { data: upvotes } = await supabase
        .from("upvotes")
        .select("product_id")
        .eq("user_id", userId)
        .in("product_id", products.map((p) => p.id));

      const upvotedIds = new Set<string>((upvotes ?? []).map((u: { product_id: string }) => u.product_id));
      products = products.map((p) => ({ ...p, has_upvoted: upvotedIds.has(p.id) }));
    }
  }

  return (
    <div className="mx-auto w-full max-w-[760px] px-2 py-6 sm:px-3 sm:py-8 lg:px-0">
      <div className="mb-4 rounded-2xl border border-slate-200 bg-white p-3 shadow-sm dark:border-navy-800 dark:bg-navy-900 sm:p-4">
        <h1 className="text-lg font-black text-slate-900 dark:text-slate-100 sm:text-xl">🔎 검색 결과</h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">
          {query ? `${query}에 대한 결과를 확인해보세요.` : "검색어를 입력해 제품과 Dev Log를 찾아보세요."}
        </p>
        <div className="mt-3 sm:mt-4">
          <SearchForm initialQuery={query} initialTab={tab} />
        </div>
      </div>

      <div className="mb-3 flex flex-wrap items-center justify-between gap-2 sm:mb-4 sm:gap-3">
        <div className="flex flex-wrap gap-2">
          <Link
            href={query ? `/search?q=${encodeURIComponent(query)}` : "/search"}
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition sm:px-4 sm:py-2 ${
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
            className={`rounded-full px-3 py-1.5 text-sm font-semibold transition sm:px-4 sm:py-2 ${
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
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-navy-800 dark:bg-navy-900">
            {products.map((item) => {
              const cats = (item.categories?.length ? item.categories : [item.category]).filter(Boolean) as string[];

              return (
                <div
                  key={item.id}
                  className="relative flex items-center gap-3 border-b border-slate-100 bg-white px-3 py-3.5 transition last:border-0 hover:bg-slate-50/70 dark:border-navy-800 dark:bg-navy-900 dark:hover:bg-navy-800/50"
                >
                  <Link href={`/products/${item.slug}`} className="absolute inset-0" aria-hidden="true" tabIndex={-1} />
                  <div className="relative z-10 flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-black/5 dark:from-slate-300 dark:to-slate-400 dark:ring-0 sm:h-12 sm:w-12">
                    {item.thumbnail_url ? (
                      <Image src={item.thumbnail_url} alt={item.name} width={48} height={48} className="h-full w-full object-cover" unoptimized />
                    ) : (
                      <span className="text-lg font-black text-slate-400">{item.name.trim().slice(0, 1).toUpperCase() || "•"}</span>
                    )}
                  </div>

                  <div className="relative z-10 min-w-0 flex-1">
                    <div className="flex flex-wrap items-baseline gap-x-2">
                      <HighlightText text={item.name} query={query} className="block text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base" />
                      <span className="hidden text-slate-300 sm:inline dark:text-slate-600">—</span>
                      <span className="hidden truncate text-sm text-slate-500 sm:block dark:text-slate-400">
                        {item.tagline || "제품 상세 페이지로 이동합니다."}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-500 sm:hidden dark:text-slate-400">
                      {item.tagline || "제품 상세 페이지로 이동합니다."}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-1.5">
                      {cats.map((cat) => (
                        <span
                          key={cat}
                          className={`rounded-full px-2 py-0.5 text-[10px] font-medium ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other}`}
                        >
                          {CATEGORY_LABELS[cat] ?? cat}
                        </span>
                      ))}
                      {(item.categories ?? []).slice(0, 1).map((tag) => (
                        <a
                          key={tag}
                          href={buildSearchHref(tag, "products")}
                          className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 transition hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-300 dark:hover:bg-navy-700"
                        >
                          #{tag}
                        </a>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-10 flex flex-shrink-0 items-center gap-1.5">
                    <Link
                      href={`/products/${item.slug}#comments`}
                      className="flex items-center gap-1 rounded-xl border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-400 transition hover:border-slate-300 hover:text-slate-600 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-navy-600 dark:hover:text-slate-300"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M8 10h.01M12 10h.01M16 10h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                      </svg>
                      <span className="font-medium">{item.comment_count ?? 0}</span>
                    </Link>
                    <UpvoteButton
                      productId={item.id}
                      initialCount={item.upvote_count ?? 0}
                      initialHasUpvoted={item.has_upvoted ?? false}
                      userId={userId}
                      variant="list"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 p-8 text-center text-sm text-slate-500 dark:border-navy-800 dark:text-slate-400">
            일치하는 제품이 없습니다.
          </div>
        )
      ) : devlogs.length > 0 ? (
        <div className="space-y-3">
          {devlogs.map((item) => (
            <div
              key={item.id}
              className="w-full rounded-2xl border border-slate-200 bg-white p-3 transition hover:-translate-y-0.5 hover:border-blue-200 hover:shadow-lg dark:border-navy-800 dark:bg-navy-900 dark:hover:border-blue-500/40"
            >
              <Link href={`/devlog/${item.slug ?? item.id}`} className="flex items-start gap-2.5 sm:gap-3">
                <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 ring-1 ring-black/5 dark:from-slate-300 dark:to-slate-400 dark:ring-0 sm:h-12 sm:w-12">
                  {item.thumbnail_url ? (
                    <Image src={item.thumbnail_url} alt={item.title} width={48} height={48} className="h-full w-full object-cover" unoptimized />
                  ) : (
                    <span className="text-lg font-black text-slate-400">{item.title.trim().slice(0, 1).toUpperCase() || "•"}</span>
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <HighlightText text={item.title} query={query} className="block text-sm font-semibold text-slate-900 dark:text-slate-100 sm:text-base" />
                  <p className="mt-1 line-clamp-2 text-sm text-slate-500 dark:text-slate-400">{item.content.replace(/[#*`>\[\]!]/g, "").slice(0, 140)}</p>
                  <div className="mt-1.5 flex flex-wrap items-center gap-1">
                    {item.author?.display_name || item.author?.username ? (
                      <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 dark:bg-navy-800 dark:text-slate-300">
                        {item.author?.display_name || item.author?.username}
                      </span>
                    ) : null}
                    {(item.tags ?? []).slice(0, 3).map((tag) => (
                      <a
                        key={tag}
                        href={buildSearchHref(tag, "devlogs")}
                        className="cursor-pointer rounded-full bg-slate-100 px-2 py-0.5 text-[10px] text-slate-500 transition hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-300 dark:hover:bg-navy-700"
                      >
                        #{tag}
                      </a>
                    ))}
                  </div>
                </div>
              </Link>
            </div>
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
