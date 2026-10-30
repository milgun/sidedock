import { createClient, getUser } from "@/lib/supabase/server";
import Link from "next/link";
import type { ProductWithMaker } from "@/types";
import LaunchesClient from "@/components/launches/LaunchesClient";
import { getLaunchesFirstPage } from "@/lib/public-data";

export const metadata = {
  title: "최근 출시·업데이트 — AI 툴·SaaS·사이드 프로젝트",
  description:
    "한국 메이커들이 최근 출시하거나 업데이트한 AI 툴, SaaS, 사이드 프로젝트를 만나보세요.",
  alternates: { canonical: "/launches" },
};

type Period = "week" | "month" | "year" | "all";
type Sort = "popular" | "latest";

const PAGE_SIZE = 10;

export default async function LaunchesPage(props: {
  searchParams: Promise<{ period?: string; sort?: string }>;
}) {
  const { period: rawPeriod, sort: rawSort } = await props.searchParams;
  const period = (
    ["week", "month", "year", "all"].includes(rawPeriod ?? "") ? rawPeriod : "week"
  ) as Period;
  const sort = (rawSort === "latest" ? "latest" : "popular") as Sort;

  const user = await getUser();

  const [{ products: rawProducts, nowMs }, { data: upvotes }] = await Promise.all([
    getLaunchesFirstPage(period, sort, PAGE_SIZE),
    user
      ? (await createClient()).from("upvotes").select("product_id").eq("user_id", user.id)
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
        initialSort={sort}
        initialProducts={initialProducts}
        initialHasMore={initialProducts.length === PAGE_SIZE}
        initialNowMs={nowMs}
        userId={user?.id ?? null}
      />
    </div>
  );
}
