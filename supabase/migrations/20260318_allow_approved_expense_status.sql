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
  check (status in ('pending', 'approved', 'paid', 'cancelled'));
end
$$;
