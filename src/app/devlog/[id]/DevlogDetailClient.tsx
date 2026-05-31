"use client";

import { useState, useTransition, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { toggleDevlogLike, createDevlogComment } from "@/lib/actions/devlog";
import type { DevlogComment, Profile } from "@/types";
import Image from "next/image";
import Link from "next/link";

interface Props {
  postId: string;
  content: string;
  likeCount: number;
  initialHasLiked: boolean;
  userId: string | null;
  comments: (DevlogComment & { author: Profile })[];
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

export default function DevlogDetailClient({
  postId,
  content,
  likeCount,
  initialHasLiked,
  userId,
  comments: initialComments,
}: Props) {
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [count, setCount] = useState(likeCount);
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState("");
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleLike = () => {
    if (!userId) { window.location.href = "/login"; return; }
    setHasLiked((v) => !v);
    setCount((c) => (hasLiked ? c - 1 : c + 1));
    startTransition(async () => {
      const res = await toggleDevlogLike(postId);
      if (!res.success) { setHasLiked((v) => !v); setCount((c) => (hasLiked ? c + 1 : c - 1)); }
    });
  };

  const handleComment = async (e: React.FormEvent) => {
    e.preventDefault();
    setCommentError(null);
    const fd = new FormData();
    fd.append("post_id", postId);
    fd.append("content", commentText);
    const res = await createDevlogComment(fd);
    if (res.error) { setCommentError(res.error); return; }
    setCommentText("");
    formRef.current?.reset();
  };

  return (
    <>
      {/* Markdown body */}
      <div className="prose prose-slate mt-8 max-w-none">
        <ReactMarkdown remarkPlugins={[remarkGfm]}>{content}</ReactMarkdown>
      </div>

      {/* Like button */}
      <div className="mt-10 flex items-center gap-3 border-t border-slate-100 pt-6">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${
            hasLiked
              ? "border-red-400 bg-red-50 text-red-500"
              : "border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-500"
          }`}
        >
          ❤️ {count}
        </button>
        <span className="text-sm text-slate-400">이 글이 도움됐다면 좋아요를 눌러주세요</span>
      </div>

      {/* Comments */}
      <div className="mt-10">
        <h2 className="mb-5 text-base font-bold text-slate-900">
          댓글 {comments.length > 0 && <span className="text-slate-400">{comments.length}</span>}
        </h2>

        {/* Comment form */}
        {userId ? (
          <form ref={formRef} onSubmit={handleComment} className="mb-6">
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder="댓글을 작성하세요..."
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
            />
            {commentError && (
              <p className="mt-1 text-xs text-red-500">{commentError}</p>
            )}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="rounded-xl bg-navy-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-40"
              >
                댓글 등록
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 rounded-xl border border-dashed border-slate-200 py-5 text-center text-sm text-slate-400">
            <Link href="/login" className="text-blue-600 hover:underline">로그인</Link>하면 댓글을 작성할 수 있습니다.
          </div>
        )}

        {/* Comment list */}
        {comments.length > 0 && (
          <div className="space-y-4">
            {comments.map((c) => (
              <div key={c.id} className="flex gap-3">
                <div className="h-8 w-8 flex-shrink-0 overflow-hidden rounded-full bg-navy-900">
                  {c.author?.avatar_url ? (
                    <Image src={c.author.avatar_url} alt={c.author.username} width={32} height={32} className="h-full w-full object-cover" />
                  ) : (
                    <span className="flex h-full w-full items-center justify-center text-xs font-bold text-white">
                      {c.author?.username?.[0]?.toUpperCase()}
                    </span>
                  )}
                </div>
                <div className="flex-1 rounded-xl bg-slate-50 px-4 py-3">
                  <div className="flex items-baseline gap-2">
                    <span className="text-xs font-semibold text-slate-700">@{c.author?.username}</span>
                    <span className="text-xs text-slate-400">{timeAgo(c.created_at)}</span>
                  </div>
                  <p className="mt-1 text-sm text-slate-700 whitespace-pre-wrap">{c.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}