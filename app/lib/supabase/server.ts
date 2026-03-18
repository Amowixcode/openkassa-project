import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

let hasWarnedAboutMissingEnv = false;

type ServerSupabaseConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

function getServerSupabaseConfig(): ServerSupabaseConfig | null {
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

export function getServerSupabaseConfigError(): string | null {
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

export async function createClient() {
  const cookieStore = await cookies();
  const config = getServerSupabaseConfig();

  if (!config) {
    const errorMessage =
      getServerSupabaseConfigError() ??
      "Supabase server client is not configured.";

    if (!hasWarnedAboutMissingEnv) {
      console.warn(`[supabase] ${errorMessage}`);
      hasWarnedAboutMissingEnv = true;
    }

    return null;
  }

  return createServerClient(config.supabaseUrl, config.supabaseAnonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components may not be able to write cookies directly.
        }
      },
    },
  });
}
