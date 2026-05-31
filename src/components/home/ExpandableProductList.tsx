"use client";

import { useState } from "react";
import ProductCard from "@/components/product/ProductCard";
import type { ProductWithMaker } from "@/types";

interface ExpandableProductListProps {
  products: ProductWithMaker[];
  initialCount?: number;
  userId: string | null;
  context?: "hot" | "launch-feed" | "launch-rank";
}

export default function ExpandableProductList({
  products,
  initialCount = 10,
  userId,
  context,
}: ExpandableProductListProps) {
  const [expanded, setExpanded] = useState(false);
  const visible = expanded ? products : products.slice(0, initialCount);
  const hasMore = products.length > initialCount;

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

      {hasMore && !expanded && (
        <button
          onClick={() => setExpanded(true)}
          className="mt-3 w-full rounded-xl border border-slate-200 py-3 text-sm font-medium text-slate-500 transition hover:border-blue-300 hover:text-blue-600"
        >
          {products.length - initialCount}개 더 보기
        </button>
      )}
    </div>
  );
}
