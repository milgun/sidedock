import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { ProductWithMaker } from "@/types";
import ProductCard from "@/components/product/ProductCard";

type Period = "today" | "week" | "month";

const PERIOD_TABS: { value: Period; label: string; icon: string; desc: string }[] = [
  { value: "today", label: "오늘",    icon: "✨", desc: "오늘 새롭게 등록된 제품들" },
  { value: "week",  label: "이번 주", icon: "📈", desc: "이번 주 가장 많은 주목을 받은 제품들" },
  { value: "month", label: "이번 달", icon: "🏆", desc: "이번 달 가장 인기 있었던 제품들" },
];

export default async function LaunchesPage(props: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await props.searchParams;
  const period = (
    ["today", "week", "month"].includes(rawPeriod ?? "") ? rawPeriod : "today"
  ) as Period;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const now = new Date();

  let query = supabase
    .from("products")
    .select("*, maker:profiles(*)")
    .eq("source", "launch")
    .eq("status", "published");

  if (period === "today") {
    const todayStart = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).toISOString();
    query = query
      .gte("created_at", todayStart)
      .order("created_at", { ascending: false });
  } else if (period === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3_600_000).toISOString();
    query = query
      .gte("created_at", weekAgo)
      .order("upvote_count", { ascending: false });
  } else {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 3_600_000).toISOString();
    query = query
      .gte("created_at", monthAgo)
      .order("upvote_count", { ascending: false });
  }

  const { data: rawProducts } = await query.limit(50);

  let upvotedIds = new Set<string>();
  if (user) {
    const { data: upvotes } = await supabase
      .from("upvotes")
      .select("product_id")
      .eq("user_id", user.id);
    upvotedIds = new Set(
      (upvotes ?? []).map((u: { product_id: string }) => u.product_id),
    );
  }

  type RawProduct = Record<string, unknown>;
  const products = (rawProducts ?? []).map(
    (p) =>
      ({
        ...p,
        has_upvoted: upvotedIds.has((p as RawProduct).id as string),
      }) as unknown as ProductWithMaker,
  );
  const userId = user?.id ?? null;
  const nowMs = Date.now();

  const currentTab = PERIOD_TABS.find((t) => t.value === period)!;
  const isRanked = period !== "today";

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900">🚀 Launches</h1>
          <p className="mt-1 text-slate-500">{currentTab.desc}</p>
        </div>
        <Link
          href="/submit"
          className="flex-shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + 제품 등록
        </Link>
      </div>

      {/* Period Tabs */}
      <div className="mb-6 flex gap-1 rounded-2xl border border-slate-100 bg-slate-50 p-1">
        {PERIOD_TABS.map(({ value, label, icon }) => {
          const isActive = period === value;
          return (
            <Link
              key={value}
              href={`/launches?period=${value}`}
              className={`flex flex-1 items-center justify-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? "bg-white text-slate-900 shadow-sm"
                  : "text-slate-400 hover:text-slate-700"
              }`}
            >
              <span>{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </div>

      {isRanked && products.length > 0 && (
        <p className="mb-3 text-xs text-slate-400">
          업보트 기준 상위 {products.length}개
        </p>
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
    </div>
  );
}

function EmptyState({ period }: { period: Period }) {
  const config: Record<Period, { icon: string; message: string }> = {
    today: { icon: "🚀", message: "오늘은 아직 등록된 제품이 없습니다." },
    week:  { icon: "📈", message: "이번 주 런치된 제품이 없습니다." },
    month: { icon: "🏆", message: "이번 달 런치된 제품이 없습니다." },
  };
  const { icon, message } = config[period];

  return (
    <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
      <p className="text-3xl">{icon}</p>
      <p className="mt-3 font-semibold text-slate-700">{message}</p>
      <p className="mt-1 text-sm text-slate-400">
        당신의 제품이 첫 번째가 될 수 있습니다.
      </p>
      <Link
        href="/submit"
        className="mt-4 inline-block rounded-xl bg-blue-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-blue-700"
      >
        지금 등록하기 →
      </Link>
    </div>
  );
}
