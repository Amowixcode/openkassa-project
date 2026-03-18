import { NextResponse } from "next/server";

import { createClient, getServerSupabaseConfigError } from "../../lib/supabase/server";

type CreateExpensePayload = {
  title?: unknown;
  amount?: unknown;
  date?: unknown;
  category?: unknown;
  receiptUrl?: unknown;
};

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
  const receiptUrl =
    typeof payload.receiptUrl === "string" ? payload.receiptUrl.trim() : "";

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

  if (receiptUrl && !URL.canParse(receiptUrl)) {
    return {
      error: "Receipt URL must be valid.",
    };
  }

  return {
    data: {
      title,
      amount,
      expense_date: date,
      category,
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

export async function GET() {
  const authResult = await getAuthenticatedUser();

  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  const { data, error } = await authResult.supabase
    .from("expenses")
    .select("id, title, amount, expense_date, category, receipt_url, status, created_at")
    .eq("user_id", authResult.user.id)
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

  return NextResponse.json({
    expenses: data,
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
      user_id: authResult.user.id,
    })
    .select("id, title, amount, expense_date, category, receipt_url, status, user_id, created_at")
    .single();

  if (error) {
    return NextResponse.json(
      {
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json(
    {
      expense: data,
    },
    { status: 201 }
  );
}
