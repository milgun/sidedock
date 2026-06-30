"use client";

import { useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import type { ProductWithMaker } from "@/types";

interface ExpandableProductListProps {
  products: ProductWithMaker[];
  initialCount?: number;
  pageSize?: number;
  userId: string | null;
  context?: "hot" | "launch-feed" | "launch-rank";
  variant?: "list" | "grid";
}

export default function ExpandableProductList({
  products,
  initialCount = 5,
  pageSize = 10,
  userId,
  context,
  variant = "list",
}: ExpandableProductListProps) {
  const [visibleCount, setVisibleCount] = useState(initialCount);
  const visible = products.slice(0, visibleCount);
  const remaining = products.length - visibleCount;
  const hasMore = remaining > 0;

  const loadMore = () =>
    setVisibleCount((prev) => Math.min(prev + pageSize, products.length));

  if (variant === "grid") {
    return (
      <div>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
          {visible.map((p) => (
            <ProductCard
              key={p.id}
              product={p}
              variant="grid"
              userId={userId}
            />
          ))}
        </div>
        {hasMore && (
          <button
            onClick={loadMore}
            className="mt-4 w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
          >
            {Math.min(pageSize, remaining)}개 더 보기
          </button>
        )}
      </div>
    );
  }

  return (
    <div>
      <div className="rounded-2xl border border-slate-100 bg-white">
        {visible.map((p, i) => (
          <ProductCard
            key={p.id}
            product={p}
            rank={i + 1}
            variant="list"
            userId={userId}
            context={context}
          />
        ))}
      </div>
      {hasMore && (
        <button
          onClick={loadMore}
          className="mt-3 w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
        >
          {Math.min(pageSize, remaining)}개 더 보기
        </button>
      )}
    </div>
  );
}
