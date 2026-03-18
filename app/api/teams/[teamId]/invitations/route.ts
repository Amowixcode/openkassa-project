import { NextResponse } from "next/server";

import { createClient, getServerSupabaseConfigError } from "../../../../lib/supabase/server";

type InvitationPayload = {
  email?: unknown;
  role?: unknown;
};

type RouteContext = {
  params: Promise<{
    teamId: string;
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
          error: "You must be signed in to invite users.",
        },
        { status: 401 }
      ),
    };
  }

  return { supabase, user };
}

export async function POST(request: Request, context: RouteContext) {
  const authResult = await getAuthenticatedUser();

  if ("errorResponse" in authResult) {
    return authResult.errorResponse;
  }

  const { teamId } = await context.params;

  let payload: InvitationPayload;

  try {
    payload = (await request.json()) as InvitationPayload;
  } catch {
    return NextResponse.json(
      { error: "Request body must be valid JSON." },
      { status: 400 }
    );
  }

  const email = typeof payload.email === "string" ? payload.email.trim().toLowerCase() : "";
  const role =
    payload.role === "admin" || payload.role === "member"
      ? payload.role
      : "member";

  if (!email || !email.includes("@")) {
    return NextResponse.json(
      { error: "A valid email is required." },
      { status: 400 }
    );
  }

  const { data: membership, error: membershipError } = await authResult.supabase
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", authResult.user.id)
    .maybeSingle();

  if (membershipError) {
    return NextResponse.json(
      { error: membershipError.message },
      { status: 500 }
    );
  }

  if (!membership || membership.role !== "admin") {
    return NextResponse.json(
      { error: "Only admins can invite new users." },
      { status: 403 }
    );
  }

  const { data, error } = await authResult.supabase
    .from("team_invitations")
    .insert({
      team_id: teamId,
      inviter_user_id: authResult.user.id,
      invitee_email: email,
      role,
    })
    .select("id, invitee_email, role, status")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ invitation: data }, { status: 201 });
}
