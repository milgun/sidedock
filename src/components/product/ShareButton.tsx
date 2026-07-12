"use client";

import { useState } from "react";

interface ShareButtonProps {
  title: string;
  /** page path, e.g. "/products/abc123" — full URL is computed client-side */
  path: string;
  variant?: "detail" | "icon";
}

function ShareIcon({ size = 16 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="18" cy="5" r="3" />
      <circle cx="6" cy="12" r="3" />
      <circle cx="18" cy="19" r="3" />
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" />
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" />
    </svg>
  );
}

export default function ShareButton({ title, path, variant = "detail" }: ShareButtonProps) {
  const [copied, setCopied] = useState(false);

  const handleShare = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    const fullUrl =
      typeof window !== "undefined"
        ? `${window.location.origin}${path}`
        : path;

    // 한글 슬러그를 사람이 읽기 좋은 형태로 디코딩 (Velog 방식)
    // 디코딩된 URL도 붙여넣으면 브라우저가 자동 인코딩하여 정상 동작합니다.
    let prettyUrl = fullUrl;
    try {
      prettyUrl = decodeURI(fullUrl);
    } catch {
      // malformed URI — 원본 유지
    }

    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({ title, url: prettyUrl });
      } catch {
        // user cancelled — do nothing
      }
      return;
    }

    // Fallback: clipboard copy
    try {
      await navigator.clipboard.writeText(prettyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // ignore
    }
  };

  if (variant === "icon") {
    return (
      <div className="group relative">
        <button
          onClick={handleShare}
          className="flex items-center justify-center rounded-lg border border-transparent p-1.5 text-slate-300 transition hover:border-slate-200 hover:text-slate-500"
        >
          <ShareIcon size={14} />
        </button>
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
          {copied ? "링크 복사됨 ✓" : "공유하기"}
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      </div>
    );
  }

  return (
    <div className="group relative">
      <button
        onClick={handleShare}
        className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
          copied
            ? "border-green-300 bg-green-50 text-green-600 dark:border-green-500/30 dark:bg-green-500/15 dark:text-green-300"
            : "border-slate-200 bg-white text-slate-500 hover:border-slate-300 hover:text-slate-700 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-400 dark:hover:text-slate-200"
        }`}
      >
        <ShareIcon size={15} />
        <span>{copied ? "복사됨 ✓" : "공유"}</span>
      </button>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
        링크 복사 또는 네이티브 공유
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
}
