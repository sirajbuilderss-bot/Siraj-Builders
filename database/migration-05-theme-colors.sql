-- Theme colors for the public website and admin panel.
-- Safe to run after the existing CMS migrations.

insert into public.site_settings (key, value, display, is_confirmed, group_name, label, sort_order)
values
  ('theme_accent', '#e0a531', '', true, 'theme', 'Primary accent', 10),
  ('theme_accent_deep', '#666666', '', true, 'theme', 'Accent dark', 20),
  ('theme_dark', '#000000', '', true, 'theme', 'Dark surface', 30),
  ('theme_deeper', '#000000', '', true, 'theme', 'Deep surface', 40),
  ('theme_light', '#f4f6f5', '', true, 'theme', 'Light surface', 50),
  ('theme_ink', '#000000', '', true, 'theme', 'Text color', 60),
  ('theme_gradient_start', '#e0a531', '', true, 'theme', 'Gradient start', 70),
  ('theme_gradient_end', '#666666', '', true, 'theme', 'Gradient end', 80),
  ('theme_header', '#000000', '', true, 'theme', 'Header color', 90),
  ('theme_footer', '#000000', '', true, 'theme', 'Footer color', 100),
  ('theme_backtop', '#e0a531', '', true, 'theme', 'Back-to-top arrow', 110)
on conflict (key) do nothing;

-- Upgrade the previous built-in palette without overwriting a custom admin theme.
update public.site_settings set value = '#e0a531' where key = 'theme_accent' and lower(value) = '#9dc1c8';
update public.site_settings set value = '#666666' where key = 'theme_accent_deep' and lower(value) = '#4e7c86';
update public.site_settings set value = '#000000' where key in ('theme_dark', 'theme_deeper', 'theme_header', 'theme_footer')
  and lower(value) in ('#151c21', '#0f1418');
update public.site_settings set value = '#000000' where key = 'theme_ink' and lower(value) = '#212a31';
update public.site_settings set value = '#e0a531' where key in ('theme_gradient_start', 'theme_backtop') and lower(value) = '#9dc1c8';
update public.site_settings set value = '#666666' where key in ('theme_gradient_end') and lower(value) = '#4e7c86';