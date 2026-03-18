with ranked_memberships as (
  select
    id,
    team_id,
    user_id,
    role,
    row_number() over (
      partition by team_id, user_id
      order by
        case when role = 'admin' then 0 else 1 end,
        created_at asc,
        id asc
    ) as membership_rank
  from public.team_members
),
updated_primary_rows as (
  update public.team_members tm
  set role = 'admin'
  from ranked_memberships rm
  where tm.id = rm.id
    and rm.membership_rank = 1
    and exists (
      select 1
      from public.team_members duplicate_tm
      where duplicate_tm.team_id = rm.team_id
        and duplicate_tm.user_id = rm.user_id
        and duplicate_tm.role = 'admin'
    )
  returning tm.id
)
delete from public.team_members tm
using ranked_memberships rm
where tm.id = rm.id
  and rm.membership_rank > 1;

create unique index if not exists team_members_team_user_unique_idx
on public.team_members (team_id, user_id);

create or replace function public.accept_team_invitation(invitation_id uuid)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  invite_record public.team_invitations%rowtype;
  current_user_email text := lower(coalesce(auth.jwt() ->> 'email', ''));
begin
  if auth.uid() is null then
    raise exception 'You must be authenticated to accept a team invitation.';
  end if;

  select *
  into invite_record
  from public.team_invitations
  where id = invitation_id
    and status = 'pending'
    and lower(invitee_email) = current_user_email
  for update;

  if not found then
    raise exception 'Invitation not found or no longer available.';
  end if;

  insert into public.team_members (team_id, user_id, role)
  values (invite_record.team_id, auth.uid(), invite_record.role)
  on conflict (team_id, user_id) do update
  set role = case
    when public.team_members.role = 'admin' or excluded.role = 'admin' then 'admin'
    else 'member'
  end;

  update public.team_invitations
  set
    status = 'accepted',
    accepted_at = timezone('utc', now())
  where id = invitation_id;

  return invite_record.team_id;
end
$$;
