import { NextRequest, NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ username: string }> },
) {
  const { username } = await params;
  const { searchParams } = new URL(req.url);
  const tab = searchParams.get("tab") ?? "about";

  const supabase = await createClient();

  const [{ data: profile }, user] = await Promise.all([
    supabase.from("profiles").select("id, created_at").eq("username", username).maybeSingle(),
    getUser(),
  ]);

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  const isOwn = user?.id === profile.id;
  const userId = user?.id ?? null;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let tabData: Record<string, any> = {};

  if (tab === "about") {
    const [{ count: publishedCount }, { data: pubProducts }] = await Promise.all([
      supabase
        .from("products")
        .select("id", { count: "exact", head: true })
        .eq("maker_id", profile.id)
        .eq("status", "published"),
      supabase
        .from("products")
        .select("upvote_count")
        .eq("maker_id", profile.id)
        .eq("status", "published"),
    ]);
    const totalUpvotes = (pubProducts ?? []).reduce(
      (s, p) => s + ((p.upvote_count as number) ?? 0),
      0,
    );
    tabData = { publishedCount: publishedCount ?? 0, totalUpvotes };
  } else if (tab === "activity") {
    const [
      { data: comments },
      { data: upvoteRows },
      { data: devlogs },
    ] = await Promise.all([
      supabase
        .from("comments")
        .select("id, content, created_at, product:products(id, name)")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("upvotes")
        .select("created_at, product:products(id, name, thumbnail_url)")
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20),
      supabase
        .from("devlogs")
        .select("id, title, created_at")
        .eq("author_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(20),
    ]);
    tabData = {
      comments: comments ?? [],
      upvotes: (upvoteRows ?? []).map((r: Record<string, unknown>) => ({
        created_at: r.created_at,
        product: r.product ?? null,
      })),
      devlogs: devlogs ?? [],
    };
  } else if (tab === "products") {
    if (isOwn) {
      const { data } = await supabase
        .from("products")
        .select(
          "id, name, tagline, thumbnail_url, status, source, rejection_reason, created_at, upvote_count",
        )
        .eq("maker_id", profile.id)
        .order("created_at", { ascending: false });
      tabData = { ownProducts: data ?? [], isOwn: true };
    } else {
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
        (uv ?? []).map((u: { product_id: string }) => u.product_id),
      );
      tabData = {
        publicProducts: (data ?? []).map((p) => ({
          ...(p as Record<string, unknown>),
          has_upvoted: upvotedIds.has((p as { id: string }).id),
        })),
        isOwn: false,
      };
    }
  } else if (tab === "boost") {
    const [{ data: upvotes }, { data: uv }] = await Promise.all([
      supabase
        .from("upvotes")
        .select(
          "product:products(*, maker:profiles(id, username, avatar_url, display_name))",
        )
        .eq("user_id", profile.id)
        .order("created_at", { ascending: false })
        .limit(30),
      userId
        ? supabase.from("upvotes").select("product_id").eq("user_id", userId)
        : Promise.resolve({ data: [] as { product_id: string }[] }),
    ]);
    const myUpvotedIds = new Set<string>(
      (uv ?? []).map((u: { product_id: string }) => u.product_id),
    );
    const boostedProducts = (upvotes ?? [])
      .map((u: Record<string, unknown>) => u.product)
      .filter(
        (p): p is Record<string, unknown> =>
          Boolean(p) && (p as { status?: string }).status === "published",
      )
      .map((p) => ({
        ...p,
        has_upvoted: myUpvotedIds.has((p as { id: string }).id),
      }));
    tabData = { boostedProducts };
  } else if (tab === "reviews") {
    const { data } = await supabase
      .from("reviews")
      .select("id, rating, content, created_at, product:products(id, name, thumbnail_url)")
      .eq("user_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30);
    tabData = { reviews: data ?? [] };
  } else if (tab === "devlog") {
    const { data } = await supabase
      .from("devlog_posts")
      .select("id, title, tags, thumbnail_url, like_count, comment_count, created_at")
      .eq("author_id", profile.id)
      .order("created_at", { ascending: false })
      .limit(30);
    tabData = { devlogs: data ?? [] };
  } else if (tab === "stack") {
    if (!isOwn) {
      tabData = { savedProducts: [] };
    } else {
      const [{ data: saved }, { data: uv }] = await Promise.all([
        supabase
          .from("saved_products")
          .select("product:products(*, maker:profiles(id, username, avatar_url, display_name))")
          .eq("user_id", profile.id)
          .order("created_at", { ascending: false })
          .limit(30),
        userId
          ? supabase.from("upvotes").select("product_id").eq("user_id", userId)
          : Promise.resolve({ data: [] as { product_id: string }[] }),
      ]);
      const upvotedIds = new Set<string>(
        (uv ?? []).map((u: { product_id: string }) => u.product_id),
      );
      const savedProducts = (saved ?? [])
        .map((s: Record<string, unknown>) => s.product)
        .filter(
          (p): p is Record<string, unknown> =>
            Boolean(p) && (p as { status?: string }).status === "published",
        )
        .map((p) => ({
          ...p,
          has_upvoted: upvotedIds.has((p as { id: string }).id),
        }));
      tabData = { savedProducts };
    }
  }

  return NextResponse.json({ tab, isOwn, userId, ...tabData });
}
