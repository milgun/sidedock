import { createClient, getUser } from "@/lib/supabase/server";
import Link from "next/link";
import type { ProductWithMaker } from "@/types";
import ExpandableProductList from "@/components/home/ExpandableProductList";
import WelcomeBanner from "@/components/home/WelcomeBanner";

export default async function HomePage() {
  const supabase = await createClient();
  const user = await getUser();

  const [
    { data: rawCurated },
    { data: rawNew },
    { data: rawHot },
    { data: upvotes },
  ] = await Promise.all([
    supabase
      .from("products")
      .select("*, maker:profiles(id, username, avatar_url, display_name)")
      .eq("source", "curated")
      .eq("status", "published")
      .order("upvote_count", { ascending: false })
      .limit(50),
    supabase
      .from("products")
      .select("*, maker:profiles(id, username, avatar_url, display_name)")
      .eq("source", "launch")
      .eq("status", "published")
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("products")
      .select("*, maker:profiles(id, username, avatar_url, display_name)")
      .eq("source", "launch")
      .eq("status", "published")
      .order("upvote_count", { ascending: false })
      .order("comment_count", { ascending: false })
      .limit(50),
    user
      ? supabase.from("upvotes").select("product_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { product_id: string }[] }),
  ]);

  const upvotedIds = new Set<string>(
    (upvotes ?? []).map((u: { product_id: string }) => u.product_id),
  );

  type RawProduct = Record<string, unknown>;
  const enrich = (p: RawProduct): ProductWithMaker =>
    ({ ...p, has_upvoted: upvotedIds.has(p.id as string) }) as unknown as ProductWithMaker;

  const curatedProducts = (rawCurated ?? []).map(enrich);
  const newLaunches = (rawNew ?? []).map(enrich);
  const hotLaunches = (rawHot ?? []).map(enrich);
  const userId = user?.id ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8">
      <WelcomeBanner />

      {/* ── Section A: 에디터 큐레이션 ── */}
      <section>
        <SectionHeader
          icon="📌"
          title="에디터 큐레이션"
          desc="Sidedock 팀이 직접 고른 유용한 도구들"
          href="/hot"
          linkText="큐레이션 전체 보기"
        />
        {curatedProducts.length > 0 ? (
          <ExpandableProductList
            products={curatedProducts}
            initialCount={5}
            pageSize={10}
            userId={userId}
            context="launch-rank"
          />
        ) : (
          <EmptyState
            icon="📌"
            message="아직 큐레이션 제품이 없습니다."
            href="/submit"
            linkText="첫 번째 제품 제안하기 →"
          />
        )}
      </section>

      {/* ── Section B: 신규 런치 ── */}
      <section className="mt-14">
        <SectionHeader
          icon="🚀"
          title="신규 런치"
          desc="메이커들이 새롭게 공개한 제품들"
          href="/launches?period=today"
          linkText="런치 전체 보기"
        />
        {newLaunches.length > 0 ? (
          <ExpandableProductList
            products={newLaunches}
            initialCount={6}
            pageSize={10}
            userId={userId}
            variant="grid"
          />
        ) : (
          <EmptyState
            icon="🚀"
            message="아직 런치된 제품이 없습니다."
            href="/submit"
            linkText="첫 번째로 런치하기 →"
          />
        )}
      </section>

      {/* ── Section C: 인기 런치 ── */}
      <section className="mt-14 pb-16">
        <SectionHeader
          icon="🔥"
          title="인기 런치"
          desc="Boost · 댓글 기준 상위 제품들"
          href="/launches?period=all"
          linkText="전체 보기"
        />
        {hotLaunches.length > 0 ? (
          <ExpandableProductList
            products={hotLaunches}
            initialCount={5}
            pageSize={10}
            userId={userId}
            context="hot"
          />
        ) : (
          <EmptyState
            icon="🔥"
            message="아직 인기 런치 제품이 없습니다."
            href="/submit"
            linkText="런치에 참여하기 →"
          />
        )}
      </section>
    </div>
  );
}

function SectionHeader({
  icon,
  title,
  desc,
  href,
  linkText,
}: {
  icon: string;
  title: string;
  desc: string;
  href: string;
  linkText: string;
}) {
  return (
    <div className="mb-5 flex items-start justify-between gap-4">
      <div>
        <h2 className="flex items-center gap-2 text-lg font-black text-slate-900 dark:text-slate-100">
          <span>{icon}</span>
          <span>{title}</span>
        </h2>
        <p className="mt-0.5 text-sm text-slate-400">{desc}</p>
      </div>
      <Link
        href={href}
        className="mt-1 flex-shrink-0 text-xs text-slate-400 transition hover:text-blue-600"
      >
        {linkText} →
      </Link>
    </div>
  );
}

function EmptyState({
  icon,
  message,
  href,
  linkText,
}: {
  icon: string;
  message: string;
  href: string;
  linkText: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 py-12 text-center dark:border-navy-700">
      <p className="text-2xl">{icon}</p>
      <p className="mt-3 text-sm font-medium text-slate-600 dark:text-slate-300">{message}</p>
      <Link
        href={href}
        className="mt-2 inline-block font-mono text-xs text-slate-400 underline hover:text-blue-600"
      >
        {linkText}
      </Link>
    </div>
  );
}