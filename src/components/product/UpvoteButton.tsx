"use client";

import { useState, useTransition, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { toggleUpvote } from "@/lib/actions/upvote";
import { createClient } from "@/lib/supabase/client";

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
  // 본인 낙관적 업데이트와 실시간 이벤트 중복 방지용
  const pendingRef = useRef(false);
  const supabase = useMemo(() => createClient(), []);

  // 상세 페이지에서만 다른 유저의 upvote를 실시간 반영
  useEffect(() => {
    if (variant !== "detail") return;

    const channel = supabase
      .channel(`product-upvote-count:${productId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "products",
          filter: `id=eq.${productId}`,
        },
        (payload) => {
          if (pendingRef.current) return;
          const newCount = (payload.new as { upvote_count: number }).upvote_count;
          const prevCount = (payload.old as { upvote_count?: number }).upvote_count;
          if (typeof newCount === "number") {
            // 카운트가 올라갔을 때만 로켓 애니메이션
            if (prevCount !== undefined && newCount > prevCount) {
              const key = Date.now();
              setRockets((prev) => [...prev, key]);
              setTimeout(() => setRockets((prev) => prev.filter((k) => k !== key)), 800);
            }
            setCount(newCount);
          }
        }
      )
      .subscribe();

    return () => { void supabase.removeChannel(channel); };
  }, [productId, variant, supabase]);

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

    pendingRef.current = true;
    startTransition(async () => {
      const result = await toggleUpvote(productId);
      if (!result.success) {
        setHasUpvoted(prevUpvoted);
        setCount(prevCount);
      }
      pendingRef.current = false;
    });
  };

  const active = "bg-blue-600 border-blue-600 text-white";
  const inactive =
    "border-slate-200 text-slate-500 hover:border-blue-400 hover:text-blue-600 bg-white dark:border-navy-700 dark:bg-navy-800 dark:text-slate-400";

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
