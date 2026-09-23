import { createClient, getUser } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

const PAGE_SIZE = 9;

export async function GET(req: NextRequest) {
  const offset = Math.max(0, Number(req.nextUrl.searchParams.get("offset")) || 0);

  const supabase = await createClient();
  const user = await getUser();

  const [{ data: rawPosts }, { data: likes }] = await Promise.all([
    supabase
      .from("devlog_posts")
      .select("*, author:profiles(id, username, avatar_url, display_name)")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .range(offset, offset + PAGE_SIZE - 1),
    user
      ? supabase.from("devlog_likes").select("post_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const likedIds = new Set<string>((likes ?? []).map((l: { post_id: string }) => l.post_id));

  type Raw = Record<string, unknown>;
  const posts = (rawPosts ?? []).map(
    (p) => ({ ...p, has_liked: likedIds.has((p as Raw).id as string) })
  );

  return NextResponse.json({ posts, hasMore: posts.length === PAGE_SIZE });
}
