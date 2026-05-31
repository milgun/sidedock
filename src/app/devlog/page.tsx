import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { DevlogPostWithAuthor } from "@/types";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}일 전`;
  return new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default async function DevlogPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: rawPosts } = await supabase
    .from("devlog_posts")
    .select("*, author:profiles(*)")
    .order("created_at", { ascending: false })
    .limit(50);

  let likedIds = new Set<string>();
  if (user) {
    const { data: likes } = await supabase
      .from("devlog_likes")
      .select("post_id")
      .eq("user_id", user.id);
    likedIds = new Set((likes ?? []).map((l: { post_id: string }) => l.post_id));
  }

  type Raw = Record<string, unknown>;
  const posts = (rawPosts ?? []).map(
    (p) => ({ ...p, has_liked: likedIds.has((p as Raw).id as string) } as unknown as DevlogPostWithAuthor)
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">📝 Dev Log</h1>
          <p className="mt-1 text-slate-500">
            메이커와 개발자들의 이야기. 경험을 나누고 함께 성장하세요.
          </p>
        </div>
        {user ? (
          <Link
            href="/devlog/new"
            className="flex-shrink-0 rounded-xl bg-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800"
          >
            + 글쓰기
          </Link>
        ) : (
          <Link
            href="/login?next=/devlog/new"
            className="flex-shrink-0 rounded-xl border border-slate-200 px-5 py-2.5 text-sm font-medium text-slate-600 transition hover:border-blue-400"
          >
            로그인 후 글쓰기
          </Link>
        )}
      </div>

      {posts.length > 0 ? (
        <div className="space-y-3">
          {posts.map((post) => (
            <article
              key={post.id}
              className="rounded-2xl border border-slate-100 bg-white p-5 transition hover:border-blue-200 hover:shadow-sm"
            >
              <Link href={`/devlog/${post.id}`} className="block">
                <h2 className="font-bold text-slate-900 hover:text-blue-600">
                  {post.title}
                </h2>
                <p className="mt-1 line-clamp-2 text-sm text-slate-500">
                  {post.content.replace(/[#*`>\[\]!]/g, "").slice(0, 120)}
                </p>
              </Link>
              <div className="mt-3 flex items-center gap-4">
                {post.tags.length > 0 && (
                  <div className="flex gap-1.5">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
                <div className="ml-auto flex items-center gap-3 text-xs text-slate-400">
                  <span>❤️ {post.like_count}</span>
                  <span>💬 {post.comment_count}</span>
                  <span>@{post.author?.username}</span>
                  <span>{timeAgo(post.created_at)}</span>
                </div>
              </div>
            </article>
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 py-20 text-center">
          <p className="text-2xl">✍️</p>
          <p className="mt-3 font-semibold text-slate-700">아직 글이 없습니다</p>
          <p className="mt-1 text-sm text-slate-400">
            첫 번째 Dev Log를 작성해 커뮤니티를 시작해보세요.
          </p>
          {user && (
            <Link
              href="/devlog/new"
              className="mt-4 inline-block rounded-xl bg-navy-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-navy-800"
            >
              첫 글 작성하기
            </Link>
          )}
        </div>
      )}
    </div>
  );
}