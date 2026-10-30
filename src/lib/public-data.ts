import { unstable_cache } from "next/cache";
import { createPublicClient } from "@/lib/supabase/public";
import { PUBLIC_CACHE_SECONDS, PUBLIC_CACHE_TAG } from "@/lib/cache";

// 로그인과 무관한 공개 데이터만 캐시한다. 사용자별 정보(업보트·좋아요 여부 등)는 각 페이지에서 따로 조회한다.
const cacheOptions = { revalidate: PUBLIC_CACHE_SECONDS, tags: [PUBLIC_CACHE_TAG] };

const PRODUCT_CARD_COLUMNS =
  "id, name, tagline, thumbnail_url, category, categories, tags, maker_id, upvote_count, comment_count, is_featured, featured_label, is_discovery_pick, discovery_picked_at, slug, source, maker_type, status, last_bumped_at, launched_at, created_at, maker:profiles(id, username, avatar_url, display_name)";
const DEVLOG_CARD_COLUMNS =
  "id, author_id, title, slug, content, tags, thumbnail_url, like_count, comment_count, is_home_featured, home_featured_at, visibility, folder_id, product_id, created_at, updated_at, author:profiles(id, username, avatar_url, display_name)";

const ABOUT_STATS_SECONDS = 60 * 60;
const FEEDBACK_PAGE_SIZE = 1000;

type FeedbackRow = {
  user_id: string;
  product: { maker_id: string } | null;
};

async function countCommunityFeedback(
  supabase: ReturnType<typeof createPublicClient>,
  table: "comments" | "reviews",
) {
  let count = 0;
  let offset = 0;

  while (true) {
    const { data, error } = await supabase
      .from(table)
      .select("user_id, product:products!inner(maker_id)")
      .eq("product.status", "published")
      .order("created_at", { ascending: true })
      .order("id", { ascending: true })
      .range(offset, offset + FEEDBACK_PAGE_SIZE - 1);

    if (error) {
      throw new Error(`Failed to count ${table}: ${error.message}`);
    }
    if (!data) {
      throw new Error(`Failed to count ${table}: no data was returned`);
    }

    // supabase-js 타입은 임베드를 배열로 추론하지만 many-to-one 관계는 런타임에 객체로 반환됨
    const rows = data as unknown as FeedbackRow[];
    count += rows.filter(
      (row) => row.product && row.user_id !== row.product.maker_id,
    ).length;

    if (rows.length < FEEDBACK_PAGE_SIZE) break;
    offset += FEEDBACK_PAGE_SIZE;
  }

  return count;
}

// /about 통계는 전체 댓글·리뷰를 순회하므로 비용이 크다. 실시간성이 필요 없어 1시간 캐시하며,
// 쓰기 작업의 캐시 무효화 태그에는 연결하지 않는다.
export const getAboutStats = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [
      { count: productCount, error: productCountError },
      commentCount,
      reviewCount,
    ] = await Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("source", "launch")
        .eq("status", "published"),
      countCommunityFeedback(supabase, "comments"),
      countCommunityFeedback(supabase, "reviews"),
    ]);

    if (productCountError) {
      throw new Error(`Failed to count products: ${productCountError.message}`);
    }
    if (productCount === null) {
      throw new Error("Failed to count products: no count was returned");
    }

    return { productCount, feedbackCount: commentCount + reviewCount };
  },
  ["about-stats-v1"],
  { revalidate: ABOUT_STATS_SECONDS },
);

export const getHomeData = unstable_cache(
  async () => {
    const supabase = createPublicClient();
    const [curated, launches, devlogs, homeDevlogs, hot, discovery] = await Promise.all([
      supabase
        .from("products")
        .select(PRODUCT_CARD_COLUMNS)
        .eq("source", "curated")
        .eq("status", "published")
        .order("upvote_count", { ascending: false })
        .limit(50),
      supabase
        .from("products")
        .select(PRODUCT_CARD_COLUMNS)
        .eq("source", "launch")
        .eq("status", "published")
        .order("last_bumped_at", { ascending: false, nullsFirst: false })
        .order("launched_at", { ascending: false })
        .limit(50),
      supabase
        .from("devlog_posts")
        .select(DEVLOG_CARD_COLUMNS)
        .eq("visibility", "public")
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("devlog_posts")
        .select(DEVLOG_CARD_COLUMNS)
        .eq("is_home_featured", true)
        .eq("visibility", "public")
        .order("home_featured_at", { ascending: false })
        .limit(3),
      supabase
        .from("products")
        .select(PRODUCT_CARD_COLUMNS)
        .eq("source", "launch")
        .eq("status", "published")
        .order("upvote_count", { ascending: false })
        .order("comment_count", { ascending: false })
        .limit(50),
      supabase
        .from("products")
        .select(PRODUCT_CARD_COLUMNS)
        .eq("source", "launch")
        .eq("status", "published")
        .eq("is_discovery_pick", true)
        .order("discovery_picked_at", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);
    return {
      curated: curated.data ?? [],
      newLaunches: launches.data ?? [],
      devlogs: devlogs.data ?? [],
      homeDevlogs: homeDevlogs.data ?? [],
      hot: hot.data ?? [],
      discovery: discovery.data ?? null,
    };
  },
  ["home-data-v1"],
  cacheOptions,
);

export const getLaunchesFirstPage = unstable_cache(
  async (period: string, sort: string, pageSize: number) => {
    const supabase = createPublicClient();
    const now = new Date();
    let query = supabase
      .from("products")
      .select(PRODUCT_CARD_COLUMNS)
      .eq("source", "launch")
      .eq("status", "published");

    const days = period === "week" ? 7 : period === "month" ? 30 : period === "year" ? 365 : 0;
    if (days) {
      const since = new Date(now.getTime() - days * 24 * 3_600_000).toISOString();
      query = query.gte("last_bumped_at", since);
    }

    if (sort === "latest") {
      query = query
        .order("last_bumped_at", { ascending: false, nullsFirst: false })
        .order("launched_at", { ascending: false });
    } else if (period === "all") {
      query = query
        .order("upvote_count", { ascending: false })
        .order("comment_count", { ascending: false });
    } else {
      query = query.order("upvote_count", { ascending: false });
    }
    query = query.order("id", { ascending: true });

    const { data } = await query.range(0, pageSize - 1);
    return { products: data ?? [], nowMs: now.getTime() };
  },
  ["launches-first-page-v1"],
  cacheOptions,
);

export const getHotProducts = unstable_cache(
  async (category: string) => {
    const supabase = createPublicClient();
    let query = supabase
      .from("products")
      .select(PRODUCT_CARD_COLUMNS)
      .eq("source", "curated")
      .eq("status", "published")
      .order("upvote_count", { ascending: false })
      .limit(50);
    if (category) query = query.or(`category.eq.${category},categories.cs.{${category}}`);
    const { data } = await query;
    return data ?? [];
  },
  ["hot-products-v1"],
  cacheOptions,
);

export const getDevlogFirstPage = unstable_cache(
  async (pageSize: number) => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("devlog_posts")
      .select(DEVLOG_CARD_COLUMNS)
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .range(0, pageSize - 1);
    return data ?? [];
  },
  ["devlog-first-page-v1"],
  cacheOptions,
);

export const getProductMetadata = unstable_cache(
  async (slug: string) => {
    const supabase = createPublicClient();
    const { data } = await supabase
      .from("products")
      .select("name, tagline, thumbnail_url, description, category")
      .eq("slug", slug)
      .single();
    return data;
  },
  ["product-metadata-v1"],
  cacheOptions,
);

// 게시된 제품만 반환한다. 비공개·미승인 제품은 null이 되어 호출 측에서 기존(로그인 사용자 기준) 조회로 처리한다.
export const getPublicProductBundle = unstable_cache(
  async (slugOrId: string, isUUID: boolean) => {
    const supabase = createPublicClient();
    const { data: product } = await supabase
      .from("products")
      .select("*, maker:profiles(*)")
      .eq(isUUID ? "id" : "slug", slugOrId)
      .eq("status", "published")
      .single();
    if (!product) return null;

    const [comments, links, team, shoutouts, reviews, updates, makerProducts] = await Promise.all([
      supabase.from("comments").select("*, profile:profiles(*)").eq("product_id", product.id).order("created_at", { ascending: true }),
      supabase.from("product_links").select("*").eq("product_id", product.id).order("sort_order"),
      supabase.from("product_team_members").select("*, profile:profiles(id, username, display_name, avatar_url)").eq("product_id", product.id),
      supabase.from("product_shoutouts").select("*").eq("product_id", product.id).order("sort_order"),
      supabase.from("reviews").select("*, profile:profiles(id, username, display_name, avatar_url)").eq("product_id", product.id).order("created_at", { ascending: false }),
      supabase.from("devlog_posts").select("id, slug, title, content, created_at").eq("product_id", product.id).eq("visibility", "public").order("created_at", { ascending: false }).limit(100),
      product.source === "launch"
        ? supabase
            .from("products")
            .select("id, name, slug, thumbnail_url")
            .eq("maker_id", product.maker_id)
            .eq("status", "published")
            .eq("source", "launch")
            .neq("id", product.id)
            .order("launched_at", { ascending: false })
            .limit(5)
        : Promise.resolve({ data: null }),
    ]);

    const commentIds = (comments.data ?? []).map((c: { id: string }) => c.id);
    const reactions = commentIds.length
      ? (await supabase.from("comment_reactions").select("*").in("comment_id", commentIds)).data ?? []
      : [];

    return {
      product,
      comments: comments.data ?? [],
      links: links.data ?? [],
      team: team.data ?? [],
      shoutouts: shoutouts.data ?? [],
      reviews: reviews.data ?? [],
      reactions,
      updates: updates.data ?? [],
      makerProducts: makerProducts.data ?? null,
    };
  },
  ["public-product-bundle-v1"],
  cacheOptions,
);
