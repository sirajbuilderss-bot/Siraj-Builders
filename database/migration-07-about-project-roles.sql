-- Make the visible About page Project roles editable in Admin -> About roles.

alter table public.team_members
  add column if not exists is_sample boolean not null default false;

insert into public.team_members (name, role, bio, image_url, is_sample, is_active, sort_order)
select * from (values
  ('Planning & coordination', 'Scope, sequence and decisions', 'Translate the project brief into an agreed scope, plan the sequence of work and keep the next decision clear.', 'https://images.pexels.com/photos/8486908/pexels-photo-8486908.jpeg?auto=compress&cs=tinysrgb&w=900', true, true, 10),
  ('Site operations', 'Day-to-day site coordination', 'Coordinate activity across the work stages and keep progress communication tied to what is happening on site.', 'https://images.pexels.com/photos/3931131/pexels-photo-3931131.jpeg?auto=compress&cs=tinysrgb&w=900', true, true, 20),
  ('Quality & handover', 'Review and close-out', 'Review visible work against the agreed scope, record outstanding details and make the handover easier to follow.', 'https://images.pexels.com/photos/37556459/pexels-photo-37556459.jpeg?auto=compress&cs=tinysrgb&w=900', true, true, 30)
) as seed(name, role, bio, image_url, is_sample, is_active, sort_order)
where not exists (
  select 1 from public.team_members existing
  where existing.is_sample = true
);