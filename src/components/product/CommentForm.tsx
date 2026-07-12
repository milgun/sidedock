"use client";

import { useRef, useTransition } from "react";
import { createComment } from "@/lib/actions/comment";

export default function CommentForm({ productId }: { productId: string }) {
  const formRef = useRef<HTMLFormElement>(null);
  const [isPending, startTransition] = useTransition();

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    formData.set("product_id", productId);
    startTransition(async () => {
      await createComment(formData);
      formRef.current?.reset();
    });
  };

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="mb-8">
      <textarea
        name="content"
        placeholder="이 제품에 대한 생각을 공유해 주세요…"
        rows={3}
        required
        className="w-full resize-none rounded-xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-900 placeholder-slate-400 transition focus:border-blue-400 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:border-navy-700 dark:bg-navy-800 dark:text-slate-100 dark:placeholder-slate-500"
      />
      <div className="mt-2 flex justify-end">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-xl bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-blue-700 disabled:opacity-50"
        >
          {isPending ? "작성 중…" : "댓글 작성"}
        </button>
      </div>
    </form>
  );
}
