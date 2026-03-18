"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { SignOutButton } from "./sign-out-button";
import { useSelectedTeam } from "./team-context";

type WorkspaceSidebarProps = {
  userEmail: string | null;
};

function getInitials(email: string | null) {
  if (!email) {
    return "OK";
  }

  const [name] = email.split("@");
  return name
    .split(/[._-]+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

export function WorkspaceSidebar({ userEmail }: WorkspaceSidebarProps) {
  const pathname = usePathname();
  const { memberships, selectedTeamId, setSelectedTeamId, selectedMembership } =
    useSelectedTeam();

  const navItems = [
    { href: "/dashboard", label: "Dashboard" },
    { href: "/dashboard/teams", label: "Team management" },
    { href: "/dashboard/profile", label: "Profile" },
  ];

  return (
    <aside className="min-h-full border-r border-[color:var(--border-soft)] bg-white px-6 py-8 lg:min-h-screen">
      <Link
        href="/dashboard/profile"
        className="flex items-center gap-4 border-b border-[color:var(--border-soft)] pb-6"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[image:var(--app-gradient)] text-sm font-semibold text-white">
          {getInitials(userEmail)}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-[color:var(--foreground)]">
            {userEmail ?? "User"}
          </p>
          <p className="text-xs text-[color:var(--muted)]">Go to profile</p>
        </div>
      </Link>

      <nav className="mt-6 space-y-1.5">
        {navItems.map((item) => {
          const isActive =
            item.href === "/dashboard"
              ? pathname === item.href
              : pathname.startsWith(item.href);

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center justify-between rounded-lg border px-3 py-2.5 text-sm font-medium transition ${
                isActive
                  ? "border-[#DBEAFE] bg-[#DBEAFE] text-[#1D4ED8]"
                  : "border-transparent text-[color:var(--foreground)] hover:border-[color:var(--border-soft)] hover:bg-[#F8FAFC]"
              }`}
            >
              <span>{item.label}</span>
              <span className={isActive ? "text-[#2563EB]" : "text-[color:var(--muted)]"}>
                {isActive ? "Active" : "Open"}
              </span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-8 border-t border-[color:var(--border-soft)] pt-6">
        <p className="text-xs font-semibold uppercase tracking-[0.25em] text-[#1D4ED8]">
          Active team
        </p>
        <p className="mt-3 text-lg font-semibold text-[color:var(--foreground)]">
          {selectedMembership?.teamName ?? "No team selected"}
        </p>
        <p className="mt-1 text-sm text-[color:var(--muted)]">
          {selectedMembership
            ? `Your role is ${selectedMembership.role}.`
            : "No personal teams exist. You need an invite or you need to create a team."}
        </p>

        <div className="mt-5">
          <p className="text-sm font-medium text-[color:var(--foreground)]">
            Teams
          </p>

          <div className="mt-3 max-h-48 space-y-2 overflow-y-auto pr-1">
            {memberships.length ? (
              memberships.map((membership) => {
                const isSelected = membership.teamId === selectedTeamId;

                return (
                  <button
                    key={membership.teamId}
                    type="button"
                    onClick={() => {
                      setSelectedTeamId(membership.teamId);
                    }}
                    className={`flex w-full items-center justify-between rounded-lg border px-3 py-2 text-left text-sm transition ${
                      isSelected
                        ? "border-[#BFDBFE] bg-[#DBEAFE] text-[#1D4ED8]"
                        : "border-[color:var(--border-soft)] bg-[#F8FAFC] text-[color:var(--foreground)] hover:bg-white"
                    }`}
                  >
                    <span className="truncate">{membership.teamName}</span>
                    <span className="ml-3 shrink-0 rounded-full bg-white px-2 py-0.5 text-xs capitalize text-[color:var(--muted)]">
                      {membership.role}
                    </span>
                  </button>
                );
              })
            ) : (
              <div className="rounded-lg border border-[color:var(--border-soft)] bg-[#F8FAFC] px-3 py-2 text-sm text-[color:var(--muted)]">
                No teams yet
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="mt-8 border-t border-[color:var(--border-soft)] pt-6">
        <SignOutButton />
      </div>
    </aside>
  );
}
