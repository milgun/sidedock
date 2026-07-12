"use client";

import { useState } from "react";
import { approveProductClaim, rejectProductClaim } from "@/lib/actions/claim";

export type PendingClaim = {
  id: string;
  message: string;
  created_at: string;
  product: {
    id: string;
    slug: string;
    name: string;
    tagline: string;
    url: string;
    thumbnail_url: string | null;
    maker: {
      username: string;
      display_name: string | null;
    } | null;
  } | null;
  claimant: {
    id: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
  } | null;
};

export default function ClaimsClient({
  claims: initialClaims,
}: {
  claims: PendingClaim[];
}) {
  const [claims, setClaims] = useState(initialClaims);
  const [processing, setProcessing] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const remove = (id: string) =>
    setClaims((prev) => prev.filter((c) => c.id !== id));

  const handleApprove = async (id: string) => {
    setProcessing(id);
    const result = await approveProductClaim(id);
    setProcessing(null);
    if (result.error) {
      setErrors((e) => ({ ...e, [id]: result.error! }));
    } else {
      remove(id);
    }
  };

  const handleReject = async (id: string) => {
    if (!rejectReason.trim()) return;
    setProcessing(id);
    const result = await rejectProductClaim(id, rejectReason);
    setProcessing(null);
    if (result.error) {
      setErrors((e) => ({ ...e, [id]: result.error! }));
    } else {
      remove(id);
      setRejectingId(null);
      setRejectReason("");
    }
  };

  if (claims.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-slate-200 py-20 text-center dark:border-navy-700">
        <p className="text-4xl">✅</p>
        <p className="mt-3 text-slate-500 dark:text-slate-400">대기 중인 소유권 요청이 없습니다.</p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {claims.map((claim) => (
        <div
          key={claim.id}
          className="overflow-hidden rounded-2xl border border-slate-100 bg-white shadow-sm dark:border-navy-800 dark:bg-navy-900"
        >
          {/* Product header */}
          <div className="flex items-start gap-4 p-5">
            <div className="flex h-16 w-16 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-slate-100 dark:bg-navy-800">
              {claim.product?.thumbnail_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={claim.product.thumbnail_url}
                  alt={claim.product.name}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="text-3xl font-black text-slate-300">
                  {claim.product?.name[0]?.toUpperCase() ?? "?"}
                </span>
              )}
            </div>

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2">
                <a
                  href={`/products/${claim.product?.slug ?? claim.product?.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-bold text-slate-900 hover:text-blue-600 dark:text-slate-100 dark:hover:text-blue-400"
                >
                  {claim.product?.name ?? "(삭제된 제품)"}
                </a>
                <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">
                  소유권 요청
                </span>
              </div>
              <p className="mt-0.5 text-sm text-slate-500 dark:text-slate-400">
                {claim.product?.tagline}
              </p>
              <p className="mt-1 text-xs text-slate-400">
                현재 소유자:{" "}
                {claim.product?.maker?.display_name ??
                  claim.product?.maker?.username ??
                  "—"}
              </p>
            </div>

            {claim.product?.url && (
              <a
                href={claim.product.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 rounded-xl border border-slate-200 px-3 py-1.5 text-xs font-medium text-slate-600 transition hover:border-blue-400 dark:border-navy-700 dark:text-slate-300"
              >
                🔗 방문
              </a>
            )}
          </div>

          {/* Claimant + message */}
          <div className="border-t border-slate-100 bg-slate-50 px-5 py-4 dark:border-navy-800 dark:bg-navy-800/50">
            <div className="flex items-center gap-2">
              {claim.claimant?.avatar_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={claim.claimant.avatar_url}
                  alt={claim.claimant.username}
                  className="h-6 w-6 rounded-full object-cover"
                />
              ) : (
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-slate-200 text-xs font-bold text-slate-500 dark:bg-navy-800 dark:text-slate-400">
                  {claim.claimant?.username[0]?.toUpperCase() ?? "?"}
                </span>
              )}
              <a
                href={`/profile/${claim.claimant?.username}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-semibold text-slate-700 hover:text-blue-600 dark:text-slate-300 dark:hover:text-blue-400"
              >
                {claim.claimant?.display_name ?? claim.claimant?.username}
              </a>
              <span className="text-xs text-slate-400">
                @{claim.claimant?.username} 님이 소유권을 요청했습니다
              </span>
            </div>
            {claim.message && (
              <p className="mt-2 whitespace-pre-wrap rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-300">
                {claim.message}
              </p>
            )}
          </div>

          {/* Actions */}
          <div className="flex flex-col gap-2 border-t border-slate-100 px-5 py-4 dark:border-navy-800">
            {errors[claim.id] && (
              <p className="text-xs text-red-500">{errors[claim.id]}</p>
            )}
            {rejectingId === claim.id ? (
              <div className="space-y-2">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  rows={2}
                  placeholder="반려 사유를 입력하세요 (요청자에게 전달됩니다)"
                  className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-red-300 focus:outline-none focus:ring-2 focus:ring-red-100 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-100 dark:placeholder-slate-500"
                />
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => handleReject(claim.id)}
                    disabled={processing === claim.id || !rejectReason.trim()}
                    className="rounded-lg bg-red-500 px-4 py-2 text-xs font-semibold text-white transition hover:bg-red-600 disabled:opacity-40"
                  >
                    {processing === claim.id ? "처리 중…" : "반려 확정"}
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setRejectingId(null);
                      setRejectReason("");
                    }}
                    className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:text-slate-700 dark:text-slate-400"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => handleApprove(claim.id)}
                  disabled={processing === claim.id}
                  className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:opacity-40 dark:bg-blue-600 dark:hover:bg-blue-700"
                >
                  {processing === claim.id ? "처리 중…" : "✅ 승인 (소유권 이전)"}
                </button>
                <button
                  type="button"
                  onClick={() => setRejectingId(claim.id)}
                  className="rounded-lg border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-600 transition hover:border-red-300 hover:text-red-600 dark:border-navy-700 dark:text-slate-300"
                >
                  반려
                </button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
