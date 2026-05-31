"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { id: "about",    label: "소개" },
  { id: "activity", label: "활동" },
  { id: "products", label: "제품" },
  { id: "boost",    label: "업보트" },
  { id: "reviews",  label: "리뷰" },
  { id: "devlog",   label: "Dev Log" },
] as const;

export default function ProfileTabNav({
  username,
  activeTab,
  productCounts,
}: {
  username: string;
  activeTab: string;
  productCounts?: Record<string, number>;
}) {
  const pathname = usePathname();
  const base = pathname.split("?")[0];

  return (
    <nav className="mb-8 flex gap-1 border-b border-slate-100">
      {TABS.map((tab) => {
        const active = activeTab === tab.id;
        const count = productCounts?.[tab.id];
        return (
          <Link
            key={tab.id}
            href={`${base}?tab=${tab.id}`}
            className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium transition border-b-2 -mb-px ${
              active
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-400 hover:text-slate-600"
            }`}
          >
            {tab.label}
            {count !== undefined && count > 0 && (
              <span className={`rounded-full px-1.5 py-0.5 text-xs leading-none ${
                active ? "bg-slate-900 text-white" : "bg-slate-100 text-slate-400"
              }`}>
                {count}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}
