import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import type { Metadata } from "next";
import type { DevlogPostWithAuthor, DevlogComment, Profile } from "@/types";
import DevlogDetailClient from "./DevlogDetailClient";

const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "https://sidedock.io";

// 마크다운 문법을 제거해 메타 설명/본문 요약용 순수 텍스트로 변환
function stripMarkdown(md: string): string {
  return md
    .replace(/```[\s\S]*?```/g, " ")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, " ")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/[#>*_`~-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export async function generateMetadata(
  props: { params: Promise<{ slug: string }> }
): Promise<Metadata> {
  const { slug: rawSlug } = await props.params;
  const slug = decodeURIComponent(rawSlug);
  const supabase = await createClient();

  const isUUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(slug);
  const { data: post } = await supabase
    .from("devlog_posts")
    .select("title, content, thumbnail_url, tags, author:profiles(username, display_name)")
    .eq(isUUID ? "id" : "slug", slug)
    .maybeSingle();

  if (!post) return {};

  const title = post.title as string;
  const description = stripMarkdown((post.content as string | null) ?? "").slice(0, 160);
  const images = post.thumbnail_url
    ? [{ url: post.thumbnail_url as string, width: 1200, height: 630 }]
    : [{ url: "/og-default.png", width: 1200, height: 630 }];
  const author = post.author as { username?: string; display_name?: string | null } | null;

  return {
    title,
    description,
    keywords: (post.tags as string[] | null) ?? undefined,
    openGraph: {
      title: `${title} — Sidedock Dev Log`,
      description,
      type: "article",
      locale: "ko_KR",
      images,
      ...(author ? { authors: [author.display_name ?? author.username ?? "Sidedock"] } : {}),
    },
    twitter: {
      card: "summary_large_image",
      title: `${title} — Sidedock Dev Log`,
      description,
      images: images.map((i) => i.url),
    },
  };
}

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
  const commentRows = (rawComments ?? []) as unknown as (DevlogComment & { author: Profile })[];
  const commentIds = commentRows.map((comment) => comment.id);
  const { data: reactionRows } = commentIds.length > 0
    ? await supabase.from("devlog_comment_reactions").select("*").in("comment_id", commentIds)
    : { data: [] };
  const comments = commentRows.map((comment) => ({
    ...comment,
    reactions: (reactionRows ?? []).filter((reaction) => reaction.comment_id === comment.id),
  })) as (DevlogComment & { author: Profile })[];
  const userId = user?.id ?? null;

  const authorName = post.author?.display_name ?? post.author?.username ?? "Sidedock Maker";
  const postUrl = `${APP_URL}/devlog/${encodeURIComponent(post.slug)}`;
  const articleJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: stripMarkdown(post.content ?? "").slice(0, 200),
    ...(post.thumbnail_url ? { image: post.thumbnail_url } : {}),
    datePublished: new Date(post.created_at).toISOString(),
    dateModified: new Date(post.updated_at ?? post.created_at).toISOString(),
    author: {
      "@type": "Person",
      name: authorName,
      ...(post.author?.username ? { url: `${APP_URL}/profile/${post.author.username}` } : {}),
    },
    publisher: {
      "@type": "Organization",
      name: "Sidedock",
      logo: { "@type": "ImageObject", url: `${APP_URL}/apple-touch-icon.png` },
    },
    mainEntityOfPage: { "@type": "WebPage", "@id": postUrl },
    url: postUrl,
    inLanguage: "ko-KR",
    ...(Array.isArray(post.tags) && post.tags.length > 0
      ? { keywords: post.tags.join(", ") }
      : {}),
  };
  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: APP_URL },
      { "@type": "ListItem", position: 2, name: "Dev Log", item: `${APP_URL}/devlog` },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <div className="mx-auto max-w-2xl px-4 py-10">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(articleJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      {/* Breadcrumb */}
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/devlog" className="hover:text-blue-600">Dev Log</Link>
        <span>/</span>
        <span className="truncate text-slate-600 dark:text-slate-300">{post.title}</span>
      </div>

      {/* Article */}
      <article>
        <h1 className="text-3xl font-black leading-snug text-slate-900 dark:text-slate-100">{post.title}</h1>

        {/* Tags */}
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <span key={tag} className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs text-slate-500 dark:bg-navy-800 dark:text-slate-300">
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
            <Link href={`/profile/${post.author?.username}`} className="text-sm font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-300">
              @{post.author?.username}
            </Link>
            <p className="text-xs text-slate-400">{timeAgo(post.created_at)}</p>
          </div>
        </div>

        {/* Markdown content */}
        <DevlogDetailClient
          postId={post.id}
          postSlug={post.slug}
          postTitle={post.title}
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