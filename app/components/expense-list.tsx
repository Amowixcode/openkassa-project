"use client";

import { useEffect, useState } from "react";

type Expense = {
  id: string;
  title: string;
  amount: number;
  expense_date: string;
  category: string;
  receipt_url: string | null;
  status: "pending" | "approved" | "paid" | "cancelled";
  created_at: string;
};

const statusClasses: Record<Expense["status"], string> = {
  pending: "bg-amber-100 text-amber-800",
  approved: "bg-violet-100 text-violet-800",
  paid: "bg-emerald-100 text-emerald-800",
  cancelled: "bg-slate-200 text-slate-700",
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

export function ExpenseList() {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeExpenseId, setActiveExpenseId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function loadExpenses() {
    setError(null);

    try {
      const response = await fetch("/api/expenses", {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        expenses?: Expense[];
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to load expenses.");
        return;
      }

      setExpenses(payload.expenses ?? []);
    } catch {
      setError("Something went wrong while loading expenses.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void loadExpenses();
  }, []);

  useEffect(() => {
    function handleExpenseCreated() {
      setIsLoading(true);
      void loadExpenses();
    }

    window.addEventListener("expense-created", handleExpenseCreated);

    return () => {
      window.removeEventListener("expense-created", handleExpenseCreated);
    };
  }, []);

  async function handleWithdrawExpense(expenseId: string) {
    setError(null);
    setActiveExpenseId(expenseId);

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: "withdraw",
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to withdraw expense.");
        return;
      }

      await loadExpenses();
    } catch {
      setError("Something went wrong while withdrawing the expense.");
    } finally {
      setActiveExpenseId(null);
    }
  }

  return (
    <article className="rounded-[2rem] border border-[color:var(--border-soft)] bg-white/95 p-8 shadow-[var(--shadow-soft)] md:col-span-2">
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
          className="rounded-full border border-[color:var(--border-soft)] bg-[rgba(245,243,255,0.9)] px-4 py-2 text-sm font-medium text-[color:var(--foreground)] transition hover:border-[color:var(--accent)] hover:bg-white disabled:opacity-60"
          type="button"
          onClick={() => {
            setIsLoading(true);
            void loadExpenses();
          }}
          disabled={isLoading}
        >
          {isLoading ? "Loading..." : "Refresh"}
        </button>
      </div>

      {error ? (
        <p className="mt-6 rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      ) : null}

      {!error && isLoading ? (
        <p className="mt-6 rounded-2xl bg-[rgba(245,243,255,0.9)] px-4 py-6 text-sm text-[color:var(--muted)]">
          Loading expenses...
        </p>
      ) : null}

      {!error && !isLoading && expenses.length === 0 ? (
        <p className="mt-6 rounded-2xl bg-[rgba(245,243,255,0.9)] px-4 py-6 text-sm text-[color:var(--muted)]">
          No expenses yet. Submit your first expense with the form above.
        </p>
      ) : null}

      {!error && !isLoading && expenses.length > 0 ? (
        <div className="mt-6 overflow-hidden rounded-[1.5rem] border border-[color:var(--border-soft)]">
          <div className="overflow-x-auto">
            <table className="min-w-full border-collapse bg-white">
              <thead className="bg-[rgba(245,243,255,0.95)]">
                <tr className="text-left text-sm text-[color:var(--muted)]">
                  <th className="px-5 py-4 font-medium">Title</th>
                  <th className="px-5 py-4 font-medium">Category</th>
                  <th className="px-5 py-4 font-medium">Date</th>
                  <th className="px-5 py-4 font-medium">Amount</th>
                  <th className="px-5 py-4 font-medium">Receipt</th>
                  <th className="px-5 py-4 font-medium">Status</th>
                  <th className="px-5 py-4 font-medium">Action</th>
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
                        className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold capitalize ${statusClasses[expense.status] ?? "bg-slate-200 text-slate-700"}`}
                      >
                        {expense.status}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      {expense.status === "pending" ? (
                        <button
                          className="rounded-full border border-[color:var(--border-soft)] bg-[rgba(255,255,255,0.95)] px-3 py-1.5 text-xs font-semibold text-[color:var(--foreground)] transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:opacity-60"
                          type="button"
                          onClick={() => {
                            void handleWithdrawExpense(expense.id);
                          }}
                          disabled={activeExpenseId === expense.id}
                        >
                          {activeExpenseId === expense.id
                            ? "Withdrawing..."
                            : "Withdraw"}
                        </button>
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
