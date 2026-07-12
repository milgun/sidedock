"use client";

import { useState, useRef, useTransition, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import remarkCjkFriendly from "remark-cjk-friendly";
import { createDevlogPost, updateDevlogPost } from "@/lib/actions/devlog";

export interface DevlogInitialData {
  title: string;
  content: string;
  tags: string;
  thumbnail_url: string | null;
}

// ── 커서 삽입 헬퍼 ────────────────────────────────────────────────────────────

type InsertMode =
  | { type: "wrap"; before: string; after: string; placeholder?: string }
  | { type: "line"; prefix: string }
  | { type: "block"; text: string }
  | { type: "surround"; open: string; close: string };

function applyInsert(
  textarea: HTMLTextAreaElement,
  mode: InsertMode,
  setter: (v: string) => void,
) {
  const { value, selectionStart: ss, selectionEnd: se } = textarea;
  const selected = value.slice(ss, se);
  let newText = "",
    newSs = ss,
    newSe = ss;

  if (mode.type === "wrap") {
    const inner = selected || mode.placeholder || "텍스트";
    newText =
      value.slice(0, ss) + mode.before + inner + mode.after + value.slice(se);
    newSs = ss + mode.before.length;
    newSe = newSs + inner.length;
  } else if (mode.type === "line") {
    const lineStart = value.lastIndexOf("\n", ss - 1) + 1;
    const lineEnd = value.indexOf("\n", ss);
    const end = lineEnd === -1 ? value.length : lineEnd;
    const lineContent = value.slice(lineStart, end) || "텍스트";
    newText =
      value.slice(0, lineStart) + mode.prefix + lineContent + value.slice(end);
    newSs = lineStart + mode.prefix.length;
    newSe = newSs + lineContent.length;
  } else if (mode.type === "block") {
    const needNewline = ss > 0 && value[ss - 1] !== "\n";
    const prefix = needNewline ? "\n" : "";
    newText =
      value.slice(0, ss) + prefix + mode.text + value.slice(se);
    newSs = ss + prefix.length + mode.text.length;
    newSe = newSs;
  } else {
    // surround: 커서를 open과 close 사이에 위치
    const needNewline = ss > 0 && value[ss - 1] !== "\n";
    const prefix = needNewline ? "\n" : "";
    const inner = selected || "";
    newText =
      value.slice(0, ss) + prefix + mode.open + inner + mode.close + value.slice(se);
    newSs = ss + prefix.length + mode.open.length;
    newSe = newSs + inner.length;
  }

  setter(newText);
  requestAnimationFrame(() => {
    textarea.focus({ preventScroll: true });
    textarea.setSelectionRange(newSs, newSe);
  });
}

// ── 툴바 버튼 ─────────────────────────────────────────────────────────────────

function ToolBtn({
  children,
  title,
  onClick,
  disabled,
}: {
  children: React.ReactNode;
  title: string;
  onClick: () => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      title={title}
      disabled={disabled}
      onClick={onClick}
      className="flex h-7 w-7 items-center justify-center rounded-lg text-slate-500 transition hover:bg-slate-200 hover:text-slate-900 disabled:opacity-40 dark:text-slate-400 dark:hover:bg-navy-700 dark:hover:text-slate-100"
    >
      {children}
    </button>
  );
}

// ── 구분선 ────────────────────────────────────────────────────────────────────

function Sep() {
  return <div className="h-4 w-px bg-slate-200 dark:bg-navy-700" />;
}

export default function DevlogEditor({
  mode = "create",
  postId,
  initialData,
}: {
  mode?: "create" | "edit";
  postId?: string;
  initialData?: DevlogInitialData;
}) {
  const router = useRouter();
  const [title, setTitle] = useState(initialData?.title ?? "");
  const [content, setContent] = useState(initialData?.content ?? "");
  const [tags, setTags] = useState(initialData?.tags ?? "");
  const [thumbnail, setThumbnail] = useState<string | null>(initialData?.thumbnail_url ?? null);
  const [view, setView] = useState<"split" | "edit" | "preview">("split");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // 에디터 이미지 업로드
  const [isUploading, setIsUploading] = useState(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // 썸네일 업로드
  const [isThumbnailUploading, setIsThumbnailUploading] = useState(false);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  // 링크 모달
  const [linkModal, setLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const insert = useCallback((mode: InsertMode) => {
    if (!textareaRef.current) return;
    applyInsert(textareaRef.current, mode, setContent);
  }, []);

  // 번호 목록 버튼: 이전 줄의 번호를 감지해 자동 증가
  const insertOrderedListItem = useCallback(() => {
    const textarea = textareaRef.current;
    if (!textarea) return;
    const { value, selectionStart: ss } = textarea;
    const lineStart = value.lastIndexOf("\n", ss - 1) + 1;
    let prevNum = 0;
    let pos = lineStart - 1;
    while (pos >= 0) {
      const end = pos;
      const start = value.lastIndexOf("\n", end - 1) + 1;
      const line = value.slice(start, end);
      const m = line.match(/^[ \t]*(\d+)\.[ \t]/);
      if (m) { prevNum = parseInt(m[1]); break; }
      if (line.trim()) break;
      pos = start - 1;
    }
    applyInsert(textarea, { type: "line", prefix: `${prevNum + 1}. ` }, setContent);
  }, []);

  // Enter 키: 목록 자동 계속 / 빈 항목에서 목록 탈출
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    const textarea = textareaRef.current!;

    if (e.key === "Tab") {
      e.preventDefault();
      applyInsert(textarea, { type: "wrap", before: "  ", after: "", placeholder: "" }, setContent);
      return;
    }

    if (e.key === "Enter") {
      const { value, selectionStart: ss } = textarea;
      const lineStart = value.lastIndexOf("\n", ss - 1) + 1;
      const lineEnd = value.indexOf("\n", ss);
      const end = lineEnd === -1 ? value.length : lineEnd;
      const currentLine = value.slice(lineStart, end);

      // 비순서 목록 (-, *, +)
      const ulMatch = currentLine.match(/^([ \t]*)([-*+])[ \t]+(.*)$/);
      if (ulMatch) {
        e.preventDefault();
        const [, indent, bullet, rest] = ulMatch;
        if (!rest.trim()) {
          // 빈 항목 → 목록 탈출
          const newValue = value.slice(0, lineStart) + "\n" + value.slice(end);
          setContent(newValue);
          requestAnimationFrame(() => textarea.setSelectionRange(lineStart + 1, lineStart + 1));
        } else {
          const prefix = `\n${indent}${bullet} `;
          const newValue = value.slice(0, ss) + prefix + value.slice(ss);
          setContent(newValue);
          const newPos = ss + prefix.length;
          requestAnimationFrame(() => textarea.setSelectionRange(newPos, newPos));
        }
        return;
      }

      // 순서 목록 (1. 2. ...)
      const olMatch = currentLine.match(/^([ \t]*)(\d+)\.[ \t]+(.*)$/);
      if (olMatch) {
        e.preventDefault();
        const [, indent, numStr, rest] = olMatch;
        if (!rest.trim()) {
          // 빈 항목 → 목록 탈출
          const newValue = value.slice(0, lineStart) + "\n" + value.slice(end);
          setContent(newValue);
          requestAnimationFrame(() => textarea.setSelectionRange(lineStart + 1, lineStart + 1));
        } else {
          const nextNum = parseInt(numStr) + 1;
          const prefix = `\n${indent}${nextNum}. `;
          const newValue = value.slice(0, ss) + prefix + value.slice(ss);
          setContent(newValue);
          const newPos = ss + prefix.length;
          requestAnimationFrame(() => textarea.setSelectionRange(newPos, newPos));
        }
        return;
      }
    }
  }, []);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string };
      if (res.ok && data.url) {
        insert({ type: "block", text: `![이미지 설명](${data.url})\n` });
      }
    } finally {
      setIsUploading(false);
      e.target.value = "";
    }
  };

  const handleThumbnailUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsThumbnailUploading(true);
    const fd = new FormData();
    fd.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: fd });
      const data = (await res.json()) as { url?: string };
      if (res.ok && data.url) setThumbnail(data.url);
    } finally {
      setIsThumbnailUploading(false);
      e.target.value = "";
    }
  };

  const handleLinkInsert = () => {
    const text = linkText.trim() || linkUrl.trim() || "링크";
    const url = linkUrl.trim() || "https://";
    insert({ type: "block", text: `[${text}](${url})` });
    setLinkModal(false);
    setLinkText("");
    setLinkUrl("");
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("content", content);
      fd.append("tags", tags);
      if (thumbnail) fd.append("thumbnail_url", thumbnail);

      let result: { error?: string; slug?: string } | undefined;
      if (mode === "edit" && postId) {
        result = await updateDevlogPost(postId, fd);
      } else {
        result = await createDevlogPost(fd);
      }
      if (result?.error) {
        setError(result.error);
      } else if (result?.slug) {
        router.push(`/devlog/${result.slug}`);
      }
    });
  };

  return (
    <div className="space-y-4">
      {/* 링크 삽입 모달 */}
      {linkModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl dark:bg-navy-900">
            <h3 className="mb-4 text-sm font-bold text-slate-900 dark:text-slate-100">링크 삽입</h3>
            <div className="space-y-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  표시 텍스트
                </label>
                <input
                  type="text"
                  value={linkText}
                  onChange={(e) => setLinkText(e.target.value)}
                  placeholder="예: GitHub 저장소"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500"
                  autoFocus
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-500 dark:text-slate-400">
                  URL
                </label>
                <input
                  type="url"
                  value={linkUrl}
                  onChange={(e) => setLinkUrl(e.target.value)}
                  placeholder="https://"
                  className="w-full rounded-xl border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500"
                  onKeyDown={(e) => e.key === "Enter" && handleLinkInsert()}
                />
              </div>
            </div>
            <div className="mt-4 flex gap-2">
              <button
                onClick={() => setLinkModal(false)}
                className="flex-1 rounded-xl border border-slate-200 py-2 text-sm text-slate-600 hover:bg-slate-50 dark:border-navy-700 dark:text-slate-300 dark:hover:bg-navy-800"
              >
                취소
              </button>
              <button
                onClick={handleLinkInsert}
                className="flex-1 rounded-xl bg-blue-600 py-2 text-sm font-semibold text-white hover:bg-blue-700"
              >
                삽입
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 썸네일 업로드 */}
      <div>
        <p className="mb-2 text-xs font-medium text-slate-500 dark:text-slate-400">썸네일 이미지 (선택)</p>
        <div
          onClick={() => thumbnailInputRef.current?.click()}
          className="relative flex cursor-pointer items-center justify-center overflow-hidden rounded-2xl border-2 border-dashed border-slate-200 bg-slate-50 transition hover:border-blue-300 hover:bg-blue-50 dark:border-navy-700 dark:bg-navy-800 dark:hover:border-blue-500/40 dark:hover:bg-navy-700"
          style={{ height: 180 }}
        >
          {thumbnail ? (
            <>
              <Image src={thumbnail} alt="썸네일" fill className="object-cover" />
              <button
                type="button"
                onClick={(e) => { e.stopPropagation(); setThumbnail(null); }}
                className="absolute right-3 top-3 rounded-full bg-black/60 p-1.5 text-white hover:bg-black/80"
              >
                <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2}>
                  <path d="M18 6L6 18M6 6l12 12" />
                </svg>
              </button>
            </>
          ) : isThumbnailUploading ? (
            <p className="text-sm text-slate-400">업로드 중…</p>
          ) : (
            <div className="flex flex-col items-center gap-2 text-slate-400">
              <svg viewBox="0 0 24 24" className="h-8 w-8" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
              <p className="text-sm">클릭하여 썸네일 업로드</p>
              <p className="text-xs">권장: 1200×630px</p>
            </div>
          )}
        </div>
        <input ref={thumbnailInputRef} type="file" accept="image/*" className="hidden" onChange={handleThumbnailUpload} />
      </div>

      {/* 제목 */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        className="w-full border-b border-slate-200 px-1 py-3 text-2xl font-black placeholder-slate-300 focus:border-blue-400 focus:outline-none dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-600"
      />

      {/* 태그 */}
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="태그 (쉼표 구분, 예: nextjs, supabase, 사이드프로젝트)"
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:bg-navy-800 dark:border-navy-700 dark:text-slate-100 dark:placeholder-slate-500"
      />

      {/* 에디터 */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 dark:border-navy-800">
        {/* 상단 툴바 */}
        <div className="flex flex-wrap items-center gap-1.5 border-b border-slate-100 bg-slate-50 px-3 py-2 dark:border-navy-800 dark:bg-navy-800">
          {/* 뷰 전환 */}
          <div className="flex gap-0.5 rounded-lg bg-slate-100 p-0.5 dark:bg-navy-900">
            {(["edit", "split", "preview"] as const).map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => setView(v)}
                className={`rounded-md px-2.5 py-1 text-xs font-medium transition ${
                  view === v
                    ? "bg-white text-slate-900 shadow-sm dark:bg-navy-700 dark:text-slate-100"
                    : "text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200"
                }`}
              >
                {v === "edit" ? "편집" : v === "split" ? "분할" : "미리보기"}
              </button>
            ))}
          </div>

          <Sep />

          {/* 제목 */}
          <ToolBtn title="제목 1" onClick={() => insert({ type: "line", prefix: "# " })}>
            <b className="text-[11px]">H1</b>
          </ToolBtn>
          <ToolBtn title="제목 2" onClick={() => insert({ type: "line", prefix: "## " })}>
            <b className="text-[11px]">H2</b>
          </ToolBtn>
          <ToolBtn title="제목 3" onClick={() => insert({ type: "line", prefix: "### " })}>
            <b className="text-[11px]">H3</b>
          </ToolBtn>

          <Sep />

          {/* 서식 */}
          <ToolBtn
            title="굵게"
            onClick={() =>
              insert({ type: "wrap", before: "**", after: "**", placeholder: "굵은 텍스트" })
            }
          >
            <b className="text-sm">B</b>
          </ToolBtn>
          <ToolBtn
            title="기울임"
            onClick={() =>
              insert({ type: "wrap", before: "*", after: "*", placeholder: "기울임 텍스트" })
            }
          >
            <i className="font-serif text-sm">I</i>
          </ToolBtn>
          <ToolBtn title="인용" onClick={() => insert({ type: "line", prefix: "> " })}>
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor">
              <path d="M4.583 17.321C3.553 16.227 3 15 3 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179zm10 0C13.553 16.227 13 15 13 13.011c0-3.5 2.457-6.637 6.03-8.188l.893 1.378c-3.335 1.804-3.987 4.145-4.247 5.621.537-.278 1.24-.375 1.929-.311 1.804.167 3.226 1.648 3.226 3.489a3.5 3.5 0 01-3.5 3.5c-1.073 0-2.099-.49-2.748-1.179z" />
            </svg>
          </ToolBtn>

          <Sep />

          {/* 코드 */}
          <ToolBtn
            title="인라인 코드"
            onClick={() =>
              insert({ type: "wrap", before: "`", after: "`", placeholder: "코드" })
            }
          >
            <code className="font-mono text-xs">`c`</code>
          </ToolBtn>
          <ToolBtn
            title="코드 블록"
            onClick={() => insert({ type: "surround", open: "```\n", close: "\n```\n" })}
          >
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <rect x="3" y="3" width="18" height="18" rx="2" />
              <polyline points="9 9 6 12 9 15" />
              <polyline points="15 9 18 12 15 15" />
            </svg>
          </ToolBtn>

          <Sep />

          {/* 링크 / 이미지 */}
          <ToolBtn title="링크 삽입" onClick={() => setLinkModal(true)}>
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path d="M10 13a5 5 0 007.54.54l3-3a5 5 0 00-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 00-7.54-.54l-3 3a5 5 0 007.07 7.07l1.71-1.71" />
            </svg>
          </ToolBtn>
          <ToolBtn
            title="이미지 업로드"
            onClick={() => imageInputRef.current?.click()}
            disabled={isUploading}
          >
            {isUploading ? (
              <span className="text-[10px]">…</span>
            ) : (
              <svg
                viewBox="0 0 24 24"
                className="h-3.5 w-3.5"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
              >
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <polyline points="21 15 16 10 5 21" />
              </svg>
            )}
          </ToolBtn>
          <input
            ref={imageInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleImageUpload}
          />

          <Sep />

          {/* 목록 */}
          <ToolBtn title="목록" onClick={() => insert({ type: "line", prefix: "- " })}>
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <line x1="9" y1="6" x2="20" y2="6" />
              <line x1="9" y1="12" x2="20" y2="12" />
              <line x1="9" y1="18" x2="20" y2="18" />
              <circle cx="4" cy="6" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="4" cy="12" r="1.5" fill="currentColor" stroke="none" />
              <circle cx="4" cy="18" r="1.5" fill="currentColor" stroke="none" />
            </svg>
          </ToolBtn>
          <ToolBtn title="번호 목록" onClick={insertOrderedListItem}>
            <svg
              viewBox="0 0 24 24"
              className="h-3.5 w-3.5"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
            >
              <line x1="10" y1="6" x2="21" y2="6" />
              <line x1="10" y1="12" x2="21" y2="12" />
              <line x1="10" y1="18" x2="21" y2="18" />
              <path d="M4 5h1v5" strokeWidth={1.8} fill="none" />
              <path d="M3 15h2a1 1 0 010 2H3a1 1 0 000 2h2" strokeWidth={1.6} fill="none" />
            </svg>
          </ToolBtn>
          <ToolBtn title="구분선" onClick={() => insert({ type: "block", text: "\n---\n\n" })}>
            <span className="text-xs font-bold">—</span>
          </ToolBtn>
        </div>

        {/* 편집 / 미리보기 영역 */}
        <div className={`flex ${view === "split" ? "divide-x divide-slate-100 dark:divide-navy-800" : ""}`}>
          {(view === "split" || view === "edit") && (
            <textarea
              ref={textareaRef}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder={
                "마크다운으로 작성하세요.\n\n## 오늘 배운 것\n\n- 항목 1\n- 항목 2\n\n```ts\nconst hello = \"world\";\n```"
              }
              rows={22}
              className={`resize-none bg-white px-5 py-4 font-mono text-sm text-slate-800 placeholder-slate-300 focus:outline-none dark:bg-navy-900 dark:text-slate-300 dark:placeholder-slate-600 ${
                view === "split" ? "w-1/2" : "w-full"
              }`}
            />
          )}

          {(view === "split" || view === "preview") && (
            <div
              className={`overflow-y-auto bg-white px-6 py-5 dark:bg-navy-900 ${
                view === "split" ? "w-1/2" : "w-full"
              }`}
              style={{ minHeight: 440, maxHeight: 600 }}
            >
              {content ? (
                <MarkdownPreview content={withSoftBreaks(content)} />
              ) : (
                <p className="text-sm text-slate-400">미리볼 내용이 없습니다.</p>
              )}
            </div>
          )}
        </div>
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">마크다운(Markdown) 문법을 지원합니다.</p>
        <button
          onClick={handleSubmit}
          disabled={isPending || !title.trim() || !content.trim()}
          className="rounded-xl bg-slate-900 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-slate-700 disabled:opacity-40 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {isPending
            ? mode === "edit" ? "저장 중…" : "발행 중…"
            : mode === "edit" ? "저장하기" : "발행하기"}
        </button>
      </div>
    </div>
  );
}

// ── 마크다운 미리보기 ─────────────────────────────────────────────────────────

/**
 * 단일 줄바꿈(엔터 1번)을 마크다운 소프트 브레이크(줄 끝 공백 2개)로 변환.
 * 코드 블록 내부와 빈 줄은 그대로 유지.
 */
function withSoftBreaks(content: string): string {
  const parts = content.split(/(```[\s\S]*?```)/g);
  return parts
    .map((part, i) => {
      if (i % 2 === 1) return part; // 코드 블록은 건드리지 않음
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

function MarkdownPreview({ content }: { content: string }) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm, remarkCjkFriendly]}

      components={{
        h1: ({ children }) => (
          <h1 className="mb-3 mt-7 text-2xl font-black text-slate-900 first:mt-0 dark:text-slate-100">{children}</h1>
        ),
        h2: ({ children }) => (
          <h2 className="mb-2 mt-6 text-xl font-bold text-slate-900 dark:text-slate-100">{children}</h2>
        ),
        h3: ({ children }) => (
          <h3 className="mb-2 mt-5 text-base font-bold text-slate-800 dark:text-slate-200">{children}</h3>
        ),
        p: ({ children }) => (
          <p className="mb-3 leading-7 text-slate-700 dark:text-slate-300">{children}</p>
        ),
        strong: ({ children }) => (
          <strong className="font-bold text-slate-900 dark:text-slate-100">{children}</strong>
        ),
        em: ({ children }) => (
          <em className="italic text-slate-700 dark:text-slate-300">{children}</em>
        ),
        blockquote: ({ children }) => (
          <blockquote className="my-3 border-l-4 border-blue-300 pl-4 italic text-slate-500 dark:border-blue-500/40 dark:text-slate-400">
            {children}
          </blockquote>
        ),
        code: ({
          inline,
          children,
          ...props
        }: {
          inline?: boolean;
          className?: string;
          children?: React.ReactNode;
        }) =>
          inline ? (
            <code
              className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-xs text-pink-600 dark:bg-navy-800 dark:text-pink-400"
              {...props}
            >
              {children}
            </code>
          ) : (
            <pre className="my-3 overflow-x-auto rounded-xl bg-slate-900 px-4 py-3">
              <code className="font-mono text-xs text-slate-100" {...props}>
                {children}
              </code>
            </pre>
          ),
        ul: ({ children }) => (
          <ul className="mb-3 ml-5 list-disc space-y-1 text-slate-700 dark:text-slate-300">{children}</ul>
        ),
        ol: ({ children }) => (
          <ol className="mb-3 ml-5 list-decimal space-y-1 text-slate-700 dark:text-slate-300">{children}</ol>
        ),
        li: ({ children }) => <li className="leading-6">{children}</li>,
        hr: () => <hr className="my-5 border-slate-200 dark:border-navy-700" />,
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
          <img src={src} alt={alt ?? ""} className="my-3 max-w-full rounded-xl" />
        ),
        table: ({ children }) => (
          <div className="my-3 overflow-x-auto">
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
      {content}
    </ReactMarkdown>
  );
}