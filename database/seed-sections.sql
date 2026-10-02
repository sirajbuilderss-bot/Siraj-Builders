

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
