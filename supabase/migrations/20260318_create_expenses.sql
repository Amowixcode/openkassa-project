create extension if not exists "pgcrypto";

create table if not exists public.expenses (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  title text not null check (char_length(trim(title)) > 0),
  amount numeric(12, 2) not null check (amount >= 0),
  status text not null default 'pending' check (status in ('pending', 'paid', 'cancelled')),
  created_at timestamptz not null default timezone('utc', now())
);

create index if not exists expenses_user_id_idx on public.expenses (user_id);
create index if not exists expenses_created_at_idx on public.expenses (created_at desc);

alter table public.expenses enable row level security;

create policy "Users can view their own expenses"
on public.expenses
for select
using (auth.uid() = user_id);

create policy "Users can insert their own expenses"
on public.expenses
for insert
with check (auth.uid() = user_id);

create policy "Users can update their own expenses"
on public.expenses
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

create policy "Users can delete their own expenses"
on public.expenses
for delete
using (auth.uid() = user_id);
