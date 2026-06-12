"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const TABS = [
  { label: "🔥 Hot Products", href: "/hot" },
  { label: "🚀 Launches",     href: "/launches" },
  { label: "📝 Dev Log",      href: "/devlog" },
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
              ? "bg-navy-900 text-white"
              : "text-slate-500 hover:bg-slate-100 hover:text-slate-900"
          }`}
        >
          {label}
        </Link>
      ))}
    </nav>
  );
}