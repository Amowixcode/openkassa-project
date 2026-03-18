type SupabaseConfig = {
  supabaseUrl: string;
  supabaseAnonKey: string;
};

export function getSupabaseConfig(): SupabaseConfig | null {
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

export function getSupabaseConfigError() {
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

export function requireSupabaseConfig(): SupabaseConfig {
  const config = getSupabaseConfig();

  if (!config) {
    throw new Error(
      getSupabaseConfigError() ?? "Missing Supabase environment variables."
    );
  }

  return config;
}
