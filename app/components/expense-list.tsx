"use client";

export type ExpenseListItem = {
  id: string;
  user_id: string;
  title: string;
  amount: number;
  expense_date: string;
  category: string;
  receipt_url: string | null;
  status: "pending" | "approved" | "rejected";
  created_at: string;
};

type ExpenseListProps = {
  expenses: ExpenseListItem[];
  isLoading: boolean;
  error: string | null;
  role: "admin" | "member";
  activeExpenseId: string | null;
  onRefresh: () => void;
  onStatusChange: (expenseId: string, status: "approved" | "rejected") => void;
};

const statusClasses: Record<ExpenseListItem["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-emerald-100 text-emerald-800",
  rejected: "bg-rose-100 text-rose-700",
};

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
  }).format(amount);
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("nb-NO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  }).format(new Date(value));
}

export function ExpenseList({
  expenses,
  isLoading,
  error,
  role,
  activeExpenseId,
  onRefresh,
  onStatusChange,
}: ExpenseListProps) {
  return (
    <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-6 shadow-[var(--shadow-soft)] md:col-span-2">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
            Submitted Expenses
          </p>
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
            Expense overview
          </h2>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Review all submitted expenses and track their approval status.
          </p>
        </div>
        <button
          className="rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:bg-white disabled:opacity-60"
          type="button"
          onClick={onRefresh}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <p className="mt-6 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!error && isLoading ? (
        <p className="mt-6 rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] px-4 py-6 text-sm text-[color:var(--muted)]">
          Loading expenses...
        </p>
      ) : null}

      {!error && !isLoading && expenses.length === 0 ? (
        <p className="mt-6 rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] px-4 py-6 text-sm text-[color:var(--muted)]">
          No expenses yet for this team. Submit the first one with the form above.
        </p>
      ) : null}

      {!error && !isLoading && expenses.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-lg border border-[color:var(--border-soft)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse bg-white">
              <thead className="bg-[#F8FAFC]">
                <tr className="text-left text-sm text-[color:var(--muted)]">
                  <th className="px-5 py-4 font-medium">Title</th>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Receipt</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((expense) => (
                  <tr
                    key={expense.id}
                    className="border-t border-[color:var(--border-soft)] text-sm text-[color:var(--foreground)]"
                  >
                    <td className="px-5 py-4 font-medium">{expense.title}</td>
                    <td className="px-5 py-4">{expense.category}</td>
                    <td className="px-5 py-4">{formatDate(expense.expense_date)}</td>
                    <td className="px-5 py-4">{formatCurrency(expense.amount)}</td>
                    <td className="px-5 py-4">
                      {expense.receipt_url ? (
                        <a
                          className="font-medium text-[color:var(--primary)] underline-offset-4 hover:underline"
                          href={expense.receipt_url}
                          target="_blank"
                          rel="noreferrer"
                        >
                          Open receipt
                        </a>
                      ) : (
                        <span className="text-[color:var(--muted)]">No file</span>
                      )}
                    </td>
                    <td className="px-5 py-4">
                      <span
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses[expense.status]}`}
                      >
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {role === "admin" && expense.status === "pending" ? (
                        <div className="flex gap-2">
                          <button
                            className="rounded-full border border-[#D1FAE5] bg-[#D1FAE5] px-3 py-1.5 text-xs font-semibold text-[#059669] transition hover:bg-[#ECFDF5] disabled:opacity-60"
                            type="button"
                            onClick={() => {
                              onStatusChange(expense.id, "approved");
                            }}
                            disabled={activeExpenseId === expense.id}
                          >
                            {activeExpenseId === expense.id ? "Saving..." : "Approve"}
                          </button>
                          <button
                            className="rounded-full border border-[#FECACA] bg-[#FEF2F2] px-3 py-1.5 text-xs font-semibold text-[#EF4444] transition hover:bg-[#FEE2E2] disabled:opacity-60"
                            type="button"
                            onClick={() => {
                              onStatusChange(expense.id, "rejected");
                            }}
                            disabled={activeExpenseId === expense.id}
                          >
                            {activeExpenseId === expense.id ? "Saving..." : "Reject"}
                          </button>
                        </div>
                      ) : role === "member" ? (
                        <span className="text-[color:var(--muted)]">
                          Members cannot approve
                        </span>
                      ) : (
                        <span className="text-[color:var(--muted)]">-</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : null}
    </article>
  );
}
