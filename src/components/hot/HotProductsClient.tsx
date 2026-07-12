"use client";

import { useState, useCallback } from "react";
import type { ProductWithMaker } from "@/types";
import ProductCard, { CATEGORY_LABELS } from "@/components/product/ProductCard";
import DragScroll from "@/components/ui/DragScroll";

const CATEGORIES = [
  { value: "",                   label: "전체",          icon: "🔥" },
  { value: "ai-tool",           label: "AI 툴",          icon: "🤖" },
  { value: "saas",              label: "SaaS",            icon: "☁️" },
  { value: "dev-tool",          label: "개발 툴",         icon: "🛠️" },
  { value: "productivity",      label: "생산성",          icon: "⚡" },
  { value: "design",            label: "디자인",          icon: "🎨" },
  { value: "marketing",         label: "마케팅",          icon: "📈" },
  { value: "mobile-app",        label: "모바일 앱",       icon: "📱" },
  { value: "browser-extension", label: "브라우저 확장",   icon: "🧩" },
  { value: "desktop-app",       label: "데스크탑 앱",     icon: "🖥️" },
  { value: "game",              label: "게임",            icon: "🎮" },
  { value: "api",               label: "API / 백엔드",    icon: "⚙️" },
  { value: "education",         label: "교육",            icon: "📚" },
  { value: "finance",           label: "금융 / 핀테크",   icon: "💰" },
  { value: "health",            label: "헬스",            icon: "❤️" },
  { value: "social",            label: "소셜",            icon: "💬" },
  { value: "ecommerce",         label: "이커머스",        icon: "🛒" },
  { value: "media",             label: "미디어",          icon: "📺" },
  { value: "other",             label: "기타",            icon: "📦" },
];

interface HotProductsClientProps {
  initialCategory: string;
  initialProducts: ProductWithMaker[];
  userId: string | null;
}

export default function HotProductsClient({
  initialCategory,
  initialProducts,
  userId: initialUserId,
}: HotProductsClientProps) {
  const [category, setCategory] = useState(initialCategory);
  const [products, setProducts] = useState(initialProducts);
  const [userId, setUserId] = useState(initialUserId);
  const [loading, setLoading] = useState(false);

  const fetchProducts = useCallback(async (cat: string) => {
    setLoading(true);
    try {
      const qs = cat ? `?category=${encodeURIComponent(cat)}` : "";
      const res = await fetch(`/api/products/hot${qs}`);
      if (res.ok) {
        const data = await res.json();
        setProducts(data.products ?? []);
        setUserId(data.userId);
      }
    } finally {
      setLoading(false);
    }
    window.history.replaceState(null, "", cat ? `/hot?category=${encodeURIComponent(cat)}` : "/hot");
  }, []);

  const handleCategoryChange = (cat: string) => {
    setCategory(cat);
    fetchProducts(cat);
  };

  const catLabel = category ? (CATEGORY_LABELS[category] ?? category) : null;

  return (
    <>
      {/* Category filter — drag scrollable */}
      <DragScroll
        className="-mx-4 mb-6 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        innerClassName="flex w-max gap-2 px-4 pb-1"
      >
        {CATEGORIES.map(({ value, label, icon }) => {
          const isActive = category === value;
          return (
            <button
              key={value}
              onClick={() => handleCategoryChange(value)}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                isActive
                  ? "bg-orange-500 text-white shadow-sm dark:bg-orange-500/20 dark:text-orange-300 dark:shadow-none"
                  : "bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-navy-800 dark:text-slate-300 dark:hover:bg-navy-700"
              }`}
            >
              <span className="text-xs leading-none">{icon}</span>
              <span>{label}</span>
            </button>
          );
        })}
      </DragScroll>

      {catLabel && (
        <p className="mb-4 text-sm text-slate-500 dark:text-slate-400">
          <span className="font-semibold text-slate-800 dark:text-slate-200">{catLabel}</span>
          {" "}카테고리 &middot; {products.length}개
        </p>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-slate-200 border-t-orange-500" />
        </div>
      ) : products.length > 0 ? (
        <div className="overflow-hidden rounded-2xl border border-slate-100 bg-white dark:border-navy-800 dark:bg-navy-900">
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
        <div className="rounded-2xl border border-dashed border-slate-200 py-16 text-center dark:border-navy-800">
          <p className="text-3xl">🔥</p>
          <p className="mt-3 font-semibold text-slate-700 dark:text-slate-300">
            {catLabel
              ? `${catLabel} 카테고리에 등록된 제품이 없습니다`
              : "아직 등록된 제품이 없습니다"}
          </p>
        </div>
      )}
    </>
  );
}
