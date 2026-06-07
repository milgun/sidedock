"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { generateUniqueSlug } from "@/lib/slug";

// ── Shared input types ────────────────────────────────────────────────────────

interface ExtraLink {
  type: string;
  url: string;
  label?: string;
}

interface TeamMemberInput {
  name: string;
  role?: string;
  profile_id?: string;
}

interface ShoutoutInput {
  name: string;
  url?: string;
  reason: string;
}

interface InvestorInfoInput {
  founder_reason: string;
  idea_reason: string;
  competitors_text: string;
  revenue_info: string;
  other_info: string;
}

// ── createProductDraft ────────────────────────────────────────────────────────
// 폼 첫 진입 시 draft 생성. status='draft', launched_at 미설정.

interface CreateDraftInput {
  name: string;
  tagline: string;
  description: string;
  url: string;
  category: string;
  categories: string[];
  tags: string[];
  thumbnail_url?: string;
  video_url?: string;
  gallery_images?: string[];
  is_open_source: boolean;
  repo_url?: string;
  maker_type: "maker" | "hunter";
}

export async function createProductDraft(
  input: CreateDraftInput
): Promise<{ productId?: string; error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const slug = await generateUniqueSlug(input.name.trim() || "product", supabase);

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name.trim() || "작성 중",
      tagline: input.tagline.trim() || "-",
      description: input.description.trim() || "-",
      url: input.url.trim() || "https://placeholder.com",
      category: input.category || "other",
      categories: input.categories.length > 0 ? input.categories : ["other"],
      tags: input.tags.filter(Boolean),
      thumbnail_url: input.thumbnail_url?.trim() || null,
      video_url: input.video_url?.trim() || null,
      gallery_images: input.gallery_images ?? [],
      is_open_source: input.is_open_source,
      repo_url: input.repo_url?.trim() || null,
      maker_type: input.maker_type,
      maker_id: user.id,
      source: "launch",
      status: "draft",
      slug,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };
  return { productId: data.id as string };
}

// ── updateProductDraft ────────────────────────────────────────────────────────
// 자동저장 — products 테이블 필드만 업데이트 (관계형 데이터는 최종 제출 시 저장)

interface UpdateDraftInput {
  name: string;
  tagline: string;
  description: string;
  url: string;
  category: string;
  categories: string[];
  tags: string[];
  thumbnail_url?: string;
  video_url?: string;
  gallery_images?: string[];
  is_open_source: boolean;
  repo_url?: string;
  maker_type: "maker" | "hunter";
}

export async function updateProductDraft(
  productId: string,
  input: UpdateDraftInput
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("products")
    .update({
      name: input.name.trim() || "작성 중",
      tagline: input.tagline.trim() || "-",
      description: input.description.trim() || "-",
      url: input.url.trim() || "https://placeholder.com",
      category: input.category || "other",
      categories: input.categories.length > 0 ? input.categories : ["other"],
      tags: input.tags.filter(Boolean),
      thumbnail_url: input.thumbnail_url?.trim() || null,
      video_url: input.video_url?.trim() || null,
      gallery_images: input.gallery_images ?? [],
      is_open_source: input.is_open_source,
      repo_url: input.repo_url?.trim() || null,
      maker_type: input.maker_type,
    })
    .eq("id", productId)
    .eq("maker_id", user.id);

  if (error) return { error: error.message };
  return {};
}

// ── submitProductForReview ────────────────────────────────────────────────────
// 최종 제출 — 모든 관계형 데이터 저장 + status → pending_review + 어드민 알림

interface SubmitForReviewInput {
  name: string;
  tagline: string;
  description: string;
  url: string;
  category: string;
  categories: string[];
  tags: string[];
  thumbnail_url?: string;
  video_url?: string;
  gallery_images?: string[];
  is_open_source: boolean;
  repo_url?: string;
  maker_type: "maker" | "hunter";
  extra_links: ExtraLink[];
  team_members: TeamMemberInput[];
  shoutouts: ShoutoutInput[];
  investor_info?: InvestorInfoInput | null;
}

export async function submitProductForReview(
  productId: string,
  input: SubmitForReviewInput
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  // 1. 제품 필드 업데이트 + status → pending_review
  const slug = await generateUniqueSlug(input.name.trim(), supabase, productId);
  const { error: updateError } = await supabase
    .from("products")
    .update({
      name: input.name.trim(),
      tagline: input.tagline.trim(),
      description: input.description.trim(),
      url: input.url.trim(),
      category: input.category,
      categories: input.categories,
      tags: input.tags.filter(Boolean),
      thumbnail_url: input.thumbnail_url?.trim() || null,
      video_url: input.video_url?.trim() || null,
      gallery_images: input.gallery_images ?? [],
      is_open_source: input.is_open_source,
      repo_url: input.is_open_source ? (input.repo_url?.trim() || null) : null,
      maker_type: input.maker_type,
      status: "pending_review",
      slug,
    })
    .eq("id", productId)
    .eq("maker_id", user.id);

  if (updateError) return { error: updateError.message };

  // 2. 관계형 데이터 교체 (기존 삭제 후 재삽입)
  await supabase.from("product_links").delete().eq("product_id", productId);
  await supabase.from("product_team_members").delete().eq("product_id", productId);
  await supabase.from("product_shoutouts").delete().eq("product_id", productId);

  if (input.extra_links.length > 0) {
    await supabase.from("product_links").insert(
      input.extra_links.map((l, i) => ({
        product_id: productId,
        link_type: l.type,
        url: l.url.trim(),
        label: l.label?.trim() || null,
        sort_order: i,
      }))
    );
  }

  if (input.maker_type === "maker" && input.team_members.length > 0) {
    await supabase.from("product_team_members").insert(
      input.team_members.map((m) => ({
        product_id: productId,
        name: m.name.trim(),
        role: m.role ?? "member",
        profile_id: m.profile_id ?? null,
      }))
    );
  }

  if (input.shoutouts.length > 0) {
    await supabase.from("product_shoutouts").insert(
      input.shoutouts.map((s, i) => ({
        product_id: productId,
        shoutout_name: s.name.trim(),
        shoutout_url: s.url?.trim() || null,
        reason_text: s.reason.trim(),
        sort_order: i,
      }))
    );
  }

  if (input.investor_info) {
    await supabase.from("product_investor_info").upsert({
      product_id: productId,
      founder_reason: input.investor_info.founder_reason.trim() || null,
      idea_reason: input.investor_info.idea_reason.trim() || null,
      competitors_text: input.investor_info.competitors_text.trim() || null,
      revenue_info: input.investor_info.revenue_info.trim() || null,
      other_info: input.investor_info.other_info.trim() || null,
    });
  }

  // 3. 모든 관리자에게 알림 생성
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_admin", true);

  if (admins && admins.length > 0) {
    const { data: product } = await supabase
      .from("products")
      .select("name")
      .eq("id", productId)
      .single();

    await supabase.from("notifications").insert(
      admins.map((admin) => ({
        user_id: admin.id,
        type: "product_submitted",
        payload: {
          product_id: productId,
          product_name: product?.name ?? "",
          maker_id: user.id,
        },
      }))
    );
  }

  return {};
}

// ── approveProduct ────────────────────────────────────────────────────────────
// 관리자: 제품 승인 → status='published', launched_at=now()

export async function approveProduct(
  productId: string
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

  // 제품 승인
  const { data: product, error } = await supabase
    .from("products")
    .update({
      status: "published",
      launched_at: new Date().toISOString(),
      rejection_reason: null,
    })
    .eq("id", productId)
    .select("name, maker_id")
    .single();

  if (error) return { error: error.message };

  // 제출자에게 승인 알림
  if (product?.maker_id) {
    await supabase.from("notifications").insert({
      user_id: product.maker_id,
      type: "product_approved",
      payload: {
        product_id: productId,
        product_name: product.name,
      },
    });
  }

  return {};
}

// ── rejectProduct ─────────────────────────────────────────────────────────────
// 관리자: 제품 반려 → status='rejected', rejection_reason 저장

export async function rejectProduct(
  productId: string,
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

  const { data: product, error } = await supabase
    .from("products")
    .update({
      status: "rejected",
      rejection_reason: reason.trim(),
    })
    .eq("id", productId)
    .select("name, maker_id")
    .single();

  if (error) return { error: error.message };

  // 제출자에게 반려 알림
  if (product?.maker_id) {
    await supabase.from("notifications").insert({
      user_id: product.maker_id,
      type: "product_rejected",
      payload: {
        product_id: productId,
        product_name: product.name,
        reason: reason.trim(),
      },
    });
  }

  return {};
}

// ── resubmitProduct ───────────────────────────────────────────────────────────
// 반려된 제품을 수정 후 재제출 → status='pending_review'

export async function resubmitProduct(
  productId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const { error } = await supabase
    .from("products")
    .update({ status: "pending_review", rejection_reason: null })
    .eq("id", productId)
    .eq("maker_id", user.id)
    .eq("status", "rejected");

  if (error) return { error: error.message };

  // 관리자에게 재제출 알림
  const { data: admins } = await supabase
    .from("profiles")
    .select("id")
    .eq("is_admin", true);

  if (admins && admins.length > 0) {
    const { data: product } = await supabase
      .from("products")
      .select("name")
      .eq("id", productId)
      .single();

    await supabase.from("notifications").insert(
      admins.map((admin) => ({
        user_id: admin.id,
        type: "product_submitted",
        payload: {
          product_id: productId,
          product_name: product?.name ?? "",
          maker_id: user.id,
          resubmit: true,
        },
      }))
    );
  }

  return {};
}

// ── deleteMyProduct ───────────────────────────────────────────────────────────
// 본인 제품 삭제 (일반 사용자 — launch 제품만)

export async function deleteMyProduct(
  productId: string
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  const { data: product } = await supabase
    .from("products")
    .select("source")
    .eq("id", productId)
    .eq("maker_id", user.id)
    .single();

  if (!product) return { error: "제품을 찾을 수 없거나 권한이 없습니다." };
  if (product.source === "curated") return { error: "큐레이션 제품은 관리자만 삭제할 수 있습니다." };

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId)
    .eq("maker_id", user.id);

  if (error) return { error: error.message };
  return {};
}

// ── deleteAdminProduct ────────────────────────────────────────────────────────
// 어드민 전용 — 모든 제품(curated 포함) 삭제

export async function deleteAdminProduct(
  productId: string
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

  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", productId);

  if (error) return { error: error.message };
  return {};
}

// ── createCuratedProduct ──────────────────────────────────────────────────────
// 어드민 전용 — 큐레이션 제품 직접 등록 (즉시 published)

interface CreateCuratedInput {
  name: string;
  tagline: string;
  description: string;
  url: string;
  category: string;
  categories?: string[];
  tags: string[];
  thumbnail_url?: string;
  video_url?: string;
  gallery_images?: string[];
  extra_links?: ExtraLink[];
  maker_type?: "maker" | "hunter";
  is_featured?: boolean;
  featured_label?: string;
}

export async function createCuratedProduct(
  input: CreateCuratedInput
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

  const slug = await generateUniqueSlug(input.name.trim(), supabase);

  const { data, error } = await supabase
    .from("products")
    .insert({
      name: input.name.trim(),
      tagline: input.tagline.trim(),
      description: input.description.trim(),
      url: input.url.trim(),
      category: input.category,
      categories: input.categories ?? [input.category],
      tags: input.tags.filter(Boolean),
      thumbnail_url: input.thumbnail_url?.trim() || null,
      video_url: input.video_url?.trim() || null,
      gallery_images: input.gallery_images ?? [],
      is_open_source: false,
      maker_type: input.maker_type ?? "hunter",
      maker_id: user.id,
      source: "curated",
      status: "published",
      launched_at: new Date().toISOString(),
      is_featured: input.is_featured ?? false,
      featured_label: input.featured_label?.trim() || null,
      slug,
    })
    .select("id, slug")
    .single();

  if (error) return { error: error.message };

  // extra_links 저장
  if (input.extra_links && input.extra_links.length > 0) {
    const links = input.extra_links.filter((l) => l.url.trim());
    if (links.length > 0) {
      await supabase.from("product_links").insert(
        links.map((l, i) => ({
          product_id: data.id,
          link_type: l.type,
          url: l.url.trim(),
          label: l.label?.trim() || null,
          sort_order: i,
        }))
      );
    }
  }

  redirect(`/products/${data.slug}`);
}

// ── updateCuratedProduct ──────────────────────────────────────────────────────
// 어드민 전용 — 큐레이션 제품 수정

export async function updateCuratedProduct(
  productId: string,
  input: CreateCuratedInput
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

  const slug = await generateUniqueSlug(input.name.trim(), supabase, productId);

  const { error } = await supabase
    .from("products")
    .update({
      name: input.name.trim(),
      tagline: input.tagline.trim(),
      description: input.description.trim(),
      url: input.url.trim(),
      category: input.category,
      categories: input.categories ?? [input.category],
      tags: input.tags.filter(Boolean),
      thumbnail_url: input.thumbnail_url?.trim() || null,
      video_url: input.video_url?.trim() || null,
      gallery_images: input.gallery_images ?? [],
      maker_type: input.maker_type ?? "hunter",
      is_featured: input.is_featured ?? false,
      featured_label: input.featured_label?.trim() || null,
      slug,
    })
    .eq("id", productId);

  if (error) return { error: error.message };

  // extra_links 교체
  await supabase.from("product_links").delete().eq("product_id", productId);
  if (input.extra_links && input.extra_links.length > 0) {
    const links = input.extra_links.filter((l) => l.url.trim());
    if (links.length > 0) {
      await supabase.from("product_links").insert(
        links.map((l, i) => ({
          product_id: productId,
          link_type: l.type,
          url: l.url.trim(),
          label: l.label?.trim() || null,
          sort_order: i,
        }))
      );
    }
  }

  redirect(`/products/${slug}`);
}


interface TeamMemberInput {
  name: string;
  role?: string;
  profile_id?: string;
}

interface ShoutoutInput {
  name: string;
  url?: string;
  reason: string;
}

interface InvestorInfoInput {
  founder_reason: string;
  idea_reason: string;
  competitors_text: string;
  revenue_info: string;
  other_info: string;
}

interface CreateProductInput {
  name: string;
  tagline: string;
  description: string;
  url: string;
  category: string;
  categories: string[];
  tags: string[];
  thumbnail_url?: string;
  video_url?: string;
  gallery_images?: string[];
  is_open_source: boolean;
  repo_url?: string;
  maker_type: "maker" | "hunter";
  extra_links: ExtraLink[];
  team_members: TeamMemberInput[];
  shoutouts: ShoutoutInput[];
  investor_info?: InvestorInfoInput | null;
}

export async function createProduct(
  input: CreateProductInput
): Promise<{ error?: string }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { error: "로그인이 필요합니다." };

  // Insert product
  const { data: product, error: productError } = await supabase
    .from("products")
    .insert({
      name: input.name.trim(),
      tagline: input.tagline.trim(),
      description: input.description.trim(),
      url: input.url.trim(),
      category: input.category,
      categories: input.categories,
      tags: input.tags.filter(Boolean),
      thumbnail_url: input.thumbnail_url?.trim() || null,
      video_url: input.video_url?.trim() || null,
      gallery_images: input.gallery_images ?? [],
      is_open_source: input.is_open_source,
      repo_url: input.repo_url?.trim() || null,
      maker_type: input.maker_type,
      maker_id: user.id,
      source: "launch",
    })
    .select("id")
    .single();

  if (productError) return { error: productError.message };
  const productId = product.id as string;

  // Insert extra links
  if (input.extra_links.length > 0) {
    const links = input.extra_links.map((l, i) => ({
      product_id: productId,
      link_type: l.type,
      url: l.url.trim(),
      label: l.label?.trim() || null,
      sort_order: i,
    }));
    await supabase.from("product_links").insert(links);
  }

  // Insert team members (only if maker)
  if (input.maker_type === "maker" && input.team_members.length > 0) {
    const members = input.team_members.map((m) => ({
      product_id: productId,
      name: m.name.trim(),
      role: m.role ?? "member",
      profile_id: m.profile_id ?? null,
    }));
    await supabase.from("product_team_members").insert(members);
  }

  // Insert shoutouts
  if (input.shoutouts.length > 0) {
    const shoutouts = input.shoutouts.map((s, i) => ({
      product_id: productId,
      shoutout_name: s.name.trim(),
      shoutout_url: s.url?.trim() || null,
      reason_text: s.reason.trim(),
      sort_order: i,
    }));
    await supabase.from("product_shoutouts").insert(shoutouts);
  }

  // Insert investor info (if any field has content)
  if (input.investor_info) {
    await supabase.from("product_investor_info").insert({
      product_id: productId,
      founder_reason: input.investor_info.founder_reason.trim() || null,
      idea_reason: input.investor_info.idea_reason.trim() || null,
      competitors_text: input.investor_info.competitors_text.trim() || null,
      revenue_info: input.investor_info.revenue_info.trim() || null,
      other_info: input.investor_info.other_info.trim() || null,
    });
  }

  redirect(`/products/${productId}`);
}

