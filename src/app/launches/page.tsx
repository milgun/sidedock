import { createClient, getUser } from "@/lib/supabase/server";
import Link from "next/link";
import type { ProductWithMaker } from "@/types";
import LaunchesClient from "@/components/launches/LaunchesClient";

export const metadata = {
  title: "오늘의 신규 런칭 — AI 툴·SaaS·사이드 프로젝트",
  description:
    "한국 메이커들이 오늘 새로 런칭한 AI 툴, SaaS, 사이드 프로젝트를 가장 먼저 만나보세요.",
  alternates: { canonical: "/launches" },
};

type Period = "week" | "month" | "year" | "all";

export default async function LaunchesPage(props: {
  searchParams: Promise<{ period?: string }>;
}) {
  const { period: rawPeriod } = await props.searchParams;
  const period = (
    ["week", "month", "year", "all"].includes(rawPeriod ?? "") ? rawPeriod : "all"
  ) as Period;

  const supabase = await createClient();
  const user = await getUser();
  const now = new Date();
  const nowMs = now.getTime();

  let query = supabase
    .from("products")
    .select("*, maker:profiles(id, username, avatar_url, display_name)")
    .eq("source", "launch")
    .eq("status", "published");

  if (period === "week") {
    const weekAgo = new Date(now.getTime() - 7 * 24 * 3_600_000).toISOString();
    query = query.gte("created_at", weekAgo).order("upvote_count", { ascending: false });
  } else if (period === "month") {
    const monthAgo = new Date(now.getTime() - 30 * 24 * 3_600_000).toISOString();
    query = query.gte("created_at", monthAgo).order("upvote_count", { ascending: false });
  } else {
    // all: 역대 인기순 (boost + 댓글)
    query = query
      .order("upvote_count", { ascending: false })
      .order("comment_count", { ascending: false });
  }

  const [{ data: rawProducts }, { data: upvotes }] = await Promise.all([
    query.limit(50),
    user
      ? supabase.from("upvotes").select("product_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { product_id: string }[] }),
  ]);

  const upvotedIds = new Set<string>(
    (upvotes ?? []).map((u: { product_id: string }) => u.product_id),
  );

  type RawProduct = Record<string, unknown>;
  const initialProducts = (rawProducts ?? []).map(
    (p) =>
      ({
        ...p,
        has_upvoted: upvotedIds.has((p as RawProduct).id as string),
      }) as unknown as ProductWithMaker,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-8 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100">🚀 Launches</h1>
        </div>
        <Link
          href="/submit"
          className="flex-shrink-0 rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700"
        >
          + 제품 등록
        </Link>
      </div>

      <LaunchesClient
        initialPeriod={period}
        initialProducts={initialProducts}
        initialNowMs={nowMs}
        userId={user?.id ?? null}
      />
    </div>
  );
}

