"use client";

import { useState } from "react";
import { approveProduct, rejectProduct, setDiscoveryPick } from "@/lib/actions/product";

type PendingProduct = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  description: string;
  url: string;
  thumbnail_url: string | null;
  category: string;
  categories: string[];
  created_at: string;
  maker: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

type DiscoveryProduct = Pick<PendingProduct, "id" | "slug" | "name" | "tagline" | "thumbnail_url" | "created_at" | "maker"> & {
  is_discovery_pick: boolean;
};

function DiscoveryPickList({
  products,
  processing,
  errors,
  onPick,
}: {
  products: DiscoveryProduct[];
  processing: string | null;
  errors: Record<string, string>;
  onPick: (id: string) => void;
}) {
  return (
    <section>
      <div className="mb-3 flex items-end justify-between gap-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">오늘의 발견</h2>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">공개된 Launches 중 하나를 홈에서 소개합니다.</p>
        </div>
        <span className="text-xs text-slate-400">최근 {products.length}개</span>
      </div>
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-8 text-center text-sm text-slate-400 dark:border-navy-700">
          공개된 Launches 제품이 없습니다.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-navy-800">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-navy-800">
                {product.thumbnail_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={product.thumbnail_url} alt="" className="h-full w-full object-cover" />
                ) : (
                  <span className="font-bold text-slate-400">{product.name[0]?.toUpperCase()}</span>
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{product.name}</p>
                <p className="truncate text-xs text-slate-400">@{product.maker?.username ?? "maker"}</p>
              </div>
              <button
                type="button"
                onClick={() => onPick(product.id)}
                disabled={processing === product.id || product.is_discovery_pick}
                className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default disabled:opacity-60 ${
                  product.is_discovery_pick
                    ? "bg-blue-600 text-white"
                    : "border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-navy-700 dark:text-slate-300"
                }`}
              >
                {processing === product.id ? "선정 중..." : product.is_discovery_pick ? "선정됨" : "선정"}
              </button>
              {errors[product.id] && <p className="text-xs text-red-500">{errors[product.id]}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function ModerationClient({
  products: initialProducts,
  discoveryProducts: initialDiscoveryProducts,
}: {
  products: PendingProduct[];
  discoveryProducts: DiscoveryProduct[];
}) {
  const [products, setProducts] = useState(initialProducts);
  const [discoveryProducts, setDiscoveryProducts] = useState(initialDiscoveryProducts);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const removeProduct = (id: string) =>
    setProducts((prev) => prev.filter((p) => p.id !== id));

  const handleApprove = async (id: string) => {
    setProcessing(id);
    const result = await approveProduct(id);
    setProcessing(null);
    if (result.error) {
      setErrors((e) => ({ ...e, [id]: result.error! }));
    } else {
      removeProduct(id);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setProcessing(id);
    const result = await rejectProduct(id, rejectReason);
    setProcessing(null);
    if (result.error) {
      setErrors((e) => ({ ...e, [id]: result.error! }));
    } else {
      removeProduct(id);
      setRejectingId(null);
      setRejectReason("");
    }
  };

  const handleDiscoveryPick = async (id: string) => {
    setProcessing(id);
    const result = await setDiscoveryPick(id);
    setProcessing(null);
    if (result.error) {
      setErrors((current) => ({ ...current, [id]: result.error! }));
      return;
    }
    setDiscoveryProducts((current) =>
      current.map((product) => ({ ...product, is_discovery_pick: product.id === id })),
    );
  };

  if (products.length === 0) {
    return (
      <div className="space-y-8">
        <DiscoveryPickList products={discoveryProducts} processing={processing} errors={errors} onPick={handleDiscoveryPick} />
        <div className="rounded-2xl border border-dashed border-slate-200 py-20 text-center dark:border-navy-700">
          <p className="text-4xl">✅</p>
          <p className="mt-3 text-slate-500 dark:text-slate-400">심사 대기 중인 제품이 없습니다.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <DiscoveryPickList products={discoveryProducts} processing={processing} errors={errors} onPick={handleDiscoveryPick} />
      <div className="space-y-5">
      {products.map((product) => (
        <div
          key={product.id}
          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-navy-800 dark:bg-navy-900"
        >
          {/* Header */}
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-navy-800">
              {product.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={product.thumbnail_url}
                  alt={product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-slate-300">
                  {product.name[0]?.toUpperCase()}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <a
                  href={`/products/${product.slug ?? product.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
                >
                  {product.name}
                </a>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  승인 대기
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">{product.tagline}</p>
              <div className="mt-2 flex flex-wrap gap-1">
                {product.categories.map((cat) => (
                  <span key={cat} className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-500 dark:bg-navy-800 dark:text-slate-400">
                    {cat}
                  </span>
                ))}
              </div>
            </div>

            <div className="flex flex-shrink-0 items-center gap-2">
              <a
                href={product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-400 dark:border-navy-700 dark:text-slate-300"
              >
                🔗 방문
              </a>
            </div>
          </div>

          {/* Description */}
          <div className="border-t border-slate-50 bg-slate-50 px-5 py-4 dark:border-navy-800 dark:bg-navy-800/50">
            <p className="text-sm leading-relaxed text-slate-600 line-clamp-3 dark:text-slate-300">
              {product.description}
            </p>
          </div>

          {/* Maker */}
          {product.maker && (
            <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-3 dark:border-navy-800">
              <div className="flex h-7 w-7 items-center justify-center overflow-hidden rounded-full bg-slate-200 dark:bg-navy-800">
                {product.maker.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={product.maker.avatar_url}
                    alt=""
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <span className="text-xs font-bold text-slate-500 dark:text-slate-400">
                    {(product.maker.display_name ?? product.maker.username)[0]?.toUpperCase()}
                  </span>
                )}
              </div>
              <div>
                <span className="text-xs font-medium text-slate-700 dark:text-slate-300">
                  {product.maker.display_name ?? product.maker.username}
                </span>
                <span className="ml-1.5 text-xs text-slate-400">@{product.maker.username}</span>
              </div>
              <span className="ml-auto text-xs text-slate-300">
                제출: {new Date(product.created_at).toLocaleDateString("ko-KR")}
              </span>
            </div>
          )}

          {/* Error */}
          {errors[product.id] && (
            <div className="border-t border-red-50 bg-red-50 px-5 py-3">
              <p className="text-xs text-red-500">{errors[product.id]}</p>
            </div>
          )}

          {/* Reject reason form */}
          {rejectingId === product.id && (
            <div className="border-t border-slate-100 px-5 py-4 dark:border-navy-800">
              <label className="mb-1.5 block text-xs font-semibold text-slate-700 dark:text-slate-300">
                반려 사유 <span className="text-red-400">*</span>
              </label>
              <textarea
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                rows={3}
                placeholder="사용자에게 표시될 반려 사유를 입력하세요..."
                className="w-full rounded-xl border border-slate-200 px-3.5 py-2.5 text-sm outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-100 dark:placeholder-slate-500"
              />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => handleReject(product.id)}
                  disabled={!rejectReason.trim() || processing === product.id}
                  className="rounded-xl bg-red-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-red-700 disabled:opacity-50"
                >
                  {processing === product.id ? "처리 중..." : "반려 확정"}
                </button>
                <button
                  onClick={() => { setRejectingId(null); setRejectReason(""); }}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:border-slate-400 dark:border-navy-700 dark:text-slate-300"
                >
                  취소
                </button>
              </div>
            </div>
          )}

          {/* Actions */}
          {rejectingId !== product.id && (
            <div className="flex items-center gap-3 border-t border-slate-100 px-5 py-4 dark:border-navy-800">
              <button
                onClick={() => handleApprove(product.id)}
                disabled={processing === product.id}
                className="rounded-xl bg-green-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-green-700 disabled:opacity-50"
              >
                {processing === product.id ? "처리 중..." : "✓ 승인"}
              </button>
              <button
                onClick={() => { setRejectingId(product.id); setRejectReason(""); }}
                disabled={processing === product.id}
                className="rounded-xl border border-red-200 bg-red-50 px-5 py-2 text-sm font-semibold text-red-600 transition hover:bg-red-100 disabled:opacity-50"
              >
                ✕ 반려
              </button>
            </div>
          )}
        </div>
      ))}
      </div>
    </div>
  );
}
