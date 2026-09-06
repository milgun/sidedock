"use client";

import { useState } from "react";
import { setDiscoveryPick } from "@/lib/actions/product";

export type DiscoveryProduct = {
  id: string;
  slug: string;
  name: string;
  tagline: string;
  thumbnail_url: string | null;
  created_at: string;
  is_discovery_pick: boolean;
  maker: { id: string; username: string; display_name: string | null; avatar_url: string | null } | null;
};

export default function DiscoveryClient({ products: initialProducts, scope }: { products: DiscoveryProduct[]; scope: "recent" | "all" }) {
  const [products, setProducts] = useState(initialProducts);
  const [processing, setProcessing] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handlePick = async (id: string) => {
    setProcessing(id);
    const result = await setDiscoveryPick(id);
    setProcessing(null);
    if (result.error) {
      setErrors((current) => ({ ...current, [id]: result.error! }));
      return;
    }
    setProducts((current) => current.map((product) => ({ ...product, is_discovery_pick: product.id === id })));
  };

  return (
    <section>
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
              <button type="button" onClick={() => handlePick(product.id)} disabled={processing === product.id || product.is_discovery_pick} className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition disabled:cursor-default disabled:opacity-60 ${product.is_discovery_pick ? "bg-blue-600 text-white" : "border border-slate-200 text-slate-600 hover:border-blue-300 hover:text-blue-600 dark:border-navy-700 dark:text-slate-300"}`}>{processing === product.id ? "선정 중..." : product.is_discovery_pick ? "선정됨" : "선정"}</button>
              {errors[product.id] && <p className="text-xs text-red-500">{errors[product.id]}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}