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

  revalidatePath(`/products/${productId}`);
}
