drop policy if exists "Invitees can view invited teams" on public.teams;

create policy "Invitees can view invited teams"
on public.teams
for select
to authenticated
using (
  exists (
    select 1
    from public.team_invitations ti
    where ti.team_id = public.teams.id
      and ti.status = 'pending'
      and lower(ti.invitee_email) = lower(coalesce(auth.jwt() ->> 'email', ''))
  )
);
