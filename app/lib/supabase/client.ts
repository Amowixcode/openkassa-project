"use client";

import { createBrowserClient } from "@supabase/ssr";

let browserClient: ReturnType<typeof createBrowserClient> | undefined;
let hasWarnedAboutMissingEnv = false;

type BrowserSupabaseConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function getBrowserSupabaseConfig(): BrowserSupabaseConfig | null {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey =
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ??
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return null;
  }

  return {
    supabaseUrl,
    supabaseAnonKey,
  };
}

export function getBrowserSupabaseConfigError(): string | null {
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) {
    return "Missing required environment variable: NEXT_PUBLIC_SUPABASE_URL";
  }

  if (
    !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY &&
    !process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  ) {
    return "Missing required environment variable: NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)";
  }

  return null;
}

export function createClient() {
  if (browserClient) {
    return browserClient;
  }

  const config = getBrowserSupabaseConfig();

  if (!config) {
    const errorMessage =
      getBrowserSupabaseConfigError() ??
      "Supabase browser client is not configured.";

    if (!hasWarnedAboutMissingEnv) {
      console.warn(`[supabase] ${errorMessage}`);
      hasWarnedAboutMissingEnv = true;
    }

    return null;
  }

  browserClient = createBrowserClient(
    config.supabaseUrl,
    config.supabaseAnonKey
  );

  return browserClient;
}
