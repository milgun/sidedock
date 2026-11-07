"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "@/lib/cache";

export type PromotionInput = {
  id?: string;
  badge: string;
  title: string;
  description: string;
  cta_label: string;
  cta_url: string;
  image_url: string;
  // 한국시간 기준 "YYYY-MM-DDTHH:mm" (datetime-local 값)
  starts_at: string;
  ends_at: string;
  is_enabled: boolean;
};

const KST_DATETIME = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;

function toIso(kst: string): string | null {
  if (!KST_DATETIME.test(kst)) return null;
  const date = new Date(`${kst}:00+09:00`);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function isHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "https:" || protocol === "http:";
  } catch {
    return false;
  }
}

async function requireAdmin() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { supabase, error: "로그인이 필요합니다." };

  const { data: profile } = await supabase.from("profiles").select("is_admin").eq("id", user.id).single();
  if (!profile?.is_admin) return { supabase, error: "관리자 권한이 필요합니다." };
  return { supabase, error: null };
}

function refresh() {
  revalidatePath("/");
  revalidatePath("/admin/promotions");
}

export async function savePromotion(input: PromotionInput): Promise<{ error?: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const title = input.title.trim();
  const ctaUrl = input.cta_url.trim();
  const imageUrl = input.image_url.trim();
  if (!title) return { error: "제목을 입력해주세요." };
  if (title.length > 80) return { error: "제목은 80자 이하여야 합니다." };
  if (input.badge.trim().length > 60) return { error: "배지는 60자 이하여야 합니다." };
  if (input.description.trim().length > 200) return { error: "설명은 200자 이하여야 합니다." };
  if (input.cta_label.trim().length > 30) return { error: "버튼 문구는 30자 이하여야 합니다." };
  if (ctaUrl && !isHttpUrl(ctaUrl)) return { error: "링크는 http(s):// 로 시작하는 주소여야 합니다." };
  if (imageUrl && !isHttpUrl(imageUrl)) return { error: "이미지 주소가 올바르지 않습니다." };

  const startsAt = toIso(input.starts_at);
  const endsAt = toIso(input.ends_at);
  if (!startsAt || !endsAt) return { error: "노출 기간을 입력해주세요." };
  if (new Date(endsAt) <= new Date(startsAt)) return { error: "종료 시각은 시작 시각보다 늦어야 합니다." };

  const row = {
    badge: input.badge.trim() || null,
    title,
    description: input.description.trim() || null,
    cta_label: input.cta_label.trim() || null,
    cta_url: ctaUrl || null,
    image_url: imageUrl || null,
    starts_at: startsAt,
    ends_at: endsAt,
    is_enabled: input.is_enabled,
    updated_at: new Date().toISOString(),
  };

  const { error } = input.id
    ? await supabase.from("home_promotions").update(row).eq("id", input.id)
    : await supabase.from("home_promotions").insert(row);
  if (error) return { error: error.message };

  refresh();
  return {};
}

export async function setPromotionEnabled(id: string, isEnabled: boolean): Promise<{ error?: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase
    .from("home_promotions")
    .update({ is_enabled: isEnabled, updated_at: new Date().toISOString() })
    .eq("id", id);
  if (error) return { error: error.message };

  refresh();
  return {};
}

export async function deletePromotion(id: string): Promise<{ error?: string }> {
  const { supabase, error: authError } = await requireAdmin();
  if (authError) return { error: authError };

  const { error } = await supabase.from("home_promotions").delete().eq("id", id);
  if (error) return { error: error.message };

  refresh();
  return {};
}
