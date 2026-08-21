"use client";

import { useState, useTransition, useRef } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkCjkFriendly from "remark-cjk-friendly";
import { toggleDevlogLike, createDevlogComment, deleteDevlogPost } from "@/lib/actions/devlog";
import type { DevlogComment, Profile } from "@/types";
import Link from "next/link";
import ShareButton from "@/components/product/ShareButton";
import DevlogCommentItem from "./DevlogCommentItem";

interface Props {
  postId: string;
  postSlug: string;
  postTitle: string;
  content: string;
  likeCount: number;
  initialHasLiked: boolean;
  userId: string | null;
  isOwner: boolean;
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

function withSoftBreaks(content: string): string {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part;
      const lines = part.split("\n");
      return lines
        .map((line, j) => {
          const next = lines[j + 1] ?? "";
          // 테이블 행(현재 또는 다음 줄이 |로 시작)은 soft break 제외
          if (line.trimStart().startsWith("|") || next.trimStart().startsWith("|")) {
            return line;
          }
          // 현재 줄이 비어있지 않고 다음 줄도 비어있지 않으면 soft break
          if (line !== "" && next !== "") {
            return line + "  ";
          }
          return line;
        })
        .join("\n");
    })
    .join("");
}

function nestComments(comments: (DevlogComment & { author: Profile })[]) {
  const byId = new Map(comments.map((comment) => [comment.id, { ...comment, replies: [] as DevlogComment[] }]));
  const roots: (DevlogComment & { author: Profile })[] = [];
  byId.forEach((comment) => {
    if (comment.parent_id && byId.has(comment.parent_id)) {
      byId.get(comment.parent_id)?.replies?.push(comment);
    } else {
      roots.push(comment);
    }
  });
  return roots;
}

function collectWithDescendants(comments: (DevlogComment & { author: Profile })[], targetId: string): Set<string> {
  const ids = new Set([targetId]);
  let changed = true;
  while (changed) {
    changed = false;
    for (const c of comments) {
      if (c.parent_id && ids.has(c.parent_id) && !ids.has(c.id)) {
        ids.add(c.id);
        changed = true;
      }
    }
  }
  return ids;
}

export default function DevlogDetailClient({
  postId,
  postSlug,
  postTitle,
  content,
  likeCount,
  initialHasLiked,
  userId,
  isOwner,
  comments: initialComments,
}: Props) {
  const router = useRouter();
  const [hasLiked, setHasLiked] = useState(initialHasLiked);
  const [count, setCount] = useState(likeCount);
  const [comments, setComments] = useState(initialComments);
  const [commentText, setCommentText] = useState("");
  const [replyingTo, setReplyingTo] = useState<(DevlogComment & { author: Profile }) | null>(null);
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDeleteTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  const handleDelete = () => {
    if (!window.confirm("정말 이 Dev Log를 삭제할까요? 되돌릴 수 없습니다.")) return;
    startDeleteTransition(async () => {
      await deleteDevlogPost(postId);
      router.push("/devlog");
      router.refresh();
    });
  };

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
    if (replyingTo) fd.append("parent_id", replyingTo.id);
    const res = await createDevlogComment(fd);
    if (res.error) { setCommentError(res.error); return; }
    if (res.comment) setComments((prev) => [...prev, res.comment as DevlogComment & { author: Profile }]);
    setCommentText("");
    setReplyingTo(null);
    formRef.current?.reset();
  };

  return (
    <>
      {/* 공유 + 글쓴이 전용 수정/삭제 버튼 */}
      <div className="mt-5 flex items-center gap-2">
        <ShareButton
          title={postTitle}
          path={`/devlog/${postSlug}`}
          variant="detail"
        />
        {isOwner && (
          <>
            <Link
              href={`/devlog/${postSlug}/edit`}
              className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600 dark:border-navy-800 dark:text-slate-300"
            >
              수정
            </Link>
            <button
              onClick={handleDelete}
              disabled={isDeleting}
              className="rounded-lg border border-slate-200 px-4 py-1.5 text-xs font-medium text-slate-600 transition hover:border-red-400 hover:text-red-600 disabled:opacity-40 dark:border-navy-800 dark:text-slate-300"
            >
              {isDeleting ? "삭제 중…" : "삭제"}
            </button>
          </>
        )}
      </div>

      {/* Markdown body */}
      <div className="mt-8 max-w-none">
        <ReactMarkdown
          remarkPlugins={[remarkGfm, remarkCjkFriendly]}
          components={{
            h1: ({ children }) => (
              <h1 className="mb-3 mt-8 text-2xl font-black text-slate-900 first:mt-0 dark:text-slate-100">{children}</h1>
            ),
            h2: ({ children }) => (
              <h2 className="mb-2 mt-7 text-xl font-bold text-slate-900 dark:text-slate-100">{children}</h2>
            ),
            h3: ({ children }) => (
              <h3 className="mb-2 mt-5 text-base font-bold text-slate-800 dark:text-slate-200">{children}</h3>
            ),
            p: ({ children }) => (
              <p className="mb-4 leading-7 text-slate-700 dark:text-slate-300">{children}</p>
            ),
            strong: ({ children }) => (
              <strong className="font-bold text-slate-900 dark:text-slate-100">{children}</strong>
            ),
            em: ({ children }) => (
              <em className="italic text-slate-700 dark:text-slate-300">{children}</em>
            ),
            blockquote: ({ children }) => (
              <blockquote className="my-4 border-l-4 border-blue-300 pl-4 italic text-slate-500 dark:border-blue-500/40 dark:text-slate-400">
                {children}
              </blockquote>
            ),
            code: ({
              className,
              children,
              ...props
            }: {
              inline?: boolean;
              className?: string;
              children?: React.ReactNode;
            }) =>
              /language-/.test(className ?? "") ? (
                <code className={`font-mono text-sm text-slate-100 ${className ?? ""}`} {...props}>
                  {children}
                </code>
              ) : (
                <code
                  className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-sm text-pink-600 dark:bg-navy-800 dark:text-pink-400"
                  {...props}
                >
                  {children}
                </code>
              ),
            pre: ({ children }) => (
              <pre className="my-4 overflow-x-auto rounded-xl bg-slate-900 px-5 py-4">{children}</pre>
            ),
            ul: ({ children }) => (
              <ul className="mb-4 ml-6 list-disc space-y-1.5 text-slate-700 dark:text-slate-300">{children}</ul>
            ),
            ol: ({ children }) => (
              <ol className="mb-4 ml-6 list-decimal space-y-1.5 text-slate-700 dark:text-slate-300">{children}</ol>
            ),
            li: ({ children }) => <li className="leading-7">{children}</li>,
            hr: () => <hr className="my-6 border-slate-200 dark:border-navy-700" />,
            a: ({ href, children }) => (
              <a
                href={href}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 underline hover:text-blue-800"
              >
                {children}
              </a>
            ),
            img: ({ src, alt }) => (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={src} alt={alt ?? ""} className="my-4 max-w-full rounded-xl" />
            ),
            table: ({ children }) => (
              <div className="my-4 overflow-x-auto">
                <table className="w-full border-collapse text-sm">{children}</table>
              </div>
            ),
            th: ({ children }) => (
              <th className="border border-slate-200 bg-slate-50 px-3 py-2 text-left font-semibold text-slate-700 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-200">
                {children}
              </th>
            ),
            td: ({ children }) => (
              <td className="border border-slate-200 px-3 py-2 text-slate-600 dark:border-navy-700 dark:text-slate-300">{children}</td>
            ),
          }}
        >
          {withSoftBreaks(content)}
        </ReactMarkdown>
      </div>

      {/* Like button */}
      <div className="mt-10 flex items-center gap-3 border-t border-slate-100 pt-6 dark:border-navy-800">
        <button
          onClick={handleLike}
          className={`flex items-center gap-2 rounded-xl border px-5 py-2.5 text-sm font-semibold transition ${
            hasLiked
              ? "border-red-400 bg-red-50 text-red-500"
              : "border-slate-200 text-slate-600 hover:border-red-300 hover:text-red-500 dark:border-navy-800 dark:text-slate-300"
          }`}
        >
          ❤️ {count}
        </button>
        <span className="text-sm text-slate-400">이 글이 도움됐다면 좋아요를 눌러주세요</span>
      </div>

      {/* Comments */}
      <div className="mt-10">
        <h2 className="mb-5 text-base font-bold text-slate-900 dark:text-slate-100">
          댓글 {comments.length > 0 && <span className="text-slate-400">{comments.length}</span>}
        </h2>

        {/* Comment form */}
        {userId ? (
          <form ref={formRef} onSubmit={handleComment} className="mb-6">
            {replyingTo && (
              <div className="mb-2 flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500 dark:bg-navy-800 dark:text-slate-300">
                <span>@{replyingTo.author?.username}님에게 답글 작성 중</span>
                <button type="button" onClick={() => setReplyingTo(null)} className="font-medium text-blue-600">취소</button>
              </div>
            )}
            <textarea
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              rows={3}
              placeholder={replyingTo ? "답글을 작성하세요..." : "댓글을 작성하세요..."}
              className="w-full resize-none rounded-xl border border-slate-200 px-4 py-3 text-sm focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500"
            />
            {commentError && (
              <p className="mt-1 text-xs text-red-500">{commentError}</p>
            )}
            <div className="mt-2 flex justify-end">
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="rounded-xl bg-navy-900 px-5 py-2 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-40 dark:bg-blue-600 dark:hover:bg-blue-700"
              >
                {replyingTo ? "답글 등록" : "댓글 등록"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mb-6 rounded-xl border border-dashed border-slate-200 py-5 text-center text-sm text-slate-400 dark:border-navy-800">
            <Link href="/login" className="text-blue-600 hover:underline">로그인</Link>하면 댓글을 작성할 수 있습니다.
          </div>
        )}

        {/* Comment list */}
        {comments.length > 0 && (
          <div className="space-y-4">
            {nestComments(comments).map((comment) => (
              <DevlogCommentItem
                key={comment.id}
                comment={comment}
                postId={postId}
                userId={userId}
                onReply={setReplyingTo}
                onDeleted={(commentId) => {
                  setComments((prev) => {
                    const idsToRemove = collectWithDescendants(prev, commentId);
                    return prev.filter((c) => !idsToRemove.has(c.id));
                  });
                  setReplyingTo((current) => (current?.id === commentId ? null : current));
                }}
              />
            ))}
          </div>
        )}
      </div>
    </>
  );
}