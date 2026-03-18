import { redirect } from "next/navigation";

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
    <main className="min-h-screen bg-[linear-gradient(160deg,_#fff7ed_0%,_#ffffff_45%,_#f8fafc_100%)] px-6 py-10">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-10">
        <header className="flex flex-col gap-6 rounded-[2rem] border border-black/5 bg-white/80 p-8 shadow-[0_30px_80px_rgba(15,23,42,0.08)] backdrop-blur sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-3">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-amber-700">
              Authenticated Session
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-slate-900">
              Welcome to OpenKassa
            </h1>
            <p className="max-w-2xl text-base leading-7 text-slate-600">
              You are signed in and your Supabase session is being persisted with
              secure SSR-aware auth helpers.
            </p>
          </div>
          <SignOutButton />
        </header>

        <section className="grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <article className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-[0_24px_60px_rgba(15,23,42,0.06)]">
            <h2 className="text-xl font-semibold text-slate-900">User session</h2>
            <dl className="mt-6 space-y-5 text-sm">
              <div>
                <dt className="font-medium text-slate-500">Email</dt>
                <dd className="mt-1 text-base text-slate-900">{user.email}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">User ID</dt>
                <dd className="mt-1 break-all font-mono text-xs text-slate-700">
                  {user.id}
                </dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Last sign in</dt>
                <dd className="mt-1 text-base text-slate-900">
                  {user.last_sign_in_at
                    ? new Date(user.last_sign_in_at).toLocaleString()
                    : "Not available"}
                </dd>
              </div>
            </dl>
          </article>

          <article className="rounded-[2rem] border border-amber-200 bg-amber-50 p-8">
            <h2 className="text-xl font-semibold text-slate-900">What is active</h2>
            <ul className="mt-5 space-y-3 text-sm leading-6 text-slate-700">
              <li>Sign up with Supabase email/password auth</li>
              <li>Log in with persisted browser session</li>
              <li>Protected routes through Next middleware</li>
              <li>Server-side user checks for dashboard rendering</li>
              <li>Log out with immediate redirect back to login</li>
            </ul>
          </article>
        </section>
      </div>
    </main>
  );
}
