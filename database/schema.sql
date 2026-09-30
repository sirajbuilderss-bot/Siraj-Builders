-- ============================================================================
--  SIRAJ BUILDERS — SUPABASE SCHEMA
--  File 1 of 3 · Paste into Supabase SQL Editor and run. Safe to re-run.
-- ----------------------------------------------------------------------------
--  Run order:  01_schema.sql  →  02_policies.sql  →  03_seed.sql
-- ============================================================================

create extension if not exists "pgcrypto";
create extension if not exists "unaccent";

-- ----------------------------------------------------------------------------
--  Shared helpers
-- ----------------------------------------------------------------------------

-- Keeps updated_at honest without application code having to remember.
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

-- ============================================================================
--  1. ADMIN USERS
--  Identity lives in Supabase Auth (auth.users). This table holds the
--  application-level profile and the role flag that every RLS policy checks.
--  A row here is what makes an authenticated user an admin — creating an
--  auth user alone grants nothing.
-- ============================================================================

create table if not exists public.admin_users (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text        not null unique,
  full_name   text        not null default '',
  role        text        not null default 'admin'
              check (role in ('admin', 'editor', 'viewer')),
  is_active   boolean     not null default true,
  last_seen_at timestamptz,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists admin_users_active_idx on public.admin_users (is_active);

drop trigger if exists admin_users_touch on public.admin_users;
create trigger admin_users_touch before update on public.admin_users
  for each row execute function public.touch_updated_at();

-- Security-definer so the policy check can read admin_users without
-- recursing into admin_users' own RLS policies.
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_active = true
  );
$$;

create or replace function public.is_editor()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_active = true and role in ('admin', 'editor')
  );
$$;

/*
 * is_owner() — active AND role = 'admin'.
 *
 * This exists for one policy in particular: the one on admin_users itself.
 *
 * A policy on admin_users cannot check permissions by SELECTing from
 * admin_users. Postgres applies that same policy to the inner query, which
 * applies it again, and the whole thing either recurses or fails outright.
 * The way out is a `security definer` function: it runs as its owner, so RLS
 * does not apply inside it, and the recursion never starts.
 *
 * is_admin() above is too loose for this job — it is true for any active row
 * regardless of role, so an editor would pass it. Managing who can sign in
 * needs the stricter test.
 */
create or replace function public.is_owner()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users
    where id = auth.uid() and is_active = true and role = 'admin'
  );
$$;

-- ============================================================================
--  2. SUBMISSIONS  (contact form + consultation form + any future form)
--
--  One table rather than two. The contact form's five fields are a strict
--  subset of the consultation form's ten, so separate tables would mean
--  duplicating every admin screen — list, search, filter, export, PDF — for
--  two shapes that differ by five nullable columns. `form_type` keeps them
--  distinguishable; `metadata` absorbs fields from forms added later without
--  a migration.
-- ============================================================================

create table if not exists public.submissions (
  id            uuid primary key default gen_random_uuid(),
  form_type     text not null default 'contact'
                check (form_type in ('contact', 'consultation', 'quote', 'other')),

  -- Shared fields (both forms)
  name          text not null,
  phone         text not null,
  email         text,
  project_type  text,
  description   text,

  -- Consultation-only fields
  location      text,
  size          text,
  budget        text,
  start_date    text,          -- free text ("Within 3 months"), not a date
  service       text,

  -- Admin workflow
  status        text not null default 'new'
                check (status in ('new', 'contacted', 'qualified', 'closed', 'spam')),
  is_read       boolean not null default false,
  admin_notes   text not null default '',

  -- Provenance (useful for spam triage; no PII beyond what was submitted)
  source_page   text,
  user_agent    text,

  metadata      jsonb not null default '{}'::jsonb,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists submissions_created_idx   on public.submissions (created_at desc);
create index if not exists submissions_form_type_idx on public.submissions (form_type);
create index if not exists submissions_status_idx    on public.submissions (status);
create index if not exists submissions_unread_idx    on public.submissions (is_read) where is_read = false;

-- Full-text search across the fields an admin actually searches by.
create index if not exists submissions_search_idx on public.submissions
  using gin (to_tsvector('simple',
    coalesce(name,'')     || ' ' || coalesce(email,'')    || ' ' ||
    coalesce(phone,'')    || ' ' || coalesce(location,'') || ' ' ||
    coalesce(description,'')));

drop trigger if exists submissions_touch on public.submissions;
create trigger submissions_touch before update on public.submissions
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  3. PROJECTS  (portfolio / case studies)
--  Mirrors PROJECT_SHAPE in src/pages/ContentPage.jsx exactly.
-- ============================================================================

create table if not exists public.projects (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,
  title         text not null,
  category      text not null default 'Residential'
                check (category in ('Residential', 'Commercial', 'Renovation', 'Design & Build')),
  location      text not null default '',
  status        text not null default 'Completed'
                check (status in ('Completed', 'Ongoing')),
  year          text not null default '',
  area          text not null default '',
  image_url     text not null default '',    -- external URL only; see PHASE 7
  gallery       jsonb not null default '[]'::jsonb,  -- array of external URLs
  summary       text not null default '',
  requirement   text not null default '',
  challenge     text not null default '',
  solution      text not null default '',
  result        text not null default '',
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists projects_active_idx   on public.projects (is_active, sort_order);
create index if not exists projects_category_idx on public.projects (category);

drop trigger if exists projects_touch on public.projects;
create trigger projects_touch before update on public.projects
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  4. SERVICES
--  `is_confirmed` carries over the flag from SERVICE_LINKS in site.js. The
--  documentation requires unconfirmed services to be distinguishable, so the
--  flag stays in the data rather than being flattened away.
-- ============================================================================

create table if not exists public.services (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique,        -- matches the route, e.g. 'residential-construction'
  path          text not null unique,        -- '/residential-construction'
  label         text not null,               -- nav label
  title         text not null default '',
  summary       text not null default '',
  image_url     text not null default '',
  is_confirmed  boolean not null default false,
  is_active     boolean not null default true,
  show_in_nav   boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists services_active_idx on public.services (is_active, sort_order);

drop trigger if exists services_touch on public.services;
create trigger services_touch before update on public.services
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  5. PAGES  (content-driven pages — the PAGES map in ContentPage.jsx)
-- ============================================================================

create table if not exists public.pages (
  id            uuid primary key default gen_random_uuid(),
  path          text not null unique,        -- '/who-we-are'
  eyebrow       text not null default '',
  title         text not null default '',
  intro         text not null default '',
  image_url     text not null default '',
  heading       text not null default '',
  body          text not null default '',
  points        jsonb not null default '[]'::jsonb,   -- array of strings
  motif         text,                        -- optional hero motif override
  is_published  boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists pages_published_idx on public.pages (is_published);

drop trigger if exists pages_touch on public.pages;
create trigger pages_touch before update on public.pages
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  6. FAQS
-- ============================================================================

create table if not exists public.faq_categories (
  id          uuid primary key default gen_random_uuid(),
  key         text not null unique,          -- 'services', 'cost', ...
  label       text not null,
  sort_order  integer not null default 0,
  is_active   boolean not null default true,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create table if not exists public.faqs (
  id           uuid primary key default gen_random_uuid(),
  category_id  uuid references public.faq_categories (id) on delete set null,
  question     text not null,
  answer       text not null,
  is_active    boolean not null default true,
  sort_order   integer not null default 0,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists faqs_category_idx on public.faqs (category_id, sort_order);
create index if not exists faqs_active_idx   on public.faqs (is_active);

drop trigger if exists faq_categories_touch on public.faq_categories;
create trigger faq_categories_touch before update on public.faq_categories
  for each row execute function public.touch_updated_at();

drop trigger if exists faqs_touch on public.faqs;
create trigger faqs_touch before update on public.faqs
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  7. TESTIMONIALS
--  Ships empty. TO-CONFIRM.md §4: only verified testimonials may appear.
-- ============================================================================

create table if not exists public.testimonials (
  id            uuid primary key default gen_random_uuid(),
  quote         text not null,
  client_name   text not null,
  project_type  text not null default '',
  location      text not null default '',
  image_url     text not null default '',
  is_verified   boolean not null default false,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists testimonials_active_idx on public.testimonials (is_active, sort_order);

drop trigger if exists testimonials_touch on public.testimonials;
create trigger testimonials_touch before update on public.testimonials
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  8. TEAM MEMBERS
--  Ships empty. TO-CONFIRM.md §6: no verified biographies supplied.
-- ============================================================================

create table if not exists public.team_members (
  id          uuid primary key default gen_random_uuid(),
  name        text not null,
  role        text not null default '',
  bio         text not null default '',
  image_url   text not null default '',
  linkedin_url text not null default '',
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

create index if not exists team_active_idx on public.team_members (is_active, sort_order);

drop trigger if exists team_members_touch on public.team_members;
create trigger team_members_touch before update on public.team_members
  for each row execute function public.touch_updated_at();

-- ============================================================================
--  9. STATISTICS  (homepage trust numbers)
--  Ships empty. TO-CONFIRM.md §5: "Do not fill these with invented numbers."
-- ============================================================================

create table if not exists public.stats (
  id          uuid primary key default gen_random_uuid(),
  label       text not null,
  value       text not null,
  suffix      text not null default '',
  is_active   boolean not null default true,
  sort_order  integer not null default 0,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);

drop trigger if exists stats_touch on public.stats;
create trigger stats_touch before update on public.stats
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 10. HERO SLIDES  (homepage carousel)
-- ============================================================================

create table if not exists public.hero_slides (
  id                uuid primary key default gen_random_uuid(),
  eyebrow           text not null default '',
  title             text not null,
  lead              text not null default '',
  image_url         text not null default '',
  primary_label     text not null default '',
  primary_to        text not null default '',
  secondary_label   text not null default '',
  secondary_to      text not null default '',
  is_active         boolean not null default true,
  sort_order        integer not null default 0,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);

create index if not exists hero_slides_active_idx on public.hero_slides (is_active, sort_order);

drop trigger if exists hero_slides_touch on public.hero_slides;
create trigger hero_slides_touch before update on public.hero_slides
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 11. SITE SETTINGS  (key/value — contact details, domain, SEO tokens)
--  `is_confirmed` preserves the site.js pattern: unconfirmed contact details
--  render as plain text, never as a dead tel:/mailto: link.
-- ============================================================================

create table if not exists public.site_settings (
  key           text primary key,
  value         text not null default '',
  display       text not null default '',    -- fallback text while unconfirmed
  is_confirmed  boolean not null default false,
  group_name    text not null default 'general',
  label         text not null default '',
  sort_order    integer not null default 0,
  updated_at    timestamptz not null default now()
);

create index if not exists site_settings_group_idx on public.site_settings (group_name, sort_order);

drop trigger if exists site_settings_touch on public.site_settings;
create trigger site_settings_touch before update on public.site_settings
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 12. SOCIAL LINKS
-- ============================================================================

create table if not exists public.social_links (
  id            uuid primary key default gen_random_uuid(),
  key           text not null unique,        -- 'facebook', 'instagram', ...
  label         text not null,
  href          text not null default '',
  is_confirmed  boolean not null default false,
  is_active     boolean not null default true,
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

drop trigger if exists social_links_touch on public.social_links;
create trigger social_links_touch before update on public.social_links
  for each row execute function public.touch_updated_at();

-- ============================================================================
-- 13. ACTIVITY LOGS
-- ============================================================================

create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  actor_id    uuid references public.admin_users (id) on delete set null,
  actor_email text not null default '',
  action      text not null,                 -- 'create' | 'update' | 'delete' | 'login' | 'export'
  entity      text not null,                 -- 'projects' | 'services' | ...
  entity_id   text,
  summary     text not null default '',
  metadata    jsonb not null default '{}'::jsonb,
  created_at  timestamptz not null default now()
);

create index if not exists activity_logs_created_idx on public.activity_logs (created_at desc);
create index if not exists activity_logs_entity_idx  on public.activity_logs (entity, created_at desc);

-- ============================================================================
--  DASHBOARD COUNTS
--  One round trip instead of six count queries on dashboard load.
-- ============================================================================

create or replace function public.dashboard_counts()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'submissions_total',  (select count(*) from public.submissions),
    'submissions_unread', (select count(*) from public.submissions where is_read = false),
    'submissions_new',    (select count(*) from public.submissions where status = 'new'),
    'projects_total',     (select count(*) from public.projects),
    'projects_active',    (select count(*) from public.projects where is_active),
    'services_total',     (select count(*) from public.services where is_active),
    'pages_total',        (select count(*) from public.pages where is_published),
    'faqs_total',         (select count(*) from public.faqs where is_active),
    'testimonials_total', (select count(*) from public.testimonials where is_active),
    'team_total',         (select count(*) from public.team_members where is_active)
  );
$$;

revoke execute on function public.dashboard_counts() from anon;
grant   execute on function public.dashboard_counts() to authenticated;

-- ============================================================================
--  ADMIN ENROLMENT
--  ---------------------------------------------------------------------------
--  The problem this solves: an admin panel needs a first administrator, but
--  creating one by hand means opening the Supabase dashboard, copying a UUID
--  out of auth.users and writing an INSERT. That is a bad first five minutes,
--  and the usual shortcut — an open sign-up form — is worse, because anyone
--  holding the anon key (i.e. anyone who views source) could grant themselves
--  a panel.
--
--  So enrolment is split in two:
--
--    * The FIRST account to call this function, when no active admin exists,
--      becomes the owner. There is exactly one such moment per project.
--    * Every account after that is filed as INACTIVE and must be approved by
--      an existing admin in Admin panel → Admin users.
--
--  security definer is required: a brand-new user has no admin_users row, so
--  under RLS they could not insert one. The function is the only sanctioned
--  way in, and it decides the role rather than accepting one from the caller.
-- ============================================================================

create or replace function public.claim_admin_access(full_name text default '')
returns json
language plpgsql
security definer
set search_path = public
as $$
declare
  uid          uuid := auth.uid();
  uemail       text;
  has_owner    boolean;
  existing     public.admin_users%rowtype;
begin
  if uid is null then
    raise exception 'Not signed in.' using errcode = '28000';
  end if;

  select email into uemail from auth.users where id = uid;

  -- Already enrolled: report the current state rather than changing anything.
  select * into existing from public.admin_users where id = uid;
  if found then
    return json_build_object(
      'status', case when existing.is_active then 'active' else 'pending' end,
      'role',   existing.role,
      'first',  false
    );
  end if;

  select exists (
    select 1 from public.admin_users where is_active = true and role = 'admin'
  ) into has_owner;

  insert into public.admin_users (id, email, full_name, role, is_active)
  values (
    uid,
    coalesce(uemail, ''),
    coalesce(nullif(trim(full_name), ''), split_part(coalesce(uemail, ''), '@', 1)),
    case when has_owner then 'viewer' else 'admin' end,
    not has_owner
  );

  return json_build_object(
    'status', case when has_owner then 'pending' else 'active' end,
    'role',   case when has_owner then 'viewer' else 'admin' end,
    'first',  not has_owner
  );
end;
$$;

revoke execute on function public.claim_admin_access(text) from anon;
grant   execute on function public.claim_admin_access(text) to authenticated;

-- Lets the panel tell a first-time visitor "you will be the owner" instead of
-- "you will need approval", without exposing the roster to anonymous callers.
create or replace function public.admin_exists()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.admin_users where is_active = true and role = 'admin'
  );
$$;

grant execute on function public.admin_exists() to anon, authenticated;

-- ----------------------------------------------------------------------------
--  Tell PostgREST about the new functions immediately rather than waiting for
--  its next schema-cache refresh. Harmless to run more than once.
-- ----------------------------------------------------------------------------
notify pgrst, 'reload schema';

-- ############################################################################
-- ##  VISUAL SECTION CMS  (added by migration-01-sections.sql)
-- ############################################################################

-- ----------------------------------------------------------------------------
--  1. PAGE SECTIONS
--  ----------------------------------------------------------------------------
--  One row = one section on one page. `page_path` is the route the section
--  belongs to ('/' for the homepage), which is deliberately a plain text
--  column rather than a foreign key to public.pages: the bespoke pages
--  (home, faq, consultation, contact) own their layouts and have no row in
--  that table, but their sections still need to be manageable here.
--
--  `position` drives the order sections render in, and is what the reorder
--  buttons in the admin panel rewrite.
-- ----------------------------------------------------------------------------
create table if not exists public.page_sections (
  id            uuid primary key default gen_random_uuid(),

  -- WHERE THIS SECTION LIVES ------------------------------------------------
  page_path     text not null,                        -- '/', '/who-we-are'
  page_label    text not null default '',             -- 'Home', 'About'
  section_key   text not null,                        -- 'hero', 'services'
  label         text not null default '',             -- 'Hero Section'

  section_type  text not null default 'content'
                check (section_type in (
                  'hero', 'intro', 'content', 'services', 'projects',
                  'testimonials', 'faq', 'stats', 'process', 'team',
                  'cta', 'gallery', 'contact', 'custom'
                )),

  -- CONTENT -----------------------------------------------------------------
  eyebrow       text not null default '',
  title         text not null default '',
  subtitle      text not null default '',
  body          text not null default '',
  items         jsonb not null default '[]'::jsonb,   -- array of {title, body}

  -- MEDIA (external URLs only — nothing is uploaded to Supabase storage) -----
  media_url     text not null default '',
  video_url     text not null default '',

  -- ACTION ------------------------------------------------------------------
  cta_label     text not null default '',
  cta_href      text not null default '',

  -- LAYOUT / BEHAVIOUR ------------------------------------------------------
  settings      jsonb not null default '{}'::jsonb,
  position      integer not null default 0,
  is_enabled    boolean not null default true,

  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),

  -- Two sections on the same page may not share a key. This is what makes
  -- "Duplicate" append a numeric suffix rather than silently collide.
  constraint page_sections_unique_key unique (page_path, section_key)
);

create index if not exists page_sections_page_idx
  on public.page_sections (page_path, position);

create index if not exists page_sections_enabled_idx
  on public.page_sections (page_path, is_enabled, position);


-- ----------------------------------------------------------------------------
--  2. KEEP updated_at HONEST
--  ----------------------------------------------------------------------------
--  public.touch_updated_at() is created in schema.sql. Re-created here with
--  `or replace` so this migration also works if it is run on a database where
--  the helper is missing for any reason.
-- ----------------------------------------------------------------------------
create or replace function public.touch_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists page_sections_touch on public.page_sections;
create trigger page_sections_touch
  before update on public.page_sections
  for each row execute function public.touch_updated_at();


-- ----------------------------------------------------------------------------
--  3. EXPANDED PROJECT FIELDS
--  ----------------------------------------------------------------------------
--  `add column if not exists` means this block is a no-op on a database that
--  has already been migrated, so the file stays safe to re-run.
-- ----------------------------------------------------------------------------
alter table public.projects add column if not exists short_description text not null default '';
alter table public.projects add column if not exists full_description  text not null default '';
alter table public.projects add column if not exists features          jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists tags              jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists banner_url        text not null default '';
alter table public.projects add column if not exists video_url         text not null default '';
alter table public.projects add column if not exists client_name       text not null default '';
alter table public.projects add column if not exists completion_date   date;
alter table public.projects add column if not exists is_featured       boolean not null default false;

-- The original schema called the card image `image_url` and the card blurb
-- `summary`. Both are kept. `short_description` is backfilled from `summary`
-- so existing rows do not suddenly render an empty card.
update public.projects
   set short_description = summary
 where short_description = '' and summary <> '';

update public.projects
   set full_description = solution
 where full_description = '' and solution <> '';

create index if not exists projects_featured_idx
  on public.projects (is_featured, sort_order)
  where is_active = true;


-- ----------------------------------------------------------------------------

--  5. REORDER HELPER
--  ----------------------------------------------------------------------------
--  Rewriting positions one row at a time from the browser means N round trips
--  and a window where two sections share a position. This does the whole page
--  in one statement instead: pass the section ids in their new display order
--  and every position is rewritten to match the array index.
-- ----------------------------------------------------------------------------
create or replace function public.reorder_page_sections(
  target_page text,
  ordered_ids uuid[]
)
returns void
language plpgsql
security invoker          -- deliberately NOT definer: RLS must still apply
set search_path = public
as $$
begin
  update public.page_sections ps
     set position = idx.ord - 1
    from unnest(ordered_ids) with ordinality as idx(id, ord)
   where ps.id = idx.id
     and ps.page_path = target_page;
end;
$$;

revoke execute on function public.reorder_page_sections(text, uuid[]) from anon;
grant   execute on function public.reorder_page_sections(text, uuid[]) to authenticated;


-- ----------------------------------------------------------------------------
--  6. TELL POSTGREST ABOUT THE NEW TABLE
-- ----------------------------------------------------------------------------
notify pgrst, 'reload schema';
