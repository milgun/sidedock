import { createClient, getUser } from "@/lib/supabase/server";
import { notFound, redirect } from "next/navigation";
import Link from "next/link";
import DevlogEditor from "@/app/devlog/new/DevlogEditor";

export default async function DevlogEditPage(props: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await props.params;
  const supabase = await createClient();
  const user = await getUser();

  if (!user) redirect(`/login?next=/devlog/${id}/edit`);

  const { data: post } = await supabase
    .from("devlog_posts")
    .select("id, author_id, title, content, tags, thumbnail_url")
    .eq("id", id)
    .maybeSingle();

  if (!post) notFound();
  if (post.author_id !== user.id) notFound();

  const initialData = {
    title: post.title as string,
    content: post.content as string,
    tags: ((post.tags ?? []) as string[]).join(", "),
    thumbnail_url: (post.thumbnail_url as string | null) ?? null,
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-10">
      <div className="mb-6 flex items-center gap-2 text-sm text-slate-400">
        <Link href="/devlog" className="hover:text-blue-600">Dev Log</Link>
        <span>/</span>
        <Link href={`/devlog/${id}`} className="hover:text-blue-600 truncate max-w-xs">{initialData.title}</Link>
        <span>/</span>
        <span className="text-slate-600">수정</span>
      </div>

      <h1 className="mb-6 text-2xl font-black text-slate-900">Dev Log 수정</h1>

      <DevlogEditor mode="edit" postId={id} initialData={initialData} />
    </div>
  );
}
