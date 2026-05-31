"use client";

import { useState } from "react";
import { resubmitProduct } from "@/lib/actions/product";

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:          { label: "작성 중",    color: "bg-slate-100 text-slate-500" },
  pending_review: { label: "승인 대기",  color: "bg-amber-100 text-amber-700" },
  published:      { label: "포스트됨",   color: "bg-green-100 text-green-700" },
  rejected:       { label: "반려됨",     color: "bg-red-100 text-red-600" },
};

const STATUS_FILTERS = [
  { value: "all",            label: "전체" },
  { value: "draft",          label: "작성 중" },
  { value: "pending_review", label: "승인 대기" },
  { value: "rejected",       label: "반려됨" },
  { value: "published",      label: "포스트됨" },
];

type Product = {
  id: string;
  name: string;
  tagline: string;
  thumbnail_url: string | null;
  status: string;
  rejection_reason: string | null;
  created_at: string;
  upvote_count: number;
};

export default function ProfileProducts({
  products,
  isOwn,
}: {
  products: Product[];
  isOwn: boolean;
}) {
  const [filter, setFilter] = useState("all");
  const [resubmitting, setResubmitting] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const filtered = products.filter(
    (p) => filter === "all" || p.status === filter
  );

  const handleResubmit = async (productId: string) => {
    setResubmitting(productId);
    const result = await resubmitProduct(productId);
    setResubmitting(null);
    if (result.error) {
      setErrors((e) => ({ ...e, [productId]: result.error! }));
    } else {
      // optimistic: remove from view (page will refetch on next nav)
      window.location.reload();
    }
  };

  return (
    <div>
      {isOwn && (
        <div className="mb-5 flex items-center justify-between">
          {/* Status filter */}
          <div className="flex gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filter === f.value
                    ? "bg-slate-900 text-white"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
          <a
            href="/submit"
            className="rounded-xl bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
          >
            + 새 제품 등록
          </a>
        </div>
      )}

      {filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-200 py-14 text-center">
          <p className="text-slate-400">제품이 없습니다.</p>
          {isOwn && filter === "all" && (
            <a
              href="/submit"
              className="mt-2 inline-block text-xs text-blue-600 hover:underline"
            >
              첫 번째 제품 등록하기 →
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => {
            const meta = STATUS_META[product.status] ?? STATUS_META.draft;
            return (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border border-slate-100 bg-white"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100">
                    {product.thumbnail_url ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={product.thumbnail_url}
                        alt={product.name}
                        className="h-full w-full object-cover"
                      />
                    ) : (
                      <span className="text-2xl font-black text-slate-300">
                        {product.name[0]?.toUpperCase()}
                      </span>
                    )}
                  </div>

                  {/* Info */}
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <a
                        href={`/products/${product.id}`}
                        className="font-semibold text-slate-900 hover:text-blue-600"
                      >
                        {product.name}
                      </a>
                      <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}>
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-400">{product.tagline}</p>
                    <p className="mt-1 text-xs text-slate-300">
                      {new Date(product.created_at).toLocaleDateString("ko-KR")} · 업보트 {product.upvote_count}
                    </p>
                  </div>

                  {/* Actions */}
                  {isOwn && (
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {(product.status === "draft" || product.status === "rejected") && (
                        <a
                          href={`/submit?edit=${product.id}`}
                          className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-400 hover:text-blue-600"
                        >
                          수정
                        </a>
                      )}
                      {product.status === "rejected" && (
                        <button
                          onClick={() => handleResubmit(product.id)}
                          disabled={resubmitting === product.id}
                          className="rounded-xl bg-blue-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-blue-700 disabled:opacity-50"
                        >
                          {resubmitting === product.id ? "요청 중..." : "재제출"}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Rejection reason */}
                {isOwn && product.status === "rejected" && product.rejection_reason && (
                  <div className="border-t border-red-50 bg-red-50 px-4 py-3">
                    <p className="text-xs font-semibold text-red-600">반려 사유</p>
                    <p className="mt-0.5 text-sm text-red-500">{product.rejection_reason}</p>
                  </div>
                )}

                {errors[product.id] && (
                  <div className="border-t border-red-50 bg-red-50 px-4 py-2">
                    <p className="text-xs text-red-500">{errors[product.id]}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
