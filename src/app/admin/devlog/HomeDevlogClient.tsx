"use client";

import { useState } from "react";
import { toggleHomeDevlog } from "@/lib/actions/devlog";

export type HomeDevlog = {
  id: string;
  slug: string;
  title: string;
  created_at: string;
  is_home_featured: boolean;
  home_featured_at: string | null;
  author: { username: string; display_name: string | null } | null;
};

export default function HomeDevlogClient({ posts: initialPosts, scope }: { posts: HomeDevlog[]; scope: "recent" | "all" }) {
  const [posts, setPosts] = useState(initialPosts);
  const [processing, setProcessing] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const featuredCount = posts.filter((post) => post.is_home_featured).length;

  const handleToggle = async (postId: string) => {
    setProcessing(postId);
    setError(null);
    const result = await toggleHomeDevlog(postId);
    setProcessing(null);
    if (result.error) {
      setError(result.error);
      return;
    }
    setPosts((current) => current.map((post) => post.id === postId ? { ...post, is_home_featured: result.isFeatured ?? false } : post));
  };

  return (
    <section>
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="font-mono text-xs font-bold text-emerald-600 dark:text-emerald-400">HOME BUILD NOTES: {featuredCount}/3 SELECTED</p>
        <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-navy-700">
          <a href="/admin/devlog" className={`rounded-md px-3 py-1.5 text-xs font-semibold ${scope === "recent" ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>최근 20개</a>
          <a href="/admin/devlog?scope=all" className={`rounded-md px-3 py-1.5 text-xs font-semibold ${scope === "all" ? "bg-emerald-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>전체 조회</a>
        </div>
      </div>
      {error && <p className="mb-4 text-sm text-red-500">{error}</p>}
      {posts.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400 dark:border-navy-700">작성된 Dev Log가 없습니다.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          {posts.map((post) => {
            const authorName = post.author?.display_name ?? post.author?.username ?? "메이커";
            return (
              <div key={post.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-navy-800">
                <span className={`font-mono text-xs font-bold ${post.is_home_featured ? "text-emerald-600 dark:text-emerald-400" : "text-slate-400"}`}>{post.is_home_featured ? "ON" : "--"}</span>
                <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{post.title}</p><p className="truncate text-xs text-slate-400">@{authorName}</p></div>
                <button type="button" onClick={() => handleToggle(post.id)} disabled={processing === post.id || (!post.is_home_featured && featuredCount >= 3)} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default disabled:opacity-50 ${post.is_home_featured ? "bg-emerald-600 text-white hover:bg-emerald-700" : "border border-slate-200 text-slate-600 hover:border-emerald-300 hover:text-emerald-600 dark:border-navy-700 dark:text-slate-300"}`}>{processing === post.id ? "저장 중..." : post.is_home_featured ? "홈에서 제외" : "홈에 추가"}</button>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}