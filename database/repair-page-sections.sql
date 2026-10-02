
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


-- (The project-column changes that shipped in the same migration are
--  deliberately omitted here: this file touches page_sections and nothing
--  else. They are in install.sql.)


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
-- ##   STEP 2 OF 3 — ROW LEVEL SECURITY
-- ##   (source file: database/policies.sql)
-- ##
-- ##########################################################################

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
-- ##   STEP 3 OF 3 — THE 91 SECTIONS
-- ##   (source file: database/seed.sql)
-- ##
-- ##########################################################################

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
-- ##   FINAL CHECK — "Messages" tab mein nateeja dekhein
-- ##########################################################################

do $$
declare
  n_sections integer;
  n_routes   integer;
begin
  select count(*), count(distinct page_path)
    into n_sections, n_routes
    from public.page_sections;

  raise notice '--------------------------------------------------';
  raise notice 'page_sections repaired';
  raise notice '  rows            : %  (expected 91)', n_sections;
  raise notice '  distinct routes : %  (expected 23)', n_routes;
  raise notice '--------------------------------------------------';
  raise notice 'Ab admin panel kholein aur Pages screen refresh karein.';
end;
$$;

-- The step that is actually missing when the table exists but the API still
-- says "not found in the schema cache": PostgREST caches the schema and only
-- re-reads it when told to.
notify pgrst, 'reload schema';
