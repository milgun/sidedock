"use client";

import { useState, useTransition, useRef, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { toggleReaction, createComment, updateComment, deleteComment } from "@/lib/actions/comment";
import type { Comment, ReactionEmoji } from "@/types";

const REACTIONS: { emoji: ReactionEmoji; label: string; color: string; bg: string; ring: string }[] = [
  { emoji: "🚀", label: "임팩트!",   color: "text-indigo-600",  bg: "bg-indigo-50",  ring: "ring-indigo-300" },
  { emoji: "🔥", label: "핫해요",    color: "text-orange-500", bg: "bg-orange-50",  ring: "ring-orange-300" },
  { emoji: "💡", label: "인사이트",  color: "text-amber-500",  bg: "bg-amber-50",   ring: "ring-amber-300" },
  { emoji: "❤️", label: "좋아요",    color: "text-rose-500",   bg: "bg-rose-50",    ring: "ring-rose-300" },
  { emoji: "✨", label: "멋져요",    color: "text-cyan-500",   bg: "bg-cyan-50",    ring: "ring-cyan-300" },
  { emoji: "🥺", label: "귀여워요",  color: "text-pink-500",   bg: "bg-pink-50",    ring: "ring-pink-300" },
];

const REACTION_EMOJIS = REACTIONS.map((r) => r.emoji) as ReactionEmoji[];

function Avatar({
  url,
  name,
  size = 32,
}: {
  url: string | null | undefined;
  name: string;
  size?: number;
}) {
  return (
    <div
      className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 dark:bg-navy-800"
      style={{ width: size, height: size }}
    >
      {url ? (
        <Image
          src={url}
          alt={name}
          width={size}
          height={size}
          className="h-full w-full object-cover"
          unoptimized
        />
      ) : (
        <span
          className="font-bold text-slate-500 dark:text-slate-400"
          style={{ fontSize: Math.max(9, size * 0.38) }}
        >
          {name[0]?.toUpperCase() ?? "?"}
        </span>
      )}
    </div>
  );
}

interface ReactionBarProps {
  comment: Comment;
  productId: string;
  userId: string | null;
  onReplyClick?: () => void;
  showReplyCancel?: boolean;
  depth?: number;
}

function ReactionBar({ comment, productId, userId, onReplyClick, showReplyCancel, depth = 0 }: ReactionBarProps) {
  const [isPending, startTransition] = useTransition();
  const [showPicker, setShowPicker] = useState(false);

  // Group reactions by emoji
  const grouped = REACTION_EMOJIS.reduce<Record<string, { count: number; userReacted: boolean }>>(
    (acc, emoji) => {
      const list = (comment.reactions ?? []).filter((r) => r.emoji === emoji);
      if (list.length > 0) {
        acc[emoji] = {
          count: list.length,
          userReacted: userId ? list.some((r) => r.user_id === userId) : false,
        };
      }
      return acc;
    },
    {}
  );

  const handleReact = (emoji: ReactionEmoji) => {
    if (!userId) return;
    setShowPicker(false);
    startTransition(() => toggleReaction(comment.id, productId, emoji));
  };

  return (
    <div className="relative mt-2 flex flex-wrap items-center gap-1.5" style={{ minHeight: 28 }}>
      {/* Existing reaction pills */}
      {REACTIONS.filter(({ emoji }) => grouped[emoji]).map(({ emoji, label, color, bg, ring }) => {
        const { count, userReacted } = grouped[emoji]!;
        return (
          <button
            key={emoji}
            disabled={!userId || isPending}
            onClick={() => handleReact(emoji)}
            title={label}
            className={`group flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 disabled:cursor-default ${
              userReacted
                ? `ring-2 ${ring} border-transparent ${bg} ${color}`
                : `border-slate-200 bg-white text-slate-500 hover:${bg} hover:${color} hover:border-transparent dark:border-navy-700 dark:bg-navy-900 dark:text-slate-400`
            }`}
          >
            <span className="text-sm leading-none">{emoji}</span>
            <span>{count}</span>
          </button>
        );
      })}

      {/* Add reaction button */}
      {userId && (
        <div className="relative">
          <button
            onClick={() => setShowPicker((v) => !v)}
            className="flex h-7 items-center gap-0.5 rounded-full border border-dashed border-slate-300 px-2 text-xs text-slate-400 transition hover:border-slate-400 hover:bg-slate-50 hover:text-slate-600 dark:border-navy-700 dark:hover:bg-navy-800"
            title="반응 추가"
          >
            <span className="text-base leading-none">☺</span>
            <span className="text-[10px] font-bold leading-none">+</span>
          </button>
          {showPicker && (
            <>
              {/* backdrop */}
              <div
                className="fixed inset-0 z-10"
                onClick={() => setShowPicker(false)}
              />
              <div className="absolute bottom-9 left-0 z-20 flex gap-0.5 rounded-2xl border border-slate-100 bg-white/90 p-2 shadow-xl backdrop-blur-sm dark:border-navy-800 dark:bg-navy-900/90">
                {REACTIONS.map(({ emoji, label, bg, color }) => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    title={label}
                    className={`group relative flex flex-col items-center gap-0.5 rounded-xl p-2 transition-all duration-150 hover:scale-125 hover:${bg}`}
                  >
                    <span className="text-xl leading-none">{emoji}</span>
                    <span className={`text-[9px] font-semibold leading-none opacity-0 transition-opacity group-hover:opacity-100 ${color}`}>{label}</span>
                  </button>
                ))}
              </div>
            </>
          )}
        </div>
      )}
      {/* Reply button — inline on same row */}
      {depth < 2 && onReplyClick && (
        <button
          onClick={onReplyClick}
          className="ml-1 text-xs font-medium text-slate-400 transition hover:text-blue-600"
        >
          {showReplyCancel ? "취소" : "답글"}
        </button>
      )}    </div>
  );
}

interface CommentItemProps {
  comment: Comment;
  productId: string;
  userId: string | null;
  depth?: number;
}

export default function CommentItem({
  comment,
  productId,
  userId,
  depth = 0,
}: CommentItemProps) {
  const [showReplyForm, setShowReplyForm] = useState(false);
  const [isPending, startTransition] = useTransition();
  const formRef = useRef<HTMLFormElement>(null);

  // 수정/삭제 메뉴
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editContent, setEditContent] = useState(comment.content);
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwn = userId === comment.user_id;

  // 메뉴 외부 클릭 시 닫기
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleEdit = () => {
    setShowMenu(false);
    setIsEditing(true);
  };

  const handleEditSubmit = () => {
    startTransition(async () => {
      await updateComment(comment.id, productId, editContent);
      setIsEditing(false);
    });
  };

  const handleDelete = () => {
    setShowMenu(false);
    if (!confirm("댓글을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      await deleteComment(comment.id, productId);
    });
  };

  const displayName =
    comment.profile?.display_name ?? comment.profile?.username ?? "알 수 없음";
  const isReply = depth > 0;

  const handleReplySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    fd.set("product_id", productId);
    fd.set("parent_id", comment.id);
    startTransition(async () => {
      await createComment(fd);
      formRef.current?.reset();
      setShowReplyForm(false);
    });
  };

  const hasReplies = depth < 2 && (comment.replies ?? []).length > 0;
  const avatarSize = isReply ? 28 : 36;

  return (
    <div className="flex gap-3">
      {/* Avatar column — 세로선은 아바타 아래에서 시작 */}
      <div className="flex flex-col items-center">
        <Avatar url={comment.profile?.avatar_url} name={displayName} size={avatarSize} />
        {hasReplies && (
          <div className="mt-1 w-0.5 flex-1 bg-slate-200 dark:bg-navy-800" />
        )}
      </div>

      <div className="flex-1 min-w-0">
        {/* Header */}
        <div className="flex items-baseline gap-2">
          <Link
            href={comment.profile?.username ? `/profile/${comment.profile.username}` : "#"}
            className="text-sm font-semibold text-slate-900 hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-400"
          >
            {displayName}
          </Link>
          <span className="text-xs text-slate-400">
            {new Date(comment.created_at).toLocaleDateString("ko-KR")}
          </span>
          {/* ... 메뉴 (본인 댓글만) */}
          {isOwn && (
            <div className="relative ml-auto" ref={menuRef}>
              <button
                onClick={() => setShowMenu((v) => !v)}
                className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-navy-800"
                aria-label="댓글 옵션"
              >
                ···
              </button>
              {showMenu && (
                <div className="absolute right-0 top-7 z-30 min-w-[96px] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg dark:border-navy-800 dark:bg-navy-900">
                  <button
                    onClick={handleEdit}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-slate-700 transition hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-navy-800"
                  >
                    ✏️ 수정
                  </button>
                  <button
                    onClick={handleDelete}
                    disabled={isPending}
                    className="flex w-full items-center gap-2 px-4 py-2 text-sm text-red-500 transition hover:bg-red-50"
                  >
                    🗑️ 삭제
                  </button>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Body */}
        {isEditing ? (
          <div className="mt-1 flex flex-col gap-2">
            <textarea
              value={editContent}
              onChange={(e) => setEditContent(e.target.value)}
              rows={3}
              className="w-full resize-none rounded-xl border border-blue-300 bg-white px-3 py-2 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-navy-800 dark:text-slate-100"
            />
            <div className="flex gap-2">
              <button
                onClick={handleEditSubmit}
                disabled={isPending}
                className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
              >
                {isPending ? "…" : "저장"}
              </button>
              <button
                onClick={() => { setIsEditing(false); setEditContent(comment.content); }}
                className="rounded-lg border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-600 transition hover:bg-slate-50 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800"
              >
                취소
              </button>
            </div>
          </div>
        ) : (
          <p className="mt-0.5 text-sm leading-relaxed text-slate-600 whitespace-pre-wrap dark:text-slate-300">
            {comment.content}
          </p>
        )}

        {/* Reactions + Reply button on one line */}
        <ReactionBar
          comment={comment}
          productId={productId}
          userId={userId}
          depth={depth}
          onReplyClick={depth < 2 ? () => setShowReplyForm((v) => !v) : undefined}
          showReplyCancel={showReplyForm}
        />

        {/* Inline reply form */}
        {showReplyForm && (
          <form
            ref={formRef}
            onSubmit={handleReplySubmit}
            className="mt-3 flex gap-2"
          >
            <textarea
              name="content"
              placeholder="답글을 작성하세요…"
              rows={2}
              required
              className="flex-1 resize-none rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-100 dark:placeholder-slate-500"
            />
            <button
              type="submit"
              disabled={isPending}
              className="self-end rounded-xl bg-blue-600 px-4 py-2 text-xs font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
            >
              {isPending ? "…" : "등록"}
            </button>
          </form>
        )}

        {/* Nested replies */}
        {hasReplies && (
          <div className="mt-3 space-y-4">
            {(comment.replies ?? []).map((reply) => (
              <CommentItem
                key={reply.id}
                comment={reply}
                productId={productId}
                userId={userId}
                depth={depth + 1}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
