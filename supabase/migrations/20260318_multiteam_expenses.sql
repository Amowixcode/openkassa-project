create extension if not exists "pgcrypto";

create table if not exists public.teams (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  created_at timestamptz not null default timezone('utc', now()),
  constraint teams_name_not_blank check (char_length(trim(name)) > 0)
);

create table if not exists public.team_members (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  role text not null check (role in ('admin', 'member')),
  created_at timestamptz not null default timezone('utc', now()),
  constraint team_members_unique_user_per_team unique (team_id, user_id)
);

create table if not exists public.team_invitations (
  id uuid primary key default gen_random_uuid(),
  team_id uuid not null references public.teams (id) on delete cascade,
  inviter_user_id uuid not null references auth.users (id) on delete cascade,
  invitee_email text not null,
  role text not null default 'member' check (role in ('admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'accepted', 'revoked')),
  created_at timestamptz not null default timezone('utc', now()),
  accepted_at timestamptz,
  constraint team_invitations_email_not_blank check (char_length(trim(invitee_email)) > 0)
);

create index if not exists team_members_user_id_idx on public.team_members (user_id);
create index if not exists team_members_team_id_idx on public.team_members (team_id);
create index if not exists team_invitations_team_id_idx on public.team_invitations (team_id);
create index if not exists team_invitations_email_idx on public.team_invitations (lower(invitee_email));

create unique index if not exists team_invitations_pending_unique_idx
on public.team_invitations (team_id, lower(invitee_email))
where status = 'pending';

alter table public.expenses
add column if not exists team_id uuid references public.teams (id) on delete cascade;

alter table public.expenses
alter column team_id drop not null;

update public.expenses
set status = case
  when status in ('paid', 'approved') then 'approved'
  when status in ('cancelled', 'rejected') then 'rejected'
  else 'pending'
end
where status not in ('pending', 'approved', 'rejected')
   or status is null;

update public.expenses
set team_id = membership.team_id
from (
  select distinct on (tm.user_id) tm.user_id, tm.team_id
  from public.team_members tm
  order by tm.user_id, tm.created_at asc
) as membership
where public.expenses.team_id is null
  and public.expenses.user_id = membership.user_id;

alter table public.expenses
alter column user_id set not null;

create index if not exists expenses_team_id_idx on public.expenses (team_id);
create index if not exists expenses_team_created_at_idx on public.expenses (team_id, created_at desc);

do $$
begin
  if exists (
    select 1
    from pg_constraint
    where conname = 'expenses_status_check'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
    drop constraint expenses_status_check;
  end if;

  alter table public.expenses
  add constraint expenses_status_check
  check (status in ('pending', 'approved', 'rejected'));
end
$$;

create or replace function public.is_team_member(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = target_team_id
      and tm.user_id = auth.uid()
  );
$$;

create or replace function public.is_team_admin(target_team_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.team_members tm
    where tm.team_id = target_team_id
      and tm.user_id = auth.uid()
      and tm.role = 'admin'
  );
$$;

create or replace function public.is_invited_email(target_email text)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select lower(coalesce(auth.jwt() ->> 'email', '')) = lower(target_email);
$$;

create or replace function public.ensure_team_creator_membership()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.team_members (team_id, user_id, role)
  values (new.id, auth.uid(), 'admin')
  on conflict (team_id, user_id) do nothing;

  return new;
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

  insert into public.team_members (team_id, user_id, role)
  values (invite_record.team_id, auth.uid(), invite_record.role)
  on conflict (team_id, user_id) do update
  set role = excluded.role;

  update public.team_invitations
  set
    status = 'accepted',
    accepted_at = timezone('utc', now())
  where id = invitation_id;

  return invite_record.team_id;
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
begin
  if auth.uid() is null then
    raise exception 'You must be authenticated to create a team.';
  end if;

  if team_name is null or char_length(trim(team_name)) = 0 then
    raise exception 'Team name is required.';
  end if;

  insert into public.teams (name)
  values (trim(team_name))
  returning * into created_team;

  insert into public.team_members (team_id, user_id, role)
  values (created_team.id, auth.uid(), 'admin')
  on conflict (team_id, user_id) do nothing;

  return created_team;
end
$$;

grant execute on function public.is_team_member(uuid) to authenticated;
grant execute on function public.is_team_admin(uuid) to authenticated;
grant execute on function public.is_invited_email(text) to authenticated;
grant execute on function public.accept_team_invitation(uuid) to authenticated;
grant execute on function public.create_team(text) to authenticated;

alter table public.teams enable row level security;
alter table public.team_members enable row level security;
alter table public.team_invitations enable row level security;
alter table public.expenses enable row level security;

drop trigger if exists ensure_team_creator_membership on public.teams;

create trigger ensure_team_creator_membership
after insert on public.teams
for each row
execute function public.ensure_team_creator_membership();

drop policy if exists "Users can view their own expenses" on public.expenses;
drop policy if exists "Users can insert their own expenses" on public.expenses;
drop policy if exists "Users can update their own expenses" on public.expenses;
drop policy if exists "Users can delete their own expenses" on public.expenses;
drop policy if exists "Team members can view their teams" on public.teams;
drop policy if exists "Team members can create teams" on public.teams;
drop policy if exists "Team admins can update teams" on public.teams;
drop policy if exists "Team members can view memberships in their teams" on public.team_members;
drop policy if exists "Team admins can manage memberships" on public.team_members;
drop policy if exists "Team members can view invitations for their teams" on public.team_invitations;
drop policy if exists "Invitees can view their pending invitations" on public.team_invitations;
drop policy if exists "Team admins can create invitations" on public.team_invitations;
drop policy if exists "Team admins can update invitations" on public.team_invitations;
drop policy if exists "Team admins can delete invitations" on public.team_invitations;
drop policy if exists "Team members can view team expenses" on public.expenses;
drop policy if exists "Team members can create team expenses" on public.expenses;
drop policy if exists "Team admins can update team expenses" on public.expenses;

create policy "Team members can view their teams"
on public.teams
for select
to authenticated
using (public.is_team_member(id));

create policy "Authenticated users can create teams"
on public.teams
for insert
to authenticated
with check (auth.uid() is not null);

create policy "Team admins can update teams"
on public.teams
for update
to authenticated
using (public.is_team_admin(id))
with check (public.is_team_admin(id));

create policy "Team members can view memberships in their teams"
on public.team_members
for select
to authenticated
using (public.is_team_member(team_id));

create policy "Team admins can manage memberships"
on public.team_members
for all
to authenticated
using (public.is_team_admin(team_id))
with check (public.is_team_admin(team_id));

create policy "Team admins can view invitations for their teams"
on public.team_invitations
for select
to authenticated
using (public.is_team_admin(team_id));

create policy "Invitees can view their pending invitations"
on public.team_invitations
for select
to authenticated
using (
  status = 'pending'
  and public.is_invited_email(invitee_email)
);

create policy "Team admins can create invitations"
on public.team_invitations
for insert
to authenticated
with check (
  public.is_team_admin(team_id)
  and inviter_user_id = auth.uid()
);

create policy "Team admins can update invitations"
on public.team_invitations
for update
to authenticated
using (public.is_team_admin(team_id))
with check (public.is_team_admin(team_id));

create policy "Team admins can delete invitations"
on public.team_invitations
for delete
to authenticated
using (public.is_team_admin(team_id));

create policy "Team members can view team expenses"
on public.expenses
for select
to authenticated
using (
  team_id is not null
  and public.is_team_member(team_id)
);

create policy "Team members can create team expenses"
on public.expenses
for insert
to authenticated
with check (
  auth.uid() = user_id
  and team_id is not null
  and public.is_team_member(team_id)
  and status = 'pending'
);

create policy "Team admins can update team expenses"
on public.expenses
for update
to authenticated
using (
  team_id is not null
  and public.is_team_admin(team_id)
)
with check (
  team_id is not null
  and public.is_team_admin(team_id)
  and status in ('pending', 'approved', 'rejected')
);

create or replace function public.enforce_expense_status_only_update()
returns trigger
language plpgsql
as $$
begin
  if new.team_id is distinct from old.team_id
    or new.user_id is distinct from old.user_id
    or new.title is distinct from old.title
    or new.amount is distinct from old.amount
    or new.expense_date is distinct from old.expense_date
    or new.category is distinct from old.category
    or new.receipt_url is distinct from old.receipt_url
    or new.created_at is distinct from old.created_at then
    raise exception 'Only expense status can be updated after creation.';
  end if;

  if new.status not in ('pending', 'approved', 'rejected') then
    raise exception 'Invalid expense status.';
  end if;

  return new;
end
$$;

drop trigger if exists enforce_expense_status_only_update on public.expenses;

create trigger enforce_expense_status_only_update
before update on public.expenses
for each row
execute function public.enforce_expense_status_only_update();

update storage.buckets
set public = false
where id = 'expense-receipts';

insert into storage.buckets (id, name, public)
values ('expense-receipts', 'expense-receipts', false)
on conflict (id) do update
set public = excluded.public;

drop policy if exists "Users can upload their own expense receipts" on storage.objects;
drop policy if exists "Users can update their own expense receipts" on storage.objects;
drop policy if exists "Users can delete their own expense receipts" on storage.objects;
drop policy if exists "Team members can view team expense receipts" on storage.objects;
drop policy if exists "Users can upload receipts to their teams" on storage.objects;
drop policy if exists "Users can update their own team receipts" on storage.objects;
drop policy if exists "Users can delete their own team receipts" on storage.objects;

create policy "Team members can view team expense receipts"
on storage.objects
for select
to authenticated
using (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] is not null
  and public.is_team_member(((storage.foldername(name))[1])::uuid)
);

create policy "Users can upload receipts to their teams"
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] is not null
  and (storage.foldername(name))[2] is not null
  and public.is_team_member(((storage.foldername(name))[1])::uuid)
  and auth.uid()::text = (storage.foldername(name))[2]
);

create policy "Users can update their own team receipts"
on storage.objects
for update
to authenticated
using (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] is not null
  and (storage.foldername(name))[2] is not null
  and public.is_team_member(((storage.foldername(name))[1])::uuid)
  and auth.uid()::text = (storage.foldername(name))[2]
)
with check (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] is not null
  and (storage.foldername(name))[2] is not null
  and public.is_team_member(((storage.foldername(name))[1])::uuid)
  and auth.uid()::text = (storage.foldername(name))[2]
);

create policy "Users can delete their own team receipts"
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'expense-receipts'
  and (storage.foldername(name))[1] is not null
  and (storage.foldername(name))[2] is not null
  and public.is_team_member(((storage.foldername(name))[1])::uuid)
  and auth.uid()::text = (storage.foldername(name))[2]
);
