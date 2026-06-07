import { NextRequest, NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";

type Period = "today" | "week" | "month" | "all";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const rawPeriod = searchParams.get("period") ?? "today";
  const period = (["today", "week", "month", "all"].includes(rawPeriod) ? rawPeriod : "today") as Period;

  const supabase = await createClient();
  const user = await getUser();
  const now = new Date();

  let query = supabase
    .from("products")
    .select("*, maker:profiles(id, username, avatar_url, display_name)")
    .eq("source", "launch")
    .eq("status", "published");

  if (period === "today") {
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    query = query.gte("created_at", todayStart).order("created_at", { ascending: false });
  } else if (period === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3_600_000).toISOString();
    query = query.gte("created_at", weekAgo).order("upvote_count", { ascending: false });
  } else if (period === "month") {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 3_600_000).toISOString();
    query = query.gte("created_at", monthAgo).order("upvote_count", { ascending: false });
  } else {
    // all: 역대 인기순 (boost + 댓글)
    query = query
      .order("upvote_count", { ascending: false })
      .order("comment_count", { ascending: false });
  }

  const [{ data: rawProducts }, { data: upvotes }] = await Promise.all([
    query.limit(50),
    user
      ? supabase.from("upvotes").select("product_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { product_id: string }[] }),
  ]);

  const upvotedIds = new Set<string>(
    (upvotes ?? []).map((u: { product_id: string }) => u.product_id),
  );

  const products = (rawProducts ?? []).map((p) => ({
    ...(p as Record<string, unknown>),
    has_upvoted: upvotedIds.has((p as { id: string }).id),
  }));

  return NextResponse.json({ products, userId: user?.id ?? null, nowMs: Date.now() });
}
