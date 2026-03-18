"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { FormEvent, useState } from "react";

import {
  createClient,
  getBrowserSupabaseConfigError,
} from "../lib/supabase/client";

type AuthMode = "login" | "signup";

type AuthFormProps = {
  mode: AuthMode;
};

const content = {
  login: {
    title: "Welcome back",
    subtitle: "Log in to continue to your OpenKassa dashboard.",
    buttonLabel: "Log in",
    alternateLabel: "Need an account?",
    alternateHref: "/signup",
    alternateAction: "Create one",
  },
  signup: {
    title: "Create your account",
    subtitle: "Sign up with your email and password to start using OpenKassa.",
    buttonLabel: "Create account",
    alternateLabel: "Already have an account?",
    alternateHref: "/login",
    alternateAction: "Log in",
  },
} satisfies Record<
  AuthMode,
  {
    title: string;
    subtitle: string;
    buttonLabel: string;
    alternateLabel: string;
    alternateHref: string;
    alternateAction: string;
  }
>;

export function AuthForm({
  mode,
}: AuthFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const nextPath = searchParams.get("next") || "/dashboard";
  const currentContent = content[mode];
  const configError = getBrowserSupabaseConfigError();
  const hasSupabaseConfig = !configError;

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!hasSupabaseConfig) {
      setError(configError ?? "Supabase environment variables are missing.");
      return;
    }

    if (mode === "signup" && password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const supabase = createClient();

    if (!supabase) {
      setError(configError ?? "Supabase environment variables are missing.");
      return;
    }

    setError(null);
    setMessage(null);
    setIsSubmitting(true);

    const credentials = {
      email,
      password,
    };

    const result =
      mode === "login"
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

    setIsSubmitting(false);

    if (result.error) {
      setError(result.error.message);
      return;
    }

    if (mode === "signup" && !result.data.session) {
      setMessage(
        "Account created. Check your email to confirm your address before logging in."
      );
      return;
    }

    router.replace(nextPath);
    router.refresh();
  }

  return (
    <div className="w-full max-w-md rounded-lg border border-[color:var(--border-soft)] bg-[color:var(--card)] p-8 shadow-[var(--shadow-soft)]">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
          OpenKassa Auth
        </p>
        <h1 className="text-3xl font-semibold text-[color:var(--foreground)]">
          {currentContent.title}
        </h1>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          {currentContent.subtitle}
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[color:var(--foreground)]">Email</span>
          <input
            className="w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[#3B82F6]"
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="name@example.com"
            autoComplete="email"
            required
          />
        </label>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[color:var(--foreground)]">Password</span>
          <input
            className="w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[#3B82F6]"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            placeholder="Enter your password"
            autoComplete={mode === "login" ? "current-password" : "new-password"}
            minLength={6}
            required
          />
        </label>

        {mode === "signup" ? (
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[color:var(--foreground)]">
              Confirm password
            </span>
            <input
              className="w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[#3B82F6]"
              type="password"
              value={confirmPassword}
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Repeat your password"
              autoComplete="new-password"
              minLength={6}
              required
            />
          </label>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {message ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {message}
          </p>
        ) : null}

        {!hasSupabaseConfig ? (
          <p className="rounded-lg bg-amber-50 px-4 py-3 text-sm text-amber-800">
            {configError}. Update <code>.env.local</code> and restart the dev
            server.
          </p>
        ) : null}

        <button
          className="w-full rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#64748B]"
          type="submit"
          disabled={isSubmitting || !hasSupabaseConfig}
        >
          {isSubmitting ? "Please wait..." : currentContent.buttonLabel}
        </button>
      </form>

      <p className="mt-6 text-sm text-[color:var(--muted)]">
        {currentContent.alternateLabel}{" "}
        <Link
          className="font-semibold text-[color:var(--primary)] transition hover:text-[color:var(--primary-deep)]"
          href={currentContent.alternateHref}
        >
          {currentContent.alternateAction}
        </Link>
      </p>
    </div>
  );
}
