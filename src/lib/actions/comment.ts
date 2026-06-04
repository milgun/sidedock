"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createComment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return;

  const productId = formData.get("product_id") as string;
  const content = (formData.get("content") as string)?.trim();

  if (!content || !productId) return;

  await supabase.from("comments").insert({
    user_id: user.id,
    product_id: productId,
    content,
  });

  // 댓글 알림 — 제품 제작자에게 (본인 제품 제외)
  const [{ data: product }, { data: actorProfile }] = await Promise.all([
    supabase
      .from("products")
      .select("maker_id, name")
      .eq("id", productId)
      .single(),
    supabase
      .from("profiles")
      .select("username, display_name")
      .eq("id", user.id)
      .single(),
  ]);

  if (product && product.maker_id !== user.id) {
    await supabase.from("notifications").insert({
      user_id: product.maker_id,
      type: "comment",
      payload: {
        product_id: productId,
        product_name: product.name,
        actor_id: user.id,
        actor_username:
          actorProfile?.display_name ?? actorProfile?.username ?? "누군가",
        comment_preview: content.slice(0, 100),
      },
    });
  }

  revalidatePath(`/products/${productId}`);
}
