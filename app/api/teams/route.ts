import { NextResponse } from "next/server";

import { createClient, getServerSupabaseConfigError } from "../../lib/supabase/server";

type CreateTeamPayload = {
  name?: unknown;
};

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
          error: "You must be signed in to create a team.",
        },
        { status: 401 }
      ),
    };
  }

  return { supabase };
}

export async function POST(request: Request) {
  const authResult = await getAuthenticatedUser();

  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  let payload: CreateTeamPayload;

  try {
    payload = (await request.json()) as CreateTeamPayload;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const name = typeof payload.name === "string" ? payload.name.trim() : "";

  if (!name) {
    return NextResponse.json(
      { error: "Team name is required." },
      { status: 400 }
    );
  }

  const { data, error } = await authResult.supabase.rpc("create_team", {
    team_name: name,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json(
    {
      team: data,
    },
    { status: 201 }
  );
}
