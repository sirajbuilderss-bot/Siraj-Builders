
create or replace function pg_temp.row_count(tbl text)
returns bigint
language plpgsql
as $fn$
declare n bigint;
begin
  if to_regclass(tbl) is null then
    return -1;
  end if;
  execute format('select count(*) from %s', tbl) into n;
  return n;
end;
$fn$;

create or replace function pg_temp.distinct_count(tbl text, col text)
returns bigint
language plpgsql
as $fn$
declare n bigint;
begin
  if to_regclass(tbl) is null then
    return -1;
  end if;
  execute format('select count(distinct %I) from %s', col, tbl) into n;
  return n;
end;
$fn$;


with checks as (

  -- 1. TABLES — 15 honi chahiye
  select 1 as step, 'TABLES' as check_name,
         count(*) as found, 15 as expected,
         case when count(*) = 15 then 'OK'
              else 'MISSING — install.sql dobara chalayein' end as status
  from information_schema.tables
  where table_schema = 'public'
    and table_name in (
      'admin_users','submissions','projects','services','pages',
      'faq_categories','faqs','testimonials','team_members','stats',
      'hero_slides','site_settings','social_links','activity_logs',
      'page_sections')

  union all

  -- 2. ROW LEVEL SECURITY — har table (15) par ON hona ZAROORI hai.
  --    Agar OFF raha to anon key se koi bhi aap ka pura data parh sakta hai.
  select 2, 'RLS ENABLED',
         count(*) filter (where rowsecurity), 15,
         case when count(*) filter (where rowsecurity) = 15 then 'OK'
              else 'KHATRA — policies.sql nahi chala. Data asurakshit hai!' end
  from pg_tables
  where schemaname = 'public'
    and tablename in (
      'admin_users','submissions','projects','services','pages',
      'faq_categories','faqs','testimonials','team_members','stats',
      'hero_slides','site_settings','social_links','activity_logs',
      'page_sections')

  union all

  -- 3. POLICIES — 32 rules (14 tables + page_sections)
  select 3, 'POLICIES', count(*), 32,
         case when count(*) >= 32 then 'OK'
              else 'MISSING — policies.sql dobara chalayein' end
  from pg_policies where schemaname = 'public'

  union all

  -- 4. FUNCTIONS — login, signup aur dashboard ke liye zaroori
  select 4, 'FUNCTIONS', count(*), 8,
         case when count(*) = 8 then 'OK'
              else 'MISSING — install.sql dobara chalayein' end
  from pg_proc p
  join pg_namespace n on n.oid = p.pronamespace
  where n.nspname = 'public'
    and p.proname in ('touch_updated_at','is_admin','is_editor','is_owner',
                      'dashboard_counts','claim_admin_access','admin_exists',
                      'reorder_page_sections')

  union all

  -- 5-9. CONTENT — website ka text
  select 5, 'PAGES', count(*), 17,
         case when count(*) >= 17 then 'OK' else 'MISSING — seed.sql chalayein' end
  from public.pages
  union all
  select 6, 'SERVICES', count(*), 7,
         case when count(*) >= 7 then 'OK' else 'MISSING — seed.sql chalayein' end
  from public.services
  union all
  select 7, 'FAQS', count(*), 19,
         case when count(*) >= 19 then 'OK' else 'MISSING — seed.sql chalayein' end
  from public.faqs
  union all
  select 8, 'SETTINGS', count(*), 13,
         case when count(*) >= 13 then 'OK' else 'MISSING — seed.sql chalayein' end
  from public.site_settings
  union all
  select 9, 'HERO SLIDES', count(*), 4,
         case when count(*) >= 4 then 'OK' else 'MISSING — seed.sql chalayein' end
  from public.hero_slides

  union all

  -- 10. PAGE SECTIONS — admin panel ka "Pages" screen isi par chalta hai.
  --     Yeh check pehle mojood nahi tha, isi liye table delete ho jane par
  --     verify.sql "sab OK" keh deta tha aur masla sirf admin panel kholne
  --     par nazar aata tha.
  select 10, 'PAGE SECTIONS',
         pg_temp.row_count('public.page_sections'), 91,
         case
           when pg_temp.row_count('public.page_sections') = -1
             then 'MISSING TABLE — database/repair-page-sections.sql chalayein'
           when pg_temp.row_count('public.page_sections') = 0
             then 'KHALI — database/repair-page-sections.sql chalayein'
           when pg_temp.row_count('public.page_sections') < 91
             then 'KAM HAIN — repair-page-sections.sql chalayein'
           else 'OK'
         end

  union all

  -- 11. Har page ke sections mojood hain ya nahi. 23 routes honi chahiyen.
  select 11, 'SECTION ROUTES',
         pg_temp.distinct_count('public.page_sections', 'page_path'), 23,
         case
           when pg_temp.distinct_count('public.page_sections', 'page_path') = -1
             then 'MISSING TABLE — database/repair-page-sections.sql chalayein'
           when pg_temp.distinct_count('public.page_sections', 'page_path') < 23
             then 'KUCH PAGES KHALI — repair-page-sections.sql chalayein'
           else 'OK'
         end

  union all

  -- 12. ADMIN ACCOUNT — shuru mein 0 hona SAHI hai.
  --     /admin/signup par pehla account banayein; wahi admin ban jayega.
  select 12, 'ADMIN USERS', count(*), 0,
         case when count(*) = 0
              then 'KHALI — ab /admin/signup par pehla account banayein'
              else 'OK — ' || count(*)::text || ' account maujood hai' end
  from public.admin_users
)
select step, check_name, found, expected, status
from checks
order by step;
