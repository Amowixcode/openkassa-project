import Link from "next/link";
import { notFound } from "next/navigation";

import { TeamDetailPanel } from "../../../components/team-detail-panel";
import { createClient } from "../../../lib/supabase/server";

type TeamRow = {
  id: string;
  name: string;
};

type MemberRow = {
  user_id: string;
  user_email: string | null;
  role: "admin" | "member";
};

type InvitationRow = {
  id: string;
  invitee_email: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "revoked";
};

type PageContext = {
  params: Promise<{
    teamId: string;
  }>;
};

export default async function TeamDetailPage(context: PageContext) {
  const { teamId } = await context.params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase!.auth.getUser();

  const { data: membership } = await supabase!
    .from("team_members")
    .select("role")
    .eq("team_id", teamId)
    .eq("user_id", user!.id)
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (!membership) {
    notFound();
  }

  const { data: team } = await supabase!
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .maybeSingle();

  if (!(team as TeamRow | null)) {
    notFound();
  }

  const { data: members } = await supabase!
    .from("team_members")
    .select("user_id, user_email, role")
    .eq("team_id", teamId)
    .order("created_at", { ascending: true });

  const { data: invitations } = await supabase!
    .from("team_invitations")
    .select("id, invitee_email, role, status")
    .eq("team_id", teamId)
    .order("created_at", { ascending: false });

  return (
    <div className="space-y-6">
      <Link
        href="/dashboard/teams"
        className="inline-flex rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[#F8FAFC]"
      >
        Back to team overview
      </Link>

      <TeamDetailPanel
        teamId={teamId}
        teamName={(team as TeamRow).name}
        currentRole={membership.role}
        members={((members ?? []) as MemberRow[]).map((member) => ({
          userId: member.user_id,
          email: member.user_email,
          role: member.role,
        }))}
        invitations={((invitations ?? []) as InvitationRow[]).map((invitation) => ({
          id: invitation.id,
          inviteeEmail: invitation.invitee_email,
          role: invitation.role,
          status: invitation.status,
        }))}
      />
    </div>
  );
}
