import { createClient, getUser } from "@/lib/supabase/server";
import type { ProductWithMaker } from "@/types";
import HotProductsClient from "@/components/hot/HotProductsClient";

export default async function HotProductsPage(props: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category = "" } = await props.searchParams;
  const supabase = await createClient();
  const user = await getUser();

  let query = supabase
    .from("products")
    .select("*, maker:profiles(id, username, avatar_url, display_name)")
    .eq("source", "curated")
    .eq("status", "published")
    .order("upvote_count", { ascending: false })
    .limit(50);

  if (category) query = query.eq("category", category);

  const [{ data: rawProducts }, { data: upvotes }] = await Promise.all([
    query,
    user
      ? supabase.from("upvotes").select("product_id").eq("user_id", user.id)
      : Promise.resolve({ data: [] as { product_id: string }[] }),
  ]);

  const upvotedIds = new Set<string>(
    (upvotes ?? []).map((u: { product_id: string }) => u.product_id),
  );

  type RawProduct = Record<string, unknown>;
  const initialProducts = (rawProducts ?? []).map(
    (p) =>
      ({
        ...p,
        has_upvoted: upvotedIds.has((p as RawProduct).id as string),
      }) as unknown as ProductWithMaker,
  );

  return (
    <div className="mx-auto max-w-3xl px-4 py-10">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900">🔥 Hot Products</h1>
        <p className="mt-1 text-slate-500">
          가장 유용하고 인기 있는 제품들을 만나보세요.
        </p>
      </div>

      <HotProductsClient
        initialCategory={category}
        initialProducts={initialProducts}
        userId={user?.id ?? null}
      />
    </div>
  );
}

