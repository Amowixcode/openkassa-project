"use client";

import {
  createContext,
  ReactNode,
  useContext,
  useState,
} from "react";

export type TeamMembership = {
  teamId: string;
  teamName: string;
  role: "admin" | "member";
};

type TeamContextValue = {
  memberships: TeamMembership[];
  selectedTeamId: string | null;
  setSelectedTeamId: (teamId: string) => void;
  selectedMembership: TeamMembership | null;
};

const TeamContext = createContext<TeamContextValue | null>(null);

type TeamProviderProps = {
  memberships: TeamMembership[];
  children: ReactNode;
};

export function TeamProvider({ memberships, children }: TeamProviderProps) {
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(
    memberships[0]?.teamId ?? null
  );
  const safeSelectedTeamId =
    selectedTeamId &&
    memberships.some((membership) => membership.teamId === selectedTeamId)
      ? selectedTeamId
      : memberships[0]?.teamId ?? null;

  const selectedMembership =
    memberships.find((membership) => membership.teamId === safeSelectedTeamId) ?? null;

  return (
    <TeamContext.Provider
      value={{
        memberships,
        selectedTeamId: safeSelectedTeamId,
        setSelectedTeamId,
        selectedMembership,
      }}
    >
      {children}
    </TeamContext.Provider>
  );
}

export function useSelectedTeam() {
  const context = useContext(TeamContext);

  if (!context) {
    throw new Error("useSelectedTeam must be used within a TeamProvider.");
  }

  return context;
}
