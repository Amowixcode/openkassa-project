"use client";

import { FormEvent, useState } from "react";

const categoryOptions = [
  "Food",
  "Transport",
  "Housing",
  "Utilities",
  "Health",
  "Entertainment",
  "Shopping",
  "Other",
] as const;

function getTodayDate() {
  return new Date().toISOString().slice(0, 10);
}

export function ExpenseForm() {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayDate);
  const [category, setCategory] = useState(categoryOptions[0]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch("/api/expenses", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          title,
          amount,
          date,
          category,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to save expense.");
        return;
      }

      setTitle("");
      setAmount("");
      setDate(getTodayDate());
      setCategory(categoryOptions[0]);
      setSuccessMessage("Expense saved successfully.");
    } catch {
      setError("Something went wrong while submitting the expense.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <article className="rounded-[2rem] border border-[color:var(--border-soft)] bg-[linear-gradient(180deg,rgba(255,255,255,0.96)_0%,rgba(245,243,255,0.96)_100%)] p-8 shadow-[var(--shadow-soft)]">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
          Expense Entry
        </p>
        <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
          Add an expense
        </h2>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Record a new expense with the amount, date, and category in one step.
        </p>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[color:var(--foreground)]">Title</span>
          <input
            className="w-full rounded-2xl border border-[color:var(--border-soft)] bg-white/85 px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:bg-white"
            type="text"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Coffee with client"
            required
          />
        </label>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm font-medium text-[color:var(--foreground)]">Amount</span>
            <input
              className="w-full rounded-2xl border border-[color:var(--border-soft)] bg-white/85 px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:bg-white"
              type="number"
              inputMode="decimal"
              min="0.01"
              step="0.01"
              value={amount}
              onChange={(event) => setAmount(event.target.value)}
              placeholder="0.00"
              required
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-[color:var(--foreground)]">Date</span>
            <input
              className="w-full rounded-2xl border border-[color:var(--border-soft)] bg-white/85 px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:bg-white"
              type="date"
              value={date}
              onChange={(event) => setDate(event.target.value)}
              required
            />
          </label>
        </div>

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[color:var(--foreground)]">Category</span>
          <select
            className="w-full rounded-2xl border border-[color:var(--border-soft)] bg-white/85 px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[color:var(--primary)] focus:bg-white"
            value={category}
            onChange={(event) => setCategory(event.target.value)}
            required
          >
            {categoryOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        {error ? (
          <p className="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-2xl bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <button
          className="w-full rounded-2xl bg-[image:var(--app-gradient)] px-4 py-3 text-sm font-semibold text-white shadow-[0_18px_40px_rgba(124,58,237,0.28)] transition hover:scale-[1.01] hover:shadow-[0_22px_48px_rgba(124,58,237,0.32)] disabled:cursor-not-allowed disabled:opacity-60"
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? "Saving expense..." : "Save expense"}
        </button>
      </form>
    </article>
  );
}
