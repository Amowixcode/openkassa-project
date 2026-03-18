"use client";

import { useEffect, useState } from "react";

import { ExpenseForm } from "./expense-form";
import { ExpenseList, ExpenseListItem } from "./expense-list";
import { useSelectedTeam } from "./team-context";

function formatCurrency(amount: number) {
  return new Intl.NumberFormat("nb-NO", {
    style: "currency",
    currency: "NOK",
    maximumFractionDigits: 0,
  }).format(amount);
}

function TeamDashboardContent() {
  const { memberships, selectedMembership, selectedTeamId } = useSelectedTeam();
  const [expenses, setExpenses] = useState<ExpenseListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeExpenseId, setActiveExpenseId] = useState<string | null>(null);

  async function loadExpenses(teamId: string) {
    setError(null);

    try {
      const response = await fetch(`/api/expenses?teamId=${encodeURIComponent(teamId)}`, {
        cache: "no-store",
      });
      const payload = (await response.json()) as {
        expenses?: ExpenseListItem[];
        error?: string;
      };

      if (!response.ok) {
        setExpenses([]);
        setError(payload.error ?? "Unable to load expenses.");
        return;
      }

      setExpenses(payload.expenses ?? []);
    } catch {
      setExpenses([]);
      setError("Something went wrong while loading expenses.");
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (!selectedTeamId) {
      setExpenses([]);
      setIsLoading(false);
      return;
    }

    setIsLoading(true);
    void loadExpenses(selectedTeamId);
  }, [selectedTeamId]);

  async function handleStatusChange(
    expenseId: string,
    status: "approved" | "rejected"
  ) {
    setError(null);
    setActiveExpenseId(expenseId);

    try {
      const response = await fetch(`/api/expenses/${expenseId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ status }),
      });
      const payload = (await response.json()) as {
        expense?: ExpenseListItem;
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to update expense status.");
        return;
      }

      setExpenses((currentExpenses) =>
        currentExpenses.map((expense) =>
          expense.id === expenseId ? payload.expense ?? expense : expense
        )
      );
    } catch {
      setError("Something went wrong while updating the expense status.");
    } finally {
      setActiveExpenseId(null);
    }
  }

  const totalExpenses = expenses.length;
  const totalAmount = expenses.reduce(
    (sum, expense) => sum + Number(expense.amount ?? 0),
    0
  );
  const pendingCount = expenses.filter((expense) => expense.status === "pending").length;
  const approvedCount = expenses.filter(
    (expense) => expense.status === "approved"
  ).length;
  const rejectedCount = expenses.filter(
    (expense) => expense.status === "rejected"
  ).length;

  if (!memberships.length) {
    return (
      <section className="rounded-lg border border-[color:var(--border-soft)] bg-white p-8 shadow-[var(--shadow-soft)]">
        <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
          No teams yet
        </h2>
        <p className="mt-3 text-sm leading-6 text-[color:var(--muted)]">
          Ask an admin to add you to a team before you start submitting expenses.
        </p>
      </section>
    );
  }

  return (
    <section className="relative grid gap-6 md:grid-cols-[1.2fr_0.8fr]">
      <div className="space-y-6">
        <ExpenseForm
          onCreated={() => {
            if (!selectedTeamId) {
              return;
            }

            setIsLoading(true);
            void loadExpenses(selectedTeamId);
          }}
        />

        <ExpenseList
          expenses={expenses}
          isLoading={isLoading}
          error={error}
          role={selectedMembership?.role ?? "member"}
          activeExpenseId={activeExpenseId}
          onRefresh={() => {
            if (!selectedTeamId) {
              return;
            }

            setIsLoading(true);
            void loadExpenses(selectedTeamId);
          }}
          onStatusChange={handleStatusChange}
        />
      </div>

      <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-6 shadow-[var(--shadow-soft)]">
        <div className="space-y-2">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
            Team Summary
          </p>
          <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
            Team spending snapshot
          </h2>
          <p className="text-sm leading-6 text-[color:var(--muted)]">
            Members can submit and review expenses. Admins can approve or reject them.
          </p>
        </div>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          <div className="rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] p-4">
            <p className="text-sm text-[color:var(--muted)]">Expenses</p>
            <p className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
              {totalExpenses}
            </p>
          </div>
          <div className="rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] p-4">
            <p className="text-sm text-[color:var(--muted)]">Total amount</p>
            <p className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
              {formatCurrency(totalAmount)}
            </p>
          </div>
        </div>

        <div className="mt-4 grid gap-3">
          <div className="flex items-center justify-between rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3">
            <span className="text-sm text-[color:var(--muted)]">Pending review</span>
            <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-semibold text-amber-800">
              {pendingCount}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3">
            <span className="text-sm text-[color:var(--muted)]">Approved</span>
            <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-semibold text-emerald-800">
              {approvedCount}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3">
            <span className="text-sm text-[color:var(--muted)]">Rejected</span>
            <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-700">
              {rejectedCount}
            </span>
          </div>
          <div className="flex items-center justify-between rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3">
            <span className="text-sm text-[color:var(--muted)]">Your role</span>
            <span className="rounded-full bg-[#DBEAFE] px-3 py-1 text-xs font-semibold capitalize text-[#1D4ED8]">
              {selectedMembership?.role ?? "member"}
            </span>
          </div>
        </div>

        <div className="mt-6 rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] p-4">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            Approval flow
          </p>
          <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
            Expenses start as pending. Only admins can move them to approved or
            rejected, and the database enforces that rule.
          </p>
        </div>
      </article>
    </section>
  );
}

export function DashboardShell() {
  return <TeamDashboardContent />;
}
