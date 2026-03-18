alter table public.expenses
add column if not exists expense_date date;

alter table public.expenses
add column if not exists category text;

update public.expenses
set
  expense_date = coalesce(expense_date, created_at::date, current_date),
  category = coalesce(nullif(trim(category), ''), 'Other')
where expense_date is null
   or category is null
   or trim(category) = '';

alter table public.expenses
alter column expense_date set default current_date;

alter table public.expenses
alter column expense_date set not null;

alter table public.expenses
alter column category set not null;

do $$
begin
  if not exists (
    select 1
    from pg_constraint
    where conname = 'expenses_category_not_blank'
      and conrelid = 'public.expenses'::regclass
  ) then
    alter table public.expenses
    add constraint expenses_category_not_blank
    check (char_length(trim(category)) > 0);
  end if;
end
$$;
