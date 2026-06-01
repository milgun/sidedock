import { NextRequest, NextResponse } from "next/server";
import { createClient, getUser } from "@/lib/supabase/server";

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get("category") ?? "";

  const supabase = await createClient();
  const user = await getUser();

  let query = supabase
    .from("products")
    .select("*, maker:profiles(id, username, avatar_url, display_name)")
    .eq("source", "curated")
    .eq("status", "published")
    .order("upvote_count", { ascending: false })
    .limit(50);

  if (category) query = query.eq("category", category);

  const [{ data: rawProducts }, { data: upvotes }] = await Promise.all([
    query,
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

  return NextResponse.json({ products, userId: user?.id ?? null });
}
