import { TeamAdminPanel } from "../../components/team-admin-panel";
import { createClient } from "../../lib/supabase/server";

type MembershipRow = {
  team_id: string;
  created_at: string;
  role: "admin" | "member";
  teams: { id: string; name: string } | { id: string; name: string }[] | null;
};

type InvitationRow = {
  id: string;
  role: "admin" | "member";
  team_id: string;
  teams: { id: string; name: string } | { id: string; name: string }[] | null;
};

function normalizeMemberships(rows: MembershipRow[]) {
  const membershipsByTeam = new Map<
    string,
    {
      teamId: string;
      teamName: string;
      role: "admin" | "member";
    }
  >();

  for (const membership of rows) {
    const team = Array.isArray(membership.teams)
      ? membership.teams[0]
      : membership.teams;

    if (!team || membershipsByTeam.has(membership.team_id)) {
      continue;
    }

    membershipsByTeam.set(membership.team_id, {
      teamId: membership.team_id,
      teamName: team.name,
      role: membership.role,
    });
  }

  return Array.from(membershipsByTeam.values());
}

export default async function TeamsPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { data: membershipsData } = await supabase!
    .from("team_members")
    .select("team_id, created_at, role, teams(id, name)")
    .eq("user_id", user?.id ?? "")
    .order("created_at", { ascending: false });

  const { data: invitationsData } = await supabase!
    .from("team_invitations")
    .select("id, role, team_id, teams(id, name)")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  const invitations = ((invitationsData ?? []) as InvitationRow[]).flatMap(
    (invitation) => {
      const team = Array.isArray(invitation.teams)
        ? invitation.teams[0]
        : invitation.teams;

      if (!team) {
        return [];
      }

      return [
        {
          id: invitation.id,
          teamId: invitation.team_id,
          teamName: team.name,
          role: invitation.role,
        },
      ];
    }
  );

  const memberships = normalizeMemberships((membershipsData ?? []) as MembershipRow[]);

  return <TeamAdminPanel invitations={invitations} memberships={memberships} />;
}
