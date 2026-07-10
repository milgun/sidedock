import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ProductWithMaker, Comment, Profile, ProductLink, ProductTeamMember, ProductShoutout } from "@/types";
import UpvoteButton from "@/components/product/UpvoteButton";
import StackButton from "@/components/product/StackButton";
import ShareButton from "@/components/product/ShareButton";
import ProductTabs from "@/components/product/ProductTabs";
import ClaimButton from "@/components/product/ClaimButton";
import BrandIcon, { BRAND_LABELS } from "@/components/product/BrandIcon";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/components/product/ProductCard";

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug: rawSlug } = await props.params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, tagline, thumbnail_url, description")
    .eq("slug", slug)
    .single();

  if (!product) return {};

  const title = product.name as string;
  const description = (
    (product.tagline as string | null) ??
    (product.description as string | null)?.slice(0, 120) ??
    ""
  );
  const images = product.thumbnail_url
    ? [{ url: product.thumbnail_url as string, width: 512, height: 512 }]
    : [{ url: "/og-default.png", width: 1200, height: 630 }];

  return {
    title,
    description,
    openGraph: {
      title: `${title} — Sidedock`,
      description,
      type: "website",
      locale: "ko_KR",
      images,
    },
    twitter: {
      card: product.thumbnail_url ? "summary" : "summary_large_image",
      title: `${title} — Sidedock`,
      description,
      images: images.map((i) => i.url),
    },
  };
}

export default async function ProductDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await props.params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();

  const {
    data: { user: earlyUser },
  } = await supabase.auth.getUser();

  // slug 먼저 조회, 없으면 UUID 폴백
  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const { data: product, error } = await supabase
    .from("products")
    .select("*, maker:profiles(*)")
    .eq(isUUID ? "id" : "slug", slug)
    .single();

  if (!product || error) notFound();

  // Block access to non-published products unless viewer is the maker or an admin
  const isProductOwner = earlyUser?.id === (product.maker_id as string);
  const { data: viewerProfile } = earlyUser
    ? await supabase
        .from("profiles")
        .select("is_admin")
        .eq("id", earlyUser.id)
        .single()
    : { data: null };

  const productStatus = product.status as string | undefined;
  if (
    productStatus &&
    productStatus !== "published" &&
    !isProductOwner &&
    !viewerProfile?.is_admin
  ) {
    notFound();
  }

  const [{ data: rawComments }, { data: rawLinks }, { data: rawTeam }, { data: rawShoutouts }, { data: rawReviews }, { data: rawReactions }] =
    await Promise.all([
      supabase.from("comments").select("*, profile:profiles(*)").eq("product_id", product.id).order("created_at", { ascending: true }),
      supabase.from("product_links").select("*").eq("product_id", product.id).order("sort_order"),
      supabase.from("product_team_members").select("*, profile:profiles(id, username, display_name, avatar_url)").eq("product_id", product.id),
      supabase.from("product_shoutouts").select("*").eq("product_id", product.id).order("sort_order"),
      supabase.from("reviews").select("*, profile:profiles(id, username, display_name, avatar_url)").eq("product_id", product.id).order("created_at", { ascending: false }),
      supabase.from("comment_reactions").select("*").in(
        "comment_id",
        ((await supabase.from("comments").select("id").eq("product_id", product.id)).data ?? []).map((c: { id: string }) => c.id)
      ),
    ]);

  // 메이커가 출시한 다른 제품 — Launches 제품에만 표시 (curated 제외)
  const productSource = product.source as string;
  const makerId = product.maker_id as string;
  let rawMakerProducts: { id: string; name: string; slug: string; thumbnail_url: string | null }[] | null = null;
  if (productSource === "launch") {
    const { data } = await supabase
      .from("products")
      .select("id, name, slug, thumbnail_url")
      .eq("maker_id", makerId)
      .eq("status", "published")
      .eq("source", "launch")
      .neq("id", product.id)
      .order("launched_at", { ascending: false })
      .limit(5);
    rawMakerProducts = data as typeof rawMakerProducts;
  }

  const user = earlyUser;

  let hasUpvoted = false;
  let hasSaved = false;
  if (user) {
    const { data: upvote } = await supabase
      .from("upvotes")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();
    hasUpvoted = !!upvote;
  }

  let userHasReview = false;
  if (user) {
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();
    userHasReview = !!existingReview;

    const { data: savedRow } = await supabase
      .from("saved_products")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", product.id)
      .maybeSingle();
    hasSaved = !!savedRow;
  }

  // 소유권 클레임 상태 (본인 기준) — 헌터가 소유 중인 제품(curated 또는 hunter 등록)만 대상
  let claimStatus: "pending" | "approved" | "rejected" | null = null;
  const isClaimable =
    (product.source as string) === "curated" ||
    (product.maker_type as string) === "hunter";
  if (user && isClaimable && user.id !== (product.maker_id as string)) {
    const { data: claimRow } = await supabase
      .from("product_claims")
      .select("status")
      .eq("product_id", product.id)
      .eq("claimant_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();
    claimStatus = (claimRow?.status as "pending" | "approved" | "rejected" | undefined) ?? null;
  }

  const typedProduct = {
    ...product,
    has_upvoted: hasUpvoted,
  } as unknown as ProductWithMaker;

  type CommentRow = Comment & { profile: Profile | null };
  const allComments = (rawComments ?? []) as unknown as CommentRow[];

  // Attach reactions to each comment, then nest replies
  const reactions = (rawReactions ?? []) as unknown as import("@/types").CommentReaction[];
  const commentsWithReactions = allComments.map((c) => ({
    ...c,
    reactions: reactions.filter((r) => r.comment_id === c.id),
    replies: [] as CommentRow[],
  }));
  const commentMap = new Map(commentsWithReactions.map((c) => [c.id, c]));
  const topLevelComments: typeof commentsWithReactions = [];
  for (const c of commentsWithReactions) {
    if (c.parent_id && commentMap.has(c.parent_id)) {
      commentMap.get(c.parent_id)!.replies.push(c);
    } else {
      topLevelComments.push(c);
    }
  }
  const comments = topLevelComments;
  const productLinks = (rawLinks ?? []) as unknown as ProductLink[];
  const teamMembers = (rawTeam ?? []) as unknown as (ProductTeamMember & { profile: Pick<Profile, "id" | "username" | "display_name" | "avatar_url"> | null })[];
  const shoutouts = (rawShoutouts ?? []) as unknown as ProductShoutout[];
  const reviews = (rawReviews ?? []) as unknown as { id: string; rating: number; content: string; created_at: string; profile: Pick<Profile, "username" | "display_name" | "avatar_url"> | null }[];
  const makerProducts = (rawMakerProducts ?? []) as { id: string; name: string; thumbnail_url: string | null }[];
  const userId = user?.id ?? null;
  const isCurated = productSource === "curated";

  const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sidedock.io";
  const ratedReviews = reviews.filter((r) => typeof r.rating === "number" && r.rating > 0);
  const avgRating =
    ratedReviews.length > 0
      ? ratedReviews.reduce((sum, r) => sum + r.rating, 0) / ratedReviews.length
      : null;
  const makerName =
    (product.maker?.display_name as string | null) ??
    (product.maker?.username as string | null) ??
    "Sidedock Maker";
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: product.name,
    description:
      (product.tagline as string | null) ??
      (product.description as string | null)?.slice(0, 200) ??
      "",
    applicationCategory: "BusinessApplication",
    url: `${APP_URL}/products/${encodeURIComponent(product.slug as string)}`,
    ...(product.thumbnail_url ? { image: product.thumbnail_url as string } : {}),
    inLanguage: "ko-KR",
    author: { "@type": "Person", name: makerName },
    isPartOf: { "@type": "WebSite", name: "Sidedock", url: APP_URL },
    ...(avgRating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: avgRating.toFixed(1),
            reviewCount: ratedReviews.length,
            bestRating: 5,
            worstRating: 1,
          },
        }
      : {}),
  };

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center justify-between gap-1.5 text-sm text-slate-400">
        <div className="flex items-center gap-1.5">
          <Link href="/" className="hover:text-blue-600">홈</Link>
          <span>›</span>
          <span className="text-slate-600">{product.name}</span>
        </div>
        {viewerProfile?.is_admin && isCurated && (
          <Link
            href={`/admin/upload/${product.id}`}
            className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:border-blue-300 hover:text-blue-600"
          >
            ✏️ 수정
          </Link>
        )}
      </div>

      {/* ── Header ── */}
      <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
        {/* Icon */}
        <div className="h-24 w-24 flex-shrink-0 overflow-hidden rounded-3xl border border-slate-100 bg-gradient-to-br from-slate-100 to-slate-200">
          {product.thumbnail_url ? (
            <Image
              src={product.thumbnail_url}
              alt={product.name}
              width={96}
              height={96}
              className="h-full w-full object-cover"
              unoptimized
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center text-4xl font-black text-slate-300">
              {product.name[0]?.toUpperCase()}
            </div>
          )}
        </div>

        {/* Meta */}
        <div className="flex-1">
          <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                {product.name}
              </h1>
              <p className="mt-1 text-slate-500">{product.tagline}</p>
            </div>
            {/* 버튼: 모바일에서는 아래 줄, sm 이상에서는 오른쪽 고정 */}
            <div className="flex flex-shrink-0 items-center gap-2">
              <StackButton
                productId={product.id}
                initialHasSaved={hasSaved}
                userId={userId}
                variant="detail"
              />
              <ShareButton
                title={product.name as string}
                path={`/products/${product.slug}`}
                variant="detail"
              />
              <UpvoteButton
                productId={product.id}
                initialCount={product.upvote_count}
                initialHasUpvoted={hasUpvoted}
                userId={userId}
                variant="detail"
              />
            </div>
          </div>

          {/* Badges */}
          <div className="mt-3 flex flex-wrap items-center gap-2">
            {((product.categories as string[] | null)?.length
              ? (product.categories as string[])
              : [product.category as string]
            ).map((cat: string) => (
              <span key={cat} className={`rounded-full px-3 py-1 text-xs font-semibold ${CATEGORY_COLORS[cat] ?? CATEGORY_COLORS.other}`}>
                {CATEGORY_LABELS[cat] ?? cat}
              </span>
            ))}
            {(product.is_open_source as boolean) && (
              <span className="rounded-full bg-green-50 px-3 py-1 text-xs font-semibold text-green-700">
                🔓 오픈소스
              </span>
            )}
            {(product.tags as string[]).map((tag: string) => (
              <span key={tag} className="rounded-full bg-slate-100 px-3 py-1 text-xs text-slate-500">
                {tag}
              </span>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            {product.url && (
              <a
                href={product.url as string}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800"
              >
                사이트 방문 ↗
              </a>
            )}
            {productLinks.map((link) => {
              const label = link.label ?? BRAND_LABELS[link.link_type] ?? BRAND_LABELS.other;
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:shadow-sm"
                >
                  <BrandIcon type={link.link_type} className="h-4 w-4" />
                  {label}
                </a>
              );
            })}
          </div>
        </div>
      </div>

      {/* 헌터가 소유 중인 제품 소유권 클레임 */}
      {isClaimable && !isProductOwner && (
        <div className="mt-4">
          <ClaimButton
            productId={product.id}
            productName={product.name as string}
            userId={userId}
            existingStatus={claimStatus}
          />
        </div>
      )}

      <hr className="my-8 border-slate-100" />

      <ProductTabs
        productId={product.id}
        description={product.description ?? ""}
        videoUrl={product.video_url ?? null}
        galleryImages={product.gallery_images ?? []}
        maker={typedProduct.maker ?? null}
        makerType={typedProduct.maker_type}
        isCurated={isCurated}
        makerProducts={makerProducts}
        teamMembers={teamMembers}
        shoutouts={shoutouts}
        reviews={reviews}
        comments={comments}
        userId={userId}
        userHasReview={userHasReview}
      />
    </div>
  );
}
