import { createClient, getUser } from "@/lib/supabase/server";
import Link from "next/link";
import Image from "next/image";
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
  const user = await getUser();

  const [{ data: rawPosts }, { data: likes }] = await Promise.all([
    supabase
      .from("devlog_posts")
      .select("*, author:profiles(id, username, avatar_url, display_name)")
      .order("created_at", { ascending: false })
      .limit(50),
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
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {posts.map((post) => (
            <Link
              key={post.id}
              href={`/devlog/${post.slug ?? post.id}`}
              className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition hover:border-blue-200 hover:shadow-md"
            >
              {/* 썸네일 */}
              <div className="relative h-44 w-full flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-50">
                {post.thumbnail_url ? (
                  <Image
                    src={post.thumbnail_url}
                    alt={post.title}
                    fill
                    className="object-cover transition group-hover:scale-[1.02]"
                    sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
                  />
                ) : (
                  <div className="flex h-full items-center justify-center text-4xl select-none">
                    📝
                  </div>
                )}
              </div>

              {/* 카드 본문 */}
              <div className="flex flex-1 flex-col p-4">
                <h2 className="line-clamp-2 font-bold text-slate-900 group-hover:text-blue-600 leading-snug">
                  {post.title}
                </h2>
                <p className="mt-1.5 line-clamp-2 text-sm text-slate-500 leading-relaxed">
                  {post.content.replace(/[#*`>\[\]!]/g, "").slice(0, 100)}
                </p>

                {/* 태그 */}
                {post.tags.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1">
                    {post.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500">
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* 작성자 + 메타 */}
                <div className="mt-auto pt-4 flex items-center gap-2">
                  {post.author?.avatar_url ? (
                    <Image
                      src={post.author.avatar_url}
                      alt={post.author.display_name ?? post.author.username ?? ""}
                      width={24}
                      height={24}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-500">
                      {(post.author?.display_name ?? post.author?.username ?? "?")[0].toUpperCase()}
                    </div>
                  )}
                  <span className="text-xs text-slate-500 truncate">
                    {post.author?.display_name ?? post.author?.username}
                  </span>
                  <div className="ml-auto flex items-center gap-2.5 text-xs text-slate-400 flex-shrink-0">
                    <span>❤️ {post.like_count}</span>
                    <span>💬 {post.comment_count}</span>
                    <span>{timeAgo(post.created_at)}</span>
                  </div>
                </div>
              </div>
            </Link>
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