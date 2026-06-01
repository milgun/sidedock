"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import type { ProductWithMaker } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import ProfileProducts from "@/components/profile/ProfileProducts";

// ── Tab definition ────────────────────────────────────────────────────────────
const TABS = [
  { id: "about",    label: "소개" },
  { id: "activity", label: "활동" },
  { id: "products", label: "제품" },
  { id: "boost",    label: "업보트" },
  { id: "reviews",  label: "리뷰" },
  { id: "devlog",   label: "Dev Log" },
] as const;

type TabId = (typeof TABS)[number]["id"];

// ── Tab data types ────────────────────────────────────────────────────────────
interface AboutData   { publishedCount: number; totalUpvotes: number }
interface ActivityData {
  activities: Array<{
    id: string; content: string; created_at: string;
    product: { id: string; name: string } | null;
  }>;
}
interface ProductsData {
  isOwn: boolean;
  ownProducts?: Array<{
    id: string; name: string; tagline: string; thumbnail_url: string | null;
    status: string; rejection_reason: string | null; created_at: string; upvote_count: number;
  }>;
  publicProducts?: ProductWithMaker[];
}
interface BoostData   { boostedProducts: ProductWithMaker[] }
interface ReviewsData {
  reviews: Array<{
    id: string; rating: number; content: string; created_at: string;
    product: { id: string; name: string; thumbnail_url: string | null } | null;
  }>;
}
interface DevlogData {
  devlogs: Array<{
    id: string; title: string; tags: string[];
    like_count: number; comment_count: number; created_at: string;
  }>;
}

type TabData = AboutData | ActivityData | ProductsData | BoostData | ReviewsData | DevlogData;

// ── Props ─────────────────────────────────────────────────────────────────────
interface ProfileTabsClientProps {
  username: string;
  isOwn: boolean;
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

  const handleTabChange = (tab: TabId) => {
    setActiveTab(tab);
    window.history.replaceState(null, "", `/profile/${username}?tab=${tab}`);
    fetchTab(tab);
  };

  const currentData = tabData[activeTab];

  return (
    <>
      {/* ── Tab Navigation ── */}
      <nav className="mb-8 flex gap-1 border-b border-slate-100">
        {TABS.map((tab) => {
          const active = activeTab === tab.id;
          const count = tab.id === "products" ? publishedCount : undefined;
          return (
            <button
              key={tab.id}
              onClick={() => handleTabChange(tab.id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
                active
                  ? "border-slate-900 text-slate-900"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              }`}
            >
              {tab.label}
              {count !== undefined && count > 0 && (
                <span
                  className={`rounded-full px-1.5 py-0.5 text-xs leading-none ${
                    active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
                  }`}
                >
                  {count}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* ── Tab Content ── */}
      {loading && !currentData ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-slate-600" />
        </div>
      ) : (
        <TabContent
          tab={activeTab}
          data={currentData}
          isOwn={isOwn}
          userId={userId}
          username={username}
          publishedCount={publishedCount}
          profileCreatedAt={profileCreatedAt}
          profileBio={profileBio}
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
  userId,
  username,
  publishedCount,
  profileCreatedAt,
  profileBio,
}: {
  tab: TabId;
  data: TabData | undefined;
  isOwn: boolean;
  userId: string | null;
  username: string;
  publishedCount: number;
  profileCreatedAt: string;
  profileBio: string | null;
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
            <h2 className="mb-2 text-base font-bold text-slate-900">소개</h2>
            <p className="whitespace-pre-wrap text-slate-600">{profileBio}</p>
          </div>
        )}
        {!profileBio && isOwn && (
          <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
            <p className="text-sm text-slate-400">아직 소개가 없습니다.</p>
            <Link href="/settings" className="mt-1 inline-block text-xs text-blue-600 hover:underline">
              프로필 설정하기 →
            </Link>
          </div>
        )}
      </div>
    );
  }

  if (tab === "activity") {
    const { activities } = data as ActivityData;
    return activities.length === 0 ? (
      <EmptyState message="아직 활동 내역이 없습니다." />
    ) : (
      <div className="space-y-3">
        {activities.map((a) => (
          <div key={a.id} className="rounded-2xl border border-slate-100 bg-white p-4">
            {a.product && (
              <Link
                href={`/products/${a.product.id}`}
                className="mb-1 block text-xs font-semibold text-blue-600 hover:underline"
              >
                {a.product.name}
              </Link>
            )}
            <p className="text-sm text-slate-700">{a.content}</p>
            <p className="mt-2 text-xs text-slate-300">
              {new Date(a.created_at).toLocaleDateString("ko-KR")}
            </p>
          </div>
        ))}
      </div>
    );
  }

  if (tab === "products") {
    const { isOwn: tabIsOwn, ownProducts, publicProducts } = data as ProductsData;
    if (tabIsOwn && ownProducts) {
      return <ProfileProducts products={ownProducts} isOwn={true} />;
    }
    if (!publicProducts || publicProducts.length === 0) {
      return <EmptyState message="아직 등록한 제품이 없습니다." />;
    }
    return (
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
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
      <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
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
          <div key={r.id} className="rounded-2xl border border-slate-100 bg-white p-5">
            {r.product && (
              <Link href={`/products/${r.product.id}`} className="mb-2 flex items-center gap-2">
                {r.product.thumbnail_url && (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.product.thumbnail_url}
                    alt={r.product.name}
                    className="h-8 w-8 rounded-lg object-cover"
                  />
                )}
                <span className="text-sm font-semibold text-slate-800 hover:text-blue-600">
                  {r.product.name}
                </span>
              </Link>
            )}
            <div className="mb-2 flex items-center gap-1">
              {Array.from({ length: 5 }).map((_, i) => (
                <span key={i} className={i < r.rating ? "text-amber-400" : "text-slate-200"}>★</span>
              ))}
            </div>
            <p className="text-sm text-slate-600">{r.content}</p>
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
    return devlogs.length === 0 ? (
      <EmptyState
        message="아직 작성한 Dev Log가 없습니다."
        href={isOwn ? "/devlog/new" : undefined}
        linkText="첫 Dev Log 작성하기 →"
      />
    ) : (
      <div className="space-y-3">
        {devlogs.map((post) => (
          <Link
            key={post.id}
            href={`/devlog/${post.id}`}
            className="block rounded-2xl border border-slate-100 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
          >
            <h3 className="font-semibold text-slate-900">{post.title}</h3>
            {post.tags.length > 0 && (
              <div className="mt-2 flex flex-wrap gap-1">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500"
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}
            <div className="mt-3 flex items-center gap-3 text-xs text-slate-300">
              <span>❤️ {post.like_count}</span>
              <span>💬 {post.comment_count}</span>
              <span>{new Date(post.created_at).toLocaleDateString("ko-KR")}</span>
            </div>
          </Link>
        ))}
      </div>
    );
  }

  return null;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function StatCard({ label, value }: { label: string; value: number | string }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white p-4 text-center">
      <p className="text-2xl font-black text-navy-900">{value}</p>
      <p className="mt-0.5 text-xs text-slate-400">{label}</p>
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
    <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center">
      <p className="text-slate-400">{message}</p>
      {href && linkText && (
        <Link href={href} className="mt-2 inline-block text-xs text-blue-600 hover:underline">
          {linkText}
        </Link>
      )}
    </div>
  );
}
