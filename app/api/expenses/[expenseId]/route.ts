import { NextResponse } from "next/server";

import { createClient, getServerSupabaseConfigError } from "../../../lib/supabase/server";

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
  team_id?: string;
};

type UpdateExpensePayload = {
  status?: unknown;
};

const uuidPattern =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

function isUuid(value: string) {
  return uuidPattern.test(value);
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
          error: "You must be logged in to update expenses.",
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

async function withSignedReceiptUrl(
  supabase: NonNullable<Awaited<ReturnType<typeof createClient>>>,
  expense: ExpenseRecord
) {
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
}

type RouteContext = {
  params: Promise<{
    expenseId: string;
  }>;
};

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await getAuthenticatedUser();

  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  const { expenseId } = await context.params;

  if (!expenseId || !isUuid(expenseId)) {
    return NextResponse.json(
      {
        error: "A valid expense ID is required.",
      },
      { status: 400 }
    );
  }

  let payload: UpdateExpensePayload;

  try {
    payload = (await request.json()) as UpdateExpensePayload;
  } catch {
    return NextResponse.json(
      {
        error: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  if (payload.status !== "approved" && payload.status !== "rejected") {
    return NextResponse.json(
      {
        error: "Status must be either approved or rejected.",
      },
      { status: 400 }
    );
  }

  const { data: existingExpense, error: fetchError } = await authResult.supabase
    .from("expenses")
    .select("id, team_id, status")
    .eq("id", expenseId)
    .maybeSingle();

  if (fetchError) {
    return NextResponse.json(
      {
        error: fetchError.message,
      },
      { status: 500 }
    );
  }

  if (!existingExpense) {
    return NextResponse.json(
      {
        error: "Expense not found.",
      },
      { status: 404 }
    );
  }

  const { data: membership, error: membershipError } = await authResult.supabase
    .from("team_members")
    .select("role")
    .eq("team_id", existingExpense.team_id)
    .eq("user_id", authResult.user.id)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json(
      {
        error: membershipError.message,
      },
      { status: 500 }
    );
  }

  if (!membership || membership.role !== "admin") {
    return NextResponse.json(
      {
        error: "Only team admins can update expense status.",
      },
      { status: 403 }
    );
  }

  if (existingExpense.status !== "pending") {
    return NextResponse.json(
      {
        error: "Only pending expenses can be updated.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await authResult.supabase
    .from("expenses")
    .update({
      status: payload.status,
    })
    .eq("id", expenseId)
    .eq("status", "pending")
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

  const signedExpense = await withSignedReceiptUrl(
    authResult.supabase,
    data as ExpenseRecord
  );

  return NextResponse.json({
    expense: signedExpense,
  });
}
