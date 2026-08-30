"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "🚀 Launches", href: "/launches" },
  { label: "📝 Dev Log", href: "/devlog" },
  { label: "🔥 Hot", href: "/hot" },
  { label: "❓ Why", href: "/about" },
];

export default function MobileNavTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => pathname.startsWith(href);

  return (
    <div className="border-b border-slate-200 bg-white lg:hidden dark:border-navy-800 dark:bg-navy-900">
      <div className="grid grid-cols-4 px-2">
        {TABS.map(({ label, href }) => (
          <Link
            key={href}
            href={href}
            className={`min-w-0 whitespace-nowrap border-b-2 px-1 py-2.5 text-center text-xs font-medium transition ${
              isActive(href)
                ? "border-blue-600 text-blue-700 dark:text-blue-400"
                : "border-transparent text-slate-500 hover:text-slate-900 dark:text-slate-400 dark:hover:text-slate-100"
            }`}
          >
            {label}
          </Link>
        ))}
      </div>
    </div>
  );
}
