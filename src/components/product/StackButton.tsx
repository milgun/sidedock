"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleSave } from "@/lib/actions/save";

interface StackButtonProps {
  productId: string;
  initialHasSaved: boolean;
  userId: string | null;
  variant?: "list" | "grid" | "detail";
}

function StackIcon({ filled, size = 16 }: { filled: boolean; size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M19 21l-7-5-7 5V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
    </svg>
  );
}

export default function StackButton({
  productId,
  initialHasSaved,
  userId,
  variant = "list",
}: StackButtonProps) {
  const [hasSaved, setHasSaved] = useState(initialHasSaved);
  const [isPending, startTransition] = useTransition();
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      router.push("/login");
      return;
    }

    const prev = hasSaved;
    setHasSaved(!prev);

    startTransition(async () => {
      const result = await toggleSave(productId);
      if (!result.success) {
        setHasSaved(prev);
      }
    });
  };

  if (variant === "detail") {
    return (
      <div className="group relative">
        <button
          onClick={handleClick}
          disabled={isPending}
          className={`flex items-center gap-1.5 rounded-xl border px-3 py-2 text-sm font-medium transition ${
            hasSaved
              ? "border-amber-300 bg-amber-50 text-amber-600 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
              : "border-slate-200 bg-white text-slate-500 hover:border-amber-300 hover:text-amber-500 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-400"
          }`}
        >
          <StackIcon filled={hasSaved} size={15} />
          <span>{hasSaved ? "스택됨" : "스택"}</span>
        </button>
        <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2.5 py-1.5 text-xs text-white opacity-0 transition-opacity group-hover:opacity-100">
          내 스택에 추가 — 나중에 찾아볼 제품 모음
          <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
        </div>
      </div>
    );
  }

  // list / grid variant — icon only
  return (
    <div className="group relative">
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`flex items-center justify-center rounded-lg border p-1.5 transition ${
          hasSaved
            ? "border-amber-300 bg-amber-50 text-amber-500 dark:border-amber-500/30 dark:bg-amber-500/15 dark:text-amber-300"
            : "border-transparent text-slate-300 hover:border-amber-200 hover:text-amber-400 dark:text-slate-500"
        }`}
      >
        <StackIcon filled={hasSaved} size={14} />
      </button>
      <div className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1.5 -translate-x-1/2 whitespace-nowrap rounded-lg bg-slate-900 px-2 py-1 text-[11px] text-white opacity-0 transition-opacity group-hover:opacity-100">
        내 스택에 추가 (찜하기)
        <span className="absolute left-1/2 top-full -translate-x-1/2 border-4 border-transparent border-t-slate-900" />
      </div>
    </div>
  );
}
