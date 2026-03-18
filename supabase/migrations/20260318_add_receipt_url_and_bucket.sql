alter table public.expenses
add column if not exists receipt_url text;

insert into storage.buckets (id, name, public)
values ('expense-receipts', 'expense-receipts', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can upload their own expense receipts'
  ) then
    create policy "Users can upload their own expense receipts"
    on storage.objects
    for insert
    to authenticated
    with check (
      bucket_id = 'expense-receipts'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can update their own expense receipts'
  ) then
    create policy "Users can update their own expense receipts"
    on storage.objects
    for update
    to authenticated
    using (
      bucket_id = 'expense-receipts'
      and auth.uid()::text = (storage.foldername(name))[1]
    )
    with check (
      bucket_id = 'expense-receipts'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;

  if not exists (
    select 1
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname = 'Users can delete their own expense receipts'
  ) then
    create policy "Users can delete their own expense receipts"
    on storage.objects
    for delete
    to authenticated
    using (
      bucket_id = 'expense-receipts'
      and auth.uid()::text = (storage.foldername(name))[1]
    );
  end if;
end
$$;
