"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

// ── requestProductClaim ───────────────────────────────────────────────────────
// 로그인 사용자가 선등록(curated) 제품의 소유권을 요청. status='pending' 클레임 생성 + 어드민 알림.

export async function requestProductClaim(
  productId: string,
  message: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  // 제품 존재 및 현재 소유자 확인
  const { data: product } = await supabase
    .from("products")
    .select("id, name, slug, maker_id")
    .eq("id", productId)
    .single();

  if (!product) return { error: "제품을 찾을 수 없습니다." };
  if (product.maker_id === user.id)
    return { error: "이미 이 제품의 소유자입니다." };

  // 이미 대기 중인 클레임이 있는지 확인
  const { data: existing } = await supabase
    .from("product_claims")
    .select("id")
    .eq("product_id", productId)
    .eq("claimant_id", user.id)
    .eq("status", "pending")
    .maybeSingle();

  if (existing) return { error: "이미 소유권 요청이 접수되어 심사 중입니다." };

  const { error } = await supabase.from("product_claims").insert({
    product_id: productId,
    claimant_id: user.id,
    message: message.trim(),
    status: "pending",
  });

  if (error) return { error: error.message };

  // 요청자 프로필(알림 표시용)
  const { data: claimant } = await supabase
    .from("profiles")
    .select("username")
    .eq("id", user.id)
    .single();

  // 모든 관리자에게 알림
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_admin", true);

  if (admins && admins.length > 0) {
    await supabase.from("notifications").insert(
      admins.map((admin) => ({
        user_id: admin.id,
        type: "product_claimed",
        payload: {
          product_id: productId,
          product_name: product.name,
          claimant_username: claimant?.username ?? "",
        },
      }))
    );
  }

  revalidatePath(`/products/${product.slug}`);
  return {};
}

// ── approveProductClaim ───────────────────────────────────────────────────────
// 관리자: 클레임 승인 → 제품 maker_id를 요청자에게 이전, maker_type='maker'.
// 같은 제품의 다른 대기 클레임은 자동 반려. 요청자에게 알림.

export async function approveProductClaim(
  claimId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { error: "관리자 권한이 필요합니다." };

  const { data: claim } = await supabase
    .from("product_claims")
    .select("id, product_id, claimant_id, status")
    .eq("id", claimId)
    .single();

  if (!claim) return { error: "클레임을 찾을 수 없습니다." };
  if (claim.status !== "pending")
    return { error: "이미 처리된 클레임입니다." };

  // 1. 제품 소유권 이전 (admin update 정책으로 허용)
  const { data: product, error: transferError } = await supabase
    .from("products")
    .update({
      maker_id: claim.claimant_id,
      maker_type: "maker",
    })
    .eq("id", claim.product_id)
    .select("name, slug")
    .single();

  if (transferError) return { error: transferError.message };

  const now = new Date().toISOString();

  // 2. 이 클레임 승인 처리
  const { error: approveError } = await supabase
    .from("product_claims")
    .update({
      status: "approved",
      reviewed_at: now,
      reviewed_by: user.id,
    })
    .eq("id", claimId);

  if (approveError) return { error: approveError.message };

  // 3. 같은 제품의 다른 대기 클레임 자동 반려
  await supabase
    .from("product_claims")
    .update({
      status: "rejected",
      reject_reason: "다른 사용자에게 소유권이 승인되었습니다.",
      reviewed_at: now,
      reviewed_by: user.id,
    })
    .eq("product_id", claim.product_id)
    .eq("status", "pending");

  // 4. 요청자에게 승인 알림
  await supabase.from("notifications").insert({
    user_id: claim.claimant_id,
    type: "product_claim_approved",
    payload: {
      product_id: claim.product_id,
      product_name: product?.name ?? "",
      product_slug: product?.slug ?? "",
    },
  });

  revalidatePath("/admin/claims");
  if (product?.slug) revalidatePath(`/products/${product.slug}`);
  return {};
}

// ── rejectProductClaim ────────────────────────────────────────────────────────
// 관리자: 클레임 반려 + 요청자에게 사유 알림.

export async function rejectProductClaim(
  claimId: string,
  reason: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) return { error: "관리자 권한이 필요합니다." };

  const { data: claim } = await supabase
    .from("product_claims")
    .select("id, product_id, claimant_id, status")
    .eq("id", claimId)
    .single();

  if (!claim) return { error: "클레임을 찾을 수 없습니다." };
  if (claim.status !== "pending")
    return { error: "이미 처리된 클레임입니다." };

  const { data: product, error } = await supabase
    .from("product_claims")
    .update({
      status: "rejected",
      reject_reason: reason.trim(),
      reviewed_at: new Date().toISOString(),
      reviewed_by: user.id,
    })
    .eq("id", claimId)
    .select("product_id")
    .single();

  if (error) return { error: error.message };

  const { data: productRow } = await supabase
    .from("products")
    .select("name")
    .eq("id", product.product_id)
    .single();

  await supabase.from("notifications").insert({
    user_id: claim.claimant_id,
    type: "product_claim_rejected",
    payload: {
      product_id: claim.product_id,
      product_name: productRow?.name ?? "",
      reason: reason.trim(),
    },
  });

  revalidatePath("/admin/claims");
  return {};
}
