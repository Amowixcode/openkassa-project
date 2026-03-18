import { NextResponse } from "next/server";

import { createClient, getServerSupabaseConfigError } from "../../../lib/supabase/server";

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

  if (!expenseId) {
    return NextResponse.json(
      {
        error: "Expense ID is required.",
      },
      { status: 400 }
    );
  }

  let payload: { action?: unknown };

  try {
    payload = (await request.json()) as { action?: unknown };
  } catch {
    return NextResponse.json(
      {
        error: "Request body must be valid JSON.",
      },
      { status: 400 }
    );
  }

  if (payload.action !== "withdraw") {
    return NextResponse.json(
      {
        error: "Unsupported expense action.",
      },
      { status: 400 }
    );
  }

  const { data: existingExpense, error: fetchError } = await authResult.supabase
    .from("expenses")
    .select("id, status")
    .eq("id", expenseId)
    .eq("user_id", authResult.user.id)
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

  if (existingExpense.status !== "pending") {
    return NextResponse.json(
      {
        error: "Only pending expenses can be withdrawn.",
      },
      { status: 400 }
    );
  }

  const { data, error } = await authResult.supabase
    .from("expenses")
    .update({
      status: "cancelled",
    })
    .eq("id", expenseId)
    .eq("user_id", authResult.user.id)
    .eq("status", "pending")
    .select("id, title, amount, expense_date, category, receipt_url, status, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    expense: data,
  });
}
