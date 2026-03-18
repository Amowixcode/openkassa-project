import { NextResponse } from "next/server";

import { createClient, getServerSupabaseConfigError } from "../../lib/supabase/server";

type CreateExpensePayload = {
  title?: unknown;
  amount?: unknown;
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

  return {
    data: {
      title,
      amount,
    },
  };
}

export async function POST(request: Request) {
  const supabase = await createClient();

  if (!supabase) {
    return NextResponse.json(
      {
        error:
          getServerSupabaseConfigError() ??
          "Supabase server client is not configured.",
      },
      { status: 500 }
    );
  }

  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return NextResponse.json(
      {
        error: "You must be logged in to add an expense.",
      },
      { status: 401 }
    );
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

  const { data, error } = await supabase
    .from("expenses")
    .insert({
      title: validationResult.data.title,
      amount: validationResult.data.amount,
      user_id: user.id,
    })
    .select("id, title, amount, user_id, created_at")
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
