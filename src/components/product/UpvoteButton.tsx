"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toggleUpvote } from "@/lib/actions/upvote";

interface UpvoteButtonProps {
  productId: string;
  initialCount: number;
  initialHasUpvoted: boolean;
  userId: string | null;
  variant?: "list" | "grid" | "detail";
}

export default function UpvoteButton({
  productId,
  initialCount,
  initialHasUpvoted,
  userId,
  variant = "list",
}: UpvoteButtonProps) {
  const [count, setCount] = useState(initialCount);
  const [hasUpvoted, setHasUpvoted] = useState(initialHasUpvoted);
  const [isPending, startTransition] = useTransition();
  const [rockets, setRockets] = useState<number[]>([]);
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!userId) {
      router.push("/login");
      return;
    }

    const prevUpvoted = hasUpvoted;
    const prevCount = count;

    if (!prevUpvoted) {
      const key = Date.now();
      setRockets((prev) => [...prev, key]);
      setTimeout(() => setRockets((prev) => prev.filter((k) => k !== key)), 800);
    }

    setHasUpvoted(!prevUpvoted);
    setCount(prevUpvoted ? count - 1 : count + 1);

    startTransition(async () => {
      const result = await toggleUpvote(productId);
      if (!result.success) {
        setHasUpvoted(prevUpvoted);
        setCount(prevCount);
      }
    });
  };

  const active = "bg-blue-600 border-blue-600 text-white";
  const inactive =
    "border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 bg-white";

  const rocketParticles = rockets.map((key) => (
    <span
      key={key}
      className="pointer-events-none absolute bottom-full mb-0.5 animate-rocket-fly text-base"
      style={{ left: "50%" }}
    >
      🚀
    </span>
  ));

  if (variant === "grid") {
    return (
      <div className="relative">
        {rocketParticles}
        <button
          onClick={handleClick}
          disabled={isPending}
          className={`flex cursor-pointer items-center gap-1 rounded-lg border px-2 py-0.5 text-xs font-semibold transition ${
            hasUpvoted ? active : inactive
          }`}
        >
          <span>🚀</span>
          {count}
        </button>
      </div>
    );
  }

  if (variant === "detail") {
    return (
      <div className="relative">
        {rocketParticles}
        <button
          onClick={handleClick}
          disabled={isPending}
          className={`flex cursor-pointer items-center gap-2 rounded-xl border-2 px-5 py-2.5 text-sm font-bold transition ${
            hasUpvoted ? active : inactive
          }`}
        >
          <span>{hasUpvoted ? "🚀 Boosted!" : "🚀 Boost"}</span>
          <span
            className={`rounded-full px-2 py-0.5 text-xs ${
              hasUpvoted ? "bg-white/20" : "bg-slate-100"
            }`}
          >
            {count}
          </span>
        </button>
      </div>
    );
  }

  return (
    <div className="relative">
      {rocketParticles}
      <button
        onClick={handleClick}
        disabled={isPending}
        className={`flex cursor-pointer items-center gap-1 rounded-xl border px-2.5 py-1.5 text-xs font-semibold transition ${
          hasUpvoted ? active : inactive
        }`}
      >
        <span>🚀</span>
        <span>{count}</span>
      </button>
    </div>
  );
}
