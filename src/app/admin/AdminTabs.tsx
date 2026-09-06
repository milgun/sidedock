"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  { href: "/admin/upload", label: "Hot Products 등록" },
  { href: "/admin/moderation", label: "심사 대기열" },
  { href: "/admin/discovery", label: "오늘의 발견" },
  { href: "/admin/claims", label: "소유권 요청" },
];

export default function AdminTabs({ pendingCount, claimCount }: { pendingCount: number; claimCount: number }) {
  const pathname = usePathname();

  return (
    <nav className="flex gap-1 overflow-x-auto" aria-label="관리자 설정">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`relative whitespace-nowrap border-b-2 px-3 py-3 text-sm font-semibold transition ${
              isActive
                ? "border-blue-600 text-blue-600 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400"
            }`}
          >
            {tab.label}
            {tab.href === "/admin/moderation" && pendingCount > 0 && (
              <span className="ml-1.5 rounded-full bg-amber-100 px-1.5 py-0.5 text-[10px] text-amber-700">{pendingCount}</span>
            )}
            {tab.href === "/admin/claims" && claimCount > 0 && (
              <span className="ml-1.5 rounded-full bg-blue-100 px-1.5 py-0.5 text-[10px] text-blue-700">{claimCount}</span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}