"use client";

import { useState } from "react";
import { setDiscoveryCopy, setDiscoveryPick } from "@/lib/actions/product";
import { DISCOVERY_COPY_MAX_LENGTH } from "@/lib/discovery-copy";

export type DiscoveryProduct = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  thumbnail_url: string | null;
  created_at: string;
  is_discovery_pick: boolean;
  curiosity_text: string | null;
  maker: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
};

export default function DiscoveryClient({ products: initialProducts, scope }: { products: DiscoveryProduct[]; scope: "recent" | "all" }) {
  const [products, setProducts] = useState(initialProducts);
  const [processing, setProcessing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [drafts, setDrafts] = useState<Record<string, string>>(
    () => Object.fromEntries(initialProducts.map((product) => [product.id, product.curiosity_text ?? ""])),
  );
  const [copyError, setCopyError] = useState<string | null>(null);
  const [copySaved, setCopySaved] = useState(false);
  const selectedProduct = products.find((product) => product.is_discovery_pick);

  const handlePick = async (id: string) => {
    setProcessing(id);
    setErrors((current) => ({ ...current, [id]: "" }));
    setCopyError(null);
    setCopySaved(false);
    try {
      const result = await setDiscoveryPick(id);
      if (result.error) {
        setErrors((current) => ({ ...current, [id]: result.error! }));
        return;
      }
      setProducts((current) => current.map((product) => ({ ...product, is_discovery_pick: product.id === id })));
    } catch (error) {
      console.error("Failed to select discovery product:", error);
      setErrors((current) => ({ ...current, [id]: "선정하지 못했습니다. 다시 시도해주세요." }));
    } finally {
      setProcessing(null);
    }
  };

  const handleSaveCopy = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!selectedProduct) return;
    const id = selectedProduct.id;
    const draft = drafts[id] ?? "";
    setProcessing(id);
    setCopyError(null);
    setCopySaved(false);
    try {
      const result = await setDiscoveryCopy(id, draft);
      if (result.error) {
        setCopyError(result.error);
        return;
      }
      setDrafts((current) => ({ ...current, [id]: draft.trim() }));
      setCopySaved(true);
    } catch (error) {
      console.error("Failed to save discovery copy:", error);
      setCopyError("문구를 저장하지 못했습니다. 다시 시도해주세요.");
    } finally {
      setProcessing(null);
    }
  };

  return (
    <section>
      {selectedProduct && (
        <form onSubmit={handleSaveCopy} className="mb-6 rounded-xl border border-blue-100 bg-blue-50/50 p-4 dark:border-navy-700 dark:bg-navy-800/50">
          <label htmlFor="discovery-copy" className="block text-sm font-semibold text-slate-900 dark:text-slate-100">
            {selectedProduct.name} · 호기심 문구
          </label>
          <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
            확인된 내용을 바탕으로 자유롭게 작성하세요. 비워서 저장하면 기존 소개가 표시됩니다.
          </p>
          <textarea
            id="discovery-copy"
            value={drafts[selectedProduct.id] ?? ""}
            onChange={(event) => {
              setDrafts((current) => ({ ...current, [selectedProduct.id]: event.target.value }));
              setCopySaved(false);
            }}
            disabled={processing !== null}
            maxLength={DISCOVERY_COPY_MAX_LENGTH}
            rows={3}
            placeholder="이 제품에서 궁금해할 만한 이야기를 소개해주세요."
            className="mt-3 w-full resize-y rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-900 dark:border-navy-700 dark:bg-navy-900 dark:text-slate-100"
          />
          <div className="mt-2 flex items-center justify-between gap-3">
            <span className="text-xs text-slate-500 dark:text-slate-400">{(drafts[selectedProduct.id] ?? "").length}/{DISCOVERY_COPY_MAX_LENGTH}</span>
            <button type="submit" disabled={processing !== null} className="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-60">
              {processing === selectedProduct.id ? "저장 중..." : "문구 저장"}
            </button>
          </div>
          {copyError && <p role="alert" className="mt-2 text-xs text-red-600 dark:text-red-400">{copyError}</p>}
          {copySaved && <p role="status" className="mt-2 text-xs text-green-700 dark:text-green-400">문구를 저장했습니다.</p>}
        </form>
      )}
      <div className="mb-4 flex items-center justify-between gap-4">
        <p className="text-sm text-slate-500 dark:text-slate-400">{scope === "recent" ? "최근 20개 Launches를 표시합니다." : `전체 ${products.length}개 Launches를 표시합니다.`}</p>
        <div className="flex rounded-lg border border-slate-200 p-0.5 dark:border-navy-700">
          <a href="/admin/discovery" className={`rounded-md px-3 py-1.5 text-xs font-semibold ${scope === "recent" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>최근 20개</a>
          <a href="/admin/discovery?scope=all" className={`rounded-md px-3 py-1.5 text-xs font-semibold ${scope === "all" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-300"}`}>전체 조회</a>
        </div>
      </div>
      {products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 py-10 text-center text-sm text-slate-400 dark:border-navy-700">공개된 Launches 제품이 없습니다.</div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-100 bg-white dark:border-navy-800 dark:bg-navy-900">
          {products.map((product) => (
            <div key={product.id} className="flex items-center gap-3 border-b border-slate-100 px-4 py-3 last:border-0 dark:border-navy-800">
              <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center overflow-hidden rounded-lg bg-slate-100 dark:bg-navy-800">
                {product.thumbnail_url ? <img src={product.thumbnail_url} alt="" className="h-full w-full object-cover" /> : <span className="font-bold text-slate-400">{product.name[0]?.toUpperCase()}</span>}
              </div>
              <div className="min-w-0 flex-1"><p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-200">{product.name}</p><p className="truncate text-xs text-slate-400">@{product.maker?.username ?? "maker"}</p></div>
              <button type="button" onClick={() => handlePick(product.id)} disabled={processing !== null || product.is_discovery_pick} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default disabled:opacity-60 ${product.is_discovery_pick ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-navy-700 dark:text-slate-300"}`}>{processing === product.id && !product.is_discovery_pick ? "선정 중..." : product.is_discovery_pick ? "선정됨" : "선정"}</button>
              {errors[product.id] && <p className="text-xs text-red-500">{errors[product.id]}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}