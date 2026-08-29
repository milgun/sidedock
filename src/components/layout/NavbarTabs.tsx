"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "🚀 Launches",     href: "/launches" },
  { label: "📝 Dev Log",      href: "/devlog" },
  { label: "🔥 Hot Products", href: "/hot" },
  { label: "❓ Why Sidedock", href: "/about" },
];

export default function NavbarTabs() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    return pathname.startsWith(href);
  };

  return (
    <nav className="hidden md:flex items-center gap-1">
      {TABS.map(({ label, href }) => (
        <Link
          key={href}
          href={href}
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition ${
            isActive(href)
              ? "bg-navy-900 text-white dark:bg-navy-700"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900 dark:text-slate-400 dark:hover:bg-navy-800 dark:hover:text-slate-100"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}