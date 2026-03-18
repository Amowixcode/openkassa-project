import { NextResponse } from "next/server";

import { createClient, getServerSupabaseConfigError } from "../../lib/supabase/server";

type ExpenseRecord = {
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

type CreateExpensePayload = {
  title?: unknown;
  amount?: unknown;
  date?: unknown;
  category?: unknown;
  teamId?: unknown;
  receiptUrl?: unknown;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return uuidPattern.test(value);
}

function validateExpenseInput(payload: CreateExpensePayload) {
  const title =
    typeof payload.title === "string" ? payload.title.trim() : "";
  const amount =
    typeof payload.amount === "number"
      ? payload.amount
      : typeof payload.amount === "string"
        ? Number(payload.amount)
        : NaN;
  const date =
    typeof payload.date === "string" ? payload.date.trim() : "";
  const category =
    typeof payload.category === "string" ? payload.category.trim() : "";
  const teamId =
    typeof payload.teamId === "string" ? payload.teamId.trim() : "";
  const receiptUrl =
    typeof payload.receiptUrl === "string" ? payload.receiptUrl.trim() : "";

  if (!teamId || !isUuid(teamId)) {
    return {
      error: "A valid teamId is required.",
    };
  }

  if (!title) {
    return {
      error: "Title is required.",
    };
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return {
      error: "Amount must be a number greater than 0.",
    };
  }

  if (!date || Number.isNaN(Date.parse(date))) {
    return {
      error: "Date is required.",
    };
  }

  if (!category) {
    return {
      error: "Category is required.",
    };
  }

  return {
    data: {
      title,
      amount,
      expense_date: date,
      category,
      team_id: teamId,
      receipt_url: receiptUrl || null,
    },
  };
}

async function getAuthenticatedUser() {
  const supabase = await createClient();

  if (!supabase) {
    return {
      errorResponse: NextResponse.json(
        {
          error:
            getServerSupabaseConfigError() ??
            "Supabase server client is not configured.",
        },
        { status: 500 }
      ),
    };
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      errorResponse: NextResponse.json(
        {
          error: "You must be logged in to access expenses.",
        },
        { status: 401 }
      ),
    };
  }

  return {
    supabase,
    user,
  };
}

async function withSignedReceiptUrls(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  expenses: ExpenseRecord[]
) {
  const signedExpenses = await Promise.all(
    expenses.map(async (expense) => {
      if (!expense.receipt_url) {
        return expense;
      }

      const { data, error } = await supabase.storage
        .from("expense-receipts")
        .createSignedUrl(expense.receipt_url, 60 * 60);

      if (error) {
        return {
          ...expense,
          receipt_url: null,
        };
      }

      return {
        ...expense,
        receipt_url: data.signedUrl,
      };
    })
  );

  return signedExpenses;
}

export async function GET(request: Request) {
  const authResult = await getAuthenticatedUser();

  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  const { searchParams } = new URL(request.url);
  const teamId = searchParams.get("teamId")?.trim() ?? "";

  if (!teamId || !isUuid(teamId)) {
    return NextResponse.json(
      {
        error: "A valid teamId query parameter is required.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await authResult.supabase
    .from("expenses")
    .select(
      "id, user_id, title, amount, expense_date, category, receipt_url, status, created_at"
    )
    .eq("team_id", teamId)
    .order("expense_date", { ascending: false })
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }

  const signedExpenses = await withSignedReceiptUrls(
    authResult.supabase,
    (data ?? []) as ExpenseRecord[]
  );

  return NextResponse.json({
    expenses: signedExpenses,
  });
}

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser();

  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  let payload: CreateExpensePayload;

  try {
    payload = (await request.json()) as CreateExpensePayload;
  } catch {
    return NextResponse.json(
      {
        error: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  const validationResult = validateExpenseInput(payload);

  if ("error" in validationResult) {
    return NextResponse.json(
      {
        error: validationResult.error,
      },
      { status: 400 }
    );
  }

  const { data, error } = await authResult.supabase
    .from("expenses")
    .insert({
      title: validationResult.data.title,
      amount: validationResult.data.amount,
      expense_date: validationResult.data.expense_date,
      category: validationResult.data.category,
      receipt_url: validationResult.data.receipt_url,
      team_id: validationResult.data.team_id,
      user_id: authResult.user.id,
      status: "pending",
    })
    .select(
      "id, user_id, title, amount, expense_date, category, receipt_url, status, created_at"
    )
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }

  const [signedExpense] = await withSignedReceiptUrls(authResult.supabase, [
    data as ExpenseRecord,
  ]);

  return NextResponse.json(
    {
      expense: signedExpense,
    },
    { status: 201 }
  );
}
