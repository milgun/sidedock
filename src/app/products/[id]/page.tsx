import { createClient } from "@/lib/supabase/server";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import type { ProductWithMaker, Comment, Profile, ProductLink, ProductTeamMember, ProductShoutout } from "@/types";
import UpvoteButton from "@/components/product/UpvoteButton";
import ProductTabs from "@/components/product/ProductTabs";
import { CATEGORY_LABELS, CATEGORY_COLORS } from "@/components/product/ProductCard";

const PLATFORM_ICONS: Record<string, { icon: string; label: string }> = {
  "app-store":    { icon: "🍎", label: "App Store" },
  "google-play":  { icon: "▶",  label: "Google Play" },
  "steam":        { icon: "🎮", label: "Steam" },
  "github":       { icon: "⚙",  label: "GitHub" },
  "bitbucket":    { icon: "🔵", label: "Bitbucket" },
  "gitlab":       { icon: "🦊", label: "GitLab" },
  "other":        { icon: "🔗", label: "링크" },
};

export async function generateMetadata(
  props: { params: Promise<{ id: string }> }
): Promise<Metadata> {
  const { id } = await props.params;
  const supabase = await createClient();
  const { data: product } = await supabase
    .from("products")
    .select("name, tagline, thumbnail_url, description")
    .eq("id", id)
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
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user: earlyUser },
  } = await supabase.auth.getUser();

  const { data: product, error } = await supabase
    .from("products")
    .select("*, maker:profiles(*)")
    .eq("id", id)
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

  const [{ data: rawComments }, { data: rawLinks }, { data: rawTeam }, { data: rawShoutouts }, { data: rawReviews }] =
    await Promise.all([
      supabase.from("comments").select("*, profile:profiles(*)").eq("product_id", id).order("created_at", { ascending: true }),
      supabase.from("product_links").select("*").eq("product_id", id).order("sort_order"),
      supabase.from("product_team_members").select("*, profile:profiles(id, username, display_name, avatar_url)").eq("product_id", id),
      supabase.from("product_shoutouts").select("*").eq("product_id", id).order("sort_order"),
      supabase.from("reviews").select("*, profile:profiles(id, username, display_name, avatar_url)").eq("product_id", id).order("created_at", { ascending: false }),
    ]);

  // 메이커가 출시한 다른 제품 — Launches 제품에만 표시 (curated 제외)
  const productSource = product.source as string;
  const makerId = product.maker_id as string;
  let rawMakerProducts: { id: string; name: string; thumbnail_url: string | null }[] | null = null;
  if (productSource === "launch") {
    const { data } = await supabase
      .from("products")
      .select("id, name, thumbnail_url")
      .eq("maker_id", makerId)
      .eq("status", "published")
      .eq("source", "launch")
      .neq("id", id)
      .order("launched_at", { ascending: false })
      .limit(5);
    rawMakerProducts = data as typeof rawMakerProducts;
  }

  const user = earlyUser;

  let hasUpvoted = false;
  if (user) {
    const { data: upvote } = await supabase
      .from("upvotes")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", id)
      .maybeSingle();
    hasUpvoted = !!upvote;
  }

  let userHasReview = false;
  if (user) {
    const { data: existingReview } = await supabase
      .from("reviews")
      .select("id")
      .eq("user_id", user.id)
      .eq("product_id", id)
      .maybeSingle();
    userHasReview = !!existingReview;
  }

  const typedProduct = {
    ...product,
    has_upvoted: hasUpvoted,
  } as unknown as ProductWithMaker;

  type CommentRow = Comment & { profile: Profile | null };
  const comments = (rawComments ?? []) as unknown as CommentRow[];
  const productLinks = (rawLinks ?? []) as unknown as ProductLink[];
  const teamMembers = (rawTeam ?? []) as unknown as (ProductTeamMember & { profile: Pick<Profile, "id" | "username" | "display_name" | "avatar_url"> | null })[];
  const shoutouts = (rawShoutouts ?? []) as unknown as ProductShoutout[];
  const reviews = (rawReviews ?? []) as unknown as { id: string; rating: number; content: string; created_at: string; profile: Pick<Profile, "username" | "display_name" | "avatar_url"> | null }[];
  const makerProducts = (rawMakerProducts ?? []) as { id: string; name: string; thumbnail_url: string | null }[];
  const userId = user?.id ?? null;
  const isCurated = productSource === "curated";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-1.5 text-sm text-slate-400">
        <Link href="/" className="hover:text-blue-600">
          홈
        </Link>
        <span>›</span>
        <span className="text-slate-600">{product.name}</span>
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
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="text-2xl font-black text-slate-900 sm:text-3xl">
                {product.name}
              </h1>
              <p className="mt-1 text-slate-500">{product.tagline}</p>
            </div>
            <UpvoteButton
              productId={product.id}
              initialCount={product.upvote_count}
              initialHasUpvoted={hasUpvoted}
              userId={userId}
              variant="detail"
            />
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
              const info = PLATFORM_ICONS[link.link_type] ?? PLATFORM_ICONS.other;
              return (
                <a
                  key={link.id}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 hover:shadow-sm"
                >
                  <span className="text-base leading-none">{info.icon}</span>
                  {link.label ?? info.label}
                </a>
              );
            })}
          </div>
        </div>
      </div>

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
