"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import type { HomePromotion } from "@/types";

export default function PromotionBanner({ promotion }: { promotion: HomePromotion }) {
  const storageKey = `sidedock_promo_dismissed_${promotion.id}`;
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (!localStorage.getItem(storageKey)) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setVisible(true);
    }
  }, [storageKey]);

  if (!visible) return null;

  const dismiss = () => {
    localStorage.setItem(storageKey, "1");
    setVisible(false);
  };

  return (
    <div className="relative mb-8 overflow-hidden rounded-3xl bg-gradient-to-br from-navy-900 via-navy-800 to-blue-700 shadow-xl">
      <div
        className="pointer-events-none absolute -right-10 -top-10 h-56 w-56 rounded-full opacity-20 blur-3xl"
        style={{ background: "radial-gradient(circle, #22d3ee 0%, transparent 70%)" }}
      />

      <button
        onClick={dismiss}
        aria-label="닫기"
        className="absolute right-4 top-4 z-10 rounded-full p-1.5 text-white/40 transition hover:bg-white/10 hover:text-white/80"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      <div className="relative flex flex-col gap-6 px-8 py-10 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0 flex-1">
          {promotion.badge && (
            <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-cyan-300">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-cyan-400" />
              {promotion.badge}
            </div>
          )}
          <h2 className="text-2xl font-black text-white sm:text-3xl">{promotion.title}</h2>
          {promotion.description && <p className="mt-2 text-blue-200">{promotion.description}</p>}
          {promotion.cta_url && (
            <a
              href={promotion.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-5 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-blue-50"
            >
              {promotion.cta_label || "자세히 보기"} <span aria-hidden>→</span>
            </a>
          )}
        </div>
        {promotion.image_url && (
          <div className="relative h-36 w-36 flex-shrink-0 self-center overflow-hidden rounded-2xl ring-1 ring-white/20 sm:h-40 sm:w-40">
            <Image src={promotion.image_url} alt={promotion.title} fill sizes="160px" className="object-cover" />
            {promotion.cta_url && (
              <a
                href={promotion.cta_url}
                target="_blank"
                rel="noopener noreferrer"
                aria-label={promotion.cta_label || promotion.title}
                className="absolute inset-0 transition hover:bg-white/10"
              />
            )}
          </div>
        )}
      </div>
    </div>
  );
}
