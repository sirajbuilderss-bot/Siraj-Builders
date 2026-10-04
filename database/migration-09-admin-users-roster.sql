-- Restore shared Admin access to the admin_users roster.
-- Run this in the Supabase SQL Editor if Admin users shows an empty roster
-- while a signed-in Admin account is visible in the panel header.

create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.admin_users
    where id = auth.uid()
      and is_active = true
      and role = 'admin'
  );
$$;

alter table public.admin_users enable row level security;

drop policy if exists admin_users_self_read on public.admin_users;
create policy admin_users_self_read on public.admin_users
  for select to authenticated
  using (id = auth.uid());

drop policy if exists admin_users_admin_all on public.admin_users;
create policy admin_users_admin_all on public.admin_users
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

grant select, insert, update, delete on public.admin_users to authenticated;

notify pgrst, 'reload schema';
