"use client";

import { useState } from "react";
import Link from "next/link";
import { requestProductClaim } from "@/lib/actions/claim";

type Props = {
  productId: string;
  productName: string;
  userId: string | null;
  /** 이 사용자의 기존 클레임 상태 (pending | approved | rejected | null) */
  existingStatus: "pending" | "approved" | "rejected" | null;
};

export default function ClaimButton({
  productId,
  productName,
  userId,
  existingStatus,
}: Props) {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [status, setStatus] = useState(existingStatus);

  // 이미 승인된 경우(소유자)엔 버튼 자체를 숨김
  if (status === "approved") return null;

  if (status === "pending") {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-amber-600">
        ⏳ 소유권 요청 심사 중
      </span>
    );
  }

  if (!userId) {
    return (
      <Link
        href={`/login?next=/products`}
        className="inline-flex items-center gap-1 text-xs text-slate-400 underline-offset-2 transition hover:text-blue-600 hover:underline"
      >
        🙋 이 제품의 메이커인가요?
      </Link>
    );
  }

  const handleSubmit = async () => {
    setSubmitting(true);
    setError(null);
    const result = await requestProductClaim(productId, message);
    setSubmitting(false);
    if (result.error) {
      setError(result.error);
    } else {
      setStatus("pending");
      setOpen(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="inline-flex items-center gap-1 text-xs text-slate-400 underline-offset-2 transition hover:text-blue-600 hover:underline"
      >
        🙋 이 제품의 메이커인가요?
      </button>
    );
  }

  return (
    <div className="w-full rounded-2xl border border-blue-100 bg-blue-50/50 p-4">
      <p className="text-sm font-semibold text-slate-800">
        &lsquo;{productName}&rsquo; 소유권 요청
      </p>
      <p className="mt-1 text-xs text-slate-500">
        본인이 이 제품의 메이커임을 확인할 수 있는 정보(공식 이메일, 관련 링크
        등)를 남겨주세요. 관리자 확인 후 소유권이 이전됩니다.
      </p>
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        rows={3}
        placeholder="예: 저는 이 제품의 개발자입니다. 공식 사이트 contact@example.com 으로 확인 가능합니다."
        className="mt-3 w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 placeholder-slate-400 focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100"
      />
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
      <div className="mt-3 flex items-center gap-2">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting || !message.trim()}
          className="rounded-lg bg-navy-900 px-4 py-2 text-xs font-semibold text-white transition hover:bg-navy-800 disabled:cursor-not-allowed disabled:opacity-40"
        >
          {submitting ? "요청 중…" : "소유권 요청 보내기"}
        </button>
        <button
          type="button"
          onClick={() => {
            setOpen(false);
            setError(null);
          }}
          className="rounded-lg px-3 py-2 text-xs font-medium text-slate-500 transition hover:text-slate-700"
        >
          취소
        </button>
      </div>
    </div>
  );
}
