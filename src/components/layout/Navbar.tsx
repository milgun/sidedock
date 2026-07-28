import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createClient, getUser } from "@/lib/supabase/server";
import NavbarClient from "./NavbarClient";
import NavbarTabs from "./NavbarTabs";
import MobileNavTabs from "./MobileNavTabs";
import ThemeSync from "@/components/ThemeSync";

export default async function Navbar() {
  const user = await getUser();

  let avatarUrl: string | null = null;
  let isAdmin = false;
  let username: string | null = null;
  let themePref: string | null = null;
  if (user) {
    const supabase = await createClient();
    const { data: profile } = await supabase
      .from("profiles")
      .select("avatar_url, is_admin, username, theme_preference")
      .eq("id", user.id)
      .single();
    avatarUrl = profile?.avatar_url ?? null;
    isAdmin = profile?.is_admin === true;
    username = profile?.username ?? null;
    themePref = (profile?.theme_preference as string | null) ?? null;
  }

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/95 backdrop-blur-sm dark:border-navy-800 dark:bg-navy-900/95">
      {user && <ThemeSync serverTheme={themePref} />}
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-2 px-3 sm:gap-4 sm:px-4">
        {/* Logo */}
        <Link href="/" className="flex flex-shrink-0 items-center gap-2">
          <Image
            src="/logo.png"
            alt="Sidedock"
            width={120}
            height={72}
            className="h-7 w-auto dark:hidden"
            unoptimized
          />
          <Image
            src="/logo_white.png"
            alt="Sidedock"
            width={120}
            height={72}
            className="hidden h-7 w-auto dark:block"
            unoptimized
          />
          <Image
            src="/logo-text.png"
            alt="Sidedock"
            width={200}
            height={40}
            className="h-5 w-auto dark:hidden"
            unoptimized
          />
          <Image
            src="/logo-text_white.png"
            alt="Sidedock"
            width={200}
            height={40}
            className="hidden h-5 w-auto dark:block"
            unoptimized
          />
        </Link>

        {/* Category Tabs — desktop only */}
        <Suspense fallback={<div className="hidden h-9 flex-1 md:block" />}>
          <NavbarTabs />
        </Suspense>

        {/* Right: Submit + User */}
        <NavbarClient user={user} avatarUrl={avatarUrl} isAdmin={isAdmin} username={username} />
      </div>

      {/* Mobile tab bar — shown only below md breakpoint */}
      <MobileNavTabs />
    </header>
  );
}
