import Image from "next/image";
import Link from "next/link";
import type { DevlogPostWithAuthor } from "@/types";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 60) return `${minutes}분 전`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}시간 전`;
  const days = Math.floor(hours / 24);
  return days < 30 ? `${days}일 전` : new Date(dateStr).toLocaleDateString("ko-KR", { month: "short", day: "numeric" });
}

export default function DevlogHomeList({ posts }: { posts: DevlogPostWithAuthor[] }) {
  return (
    <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-navy-800 dark:bg-navy-900">
      {posts.map((post) => {
        const authorName = post.author?.display_name ?? post.author?.username ?? "익명의 메이커";
        return (
          <Link
            key={post.id}
            href={`/devlog/${post.slug ?? post.id}`}
            className="group flex items-center gap-4 border-b border-slate-100 px-4 py-4 transition last:border-0 hover:bg-slate-50 dark:border-navy-800 dark:hover:bg-navy-800/60 sm:px-5"
          >
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 text-xs text-slate-400">
                <span className="font-medium text-blue-600 dark:text-blue-400">@{post.author?.username ?? "maker"}</span>
                <span>·</span>
                <span>{timeAgo(post.created_at)}</span>
              </div>
              <h3 className="mt-1 line-clamp-1 font-bold text-slate-900 transition group-hover:text-blue-600 dark:text-slate-100 dark:group-hover:text-blue-400">
                {post.title}
              </h3>
              <p className="mt-1 line-clamp-1 text-sm text-slate-500 dark:text-slate-400">
                {post.content.replace(/[#*`>\[\]!]/g, "").slice(0, 110)}
              </p>
              <div className="mt-2 flex items-center gap-3 text-xs text-slate-400">
                {post.tags?.map((tag) => <span key={tag}>#{tag}</span>)}
                <span className="ml-auto">💬 {post.comment_count}</span>
                <span>❤️ {post.like_count}</span>
              </div>
            </div>
            <div className="relative hidden h-16 w-24 flex-shrink-0 overflow-hidden rounded-xl bg-slate-100 sm:block dark:bg-navy-800">
              {post.thumbnail_url ? (
                <Image src={post.thumbnail_url} alt="" fill className="object-cover transition group-hover:scale-105" sizes="96px" />
              ) : (
                <span className="flex h-full items-center justify-center text-2xl">📝</span>
              )}
            </div>
          </Link>
        );
      })}
    </div>
  );
}
