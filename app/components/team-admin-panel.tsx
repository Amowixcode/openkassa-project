"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useSelectedTeam } from "./team-context";

type PendingInvitation = {
  id: string;
  teamId: string;
  teamName: string;
  role: "admin" | "member";
};

type TeamMembership = {
  teamId: string;
  teamName: string;
  role: "admin" | "member";
};

type TeamAdminPanelProps = {
  invitations: PendingInvitation[];
  memberships: TeamMembership[];
};

export function TeamAdminPanel({ invitations, memberships }: TeamAdminPanelProps) {
  const router = useRouter();
  const { selectedTeamId, setSelectedTeamId } = useSelectedTeam();
  const [teamName, setTeamName] = useState("");
  const [isCreating, setIsCreating] = useState(false);
  const [activeInvitationId, setActiveInvitationId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleCreateTeam(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsCreating(true);

    try {
      const response = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ name: teamName }),
      });
      const payload = (await response.json()) as {
        team?: { name: string };
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Could not create team.");
        return;
      }

      setTeamName("");
      setSuccessMessage(`Team "${payload.team?.name ?? "New team"}" was created.`);
      router.refresh();
    } catch {
      setError("Something went wrong while creating the team.");
    } finally {
      setIsCreating(false);
    }
  }

  async function handleAcceptInvitation(invitationId: string) {
    setError(null);
    setSuccessMessage(null);
    setActiveInvitationId(invitationId);

    try {
      const response = await fetch(`/api/team-invitations/${invitationId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action: "accept" }),
      });
      const payload = (await response.json()) as {
        teamId?: string;
        error?: string;
      };

      if (!response.ok) {
        setError(payload.error ?? "Could not accept the invitation.");
        return;
      }

      if (payload.teamId) {
        setSelectedTeamId(payload.teamId);
      }

      setSuccessMessage("Invitation accepted.");
      router.refresh();
    } catch {
      setError("Something went wrong while accepting the invitation.");
    } finally {
      setActiveInvitationId(null);
    }
  }

  return (
    <div className="space-y-6">
      <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-6 shadow-[var(--shadow-soft)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
          Team management
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
          Switch teams and manage access
        </h1>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
          This app only uses real team relationships between admins and members.
          No personal teams are created automatically.
        </p>
      </article>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
            Your teams
          </p>
          <div className="mt-6 space-y-3">
            {memberships.length ? (
              memberships.map((membership) => (
                <div
                  key={membership.teamId}
                  className="rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] p-4"
                >
                  <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                    <div>
                      <p className="text-lg font-semibold text-[color:var(--foreground)]">
                        {membership.teamName}
                      </p>
                      <p className="text-sm text-[color:var(--muted)]">
                        Role: {membership.role}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-3">
                      <button
                        type="button"
                        className={`rounded-lg border px-4 py-2 text-sm font-semibold transition ${
                          membership.teamId === selectedTeamId
                            ? "border-[#BFDBFE] bg-[#DBEAFE] text-[#1D4ED8]"
                            : "border-[color:var(--border-soft)] bg-white text-[color:var(--foreground)] hover:bg-[#F8FAFC]"
                        }`}
                        onClick={() => {
                          setSelectedTeamId(membership.teamId);
                        }}
                      >
                        {membership.teamId === selectedTeamId ? "Active team" : "Select team"}
                      </button>
                      <Link
                        href={`/dashboard/teams/${membership.teamId}`}
                        className="rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-2 text-sm font-semibold text-[color:var(--foreground)] transition hover:bg-[#F8FAFC]"
                      >
                        Team details
                      </Link>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] px-4 py-5 text-sm text-[color:var(--muted)]">
                You are not a member of any teams yet.
              </div>
            )}
          </div>
        </article>

        <div className="space-y-6">
          <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
              Create team
            </p>

            <form className="mt-6 space-y-4" onSubmit={handleCreateTeam}>
              <label className="block space-y-2">
                <span className="text-sm font-medium text-[color:var(--foreground)]">
                  Team name
                </span>
                <input
                  className="w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[#3B82F6]"
                  type="text"
                  value={teamName}
                  onChange={(event) => setTeamName(event.target.value)}
                  placeholder="For example Rowing Club"
                  required
                />
              </label>

              <button
                className="w-full rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:bg-[#E2E8F0] disabled:text-[#64748B]"
                type="submit"
                disabled={isCreating}
              >
                {isCreating ? "Creating team..." : "Create team"}
              </button>
            </form>
          </article>

          <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-6 shadow-[var(--shadow-soft)]">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
              Invitations
            </p>
            <div className="mt-6 space-y-3">
              {invitations.length ? (
                invitations.map((invitation) => (
                  <div
                    key={invitation.id}
                    className="rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] p-4"
                  >
                    <p className="text-base font-semibold text-[color:var(--foreground)]">
                      {invitation.teamName}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Invitation as {invitation.role}
                    </p>
                    <button
                      className="mt-4 rounded-lg bg-[#2563EB] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:bg-[#E2E8F0] disabled:text-[#64748B]"
                      type="button"
                      onClick={() => {
                        void handleAcceptInvitation(invitation.id);
                      }}
                      disabled={activeInvitationId === invitation.id}
                    >
                      {activeInvitationId === invitation.id
                        ? "Joining..."
                        : "Join team"}
                    </button>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] px-4 py-5 text-sm text-[color:var(--muted)]">
                  No pending invitations right now.
                </div>
              )}
            </div>
          </article>
        </div>
      </div>

      {error ? (
        <p className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>
      ) : null}

      {successMessage ? (
        <p className="rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          {successMessage}
        </p>
      ) : null}
    </div>
  );
}
