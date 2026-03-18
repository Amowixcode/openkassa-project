"use client";

import Image from "next/image";
import { FormEvent, useEffect, useRef, useState } from "react";

import { createClient } from "../lib/supabase/client";
import { useSelectedTeam } from "./team-context";

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

type ExpenseFormProps = {
  onCreated: () => void;
};

export function ExpenseForm({ onCreated }: ExpenseFormProps) {
  const { selectedMembership, selectedTeamId } = useSelectedTeam();
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(getTodayDate);
  const [category, setCategory] = useState(categoryOptions[0]);
  const [receiptFile, setReceiptFile] = useState<File | null>(null);
  const [receiptPreviewUrl, setReceiptPreviewUrl] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingReceipt, setIsUploadingReceipt] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (receiptPreviewUrl) {
        URL.revokeObjectURL(receiptPreviewUrl);
      }
    };
  }, [receiptPreviewUrl]);

  async function uploadReceipt() {
    if (!receiptFile) {
      return null;
    }

    if (!selectedTeamId) {
      throw new Error("Select a team before uploading a receipt.");
    }

    const supabase = createClient();

    if (!supabase) {
      throw new Error("Supabase is not configured for receipt uploads.");
    }

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser();

    if (userError || !user) {
      throw new Error("You must be logged in to upload a receipt.");
    }

    const fileExtension = receiptFile.name.split(".").pop()?.toLowerCase() || "bin";
    const filePath = `${selectedTeamId}/${user.id}/${crypto.randomUUID()}.${fileExtension}`;

    setIsUploadingReceipt(true);

    const { error: uploadError } = await supabase.storage
      .from("expense-receipts")
      .upload(filePath, receiptFile, {
        cacheControl: "3600",
        upsert: false,
      });

    setIsUploadingReceipt(false);

    if (uploadError) {
      throw new Error(uploadError.message);
    }

    return filePath;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const receiptUrl = await uploadReceipt();
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
          teamId: selectedTeamId,
          receiptUrl,
        }),
      });

      const payload = (await response.json()) as {
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Unable to save expense.");
        return;
      }

      onCreated();
      setTitle("");
      setAmount("");
      setDate(getTodayDate());
      setCategory(categoryOptions[0]);
      setReceiptFile(null);
      setReceiptPreviewUrl(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      setSuccessMessage("Expense saved successfully.");
    } catch {
      setError("Something went wrong while submitting the expense.");
    } finally {
      setIsUploadingReceipt(false);
      setIsSubmitting(false);
    }
  }

  return (
    <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-6 shadow-[var(--shadow-soft)]">
      <div className="space-y-3">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
          Expense Entry
        </p>
        <h2 className="text-2xl font-semibold text-[color:var(--foreground)]">
          Add an expense
        </h2>
        <p className="text-sm leading-6 text-[color:var(--muted)]">
          Record a new expense for the active team with the amount, date, and
          category in one step.
        </p>
      </div>

      <div className="mt-4 rounded-lg border border-[#DBEAFE] bg-[#F8FAFC] px-4 py-3 text-sm text-[color:var(--muted)]">
        Creating expense in{" "}
        <span className="font-semibold text-[color:var(--foreground)]">
          {selectedMembership?.teamName ?? "No team selected"}
        </span>
      </div>

      <form className="mt-8 space-y-4" onSubmit={handleSubmit}>
        <label className="block space-y-2">
          <span className="text-sm font-medium text-[color:var(--foreground)]">Title</span>
          <input
            className="w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[#3B82F6]"
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
              className="w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[#3B82F6]"
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
              className="w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[#3B82F6]"
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
            className="w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[#3B82F6]"
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

        <label className="block space-y-2">
          <span className="text-sm font-medium text-[color:var(--foreground)]">
            Receipt
          </span>
          <input
            ref={fileInputRef}
            className="w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition file:mr-4 file:rounded-full file:border-0 file:bg-[#DBEAFE] file:px-4 file:py-2 file:font-medium file:text-[#1D4ED8] focus:border-[#3B82F6]"
            type="file"
            accept="image/*,.pdf,application/pdf"
            onChange={(event) => {
              const nextFile = event.target.files?.[0] ?? null;

              setReceiptFile(nextFile);

              if (!nextFile) {
                if (receiptPreviewUrl) {
                  URL.revokeObjectURL(receiptPreviewUrl);
                }
                setReceiptPreviewUrl(null);
                return;
              }

              if (nextFile.type === "application/pdf") {
                if (receiptPreviewUrl) {
                  URL.revokeObjectURL(receiptPreviewUrl);
                }
                setReceiptPreviewUrl(null);
                return;
              }

              if (receiptPreviewUrl) {
                URL.revokeObjectURL(receiptPreviewUrl);
              }
              setReceiptPreviewUrl(URL.createObjectURL(nextFile));
            }}
          />
          <p className="text-xs text-[color:var(--muted)]">
            Upload an image or PDF receipt to keep documentation with the expense.
          </p>
        </label>

        {receiptFile ? (
          <div className="rounded-lg border border-[color:var(--border-soft)] bg-white p-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-[color:var(--foreground)]">
                  Receipt preview
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  {receiptFile.name}
                </p>
              </div>
              <button
                className="rounded-full border border-[color:var(--border-soft)] bg-[#F8FAFC] px-3 py-1.5 text-xs font-medium text-[color:var(--foreground)] transition hover:bg-white"
                type="button"
                onClick={() => {
                  if (receiptPreviewUrl) {
                    URL.revokeObjectURL(receiptPreviewUrl);
                  }

                  setReceiptFile(null);
                  setReceiptPreviewUrl(null);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = "";
                  }
                }}
              >
                Remove file
              </button>
            </div>
            {receiptPreviewUrl ? (
              <div className="mt-4 overflow-hidden rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC]">
                <Image
                  src={receiptPreviewUrl}
                  alt="Receipt preview"
                  width={800}
                  height={500}
                  className="h-56 w-full object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="mt-4 rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] px-4 py-6 text-sm text-[color:var(--muted)]">
                PDF selected. Preview is not shown here, but the file will be uploaded
                with the expense.
              </div>
            )}
          </div>
        ) : null}

        {error ? (
          <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        {successMessage ? (
          <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
            {successMessage}
          </p>
        ) : null}

        <button
          className="w-full rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:cursor-not-allowed disabled:bg-[#E2E8F0] disabled:text-[#64748B]"
          type="submit"
          disabled={isSubmitting || isUploadingReceipt || !selectedTeamId}
        >
          {isSubmitting || isUploadingReceipt
            ? isUploadingReceipt
              ? "Uploading receipt..."
              : "Saving expense..."
            : "Save expense"}
        </button>
      </form>
    </article>
  );
}
