import { createClient, getUser } from "@/lib/supabase/server";
import Link from "next/link";
import type { DevlogPostWithAuthor } from "@/types";
import DevlogListClient from "@/components/devlog/DevlogListClient";

const PAGE_SIZE = 9;

export default async function DevlogPage() {
  const supabase = await createClient();
  const user = await getUser();

  const [{ data: rawPosts }, { data: likes }] = await Promise.all([
    supabase
      .from("devlog_posts")
      .select("*, author:profiles(id, username, avatar_url, display_name)")
      .eq("visibility", "public")
      .order("created_at", { ascending: false })
      .range(0, PAGE_SIZE - 1),
    user
      ? supabase.from("devlog_likes").select("post_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { post_id: string }[] }),
  ]);

  const likedIds = new Set<string>(
    (likes ?? []).map((l: { post_id: string }) => l.post_id)
  );

  type Raw = Record<string, unknown>;
  const posts = (rawPosts ?? []).map(
    (p) => ({ ...p, has_liked: likedIds.has((p as Raw).id as string) } as unknown as DevlogPostWithAuthor)
  );

  return (
    <div className="mx-auto max-w-5xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">📝 Dev Log</h1>
          <p className="mt-1 text-slate-500 dark:text-slate-400">
            메이커와 개발자들의 이야기. 경험을 나누고 함께 성장하세요.
          </p>
        </div>
        {user ? (
          <Link
            href="/devlog/new"
            className="flex-shrink-0 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 dark:bg-blue-600 dark:hover:bg-blue-700"
          >
            + 글쓰기
          </Link>
        ) : (
          <Link
            href="/login?next=/devlog/new"
            className="flex-shrink-0 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-blue-400 dark:border-navy-800 dark:text-slate-300"
          >
            로그인 후 글쓰기
          </Link>
        )}
      </div>

      {posts.length > 0 ? (
        <DevlogListClient initialPosts={posts} initialHasMore={posts.length === PAGE_SIZE} />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 py-20 text-center dark:border-navy-800">
          <p className="text-2xl">✍️</p>
          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300">아직 글이 없습니다</p>
          <p className="mt-1 text-sm text-slate-400">
            첫 번째 Dev Log를 작성해 커뮤니티를 시작해보세요.
          </p>
          {user && (
            <Link
              href="/devlog/new"
              className="mt-4 inline-block rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800 dark:bg-blue-600 dark:hover:bg-blue-700"
            >
              첫 글 작성하기
            </Link>
          )}
        </div>
      )}
    </div>
  );
}