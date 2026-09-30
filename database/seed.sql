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
