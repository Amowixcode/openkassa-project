import { NextResponse } from "next/server";

import { createClient, getServerSupabaseConfigError } from "../../../lib/supabase/server";

type UpdateInvitationPayload = {
  action?: unknown;
};

type RouteContext = {
  params: Promise<{
    invitationId: string;
  }>;
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
          error: "You must be signed in to accept invitations.",
        },
        { status: 401 }
      ),
    };
  }

  return { supabase };
}

export async function PATCH(request: Request, context: RouteContext) {
  const authResult = await getAuthenticatedUser();

  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  const { invitationId } = await context.params;

  let payload: UpdateInvitationPayload;

  try {
    payload = (await request.json()) as UpdateInvitationPayload;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  if (payload.action !== "accept") {
    return NextResponse.json(
      { error: "Only action=accept is supported." },
      { status: 400 }
    );
  }

  const { data, error } = await authResult.supabase.rpc("accept_team_invitation", {
    invitation_id: invitationId,
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ teamId: data });
}
