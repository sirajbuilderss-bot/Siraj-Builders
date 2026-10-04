-- Add a separate WhatsApp Community link to Admin -> Settings -> Social links.

insert into public.social_links (key, label, href, is_confirmed, sort_order)
values ('whatsapp_community', 'WhatsApp Community', '', false, 60)
on conflict (key) do nothing;