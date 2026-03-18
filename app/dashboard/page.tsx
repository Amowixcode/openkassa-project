import { redirect } from "next/navigation";

import { ExpenseForm } from "../components/expense-form";
import { ExpenseList } from "../components/expense-list";
import { SignOutButton } from "../components/sign-out-button";
import { createClient } from "../lib/supabase/server";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(amount);
}

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

  const { data: expenses } = await supabase
    .from("expenses")
    .select("amount, status")
    .eq("user_id", user.id);

  const safeExpenses = expenses ?? [];
  const totalExpenses = safeExpenses.length;
  const totalAmount = safeExpenses.reduce(
    (sum, expense) => sum + Number(expense.amount ?? 0),
    0
  );
  const pendingCount = safeExpenses.filter(
    (expense) => expense.status === "pending"
  ).length;
  const approvedCount = safeExpenses.filter(
    (expense) => expense.status === "approved"
  ).length;
  const paidCount = safeExpenses.filter((expense) => expense.status === "paid").length;
  const firstName =
    user.email?.split("@")[0].replace(/[._-]+/g, " ").trim() || "there";

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
              Expense Dashboard
            </p>
            <h1 className="text-4xl font-semibold tracking-tight text-white">
              Welcome back, {firstName}
            </h1>
            <p className="max-w-2xl text-base leading-7 text-white/80">
              Keep track of submissions, follow approval progress, and add new
              expenses without leaving the dashboard.
            </p>
          </div>
          <SignOutButton />
        </header>

        <section className="relative grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
          <ExpenseForm />

          <article className="rounded-[2rem] border border-[color:var(--border-soft)] bg-white/95 p-8 shadow-[var(--shadow-soft)]">
            <div className="space-y-2">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
                Quick Overview
              </p>
              <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
                Your spending snapshot
              </h2>
              <p className="text-sm leading-6 text-[color:var(--muted)]">
                A compact summary of what you have submitted so far.
              </p>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="rounded-[1.5rem] bg-[rgba(245,243,255,0.85)] p-5">
                <p className="text-sm text-[color:var(--muted)]">Total expenses</p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
                  {totalExpenses}
                </p>
              </div>
              <div className="rounded-[1.5rem] bg-[rgba(239,246,255,0.9)] p-5">
                <p className="text-sm text-[color:var(--muted)]">Total amount</p>
                <p className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
                  {formatCurrency(totalAmount)}
                </p>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              <div className="flex items-center justify-between rounded-[1.25rem] border border-[color:var(--border-soft)] px-4 py-3">
                <span className="text-sm text-[color:var(--muted)]">Pending review</span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
                  {pendingCount}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[1.25rem] border border-[color:var(--border-soft)] px-4 py-3">
                <span className="text-sm text-[color:var(--muted)]">Approved</span>
                <span className="rounded-full bg-violet-100 px-3 py-1 text-xs font-semibold text-violet-800">
                  {approvedCount}
                </span>
              </div>
              <div className="flex items-center justify-between rounded-[1.25rem] border border-[color:var(--border-soft)] px-4 py-3">
                <span className="text-sm text-[color:var(--muted)]">Paid out</span>
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
                  {paidCount}
                </span>
              </div>
            </div>

            <div className="mt-6 rounded-[1.5rem] bg-[linear-gradient(135deg,rgba(124,58,237,0.08)_0%,rgba(59,130,246,0.08)_100%)] p-5">
              <p className="text-sm font-semibold text-[color:var(--foreground)]">
                Helpful tip
              </p>
              <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
                Add clear titles and correct categories so approvals and payouts
                are easier to process later.
              </p>
            </div>
          </article>
          <ExpenseList />
        </section>
      </div>
    </main>
  );
}
