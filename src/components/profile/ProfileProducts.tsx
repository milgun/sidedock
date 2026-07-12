"use client";

import { useState } from "react";
import Link from "next/link";
import { resubmitProduct, deleteMyProduct, deleteAdminProduct } from "@/lib/actions/product";

const STATUS_META: Record<string, { label: string; color: string }> = {
  draft:          { label: "작성 중",    color: "bg-slate-100 text-slate-500 dark:bg-navy-800 dark:text-slate-300" },
  pending_review: { label: "승인 대기",  color: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300" },
  published:      { label: "포스트됨",   color: "bg-green-100 text-green-700 dark:bg-green-500/15 dark:text-green-300" },
  rejected:       { label: "반려됨",     color: "bg-red-100 text-red-600 dark:bg-red-500/15 dark:text-red-300" },
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
  slug?: string;
  name: string;
  tagline: string;
  thumbnail_url: string | null;
  status: string;
  source?: string;
  rejection_reason: string | null;
  created_at: string;
  upvote_count: number;
};

export default function ProfileProducts({
  products,
  isOwn,
  isAdmin = false,
}: {
  products: Product[];
  isOwn: boolean;
  isAdmin?: boolean;
}) {
  const [filter, setFilter] = useState("all");
  const [resubmitting, setResubmitting] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<Product | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [productList, setProductList] = useState(products);

  const filtered = productList.filter(
    (p) => filter === "all" || p.status === filter
  );

  const handleResubmit = async (productId: string) => {
    setResubmitting(productId);
    const result = await resubmitProduct(productId);
    setResubmitting(null);
    if (result.error) {
      setErrors((e) => ({ ...e, [productId]: result.error! }));
    } else {
      setProductList((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, status: "pending_review", rejection_reason: null }
            : p
        )
      );
    }
  };

  const handleDeleteConfirm = async () => {
    if (!confirmDelete) return;
    const productId = confirmDelete.id;
    setDeleting(productId);
    setConfirmDelete(null);
    const isCuratedProduct = confirmDelete.source === "curated";
    const result = isCuratedProduct
      ? await deleteAdminProduct(productId)
      : await deleteMyProduct(productId);
    setDeleting(null);
    if (result.error) {
      setErrors((e) => ({ ...e, [productId]: result.error! }));
    } else {
      setProductList((prev) => prev.filter((p) => p.id !== productId));
    }
  };

  return (
    <div>
      {/* 삭제 확인 모달 */}
      {confirmDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-navy-900 p-6 shadow-xl">
            <h3 className="mb-1 text-base font-bold text-slate-900 dark:text-slate-100">제품 삭제</h3>
            <p className="mb-1 text-sm text-slate-600 dark:text-slate-300">
              <span className="font-semibold">{confirmDelete.name}</span>을(를) 삭제하시겠습니까?
            </p>
            <p className="mb-5 text-xs text-red-500">이 작업은 되돌릴 수 없습니다.</p>
            <div className="flex gap-2">
              <button
                onClick={() => setConfirmDelete(null)}
                className="flex-1 rounded-xl border border-slate-200 dark:border-navy-800 py-2 text-sm font-medium text-slate-600 dark:text-slate-300 transition hover:bg-slate-50 dark:hover:bg-navy-800"
              >
                취소
              </button>
              <button
                onClick={handleDeleteConfirm}
                className="flex-1 rounded-xl bg-red-500 py-2 text-sm font-semibold text-white transition hover:bg-red-600"
              >
                삭제
              </button>
            </div>
          </div>
        </div>
      )}

      {isOwn && (
        <div className="mb-5 flex items-center justify-between">
          <div className="flex gap-1">
            {STATUS_FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
                  filter === f.value
                    ? "bg-slate-900 dark:bg-blue-600 text-white"
                    : "bg-slate-100 dark:bg-navy-800 text-slate-500 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-navy-700"
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
        <div className="rounded-2xl border border-dashed border-slate-200 dark:border-navy-800 py-14 text-center">
          <p className="text-slate-400">제품이 없습니다.</p>
          {isOwn && filter === "all" && (
            <a href="/submit" className="mt-2 inline-block text-xs text-blue-600 hover:underline">
              첫 번째 제품 등록하기 →
            </a>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((product) => {
            const meta = STATUS_META[product.status] ?? STATUS_META.draft;
            const isCurated = product.source === "curated";
            const canEdit =
              isAdmin
                ? true
                : !isCurated &&
                  (product.status === "draft" ||
                    product.status === "rejected" ||
                    product.status === "published");
            const canDelete = isAdmin ? deleting !== product.id : !isCurated && deleting !== product.id;

            return (
              <div
                key={product.id}
                className="overflow-hidden rounded-2xl border border-slate-100 dark:border-navy-800 bg-white dark:bg-navy-900"
              >
                <div className="flex items-center gap-4 p-4">
                  {/* Thumbnail */}
                  <div className="flex h-14 w-14 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-navy-800">
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
                        href={`/products/${product.slug ?? product.id}`}
                        className="font-semibold text-slate-900 dark:text-slate-100 hover:text-blue-600"
                      >
                        {product.name}
                      </a>
                      <span
                        className={`rounded-full px-2 py-0.5 text-xs font-medium ${meta.color}`}
                      >
                        {meta.label}
                      </span>
                    </div>
                    <p className="mt-0.5 truncate text-sm text-slate-400">{product.tagline}</p>
                    <p className="mt-1 text-xs text-slate-300">
                      {new Date(product.created_at).toLocaleDateString("ko-KR")} · 업보트{" "}
                      {product.upvote_count}
                    </p>
                  </div>

                  {/* Actions */}
                  {isOwn && (
                    <div className="flex flex-shrink-0 items-center gap-2">
                      {canEdit && (
                        <Link
                          href={product.source === "curated" ? `/admin/upload?edit=${product.id}` : `/submit?edit=${product.id}`}
                          className="rounded-xl border border-slate-200 dark:border-navy-800 px-3 py-1.5 text-xs font-medium text-slate-600 dark:text-slate-300 transition hover:border-blue-400 hover:text-blue-600"
                        >
                          수정
                        </Link>
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
                      {canDelete && (
                        <button
                          onClick={() => setConfirmDelete(product)}
                          disabled={deleting === product.id}
                          className="flex h-7 w-7 items-center justify-center rounded-lg border border-slate-200 dark:border-navy-800 text-slate-400 transition hover:border-red-300 hover:bg-red-50 hover:text-red-500 disabled:opacity-40"
                          title="삭제"
                        >
                          {deleting === product.id ? (
                            <span className="text-[10px]">...</span>
                          ) : (
                            <svg
                              xmlns="http://www.w3.org/2000/svg"
                              className="h-3.5 w-3.5"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
                              />
                            </svg>
                          )}
                        </button>
                      )}
                    </div>
                  )}
                </div>

                {/* Rejection reason */}
                {isOwn && product.status === "rejected" && product.rejection_reason && (
                  <div className="border-t border-red-50 bg-red-50 px-4 py-3 dark:border-red-500/20 dark:bg-red-500/10">
                    <p className="text-xs font-semibold text-red-600 dark:text-red-400">반려 사유</p>
                    <p className="mt-0.5 text-sm text-red-500 dark:text-red-400">{product.rejection_reason}</p>
                  </div>
                )}

                {errors[product.id] && (
                  <div className="border-t border-red-50 bg-red-50 px-4 py-2 dark:border-red-500/20 dark:bg-red-500/10">
                    <p className="text-xs text-red-500 dark:text-red-400">{errors[product.id]}</p>
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
