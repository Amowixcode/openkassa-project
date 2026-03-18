"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { createClient } from "../lib/supabase/client";

export function SignOutButton() {
  const router = useRouter();
  const supabase = createClient();
  const [isLoading, setIsLoading] = useState(false);

  async function handleSignOut() {
    if (!supabase) {
      console.warn("[supabase] Sign out skipped because Supabase is not configured.");
      router.replace("/login");
      router.refresh();
      return;
    }

    setIsLoading(true);
    await supabase.auth.signOut();
    router.replace("/login");
    router.refresh();
  }

  return (
    <button
      className="rounded-full border border-[color:var(--border-soft)] bg-white/75 px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-[rgba(245,243,255,0.95)] disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? "Signing out..." : "Log out"}
    </button>
  );
}
