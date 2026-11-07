import type { HomePromotion } from "@/types";

// 지금 노출 중인 홍보 하나를 고른다. 기간이 겹치면 시작이 가장 늦은 홍보가 우선한다.
export function pickActivePromotion(promotions: HomePromotion[], nowMs = Date.now()): HomePromotion | null {
  return (
    promotions
      .filter((p) => p.is_enabled && new Date(p.starts_at).getTime() <= nowMs && new Date(p.ends_at).getTime() > nowMs)
      .sort((a, b) => new Date(b.starts_at).getTime() - new Date(a.starts_at).getTime())[0] ?? null
  );
}
