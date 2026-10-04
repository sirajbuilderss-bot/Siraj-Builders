-- One-time, offline recovery codes for Supabase Auth admin accounts.
-- This table intentionally has no client policies. Only a server-side
-- Supabase Edge Function using the service role may read or consume codes.

create table if not exists public.admin_password_recovery_codes (
  admin_user_id uuid primary key references public.admin_users(id) on delete cascade,
  code_hash text not null check (code_hash ~ '^[0-9a-f]{64}$'),
  expires_at timestamptz not null,
  used_at timestamptz,
  created_at timestamptz not null default now()
);

alter table public.admin_password_recovery_codes enable row level security;
revoke all on public.admin_password_recovery_codes from public, anon, authenticated;
grant all on public.admin_password_recovery_codes to service_role;

comment on table public.admin_password_recovery_codes is
  'One-time hashed recovery codes. Access is limited to the server-side password recovery function.';

-- Issue/rotate a code from Supabase SQL Editor without storing the raw code:
--   1. Generate a 64-character code locally: openssl rand -hex 32
--   2. SHA-256 hash it locally: printf %s '<code>' | shasum -a 256
--   3. Insert the hash below, replacing the email and hash. Save the raw code
--      in a password manager; it cannot be retrieved from this table.
--
-- insert into public.admin_password_recovery_codes
--   (admin_user_id, code_hash, expires_at)
-- select id, '<64-char-sha256-hex>', now() + interval '24 hours'
-- from public.admin_users
-- where lower(email) = lower('<admin-email>')
--   and role = 'admin' and is_active = true
-- on conflict (admin_user_id) do update
--   set code_hash = excluded.code_hash,
--       expires_at = excluded.expires_at,
--       used_at = null,
--       created_at = now();
