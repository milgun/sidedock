"use client";

import { useState, useCallback } from "react";
import Link from "next/link";
import type { ProductWithMaker } from "@/types";
import ProductCard from "@/components/product/ProductCard";

type Period = "today" | "week" | "month" | "all";

const PERIOD_TABS: { value: Period; label: string; icon: string; desc: string }[] = [
  { value: "today", label: "오늘",    icon: "✨", desc: "오늘 새롭게 등록된 제품들" },
  { value: "week",  label: "이번 주", icon: "📈", desc: "이번 주 가장 많은 주목을 받은 제품들" },
  { value: "month", label: "이번 달", icon: "🏆", desc: "이번 달 가장 인기 있었던 제품들" },
  { value: "all",   label: "역대 인기", icon: "🔥", desc: "Boost · 댓글 기준 역대 인기 런치" },
];

interface LaunchesClientProps {
  initialPeriod: Period;
  initialProducts: ProductWithMaker[];
  initialNowMs: number;
  userId: string | null;
}

export default function LaunchesClient({
  initialPeriod,
  initialProducts,
  initialNowMs,
  userId: initialUserId,
}: LaunchesClientProps) {
  const [period, setPeriod] = useState(initialPeriod);
  const [products, setProducts] = useState(initialProducts);
  const [nowMs, setNowMs] = useState(initialNowMs);
  const [userId, setUserId] = useState(initialUserId);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async (p: Period) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/launches?period=${p}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
        setNowMs(data.nowMs ?? Date.now());
        setUserId(data.userId);
      }
    } finally {
      setLoading(false);
    }
    window.history.replaceState(null, "", `/launches?period=${p}`);
  }, []);

  const handlePeriodChange = (p: Period) => {
    setPeriod(p);
    fetchProducts(p);
  };

  const currentTab = PERIOD_TABS.find((t) => t.value === period)!;
  const isRanked = period !== "today";

  return (
    <>
      {/* Period Tabs */}
      <div className="mb-6 flex gap-1 rounded-2xl border border-slate-100 bg-slate-50 p-1">
        {PERIOD_TABS.map(({ value, label, icon }) => {
          const isActive = period === value;
          return (
            <button
              key={value}
              onClick={() => handlePeriodChange(value)}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </div>

      <p className="mb-6 text-slate-500">{currentTab.desc}</p>

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-blue-500" />
        </div>
      ) : (
        <>
          {isRanked && products.length > 0 && (
            <p className="mb-3 text-xs text-slate-400">업보트 기준 상위 {products.length}개</p>
          )}

          {products.length > 0 ? (
            <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
              {products.map((p, i) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  rank={isRanked ? i + 1 : undefined}
                  variant="list"
                  userId={userId}
                  context={isRanked ? "launch-rank" : "launch-feed"}
                  nowMs={nowMs}
                />
              ))}
            </div>
          ) : (
            <EmptyState period={period} />
          )}
        </>
      )}
    </>
  );
}

function EmptyState({ period }: { period: Period }) {
  const config: Record<Period, { icon: string; message: string }> = {
    today: { icon: "🚀", message: "오늘은 아직 등록된 제품이 없습니다." },
    week:  { icon: "📈", message: "이번 주 런치된 제품이 없습니다." },
    month: { icon: "🏆", message: "이번 달 런치된 제품이 없습니다." },
    all:   { icon: "🔥", message: "아직 등록된 런치 제품이 없습니다." },
  };
  const { icon, message } = config[period];

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
      <p className="text-3xl">{icon}</p>
      <p className="mt-3 font-semibold text-slate-700">{message}</p>
      <p className="mt-1 text-sm text-slate-400">당신의 제품이 첫 번째가 될 수 있습니다.</p>
      <Link
        href="/submit"
        className="mt-4 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        지금 등록하기 →
      </Link>
    </div>
  );
}
