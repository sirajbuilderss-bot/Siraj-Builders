-- Allow active admins to remove audit entries from the admin dashboard.
-- Individual rows and age-based cleanup are both protected by is_admin().
-- Existing rows are untouched; run this after the earlier database migrations.

drop policy if exists activity_logs_admin_delete on public.activity_logs;

create policy activity_logs_admin_delete on public.activity_logs
  for delete to authenticated
  using (public.is_admin());

grant delete on public.activity_logs to authenticated;
