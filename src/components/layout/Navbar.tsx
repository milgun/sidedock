import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createClient, getUser } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";
import NavbarTabs from "./NavbarTabs";

export default async function Navbar() {
  const user = await getUser();

  let avatarUrl: string | null = null;
  let isAdmin = false;
  let username: string | null = null;
  if (user) {
    const supabase = await createClient();
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
            src="/logo.png"
            alt="Sidedock"
            width={120}
            height={72}
            className="h-7 w-auto"
            unoptimized
          />
          <Image
            src="/logo-text.png"
            alt="Sidedock"
            width={200}
            height={40}
            className="h-5 w-auto"
            unoptimized
          />
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
