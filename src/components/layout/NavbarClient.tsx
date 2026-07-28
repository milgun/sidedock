"use client";

import Link from "next/link";
import Image from "next/image";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import type { User } from "@supabase/supabase-js";
import NotificationBell from "./NotificationBell";
import QuickSearch from "./QuickSearch";

interface NavbarClientProps {
  user: User | null;
  avatarUrl: string | null;
  isAdmin: boolean;
  username: string | null;
}

export default function NavbarClient({ user, avatarUrl, isAdmin, username }: NavbarClientProps) {
  const router = useRouter();
  const supabase = createClient();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    setOpen(false);
    router.refresh();
  };

  return (
    <div className="flex flex-shrink-0 items-center gap-2">
      <QuickSearch />

      {/* Submit CTA */}
      <Link
        href="/submit"
        className="rounded-full bg-blue-600 px-4 py-1.5 text-sm font-semibold text-white transition hover:bg-blue-700"
      >
        + 등록
      </Link>

      {/* Login / Profile */}
      {!user ? (
        <Link
          href="/login"
          className="rounded-full border border-slate-200 px-4 py-1.5 text-sm font-medium text-slate-700 transition hover:border-slate-400 dark:border-navy-700 dark:text-slate-200 dark:hover:border-navy-600"
        >
          로그인
        </Link>
      ) : (
        <>
          {/* Notification Bell */}
          <NotificationBell user={user} />

          <div className="relative" ref={ref}>
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full ring-2 ring-slate-200 transition hover:ring-blue-400 dark:ring-navy-700"
            >
              {avatarUrl ? (
                <Image
                  src={avatarUrl}
                  alt="프로필"
                  width={32}
                  height={32}
                  className="h-full w-full object-cover"
                />
              ) : (
                <span className="flex h-full w-full items-center justify-center bg-navy-900 text-xs font-bold text-white">
                  {(user.email || "U")[0].toUpperCase()}
                </span>
              )}
            </button>

            {open && (
              <div className="absolute right-0 top-10 z-50 w-48 overflow-hidden rounded-xl border border-slate-100 bg-white shadow-xl dark:border-navy-800 dark:bg-navy-900">
                <div className="border-b border-slate-100 px-4 py-2.5 dark:border-navy-800">
                  <p className="truncate text-xs text-slate-400">{user.email}</p>
                </div>
                <Link
                  href={`/profile/${username ?? user.id}`}
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-navy-800"
                >
                  내 프로필
                </Link>
                <Link
                  href="/submit"
                  onClick={() => setOpen(false)}
                  className="block px-4 py-2 text-sm text-slate-700 hover:bg-slate-50 dark:text-slate-200 dark:hover:bg-navy-800"
                >
                  제품 등록
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin/upload"
                    onClick={() => setOpen(false)}
                    className="block px-4 py-2 text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-navy-800"
                  >
                    🛠 Hot Products 등록
                  </Link>
                )}
                <button
                  onClick={handleSignOut}
                  className="w-full px-4 py-2 text-left text-sm text-red-500 hover:bg-red-50 dark:hover:bg-navy-800"
                >
                  로그아웃
                </button>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}

