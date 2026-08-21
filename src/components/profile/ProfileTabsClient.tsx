"use client";

import { useState, useEffect, useCallback, useRef, useTransition } from "react";
import Link from "next/link";
import Image from "next/image";
import type { ProductWithMaker } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import ProfileProducts from "@/components/profile/ProfileProducts";
import { deleteDevlogPostSilent } from "@/lib/actions/devlog";

// ── Tab definition ────────────────────────────────────────────────────────────
const TABS = [
  { id: "about",    label: "소개" },
  { id: "activity", label: "활동" },
  { id: "products", label: "제품" },
  { id: "boost",    label: "업보트" },
  { id: "reviews",  label: "리뷰" },
  { id: "devlog",   label: "Dev Log" },
  { id: "stack",    label: "스택" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Tab data types ────────────────────────────────────────────────────────────
interface AboutData   { publishedCount: number; totalUpvotes: number }
interface ActivityData {
  comments: Array<{
    id: string; content: string; created_at: string;
    product: { id: string; slug?: string; name: string } | null;
  }>;
  upvotes: Array<{
    created_at: string;
    product: { id: string; slug?: string; name: string; thumbnail_url: string | null } | null;
  }>;
  devlogs: Array<{
    id: string; title: string; created_at: string;
  }>;
}
interface ProductsData {
  isOwn: boolean;
  ownProducts?: Array<{
    id: string; name: string; tagline: string; thumbnail_url: string | null;
    status: string; source?: string; rejection_reason: string | null; created_at: string; upvote_count: number;
  }>;
  publicProducts?: ProductWithMaker[];
}
interface BoostData   { boostedProducts: ProductWithMaker[] }
interface StackData   { savedProducts: ProductWithMaker[] }
interface ReviewsData {
  reviews: Array<{
    id: string; rating: number; content: string; created_at: string;
    product: { id: string; slug?: string; name: string; thumbnail_url: string | null } | null;
  }>;
}
interface DevlogData {
  devlogs: Array<{
    id: string; slug?: string; title: string; tags: string[];
    thumbnail_url: string | null;
    like_count: number; comment_count: number; created_at: string;
  }>;
}

type TabData = AboutData | ActivityData | ProductsData | BoostData | StackData | ReviewsData | DevlogData;

// ── Props ─────────────────────────────────────────────────────────────────────
interface ProfileTabsClientProps {
  username: string;
  isOwn: boolean;
  isAdmin: boolean;
  userId: string | null;
  initialTab: string;
  publishedCount: number;
  profileCreatedAt: string;
  profileBio: string | null;
}

// ── Component ─────────────────────────────────────────────────────────────────
export default function ProfileTabsClient({
  username,
  isOwn,
  isAdmin,
  userId,
  initialTab,
  publishedCount,
  profileCreatedAt,
  profileBio,
}: ProfileTabsClientProps) {
  const validTab = (TABS.some((t) => t.id === initialTab) ? initialTab : "about") as TabId;
  const [activeTab, setActiveTab] = useState<TabId>(validTab);
  const [loading, setLoading] = useState(false);
  const [tabData, setTabData] = useState<Partial<Record<TabId, TabData>>>({});
  const fetchedTabs = useRef<Set<TabId>>(new Set());

  const fetchTab = useCallback(
    async (tab: TabId) => {
      if (fetchedTabs.current.has(tab)) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/profile/${encodeURIComponent(username)}/tab?tab=${tab}`);
        if (res.ok) {
          const data = await res.json();
          setTabData((prev) => ({ ...prev, [tab]: data }));
          fetchedTabs.current.add(tab);
        }
      } finally {
        setLoading(false);
      }
    },
    [username],
  );

  // Fetch initial tab on mount
  useEffect(() => {
    fetchTab(validTab);
  }, [fetchTab, validTab]);

  // bfcache 복원(뒤로 가기) 감지 → 탭 데이터 재요청
  useEffect(() => {
    const handlePageShow = (e: PageTransitionEvent) => {
      if (e.persisted) {
        fetchedTabs.current.clear();
        void fetchTab(activeTab);
      }
    };
    window.addEventListener("pageshow", handlePageShow);
    return () => window.removeEventListener("pageshow", handlePageShow);
  }, [activeTab, fetchTab]);

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/profile/${username}?tab=${tab}`);
    fetchTab(tab);
  };

  const currentData = tabData[activeTab];

  return (
    <>
      {/* ── Tab Navigation ── */}
      <div className="relative mb-8">
        <nav className="flex gap-0.5 overflow-x-auto border-b border-slate-100 dark:border-navy-800 scrollbar-none">
          {TABS.filter((t) => t.id !== "stack" || isOwn).map((tab) => {
            const active = activeTab === tab.id;
            const count = tab.id === "products" ? publishedCount : undefined;
            return (
              <button
                key={tab.id}
                onClick={() => handleTabChange(tab.id)}
                className={`flex flex-shrink-0 items-center gap-1 px-2.5 py-2.5 text-xs font-medium transition border-b-2 -mb-px sm:gap-1.5 sm:px-4 sm:text-sm ${
                  active
                    ? "border-slate-900 dark:border-slate-100 text-slate-900 dark:text-slate-100"
                    : "border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                }`}
              >
                {tab.label}
                {count !== undefined && count > 0 && (
                  <span
                    className={`rounded-full px-1.5 py-0.5 text-xs leading-none ${
                      active ? "bg-slate-900 dark:bg-blue-600 text-white" : "bg-slate-100 dark:bg-navy-800 text-slate-400"
                    }`}
                  >
                    {count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
        {/* 오른쪽 페이드 — 스크롤 가능 안내 */}
        <div className="pointer-events-none absolute right-0 top-0 h-full w-8 bg-gradient-to-l from-white dark:from-navy-950 to-transparent" />
      </div>

      {/* ── Tab Content ── */}
      {loading && !currentData ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 dark:border-navy-800 border-t-slate-600" />
        </div>
      ) : (
        <TabContent
          tab={activeTab}
          data={currentData}
          isOwn={isOwn}
          isAdmin={isAdmin}
          userId={userId}
          publishedCount={publishedCount}
          profileCreatedAt={profileCreatedAt}
          profileBio={profileBio}
          onDevlogDeleted={(id) => {
            setTabData((prev) => {
              const cur = prev["devlog"] as DevlogData | undefined;
              if (!cur) return prev;
              return {
                ...prev,
                devlog: { devlogs: cur.devlogs.filter((d) => d.id !== id) },
              };
            });
          }}
        />
      )}
    </>
  );
}

// ── Tab content renderer ──────────────────────────────────────────────────────
function TabContent({
  tab,
  data,
  isOwn,
  isAdmin,
  userId,
  publishedCount,
  profileCreatedAt,
  profileBio,
  onDevlogDeleted,
}: {
  tab: TabId;
  data: TabData | undefined;
  isOwn: boolean;
  isAdmin: boolean;
  userId: string | null;
  publishedCount: number;
  profileCreatedAt: string;
  profileBio: string | null;
  onDevlogDeleted: (id: string) => void;
}) {
  if (!data) return null;

  if (tab === "about") {
    const { totalUpvotes } = data as AboutData;
    return (
      <div className="space-y-8">
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          <StatCard label="등록한 제품" value={publishedCount} />
          <StatCard label="받은 Boost" value={totalUpvotes} />
          <StatCard
            label="가입일"
            value={new Date(profileCreatedAt).toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "short",
            })}
          />
        </div>
        {profileBio && (
          <div>
            <h2 className="mb-2 text-base font-bold text-slate-900 dark:text-slate-100">소개</h2>
            <p className="whitespace-pre-wrap text-slate-600 dark:text-slate-300">{profileBio}</p>
          </div>
        )}
        {!profileBio && isOwn && (
          <div className="rounded-2xl border border-dashed border-slate-200 dark:border-navy-800 py-10 text-center">
            <p className="text-sm text-slate-400">아직 소개가 없습니다.</p>
            <Link href="/settings/profile" className="mt-1 inline-block text-xs text-blue-600 hover:underline">
              프로필 설정하기 →
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (tab === "activity") {
    const { comments, upvotes, devlogs } = data as ActivityData;

    // 시간순 병합
    type ActivityItem =
      | { kind: "comment"; id: string; content: string; created_at: string; product: { id: string; slug?: string; name: string } | null }
      | { kind: "upvote"; created_at: string; product: { id: string; slug?: string; name: string; thumbnail_url: string | null } | null }
      | { kind: "devlog"; id: string; title: string; created_at: string };

    const items: ActivityItem[] = [
      ...comments.map((c) => ({ kind: "comment" as const, ...c })),
      ...upvotes.map((u) => ({ kind: "upvote" as const, ...u })),
      ...devlogs.map((d) => ({ kind: "devlog" as const, ...d })),
    ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

    return items.length === 0 ? (
      <EmptyState message="아직 활동 내역이 없습니다." />
    ) : (
      <div className="space-y-3">
        {items.map((item, idx) => {
          if (item.kind === "comment") {
            return (
              <div key={`c-${item.id}`} className="rounded-2xl border border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4">
                <div className="mb-1.5 flex items-center gap-2">
                  <span className="rounded-full bg-blue-50 px-2 py-0.5 text-[11px] font-semibold text-blue-600">💬 댓글</span>
                  {item.product && (
                    <Link href={`/products/${item.product.slug ?? item.product.id}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:underline">
                      {item.product.name}
                    </Link>
                  )}
                </div>
                <p className="text-sm text-slate-700 dark:text-slate-300">{item.content}</p>
                <p className="mt-2 text-xs text-slate-300">{new Date(item.created_at).toLocaleDateString("ko-KR")}</p>
              </div>
            );
          }
          if (item.kind === "upvote") {
            return (
              <div key={`u-${idx}`} className="rounded-2xl border border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4">
                <div className="flex items-center gap-3">
                  {item.product?.thumbnail_url && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={item.product.thumbnail_url} alt="" className="h-9 w-9 flex-shrink-0 rounded-xl object-cover" />
                  )}
                  <div className="min-w-0 flex-1">
                    <div className="mb-0.5 flex items-center gap-2">
                      <span className="rounded-full bg-orange-50 px-2 py-0.5 text-[11px] font-semibold text-orange-500">🚀 Boost</span>
                      {item.product && (
                        <Link href={`/products/${item.product.slug ?? item.product.id}`} className="text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-blue-600 hover:underline">
                          {item.product.name}
                        </Link>
                      )}
                    </div>
                    <p className="text-xs text-slate-300">{new Date(item.created_at).toLocaleDateString("ko-KR")}</p>
                  </div>
                </div>
              </div>
            );
          }
          // devlog
          return (
            <div key={`d-${item.id}`} className="rounded-2xl border border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4">
              <div className="mb-1.5 flex items-center gap-2">
                <span className="rounded-full bg-violet-50 px-2 py-0.5 text-[11px] font-semibold text-violet-600">📝 Dev Log</span>
              </div>
              <Link href={`/devlog/${item.id}`} className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600 hover:underline">
                {item.title}
              </Link>
              <p className="mt-1.5 text-xs text-slate-300">{new Date(item.created_at).toLocaleDateString("ko-KR")}</p>
            </div>
          );
        })}
      </div>
    );
  }

  if (tab === "products") {
    const { isOwn: tabIsOwn, ownProducts, publicProducts } = data as ProductsData;
    if (tabIsOwn && ownProducts) {
      return <ProfileProducts products={ownProducts} isOwn={true} isAdmin={isAdmin} />;
    }
    if (!publicProducts || publicProducts.length === 0) {
      return <EmptyState message="아직 등록한 제품이 없습니다." />;
    }
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900">
        {publicProducts.map((p, i) => (
          <ProductCard key={p.id} product={p} rank={i + 1} variant="list" userId={userId} />
        ))}
      </div>
    );
  }

  if (tab === "boost") {
    const { boostedProducts } = data as BoostData;
    return boostedProducts.length === 0 ? (
      <EmptyState message="아직 업보트한 제품이 없습니다." />
    ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900">
        {boostedProducts.map((p, i) => (
          <ProductCard key={p.id} product={p} rank={i + 1} variant="list" userId={userId} />
        ))}
      </div>
    );
  }

  if (tab === "reviews") {
    const { reviews } = data as ReviewsData;
    return reviews.length === 0 ? (
      <EmptyState message="아직 작성한 리뷰가 없습니다." />
    ) : (
      <div className="space-y-4">
        {reviews.map((r) => (
          <div key={r.id} className="rounded-2xl border border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-5">
            {r.product && (
              <Link href={`/products/${r.product.slug ?? r.product.id}`} className="mb-2 flex items-center gap-2">
                {r.product.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.product.thumbnail_url}
                    alt={r.product.name}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                )}
                <span className="text-sm font-semibold text-slate-800 dark:text-slate-200 hover:text-blue-600">
                  {r.product.name}
                </span>
              </Link>
            )}
            <div className="mb-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < r.rating ? "text-amber-400" : "text-slate-200"}>★</span>
              ))}
            </div>
            <p className="text-sm text-slate-600 dark:text-slate-300">{r.content}</p>
            <p className="mt-2 text-xs text-slate-300">
              {new Date(r.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "devlog") {
    const { devlogs } = data as DevlogData;
    return (
      <DevlogTabContent
        devlogs={devlogs}
        isOwn={isOwn}
        onDevlogDeleted={onDevlogDeleted}
      />
    );
  }

  if (tab === "stack") {
    const { savedProducts } = data as StackData;
    return savedProducts.length === 0 ? (
      <div className="rounded-2xl border border-dashed border-slate-200 dark:border-navy-800 py-16 text-center">
        <p className="text-3xl">🔖</p>
        <p className="mt-3 text-sm font-semibold text-slate-600 dark:text-slate-300">스택이 비어있습니다</p>
        <p className="mt-1 text-xs text-slate-400">
          제품 카드나 상세 페이지의 <strong>스택</strong> 버튼으로 나중에 볼 제품을 저장해보세요.
        </p>
      </div>
    ) : (
      <div className="overflow-hidden rounded-2xl border border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900">
        {savedProducts.map((p, i) => (
          <ProductCard key={p.id} product={p} rank={i + 1} variant="list" userId={userId} />
        ))}
      </div>
    );
  }

  return null;
}

// ── DevlogTabContent (태그 필터 포함) ─────────────────────────────────────────
function DevlogTabContent({
  devlogs,
  isOwn,
  onDevlogDeleted,
}: {
  devlogs: DevlogData["devlogs"];
  isOwn: boolean;
  onDevlogDeleted: (id: string) => void;
}) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);

  // 전체 태그 목록 (중복 제거, 사용 빈도순)
  const tagCounts = devlogs.reduce<Record<string, number>>((acc, post) => {
    post.tags.forEach((tag) => { acc[tag] = (acc[tag] ?? 0) + 1; });
    return acc;
  }, {});
  const allTags = Object.entries(tagCounts).sort((a, b) => b[1] - a[1]).map(([tag]) => tag);

  const filtered = selectedTag
    ? devlogs.filter((p) => p.tags.includes(selectedTag))
    : devlogs;

  if (devlogs.length === 0) {
    return (
      <EmptyState
        message="아직 작성한 Dev Log가 없습니다."
        href={isOwn ? "/devlog/new" : undefined}
        linkText="첫 Dev Log 작성하기 →"
      />
    );
  }

  return (
    <div className="space-y-4">
      {/* 태그 필터 */}
      {allTags.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedTag(null)}
            className={`rounded-full px-3 py-1 text-xs font-medium transition ${
              selectedTag === null
                ? "bg-slate-900 dark:bg-blue-600 text-white"
                : "bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700"
            }`}
          >
            전체 <span className={`ml-0.5 ${selectedTag === null ? "text-slate-300" : "text-slate-400"}`}>{devlogs.length}</span>
          </button>
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() => setSelectedTag(selectedTag === tag ? null : tag)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                selectedTag === tag
                  ? "bg-slate-900 dark:bg-blue-600 text-white"
                  : "bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700"
              }`}
            >
              #{tag} <span className={`ml-0.5 ${selectedTag === tag ? "text-slate-300" : "text-slate-400"}`}>{tagCounts[tag]}</span>
            </button>
          ))}
        </div>
      )}

      {/* 글 목록 */}
      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-400">해당 태그의 글이 없습니다.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((post) => (
            <DevlogCard
              key={post.id}
              post={post}
              isOwn={isOwn}
              onDeleted={onDevlogDeleted}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4 text-center">
      <p className="text-2xl font-black text-navy-900 dark:text-slate-100">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{label}</p>
    </div>
  );
}

// ── DevlogCard ────────────────────────────────────────────────────────────────
function DevlogCard({
  post,
  isOwn,
  onDeleted,
}: {
  post: {
    id: string; slug?: string; title: string; tags: string[];
    thumbnail_url: string | null;
    like_count: number; comment_count: number; created_at: string;
  };
  isOwn: boolean;
  onDeleted: (id: string) => void;
}) {
  const [isPending, startTransition] = useTransition();

  const handleDelete = () => {
    if (!window.confirm("정말 이 Dev Log를 삭제할까요? 되돌릴 수 없습니다.")) return;
    startTransition(async () => {
      const result = await deleteDevlogPostSilent(post.id);
      if (result.success) onDeleted(post.id);
      else alert(result.error ?? "삭제에 실패했습니다.");
    });
  };

  return (
    <div className="rounded-2xl border border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900 p-4 transition hover:border-blue-200 hover:shadow-sm">
      <div className="flex items-start gap-4">
        {/* 썸네일 */}
        <Link href={`/devlog/${post.slug ?? post.id}`} className="relative h-20 w-28 flex-shrink-0 overflow-hidden rounded-xl bg-gradient-to-br from-slate-100 to-slate-50 dark:from-navy-800 dark:to-navy-800">
          {post.thumbnail_url ? (
            <Image
              src={post.thumbnail_url}
              alt={post.title}
              fill
              className="object-cover"
              sizes="112px"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-2xl select-none">📝</div>
          )}
        </Link>

        {/* 텍스트 영역 */}
        <div className="flex min-w-0 flex-1 flex-col">
          <Link href={`/devlog/${post.slug ?? post.id}`} className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600 leading-snug line-clamp-2">
            {post.title}
          </Link>

          {post.tags.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {post.tags.slice(0, 3).map((tag) => (
                <span key={tag} className="rounded-full bg-slate-100 dark:bg-navy-800 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400">
                  #{tag}
                </span>
              ))}
            </div>
          )}

          <div className="mt-3 flex items-center gap-3 text-xs text-slate-400">
            <span>❤️ {post.like_count}</span>
            <span>💬 {post.comment_count}</span>
            <span className="ml-auto">{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
          </div>

          {/* 수정/삭제 (본인만) */}
          {isOwn && (
            <div className="mt-3 flex gap-2 border-t border-slate-100 dark:border-navy-800 pt-3">
              <Link
                href={`/devlog/${post.slug ?? post.id}/edit`}
                className="rounded-lg border border-slate-200 dark:border-navy-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 transition hover:border-blue-400 hover:text-blue-600"
              >
                수정
              </Link>
              <button
                onClick={handleDelete}
                disabled={isPending}
                className="rounded-lg border border-slate-200 dark:border-navy-800 px-3 py-1 text-xs font-medium text-slate-600 dark:text-slate-300 transition hover:border-red-400 hover:text-red-600 disabled:opacity-40"
              >
                {isPending ? "삭제 중…" : "삭제"}
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function EmptyState({
  message,
  href,
  linkText,
}: {
  message: string;
  href?: string;
  linkText?: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 dark:border-navy-800 py-14 text-center">
      <p className="text-slate-400">{message}</p>
      {href && linkText && (
        <Link href={href} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
          {linkText}
        </Link>
      )}
    </div>
  );
}
