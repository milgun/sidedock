import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { ProductWithMaker } from "@/types";
import ProductCard, { CATEGORY_LABELS } from "@/components/product/ProductCard";
import ExpandableProductList from "@/components/home/ExpandableProductList";

const CATEGORIES = [
  { value: "",             label: "전체" },
  { value: "ai-tool",     label: "AI 툴" },
  { value: "saas",        label: "SaaS" },
  { value: "dev-tool",    label: "개발 툴" },
  { value: "productivity",label: "생산성" },
  { value: "design",      label: "디자인" },
  { value: "marketing",   label: "마케팅" },
  { value: "other",       label: "기타" },
];

export default async function ProductsPage(props: {
  searchParams: Promise<{
    category?: string;
    sort?: string;
    q?: string;
  }>;
}) {
  const { category, sort = "top", q } = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Build query
  let query = supabase.from("products").select("*, maker:profiles(*)");

  if (category) query = query.eq("category", category);

  if (q) {
    query = query.textSearch("search_vector", q, { type: "websearch" });
  }

  if (sort === "new") {
    query = query.order("created_at", { ascending: false });
  } else {
    query = query.order("upvote_count", { ascending: false });
  }

  const { data: rawProducts } = await query.limit(50);

  // Upvotes
  let upvotedIds = new Set<string>();
  if (user) {
    const { data: upvotes } = await supabase
      .from("upvotes")
      .select("product_id")
      .eq("user_id", user.id);
    upvotedIds = new Set(
      (upvotes ?? []).map((u: { product_id: string }) => u.product_id)
    );
  }

  type RawProduct = Record<string, unknown>;
  const products = (rawProducts ?? []).map(
    (p) => ({ ...p, has_upvoted: upvotedIds.has((p as RawProduct).id as string) } as unknown as ProductWithMaker)
  );

  const userId = user?.id ?? null;
  const catLabel = category ? (CATEGORY_LABELS[category] ?? category) : "전체";
  const title = q ? `"${q}" 검색 결과` : catLabel;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-black text-slate-900">{title}</h1>
        <span className="text-sm text-slate-400">{products.length}개</span>
      </div>

      {/* Category filter tabs */}
      {!q && (
        <div className="mb-6 flex flex-wrap gap-2">
          {CATEGORIES.map(({ value, label }) => {
            const isActive = (category ?? "") === value;
            const href = value
              ? `/products?category=${value}${sort !== "top" ? `&sort=${sort}` : ""}`
              : `/products${sort !== "top" ? `?sort=${sort}` : ""}`;
            return (
              <Link
                key={value}
                href={href}
                className={`rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  isActive
                    ? "bg-navy-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {label}
              </Link>
            );
          })}
        </div>
      )}

      {/* Sort tabs */}
      <div className="mb-5 flex items-center gap-1 border-b border-slate-100 pb-4">
        {[
          { value: "top",  label: "인기순" },
          { value: "new",  label: "최신순" },
        ].map(({ value, label }) => {
          const isActive = sort === value;
          const href = `/products?${new URLSearchParams({
            ...(category ? { category } : {}),
            ...(q ? { q } : {}),
            sort: value,
          }).toString()}`;
          return (
            <Link
              key={value}
              href={href}
              className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-blue-600 text-white"
                  : "text-slate-500 hover:text-slate-900"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </div>

      {/* Product List */}
      {products.length > 0 ? (
        <ExpandableProductList
          products={products}
          initialCount={20}
          userId={userId}
        />
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <p className="text-slate-400">
            {q
              ? `"${q}"에 대한 결과가 없습니다.`
              : "아직 등록된 제품이 없습니다."}
          </p>
          <Link
            href="/submit"
            className="mt-3 inline-block font-mono text-xs text-blue-600 hover:underline"
          >
            첫 번째 제품 등록하기 →
          </Link>
        </div>
      )}
    </div>
  );
}
