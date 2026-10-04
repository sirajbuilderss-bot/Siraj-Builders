
-- ============================================================================
-- SIRAJ BUILDERS — REMAINING BASE SEEDS
-- Run after database/schema.sql and database/policies.sql.
--
-- Page copy, FAQs, pages, services, and theme/contact settings are seeded by
-- database/migration-03-content.sql (or by the complete database/install.sql).
-- This file contains the starter social profiles and homepage hero slides
-- that are not part of the documented content source.
-- Safe to run more than once; existing rows and admin edits are preserved.
-- ============================================================================

insert into public.social_links (key, label, href, is_confirmed, sort_order)
values
  ('facebook', 'Facebook', '', false, 10),
  ('instagram', 'Instagram', '', false, 20),
  ('linkedin', 'LinkedIn', '', false, 30),
  ('youtube', 'YouTube', '', false, 40),
  ('tiktok', 'TikTok', '', false, 50),
  ('whatsapp_community', 'WhatsApp Community', '', false, 60)
on conflict (key) do nothing;

insert into public.hero_slides
  (eyebrow, title, lead, image_url, primary_label, primary_to,
   secondary_label, secondary_to, sort_order)
select v.eyebrow, v.title, v.lead, v.image_url, v.primary_label, v.primary_to,
       v.secondary_label, v.secondary_to, v.sort_order
from (values
  ('01 · Residential Construction', 'Built with clarity. Managed with care.',
   'A structured construction experience for homeowners who want clear planning, responsible execution and consistent communication — from the first conversation to the final handover.',
   'https://images.unsplash.com/photo-1487958449943-2429e8be8625?auto=format&fit=crop&w=2400&q=88',
   'Discuss Your Project', '/consultation', 'View Our Projects', '/projects', 10),
  ('02 · Commercial Construction', 'Spaces planned around how businesses work.',
   'From functional planning to coordinated execution, keep commercial construction focused on the purpose of the finished space — movement, usability and durability.',
   'https://images.unsplash.com/photo-1497366754035-f200968a6e72?auto=format&fit=crop&w=2400&q=88',
   'Explore Commercial', '/commercial-construction', 'Start a Conversation', '/consultation', 20),
  ('03 · Project Management', 'Know what is happening. Know what comes next.',
   'Professional project management brings decisions, people, materials and construction stages into a clearer route from plan to completion.',
   'https://images.unsplash.com/photo-1503387762-592deb58ef4e?auto=format&fit=crop&w=2400&q=88',
   'See Our Approach', '/project-management', 'Read FAQs', '/faq', 30),
  ('04 · Renovation & Remodelling', 'Improve the space you already have.',
   'Thoughtful renovation starts with understanding the existing property, then coordinating the changes that improve function, appearance and use.',
   'https://images.unsplash.com/photo-1511818966892-d7d671e672a2?auto=format&fit=crop&w=2400&q=88',
   'Explore Renovation', '/renovation-remodelling', 'Discuss Your Project', '/consultation', 40)
) as v(eyebrow, title, lead, image_url, primary_label, primary_to,
       secondary_label, secondary_to, sort_order)
where not exists (
  select 1 from public.hero_slides existing where existing.title = v.title
);

notify pgrst, 'reload schema';
