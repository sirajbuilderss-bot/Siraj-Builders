# Siraj Builders — Final Supabase Database Schema

This is the complete database the website and admin panel use.

## How to set it up

**New, empty Supabase project:** open SQL Editor → New query, paste the whole of `database/install.sql`, then Run. It creates every table, policy and storage bucket, and loads the documented content. Then sign up at `/admin/signup`; the first account becomes the owner.

**Existing project (you already ran an earlier `install.sql`):** run these files, in this order:

1. `database/migration-02-cms.sql` — new table, new columns, storage bucket, policies
2. `database/migration-03-content.sql` — the documented page content and FAQs
3. `database/migration-04-activity-retention.sql` — lets active admins delete individual audit entries or prune entries older than a chosen retention period

These migrations are safe to run more than once. Migration 03 only replaces seeded rows that nobody has edited (`updated_at = created_at`), so your own edits are kept.

Run migration 04 after migrations 02 and 03. It adds delete permission only for active admins; existing activity records are not changed until an admin confirms a cleanup in the dashboard.

## Relationships

```
auth.users ──1:1── admin_users ──1:many── activity_logs (actor_id)

projects ──1:many── project_media          (on delete cascade)
projects.service_slug ┄┄ services.slug      (soft link, for the "service behind this project" link)

faq_categories ──1:many── faqs             (on delete set null)

pages.path ┄┄ page_sections.page_path       (one registry row per route; many sections per route)

storage bucket "site-media" ┄┄ project_media.storage_path and every *_url column that holds an upload
```

## Conventions shared by every table

- **Keys and timestamps:** primary keys are `uuid` with `default gen_random_uuid()`, except `site_settings`, which is keyed by `key`. Every table has `created_at` and `updated_at`, and a trigger `touch_updated_at()` keeps `updated_at` current.
- **Visibility:** `is_active` (or `is_published` / `is_enabled`) decides what visitors can see. The admin can hide a row without deleting it.
- **Order:** `sort_order` (or `position` for sections) controls the order on screen. `reorder_rows(table, ids[])` rewrites a whole list in one call.

**Row Level Security** is on for every table, with the same pattern throughout:

- Visitors (`anon`) may read only live rows.
- Signed-in editors and admins (`is_editor()`) may create, update and delete.
- Admins (`is_admin()`) may also read hidden rows.
- Pending accounts (`is_active = false` in `admin_users`) have no rights.

## Tables

### 1. `admin_users` — who may use the admin panel
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | FK → `auth.users.id`, cascade delete |
| email | text unique | |
| full_name | text | |
| role | text | `admin` \| `editor` \| `viewer` |
| is_active | boolean | `false` = waiting for approval |
| last_seen_at | timestamptz | |

How accounts start: the first sign-up becomes the active admin (via the `claim_admin_access()` function). Later sign-ups wait as inactive viewers until an admin approves them.

RLS: users can read their own row, and admins can manage everyone.

### 2. `submissions` — contact and consultation form enquiries
Columns: `form_type` (contact \| consultation \| quote \| other), `name`, `phone`, `email`, `project_type`, `description`, `location`, `size`, `budget`, `start_date` (free text), `service`, `status` (new \| contacted \| qualified \| closed \| spam), `is_read`, `admin_notes`, `source_page`, `user_agent`, `metadata` (jsonb).

Indexes: `created_at desc`, `status`, `is_read`.

RLS: anyone may **insert** (that is how the forms work, and the insert is checked for required fields and length). Only admins may read, update or delete.

### 3. `projects` — portfolio case studies
| Group | Columns |
|---|---|
| Identity | `slug` (unique, → `/projects/<slug>`), `title`, `category` (Residential \| Commercial \| Renovation \| Design & Build), `service_slug` |
| Card | `short_description` (also copied to `summary`), `image_url` = **featured image** |
| Details | `location`, `status` (Completed \| Ongoing), `year`, `area`, `timeline`, `scope`, `client_name`, `completion_date` |
| Case study | `full_description` (overview), `requirement`, `challenge`, `solution`, `approach`, `quality`, `result`, `features` (jsonb list) |
| Feedback | `client_feedback`, `feedback_verified` — feedback appears on the website only when this is true |
| SEO | `seo_title`, `seo_description`, `banner_url` (optional wide cover) |
| Control | `is_active` (live), `is_featured` (shown first), `sort_order`, `tags` (internal) |
| Legacy | `gallery` (jsonb), `video_url` — copied into `project_media` by migration 02, still read as a fallback |

Indexes: `slug` (unique), `(is_active, sort_order)`, `service_slug`.

RLS: visitors read rows where `is_active`; editors write.

### 4. `project_media` — photos and videos of a project *(new)*
| Column | Type | Notes |
|---|---|---|
| id | uuid PK | |
| project_id | uuid FK | → `projects.id` **on delete cascade** |
| kind | text | `image` \| `video` |
| url | text | public URL (upload or pasted link) |
| storage_path | text | set when the file was uploaded; used to delete the file |
| caption | text | |
| alt_text | text | for screen readers |
| sort_order | int | gallery order |

Index: `(project_id, kind, sort_order)`.

RLS: visitors can read media only for **live** projects; editors write.

### 5. `services` — service cards and menu links
Columns: `slug` (unique), `path` (unique), `label` (menu name and card title), `title`, `summary` (card text), `cta_label` *(new)*, `image_url`, `is_confirmed`, `is_active`, `show_in_nav`, `sort_order`.

Rule enforced in the admin: a service can only be published once `is_confirmed` is true.

RLS: visitors read rows where `is_active`.

### 6. `pages` — page registry: publish switch and SEO
One row per public route.

- **Columns:** `path` (unique), `label`, `is_published`, `seo_title`, `seo_description`, `og_image` (social share image), `sort_order`.
- **Legacy copy columns:** `eyebrow`, `title`, `intro`, `image_url`, `heading`, `body`, `points`, `motif` are no longer shown. Edits made there before were carried into the hero sections by migration 03.

An unpublished page shows "not found" to visitors; signed-in admins can still preview it.

RLS: visitors read rows where `is_published`.

### 7. `page_sections` — the content of every page
| Column | Notes |
|---|---|
| page_path, page_label | which page |
| section_key | unique per page (`unique(page_path, section_key)`) |
| label | admin-only name |
| section_type | hero, intro, content, features, trust, process, services, projects, testimonials, faq, stats, team, cta, gallery, contact, custom |
| eyebrow, title, subtitle, body | text (blank lines in `body` become paragraphs) |
| items | jsonb `[{title, body, image}]` — cards, bullets, steps |
| media_url, video_url | image / video |
| cta_label, cta_href | primary button |
| settings | jsonb: `theme` (white \| light \| dark), `layout`, `cta2_label`, `cta2_href`, `limit`, `category`, `hide_empty`, `note` |
| position | order on the page |
| is_enabled | shown or hidden |

Index: `(page_path, position)`.

RLS: visitors read rows where `is_enabled`. The function `reorder_page_sections()` reorders a page.

### 8. `faq_categories` and 9. `faqs`
- **`faq_categories`:** `key` (unique), `label`, `is_active`, `sort_order`.
- **`faqs`:** `category_id` (FK → `faq_categories`, set null), `question` (unique, case-insensitive), `answer`, `is_active`, `show_on_home` *(new)*, `sort_order`.

Rule enforced in the admin: a question cannot be published without an answer. The 15 [TO CONFIRM] questions from the documentation are seeded unpublished, waiting for real answers.

### 10. `testimonials`
Columns: `quote`, `client_name`, `project_type`, `location`, `image_url`, `is_verified`, `is_active`, `sort_order`.

The website shows a testimonial only when it is **active and verified**.

### 11. `team_members`
Columns: `name`, `role`, `bio`, `image_url`, `linkedin_url`, `is_active`, `sort_order`. The Leadership and About sections stay hidden until at least one person is added.

### 12. `stats`
Columns: `label`, `value`, `suffix`, `is_active`, `sort_order`. Use verified figures only; the homepage numbers band stays hidden while this table is empty.

### 13. `hero_slides` — the homepage slider
Columns: `eyebrow`, `title`, `lead`, `image_url`, `primary_label` / `primary_to`, `secondary_label` / `secondary_to`, `is_active`, `sort_order`. The first slide's title is the homepage H1.

### 14. `site_settings` — key/value settings
Primary key is `key`. Other columns: `value`, `display` (text shown while unconfirmed), `is_confirmed`, `group_name`, `label`, `sort_order`.

Groups and what they control:

- **Company:** name, tagline and similar.
- **Contact:** phone, WhatsApp, email, address, hours, the WhatsApp pre-filled message and the WhatsApp button text. Contact details become clickable links only once `is_confirmed` is true.
- **Navigation:** header button text and link.
- **Footer:** footer call-to-action heading, button text and link, tagline.
- **Forms:** form success message and microcopy.
- **SEO:** site URL and the default share image.

### 15. `social_links`
Columns: `key` (unique), `label`, `href`, `is_confirmed`, `is_active`, `sort_order`.

### 16. `activity_logs` — admin audit trail
Columns: `actor_id` (FK → `admin_users`, set null), `actor_email`, `action`, `entity`, `entity_id`, `summary`, `metadata`.

RLS: active admins may read and append entries. They may delete individual entries or prune entries older than a selected retention period; edits are not allowed. The dashboard always confirms deletions first.

## Storage

| Bucket | Public | Limit | Allowed types |
|---|---|---|---|
| `site-media` | yes (anyone can view a file by its URL) | 50 MB per file | jpeg, png, webp, gif, avif, mp4, webm |

Who can do what with files (policies on `storage.objects`):

- **Visitors:** can only view. Anonymous upload attempts are refused.
- **Active editors and admins** (`is_editor()`): can upload, replace and delete.

Folders: `projects/<project-id>/…`, `pages/…`, `services/…`, `seo/…`.

## Functions
| Function | Purpose | Who |
|---|---|---|
| `is_admin()`, `is_editor()` | role checks used by every policy (security definer) | internal |
| `claim_admin_access(full_name)` | first sign-up becomes owner; later ones wait for approval | signed-in |
| `admin_exists()` | sign-up screen wording | anyone |
| `dashboard_counts()` | dashboard numbers (now returns nothing to non-admins) | admins |
| `reorder_page_sections(page, ids[])` | reorder a page's sections | editors (RLS) |
| `reorder_rows(table, ids[])` *(new)* | reorder any list; table name checked against a fixed allow-list | editors (RLS) |
| `touch_updated_at()` | trigger | internal |
