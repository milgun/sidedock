"use client";

import { useState, useTransition } from "react";
import { createDevlogPost } from "@/lib/actions/devlog";

const TOOLBAR = [
  { label: "B",  syntax: "**굵게**",    title: "Bold" },
  { label: "I",  syntax: "*기울임*",    title: "Italic" },
  { label: "H2", syntax: "## 제목\n",   title: "Heading" },
  { label: "—",  syntax: "---\n",       title: "구분선" },
  { label: "• ", syntax: "- 항목\n",    title: "목록" },
  { label: "`",  syntax: "`코드`",       title: "Inline code" },
  { label: "```",syntax: "```\n코드\n```\n", title: "Code block" },
];

export default function DevlogEditor() {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [tags, setTags] = useState("");
  const [preview, setPreview] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const insertSyntax = (syntax: string) => {
    setContent((c) => c + (c.endsWith("\n") || c === "" ? "" : "\n") + syntax);
  };

  const handleSubmit = () => {
    setError(null);
    startTransition(async () => {
      const fd = new FormData();
      fd.append("title", title);
      fd.append("content", content);
      fd.append("tags", tags);
      const result = await createDevlogPost(fd);
      if (result?.error) setError(result.error);
    });
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="제목을 입력하세요"
        className="w-full rounded-xl border border-slate-200 px-4 py-3 text-lg font-bold placeholder-slate-300 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />

      {/* Tags */}
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="태그 (쉼표 구분, 예: nextjs, supabase, 사이드프로젝트)"
        className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />

      {/* Editor / Preview toggle */}
      <div className="overflow-hidden rounded-2xl border border-slate-200">
        {/* Tab bar */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50 px-3 py-2">
          <div className="flex gap-1">
            <button
              onClick={() => setPreview(false)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                !preview ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              편집
            </button>
            <button
              onClick={() => setPreview(true)}
              className={`rounded-lg px-3 py-1 text-xs font-medium transition ${
                preview ? "bg-white shadow-sm text-slate-900" : "text-slate-400 hover:text-slate-700"
              }`}
            >
              미리보기
            </button>
          </div>
          {!preview && (
            <div className="flex gap-1">
              {TOOLBAR.map((t) => (
                <button
                  key={t.label}
                  onClick={() => insertSyntax(t.syntax)}
                  title={t.title}
                  className="rounded px-2 py-1 font-mono text-xs text-slate-500 hover:bg-slate-200"
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Editor textarea */}
        {!preview ? (
          <textarea
            value={content}
            onChange={(e) => setContent(e.target.value)}
            placeholder={`마크다운으로 작성하세요.\n\n## 오늘 배운 것\n\n- 항목 1\n- 항목 2\n\n\`\`\`ts\nconst hello = "world";\n\`\`\``}
            rows={18}
            className="w-full resize-y bg-white px-5 py-4 font-mono text-sm text-slate-800 placeholder-slate-300 focus:outline-none"
          />
        ) : (
          <div className="min-h-[320px] bg-white px-5 py-4">
            {content ? (
              <MarkdownPreview content={content} />
            ) : (
              <p className="text-slate-400">미리볼 내용이 없습니다.</p>
            )}
          </div>
        )}
      </div>

      {error && (
        <p className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-600">{error}</p>
      )}

      <div className="flex items-center justify-between">
        <p className="text-xs text-slate-400">마크다운(Markdown) 문법을 지원합니다.</p>
        <button
          onClick={handleSubmit}
          disabled={isPending || !title.trim() || !content.trim()}
          className="rounded-xl bg-navy-900 px-8 py-2.5 text-sm font-semibold text-white transition hover:bg-navy-800 disabled:opacity-40"
        >
          {isPending ? "발행 중…" : "발행하기"}
        </button>
      </div>
    </div>
  );
}

// 간단한 마크다운 → HTML 변환 (미리보기 전용)
function MarkdownPreview({ content }: { content: string }) {
  const html = content
    .replace(/^### (.+)$/gm, "<h3 class=\"text-base font-bold mt-4 mb-1\">$1</h3>")
    .replace(/^## (.+)$/gm,  "<h2 class=\"text-lg font-bold mt-5 mb-2\">$1</h2>")
    .replace(/^# (.+)$/gm,   "<h1 class=\"text-xl font-black mt-6 mb-2\">$1</h1>")
    .replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>")
    .replace(/\*(.+?)\*/g,    "<em>$1</em>")
    .replace(/`([^`]+)`/g,    "<code class=\"rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-pink-600\">$1</code>")
    .replace(/^---$/gm,       "<hr class=\"my-4 border-slate-200\" />")
    .replace(/^- (.+)$/gm,    "<li class=\"ml-4 list-disc\">$1</li>")
    .replace(/\n\n/g,         "<br /><br />");

  return (
    <div
      className="prose prose-sm max-w-none text-slate-800"
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}