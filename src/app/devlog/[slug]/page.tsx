import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { DevlogPostWithAuthor, DevlogComment, Profile } from "@/types";
import DevlogDetailClient from "./DevlogDetailClient";

function timeAgo(dateStr: string) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}분 전`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}일 전` : new Date(dateStr).toLocaleDateString("ko-KR");
}

export default async function DevlogDetailPage(props: {
  params: Promise<{ slug: string }>;
}) {
  const { slug: rawSlug } = await props.params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const { data: rawPost } = await supabase
    .from("devlog_posts")
    .select("*, author:profiles(*)")
    .eq(isUUID ? "id" : "slug", slug)
    .maybeSingle();

  if (!rawPost) notFound();

  const { data: { user } } = await supabase.auth.getUser();

  let hasLiked = false;
  if (user) {
    const { data: like } = await supabase
      .from("devlog_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("post_id", rawPost.id)
      .maybeSingle();
    hasLiked = !!like;
  }

  const { data: rawComments } = await supabase
    .from("devlog_comments")
    .select("*, author:profiles(*)")
    .eq("post_id", rawPost.id)
    .order("created_at", { ascending: true });

  const post = { ...rawPost, has_liked: hasLiked } as unknown as DevlogPostWithAuthor;
  const comments = (rawComments ?? []) as unknown as (DevlogComment & { author: Profile })[];
  const userId = user?.id ?? null;

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/devlog" className="hover:text-blue-600">Dev Log</Link>
        <span>/</span>
        <span className="truncate text-slate-600">{post.title}</span>
      </div>

      {/* Article */}
      <article>
        <h1 className="text-3xl font-black leading-snug text-slate-900">{post.title}</h1>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500">
                #{tag}
              </span>
            ))}
          </div>
        )}

        {/* Author + meta */}
        <div className="mt-4 flex items-center gap-3">
          <div className="h-8 w-8 overflow-hidden rounded-full bg-navy-900">
            {post.author?.avatar_url ? (
              <Image src={post.author.avatar_url} alt={post.author.username} width={32} height={32} className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                {post.author?.username?.[0]?.toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <Link href={`/profile/${post.author?.username}`} className="text-sm font-semibold text-slate-700 hover:text-blue-600">
              @{post.author?.username}
            </Link>
            <p className="text-xs text-slate-400">{timeAgo(post.created_at)}</p>
          </div>
        </div>

        {/* Markdown content */}
        <DevlogDetailClient
          postId={post.id}
          postSlug={post.slug}
          content={post.content}
          likeCount={post.like_count}
          initialHasLiked={hasLiked}
          userId={userId}
          isOwner={userId === post.author_id}
          comments={comments}
        />
      </article>
    </div>
  );
}