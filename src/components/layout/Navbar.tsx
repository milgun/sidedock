import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";
import NavbarTabs from "./NavbarTabs";

export default async function Navbar() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  let avatarUrl: string | null = null;
  let isAdmin = false;
  let username: string | null = null;
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, is_admin, username")
      .eq("id", user.id)
      .single();
    avatarUrl = profile?.avatar_url ?? null;
    isAdmin = profile?.is_admin === true;
    username = profile?.username ?? null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4">
        {/* Logo */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <Image
            src="/logo.svg"
            alt="Sidedock"
            width={28}
            height={30}
            className="h-7 w-auto"
          />
          <span className="font-mono text-lg font-bold tracking-tight text-navy-900">
            Sidedock
          </span>
        </Link>

        {/* Category Tabs */}
        <Suspense fallback={<div className="hidden h-9 flex-1 md:block" />}>
          <NavbarTabs />
        </Suspense>

        {/* Right: Submit + User */}
        <NavbarClient user={user} avatarUrl={avatarUrl} isAdmin={isAdmin} username={username} />
      </div>
    </header>
  );
}
