import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import SubmitForm from "./SubmitForm";
import type { EditProductData } from "./SubmitForm";

export default async function SubmitPage(props: {
  searchParams: Promise<{ edit?: string }>;
}) {
  const { edit: editId } = await props.searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/submit");

  const { data: profile } = await supabase
    .from("profiles")
    .select("username, is_admin")
    .eq("id", user.id)
    .single();

  const username = profile?.username ?? null;
  const isAdmin = profile?.is_admin === true;

  let editProduct: EditProductData | null = null;

  if (editId) {
    // 본인 제품 또는 관리자인 경우 편집 가능
    const query = supabase
      .from("products")
      .select("id, name, tagline, description, url, category, categories, tags, thumbnail_url, video_url, gallery_images, is_open_source, repo_url, maker_type, status")
      .eq("id", editId);

    if (!isAdmin) {
      query.eq("maker_id", user.id);
    }

    const { data: product } = await query.maybeSingle();

    if (product) {
      const [
        { data: links },
        { data: teamMembers },
        { data: shoutouts },
        { data: investorInfo },
      ] = await Promise.all([
        supabase.from("product_links").select("link_type, url, label").eq("product_id", editId).order("sort_order"),
        supabase.from("product_team_members").select("name, role, profile_id").eq("product_id", editId),
        supabase.from("product_shoutouts").select("shoutout_name, shoutout_url, reason_text").eq("product_id", editId).order("sort_order"),
        supabase.from("product_investor_info").select("founder_reason, idea_reason, competitors_text, revenue_info, other_info").eq("product_id", editId).maybeSingle(),
      ]);

      editProduct = {
        id: product.id as string,
        name: (product.name as string) ?? "",
        tagline: (product.tagline as string) ?? "",
        description: (product.description as string) ?? "",
        url: (product.url as string) ?? "",
        categories: (product.categories as string[]) ?? [],
        tags: ((product.tags as string[]) ?? []).join(", "),
        thumbnail_url: (product.thumbnail_url as string | null) ?? null,
        video_url: (product.video_url as string | null) ?? null,
        gallery_images: (product.gallery_images as string[]) ?? [],
        is_open_source: (product.is_open_source as boolean) ?? false,
        repo_url: (product.repo_url as string | null) ?? null,
        maker_type: (product.maker_type as "maker" | "hunter") ?? "maker",
        status: product.status as string,
        extra_links: (links ?? []).map((l) => ({
          type: (l.link_type as string) ?? "other",
          url: (l.url as string) ?? "",
          label: (l.label as string | null) ?? "",
        })),
        team_members: (teamMembers ?? []).map((m) => ({
          name: (m.name as string) ?? "",
          role: (m.role as string) ?? "팀원",
          profile_id: (m.profile_id as string | null) ?? null,
        })),
        shoutouts: (shoutouts ?? []).map((s) => ({
          name: (s.shoutout_name as string) ?? "",
          url: (s.shoutout_url as string | null) ?? "",
          reason: (s.reason_text as string) ?? "",
        })),
        investor_info: investorInfo
          ? {
              founder_reason: (investorInfo.founder_reason as string | null) ?? null,
              idea_reason: (investorInfo.idea_reason as string | null) ?? null,
              competitors_text: (investorInfo.competitors_text as string | null) ?? null,
              revenue_info: (investorInfo.revenue_info as string | null) ?? null,
              other_info: (investorInfo.other_info as string | null) ?? null,
            }
          : null,
      };
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-6 md:py-12">
      <div className="mb-6 md:mb-8">
        <h1 className="text-xl font-black text-slate-900 md:text-2xl dark:text-slate-100">
          {editProduct ? "제품 수정" : "제품 등록"}
        </h1>
        <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">AI 툴, SaaS, 사이드 프로젝트를 세상에 소개하세요.</p>
      </div>
      <SubmitForm username={username} editProduct={editProduct} />
    </div>
  );
}
