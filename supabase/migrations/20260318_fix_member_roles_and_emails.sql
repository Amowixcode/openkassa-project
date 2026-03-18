alter table public.team_members
add column if not exists user_email text;

update public.team_members tm
set user_email = lower(u.email)
from auth.users u
where tm.user_id = u.id
  and u.email is not null
  and (tm.user_email is null or char_length(trim(tm.user_email)) = 0);

create or replace function public.sync_team_member_email()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resolved_email text;
begin
  if new.user_email is null or char_length(trim(new.user_email)) = 0 then
    select lower(u.email)
    into resolved_email
    from auth.users u
    where u.id = new.user_id;

    new.user_email := resolved_email;
  else
    new.user_email := lower(trim(new.user_email));
  end if;

  return new;
end
$$;

drop trigger if exists sync_team_member_email on public.team_members;

create trigger sync_team_member_email
before insert or update on public.team_members
for each row
execute function public.sync_team_member_email();

with membership_targets as (
  select
    tm.team_id,
    tm.user_id,
    coalesce(
      (
        select ti.role
        from public.team_invitations ti
        join auth.users u
          on lower(u.email) = lower(ti.invitee_email)
        where ti.team_id = tm.team_id
          and u.id = tm.user_id
          and ti.status = 'accepted'
        order by ti.accepted_at desc nulls last, ti.created_at desc, ti.id desc
        limit 1
      ),
      case
        when bool_or(tm.role = 'admin') then 'admin'
        else 'member'
      end
    ) as desired_role
  from public.team_members tm
  group by tm.team_id, tm.user_id
),
ranked_memberships as (
  select
    tm.id,
    tm.team_id,
    tm.user_id,
    mt.desired_role,
    row_number() over (
      partition by tm.team_id, tm.user_id
      order by
        case when tm.role = mt.desired_role then 0 else 1 end,
        tm.created_at asc,
        tm.id asc
    ) as membership_rank
  from public.team_members tm
  join membership_targets mt
    on mt.team_id = tm.team_id
   and mt.user_id = tm.user_id
),
updated_primary_rows as (
  update public.team_members tm
  set role = rm.desired_role
  from ranked_memberships rm
  where tm.id = rm.id
    and rm.membership_rank = 1
  returning tm.id
)
delete from public.team_members tm
using ranked_memberships rm
where tm.id = rm.id
  and rm.membership_rank > 1;

create or replace function public.ensure_team_creator_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  creator_email text;
begin
  select lower(u.email)
  into creator_email
  from auth.users u
  where u.id = auth.uid();

  insert into public.team_members (team_id, user_id, role, user_email)
  values (new.id, auth.uid(), 'admin', creator_email)
  on conflict (team_id, user_id) do nothing;

  return new;
end
$$;

create or replace function public.create_team(team_name text)
returns public.teams
language plpgsql
security definer
set search_path = public
as $$
declare
  created_team public.teams%rowtype;
  creator_email text;
begin
  if auth.uid() is null then
    raise exception 'You must be authenticated to create a team.';
  end if;

  if team_name is null or char_length(trim(team_name)) = 0 then
    raise exception 'Team name is required.';
  end if;

  select lower(u.email)
  into creator_email
  from auth.users u
  where u.id = auth.uid();

  insert into public.teams (name)
  values (trim(team_name))
  returning * into created_team;

  insert into public.team_members (team_id, user_id, role, user_email)
  values (created_team.id, auth.uid(), 'admin', creator_email)
  on conflict (team_id, user_id) do nothing;

  return created_team;
end
$$;

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

  insert into public.team_members (team_id, user_id, role, user_email)
  values (invite_record.team_id, auth.uid(), invite_record.role, current_user_email)
  on conflict (team_id, user_id) do nothing;

  update public.team_invitations
  set
    status = 'accepted',
    accepted_at = timezone('utc', now())
  where id = invitation_id;

  return invite_record.team_id;
end
$$;
