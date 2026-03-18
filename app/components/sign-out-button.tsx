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
      className="w-full rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] px-4 py-2.5 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
      type="button"
      onClick={handleSignOut}
      disabled={isLoading}
    >
      {isLoading ? "Signing out..." : "Log out"}
    </button>
  );
}
