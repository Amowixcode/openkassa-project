"use client";

import { FormEvent, useState } from "react";

type TeamMember = {
  userId: string;
  email: string | null;
  role: "admin" | "member";
};

type TeamInvitation = {
  id: string;
  inviteeEmail: string;
  role: "admin" | "member";
  status: "pending" | "accepted" | "revoked";
};

type TeamDetailPanelProps = {
  teamId: string;
  teamName: string;
  currentRole: "admin" | "member";
  members: TeamMember[];
  invitations: TeamInvitation[];
};

export function TeamDetailPanel({
  teamId,
  teamName,
  currentRole,
  members,
  invitations,
}: TeamDetailPanelProps) {
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"admin" | "member">("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  async function handleInvite(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/teams/${teamId}/invitations`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: inviteEmail,
          role: inviteRole,
        }),
      });
      const payload = (await response.json()) as { error?: string };

      if (!response.ok) {
        setError(payload.error ?? "Could not send the invitation.");
        return;
      }

      setInviteEmail("");
      setInviteRole("member");
      setSuccessMessage("Invitation sent.");
      window.location.reload();
    } catch {
      setError("Something went wrong while sending the invitation.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="space-y-6">
      <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-6 shadow-[var(--shadow-soft)]">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
          Team details
        </p>
        <h1 className="mt-2 text-3xl font-semibold text-[color:var(--foreground)]">
          {teamName}
        </h1>
        <p className="mt-2 text-sm leading-6 text-[color:var(--muted)]">
          Your role in this team is {currentRole}. Teams exist only as shared
          workspaces, not personal spaces.
        </p>
      </article>

      <div className="grid gap-6 xl:grid-cols-[1.05fr_0.95fr]">
        <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-6 shadow-[var(--shadow-soft)]">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
            Members
          </p>

          <div className="mt-6 space-y-3">
            {members.map((member) => (
              <div
                key={member.userId}
                className="rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] p-4"
              >
                <p className="text-sm font-semibold text-[color:var(--foreground)]">
                  {member.email ?? member.userId}
                </p>
                <p className="mt-1 break-all text-xs text-[color:var(--muted)]">
                  {member.userId}
                </p>
                <p className="mt-2 text-sm text-[color:var(--muted)]">
                  Role: {member.role}
                </p>
              </div>
            ))}
          </div>
        </article>

        <div className="space-y-6">
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
                    <p className="text-sm font-semibold text-[color:var(--foreground)]">
                      {invitation.inviteeEmail}
                    </p>
                    <p className="mt-1 text-sm text-[color:var(--muted)]">
                      Role: {invitation.role}
                    </p>
                    <p className="mt-1 text-sm capitalize text-[color:var(--muted)]">
                      Status: {invitation.status}
                    </p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] px-4 py-5 text-sm text-[color:var(--muted)]">
                  No invitations yet.
                </div>
              )}
            </div>
          </article>

          {currentRole === "admin" ? (
            <article className="rounded-lg border border-[color:var(--border-soft)] bg-white p-6 shadow-[var(--shadow-soft)]">
              <p className="text-sm font-semibold uppercase tracking-[0.3em] text-[color:var(--primary)]">
                Invite user
              </p>

              <form className="mt-6 space-y-4" onSubmit={handleInvite}>
                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[color:var(--foreground)]">
                    Email
                  </span>
                  <input
                    className="w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[#3B82F6]"
                    type="email"
                    value={inviteEmail}
                    onChange={(event) => setInviteEmail(event.target.value)}
                    placeholder="person@example.com"
                    required
                  />
                </label>

                <label className="block space-y-2">
                  <span className="text-sm font-medium text-[color:var(--foreground)]">
                    Role
                  </span>
                  <select
                    className="w-full rounded-lg border border-[color:var(--border-soft)] bg-white px-4 py-3 text-[color:var(--foreground)] outline-none transition focus:border-[#3B82F6]"
                    value={inviteRole}
                    onChange={(event) =>
                      setInviteRole(event.target.value as "admin" | "member")
                    }
                  >
                    <option value="member">member</option>
                    <option value="admin">admin</option>
                  </select>
                </label>

                <button
                  className="w-full rounded-lg bg-[#2563EB] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1D4ED8] disabled:bg-[#E2E8F0] disabled:text-[#64748B]"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Sending invitation..." : "Send invitation"}
                </button>
              </form>
            </article>
          ) : null}
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
