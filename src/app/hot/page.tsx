import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import type { ProductWithMaker } from "@/types";
import ProductCard, { CATEGORY_LABELS } from "@/components/product/ProductCard";
import DragScroll from "@/components/ui/DragScroll";

const CATEGORIES = [
  { value: "",                   label: "전체",          icon: "🔥" },
  { value: "ai-tool",           label: "AI 툴",          icon: "🤖" },
  { value: "saas",              label: "SaaS",             icon: "☁️" },
  { value: "dev-tool",          label: "개발 툴",         icon: "🛠️" },
  { value: "productivity",      label: "생산성",          icon: "⚡" },
  { value: "design",            label: "디자인",          icon: "🎨" },
  { value: "marketing",         label: "마케팅",          icon: "📈" },
  { value: "mobile-app",        label: "모바일 앱",      icon: "📱" },
  { value: "browser-extension", label: "브라우저 확장",    icon: "🧩" },
  { value: "desktop-app",       label: "데스크탑 앱",    icon: "🖥️" },
  { value: "game",              label: "게임",            icon: "🎮" },
  { value: "api",               label: "API / 백엔드",   icon: "⚙️" },
  { value: "education",         label: "교육",            icon: "📚" },
  { value: "finance",           label: "금융 / 핑테크",  icon: "💰" },
  { value: "health",            label: "헬스",            icon: "❤️" },
  { value: "social",            label: "소셜",            icon: "💬" },
  { value: "ecommerce",         label: "이커머스",        icon: "🛒" },
  { value: "media",             label: "미디어",           icon: "📺" },
  { value: "other",             label: "기타",            icon: "📦" },
];

export default async function HotProductsPage(props: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await props.searchParams;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let query = supabase
    .from("products")
    .select("*, maker:profiles(id, username, avatar_url, display_name)")
    .eq("source", "curated")
    .eq("status", "published")
    .order("upvote_count", { ascending: false })
    .limit(50);

  if (category) query = query.eq("category", category);

  const [{ data: rawProducts }, { data: upvotes }] = await Promise.all([
    query,
    user
      ? supabase.from("upvotes").select("product_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { product_id: string }[] }),
  ]);

  const upvotedIds = new Set<string>(
    (upvotes ?? []).map((u: { product_id: string }) => u.product_id)
  );

  type RawProduct = Record<string, unknown>;
  const products = (rawProducts ?? []).map(
    (p) => ({ ...p, has_upvoted: upvotedIds.has((p as RawProduct).id as string) } as unknown as ProductWithMaker)
  );
  const userId = user?.id ?? null;
  const catLabel = category ? (CATEGORY_LABELS[category] ?? category) : null;

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">🔥 Hot Products</h1>
        <p className="mt-1 text-slate-500">
          가장 유용하고 인기 있는 제품들을 만나보세요.
        </p>
      </div>

      {/* Category filter — drag scrollable */}
      <DragScroll
        className="-mx-4 mb-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        innerClassName="flex w-max gap-2 px-4 pb-1"
      >
        {CATEGORIES.map(({ value, label, icon }) => {
          const isActive = (category ?? "") === value;
          const href = value ? `/hot?category=${value}` : "/hot";
          return (
            <Link
              key={value}
              href={href}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-orange-500 text-white shadow-sm"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200"
              }`}
            >
              <span className="text-xs leading-none">{icon}</span>
              <span>{label}</span>
            </Link>
          );
        })}
      </DragScroll>

      {catLabel && (
        <p className="mb-4 text-sm text-slate-500">
          <span className="font-semibold text-slate-800">{catLabel}</span>
          {" "}카테고리 &middot; {products.length}개
        </p>
      )}

      {products.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white">
          {products.map((p, i) => (
            <ProductCard
              key={p.id}
              product={p}
              rank={i + 1}
              variant="list"
              userId={userId}
              context="hot"
            />
          ))}
        </div>
      ) : (
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center">
          <p className="text-3xl">🔥</p>
          <p className="mt-3 font-semibold text-slate-700">
            {catLabel ? `${catLabel} 카테고리에 등록된 제품이 없습니다` : "아직 등록된 제품이 없습니다"}
          </p>
        </div>
      )}
    </div>
  );
}