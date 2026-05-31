import { createClient, getUser } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { ProductWithMaker } from "@/types";
import ProductCard from "@/components/product/ProductCard";
import ProfileTabNav from "@/components/profile/ProfileTabNav";
import ProfileProducts from "@/components/profile/ProfileProducts";

type Tab = "about" | "activity" | "products" | "boost" | "reviews" | "devlog";

export default async function ProfilePage(props: {
  params: Promise<{ username: string }>;
  searchParams: Promise<{ tab?: string; status?: string }>;
}) {
  const { username } = await props.params;
  const { tab: rawTab } = await props.searchParams;
  const tab: Tab = (rawTab as Tab) || "about";

  const supabase = await createClient();

  const [{ data: profile }, user] = await Promise.all([
    supabase.from("profiles").select("*").eq("username", username).maybeSingle(),
    getUser(),
  ]);

  if (!profile) notFound();

  const isOwn = user?.id === profile.id;
  const userId = user?.id ?? null;

  // ── Always-needed: published product count for stats ─────────────────────
  const { count: publishedCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("maker_id", profile.id)
    .eq("status", "published");

  // ── Tab-specific data fetching ────────────────────────────────────────────

  // 소개 탭: 통계용 upvote 합산
  let totalUpvotes = 0;
  if (tab === "about") {
    const { data: pubProducts } = await supabase
      .from("products")
      .select("upvote_count")
      .eq("maker_id", profile.id)
      .eq("status", "published");
    totalUpvotes = (pubProducts ?? []).reduce((s, p) => s + (p.upvote_count as number), 0);
  }

  // 활동 탭: 이 유저가 작성한 댓글
  type CommentWithProduct = {
    id: string;
    content: string;
    created_at: string;
    product: { id: string; name: string } | null;
  };
  let activities: CommentWithProduct[] = [];
  if (tab === "activity") {
    const { data } = await supabase
      .from("comments")
      .select("id, content, created_at, product:products(id, name)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30);
    activities = (data ?? []) as unknown as CommentWithProduct[];
  }

  // 제품 탭
  type OwnProduct = {
    id: string;
    name: string;
    tagline: string;
    thumbnail_url: string | null;
    status: string;
    rejection_reason: string | null;
    created_at: string;
    upvote_count: number;
  };
  let ownProducts: OwnProduct[] = [];
  let publicProducts: ProductWithMaker[] = [];

  if (tab === "products") {
    if (isOwn) {
      // 본인: 모든 status 포함
      const { data } = await supabase
        .from("products")
        .select("id, name, tagline, thumbnail_url, status, rejection_reason, created_at, upvote_count")
        .eq("maker_id", profile.id)
        .order("created_at", { ascending: false });
      ownProducts = (data ?? []) as OwnProduct[];
    } else {
      // 타인: published만
      const [{ data }, { data: uv }] = await Promise.all([
        supabase
          .from("products")
          .select("*, maker:profiles(id, username, avatar_url, display_name)")
          .eq("maker_id", profile.id)
          .eq("status", "published")
          .order("upvote_count", { ascending: false }),
        userId
          ? supabase.from("upvotes").select("product_id").eq("user_id", userId)
          : Promise.resolve({ data: [] as { product_id: string }[] }),
      ]);
      const upvotedIds = new Set<string>(
        (uv ?? []).map((u: { product_id: string }) => u.product_id)
      );
      publicProducts = (data ?? []).map((p) => ({
        ...p,
        has_upvoted: upvotedIds.has(p.id as string),
      })) as unknown as ProductWithMaker[];
    }
  }

  // 업보트 탭
  let boostedProducts: ProductWithMaker[] = [];
  if (tab === "boost") {
    const [{ data: upvotes }, { data: uv }] = await Promise.all([
      supabase
        .from("upvotes")
        .select("product:products(*, maker:profiles(id, username, avatar_url, display_name))")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(30),
      userId
        ? supabase.from("upvotes").select("product_id").eq("user_id", userId)
        : Promise.resolve({ data: [] as { product_id: string }[] }),
    ]);
    const myUpvotedIds = new Set<string>(
      (uv ?? []).map((u: { product_id: string }) => u.product_id)
    );

    boostedProducts = (upvotes ?? [])
      .map((u: Record<string, unknown>) => u.product)
      .filter((p): p is Record<string, unknown> => Boolean(p))
      .filter((p) => (p as { status?: string }).status === "published")
      .map((p) => ({
        ...p,
        has_upvoted: myUpvotedIds.has((p as { id: string }).id),
      })) as unknown as ProductWithMaker[];
  }

  // 리뷰 탭
  type ReviewWithProduct = {
    id: string;
    rating: number;
    content: string;
    created_at: string;
    product: { id: string; name: string; thumbnail_url: string | null } | null;
  };
  let reviews: ReviewWithProduct[] = [];
  if (tab === "reviews") {
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, content, created_at, product:products(id, name, thumbnail_url)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30);
    reviews = (data ?? []) as unknown as ReviewWithProduct[];
  }

  // Dev Log 탭
  type DevlogRow = {
    id: string;
    title: string;
    tags: string[];
    like_count: number;
    comment_count: number;
    created_at: string;
  };
  let devlogs: DevlogRow[] = [];
  if (tab === "devlog") {
    const { data } = await supabase
      .from("devlog_posts")
      .select("id, title, tags, like_count, comment_count, created_at")
      .eq("author_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30);
    devlogs = (data ?? []) as DevlogRow[];
  }

  // ── Badge counts for tab nav ──────────────────────────────────────────────
  const productCounts = isOwn && tab === "products"
    ? { products: ownProducts.length }
    : { products: publishedCount ?? 0 };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* ── Profile Header ── */}
      <div className="mb-8 flex flex-col items-center gap-5 text-center sm:flex-row sm:text-left">
        <div className="flex h-20 w-20 flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-navy-900 ring-4 ring-blue-100">
          {profile.avatar_url ? (
            <Image
              src={profile.avatar_url as string}
              alt={profile.display_name ?? username}
              width={80}
              height={80}
              className="h-full w-full object-cover"
            />
          ) : (
            <span className="text-2xl font-black text-white">
              {((profile.display_name ?? username) as string)[0]?.toUpperCase()}
            </span>
          )}
        </div>

        <div className="flex-1">
          <h1 className="text-2xl font-black text-slate-900">
            {profile.display_name ?? username}
          </h1>
          <p className="text-sm text-slate-400">@{username}</p>
          {profile.bio && (
            <p className="mt-2 text-slate-600">{profile.bio as string}</p>
          )}
          <div className="mt-3 flex flex-wrap justify-center gap-4 sm:justify-start">
            {profile.website_url && (
              <a
                href={profile.website_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                🌐 웹사이트
              </a>
            )}
            {profile.twitter_url && (
              <a
                href={profile.twitter_url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-600 hover:underline"
              >
                𝕏 Twitter
              </a>
            )}
          </div>
        </div>

        {isOwn && (
          <Link
            href="/settings"
            className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
          >
            프로필 수정
          </Link>
        )}
      </div>

      {/* ── Tab Navigation ── */}
      <ProfileTabNav
        username={username}
        activeTab={tab}
        productCounts={productCounts}
      />

      {/* ── Tab Content ── */}

      {/* 소개 */}
      {tab === "about" && (
        <div className="space-y-8">
          {/* Stats */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
            <StatCard label="등록한 제품" value={publishedCount ?? 0} />
            <StatCard label="받은 Boost" value={totalUpvotes} />
            <StatCard
              label="가입일"
              value={new Date(profile.created_at as string).toLocaleDateString("ko-KR", {
                year: "numeric",
                month: "short",
              })}
            />
          </div>
          {/* Bio */}
          {profile.bio && (
            <div>
              <h2 className="mb-2 text-base font-bold text-slate-900">소개</h2>
              <p className="whitespace-pre-wrap text-slate-600">{profile.bio as string}</p>
            </div>
          )}
          {!profile.bio && isOwn && (
            <div className="rounded-2xl border border-dashed border-slate-200 py-10 text-center">
              <p className="text-sm text-slate-400">아직 소개가 없습니다.</p>
              <Link href="/settings" className="mt-1 inline-block text-xs text-blue-600 hover:underline">
                프로필 설정하기 →
              </Link>
            </div>
          )}
        </div>
      )}

      {/* 활동 */}
      {tab === "activity" && (
        <div>
          {activities.length === 0 ? (
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
          )}
        </div>
      )}

      {/* 제품 */}
      {tab === "products" && (
        isOwn ? (
          <ProfileProducts products={ownProducts} isOwn={true} />
        ) : publicProducts.length === 0 ? (
          <EmptyState message="아직 등록한 제품이 없습니다." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            {publicProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} rank={i + 1} variant="list" userId={userId} />
            ))}
          </div>
        )
      )}

      {/* 업보트 */}
      {tab === "boost" && (
        boostedProducts.length === 0 ? (
          <EmptyState message="아직 업보트한 제품이 없습니다." />
        ) : (
          <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
            {boostedProducts.map((p, i) => (
              <ProductCard key={p.id} product={p} rank={i + 1} variant="list" userId={userId} />
            ))}
          </div>
        )
      )}

      {/* 리뷰 */}
      {tab === "reviews" && (
        reviews.length === 0 ? (
          <EmptyState message="아직 작성한 리뷰가 없습니다." />
        ) : (
          <div className="space-y-4">
            {reviews.map((r) => (
              <div key={r.id} className="rounded-2xl border border-slate-100 bg-white p-5">
                {r.product && (
                  <Link
                    href={`/products/${r.product.id}`}
                    className="mb-2 flex items-center gap-2"
                  >
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
        )
      )}

      {/* Dev Log */}
      {tab === "devlog" && (
        devlogs.length === 0 ? (
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
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
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
        )
      )}
    </div>
  );
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
