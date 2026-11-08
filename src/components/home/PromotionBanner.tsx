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

      <div className="relative flex items-center justify-between gap-4 px-5 py-6 sm:gap-6 sm:px-8 sm:py-10">
        <div className="min-w-0 flex-1">
          {promotion.badge && (
            <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-medium text-cyan-300">
              <span className="h-1.5 w-1.5 flex-shrink-0 animate-pulse rounded-full bg-cyan-400" />
              <span className="truncate">{promotion.badge}</span>
            </div>
          )}
          <h2 className="text-xl font-black text-white sm:text-3xl">{promotion.title}</h2>
          {promotion.description && <p className="mt-2 text-sm text-blue-200 sm:text-base">{promotion.description}</p>}
          {promotion.cta_url && (
            <a
              href={promotion.cta_url}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-white px-4 py-2.5 text-sm font-bold text-navy-900 transition hover:bg-blue-50 sm:mt-5"
            >
              {promotion.cta_label || "자세히 보기"} <span aria-hidden>→</span>
            </a>
          )}
        </div>
        {promotion.image_url && (
          <div className="relative mt-8 h-20 w-20 flex-shrink-0 self-start overflow-hidden rounded-xl ring-1 ring-white/20 sm:mt-0 sm:h-40 sm:w-40 sm:self-center sm:rounded-2xl">
            <Image src={promotion.image_url} alt={promotion.title} fill sizes="(min-width: 640px) 160px, 80px" className="object-cover" />
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
