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
