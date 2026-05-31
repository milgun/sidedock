"use server";

import { createClient } from "@/lib/supabase/server";

export async function toggleUpvote(
  productId: string
): Promise<{ success: boolean; hasUpvoted?: boolean }> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false };

  const { data: existing } = await supabase
    .from("upvotes")
    .select("id")
    .eq("user_id", user.id)
    .eq("product_id", productId)
    .maybeSingle();

  if (existing) {
    const { error } = await supabase
      .from("upvotes")
      .delete()
      .eq("id", existing.id);
    if (error) return { success: false };
    return { success: true, hasUpvoted: false };
  } else {
    const { error } = await supabase
      .from("upvotes")
      .insert({ user_id: user.id, product_id: productId });
    if (error) return { success: false };
    return { success: true, hasUpvoted: true };
  }
}
