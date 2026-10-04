-- Add TikTok to the social links managed in Admin -> Settings.
-- Safe to run after the existing CMS migrations.

insert into public.social_links (key, label, href, is_confirmed, sort_order)
values ('tiktok', 'TikTok', '', false, 50)
on conflict (key) do nothing;