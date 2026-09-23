"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
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

export default function DevlogListClient({
  initialPosts,
  initialHasMore,
}: {
  initialPosts: DevlogPostWithAuthor[];
  initialHasMore: boolean;
}) {
  const [posts, setPosts] = useState(initialPosts);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [loading, setLoading] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  const loadMore = useCallback(async () => {
    if (loading || !hasMore) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/devlog?offset=${posts.length}`);
      const data = await res.json();
      setPosts((prev) => [...prev, ...(data.posts ?? [])]);
      setHasMore(Boolean(data.hasMore));
    } finally {
      setLoading(false);
    }
  }, [loading, hasMore, posts.length]);

  useEffect(() => {
    const el = sentinelRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) loadMore();
      },
      { rootMargin: "400px" }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [loadMore]);

  if (posts.length === 0) {
    return null;
  }

  return (
    <>
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {posts.map((post) => (
          <Link
            key={post.id}
            href={`/devlog/${post.slug ?? post.id}`}
            className="group flex flex-col overflow-hidden rounded-2xl border border-slate-100 bg-white transition hover:border-blue-200 hover:shadow-md dark:border-navy-800 dark:bg-navy-900"
          >
            {/* 썸네일 */}
            <div className="relative h-44 w-full flex-shrink-0 bg-gradient-to-br from-slate-100 to-slate-50 dark:from-navy-800 dark:to-navy-900">
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
              <h2 className="line-clamp-2 font-bold text-slate-900 group-hover:text-blue-600 leading-snug dark:text-slate-100">
                {post.title}
              </h2>
              <p className="mt-1.5 line-clamp-2 text-sm text-slate-500 leading-relaxed dark:text-slate-400">
                {post.content.replace(/[#*`>\[\]!]/g, "").slice(0, 100)}
              </p>

              {/* 태그 */}
              {post.tags.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-1">
                  {post.tags.slice(0, 3).map((tag) => (
                    <span key={tag} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-navy-800 dark:text-slate-300">
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
                    className="h-6 w-6 rounded-full object-cover"
                    unoptimized
                  />
                ) : (
                  <div className="h-6 w-6 rounded-full bg-slate-200 flex items-center justify-center text-xs text-slate-500 dark:bg-navy-800 dark:text-slate-400">
                    {(post.author?.display_name ?? post.author?.username ?? "?")[0].toUpperCase()}
                  </div>
                )}
                <span className="text-xs text-slate-500 truncate dark:text-slate-400">
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

      {hasMore && (
        <div ref={sentinelRef} className="flex justify-center py-8">
          <span className="text-sm text-slate-400">{loading ? "불러오는 중..." : ""}</span>
        </div>
      )}
    </>
  );
}
