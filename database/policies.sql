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
--  Admins read and append. Nobody updates or deletes — an audit trail that
--  can be rewritten is not an audit trail.
-- ----------------------------------------------------------------------------
drop policy if exists activity_logs_admin_read   on public.activity_logs;
drop policy if exists activity_logs_admin_insert on public.activity_logs;

create policy activity_logs_admin_read on public.activity_logs
  for select to authenticated using (public.is_admin());

create policy activity_logs_admin_insert on public.activity_logs
  for insert to authenticated with check (public.is_admin());

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

grant select, insert on public.activity_logs to authenticated;

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
