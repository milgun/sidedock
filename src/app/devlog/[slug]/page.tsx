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

  const { data: folder } = rawPost.folder_id
    ? await supabase
        .from("devlog_folders")
        .select("id, name, slug")
        .eq("id", rawPost.folder_id)
        .maybeSingle()
    : { data: null };

  const { data: { user } } = await supabase.auth.getUser();

  const [{ data: folderPosts }, { data: authorPosts }] = await Promise.all([
    rawPost.folder_id
      ? supabase
          .from("devlog_posts")
          .select("id, slug, title, created_at, visibility")
          .eq("folder_id", rawPost.folder_id)
          .order("created_at", { ascending: true })
          .limit(100)
      : Promise.resolve({ data: [] as Array<{ id: string; slug: string; title: string; created_at: string; visibility: string }> }),
    supabase
      .from("devlog_posts")
      .select("id, slug, title, created_at")
      .eq("author_id", rawPost.author_id)
      .order("created_at", { ascending: true })
      .limit(100),
  ]);
  const authorPostIndex = (authorPosts ?? []).findIndex((item) => item.id === rawPost.id);
  const previousPost = authorPostIndex > 0 ? authorPosts?.[authorPostIndex - 1] : null;
  const nextPost = authorPostIndex >= 0 && authorPostIndex < (authorPosts?.length ?? 0) - 1
    ? authorPosts?.[authorPostIndex + 1]
    : null;

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

        {(post.folder_id || (user?.id === post.author_id && post.visibility === "private")) && (
          <div className="mt-3 flex items-center gap-2 text-xs">
            {post.folder_id && folder && post.author?.username && <Link href={`/profile/${encodeURIComponent(post.author.username)}/devlog/folder/${encodeURIComponent(folder.slug)}`} className="rounded-full border border-blue-200 px-2.5 py-1 font-semibold text-blue-600 transition hover:border-blue-400 hover:bg-blue-50 dark:border-blue-500/40 dark:text-blue-400 dark:hover:bg-blue-500/10">Work Folder · {folder.name}</Link>}
            {user?.id === post.author_id && post.visibility === "private" && <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 px-2.5 py-1 font-semibold text-amber-600 dark:border-amber-500/40 dark:text-amber-400"><svg viewBox="0 0 16 16" className="h-3 w-3" fill="currentColor" aria-hidden="true"><path d="M4.5 7V5.5a3.5 3.5 0 0 1 7 0V7h.75c.414 0 .75.336.75.75v6.5a.75.75 0 0 1-.75.75h-9.5a.75.75 0 0 1-.75-.75v-6.5c0-.414.336-.75.75-.75h.75Zm1.5 0h4V5.5a2 2 0 1 0-4 0V7Z" /></svg>비공개</span>}
          </div>
        )}

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
              <Image src={post.author.avatar_url} alt={post.author.username} width={32} height={32} className="h-full w-full object-cover" unoptimized />
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

        {folder && folderPosts && folderPosts.length > 0 && post.author?.username && (
          <details className="devlog-folder-details mt-6 overflow-hidden rounded-xl border border-slate-200 bg-white dark:border-navy-800 dark:bg-navy-900">
            <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 text-sm font-bold text-slate-800 marker:hidden dark:text-slate-100">
              <span className="flex items-center gap-2"><span className="text-blue-500">▣</span>{folder.name}<span className="text-xs font-normal text-slate-400">{folderPosts.length}개 기록</span></span>
              <span className="devlog-folder-expand-label text-xs font-semibold text-slate-400">▼ 목록 보기</span>
              <span className="devlog-folder-collapse-label text-xs font-semibold text-slate-400">▲ 목록 접기</span>
            </summary>
            <div className="border-t border-slate-100 px-4 py-2 dark:border-navy-800">
              <div className="mb-1 flex justify-end">
                <Link href={`/profile/${encodeURIComponent(post.author.username)}/devlog/folder/${encodeURIComponent(folder.slug)}`} className="text-xs font-semibold text-blue-600 hover:underline dark:text-blue-400">전체 보기</Link>
              </div>
              {folderPosts.map((folderPost, index) => (
                <Link key={folderPost.id} href={`/devlog/${folderPost.slug}`} className={`flex items-center gap-3 py-2.5 text-xs transition hover:text-blue-600 dark:hover:text-blue-400 ${folderPost.id === post.id ? "font-semibold text-blue-600 dark:text-blue-400" : "text-slate-500 dark:text-slate-400"}`}>
                  <span className="w-5 text-slate-300 dark:text-slate-600">{index + 1}</span>
                  <span className="min-w-0 flex-1 truncate">{folderPost.title}</span>
                  {folderPost.visibility === "private" && <span className="text-amber-500" aria-label="비공개">🔒</span>}
                </Link>
              ))}
            </div>
          </details>
        )}

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
          previousPost={previousPost ? { slug: previousPost.slug, title: previousPost.title } : null}
          nextPost={nextPost ? { slug: nextPost.slug, title: nextPost.title } : null}
        />
      </article>
    </div>
  );
}