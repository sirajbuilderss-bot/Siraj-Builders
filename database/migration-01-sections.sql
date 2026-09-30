-- ============================================================================
--  SIRAJ BUILDERS — MIGRATION 01
--  Visual Section CMS + expanded project fields
--  ----------------------------------------------------------------------------
--  Run this ONCE against a database that already has schema.sql + policies.sql
--  applied. Safe to re-run: every statement is guarded.
--
--  On a brand-new database you do not need this file — schema.sql and
--  policies.sql already contain everything below.
--
--  HOW TO RUN
--    1. Supabase dashboard → SQL Editor → New query
--    2. Paste this whole file
--    3. Run
-- ============================================================================


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
--  4. ROW LEVEL SECURITY FOR page_sections
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
