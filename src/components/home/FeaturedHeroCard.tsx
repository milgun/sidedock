import Link from "next/link";
import Image from "next/image";
import type { ProductWithMaker } from "@/types";
import { CATEGORY_LABELS } from "@/components/product/ProductCard";

interface FeaturedHeroCardProps {
  product: ProductWithMaker;
}

export default function FeaturedHeroCard({ product }: FeaturedHeroCardProps) {
  const label = product.featured_label || "에디터 픽";

  return (
    <Link href={`/products/${product.slug}`} className="block group">
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-navy-900 via-navy-800 to-blue-700 p-6 sm:p-8 text-white transition ring-1 ring-white/5 group-hover:ring-cyan-400/30">
        {/* bg glows */}
        <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="pointer-events-none absolute -left-10 bottom-0 h-48 w-48 rounded-full bg-blue-500/10 blur-2xl" />

        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Left: info */}
          <div className="flex-1 min-w-0">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-400/20 px-3 py-1 text-xs font-bold text-amber-300 ring-1 ring-amber-400/30 mb-4">
              ⭐ {label}
            </span>

            <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white leading-tight">
              {product.name}
            </h2>
            <p className="mt-2 text-sm sm:text-base text-slate-300 line-clamp-2">
              {product.tagline}
            </p>

            <div className="mt-4 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-medium text-slate-200">
                {CATEGORY_LABELS[product.category] ?? product.category}
              </span>
              <span className="text-xs text-slate-400">
                🚀 {product.upvote_count.toLocaleString()} Boost
              </span>
            </div>

            <div className="mt-5">
              <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/15 px-4 py-2 text-sm font-semibold text-white transition group-hover:bg-white/25">
                자세히 보기 →
              </span>
            </div>
          </div>

          {/* Right: thumbnail */}
          {product.thumbnail_url && (
            <div className="w-full sm:w-44 h-36 flex-shrink-0 overflow-hidden rounded-xl ring-2 ring-white/10">
              <Image
                src={product.thumbnail_url}
                alt={product.name}
                width={176}
                height={144}
                className="h-full w-full object-cover transition group-hover:scale-105"
              />
            </div>
          )}
        </div>
      </div>
    </Link>
  );
}
