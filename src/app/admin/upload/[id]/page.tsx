import { createClient } from "@/lib/supabase/server";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import AdminUploadForm from "../AdminUploadForm";

export default async function AdminEditProductPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login?next=/admin/upload/" + id);

  const { data: profile } = await supabase
    .from("profiles")
    .select("is_admin")
    .eq("id", user.id)
    .single();

  if (!profile?.is_admin) redirect("/");

  const { data: product } = await supabase
    .from("products")
    .select("*, product_links(*)")
    .eq("id", id)
    .single();

  if (!product) notFound();

  const links = ((product.product_links as {
    id: string;
    link_type: string;
    url: string;
    label: string | null;
    sort_order: number;
  }[]) ?? [])
    .sort((a, b) => a.sort_order - b.sort_order)
    .map((l) => ({
      id: l.id,
      type: l.link_type,
      url: l.url,
      label: l.label ?? "",
    }));

  const initialData = {
    name: (product.name as string) ?? "",
    tagline: (product.tagline as string) ?? "",
    url: (product.url as string) ?? "",
    categories: (product.categories as string[]) ?? [],
    description: (product.description as string) ?? "",
    tags: (product.tags as string[]) ?? [],
    thumbnail_url: (product.thumbnail_url as string) ?? "",
    video_url: (product.video_url as string) ?? "",
    gallery_images: (product.gallery_images as string[]) ?? [],
    extra_links: links,
    maker_type: ((product.maker_type as string) ?? "hunter") as "maker" | "hunter",
    is_featured: (product.is_featured as boolean) ?? false,
    featured_label: (product.featured_label as string) ?? "",
  };

  // Get pending review count for nav badge
  const { count: pendingCount } = await supabase
    .from("products")
    .select("id", { count: "exact", head: true })
    .eq("status", "pending_review");

  return (
    <div className="mx-auto max-w-2xl px-4 py-12">
      {/* Admin Nav */}
      <div className="mb-8 flex gap-3">
        <span className="inline-flex items-center gap-2 rounded-full bg-navy-900 px-3 py-1 text-xs font-semibold text-white">
          🛠 관리자 전용
        </span>
        <Link
          href="/admin/moderation"
          className="inline-flex items-center gap-2 rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700 transition hover:bg-amber-100"
        >
          📋 심사 대기열
          {(pendingCount ?? 0) > 0 && (
            <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-white text-[10px] font-black">
              {pendingCount}
            </span>
          )}
        </Link>
      </div>
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">Hot Products 수정</h1>
        <p className="mt-1 text-slate-500">
          <span className="font-semibold text-slate-700">{product.name}</span> 제품 정보를 수정합니다.
        </p>
      </div>
      <AdminUploadForm productId={id} initialData={initialData} />
    </div>
  );
}
