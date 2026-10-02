-- ============================================================================
--  SIRAJ BUILDERS — COMPLETE DATABASE INSTALLER
--  ---------------------------------------------------------------------------
--  GENERATED FILE — do not edit by hand.
--  Source: schema.sql + policies.sql + seed.sql + migration-02-cms.sql
--          + migration-03-content.sql
--  Rebuild with: npm run build:sql
--
--  Yeh file teenon SQL files ko sahi tarteeb (order) mein jorr deti hai:
--
--      1. schema.sql    ->  tables, indexes, triggers, functions
--      2. policies.sql  ->  Row Level Security (kaun kya parh/likh sakta hai)
--      3. seed.sql      ->  bunyadi content (settings, services, waghaira)
--      4. migration-02  ->  project photos/videos table, SEO fields,
--                           image upload bucket (Storage) + policies
--      5. migration-03  ->  documentation wala poora content: har page ke
--                           sections, 20 FAQs, services ke cards
--
--  ISTEMAAL KA TAREEQA:
--    Supabase Dashboard -> SQL Editor -> New query
--    Poori file copy karein, paste karein, "Run" dabayein.
--
--  Yeh file dobara chalana bhi MEHFOOZ hai. Har statement "if not exists" ya
--  "on conflict do nothing" use karta hai, is liye:
--    - jo tables pehle se hain wo dobara nahi banengi
--    - jo content aap ne admin panel se badla hai wo WAPIS NAHI BADLE GA
--
--  ---------------------------------------------------------------------------
--  AGAR ADMIN PANEL MEIN YEH ERROR AAYE:
--
--      Could not find the table 'public.page_sections' in the schema cache
--
--  To poori install.sql chalane ki zaroorat nahi. Sirf yeh chhoti file
--  chalayein:  database/repair-page-sections.sql
--  ---------------------------------------------------------------------------
--
--  AGAR ERROR AAYE: Supabase SQL Editor har cheez ek hi transaction mein
--  chalata hai. Matlab agar beech mein error aaya to kuch bhi save nahi
--  hoga - database waise ka waisa rahega. Error ka message bhej dein.
-- ============================================================================


-- ##########################################################################
-- ##
-- ##   STEP 1 OF 5 — SCHEMA
-- ##   (source file: database/schema.sql)
-- ##
-- ##########################################################################

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



-- ##########################################################################
-- ##
-- ##   STEP 2 OF 5 — POLICIES
-- ##   (source file: database/policies.sql)
-- ##
-- ##########################################################################

-- ============================================================================
--  SIRAJ BUILDERS — ROW LEVEL SECURITY
--  File 2 of 3 · Run after 01_schema.sql. Safe to re-run.
-- ----------------------------------------------------------------------------
--  The security model in one paragraph:
--
--  The anon key ships in the browser bundle. Anyone can read it out of the
--  JavaScript, so it must be treated as public. RLS is therefore the only
--  thing protecting the database — never the secrecy of the key.
--
--    anon           → INSERT into submissions. SELECT published content. Nothing else.
--                     Critically, anon CANNOT select from submissions, so a
--                     visitor cannot read other visitors' enquiries.
--    authenticated  → only meaningful if a matching row exists in admin_users
--                     with is_active = true. Signing up alone grants nothing.
--    service_role   → bypasses RLS entirely. NEVER put it in the frontend.
-- ============================================================================

alter table public.admin_users    enable row level security;
alter table public.submissions    enable row level security;
alter table public.projects       enable row level security;
alter table public.services       enable row level security;
alter table public.pages          enable row level security;
alter table public.faq_categories enable row level security;
alter table public.faqs           enable row level security;
alter table public.testimonials   enable row level security;
alter table public.team_members   enable row level security;
alter table public.stats          enable row level security;
alter table public.hero_slides    enable row level security;
alter table public.site_settings  enable row level security;
alter table public.social_links   enable row level security;
alter table public.activity_logs  enable row level security;

-- ----------------------------------------------------------------------------
--  ADMIN USERS
-- ----------------------------------------------------------------------------
drop policy if exists admin_users_self_read  on public.admin_users;
drop policy if exists admin_users_admin_all  on public.admin_users;

-- An admin can always read their own row (needed on login to learn their role,
-- and for a pending account to be told it is pending rather than rejected).
create policy admin_users_self_read on public.admin_users
  for select to authenticated
  using (id = auth.uid());

-- Note there is no INSERT policy here for ordinary users, and that is
-- deliberate. Rows are created only by public.claim_admin_access() in
-- 01_schema.sql, which is security definer and therefore bypasses these
-- policies. That function decides the role itself — first account in becomes
-- the owner, everyone after lands inactive — so a caller cannot enrol
-- themselves as an admin by crafting their own INSERT with the anon key.

-- Full admins manage the admin roster.
--
-- This uses public.is_owner() rather than an inline subquery, and it has to.
-- A policy on admin_users that queries admin_users makes Postgres apply this
-- same policy to the inner query — which applies it again. is_owner() is
-- `security definer`, so RLS does not apply inside it and the loop never
-- starts. Every other policy in this file follows the same pattern with
-- is_admin() / is_editor().
create policy admin_users_admin_all on public.admin_users
  for all to authenticated
  using (public.is_owner())
  with check (public.is_owner());

-- ----------------------------------------------------------------------------
--  SUBMISSIONS
--  Public may write, never read. This is the whole point of the table.
-- ----------------------------------------------------------------------------
drop policy if exists submissions_public_insert on public.submissions;
drop policy if exists submissions_admin_read    on public.submissions;
drop policy if exists submissions_admin_update  on public.submissions;
drop policy if exists submissions_admin_delete  on public.submissions;

create policy submissions_public_insert on public.submissions
  for insert to anon, authenticated
  with check (
    -- Minimal server-side sanity. Real validation is client-side; these
    -- constraints stop an empty or obviously abusive row being written
    -- straight to the table by something other than the site's own form.
    char_length(trim(name))  between 2 and 120
    and char_length(trim(phone)) between 7 and 30
    and (description is null or char_length(description) <= 5000)
    and status  = 'new'      -- a visitor cannot pre-set workflow state
    and is_read = false
    and admin_notes = ''
  );

create policy submissions_admin_read on public.submissions
  for select to authenticated using (public.is_admin());

create policy submissions_admin_update on public.submissions
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

create policy submissions_admin_delete on public.submissions
  for delete to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
--  PUBLIC CONTENT TABLES
--  Read: anyone, but only rows flagged live. Write: editors and admins.
-- ----------------------------------------------------------------------------

-- projects
drop policy if exists projects_public_read on public.projects;
drop policy if exists projects_admin_all   on public.projects;
create policy projects_public_read on public.projects
  for select to anon, authenticated using (is_active or public.is_admin());
create policy projects_admin_all on public.projects
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- services
drop policy if exists services_public_read on public.services;
drop policy if exists services_admin_all   on public.services;
create policy services_public_read on public.services
  for select to anon, authenticated using (is_active or public.is_admin());
create policy services_admin_all on public.services
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- pages
drop policy if exists pages_public_read on public.pages;
drop policy if exists pages_admin_all   on public.pages;
create policy pages_public_read on public.pages
  for select to anon, authenticated using (is_published or public.is_admin());
create policy pages_admin_all on public.pages
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- faq_categories
drop policy if exists faq_categories_public_read on public.faq_categories;
drop policy if exists faq_categories_admin_all   on public.faq_categories;
create policy faq_categories_public_read on public.faq_categories
  for select to anon, authenticated using (is_active or public.is_admin());
create policy faq_categories_admin_all on public.faq_categories
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- faqs
drop policy if exists faqs_public_read on public.faqs;
drop policy if exists faqs_admin_all   on public.faqs;
create policy faqs_public_read on public.faqs
  for select to anon, authenticated using (is_active or public.is_admin());
create policy faqs_admin_all on public.faqs
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- testimonials
drop policy if exists testimonials_public_read on public.testimonials;
drop policy if exists testimonials_admin_all   on public.testimonials;
create policy testimonials_public_read on public.testimonials
  for select to anon, authenticated using ((is_active and is_verified) or public.is_admin());
create policy testimonials_admin_all on public.testimonials
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- team_members
drop policy if exists team_public_read on public.team_members;
drop policy if exists team_admin_all   on public.team_members;
create policy team_public_read on public.team_members
  for select to anon, authenticated using (is_active or public.is_admin());
create policy team_admin_all on public.team_members
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- stats
drop policy if exists stats_public_read on public.stats;
drop policy if exists stats_admin_all   on public.stats;
create policy stats_public_read on public.stats
  for select to anon, authenticated using (is_active or public.is_admin());
create policy stats_admin_all on public.stats
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- hero_slides
drop policy if exists hero_slides_public_read on public.hero_slides;
drop policy if exists hero_slides_admin_all   on public.hero_slides;
create policy hero_slides_public_read on public.hero_slides
  for select to anon, authenticated using (is_active or public.is_admin());
create policy hero_slides_admin_all on public.hero_slides
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- site_settings
drop policy if exists site_settings_public_read on public.site_settings;
drop policy if exists site_settings_admin_all   on public.site_settings;
create policy site_settings_public_read on public.site_settings
  for select to anon, authenticated using (true);
create policy site_settings_admin_all on public.site_settings
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- social_links
drop policy if exists social_links_public_read on public.social_links;
drop policy if exists social_links_admin_all   on public.social_links;
create policy social_links_public_read on public.social_links
  for select to anon, authenticated using (is_active or public.is_admin());
create policy social_links_admin_all on public.social_links
  for all to authenticated using (public.is_editor()) with check (public.is_editor());

-- ----------------------------------------------------------------------------
--  ACTIVITY LOGS
--  Admins read and append. Active admins may delete individual entries or
--  prune old entries from the dashboard; edits remain prohibited.
-- ----------------------------------------------------------------------------
drop policy if exists activity_logs_admin_read   on public.activity_logs;
drop policy if exists activity_logs_admin_insert on public.activity_logs;
drop policy if exists activity_logs_admin_delete on public.activity_logs;

create policy activity_logs_admin_read on public.activity_logs
  for select to authenticated using (public.is_admin());

create policy activity_logs_admin_insert on public.activity_logs
  for insert to authenticated with check (public.is_admin());

create policy activity_logs_admin_delete on public.activity_logs
  for delete to authenticated using (public.is_admin());

-- ----------------------------------------------------------------------------
--  GRANTS
--  RLS filters rows; grants decide whether the role may touch the table at
--  all. Both are needed.
-- ----------------------------------------------------------------------------
grant usage on schema public to anon, authenticated;

grant select on
  public.projects, public.services, public.pages, public.faqs,
  public.faq_categories, public.testimonials, public.team_members,
  public.stats, public.hero_slides, public.site_settings, public.social_links
to anon, authenticated;

grant insert on public.submissions to anon, authenticated;
grant select, update, delete on public.submissions to authenticated;

grant select, insert, update, delete on
  public.projects, public.services, public.pages, public.faqs,
  public.faq_categories, public.testimonials, public.team_members,
  public.stats, public.hero_slides, public.site_settings, public.social_links,
  public.admin_users
to authenticated;

grant select, insert, delete on public.activity_logs to authenticated;

-- ############################################################################
-- ##  VISUAL SECTION CMS  (added by migration-01-sections.sql)
-- ############################################################################

--  PAGE SECTIONS
--  ----------------------------------------------------------------------------
--  Same shape as every other content table: the public may read enabled rows,
--  editors and admins may do anything. is_editor() and is_admin() are the
--  security-definer helpers defined in schema.sql.
-- ----------------------------------------------------------------------------
alter table public.page_sections enable row level security;

drop policy if exists page_sections_public_read on public.page_sections;
drop policy if exists page_sections_admin_all   on public.page_sections;

create policy page_sections_public_read on public.page_sections
  for select to anon, authenticated
  using (is_enabled or public.is_admin());

create policy page_sections_admin_all on public.page_sections
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());


-- ----------------------------------------------------------------------------



-- ##########################################################################
-- ##
-- ##   STEP 3 OF 5 — SEED
-- ##   (source file: database/seed.sql)
-- ##
-- ##########################################################################

-- ============================================================================
--  SIRAJ BUILDERS — SEED DATA
--  File 3 of 3 · Run after 02_policies.sql. Safe to re-run (idempotent upserts).
-- ----------------------------------------------------------------------------
--  Every row below is the EXACT copy currently hardcoded in the React source,
--  extracted programmatically rather than retyped. Seeding this and switching
--  the site to read from the database is therefore a no-op visually: the same
--  words render, from a different source.
--
--  Four tables are seeded EMPTY on purpose — projects, testimonials,
--  team_members and stats. TO-CONFIRM.md is explicit that no project, quote,
--  biography or metric has been verified, and that inventing them is the one
--  thing the client documentation forbids. The pages already render designed
--  empty states for exactly this. Add real rows from the admin panel.
-- ============================================================================


-- ---------- Site settings ----------
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('company_name', 'Siraj Builders', '', true, 'company', 'Company name', 10)
on conflict (key) do nothing;
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('company_initials', 'SB', '', true, 'company', 'Logo initials', 20)
on conflict (key) do nothing;
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('company_tagline', 'Construction, managed from the first plan to the final detail.', '', true, 'company', 'Tagline', 30)
on conflict (key) do nothing;
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('company_proposition', 'Built with clarity. Managed with care. Delivered with purpose.', '', true, 'company', 'Value proposition', 40)
on conflict (key) do nothing;
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('company_trust_line', 'Clear planning. Responsible execution. Consistent communication.', '', true, 'company', 'Hero trust line', 50)
on conflict (key) do nothing;
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('contact_phone', '', 'Phone number to be confirmed', false, 'contact', 'Phone', 10)
on conflict (key) do nothing;
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('contact_whatsapp', '', 'WhatsApp number to be confirmed', false, 'contact', 'WhatsApp', 20)
on conflict (key) do nothing;
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('contact_email', '', 'Email address to be confirmed', false, 'contact', 'Email', 30)
on conflict (key) do nothing;
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('contact_address', '', 'Office address to be confirmed', false, 'contact', 'Office address', 40)
on conflict (key) do nothing;
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('contact_hours', '', 'Business hours to be confirmed', false, 'contact', 'Business hours', 50)
on conflict (key) do nothing;
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('site_url', 'https://www.sirajbuilders.com', '', false, 'seo', 'Canonical site URL', 10)
on conflict (key) do nothing;
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('seo_location_token', '', '', false, 'seo', 'Location token (e.g. '' in Lahore'')', 20)
on conflict (key) do nothing;
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values ('footer_tagline', 'Construction, managed from the first plan to the final detail.', '', true, 'footer', 'Footer tagline', 10)
on conflict (key) do nothing;

-- ---------- Social links (all unconfirmed — footer row stays hidden) ----------
insert into public.social_links (key, label, href, is_confirmed, sort_order)
values ('facebook', 'Facebook', '', false, 10)
on conflict (key) do nothing;
insert into public.social_links (key, label, href, is_confirmed, sort_order)
values ('instagram', 'Instagram', '', false, 20)
on conflict (key) do nothing;
insert into public.social_links (key, label, href, is_confirmed, sort_order)
values ('linkedin', 'LinkedIn', '', false, 30)
on conflict (key) do nothing;
insert into public.social_links (key, label, href, is_confirmed, sort_order)
values ('youtube', 'YouTube', '', false, 40)
on conflict (key) do nothing;

-- ---------- Services ----------
insert into public.services (slug, path, label, title, summary, image_url, is_confirmed, sort_order)
values ('residential-construction', '/residential-construction', 'Residential Construction', 'Homes built around the way people actually live.', 'From the first brief through structure, finishes and handover, every decision should serve the life the property is meant to support.', 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1800&q=85', true, 10)
on conflict (slug) do nothing;
insert into public.services (slug, path, label, title, summary, image_url, is_confirmed, sort_order)
values ('commercial-construction', '/commercial-construction', 'Commercial Construction', '', '', '', true, 20)
on conflict (slug) do nothing;
insert into public.services (slug, path, label, title, summary, image_url, is_confirmed, sort_order)
values ('renovation-remodelling', '/renovation-remodelling', 'Renovation & Remodelling', 'Improve an existing property without losing what matters.', 'Good remodelling starts by understanding the building that is already there, then changing the parts that no longer serve the client.', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85', true, 30)
on conflict (slug) do nothing;
insert into public.services (slug, path, label, title, summary, image_url, is_confirmed, sort_order)
values ('design-architecture', '/design-architecture', 'Design & Architecture', 'Design decisions grounded in how the property needs to work.', 'A useful design balances ambition with site conditions, budget, materials, structure and the practical life of the finished space.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=85', false, 40)
on conflict (slug) do nothing;
insert into public.services (slug, path, label, title, summary, image_url, is_confirmed, sort_order)
values ('grey-structure', '/grey-structure', 'Grey Structure', 'A strong structural foundation for the work that follows.', 'The early stages set the quality, alignment and sequencing of the entire build. They deserve careful coordination.', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1800&q=85', false, 50)
on conflict (slug) do nothing;
insert into public.services (slug, path, label, title, summary, image_url, is_confirmed, sort_order)
values ('turnkey-construction', '/turnkey-construction', 'Turnkey Construction', 'One coordinated route from initial brief to completed property.', 'A turnkey project needs more than a long list of services. It needs one clear direction across design, construction, finishes and handover.', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1800&q=85', false, 60)
on conflict (slug) do nothing;
insert into public.services (slug, path, label, title, summary, image_url, is_confirmed, sort_order)
values ('project-management', '/project-management', 'Project Management', 'Keep decisions, people and progress moving together.', 'Construction is a sequence of connected decisions. Project management makes ownership, timing and next steps visible.', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=85', false, 70)
on conflict (slug) do nothing;

-- ---------- Pages (17 content-driven pages) ----------
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/who-we-are', 'Who we are', 'Construction managed with clarity from the first conversation.', 'Siraj Builders brings planning, coordination and responsible execution together so clients understand what is happening at every stage.', 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=85', 'A construction partner, not simply a contractor.', 'A well-run project depends on clear scope, visible decisions and people who take responsibility for the details. Our approach keeps the client, design and site moving in the same direction.', '["Clear project scope","Responsible site coordination","Consistent communication","Defined handover"]'::jsonb, null, 10)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/residential-construction', 'Residential construction', 'Homes built around the way people actually live.', 'From the first brief through structure, finishes and handover, every decision should serve the life the property is meant to support.', 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1800&q=85', 'Build the home around its daily use.', 'We coordinate residential work around the intended layout, materials, services, schedule and finishing requirements, keeping progress understandable as the project develops.', '["Planning and scope","Structural coordination","Finishes and materials","Quality review"]'::jsonb, null, 20)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/renovation-remodelling', 'Renovation & remodelling', 'Improve an existing property without losing what matters.', 'Good remodelling starts by understanding the building that is already there, then changing the parts that no longer serve the client.', 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=85', 'Respect the existing property. Improve the experience.', 'We assess existing conditions, coordinate changes to layout and services, and sequence work so new finishes meet the old with intention.', '["Existing-condition review","Layout improvements","Services integration","Finishing coordination"]'::jsonb, null, 30)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/design-architecture', 'Design & architecture', 'Design decisions grounded in how the property needs to work.', 'A useful design balances ambition with site conditions, budget, materials, structure and the practical life of the finished space.', 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=85', 'From design intent to buildable decisions.', 'We help connect the brief, drawings and construction realities early, so the design can be carried into delivery without unnecessary surprises.', '["Brief development","Spatial planning","Material direction","Construction coordination"]'::jsonb, null, 40)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/grey-structure', 'Grey structure', 'A strong structural foundation for the work that follows.', 'The early stages set the quality, alignment and sequencing of the entire build. They deserve careful coordination.', 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1800&q=85', 'Structure first. Clarity at every stage.', 'From site preparation through structural work, we keep drawings, materials, workmanship and progress aligned with the agreed project requirements.', '["Site preparation","Foundation and structure","Material coordination","Stage-by-stage review"]'::jsonb, null, 50)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/turnkey-construction', 'Turnkey construction', 'One coordinated route from initial brief to completed property.', 'A turnkey project needs more than a long list of services. It needs one clear direction across design, construction, finishes and handover.', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1800&q=85', 'A complete property, managed as one project.', 'We coordinate the major decisions and handoffs so the client has a clear view of scope, progress, quality and completion.', '["Single project direction","Design and build coordination","Finishes and installation","Final handover"]'::jsonb, null, 60)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/project-management', 'Project management', 'Keep decisions, people and progress moving together.', 'Construction is a sequence of connected decisions. Project management makes ownership, timing and next steps visible.', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=85', 'The work is easier to manage when it is visible.', 'We structure communication, sequencing and reviews around the agreed scope so issues can be addressed before they become expensive delays.', '["Programme coordination","Trade and site alignment","Progress communication","Quality and close-out"]'::jsonb, null, 70)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/our-process', 'Our process', 'A clear route from first conversation to final handover.', 'Every project is different, but the need for clear stages, decisions and communication stays the same.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1800&q=85', 'Five stages. One connected project.', 'We begin with the requirement, establish the scope, coordinate preparation, manage execution and review the completed work before handover.', '["01 — Understand","02 — Plan","03 — Prepare","04 — Build","05 — Handover"]'::jsonb, null, 80)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/leadership', 'Leadership', 'Well-managed projects start with clear responsibility.', 'Leadership in construction means knowing who decides what, coordinating across teams and being accountable for delivery.', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1800&q=85', 'Clear roles create better momentum.', 'Decisions have owners, sites have leads and clients have a clear path for questions and updates.', '["Accountability","Communication","Coordination","Responsible decisions"]'::jsonb, null, 90)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/role-definition', 'Role definition', 'Every project role, clearly defined.', 'Projects move better when everyone knows what they own, what they do not own and where the handoffs happen.', 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=85', 'Clarity reduces overlap.', 'We define responsibilities around the project so decisions do not sit unanswered and important work does not fall between roles.', '["Client direction","Project management","Site supervision","Specialist coordination"]'::jsonb, null, 100)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/subcontractors', 'Subcontractors', 'Specialists coordinated around the agreed project.', 'External specialists add value when their scope, timing and communication remain clear.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1800&q=85', 'The right specialist in the right sequence.', 'We coordinate specialist work against the drawings, programme and quality expectations of the wider project.', '["Defined scope","Sequenced work","Site coordination","Quality review"]'::jsonb, null, 110)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/international', 'International projects', 'Clear project coordination across distance and complexity.', 'When clients, consultants or properties are in different locations, communication and documentation matter even more.', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=85', 'Make the project visible from anywhere.', 'Structured updates, documented decisions and coordinated information help keep remote stakeholders connected to the work.', '["Remote communication","Documented decisions","Local coordination","Visible progress"]'::jsonb, null, 120)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/locations', 'Locations', 'A project approach that starts with the property itself.', 'Site conditions, access, local requirements and the surrounding context all shape how construction should be planned.', 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1800&q=85', 'Every location has its own realities.', 'We begin by understanding the property and its context before fixing the scope, sequence or delivery assumptions.', '["Property assessment","Access and logistics","Local coordination","Project-specific planning"]'::jsonb, null, 130)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/cost-index', 'Cost index', 'Construction cost becomes clearer when the scope is clear.', 'There is no useful universal price without understanding size, specifications, site conditions, materials and intended outcome.', 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1800&q=85', 'Start with decisions, not a guess.', 'Use the initial conversation to clarify the project variables that shape cost, then develop a project-specific basis for discussion.', '["Scope","Size and site","Materials","Finishes and services"]'::jsonb, null, 140)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/privacy-policy', 'Privacy policy', 'Your project information should be handled with care.', 'We use information shared through this website to understand project requirements and respond to enquiries.', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=85', 'Clear information, clear purpose.', 'Only share the details needed to help us understand your enquiry. Contact details and project information should be used for the conversation you requested.', '["Information you share","Why it is used","How enquiries are handled","Your questions"]'::jsonb, null, 150)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/terms', 'Terms', 'A clear starting point for using this website.', 'These terms describe the basic expectations when browsing the Siraj Builders website and submitting an enquiry.', 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1800&q=85', 'Useful information, responsibly presented.', 'Website content is provided as general project information. Final scope, pricing, timing and responsibilities should always be confirmed for the individual project.', '["Website information","Project discussions","Enquiry details","Responsible use"]'::jsonb, null, 160)
on conflict (path) do nothing;
insert into public.pages (path, eyebrow, title, intro, image_url, heading, body, points, motif, sort_order)
values ('/project-showcase', 'Project visibility', 'Know what is happening, and what comes next.', 'Construction becomes easier to live with when progress, decisions and responsibilities stay visible to the people paying for the work.', 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=85', 'The work is easier to manage when it is visible.', 'We structure communication around the agreed scope: what has been completed, what is under way, and where a client decision is needed next. Reporting format and frequency are agreed per project.', '["Structured progress updates","Documented decisions","Defined responsibilities","Clear next steps"]'::jsonb, null, 170)
on conflict (path) do nothing;

-- ---------- FAQ categories ----------
insert into public.faq_categories (key, label, sort_order)
values ('services', 'Services', 10)
on conflict (key) do nothing;
insert into public.faq_categories (key, label, sort_order)
values ('start', 'Getting started', 20)
on conflict (key) do nothing;
insert into public.faq_categories (key, label, sort_order)
values ('cost', 'Cost & estimates', 30)
on conflict (key) do nothing;
insert into public.faq_categories (key, label, sort_order)
values ('timeline', 'Timeline', 40)
on conflict (key) do nothing;
insert into public.faq_categories (key, label, sort_order)
values ('process', 'Process & communication', 50)
on conflict (key) do nothing;
insert into public.faq_categories (key, label, sort_order)
values ('quality', 'Quality & materials', 60)
on conflict (key) do nothing;
insert into public.faq_categories (key, label, sort_order)
values ('contact', 'Contact', 70)
on conflict (key) do nothing;

-- ---------- FAQ questions (19 total) ----------
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'What services does Siraj Builders provide?', 'Siraj Builders presents services around residential construction, commercial construction, renovation and remodelling, and other project delivery services shown on the website. The exact scope available for a particular project should be confirmed during the initial discussion.', 10 from public.faq_categories where key = 'services'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'What types of construction projects do you handle?', 'The website is structured around residential, commercial and renovation projects. Project suitability depends on the required scope, property and delivery requirements.', 20 from public.faq_categories where key = 'services'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'Do you work on residential projects?', 'Yes. Residential construction is presented as a core service, covering a structured approach from initial requirements through construction, finishing and handover, subject to the agreed scope.', 30 from public.faq_categories where key = 'services'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'Do you handle commercial construction?', 'Commercial construction is presented as a service focused on functional spaces, coordination, site supervision, material management, quality review and completion, with capabilities confirmed per project.', 40 from public.faq_categories where key = 'services'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'How do I start a construction project with Siraj Builders?', 'Start by sharing the property location, project type, approximate size, intended use, desired scope and any drawings or requirements you already have. This provides a basis for the initial conversation.', 10 from public.faq_categories where key = 'start'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'What information is needed before starting a project?', 'Useful information includes the property location, plot or property size, project type, intended use, expected start period, available drawings and your main requirements.', 20 from public.faq_categories where key = 'start'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'How is the project scope determined?', 'The scope is developed by understanding the project requirements, property conditions, drawings or specifications and the work that needs to be coordinated. The final scope should be agreed before execution begins.', 30 from public.faq_categories where key = 'start'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'How is a construction estimate prepared?', 'An estimate should reflect the agreed scope, drawings or specifications, property conditions, materials and other relevant project requirements. A project-specific estimate should be discussed after the scope is understood.', 10 from public.faq_categories where key = 'cost'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'What factors affect construction costs?', 'Costs can vary with project size, scope, design requirements, site conditions, materials, finishes, specifications and other project-specific decisions. There is no single reliable price without understanding those factors.', 20 from public.faq_categories where key = 'cost'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'Can I request a project quotation?', 'Yes. You can use the consultation or contact form to share the basics of your project. The team can then determine the appropriate next step and quotation process.', 30 from public.faq_categories where key = 'cost'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'How long does a construction project usually take?', 'There is no universal timeline. Duration depends on the property size, scope, design, site conditions, materials and other factors. A project-specific timeline should be discussed once the scope is established.', 10 from public.faq_categories where key = 'timeline'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'What factors can affect the project timeline?', 'Changes in scope, design decisions, site conditions, material availability, coordination requirements and other project-specific circumstances can affect timing. The agreed project plan should be used as the reference point.', 20 from public.faq_categories where key = 'timeline'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'What is the typical construction process?', 'The website describes a general route of consultation, site assessment, planning and design, estimation and scope, project preparation, construction and supervision, quality review, and handover.', 10 from public.faq_categories where key = 'process'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'How do you manage project progress?', 'The intended approach is structured coordination and communication so clients can understand what has been completed, what is happening and what comes next. Exact reporting arrangements should be confirmed for each project.', 20 from public.faq_categories where key = 'process'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'How is communication handled during a project?', 'Communication is treated as part of the service. Project discussions should keep requirements, decisions, progress and responsibilities clear throughout the agreed scope.', 30 from public.faq_categories where key = 'process'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'How do you maintain construction quality?', 'Quality is approached through planning, appropriate materials and specifications, workmanship, site supervision and a review of completed work. Specific standards or warranties should be confirmed rather than assumed.', 10 from public.faq_categories where key = 'quality'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'How are materials selected?', 'Material choices should reflect the project requirements, specifications, intended use, budget and agreed scope. Specific material-selection support should be discussed for the project.', 20 from public.faq_categories where key = 'quality'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'How can I request a consultation?', 'Use the Contact page to provide your project details and request a consultation. The information helps establish the appropriate next step.', 10 from public.faq_categories where key = 'contact'
on conflict do nothing;
insert into public.faqs (category_id, question, answer, sort_order)
select id, 'How can I contact Siraj Builders?', 'Use the website Contact page to submit your project information. Phone, WhatsApp, email and office details can be connected when the verified company details are available.', 20 from public.faq_categories where key = 'contact'
on conflict do nothing;

-- ---------- Homepage hero slides ----------
insert into public.hero_slides (eyebrow, title, lead, image_url, primary_label, primary_to, secondary_label, secondary_to, sort_order)
select '01 · Residential Construction', 'Built with clarity. Managed with care.', 'A structured construction experience for homeowners who want clear planning, responsible execution and consistent communication — from the first conversation to the final handover.', 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=2400&q=88', 'Discuss Your Project', '/consultation', 'View Our Projects', '/projects', 10
where not exists (select 1 from public.hero_slides where title = 'Built with clarity. Managed with care.');
insert into public.hero_slides (eyebrow, title, lead, image_url, primary_label, primary_to, secondary_label, secondary_to, sort_order)
select '02 · Commercial Construction', 'Spaces planned around how businesses work.', 'From functional planning to coordinated execution, keep commercial construction focused on the purpose of the finished space — movement, usability and durability.', 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2400&q=88', 'Explore Commercial', '/commercial-construction', 'Start a Conversation', '/consultation', 20
where not exists (select 1 from public.hero_slides where title = 'Spaces planned around how businesses work.');
insert into public.hero_slides (eyebrow, title, lead, image_url, primary_label, primary_to, secondary_label, secondary_to, sort_order)
select '03 · Project Management', 'Know what is happening. Know what comes next.', 'Professional project management brings decisions, people, materials and construction stages into a clearer route from plan to completion.', 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2400&q=88', 'See Our Approach', '/project-management', 'Read FAQs', '/faq', 30
where not exists (select 1 from public.hero_slides where title = 'Know what is happening. Know what comes next.');
insert into public.hero_slides (eyebrow, title, lead, image_url, primary_label, primary_to, secondary_label, secondary_to, sort_order)
select '04 · Renovation & Remodelling', 'Improve the space you already have.', 'Thoughtful renovation starts with understanding the existing property, then coordinating the changes that improve function, appearance and use.', 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=2400&q=88', 'Explore Renovation', '/renovation-remodelling', 'Discuss Your Project', '/consultation', 40
where not exists (select 1 from public.hero_slides where title = 'Improve the space you already have.');

-- ---------- Deliberately empty ----------
-- public.projects      — TO-CONFIRM.md §3: no verified projects supplied.
-- public.testimonials  — TO-CONFIRM.md §4: only verified testimonials may appear.
-- public.team_members  — TO-CONFIRM.md §6: no verified biographies supplied.
-- public.stats         — TO-CONFIRM.md §5: "Do not fill these with invented numbers."

-- ############################################################################
-- ##  VISUAL SECTION CMS  (added by migration-01-sections.sql)
-- ############################################################################

insert into public.page_sections
  (page_path, page_label, section_key, label, section_type, eyebrow, title, subtitle, body, cta_label, cta_href, position, is_enabled)
values

-- ---------------------------------------------------------------- HOME ------
('/', 'Home', 'hero', 'Hero Section', 'hero',
 '',
 'Construction, managed from the first plan to the final detail.',
 'Clear planning. Responsible execution. Consistent communication.',
 'A well-built project begins long before construction starts. Siraj Builders brings together planning, coordination and on-site execution to create a more organised construction experience for homeowners, businesses and property investors.',
 'Discuss Your Project', '/consultation', 0, true),

('/', 'Home', 'intro', 'Introduction', 'intro',
 '',
 'A construction partner, not simply a contractor.',
 '',
 'Construction involves hundreds of decisions — from the first scope of work to materials, scheduling, site coordination and final finishing. Siraj Builders is built around a straightforward principle: clients should understand their project and feel confident about how it is being managed.',
 'Learn About Siraj Builders', '/who-we-are', 1, true),

('/', 'Home', 'services', 'Services Section', 'services',
 '',
 'Solutions built around the project',
 '',
 'Whether the requirement is a new property, commercial space, renovation or a broader design-and-build assignment, the right solution starts by understanding the project itself.',
 'View All Services', '/services', 2, true),

('/', 'Home', 'projects', 'Projects Section', 'projects',
 '',
 'See the work, not just the promise.',
 '',
 'Every completed project tells a different story. Our portfolio showcases the spaces we have delivered, the requirements behind them and the work involved in bringing each project together.',
 'View All Projects', '/projects', 3, true),

('/', 'Home', 'why-us', 'Why Siraj Builders', 'content',
 '',
 'What a better-managed project looks like',
 '',
 'Clear expectations, organised execution and attention to the details that shape the finished result.',
 '', '', 4, true),

('/', 'Home', 'process', 'Process Preview', 'process',
 '',
 'A clear route from idea to completion',
 '',
 'Seven stages, from the first conversation through to handover.',
 'See Our Full Process', '/our-process', 5, true),

('/', 'Home', 'stats', 'Statistics', 'stats',
 '', 'Verified numbers', '', '', '', '', 6, true),

('/', 'Home', 'testimonials', 'Testimonials', 'testimonials',
 '',
 'What our clients say about working with us.',
 '', '', '', '', 7, true),

('/', 'Home', 'faq', 'FAQ Section', 'faq',
 '',
 'Questions clients ask before starting',
 '', '',
 'Read all FAQs', '/faq', 8, true),

('/', 'Home', 'cta', 'Final CTA', 'cta',
 '',
 'Have a project in mind? Start with a conversation.',
 '',
 'Tell us what you are planning, where the property is located and what you need from your construction partner.',
 'Discuss Your Project', '/consultation', 9, true),

-- --------------------------------------------------------------- ABOUT ------
('/who-we-are', 'About', 'hero', 'Hero Section', 'hero',
 '',
 'Built around a better way to manage construction.',
 '',
 'Siraj Builders is a construction company focused on delivering professionally managed building projects with attention to planning, execution and client communication.',
 'Discuss Your Project', '/consultation', 0, true),

('/who-we-are', 'About', 'story', 'Our Story', 'content',
 '', 'Our story', '',
 'Add the real founding story here — when the company started, why it was founded, how it developed and where it is heading.',
 '', '', 1, true),

('/who-we-are', 'About', 'approach', 'Our Approach', 'content',
 '', 'Our approach', '',
 'Understanding before execution. Planning before construction. Communication throughout. Attention to detail until completion.',
 '', '', 2, true),

('/who-we-are', 'About', 'team', 'Team Section', 'team',
 '', 'The people behind the projects', '', '',
 'Meet the team', '/leadership', 3, true),

-- ------------------------------------------------------------ SERVICES ------
('/services', 'Services', 'hero', 'Hero Section', 'hero',
 '',
 'Construction solutions for projects that deserve a structured approach.',
 '',
 'Different properties require different approaches. A new home, commercial building and renovation project share the same construction principles, but their priorities and execution requirements are different.',
 'Discuss Your Project', '/consultation', 0, true),

('/services', 'Services', 'list', 'Services List', 'services',
 '', 'What we deliver', '', '', '', '', 1, true),

('/services', 'Services', 'cta', 'CTA Section', 'cta',
 '',
 'Not sure which service fits your project?',
 '',
 'Share the basics and we will help establish the appropriate next step.',
 'Request a Consultation', '/consultation', 2, true),

-- ------------------------------------------------------------ PROJECTS ------
('/projects', 'Projects', 'hero', 'Hero Section', 'hero',
 '',
 'Projects that show how we work.',
 '',
 'A portfolio should do more than display attractive photographs. It should show the thinking, scope and execution behind the finished project.',
 '', '', 0, true),

('/projects', 'Projects', 'grid', 'Project Grid', 'projects',
 '', 'Our work', '', '', '', '', 1, true),

('/projects', 'Projects', 'cta', 'CTA Section', 'cta',
 '', 'Have a project in mind?', '',
 'Start with a clear conversation about your requirements, property and next steps.',
 'Discuss Your Project', '/consultation', 2, true),

-- ------------------------------------------------------------- PROCESS ------
('/our-process', 'Our Process', 'hero', 'Hero Section', 'hero',
 '',
 'A construction process you can understand.',
 '',
 'The purpose of our process is simple: reduce uncertainty.',
 '', '', 0, true),

('/our-process', 'Our Process', 'steps', 'Process Steps', 'process',
 '', 'From consultation to handover', '', '', '', '', 1, true),

-- ----------------------------------------------------------------- FAQ ------
('/faq', 'FAQ', 'hero', 'Hero Section', 'hero',
 '',
 'Questions worth asking before you build.',
 '',
 'If your question is not answered here, ask us directly.',
 '', '', 0, true),

('/faq', 'FAQ', 'list', 'FAQ List', 'faq',
 '', 'Frequently asked questions', '', '', '', '', 1, true),

-- ------------------------------------------------------------- CONTACT ------
('/contact-us', 'Contact', 'hero', 'Hero Section', 'hero',
 '',
 'Let''s talk about your project.',
 '',
 'Whether you are still exploring your options or already have drawings and a defined scope, the best place to begin is a conversation.',
 '', '', 0, true),

('/contact-us', 'Contact', 'details', 'Contact Details', 'contact',
 '', 'How to reach us', '', '', '', '', 1, true),

('/contact-us', 'Contact', 'form', 'Contact Form', 'contact',
 '',
 'Tell us about your project',
 '',
 'The more we understand about your project, the better we can guide the initial conversation.',
 'Discuss My Project', '', 2, true),

-- -------------------------------------------------------- CONSULTATION ------
('/consultation', 'Consultation', 'hero', 'Hero Section', 'hero',
 '',
 'Start with clarity. Then build.',
 '',
 'A consultation gives us an opportunity to understand your requirements before discussing the appropriate path forward.',
 '', '', 0, true),

('/consultation', 'Consultation', 'form', 'Consultation Form', 'contact',
 '', 'Request a consultation', '', '', 'Request a Consultation', '', 1, true)

on conflict (page_path, section_key) do nothing;


-- ############################################################################
-- ##  SECTION MAP, PART 2 — the remaining pages (source: seed-sections-2.sql)
-- ############################################################################

insert into public.page_sections
  (page_path, page_label, section_key, label, section_type, title, body, settings, position, is_enabled)
values
('/residential-construction', 'Residential Construction', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/residential-construction', 'Residential Construction', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/residential-construction', 'Residential Construction', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/residential-construction', 'Residential Construction', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/renovation-remodelling', 'Renovation & Remodelling', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/renovation-remodelling', 'Renovation & Remodelling', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/renovation-remodelling', 'Renovation & Remodelling', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/renovation-remodelling', 'Renovation & Remodelling', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/design-architecture', 'Design & Architecture', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/design-architecture', 'Design & Architecture', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/design-architecture', 'Design & Architecture', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/design-architecture', 'Design & Architecture', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/grey-structure', 'Grey Structure', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/grey-structure', 'Grey Structure', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/grey-structure', 'Grey Structure', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/grey-structure', 'Grey Structure', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/turnkey-construction', 'Turnkey Construction', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/turnkey-construction', 'Turnkey Construction', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/turnkey-construction', 'Turnkey Construction', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/turnkey-construction', 'Turnkey Construction', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/project-management', 'Project Management', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/project-management', 'Project Management', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/project-management', 'Project Management', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/project-management', 'Project Management', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/leadership', 'Leadership', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/leadership', 'Leadership', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/leadership', 'Leadership', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/leadership', 'Leadership', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/locations', 'Locations', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/locations', 'Locations', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/locations', 'Locations', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/locations', 'Locations', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/international', 'International', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/international', 'International', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/international', 'International', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/international', 'International', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/subcontractors', 'Subcontractors', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/subcontractors', 'Subcontractors', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/subcontractors', 'Subcontractors', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/subcontractors', 'Subcontractors', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/role-definition', 'Role Definition', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/role-definition', 'Role Definition', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/role-definition', 'Role Definition', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/role-definition', 'Role Definition', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/cost-index', 'Cost Index', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/cost-index', 'Cost Index', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/cost-index', 'Cost Index', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/cost-index', 'Cost Index', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/project-showcase', 'Project Showcase', 'hero', 'Hero Section', 'hero', 'Page heading and intro', 'Eyebrow, title, intro paragraph and hero image.', '{"source":"pages","editor":"Pages"}'::jsonb, 0, true),
('/project-showcase', 'Project Showcase', 'body', 'Main Content', 'content', 'Main body', 'Heading, body copy and the bullet points beneath it.', '{"source":"pages","editor":"Pages"}'::jsonb, 1, true),
('/project-showcase', 'Project Showcase', 'detail', 'Secondary Content', 'content', 'Supporting band', 'The light band below the main content.', '{"source":"pages","editor":"Pages"}'::jsonb, 2, true),
('/project-showcase', 'Project Showcase', 'cta', 'CTA Section', 'cta', 'Closing call to action', 'The panel that invites the visitor to get in touch.', '{"source":"pages","editor":"Pages"}'::jsonb, 3, true),
('/commercial-construction', 'Commercial Construction', 'hero', 'Hero Section', 'hero', '', '', '{"source":"page","editor":"code"}'::jsonb, 0, true),
('/commercial-construction', 'Commercial Construction', 'approach', 'Our Approach', 'content', '', '', '{"source":"page","editor":"code"}'::jsonb, 1, true),
('/commercial-construction', 'Commercial Construction', 'focus', 'Focus Areas', 'content', '', '', '{"source":"page","editor":"code"}'::jsonb, 2, true),
('/commercial-construction', 'Commercial Construction', 'proof', 'Proof / Projects', 'projects', '', '', '{"source":"page","editor":"code"}'::jsonb, 3, true),
('/commercial-construction', 'Commercial Construction', 'cta', 'CTA Banner', 'cta', '', '', '{"source":"page","editor":"code"}'::jsonb, 4, true),
('/affiliates', 'Affiliates', 'hero', 'Hero Section', 'hero', '', '', '{"source":"page","editor":"code"}'::jsonb, 0, true),
('/affiliates', 'Affiliates', 'intro', 'Introduction', 'intro', '', '', '{"source":"page","editor":"code"}'::jsonb, 1, true),
('/affiliates', 'Affiliates', 'partners', 'Partner Network', 'content', '', '', '{"source":"page","editor":"code"}'::jsonb, 2, true),
('/affiliates', 'Affiliates', 'standards', 'Standards', 'content', '', '', '{"source":"page","editor":"code"}'::jsonb, 3, true),
('/affiliates', 'Affiliates', 'cta', 'CTA Banner', 'cta', '', '', '{"source":"page","editor":"code"}'::jsonb, 4, true)
on conflict (page_path, section_key) do nothing;



-- ##########################################################################
-- ##
-- ##   STEP 4 OF 5 — CMS STRUCTURE (media, SEO, storage)
-- ##   (source file: database/migration-02-cms.sql)
-- ##
-- ##########################################################################

-- ============================================================================
--  SIRAJ BUILDERS — MIGRATION 02: DYNAMIC CMS STRUCTURE
--  ----------------------------------------------------------------------------
--  Run AFTER schema.sql + policies.sql (or after install.sql from an earlier
--  release). Then run migration-03-content.sql.
--
--  Adds:
--    * project_media           — many images + videos per project, ordered
--    * projects                — full case-study fields + SEO fields
--    * pages                   — per-page SEO title / description / share image
--    * faqs                    — show_on_home flag, duplicate protection
--    * page_sections           — two new section types: trust, features
--    * reorder_rows()          — one-call drag/arrow reordering for any list
--    * Storage bucket          — 'site-media' for admin image/video uploads
--    * RLS + grants for all of the above
--
--  Safe to run more than once: every statement is guarded.
--  Nothing here deletes content.
-- ============================================================================

-- ----------------------------------------------------------------------------
--  1. PROJECTS — case-study fields
-- ----------------------------------------------------------------------------
alter table public.projects add column if not exists timeline          text not null default '';
alter table public.projects add column if not exists scope             text not null default '';
alter table public.projects add column if not exists approach          text not null default '';  -- construction approach
alter table public.projects add column if not exists quality           text not null default '';  -- quality & management
alter table public.projects add column if not exists client_feedback   text not null default '';
alter table public.projects add column if not exists feedback_verified boolean not null default false;
alter table public.projects add column if not exists service_slug      text not null default '';  -- links to services.slug
alter table public.projects add column if not exists seo_title         text not null default '';
alter table public.projects add column if not exists seo_description   text not null default '';

-- Columns added by migration-01, repeated so this file also works on a
-- database that skipped it.
alter table public.projects add column if not exists short_description text not null default '';
alter table public.projects add column if not exists full_description  text not null default '';
alter table public.projects add column if not exists features          jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists tags              jsonb not null default '[]'::jsonb;
alter table public.projects add column if not exists banner_url        text not null default '';
alter table public.projects add column if not exists video_url         text not null default '';
alter table public.projects add column if not exists client_name       text not null default '';
alter table public.projects add column if not exists completion_date   date;
alter table public.projects add column if not exists is_featured       boolean not null default false;

create index if not exists projects_service_idx on public.projects (service_slug);

-- ----------------------------------------------------------------------------
--  2. PROJECT MEDIA — one row per image or video
--     projects.image_url stays the FEATURED image (used on cards and the
--     case-study hero); the admin sets it from this list with one click.
-- ----------------------------------------------------------------------------
create table if not exists public.project_media (
  id            uuid primary key default gen_random_uuid(),
  project_id    uuid not null references public.projects (id) on delete cascade,
  kind          text not null default 'image' check (kind in ('image', 'video')),
  url           text not null,
  storage_path  text not null default '',   -- set when uploaded to the site-media bucket
  caption       text not null default '',
  alt_text      text not null default '',
  sort_order    integer not null default 0,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists project_media_project_idx
  on public.project_media (project_id, kind, sort_order);

drop trigger if exists project_media_touch on public.project_media;
create trigger project_media_touch before update on public.project_media
  for each row execute function public.touch_updated_at();

-- Carry the old textarea gallery + single video into the new table, once.
insert into public.project_media (project_id, kind, url, sort_order)
select p.id, 'image', g.url, (g.ord - 1)::int
from public.projects p
cross join lateral jsonb_array_elements_text(
  case when jsonb_typeof(p.gallery) = 'array' then p.gallery else '[]'::jsonb end
) with ordinality as g(url, ord)
where trim(g.url) <> ''
  and not exists (select 1 from public.project_media m where m.project_id = p.id and m.kind = 'image');

insert into public.project_media (project_id, kind, url, sort_order)
select p.id, 'video', p.video_url, 0
from public.projects p
where trim(p.video_url) <> ''
  and not exists (select 1 from public.project_media m where m.project_id = p.id and m.kind = 'video');

-- ----------------------------------------------------------------------------
--  3. PAGES — per-page SEO. The `pages` table is now the page registry:
--     one row per public route, with publish switch and SEO fields. Page
--     copy itself lives in page_sections.
-- ----------------------------------------------------------------------------
alter table public.pages add column if not exists label           text not null default '';
alter table public.pages add column if not exists seo_title       text not null default '';
alter table public.pages add column if not exists seo_description text not null default '';
alter table public.pages add column if not exists og_image        text not null default '';

-- ----------------------------------------------------------------------------
--  4. SERVICES — button text on the service card
-- ----------------------------------------------------------------------------
alter table public.services add column if not exists cta_label text not null default '';

-- ----------------------------------------------------------------------------
--  5. FAQS — homepage flag + no more duplicates on re-seeding
-- ----------------------------------------------------------------------------
alter table public.faqs add column if not exists show_on_home boolean not null default false;

-- An earlier seed used `on conflict do nothing` without a unique key, so
-- re-running it duplicated every question. Keep the oldest copy of each.
delete from public.faqs f
using public.faqs older
where lower(trim(f.question)) = lower(trim(older.question))
  and (older.created_at, older.id) < (f.created_at, f.id);

create unique index if not exists faqs_question_unique
  on public.faqs (lower(trim(question)));

-- ----------------------------------------------------------------------------
--  6. PAGE SECTIONS — two new types used by the documented layouts
-- ----------------------------------------------------------------------------
alter table public.page_sections drop constraint if exists page_sections_section_type_check;
alter table public.page_sections add constraint page_sections_section_type_check
  check (section_type in (
    'hero', 'intro', 'content', 'features', 'trust', 'services', 'projects',
    'testimonials', 'faq', 'stats', 'process', 'team', 'cta', 'gallery',
    'contact', 'custom'
  ));

-- ----------------------------------------------------------------------------
--  7. REORDER — rewrites sort_order for a whole list in one statement.
--     security INVOKER on purpose: RLS still decides who may write. The
--     table name is checked against a fixed list before it is used.
-- ----------------------------------------------------------------------------
create or replace function public.reorder_rows(target_table text, ordered_ids uuid[])
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if target_table not in (
    'projects', 'project_media', 'services', 'faqs', 'faq_categories',
    'testimonials', 'team_members', 'stats', 'hero_slides', 'social_links'
  ) then
    raise exception 'reorder_rows: % cannot be reordered', target_table;
  end if;

  execute format(
    'update public.%I t set sort_order = idx.ord - 1
       from unnest($1::uuid[]) with ordinality as idx(id, ord)
      where t.id = idx.id',
    target_table
  ) using ordered_ids;
end;
$$;

revoke execute on function public.reorder_rows(text, uuid[]) from anon;
grant  execute on function public.reorder_rows(text, uuid[]) to authenticated;

-- ----------------------------------------------------------------------------
--  8. ROW LEVEL SECURITY — project_media follows its project
-- ----------------------------------------------------------------------------
alter table public.project_media enable row level security;

drop policy if exists project_media_public_read on public.project_media;
drop policy if exists project_media_admin_all   on public.project_media;

create policy project_media_public_read on public.project_media
  for select to anon, authenticated
  using (
    public.is_admin()
    or exists (
      select 1 from public.projects p
      where p.id = project_media.project_id and p.is_active
    )
  );

create policy project_media_admin_all on public.project_media
  for all to authenticated
  using (public.is_editor())
  with check (public.is_editor());

grant select on public.project_media to anon, authenticated;
grant select, insert, update, delete on public.project_media to authenticated;

-- page_sections grants, repeated in case migration-01 ran without them
grant select on public.page_sections to anon, authenticated;
grant select, insert, update, delete on public.page_sections to authenticated;

-- ----------------------------------------------------------------------------
--  9. STORAGE — public bucket for website images and short videos
--      Visitors can view files (the bucket is public). Only active editors
--      and admins can upload, replace or delete — checked by is_editor().
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media', 'site-media', true, 52428800,
  array['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif',
        'video/mp4', 'video/webm']
)
on conflict (id) do update
  set public = true,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists site_media_public_read  on storage.objects;
drop policy if exists site_media_editor_insert on storage.objects;
drop policy if exists site_media_editor_update on storage.objects;
drop policy if exists site_media_editor_delete on storage.objects;

create policy site_media_public_read on storage.objects
  for select to anon, authenticated
  using (bucket_id = 'site-media');

create policy site_media_editor_insert on storage.objects
  for insert to authenticated
  with check (bucket_id = 'site-media' and public.is_editor());

create policy site_media_editor_update on storage.objects
  for update to authenticated
  using (bucket_id = 'site-media' and public.is_editor())
  with check (bucket_id = 'site-media' and public.is_editor());

create policy site_media_editor_delete on storage.objects
  for delete to authenticated
  using (bucket_id = 'site-media' and public.is_editor());

-- ----------------------------------------------------------------------------
--  10. DASHBOARD COUNTS — include media
-- ----------------------------------------------------------------------------
create or replace function public.dashboard_counts()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select case when not public.is_admin() then null else json_build_object(
    'submissions_total',  (select count(*) from public.submissions),
    'submissions_unread', (select count(*) from public.submissions where is_read = false),
    'submissions_new',    (select count(*) from public.submissions where status = 'new'),
    'projects_total',     (select count(*) from public.projects),
    'projects_active',    (select count(*) from public.projects where is_active),
    'media_total',        (select count(*) from public.project_media),
    'services_total',     (select count(*) from public.services where is_active),
    'pages_total',        (select count(*) from public.pages where is_published),
    'faqs_total',         (select count(*) from public.faqs where is_active),
    'faqs_unanswered',    (select count(*) from public.faqs where not is_active),
    'testimonials_total', (select count(*) from public.testimonials where is_active and is_verified),
    'team_total',         (select count(*) from public.team_members where is_active)
  ) end;
$$;

revoke execute on function public.dashboard_counts() from anon;
grant  execute on function public.dashboard_counts() to authenticated;

notify pgrst, 'reload schema';



-- ##########################################################################
-- ##
-- ##   STEP 5 OF 5 — DOCUMENTED CONTENT
-- ##   (source file: database/migration-03-content.sql)
-- ##
-- ##########################################################################

-- ============================================================================
--  SIRAJ BUILDERS — MIGRATION 03: DOCUMENTED CONTENT
--  GENERATED by database/build-content.cjs from database/content-source.cjs.
--  Do not edit by hand — edit content-source.cjs and run `npm run build:content`.
--  ----------------------------------------------------------------------------
--  Run AFTER migration-02-cms.sql. Safe to run more than once.
--
--  What it does — and what it will NOT touch:
--    * Page sections: replaces ONLY the sections seeded by the previous
--      release that nobody has edited since (updated_at = created_at).
--      Anything an admin edited or created is kept exactly as it is.
--    * FAQs: replaces only the old seeded questions nobody edited, then adds
--      the 20 documented questions. [TO CONFIRM] ones arrive unpublished,
--      with no answer, for the admin to complete.
--    * Services, pages, settings: fills BLANK fields only.
-- ============================================================================

begin;

-- 1. Remove unedited legacy sections -------------------------------------
delete from public.page_sections s
using (values
  ('/', 'hero'),
  ('/', 'intro'),
  ('/', 'services'),
  ('/', 'projects'),
  ('/', 'why-us'),
  ('/', 'process'),
  ('/', 'stats'),
  ('/', 'testimonials'),
  ('/', 'faq'),
  ('/', 'cta'),
  ('/who-we-are', 'hero'),
  ('/who-we-are', 'story'),
  ('/who-we-are', 'approach'),
  ('/who-we-are', 'team'),
  ('/services', 'hero'),
  ('/services', 'list'),
  ('/services', 'cta'),
  ('/projects', 'hero'),
  ('/projects', 'grid'),
  ('/projects', 'cta'),
  ('/our-process', 'hero'),
  ('/our-process', 'steps'),
  ('/faq', 'hero'),
  ('/faq', 'list'),
  ('/contact-us', 'hero'),
  ('/contact-us', 'details'),
  ('/contact-us', 'form'),
  ('/consultation', 'hero'),
  ('/consultation', 'form'),
  ('/residential-construction', 'hero'),
  ('/residential-construction', 'body'),
  ('/residential-construction', 'detail'),
  ('/residential-construction', 'cta'),
  ('/renovation-remodelling', 'hero'),
  ('/renovation-remodelling', 'body'),
  ('/renovation-remodelling', 'detail'),
  ('/renovation-remodelling', 'cta'),
  ('/design-architecture', 'hero'),
  ('/design-architecture', 'body'),
  ('/design-architecture', 'detail'),
  ('/design-architecture', 'cta'),
  ('/grey-structure', 'hero'),
  ('/grey-structure', 'body'),
  ('/grey-structure', 'detail'),
  ('/grey-structure', 'cta'),
  ('/turnkey-construction', 'hero'),
  ('/turnkey-construction', 'body'),
  ('/turnkey-construction', 'detail'),
  ('/turnkey-construction', 'cta'),
  ('/project-management', 'hero'),
  ('/project-management', 'body'),
  ('/project-management', 'detail'),
  ('/project-management', 'cta'),
  ('/leadership', 'hero'),
  ('/leadership', 'body'),
  ('/leadership', 'detail'),
  ('/leadership', 'cta'),
  ('/locations', 'hero'),
  ('/locations', 'body'),
  ('/locations', 'detail'),
  ('/locations', 'cta'),
  ('/international', 'hero'),
  ('/international', 'body'),
  ('/international', 'detail'),
  ('/international', 'cta'),
  ('/subcontractors', 'hero'),
  ('/subcontractors', 'body'),
  ('/subcontractors', 'detail'),
  ('/subcontractors', 'cta'),
  ('/role-definition', 'hero'),
  ('/role-definition', 'body'),
  ('/role-definition', 'detail'),
  ('/role-definition', 'cta'),
  ('/cost-index', 'hero'),
  ('/cost-index', 'body'),
  ('/cost-index', 'detail'),
  ('/cost-index', 'cta'),
  ('/project-showcase', 'hero'),
  ('/project-showcase', 'body'),
  ('/project-showcase', 'detail'),
  ('/project-showcase', 'cta'),
  ('/commercial-construction', 'hero'),
  ('/commercial-construction', 'approach'),
  ('/commercial-construction', 'focus'),
  ('/commercial-construction', 'proof'),
  ('/commercial-construction', 'cta'),
  ('/affiliates', 'hero'),
  ('/affiliates', 'intro'),
  ('/affiliates', 'partners'),
  ('/affiliates', 'standards'),
  ('/affiliates', 'cta')
) as legacy(page_path, section_key)
where s.page_path = legacy.page_path
  and s.section_key = legacy.section_key
  and s.updated_at = s.created_at;

-- 2. Insert documented sections (existing keys are left alone) ----------
insert into public.page_sections
  (page_path, page_label, section_key, label, section_type, eyebrow, title, subtitle, body, items, media_url, video_url, cta_label, cta_href, settings, position, is_enabled)
values
  ('/', 'Home', 'hero', 'Hero slider', 'hero', '', 'Construction, managed from the first plan to the final detail.', 'Clear planning. Responsible execution. Consistent communication.', 'A well-built project begins long before construction starts. Siraj Builders brings together planning, coordination and on-site execution to create a more organised construction experience for homeowners, businesses and property investors.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"source":"hero_slides","cta2_label":"View Our Projects","cta2_href":"/projects"}'::jsonb, 0, true),
  ('/', 'Home', 'trust', 'Trust strip', 'trust', '', '', '', '', '[{"title":"Clear scope","body":"Defined before work begins","image":""},{"title":"Responsible execution","body":"Supervised on site","image":""},{"title":"Consistent updates","body":"Progress shared as it happens","image":""},{"title":"Defined handover","body":"Clear transition at completion","image":""}]'::jsonb, '', '', '', '', '{}'::jsonb, 1, true),
  ('/', 'Home', 'intro', 'Introduction', 'intro', 'A different construction experience', 'A construction partner, not simply a contractor.', '', 'Construction involves hundreds of decisions — from the first scope of work to materials, scheduling, site coordination and final finishing.

Siraj Builders is built around a straightforward principle: clients should understand their project and feel confident about how it is being managed.

We focus on organised execution, practical decision-making and careful attention to the details that shape the finished result.', '[]'::jsonb, 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1800&q=80', '', 'Learn About Siraj Builders', '/who-we-are', '{"theme":"white"}'::jsonb, 2, true),
  ('/', 'Home', 'services', 'Services', 'services', 'What we do', 'Solutions built around the project.', '', 'Whether the requirement is a new property, commercial space, renovation or a broader design-and-build assignment, the right solution starts by understanding the project itself.', '[]'::jsonb, '', '', 'Explore Our Services', '/services', '{"theme":"light","limit":3}'::jsonb, 3, true),
  ('/', 'Home', 'projects', 'Projects', 'projects', 'Selected work', 'See the work, not just the promise.', '', 'Every completed project tells a different story. Our portfolio showcases the spaces we have delivered, the requirements behind them and the work involved in bringing each project together.', '[]'::jsonb, '', '', 'View All Projects', '/projects', '{"theme":"dark","limit":3}'::jsonb, 4, true),
  ('/', 'Home', 'why-us', 'Why Siraj Builders', 'features', 'Why Siraj Builders', 'What a better-managed project looks like.', '', 'The difference is rarely one big promise. It is how the project is run, day after day.', '[{"title":"Clear expectations","body":"Good construction starts with understanding what is being built, why it is being built and what the project requires.","image":""},{"title":"Organised execution","body":"A structured approach helps coordinate decisions, materials, people and work across different stages.","image":""},{"title":"Attention to detail","body":"The final result is shaped by hundreds of smaller decisions. We treat those details as part of the project, not an afterthought.","image":""},{"title":"Client communication","body":"Construction becomes easier to manage when clients know what has happened, what is happening and what comes next.","image":""},{"title":"Practical decision-making","body":"We focus on solutions that make sense for the property''s intended use, project requirements and available resources.","image":""},{"title":"Accountability","body":"A professional construction relationship should have clear responsibilities, clear communication and a clear path forward when decisions need to be made.","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=80', '', '', '', '{"theme":"white","layout":"grid"}'::jsonb, 5, true),
  ('/', 'Home', 'process', 'Process preview', 'process', 'Our process', 'A clear route from idea to completion.', 'Pexels stock footage · Coordinating work on site', '', '[{"title":"Consultation","body":"Understand your requirements, property and project objectives.","image":""},{"title":"Site Assessment","body":"Review the site and identify the practical considerations that affect the project.","image":""},{"title":"Planning & Design","body":"Develop the project scope and coordinate the required planning and design work.","image":""},{"title":"Estimation","body":"Establish the scope, specifications and commercial requirements.","image":""},{"title":"Construction","body":"Move into organised execution with appropriate supervision and coordination.","image":""},{"title":"Quality Review","body":"Review completed work and address outstanding details.","image":""},{"title":"Handover","body":"Complete the project and transition the finished property to the client.","image":""}]'::jsonb, '', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', 'See Our Full Process', '/our-process', '{"theme":"light"}'::jsonb, 6, true),
  ('/', 'Home', 'stats', 'Verified numbers', 'stats', 'In numbers', 'Verified figures', '', 'Shown only when real, verified figures are added on the Statistics screen.', '[]'::jsonb, '', '', '', '', '{"theme":"white"}'::jsonb, 7, true),
  ('/', 'Home', 'testimonials', 'Testimonials', 'testimonials', 'Client feedback', 'What our clients say about working with us.', '', '', '[]'::jsonb, '', '', '', '', '{"theme":"light","limit":3}'::jsonb, 8, true),
  ('/', 'Home', 'faq', 'FAQ preview', 'faq', 'Common questions', 'Answers before you have to ask.', '', '', '[]'::jsonb, '', '', 'See All FAQs', '/faq', '{"theme":"white","limit":4}'::jsonb, 9, true),
  ('/', 'Home', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Have a project in mind? Start with a conversation.', '', 'Tell us what you are planning, where the property is located and what you need from your construction partner. We will use that information to understand whether Siraj Builders is the right fit for your project and what the next step should be.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark","cta2_label":"Contact Siraj Builders","cta2_href":"/contact-us"}'::jsonb, 10, true),
  ('/who-we-are', 'About', 'hero', 'Hero', 'hero', 'About Siraj Builders', 'Built around a better way to manage construction.', '', 'Siraj Builders is a construction company focused on delivering professionally managed building projects with attention to planning, execution and client communication.', '[]'::jsonb, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/who-we-are', 'About', 'who', 'Who we are', 'intro', 'Who we are', 'Our role is to bring greater structure to that process.', '', 'We understand that construction is rarely straightforward from a client''s perspective. There are budgets to consider, decisions to make, timelines to manage and countless details that can affect the final outcome.

We focus on organised execution, practical decision-making and careful attention to the details that shape the finished result.', '[]'::jsonb, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=80', '', '', '', '{"theme":"white"}'::jsonb, 1, true),
  ('/who-we-are', 'About', 'story', 'Our Story', 'content', 'Our story', 'Good construction starts with a clear conversation.', '', 'Most people don’t build every day. They’re trusting someone with a place that matters to them, while making a lot of decisions along the way.

We start by understanding how the property needs to work and what matters most to the client. Then we work through scope, planning and the choices that shape the build, keeping communication open as the work moves forward.

A good result is more than a finished building. Clients should know what has been done, why it matters and what comes next.', '[]'::jsonb, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80', '', '', '', '{"theme":"light"}'::jsonb, 2, true),
  ('/who-we-are', 'About', 'mission', 'Mission & vision', 'features', 'Purpose', 'Why we do this work.', '', '', '[{"title":"Mission","body":"To deliver well-planned construction projects through responsible execution, clear communication and attention to the details that matter to our clients.","image":""},{"title":"Vision","body":"To become a construction partner known for professional project management, dependable execution and lasting client relationships.","image":""}]'::jsonb, '', '', '', '', '{"theme":"light","layout":"duo"}'::jsonb, 3, true),
  ('/who-we-are', 'About', 'approach', 'Our approach', 'content', 'Our approach', 'A successful project depends on more than workmanship alone.', 'Pexels stock footage · Site coordination', 'It requires:', '[{"title":"Understanding before execution.","body":"","image":""},{"title":"Planning before construction.","body":"","image":""},{"title":"Communication throughout.","body":"","image":""},{"title":"Attention to detail until completion.","body":"","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"white","layout":"checklist"}'::jsonb, 4, true),
  ('/who-we-are', 'About', 'quality', 'Quality commitment', 'content', 'Quality commitment', 'Quality should be visible in the way a project is planned, managed and finished.', '', 'Our commitment is to approach each project with care, use appropriate materials and specifications, and maintain attention to workmanship throughout the construction process.', '[]'::jsonb, '', '', '', '', '{"theme":"light","layout":"centered"}'::jsonb, 5, true),
  ('/who-we-are', 'About', 'pillars', 'Brand pillars', 'features', 'What we hold to', 'Seven principles behind every project.', '', '', '[{"title":"Clarity","body":"The client understands the project before committing.","image":""},{"title":"Structured execution","body":"Construction follows a defined process rather than an improvised sequence.","image":""},{"title":"Responsible management","body":"The project is actively coordinated rather than simply handed over to workers.","image":""},{"title":"Craftsmanship","body":"Attention is given to the details that determine the final result.","image":""},{"title":"Communication","body":"Clients remain informed throughout the project.","image":""},{"title":"Practical design","body":"The finished space should look good while serving its intended purpose.","image":""},{"title":"Long-term value","body":"The objective is not simply to finish construction, but to create something that remains useful and valuable.","image":""}]'::jsonb, '', '', '', '', '{"theme":"white","layout":"numbered"}'::jsonb, 6, true),
  ('/who-we-are', 'About', 'team', 'Leadership', 'team', 'Leadership', 'The people responsible for your project.', '', 'Shown once verified team profiles are added on the Team screen.', '[]'::jsonb, '', '', '', '', '{"theme":"light"}'::jsonb, 7, true),
  ('/who-we-are', 'About', 'cta', 'Call to action', 'cta', 'Start with clarity', 'See how we would approach your project.', '', 'Share the basics — property, project type and what you need — and we will explain the next step.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark","cta2_label":"See How We Work","cta2_href":"/our-process"}'::jsonb, 8, true),
  ('/services', 'Services', 'hero', 'Hero', 'hero', 'Services', 'Construction solutions for projects that deserve a structured approach.', '', 'Different properties require different approaches. Our services are structured around those differences.', '[]'::jsonb, 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/services', 'Services', 'intro', 'Introduction', 'content', 'How we think about services', 'Different properties require different approaches.', '', 'A new home, commercial building and renovation project may share the same basic construction principles, but their priorities, constraints and execution requirements are different.

Our services are structured around those differences.', '[]'::jsonb, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=80', '', '', '', '{"theme":"white","layout":"centered"}'::jsonb, 1, true),
  ('/services', 'Services', 'list', 'Services list', 'services', 'Our services', 'Choose the service closest to your project.', '', '', '[]'::jsonb, '', '', '', '', '{"theme":"light","layout":"full"}'::jsonb, 2, true),
  ('/services', 'Services', 'proof', 'Link to projects & process', 'content', 'Before you decide', 'See examples of our work and what working with us involves.', 'Pexels stock footage · Construction activity', 'Every service follows the same principle: understand the requirement, agree the scope, then manage the work with clear communication.', '[]'::jsonb, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/5594430/5594430-uhd_3840_2160_25fps.mp4', 'View Our Projects', '/projects', '{"theme":"white","layout":"centered","cta2_label":"See How We Work","cta2_href":"/our-process"}'::jsonb, 3, true),
  ('/services', 'Services', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Not sure which service fits?', '', 'Tell us about the property and what you want to achieve. We will help establish the right starting point.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 4, true),
  ('/residential-construction', 'Residential Construction', 'hero', 'Hero', 'hero', 'Residential construction', 'A home should be built around how you intend to live.', '', 'From the initial requirements to the finished property, residential construction involves hundreds of decisions. Our approach focuses on bringing those decisions into a structured process so the project remains aligned with the client''s requirements.', '[]'::jsonb, 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/residential-construction', 'Residential Construction', 'deliver', 'What we deliver', 'content', 'What we deliver', 'Structured support from planning to handover.', 'The exact scope is agreed for each project before work begins.', 'Depending on the agreed scope, residential construction may involve:', '[{"title":"Project planning","body":"","image":""},{"title":"Construction coordination","body":"","image":""},{"title":"Structural work","body":"","image":""},{"title":"Finishing","body":"","image":""},{"title":"Site supervision","body":"","image":""},{"title":"Quality review","body":"","image":""},{"title":"Client communication","body":"","image":""},{"title":"Final handover","body":"","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"white","layout":"checklist"}'::jsonb, 1, true),
  ('/residential-construction', 'Residential Construction', 'needs', 'What homeowners need', 'features', 'What homeowners usually need', 'The concerns we plan around.', '', '', '[{"title":"Budget clarity","body":"Understanding the scope before committing.","image":""},{"title":"Communication","body":"Knowing what is happening during construction.","image":""},{"title":"Workmanship","body":"Confidence that important details are being handled properly.","image":""},{"title":"Coordination","body":"Reducing the burden of managing multiple construction activities independently.","image":""},{"title":"A clear finish line","body":"Knowing what completion and handover involve.","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1800&q=80', '', '', '', '{"theme":"light","layout":"grid"}'::jsonb, 2, true),
  ('/residential-construction', 'Residential Construction', 'projects', 'Related projects', 'projects', 'Residential work', 'See examples of our work.', '', '', '[]'::jsonb, '', '', 'View All Projects', '/projects', '{"theme":"white","category":"Residential","limit":3,"hide_empty":true}'::jsonb, 3, true),
  ('/residential-construction', 'Residential Construction', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Discuss your home project.', '', 'Share the property location, plot size and what you want to build. We will explain the appropriate next step.', '[]'::jsonb, '', '', 'Discuss Your Home Project', '/consultation', '{"theme":"dark","cta2_label":"See How We Work","cta2_href":"/our-process"}'::jsonb, 4, true),
  ('/commercial-construction', 'Commercial Construction', 'hero', 'Hero', 'hero', 'Commercial construction', 'Commercial spaces built for how businesses operate.', '', 'A commercial property needs to do more than look complete. It needs to function.', '[]'::jsonb, 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/commercial-construction', 'Commercial Construction', 'approach', 'Our approach', 'intro', 'Our approach', 'Planned around the business that will use it.', 'Pexels stock footage · Construction site activity', 'That means planning for movement, usability, durability, maintenance and the practical requirements of the business occupying the space.

We begin by understanding the intended use of the property and then coordinate the construction process around the agreed project requirements.', '[]'::jsonb, 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/5594430/5594430-uhd_3840_2160_25fps.mp4', '', '', '{"theme":"white"}'::jsonb, 1, true),
  ('/commercial-construction', 'Commercial Construction', 'focus', 'Focus areas', 'features', 'Focus areas', 'What a commercial project turns on.', 'Specific capabilities are confirmed for each project.', '', '[{"title":"Functional planning","body":"Layouts that support how the business actually operates.","image":""},{"title":"Construction coordination","body":"Trades, stages and decisions brought into one sequence.","image":""},{"title":"Site supervision","body":"Work overseen on site against the agreed scope.","image":""},{"title":"Material management","body":"Materials planned and coordinated around the programme.","image":""},{"title":"Quality review","body":"Completed work checked before it is signed off.","image":""},{"title":"Schedule coordination","body":"Timing managed with the business''s operations in mind.","image":""},{"title":"Final completion","body":"A defined close-out and handover.","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=1800&q=80', '', '', '', '{"theme":"light","layout":"grid"}'::jsonb, 2, true),
  ('/commercial-construction', 'Commercial Construction', 'projects', 'Related projects', 'projects', 'Commercial work', 'See examples of our work.', '', '', '[]'::jsonb, '', '', 'View All Projects', '/projects', '{"theme":"white","category":"Commercial","limit":3,"hide_empty":true}'::jsonb, 3, true),
  ('/commercial-construction', 'Commercial Construction', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Discuss a commercial project.', '', 'Tell us how the space will be used, where it is and when you need it. We will help define the next step.', '[]'::jsonb, '', '', 'Discuss a Commercial Project', '/consultation', '{"theme":"dark","cta2_label":"See How We Work","cta2_href":"/our-process"}'::jsonb, 4, true),
  ('/renovation-remodelling', 'Renovation & Remodelling', 'hero', 'Hero', 'hero', 'Renovation & remodelling', 'Improve the space you already have.', '', 'Renovation is different from building from scratch. Existing structures, services, finishes and layouts all have to be considered before changes are made.', '[]'::jsonb, 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/renovation-remodelling', 'Renovation & Remodelling', 'intro', 'How we approach renovation', 'intro', 'How we approach it', 'Understand the existing property first.', '', 'Siraj Builders approaches renovation projects by first understanding the existing property and then identifying the changes required to improve its functionality, appearance or use.', '[]'::jsonb, 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=80', '', '', '', '{"theme":"white"}'::jsonb, 1, true),
  ('/renovation-remodelling', 'Renovation & Remodelling', 'structure', 'How the project is structured', 'content', 'Project structure', 'We can structure the project around:', '', '', '[{"title":"Existing property assessment","body":"","image":""},{"title":"Planning","body":"","image":""},{"title":"Construction work","body":"","image":""},{"title":"Finishing","body":"","image":""},{"title":"Material coordination","body":"","image":""},{"title":"Site management","body":"","image":""},{"title":"Final review","body":"","image":""}]'::jsonb, '', '', '', '', '{"theme":"light","layout":"checklist"}'::jsonb, 2, true),
  ('/renovation-remodelling', 'Renovation & Remodelling', 'objective', 'The objective', 'content', 'The objective', 'Not simply to make a space look different.', 'Pexels stock footage · Coordinated construction work', 'To make it work better for the people using it.', '[]'::jsonb, 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"white","layout":"centered"}'::jsonb, 3, true),
  ('/renovation-remodelling', 'Renovation & Remodelling', 'projects', 'Related projects', 'projects', 'Renovation work', 'See examples of our work.', '', '', '[]'::jsonb, '', '', 'View All Projects', '/projects', '{"theme":"light","category":"Renovation","limit":3,"hide_empty":true}'::jsonb, 4, true),
  ('/renovation-remodelling', 'Renovation & Remodelling', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Discuss your renovation.', '', 'Tell us about the property as it is today and what you want to change.', '[]'::jsonb, '', '', 'Discuss Your Renovation', '/consultation', '{"theme":"dark"}'::jsonb, 5, true),
  ('/design-architecture', 'Design & Architecture', 'hero', 'Hero', 'hero', 'Design & architecture', 'Design decisions made with construction in mind.', '', 'Where Siraj Builders provides architectural or design services, the objective is to create a stronger connection between what is designed and what is ultimately built.', '[]'::jsonb, 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/design-architecture', 'Design & Architecture', 'scope', 'Scope', 'content', 'Scope', 'What design support can cover.', 'Pexels stock footage · Planning and coordination', 'The exact services, and whether each is provided directly or through external professionals, are confirmed for each project.', '[{"title":"Construction coordination","body":"","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"white","layout":"checklist","note":"TO CONFIRM — add architectural planning, concept development, space planning, technical drawings, 3D visualisation and interior coordination only if offered, and state which are provided directly vs through partners."}'::jsonb, 1, true),
  ('/design-architecture', 'Design & Architecture', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Discuss design for your project.', '', 'Share your brief and any drawings you already have.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 2, true),
  ('/grey-structure', 'Grey Structure', 'hero', 'Hero', 'hero', 'Grey structure', 'A strong structural foundation for the work that follows.', '', 'The early stages set the quality, alignment and sequencing of the entire build. They deserve careful coordination.', '[]'::jsonb, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/grey-structure', 'Grey Structure', 'detail', 'What it involves', 'content', 'The approach', 'Structure first. Clarity at every stage.', 'Pexels stock footage · Structural work on site', 'From site preparation through structural work, we keep drawings, materials, workmanship and progress aligned with the agreed project requirements.', '[{"title":"Site preparation","body":"","image":""},{"title":"Foundation and structure","body":"","image":""},{"title":"Material coordination","body":"","image":""},{"title":"Stage-by-stage review","body":"","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/5594430/5594430-uhd_3840_2160_25fps.mp4', '', '', '{"theme":"white","layout":"checklist","note":"TO CONFIRM — publish only once grey-structure work is a confirmed service."}'::jsonb, 1, true),
  ('/grey-structure', 'Grey Structure', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Discuss your grey structure project.', '', 'Share the plot details and drawings you already have.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 2, true),
  ('/turnkey-construction', 'Turnkey Construction', 'hero', 'Hero', 'hero', 'Turnkey construction', 'One coordinated route from initial brief to completed property.', '', 'A turnkey project needs more than a long list of services. It needs one clear direction across design, construction, finishes and handover.', '[]'::jsonb, 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/turnkey-construction', 'Turnkey Construction', 'detail', 'What it involves', 'content', 'The approach', 'A complete property, managed as one project.', 'Pexels stock footage · Construction coordination', 'We coordinate the major decisions and handoffs so the client has a clear view of scope, progress, quality and completion.', '[{"title":"Single project direction","body":"","image":""},{"title":"Design and build coordination","body":"","image":""},{"title":"Finishes and installation","body":"","image":""},{"title":"Final handover","body":"","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"white","layout":"checklist","note":"TO CONFIRM — publish only once turnkey delivery is a confirmed service."}'::jsonb, 1, true),
  ('/turnkey-construction', 'Turnkey Construction', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Discuss a turnkey project.', '', 'Tell us what you want completed and where.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 2, true),
  ('/project-management', 'Project Management', 'hero', 'Hero', 'hero', 'Project management', 'Keep decisions, people and progress moving together.', '', 'Construction is a sequence of connected decisions. Project management makes ownership, timing and next steps visible.', '[]'::jsonb, 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/project-management', 'Project Management', 'detail', 'What it involves', 'content', 'The approach', 'The work is easier to manage when it is visible.', 'Pexels stock footage · Managing site progress', 'We structure communication, sequencing and reviews around the agreed scope so issues can be addressed before they become expensive delays.', '[{"title":"Programme coordination","body":"","image":""},{"title":"Trade and site alignment","body":"","image":""},{"title":"Progress communication","body":"","image":""},{"title":"Quality and close-out","body":"","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"white","layout":"checklist","note":"TO CONFIRM — publish only once project management is a confirmed standalone service."}'::jsonb, 1, true),
  ('/project-management', 'Project Management', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Discuss project management.', '', 'Tell us about the project and where you need support.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 2, true),
  ('/projects', 'Projects', 'hero', 'Hero', 'hero', 'Projects', 'Projects that show how we work.', '', 'A portfolio should do more than display attractive photographs. It should show the thinking, scope and execution behind the finished project.', '[]'::jsonb, 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/projects', 'Projects', 'grid', 'Portfolio', 'projects', 'Portfolio', 'Completed and ongoing work.', 'Pexels stock footage · Active construction work', 'Each case study follows the same structure: the client requirement, the challenge, our approach, the execution and the result.', '[]'::jsonb, '', 'https://videos.pexels.com/video-files/5594430/5594430-uhd_3840_2160_25fps.mp4', '', '', '{"theme":"light","layout":"portfolio"}'::jsonb, 1, true),
  ('/projects', 'Projects', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Have a similar project in mind?', '', 'Tell us what you are planning. We will explain how we would approach it.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark","cta2_label":"Explore Our Services","cta2_href":"/services"}'::jsonb, 2, true),
  ('/our-process', 'Our Process', 'hero', 'Hero', 'hero', 'Our process', 'A construction process you can understand.', '', 'The purpose of our process is simple: reduce uncertainty.', '[]'::jsonb, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/our-process', 'Our Process', 'steps', 'Process steps', 'process', 'Eight stages', 'From the first conversation to handover.', 'Pexels stock footage · Site coordination', '', '[{"title":"Consultation","body":"We start by understanding what you want to build, why you are building it and what matters most to you.","image":""},{"title":"Site Assessment","body":"We review the property and identify practical considerations relevant to the project.","image":""},{"title":"Planning & Design","body":"The project requirements are translated into an organised scope and the necessary design and planning work.","image":""},{"title":"Estimation & Scope","body":"The project is reviewed in commercial and practical terms so the client understands what is included.","image":""},{"title":"Project Preparation","body":"Before execution begins, the required coordination, materials, people and site activities are organised.","image":""},{"title":"Construction & Supervision","body":"The agreed work moves into execution with appropriate site coordination and supervision.","image":""},{"title":"Quality Review","body":"Completed work is reviewed and outstanding issues are identified for resolution.","image":""},{"title":"Handover","body":"The completed project is reviewed with the client and the handover process is completed.","image":""}]'::jsonb, '', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"white","layout":"timeline"}'::jsonb, 1, true),
  ('/our-process', 'Our Process', 'details', 'Workflow details (to confirm)', 'content', 'Working details', 'Approvals, payment milestones and reporting.', '', '', '[]'::jsonb, '', '', '', '', '{"theme":"light","layout":"centered","note":"TO CONFIRM — exact workflow, approvals, payment milestones and reporting process. Switch on once confirmed."}'::jsonb, 2, false),
  ('/our-process', 'Our Process', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Start at step one.', '', 'The consultation is where we understand your requirements, property and objectives.', '[]'::jsonb, '', '', 'Request a Consultation', '/consultation', '{"theme":"dark","cta2_label":"Read the FAQs","cta2_href":"/faq"}'::jsonb, 3, true),
  ('/testimonials', 'Testimonials', 'hero', 'Hero', 'hero', 'Testimonials', 'What our clients say about working with us.', '', 'Only verified feedback from real clients appears on this page.', '[]'::jsonb, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/testimonials', 'Testimonials', 'list', 'Testimonials', 'testimonials', 'Client feedback', 'In their words.', '', '', '[]'::jsonb, '', '', '', '', '{"theme":"light","layout":"full"}'::jsonb, 1, true),
  ('/testimonials', 'Testimonials', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Talk to us about your project.', '', 'Tell us what you are planning and we will explain the next step.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 2, true),
  ('/faq', 'FAQ', 'hero', 'Hero', 'hero', 'FAQs', 'Questions clients ask before starting.', '', 'Straight answers about how a project begins, how estimates and timelines work, and what happens after you contact us.', '[]'::jsonb, 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/faq', 'FAQ', 'list', 'All questions', 'faq', 'Frequently asked', 'Browse by topic.', 'Pexels stock footage · Planning a construction project', '', '[]'::jsonb, '', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"white","layout":"full"}'::jsonb, 1, true),
  ('/faq', 'FAQ', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Still planning your project?', '', 'Discuss it with our team — the questions you have now are the right place to start.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark","cta2_label":"Contact Us","cta2_href":"/contact-us"}'::jsonb, 2, true),
  ('/contact-us', 'Contact', 'hero', 'Hero', 'hero', 'Contact', 'Let''s talk about your project.', '', 'Whether you are still exploring your options or already have drawings and a defined scope, the best place to begin is a conversation.', '[]'::jsonb, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/contact-us', 'Contact', 'details', 'Contact details', 'contact', 'Get in touch', 'Tell us what you’re planning.', '', 'Use the project enquiry form to share a little about the property, what you have in mind and where you need help. We’ll use that information to guide the next step.', '[]'::jsonb, '', '', '', '', '{"theme":"light","layout":"cards"}'::jsonb, 1, true),
  ('/contact-us', 'Contact', 'form', 'Contact form', 'contact', 'Contact form', 'Tell us about your project.', '', 'The more we understand about your project, the better we can guide the initial conversation.', '[{"title":"Property location","body":"","image":""},{"title":"Project type and intended use","body":"","image":""},{"title":"Plot or property size","body":"","image":""},{"title":"Drawings or documents","body":"","image":""},{"title":"Desired scope and timing","body":"","image":""}]'::jsonb, '', '', '', '', '{"theme":"white","layout":"form"}'::jsonb, 2, true),
  ('/consultation', 'Consultation', 'hero', 'Hero', 'hero', 'Consultation', 'Start with clarity. Then build.', 'No obligation. Plain conversation. Clear next step.', 'A consultation gives us an opportunity to understand your requirements before discussing the appropriate path forward.', '[]'::jsonb, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=80', '', '', '', '{"note":"The consultation form below this hero is built into the page."}'::jsonb, 0, true),
  ('/consultation', 'Consultation', 'next', 'What happens next', 'process', 'What happens next', 'A simple path from first message to first conversation.', 'Pexels stock footage · Preparing for a project conversation', 'After receiving your information, the team reviews the requirements and determines the appropriate next step.', '[{"title":"You share the basics","body":"Fill in the form with your project type, property details and what you are planning.","image":""},{"title":"We review the details","body":"Our team reads through your information and considers what the project requires.","image":""},{"title":"We reach out","body":"We contact you to clarify anything unclear and arrange an initial conversation.","image":""},{"title":"We agree on next steps","body":"Together we decide what the appropriate next step looks like — or that it isn''t the right fit.","image":""}]'::jsonb, '', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"light"}'::jsonb, 1, true),
  ('/consultation', 'Consultation', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Not ready to fill in a form?', '', 'Look through our work or read how we manage a project first.', '[]'::jsonb, '', '', 'View Our Projects', '/projects', '{"theme":"dark","cta2_label":"See How We Work","cta2_href":"/our-process"}'::jsonb, 2, true),
  ('/leadership', 'Leadership', 'hero', 'Hero', 'hero', 'Leadership', 'Well-managed projects start with clear responsibility.', '', 'Leadership in construction means knowing who decides what, coordinating across teams and being accountable for delivery.', '[]'::jsonb, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/leadership', 'Leadership', 'team', 'Team profiles', 'team', 'Our team', 'The people behind the work.', '', '', '[]'::jsonb, '', '', '', '', '{"theme":"light"}'::jsonb, 1, true),
  ('/leadership', 'Leadership', 'detail', 'How responsibility works', 'features', 'How we lead', 'Clear roles create better momentum.', 'Pexels stock footage · Team coordination', 'Decisions have owners, sites have leads and clients have a clear path for questions and updates.', '[{"title":"Accountability","body":"","image":""},{"title":"Communication","body":"","image":""},{"title":"Coordination","body":"","image":""},{"title":"Responsible decisions","body":"","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1556761175-b413da4baf72?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"white","layout":"numbered"}'::jsonb, 2, true),
  ('/leadership', 'Leadership', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Meet the team behind your project.', '', 'Start with a conversation about what you are planning.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 3, true),
  ('/project-showcase', 'Project Visibility', 'hero', 'Hero', 'hero', 'Project visibility', 'Know what is happening, and what comes next.', '', 'Construction becomes easier to live with when progress, decisions and responsibilities stay visible to the people paying for the work.', '[]'::jsonb, 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/project-showcase', 'Project Visibility', 'detail', 'How visibility works', 'features', 'The approach', 'The work is easier to manage when it is visible.', 'Pexels stock footage · Work in progress', 'We structure communication around the agreed scope: what has been completed, what is under way, and where a client decision is needed next. Reporting format and frequency are agreed per project.', '[{"title":"Structured progress updates","body":"What has been completed and what is under way.","image":""},{"title":"Documented decisions","body":"Choices recorded so they can be traced later.","image":""},{"title":"Defined responsibilities","body":"Everyone knows what they own.","image":""},{"title":"Clear next steps","body":"Where a client decision is needed, and when.","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/5594430/5594430-uhd_3840_2160_25fps.mp4', '', '', '{"theme":"white","layout":"grid"}'::jsonb, 1, true),
  ('/project-showcase', 'Project Visibility', 'cta', 'Call to action', 'cta', 'Start with clarity', 'See how this would work on your project.', '', 'We agree the reporting format with every client.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 2, true),
  ('/role-definition', 'Project Roles', 'hero', 'Hero', 'hero', 'Project roles', 'Every project role, clearly defined.', '', 'Projects move better when everyone knows what they own, what they do not own and where the handoffs happen.', '[]'::jsonb, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/role-definition', 'Project Roles', 'detail', 'Roles', 'features', 'Clarity reduces overlap', 'Who does what.', 'Pexels stock footage · Team coordination', 'We define responsibilities around the project so decisions do not sit unanswered and important work does not fall between roles.', '[{"title":"Client direction","body":"","image":""},{"title":"Project management","body":"","image":""},{"title":"Site supervision","body":"","image":""},{"title":"Specialist coordination","body":"","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"white","layout":"numbered"}'::jsonb, 1, true),
  ('/role-definition', 'Project Roles', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Discuss how your project would be organised.', '', 'Start with the basics of what you are planning.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 2, true),
  ('/subcontractors', 'Subcontractors', 'hero', 'Hero', 'hero', 'Subcontractors', 'Specialists coordinated around the agreed project.', '', 'External specialists add value when their scope, timing and communication remain clear.', '[]'::jsonb, 'https://images.unsplash.com/photo-1541971875076-8f970d573be6?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/subcontractors', 'Subcontractors', 'detail', 'Coordination', 'content', 'The approach', 'The right specialist in the right sequence.', 'Pexels stock footage · Specialist work on site', 'We coordinate specialist work against the drawings, programme and quality expectations of the wider project.', '[{"title":"Defined scope","body":"","image":""},{"title":"Sequenced work","body":"","image":""},{"title":"Site coordination","body":"","image":""},{"title":"Quality review","body":"","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/5594430/5594430-uhd_3840_2160_25fps.mp4', '', '', '{"theme":"white","layout":"checklist"}'::jsonb, 1, true),
  ('/subcontractors', 'Subcontractors', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Discuss your project.', '', 'Tell us what you are planning.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 2, true),
  ('/international', 'Overseas Clients', 'hero', 'Hero', 'hero', 'Overseas clients', 'Clear project coordination across distance.', '', 'When clients, consultants or properties are in different locations, communication and documentation matter even more.', '[]'::jsonb, 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/international', 'Overseas Clients', 'detail', 'Remote coordination', 'features', 'Make the project visible from anywhere', 'What remote clients need.', 'Pexels stock footage · Coordinating work across a project', 'Structured updates, documented decisions and coordinated information help keep remote stakeholders connected to the work.', '[{"title":"Remote communication","body":"","image":""},{"title":"Documented decisions","body":"","image":""},{"title":"Local coordination","body":"","image":""},{"title":"Visible progress","body":"","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"white","layout":"numbered","note":"TO CONFIRM — whether Siraj Builders actively targets overseas clients."}'::jsonb, 1, true),
  ('/international', 'Overseas Clients', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Building from abroad?', '', 'Share the property details and how you prefer to receive updates.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 2, true),
  ('/affiliates', 'Partners & Affiliates', 'hero', 'Hero', 'hero', 'Partners & affiliates', 'A connected network, one point of contact.', '', 'Where external specialists or partners are part of a project, roles and responsibilities should remain clear. One coordinated team, one shared scope.', '[]'::jsonb, 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/affiliates', 'Partners & Affiliates', 'intro', 'Introduction', 'intro', 'Coordination', 'Specialists without the split responsibility.', '', 'Most construction projects involve more than one discipline — structural work, mechanical and electrical services, design, finishing. Each area benefits from the right specialist.

The challenge is coordinating them so the client isn''t left managing multiple conversations and unclear responsibilities. That is where Siraj Builders steps in as the single point of contact.', '[]'::jsonb, 'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=1800&q=80', '', '', '', '{"theme":"white"}'::jsonb, 1, true),
  ('/affiliates', 'Partners & Affiliates', 'layers', 'How coordination works', 'process', 'How coordination works', 'Three layers that keep a multi-specialist project organised.', '', '', '[{"title":"Scoping the project","body":"Understanding which specialists are needed, when they''ll be needed, and what each one is responsible for.","image":""},{"title":"Coordinating the sequence","body":"Bringing specialists in at the right stage, in the right order, with the right information.","image":""},{"title":"Keeping the client informed","body":"One team, one set of updates, one clear picture of progress and next steps.","image":""}]'::jsonb, '', '', '', '', '{"theme":"light"}'::jsonb, 2, true),
  ('/affiliates', 'Partners & Affiliates', 'partners', 'Disciplines', 'features', 'What specialists typically cover', 'The disciplines a project may involve.', 'Pexels stock footage · Specialist work on site', 'Depending on the project, one or more of these areas may be part of the team. The exact mix is agreed per project.', '[{"title":"Structural engineering","body":"Load paths, foundations, framing and structural drawings for the building.","image":""},{"title":"MEP services","body":"Mechanical, electrical and plumbing systems coordinated with the structure.","image":""},{"title":"Architectural design","body":"Planning, layouts, drawings and design coordination before construction.","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/5594430/5594430-uhd_3840_2160_25fps.mp4', '', '', '{"theme":"white","layout":"grid"}'::jsonb, 3, true),
  ('/affiliates', 'Partners & Affiliates', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Discuss your project.', '', 'One conversation to start, one point of contact throughout.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 4, true),
  ('/locations', 'Service Areas', 'hero', 'Hero', 'hero', 'Service areas', 'A project approach that starts with the property itself.', '', 'Site conditions, access, local requirements and the surrounding context all shape how construction should be planned.', '[]'::jsonb, 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/locations', 'Service Areas', 'areas', 'Areas served (to confirm)', 'content', 'Where we work', 'Areas we serve.', '', '', '[]'::jsonb, '', '', '', '', '{"theme":"light","layout":"centered","note":"TO CONFIRM — primary city, service areas and specific housing societies. Critical for SEO. Switch on once confirmed."}'::jsonb, 1, false),
  ('/locations', 'Service Areas', 'detail', 'Every location is different', 'features', 'Every location has its own realities', 'What we look at first.', 'Pexels stock footage · Site activity', 'We begin by understanding the property and its context before fixing the scope, sequence or delivery assumptions.', '[{"title":"Property assessment","body":"","image":""},{"title":"Access and logistics","body":"","image":""},{"title":"Local coordination","body":"","image":""},{"title":"Project-specific planning","body":"","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1524661135-423995f22d0b?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/5594430/5594430-uhd_3840_2160_25fps.mp4', '', '', '{"theme":"white","layout":"numbered"}'::jsonb, 2, true),
  ('/locations', 'Service Areas', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Tell us where your property is.', '', 'Location is one of the first things we need to understand.', '[]'::jsonb, '', '', 'Discuss Your Project', '/consultation', '{"theme":"dark"}'::jsonb, 3, true),
  ('/cost-index', 'Cost Guidance', 'hero', 'Hero', 'hero', 'Cost guidance', 'Construction cost becomes clearer when the scope is clear.', '', 'There is no useful universal price without understanding size, specifications, site conditions, materials and intended outcome.', '[]'::jsonb, 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1800&q=80', '', '', '', '{}'::jsonb, 0, true),
  ('/cost-index', 'Cost Guidance', 'detail', 'What shapes cost', 'features', 'Start with decisions, not a guess', 'The variables that shape cost.', 'Pexels stock footage · Planning project scope', 'Use the initial conversation to clarify the project variables that shape cost, then develop a project-specific basis for discussion.', '[{"title":"Scope","body":"","image":""},{"title":"Size and site","body":"","image":""},{"title":"Materials","body":"","image":""},{"title":"Finishes and services","body":"","image":""}]'::jsonb, 'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=1800&q=80', 'https://videos.pexels.com/video-files/7825537/7825537-hd_1920_1080_30fps.mp4', '', '', '{"theme":"white","layout":"numbered"}'::jsonb, 1, true),
  ('/cost-index', 'Cost Guidance', 'cta', 'Call to action', 'cta', 'Start with clarity', 'Get a project-specific estimate.', '', 'An estimate is prepared from the scope, drawings and specifications — start by sharing yours.', '[]'::jsonb, '', '', 'Request a Consultation', '/consultation', '{"theme":"dark"}'::jsonb, 2, true),
  ('/privacy-policy', 'Privacy Policy', 'hero', 'Hero', 'hero', 'Privacy policy', 'Your project information should be handled with care.', '', 'We use information shared through this website to understand project requirements and respond to enquiries.', '[]'::jsonb, '', '', '', '', '{}'::jsonb, 0, true),
  ('/privacy-policy', 'Privacy Policy', 'body', 'Policy text', 'content', 'Summary', 'Clear information, clear purpose.', '', 'Only share the details needed to help us understand your enquiry. Contact details and project information submitted through the contact or consultation forms are used to respond to the conversation you requested and to determine the appropriate next step.

If you have a question about the information you have shared, contact us through the details on the Contact page.', '[]'::jsonb, '', '', '', '', '{"theme":"white","layout":"prose","note":"Have the final privacy policy reviewed before launch."}'::jsonb, 1, true),
  ('/terms', 'Terms & Conditions', 'hero', 'Hero', 'hero', 'Terms & conditions', 'A clear starting point for using this website.', '', 'These terms describe the basic expectations when browsing the Siraj Builders website and submitting an enquiry.', '[]'::jsonb, '', '', '', '', '{}'::jsonb, 0, true),
  ('/terms', 'Terms & Conditions', 'body', 'Terms text', 'content', 'Summary', 'Useful information, responsibly presented.', '', 'Website content is provided as general project information. Final scope, pricing, timing and responsibilities are always confirmed for the individual project.

Submitting an enquiry does not create an agreement. Any project proceeds only on terms agreed in writing.', '[]'::jsonb, '', '', '', '', '{"theme":"white","layout":"prose","note":"Have the final terms reviewed before launch."}'::jsonb, 1, true)
on conflict (page_path, section_key) do nothing;

-- 3. Kept (edited) sections: fill empty list items / images from the docs
update public.page_sections set items = '[{"title":"Clear scope","body":"Defined before work begins","image":""},{"title":"Responsible execution","body":"Supervised on site","image":""},{"title":"Consistent updates","body":"Progress shared as it happens","image":""},{"title":"Defined handover","body":"Clear transition at completion","image":""}]'::jsonb where page_path = '/' and section_key = 'trust' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Clear expectations","body":"Good construction starts with understanding what is being built, why it is being built and what the project requires.","image":""},{"title":"Organised execution","body":"A structured approach helps coordinate decisions, materials, people and work across different stages.","image":""},{"title":"Attention to detail","body":"The final result is shaped by hundreds of smaller decisions. We treat those details as part of the project, not an afterthought.","image":""},{"title":"Client communication","body":"Construction becomes easier to manage when clients know what has happened, what is happening and what comes next.","image":""},{"title":"Practical decision-making","body":"We focus on solutions that make sense for the property''s intended use, project requirements and available resources.","image":""},{"title":"Accountability","body":"A professional construction relationship should have clear responsibilities, clear communication and a clear path forward when decisions need to be made.","image":""}]'::jsonb where page_path = '/' and section_key = 'why-us' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Consultation","body":"Understand your requirements, property and project objectives.","image":""},{"title":"Site Assessment","body":"Review the site and identify the practical considerations that affect the project.","image":""},{"title":"Planning & Design","body":"Develop the project scope and coordinate the required planning and design work.","image":""},{"title":"Estimation","body":"Establish the scope, specifications and commercial requirements.","image":""},{"title":"Construction","body":"Move into organised execution with appropriate supervision and coordination.","image":""},{"title":"Quality Review","body":"Review completed work and address outstanding details.","image":""},{"title":"Handover","body":"Complete the project and transition the finished property to the client.","image":""}]'::jsonb where page_path = '/' and section_key = 'process' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Mission","body":"To deliver well-planned construction projects through responsible execution, clear communication and attention to the details that matter to our clients.","image":""},{"title":"Vision","body":"To become a construction partner known for professional project management, dependable execution and lasting client relationships.","image":""}]'::jsonb where page_path = '/who-we-are' and section_key = 'mission' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Understanding before execution.","body":"","image":""},{"title":"Planning before construction.","body":"","image":""},{"title":"Communication throughout.","body":"","image":""},{"title":"Attention to detail until completion.","body":"","image":""}]'::jsonb where page_path = '/who-we-are' and section_key = 'approach' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Clarity","body":"The client understands the project before committing.","image":""},{"title":"Structured execution","body":"Construction follows a defined process rather than an improvised sequence.","image":""},{"title":"Responsible management","body":"The project is actively coordinated rather than simply handed over to workers.","image":""},{"title":"Craftsmanship","body":"Attention is given to the details that determine the final result.","image":""},{"title":"Communication","body":"Clients remain informed throughout the project.","image":""},{"title":"Practical design","body":"The finished space should look good while serving its intended purpose.","image":""},{"title":"Long-term value","body":"The objective is not simply to finish construction, but to create something that remains useful and valuable.","image":""}]'::jsonb where page_path = '/who-we-are' and section_key = 'pillars' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Project planning","body":"","image":""},{"title":"Construction coordination","body":"","image":""},{"title":"Structural work","body":"","image":""},{"title":"Finishing","body":"","image":""},{"title":"Site supervision","body":"","image":""},{"title":"Quality review","body":"","image":""},{"title":"Client communication","body":"","image":""},{"title":"Final handover","body":"","image":""}]'::jsonb where page_path = '/residential-construction' and section_key = 'deliver' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Budget clarity","body":"Understanding the scope before committing.","image":""},{"title":"Communication","body":"Knowing what is happening during construction.","image":""},{"title":"Workmanship","body":"Confidence that important details are being handled properly.","image":""},{"title":"Coordination","body":"Reducing the burden of managing multiple construction activities independently.","image":""},{"title":"A clear finish line","body":"Knowing what completion and handover involve.","image":""}]'::jsonb where page_path = '/residential-construction' and section_key = 'needs' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Functional planning","body":"Layouts that support how the business actually operates.","image":""},{"title":"Construction coordination","body":"Trades, stages and decisions brought into one sequence.","image":""},{"title":"Site supervision","body":"Work overseen on site against the agreed scope.","image":""},{"title":"Material management","body":"Materials planned and coordinated around the programme.","image":""},{"title":"Quality review","body":"Completed work checked before it is signed off.","image":""},{"title":"Schedule coordination","body":"Timing managed with the business''s operations in mind.","image":""},{"title":"Final completion","body":"A defined close-out and handover.","image":""}]'::jsonb where page_path = '/commercial-construction' and section_key = 'focus' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Existing property assessment","body":"","image":""},{"title":"Planning","body":"","image":""},{"title":"Construction work","body":"","image":""},{"title":"Finishing","body":"","image":""},{"title":"Material coordination","body":"","image":""},{"title":"Site management","body":"","image":""},{"title":"Final review","body":"","image":""}]'::jsonb where page_path = '/renovation-remodelling' and section_key = 'structure' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Construction coordination","body":"","image":""}]'::jsonb where page_path = '/design-architecture' and section_key = 'scope' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Site preparation","body":"","image":""},{"title":"Foundation and structure","body":"","image":""},{"title":"Material coordination","body":"","image":""},{"title":"Stage-by-stage review","body":"","image":""}]'::jsonb where page_path = '/grey-structure' and section_key = 'detail' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Single project direction","body":"","image":""},{"title":"Design and build coordination","body":"","image":""},{"title":"Finishes and installation","body":"","image":""},{"title":"Final handover","body":"","image":""}]'::jsonb where page_path = '/turnkey-construction' and section_key = 'detail' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Programme coordination","body":"","image":""},{"title":"Trade and site alignment","body":"","image":""},{"title":"Progress communication","body":"","image":""},{"title":"Quality and close-out","body":"","image":""}]'::jsonb where page_path = '/project-management' and section_key = 'detail' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Consultation","body":"We start by understanding what you want to build, why you are building it and what matters most to you.","image":""},{"title":"Site Assessment","body":"We review the property and identify practical considerations relevant to the project.","image":""},{"title":"Planning & Design","body":"The project requirements are translated into an organised scope and the necessary design and planning work.","image":""},{"title":"Estimation & Scope","body":"The project is reviewed in commercial and practical terms so the client understands what is included.","image":""},{"title":"Project Preparation","body":"Before execution begins, the required coordination, materials, people and site activities are organised.","image":""},{"title":"Construction & Supervision","body":"The agreed work moves into execution with appropriate site coordination and supervision.","image":""},{"title":"Quality Review","body":"Completed work is reviewed and outstanding issues are identified for resolution.","image":""},{"title":"Handover","body":"The completed project is reviewed with the client and the handover process is completed.","image":""}]'::jsonb where page_path = '/our-process' and section_key = 'steps' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Property location","body":"","image":""},{"title":"Project type and intended use","body":"","image":""},{"title":"Plot or property size","body":"","image":""},{"title":"Drawings or documents","body":"","image":""},{"title":"Desired scope and timing","body":"","image":""}]'::jsonb where page_path = '/contact-us' and section_key = 'form' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"You share the basics","body":"Fill in the form with your project type, property details and what you are planning.","image":""},{"title":"We review the details","body":"Our team reads through your information and considers what the project requires.","image":""},{"title":"We reach out","body":"We contact you to clarify anything unclear and arrange an initial conversation.","image":""},{"title":"We agree on next steps","body":"Together we decide what the appropriate next step looks like — or that it isn''t the right fit.","image":""}]'::jsonb where page_path = '/consultation' and section_key = 'next' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Accountability","body":"","image":""},{"title":"Communication","body":"","image":""},{"title":"Coordination","body":"","image":""},{"title":"Responsible decisions","body":"","image":""}]'::jsonb where page_path = '/leadership' and section_key = 'detail' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Structured progress updates","body":"What has been completed and what is under way.","image":""},{"title":"Documented decisions","body":"Choices recorded so they can be traced later.","image":""},{"title":"Defined responsibilities","body":"Everyone knows what they own.","image":""},{"title":"Clear next steps","body":"Where a client decision is needed, and when.","image":""}]'::jsonb where page_path = '/project-showcase' and section_key = 'detail' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Client direction","body":"","image":""},{"title":"Project management","body":"","image":""},{"title":"Site supervision","body":"","image":""},{"title":"Specialist coordination","body":"","image":""}]'::jsonb where page_path = '/role-definition' and section_key = 'detail' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Defined scope","body":"","image":""},{"title":"Sequenced work","body":"","image":""},{"title":"Site coordination","body":"","image":""},{"title":"Quality review","body":"","image":""}]'::jsonb where page_path = '/subcontractors' and section_key = 'detail' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Remote communication","body":"","image":""},{"title":"Documented decisions","body":"","image":""},{"title":"Local coordination","body":"","image":""},{"title":"Visible progress","body":"","image":""}]'::jsonb where page_path = '/international' and section_key = 'detail' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Scoping the project","body":"Understanding which specialists are needed, when they''ll be needed, and what each one is responsible for.","image":""},{"title":"Coordinating the sequence","body":"Bringing specialists in at the right stage, in the right order, with the right information.","image":""},{"title":"Keeping the client informed","body":"One team, one set of updates, one clear picture of progress and next steps.","image":""}]'::jsonb where page_path = '/affiliates' and section_key = 'layers' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Structural engineering","body":"Load paths, foundations, framing and structural drawings for the building.","image":""},{"title":"MEP services","body":"Mechanical, electrical and plumbing systems coordinated with the structure.","image":""},{"title":"Architectural design","body":"Planning, layouts, drawings and design coordination before construction.","image":""}]'::jsonb where page_path = '/affiliates' and section_key = 'partners' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Property assessment","body":"","image":""},{"title":"Access and logistics","body":"","image":""},{"title":"Local coordination","body":"","image":""},{"title":"Project-specific planning","body":"","image":""}]'::jsonb where page_path = '/locations' and section_key = 'detail' and (items is null or items = '[]'::jsonb);
update public.page_sections set items = '[{"title":"Scope","body":"","image":""},{"title":"Size and site","body":"","image":""},{"title":"Materials","body":"","image":""},{"title":"Finishes and services","body":"","image":""}]'::jsonb where page_path = '/cost-index' and section_key = 'detail' and (items is null or items = '[]'::jsonb);

-- 4. Old 'Page copy' edits carried into the new hero sections ------------
update public.page_sections s
   set title = p.title,
       body = coalesce(nullif(p.intro, ''), s.body),
       media_url = coalesce(nullif(p.image_url, ''), s.media_url)
  from public.pages p
 where p.path = s.page_path
   and s.section_key = 'hero'
   and s.updated_at = s.created_at
   and p.updated_at > p.created_at + interval '2 seconds'
   and nullif(trim(p.title), '') is not null;

-- 5. Pages registry: publish state for unconfirmed services --------------
update public.pages set is_published = false where path in ('/design-architecture', '/grey-structure', '/turnkey-construction', '/project-management', '/international') and updated_at = created_at;

-- 6. Pages registry: one row per route, SEO filled where blank -----------
insert into public.pages (path, label, eyebrow, title, seo_title, seo_description, is_published, sort_order)
values
  ('/', 'Home', 'Home', 'Home', 'Siraj Builders | Professional Construction & Building Services', 'Explore Siraj Builders'' professional approach to construction, project management and building solutions. Discuss your project with our team.', true, 10),
  ('/who-we-are', 'About', 'About', 'About', 'About Siraj Builders | Our Approach to Construction', 'Learn about Siraj Builders, our construction philosophy, project approach and commitment to professional client service.', true, 20),
  ('/services', 'Services', 'Services', 'Services', 'Construction Services | Siraj Builders', 'Explore Siraj Builders'' construction solutions, from residential and commercial projects to renovation and project management.', true, 30),
  ('/residential-construction', 'Residential Construction', 'Residential Construction', 'Residential Construction', 'Residential Construction | Siraj Builders', 'Professional residential construction focused on planning, coordination, workmanship and a clear client experience.', true, 40),
  ('/commercial-construction', 'Commercial Construction', 'Commercial Construction', 'Commercial Construction', 'Commercial Construction | Siraj Builders', 'Commercial construction planned around how the finished property will actually be used, with coordinated delivery and supervision.', true, 50),
  ('/renovation-remodelling', 'Renovation & Remodelling', 'Renovation & Remodelling', 'Renovation & Remodelling', 'Renovation & Remodelling | Siraj Builders', 'Renovation and remodelling that starts by understanding the existing property, then improves how it functions and feels.', true, 60),
  ('/design-architecture', 'Design & Architecture', 'Design & Architecture', 'Design & Architecture', 'Design & Architecture | Siraj Builders', 'Design decisions made with construction in mind — planning and design coordination before construction begins.', false, 70),
  ('/grey-structure', 'Grey Structure', 'Grey Structure', 'Grey Structure', 'Grey Structure Construction | Siraj Builders', 'Grey structure work coordinated with care — the structural stage that sets up everything that follows.', false, 80),
  ('/turnkey-construction', 'Turnkey Construction', 'Turnkey Construction', 'Turnkey Construction', 'Turnkey Construction | Siraj Builders', 'One coordinated route from initial brief to completed property.', false, 90),
  ('/project-management', 'Project Management', 'Project Management', 'Project Management', 'Construction Project Management | Siraj Builders', 'Project management that keeps decisions, people and progress moving together.', false, 100),
  ('/projects', 'Projects', 'Projects', 'Projects', 'Projects & Portfolio | Siraj Builders', 'Explore completed and ongoing Siraj Builders projects across residential, commercial and renovation work.', true, 110),
  ('/our-process', 'Our Process', 'Our Process', 'Our Process', 'Our Construction Process | Siraj Builders', 'See how Siraj Builders approaches construction projects from consultation and planning through execution, quality review and handover.', true, 120),
  ('/testimonials', 'Testimonials', 'Testimonials', 'Testimonials', 'Client Testimonials | Siraj Builders', 'What clients say about working with Siraj Builders — verified feedback only.', true, 130),
  ('/faq', 'FAQ', 'FAQ', 'FAQ', 'FAQs | Siraj Builders', 'Answers to common questions about starting a construction project with Siraj Builders — estimates, timelines, process and contact.', true, 140),
  ('/contact-us', 'Contact', 'Contact', 'Contact', 'Contact Siraj Builders | Discuss Your Construction Project', 'Contact Siraj Builders to discuss residential, commercial or renovation construction requirements and arrange an initial project consultation.', true, 150),
  ('/consultation', 'Consultation', 'Consultation', 'Consultation', 'Request a Consultation | Siraj Builders', 'Start with clarity. Share your project requirements and request an initial consultation with Siraj Builders.', true, 160),
  ('/leadership', 'Leadership', 'Leadership', 'Leadership', 'Leadership | Siraj Builders', 'Clear roles and responsibility behind every Siraj Builders project.', true, 170),
  ('/project-showcase', 'Project Visibility', 'Project Visibility', 'Project Visibility', 'Project Visibility | Siraj Builders', 'How Siraj Builders keeps progress, decisions and responsibilities visible to clients throughout a project.', true, 180),
  ('/role-definition', 'Project Roles', 'Project Roles', 'Project Roles', 'Project Roles | Siraj Builders', 'How responsibilities are defined on a Siraj Builders project.', true, 190),
  ('/subcontractors', 'Subcontractors', 'Subcontractors', 'Subcontractors', 'Subcontractors & Specialists | Siraj Builders', 'How specialist work is coordinated around the agreed project.', true, 200),
  ('/international', 'Overseas Clients', 'Overseas Clients', 'Overseas Clients', 'Overseas Clients | Siraj Builders', 'Clear project coordination when clients are not on site.', false, 210),
  ('/affiliates', 'Partners & Affiliates', 'Partners & Affiliates', 'Partners & Affiliates', 'Partners & Specialists | Siraj Builders', 'How Siraj Builders coordinates specialists so the client has one point of contact.', true, 220),
  ('/locations', 'Service Areas', 'Service Areas', 'Service Areas', 'Service Areas | Siraj Builders', 'How Siraj Builders plans around the property and its location.', true, 230),
  ('/cost-index', 'Cost Guidance', 'Cost Guidance', 'Cost Guidance', 'Construction Cost Guidance | Siraj Builders', 'What shapes construction cost, and why a project-specific estimate starts with a clear scope.', true, 240),
  ('/privacy-policy', 'Privacy Policy', 'Privacy Policy', 'Privacy Policy', 'Privacy Policy | Siraj Builders', 'How Siraj Builders uses information shared through this website.', true, 250),
  ('/terms', 'Terms & Conditions', 'Terms & Conditions', 'Terms & Conditions', 'Terms & Conditions | Siraj Builders', 'Terms for using the Siraj Builders website.', true, 260)
on conflict (path) do update set
  label           = case when public.pages.label = '' then excluded.label else public.pages.label end,
  seo_title       = case when public.pages.seo_title = '' then excluded.seo_title else public.pages.seo_title end,
  seo_description = case when public.pages.seo_description = '' then excluded.seo_description else public.pages.seo_description end;

-- 7. FAQ categories --------------------------------------------------------
insert into public.faq_categories (key, label, sort_order)
values
  ('start', 'Getting started', 10),
  ('services', 'Services', 20),
  ('cost', 'Cost & payments', 30),
  ('process', 'Process & updates', 40),
  ('contact', 'Areas & contact', 50)
on conflict (key) do nothing;

-- 8. FAQs: retire unedited legacy questions, add the documented 20 -------
delete from public.faqs
 where updated_at = created_at
   and question in ('What services does Siraj Builders provide?',
                    'What types of construction projects do you handle?',
                    'Do you work on residential projects?',
                    'Do you handle commercial construction?',
                    'How do I start a construction project with Siraj Builders?',
                    'What information is needed before starting a project?',
                    'How is the project scope determined?',
                    'How is a construction estimate prepared?',
                    'What factors affect construction costs?',
                    'Can I request a project quotation?',
                    'How long does a construction project usually take?',
                    'What factors can affect the project timeline?',
                    'What is the typical construction process?',
                    'How do you manage project progress?',
                    'How is communication handled during a project?',
                    'How do you maintain construction quality?',
                    'How are materials selected?',
                    'How can I request a consultation?',
                    'How can I contact Siraj Builders?');

insert into public.faqs (category_id, question, answer, is_active, show_on_home, sort_order)
select c.id, v.question, v.answer, v.is_active, v.show_on_home, v.sort_order
from (values
  ('start', 'How do I start a project with Siraj Builders?', 'Start by sharing your project requirements, property location and the type of construction work you need. Our team can then determine the appropriate next step.', true, true, 10),
  ('process', 'Do you provide site visits?', '', false, false, 20),
  ('cost', 'How is a construction estimate prepared?', 'An estimate should be based on the project''s scope, drawings/specifications, property conditions, materials and other relevant requirements.', true, true, 30),
  ('services', 'Can you construct a complete house?', '', false, false, 40),
  ('services', 'Do you provide grey structure construction?', '', false, false, 50),
  ('services', 'Do you handle finishing work?', '', false, false, 60),
  ('services', 'Do you provide architectural design?', '', false, false, 70),
  ('services', 'Can you renovate an existing property?', '', false, false, 80),
  ('process', 'How long does construction take?', 'Project duration depends on the property''s size, scope, design, site conditions, materials and other factors. A project-specific timeline should be discussed after the scope is established.', true, true, 90),
  ('cost', 'Can I provide my own materials?', '', false, false, 100),
  ('cost', 'How are payments structured?', '', false, false, 110),
  ('process', 'How do clients receive project updates?', '', false, false, 120),
  ('process', 'Who supervises the project?', '', false, false, 130),
  ('services', 'Do you work on commercial projects?', '', false, false, 140),
  ('contact', 'Which areas do you serve?', '', false, false, 150),
  ('services', 'Can you work from existing architectural drawings?', '', false, false, 160),
  ('services', 'Can you help with material selection?', '', false, false, 170),
  ('start', 'What information should I provide for an initial discussion?', 'Ideally, provide the property location, plot/property size, project type, intended use, expected start period and any drawings or requirements already available.', true, true, 180),
  ('services', 'Do you offer project management?', '', false, false, 190),
  ('contact', 'How do I request a quotation?', 'Use the consultation/contact form or contact Siraj Builders directly through the available communication channels.', true, true, 200)
) as v(category, question, answer, is_active, show_on_home, sort_order)
join public.faq_categories c on c.key = v.category
where not exists (select 1 from public.faqs f where lower(trim(f.question)) = lower(trim(v.question)));

-- Empty legacy categories (no questions left) are switched off, not deleted.
update public.faq_categories c set is_active = false
 where c.key not in ('start', 'services', 'cost', 'process', 'contact')
   and c.updated_at = c.created_at
   and not exists (select 1 from public.faqs f where f.category_id = c.id);

-- 9. Services: documented card copy into blank fields --------------------
update public.services set
  title = case when title = '' then 'Residential Construction' else title end,
  summary = case when summary = '' then 'From planning through construction and finishing, we help homeowners move from an initial requirement to a completed property with a structured approach.' else summary end,
  cta_label = case when cta_label = '' then 'Explore Residential Construction' else cta_label end,
  image_url = case when image_url = '' then 'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=1800&q=80' else image_url end
where slug = 'residential-construction';
update public.services set
  title = case when title = '' then 'Commercial Construction' else title end,
  summary = case when summary = '' then 'Functional commercial spaces require coordination, planning and an understanding of how the finished property will actually be used.' else summary end,
  cta_label = case when cta_label = '' then 'Explore Commercial Construction' else cta_label end,
  image_url = case when image_url = '' then 'https://images.unsplash.com/photo-1497366811353-6870744d04b2?auto=format&fit=crop&w=1800&q=80' else image_url end
where slug = 'commercial-construction';
update public.services set
  title = case when title = '' then 'Renovation & Remodelling' else title end,
  summary = case when summary = '' then 'Improve an existing property without losing sight of its structure, functionality or intended use.' else summary end,
  cta_label = case when cta_label = '' then 'Explore Renovation' else cta_label end,
  image_url = case when image_url = '' then 'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1800&q=80' else image_url end
where slug = 'renovation-remodelling';
update public.services set
  title = case when title = '' then 'Design & Architecture' else title end,
  summary = case when summary = '' then 'Where design services are offered, this can cover planning, design coordination and documentation before construction begins.' else summary end,
  cta_label = case when cta_label = '' then 'Explore Design Services' else cta_label end,
  image_url = case when image_url = '' then 'https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1800&q=80' else image_url end
where slug = 'design-architecture';
update public.services set
  title = case when title = '' then 'Grey Structure' else title end,
  summary = case when summary = '' then 'The structural stage that sets the quality, alignment and sequencing of the entire build.' else summary end,
  cta_label = case when cta_label = '' then 'Explore Grey Structure' else cta_label end,
  image_url = case when image_url = '' then 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?auto=format&fit=crop&w=1800&q=80' else image_url end
where slug = 'grey-structure';
update public.services set
  title = case when title = '' then 'Turnkey Construction' else title end,
  summary = case when summary = '' then 'One coordinated route from initial brief to completed property.' else summary end,
  cta_label = case when cta_label = '' then 'Explore Turnkey Construction' else cta_label end,
  image_url = case when image_url = '' then 'https://images.unsplash.com/photo-1504917595217-d4dc5ebe6122?auto=format&fit=crop&w=1800&q=80' else image_url end
where slug = 'turnkey-construction';
update public.services set
  title = case when title = '' then 'Project Management' else title end,
  summary = case when summary = '' then 'Keep decisions, people and progress moving together across every construction stage.' else summary end,
  cta_label = case when cta_label = '' then 'Explore Project Management' else cta_label end,
  image_url = case when image_url = '' then 'https://images.unsplash.com/photo-1450101499163-c8848c66ca85?auto=format&fit=crop&w=1800&q=80' else image_url end
where slug = 'project-management';
-- Unconfirmed services stay off the site until Siraj Builders confirms them
-- (documentation: 'This page should remain unpublished until the service is confirmed').
update public.services set is_active = false, show_in_nav = false
 where slug in ('design-architecture', 'grey-structure', 'turnkey-construction', 'project-management')
   and is_confirmed = false and updated_at = created_at;

-- 10. Settings added by this release ---------------------------------------
insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values
  ('header_cta_label', 'Discuss Your Project', '', true, 'navigation', 'Header button text', 10),
  ('header_cta_href', '/consultation', '', true, 'navigation', 'Header button link', 20),
  ('footer_cta_title', 'Have a project in mind? Let''s talk.', '', true, 'footer', 'Footer call-to-action heading', 20),
  ('footer_cta_label', 'Discuss Your Project', '', true, 'footer', 'Footer button text', 30),
  ('footer_cta_href', '/consultation', '', true, 'footer', 'Footer button link', 40),
  ('whatsapp_cta_label', 'Chat About Your Project', '', true, 'contact', 'WhatsApp button text', 60),
  ('whatsapp_message', 'Hello Siraj Builders, I''d like to discuss a construction project.

Project type: 
Location: 
Property/Plot size: 
Expected start: 

I''d like to understand the next steps and discuss my requirements.', '', true, 'contact', 'WhatsApp pre-filled message', 70),
  ('form_success_message', 'Thank you. Your project details have been received. Our team will review the information and contact you regarding the next step.', '', true, 'forms', 'Form success message', 10),
  ('form_microcopy', 'Your information is used to understand your project and determine the appropriate next step.', '', true, 'forms', 'Text under the forms', 20),
  ('default_og_image', '', '', true, 'seo', 'Default social-share image URL', 30)
on conflict (key) do nothing;

-- 11. Homepage: first hero slide uses the documented H1 -------------------
update public.hero_slides
   set eyebrow = 'Siraj Builders',
       title = 'Construction, managed from the first plan to the final detail.',
       lead = 'A well-built project begins long before construction starts. Siraj Builders brings together planning, coordination and on-site execution to create a more organised construction experience for homeowners, businesses and property investors.',
       primary_label = 'Discuss Your Project', primary_to = '/consultation',
       secondary_label = 'View Our Projects', secondary_to = '/projects'
 where title = 'Built with clarity. Managed with care.'
   and updated_at = created_at;
-- A slide must not link to a service page that is not published yet.
update public.hero_slides set primary_label = 'See How We Work', primary_to = '/our-process'
 where primary_to = '/project-management' and updated_at = created_at;

commit;

notify pgrst, 'reload schema';

-- Final check: shows in the SQL editor's Messages tab
do $$
declare
  n_sections int; n_pages int; n_faqs int; n_unanswered int;
begin
  select count(*) into n_sections from public.page_sections;
  select count(distinct page_path) into n_pages from public.page_sections;
  select count(*) into n_faqs from public.faqs;
  select count(*) into n_unanswered from public.faqs where not is_active;
  raise notice 'SIRAJ BUILDERS — content migration complete';
  raise notice '  page sections : % across % pages (documented: 104 across 26)', n_sections, n_pages;
  raise notice '  FAQs          : % (% waiting for an answer from Siraj Builders)', n_faqs, n_unanswered;
end $$;



-- ##########################################################################
-- ##
-- ##   FINAL CHECK
-- ##   Reports what is actually in the database now. Read the NOTICE output
-- ##   in the SQL editor's "Messages" tab.
-- ##
-- ##########################################################################

do $$
declare
  n_sections integer;
  n_pages    integer;
  n_routes   integer;
begin
  select count(*), count(distinct page_path)
    into n_sections, n_routes
    from public.page_sections;

  select count(*) into n_pages from public.pages;

  raise notice '--------------------------------------------------';
  raise notice 'SIRAJ BUILDERS — install complete';
  raise notice '  page_sections rows : %', n_sections;
  raise notice '  distinct routes    : %', n_routes;
  raise notice '  pages rows         : %', n_pages;
  raise notice '--------------------------------------------------';

  if n_sections = 0 then
    raise warning 'page_sections is EMPTY. The admin panel will show every page as "empty". Run database/repair-page-sections.sql.';
  end if;
end;
$$;

-- Tell PostgREST to re-read the schema. Without this a table created moments
-- ago can still 404 as "not found in the schema cache" until the API restarts.
notify pgrst, 'reload schema';
