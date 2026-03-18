import { redirect } from "next/navigation";

import { TeamProvider } from "../components/team-context";
import { WorkspaceSidebar } from "../components/workspace-sidebar";
import { createClient } from "../lib/supabase/server";

type MembershipRow = {
  team_id: string;
  created_at: string;
  role: "admin" | "member";
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

    if (!team) {
      continue;
    }

    if (!membershipsByTeam.has(membership.team_id)) {
      membershipsByTeam.set(membership.team_id, {
        teamId: membership.team_id,
        teamName: team.name,
        role: membership.role,
      });
    }
  }

  return Array.from(membershipsByTeam.values());
}

export default async function DashboardLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const supabase = await createClient();

  if (!supabase) {
    redirect("/login");
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect("/login");
  }

  const { data: membershipsData } = await supabase
    .from("team_members")
    .select("team_id, created_at, role, teams(id, name)")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const memberships = normalizeMemberships((membershipsData ?? []) as MembershipRow[]);

  return (
    <TeamProvider memberships={memberships}>
      <main className="min-h-screen bg-[color:var(--background)]">
        <div className="grid min-h-screen lg:grid-cols-[260px_minmax(0,1fr)]">
          <WorkspaceSidebar userEmail={user.email ?? null} />
          <section className="min-w-0 px-4 py-6 sm:px-6 lg:px-8">{children}</section>
        </div>
      </main>
    </TeamProvider>
  );
}
