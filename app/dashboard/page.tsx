import { DashboardShell } from "../components/dashboard-shell";
export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-6 shadow-[var(--shadow-soft)]">
        <div className="space-y-3">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
            Expense Dashboard
          </p>
          <h1 className="text-3xl font-semibold tracking-tight text-[color:var(--foreground)]">
            Team expenses
          </h1>
          <p className="max-w-3xl text-base leading-7 text-[color:var(--muted)]">
            Choose the active team in the sidebar, submit expenses, and follow
            approvals with role-based access.
          </p>
        </div>
      </article>

      <DashboardShell />
    </div>
  );
}
