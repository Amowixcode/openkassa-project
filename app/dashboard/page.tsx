import { redirect } from "next/navigation";

import { ExpenseForm } from "../components/expense-form";
import { SignOutButton } from "../components/sign-out-button";
import { createClient } from "../lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="relative min-h-screen overflow-hidden px-6 py-10">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_15%_0%,rgba(124,58,237,0.18),transparent_24%),radial-gradient(circle_at_100%_10%,rgba(59,130,246,0.18),transparent_22%),linear-gradient(180deg,#f8f5ff_0%,#f5f3ff_55%,#eef4ff_100%)]" />
      <div className="absolute left-[-6rem] top-24 h-72 w-72 rounded-full bg-[rgba(124,58,237,0.14)] blur-3xl" />
      <div className="absolute bottom-0 right-[-6rem] h-80 w-80 rounded-full bg-[rgba(59,130,246,0.12)] blur-3xl" />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="relative flex flex-col gap-6 overflow-hidden rounded-[2rem] border border-[color:var(--border-soft)] bg-[linear-gradient(135deg,rgba(124,58,237,0.94)_0%,rgba(59,130,246,0.9)_100%)] p-8 text-white shadow-[0_30px_80px_rgba(76,29,149,0.22)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="absolute right-0 top-0 h-48 w-48 translate-x-12 -translate-y-12 rounded-full bg-white/10 blur-3xl" />
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-white/80">
              Authenticated Session
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Welcome to OpenKassa
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/80">
              Track spending in a calmer, brighter workspace with us.
            </p>
          </div>
          <SignOutButton />
        </header>

        <section className="relative grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <ExpenseForm />

          <article className="rounded-[2rem] border border-[color:var(--border-soft)] bg-white/95 p-8 shadow-[var(--shadow-soft)]">
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
              User session
            </h2>
            <dl className="mt-6 space-y-5 text-sm">
              <div>
                <dt className="font-medium text-[color:var(--muted)]">Email</dt>
                <dd className="mt-1 text-base text-[color:var(--foreground)]">
                  {user.email}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[color:var(--muted)]">User ID</dt>
                <dd className="mt-1 break-all font-mono text-xs text-[color:var(--foreground)]/80">
                  {user.id}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-[color:var(--muted)]">Last sign in</dt>
                <dd className="mt-1 text-base text-[color:var(--foreground)]">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "Not available"}
                </dd>
              </div>
            </dl>
          </article>
          <article className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[linear-gradient(135deg,rgba(255,255,255,0.9)_0%,rgba(233,244,255,0.9)_100%)] p-8 shadow-[var(--shadow-soft)] md:col-span-2">
            <h2 className="text-xl font-semibold text-[color:var(--foreground)]">
              What is active
            </h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-[color:var(--foreground)]/80">
              <li>Sign up with Supabase email/password auth</li>
              <li>Log in with persisted browser session</li>
              <li>Protected routes through Next middleware</li>
              <li>Server-side user checks for dashboard rendering</li>
              <li>Log out with immediate redirect back to login</li>
              <li>Create expenses through a protected backend API route</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
