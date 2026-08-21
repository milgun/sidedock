"use client";

import { useEffect, useRef, useState, useTransition } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  deleteDevlogComment,
  toggleDevlogCommentReaction,
  updateDevlogComment,
} from "@/lib/actions/devlog";
import type { DevlogComment, Profile, ReactionEmoji } from "@/types";

const REACTIONS: Array<{ emoji: ReactionEmoji; label: string; color: string; bg: string }> = [
  { emoji: "🚀", label: "임팩트!", color: "text-indigo-600", bg: "bg-indigo-50" },
  { emoji: "🔥", label: "핫해요", color: "text-orange-500", bg: "bg-orange-50" },
  { emoji: "💡", label: "인사이트", color: "text-amber-500", bg: "bg-amber-50" },
  { emoji: "❤️", label: "좋아요", color: "text-rose-500", bg: "bg-rose-50" },
  { emoji: "✨", label: "멋져요", color: "text-cyan-500", bg: "bg-cyan-50" },
  { emoji: "🥺", label: "귀여워요", color: "text-pink-500", bg: "bg-pink-50" },
];

function Avatar({ profile, size }: { profile?: Profile; size: number }) {
  const name = profile?.display_name ?? profile?.username ?? "?";
  return (
    <div className="flex flex-shrink-0 items-center justify-center overflow-hidden rounded-full bg-slate-200 dark:bg-navy-800" style={{ width: size, height: size }}>
      {profile?.avatar_url ? (
        <Image src={profile.avatar_url} alt={name} width={size} height={size} className="h-full w-full object-cover" unoptimized />
      ) : (
        <span className="font-bold text-slate-500 dark:text-slate-400" style={{ fontSize: Math.max(9, size * 0.38) }}>{name[0]?.toUpperCase()}</span>
      )}
    </div>
  );
}

export default function DevlogCommentItem({
  comment,
  postId,
  userId,
  depth = 0,
  onReply,
  onDeleted,
}: {
  comment: DevlogComment & { author: Profile };
  postId: string;
  userId: string | null;
  depth?: number;
  onReply: (comment: DevlogComment & { author: Profile }) => void;
  onDeleted: (commentId: string) => void;
}) {
  const [showMenu, setShowMenu] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [content, setContent] = useState(comment.content);
  const [reactions, setReactions] = useState(comment.reactions ?? []);
  const [isPending, startTransition] = useTransition();
  const menuRef = useRef<HTMLDivElement>(null);
  const isOwn = userId === comment.author_id;
  const displayName = comment.author?.display_name ?? comment.author?.username ?? "알 수 없음";
  const grouped = REACTIONS.filter(({ emoji }) => reactions.some((reaction) => reaction.emoji === emoji)).map((reaction) => ({
    ...reaction,
    count: reactions.filter((item) => item.emoji === reaction.emoji).length,
    reacted: reactions.some((item) => item.emoji === reaction.emoji && item.user_id === userId),
  }));

  useEffect(() => {
    const handler = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) setShowMenu(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const saveEdit = () => {
    startTransition(async () => {
      const result = await updateDevlogComment(comment.id, postId, content);
      if (!result.error) setIsEditing(false);
    });
  };

  const remove = () => {
    setShowMenu(false);
    if (!window.confirm("댓글을 삭제하시겠습니까?")) return;
    startTransition(async () => {
      const result = await deleteDevlogComment(comment.id, postId);
      if (!result.error) onDeleted(comment.id);
    });
  };

  const react = (emoji: ReactionEmoji) => {
    if (!userId) return;
    const alreadyReacted = reactions.some((item) => item.emoji === emoji && item.user_id === userId);
    setReactions((prev) =>
      alreadyReacted
        ? prev.filter((item) => !(item.emoji === emoji && item.user_id === userId))
        : [...prev, { id: `optimistic-${emoji}-${userId}`, comment_id: comment.id, user_id: userId, emoji, created_at: new Date().toISOString() }]
    );
    startTransition(async () => {
      const result = await toggleDevlogCommentReaction(comment.id, postId, emoji);
      if (result.error) {
        setReactions((prev) =>
          alreadyReacted
            ? [...prev, { id: `optimistic-${emoji}-${userId}`, comment_id: comment.id, user_id: userId, emoji, created_at: new Date().toISOString() }]
            : prev.filter((item) => !(item.emoji === emoji && item.user_id === userId))
        );
      }
    });
  };

  return (
    <div className={`flex gap-3 ${depth > 0 ? "ml-8" : ""}`}>
      <div className="flex flex-col items-center">
        <Avatar profile={comment.author} size={depth > 0 ? 28 : 36} />
        {(comment.replies?.length ?? 0) > 0 && <div className="mt-1 w-0.5 flex-1 bg-slate-200 dark:bg-navy-800" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline gap-2">
          <Link href={`/profile/${comment.author?.username}`} className="text-sm font-semibold text-slate-900 hover:text-blue-700 dark:text-slate-100 dark:hover:text-blue-400">{displayName}</Link>
          <span className="text-xs text-slate-400">{new Date(comment.created_at).toLocaleDateString("ko-KR")}</span>
          {isOwn && (
            <div className="relative ml-auto" ref={menuRef}>
              <button type="button" onClick={() => setShowMenu((value) => !value)} className="flex h-6 w-6 items-center justify-center rounded-full text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-navy-800" aria-label="댓글 옵션">···</button>
              {showMenu && (
                <div className="absolute right-0 top-7 z-30 min-w-[96px] overflow-hidden rounded-xl border border-slate-100 bg-white shadow-lg dark:border-navy-800 dark:bg-navy-900">
                  <button type="button" onClick={() => { setShowMenu(false); setIsEditing(true); }} className="flex w-full px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-300 dark:hover:bg-navy-800">✏️ 수정</button>
                  <button type="button" onClick={remove} disabled={isPending} className="flex w-full px-4 py-2 text-sm text-red-500 hover:bg-red-50">🗑️ 삭제</button>
                </div>
              )}
            </div>
          )}
        </div>
        {isEditing ? (
          <div className="mt-2">
            <textarea value={content} onChange={(event) => setContent(event.target.value)} rows={3} className="w-full resize-none rounded-xl border border-slate-200 px-3 py-2 text-sm outline-none focus:border-blue-400 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-100" />
            <div className="mt-1 flex gap-2"><button type="button" onClick={saveEdit} disabled={isPending || !content.trim()} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50">저장</button><button type="button" onClick={() => { setContent(comment.content); setIsEditing(false); }} className="text-xs text-slate-400">취소</button></div>
          </div>
        ) : <p className="mt-1 whitespace-pre-wrap text-sm text-slate-700 dark:text-slate-300">{comment.content}</p>}
        <div className="relative mt-2 flex flex-wrap items-center gap-1.5" style={{ minHeight: 28 }}>
          {grouped.map(({ emoji, label, count, reacted, color, bg }) => <button key={emoji} type="button" disabled={!userId || isPending} onClick={() => react(emoji)} title={label} className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold shadow-sm transition hover:scale-105 ${reacted ? `${bg} ${color} border-transparent ring-2 ring-blue-300` : "border-slate-200 bg-white text-slate-500 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-400"}`}><span>{emoji}</span><span>{count}</span></button>)}
          {userId && <ReactionPicker onSelect={react} disabled={isPending} />}
          {depth < 2 && <button type="button" onClick={() => onReply(comment)} className="ml-1 text-xs font-medium text-slate-400 hover:text-blue-600">답글</button>}
        </div>
        {comment.replies?.map((reply) => <div key={reply.id} className="mt-4"><DevlogCommentItem comment={reply as DevlogComment & { author: Profile }} postId={postId} userId={userId} depth={depth + 1} onReply={onReply} onDeleted={onDeleted} /></div>)}
      </div>
    </div>
  );
}

function ReactionPicker({ onSelect, disabled }: { onSelect: (emoji: ReactionEmoji) => void; disabled: boolean }) {
  const [open, setOpen] = useState(false);
  return <div className="relative"><button type="button" disabled={disabled} onClick={() => setOpen((value) => !value)} className="flex h-7 items-center gap-0.5 rounded-full border border-dashed border-slate-300 px-2 text-xs text-slate-400 hover:bg-slate-50 dark:border-navy-700 dark:hover:bg-navy-800" title="반응 추가">☺ <span className="text-[10px] font-bold">+</span></button>{open && <div className="absolute bottom-9 left-0 z-20 flex gap-0.5 rounded-2xl border border-slate-100 bg-white p-2 shadow-xl dark:border-navy-800 dark:bg-navy-900">{REACTIONS.map(({ emoji, label }) => <button key={emoji} type="button" onClick={() => { onSelect(emoji); setOpen(false); }} title={label} className="rounded-xl p-2 text-xl hover:bg-slate-50 dark:hover:bg-navy-800">{emoji}</button>)}</div>}</div>;
}
