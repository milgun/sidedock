import { createClient, getUser } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import type { ProductWithMaker } from "@/types";
import ExpandableProductList from "@/components/home/ExpandableProductList";
import WelcomeBanner from "@/components/home/WelcomeBanner";
import DevlogHomeList from "@/components/home/DevlogHomeList";
import type { DevlogPostWithAuthor } from "@/types";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/components/product/ProductCard";

export default async function HomePage() {
  const supabase = await createClient();
  const user = await getUser();

  const [
    { data: rawCurated },
    { data: rawNew },
    { data: rawDevlogs },
    { data: rawHot },
    { data: rawDiscovery },
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
      .from("devlog_posts")
      .select("*, author:profiles(id, username, avatar_url, display_name)")
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
    supabase
      .from("products")
      .select("*, maker:profiles(id, username, avatar_url, display_name)")
      .eq("source", "launch")
      .eq("status", "published")
      .eq("is_discovery_pick", true)
      .order("discovery_picked_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
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
  const devlogs = (rawDevlogs ?? []) as unknown as DevlogPostWithAuthor[];
  const hotLaunches = (rawHot ?? []).map(enrich);
  const discovery = rawDiscovery ? enrich(rawDiscovery as RawProduct) : null;
  const userId = user?.id ?? null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 min-[1400px]:max-w-[88rem]">
      <div className="grid grid-cols-1 min-[1400px]:grid-cols-[20rem_minmax(0,46rem)_20rem] min-[1400px]:items-start">
        <div className="order-1 mx-auto w-full max-w-[46rem] min-[1400px]:col-start-2">
          <WelcomeBanner />
        </div>

        <main className="order-3 min-w-0 min-[1400px]:order-none min-[1400px]:col-start-2 min-[1400px]:row-start-2">
          {/* ── Section A: 신규 런치 ── */}
          <section className="mt-14 lg:mt-0">
            <SectionHeader
              icon="🚀"
              title="신규 런치"
              desc="메이커들이 새롭게 공개한 제품들"
              href="/launches?period=week"
              linkText="런치 전체 보기"
            />
            {newLaunches.length > 0 ? (
              <ExpandableProductList
                products={newLaunches}
                initialCount={6}
                pageSize={6}
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

          {/* ── Section B: Dev Log ── */}
          <section className="mt-14">
            <SectionHeader
              icon="📝"
              title="Dev Log"
              desc="메이커와 개발자들의 빌드 기록"
              href="/devlog"
              linkText="Dev Log 전체 보기"
            />
            {devlogs.length > 0 ? (
              <DevlogHomeList posts={devlogs} />
            ) : (
              <EmptyState icon="📝" message="아직 작성된 Dev Log가 없습니다." href="/devlog/new" linkText="첫 번째 기록 남기기 →" />
            )}
          </section>

          {/* ── Section C: 인기 런치 ── */}
          <section className="mt-14">
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

          {/* ── Section D: 에디터 큐레이션 ── */}
          <section className="mt-14 pb-16">
            <SectionHeader
              icon="📌"
              title="에디터 큐레이션"
              desc="Sidedock 팀이 직접 고른 유용한 도구들"
              href="/hot"
              linkText="큐레이션 전체 보기"
            />
            {curatedProducts.length > 0 ? (
              <ExpandableProductList products={curatedProducts} initialCount={5} pageSize={10} userId={userId} context="launch-rank" />
            ) : (
              <EmptyState icon="📌" message="아직 큐레이션 제품이 없습니다." href="/submit" linkText="첫 번째 제품 제안하기 →" />
            )}
          </section>
        </main>

        {discovery && <TodayDiscovery product={discovery} />}
      </div>
    </div>
  );
}

function TodayDiscovery({ product }: { product: ProductWithMaker }) {
  const categories = product.categories?.length ? product.categories : [product.category];
  const makerName = product.maker?.display_name ?? product.maker?.username ?? "Sidedock";

  return (
    <aside className="order-2 mb-10 hidden lg:block min-[1400px]:order-none min-[1400px]:col-start-3 min-[1400px]:row-span-2 min-[1400px]:row-start-1 min-[1400px]:mb-0 min-[1400px]:sticky min-[1400px]:top-20">
      <div className="border-y border-slate-200 py-5 dark:border-navy-800 min-[1400px]:border-y-0 min-[1400px]:py-1 min-[1400px]:pl-7">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold text-blue-600 dark:text-blue-400">TODAY&apos;S DISCOVERY</p>
            <h2 className="mt-1 text-base font-black text-slate-900 dark:text-slate-100">오늘의 발견</h2>
          </div>
          <span className="text-lg" aria-hidden="true">✦</span>
        </div>

        <Link href={`/products/${product.slug}`} className="group block">
          <div className="flex items-start gap-3">
            <div className="flex h-12 w-12 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 ring-1 ring-black/5 dark:bg-navy-800 dark:ring-0">
              {product.thumbnail_url ? (
                <Image src={product.thumbnail_url} alt={product.name} width={48} height={48} className="h-full w-full object-cover" unoptimized />
              ) : (
                <span className="text-xl font-black text-slate-400">{product.name[0]?.toUpperCase()}</span>
              )}
            </div>
            <div className="min-w-0">
              <h3 className="truncate font-bold text-slate-900 transition group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">{product.name}</h3>
              <p className="mt-0.5 line-clamp-2 text-sm leading-5 text-slate-500 dark:text-slate-400">{product.tagline}</p>
            </div>
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {categories.slice(0, 2).map((category) => (
              <span key={category} className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${CATEGORY_COLORS[category] ?? CATEGORY_COLORS.other}`}>
                {CATEGORY_LABELS[category] ?? category}
              </span>
            ))}
          </div>

          <p className="mt-4 border-l-2 border-blue-500 pl-3 text-sm leading-5 text-slate-600 dark:text-slate-300">
            Sidedock이 발견한 {makerName}의 새 서비스입니다.
          </p>
          <span className="mt-4 inline-flex text-sm font-semibold text-blue-600 transition group-hover:text-blue-700 dark:text-blue-400">
            제품 자세히 보기 →
          </span>
        </Link>
      </div>
    </aside>
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