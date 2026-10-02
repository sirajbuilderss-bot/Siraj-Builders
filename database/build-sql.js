#!/usr/bin/env node
/**
 * SQL BUILD
 * ============================================================================
 * Generates two files from the three hand-edited sources, so neither can
 * drift from the schema:
 *
 *   database/install.sql              schema + policies + seed, in order
 *   database/repair-page-sections.sql just the section CMS, on its own
 *
 * Run:  node database/build-sql.js
 *
 * WHY THE REPAIR FILE EXISTS
 * --------------------------
 * If the page_sections table is dropped — by hand, or by a reset that took
 * more than it should — the admin panel's Pages screen stops loading with
 * "Could not find the table 'public.page_sections' in the schema cache".
 *
 * Re-running the whole install.sql does fix it, but that is 1,500 lines of
 * SQL against a live database to repair one table, and nobody feels calm
 * doing that. The repair file is the same statements for that one table,
 * lifted from the same sources, so it cannot say something different from
 * what install.sql says.
 *
 * HOW THE EXTRACTION WORKS
 * ------------------------
 * Each source file keeps its section-CMS statements last, under a banner
 * containing VISUAL SECTION CMS. Everything from that banner to the end of
 * the file is the section CMS for that concern — the table in schema.sql,
 * the policies in policies.sql, the rows in seed.sql. If that banner is ever
 * removed or the block stops being last, this script fails loudly rather
 * than quietly writing a repair file that repairs nothing.
 */

const fs = require("fs");
const path = require("path");

const DIR = __dirname;
const MARKER = "VISUAL SECTION CMS";

const read = (name) => fs.readFileSync(path.join(DIR, name), "utf8");

/** Everything from the section-CMS banner to the end of the file. */
function sectionBlockOf(name) {
  const text = read(name);
  const index = text.indexOf(MARKER);
  if (index === -1) {
    throw new Error(
      `${name} no longer contains a "${MARKER}" banner. ` +
        `build-sql.js extracts the repair file from that banner to the end of ` +
        `the file, so either restore the banner or rewrite this script.`
    );
  }
  // Rewind to the start of the banner's own comment block, so the extracted
  // text reads as a section rather than starting mid-sentence.
  const bannerStart = text.lastIndexOf("-- ####", index);
  const from = bannerStart === -1 ? text.lastIndexOf("\n", index) + 1 : bannerStart;
  return text.slice(from).trimEnd();
}

/**
 * Cuts the text between two markers out of a block, inclusive of the first
 * and exclusive of the second.
 *
 * Used for one thing: schema.sql's section-CMS block also carries the
 * `alter table public.projects add column …` statements, because both
 * arrived in the same migration. Those are harmless and idempotent, but the
 * repair file promises in its own header that it touches nothing except
 * page_sections — and a file that quietly alters a second table while saying
 * it does not is exactly the kind of thing that makes someone stop trusting
 * the SQL you hand them. So it is cut, and the cut fails loudly if either
 * marker moves.
 */
function without(block, fromMarker, toMarker, context) {
  const start = block.indexOf(fromMarker);
  const end = block.indexOf(toMarker);
  if (start === -1 || end === -1 || end < start) {
    throw new Error(
      `Could not cut "${fromMarker}" … "${toMarker}" out of ${context}. ` +
        `The markers have moved; fix build-sql.js rather than shipping a ` +
        `repair file that does more than its header claims.`
    );
  }
  const head = block.slice(0, start).trimEnd();
  const tail = block.slice(end);
  return `${head}\n\n\n-- (The project-column changes that shipped in the same migration are\n--  deliberately omitted here: this file touches page_sections and nothing\n--  else. They are in install.sql.)\n\n\n${tail}`;
}

/* ==========================================================================
 * install.sql
 * ========================================================================== */

const INSTALL_HEADER = `-- ============================================================================
--  SIRAJ BUILDERS — COMPLETE DATABASE INSTALLER
--  ---------------------------------------------------------------------------
--  GENERATED FILE — do not edit by hand.
--  Source: schema.sql + policies.sql + seed.sql + migration-02-cms.sql
--          + migration-03-content.sql
--  Rebuild with: npm run build:sql
--
--  Yeh file teenon SQL files ko sahi tarteeb (order) mein jorr deti hai:
--
--      1. schema.sql    ->  tables, indexes, triggers, functions
--      2. policies.sql  ->  Row Level Security (kaun kya parh/likh sakta hai)
--      3. seed.sql      ->  bunyadi content (settings, services, waghaira)
--      4. migration-02  ->  project photos/videos table, SEO fields,
--                           image upload bucket (Storage) + policies
--      5. migration-03  ->  documentation wala poora content: har page ke
--                           sections, 20 FAQs, services ke cards
--
--  ISTEMAAL KA TAREEQA:
--    Supabase Dashboard -> SQL Editor -> New query
--    Poori file copy karein, paste karein, "Run" dabayein.
--
--  Yeh file dobara chalana bhi MEHFOOZ hai. Har statement "if not exists" ya
--  "on conflict do nothing" use karta hai, is liye:
--    - jo tables pehle se hain wo dobara nahi banengi
--    - jo content aap ne admin panel se badla hai wo WAPIS NAHI BADLE GA
--
--  ---------------------------------------------------------------------------
--  AGAR ADMIN PANEL MEIN YEH ERROR AAYE:
--
--      Could not find the table 'public.page_sections' in the schema cache
--
--  To poori install.sql chalane ki zaroorat nahi. Sirf yeh chhoti file
--  chalayein:  database/repair-page-sections.sql
--  ---------------------------------------------------------------------------
--
--  AGAR ERROR AAYE: Supabase SQL Editor har cheez ek hi transaction mein
--  chalata hai. Matlab agar beech mein error aaya to kuch bhi save nahi
--  hoga - database waise ka waisa rahega. Error ka message bhej dein.
-- ============================================================================`;

/* A closing block that reports what actually landed. Without it the SQL
   editor says "Success. No rows returned", which is the same message you get
   when a guarded script did nothing at all — not a useful distinction when
   you are trying to find out whether the install worked. */
const INSTALL_FOOTER = `


-- ##########################################################################
-- ##
-- ##   FINAL CHECK
-- ##   Reports what is actually in the database now. Read the NOTICE output
-- ##   in the SQL editor's "Messages" tab.
-- ##
-- ##########################################################################

do $$
declare
  n_sections integer;
  n_pages    integer;
  n_routes   integer;
begin
  select count(*), count(distinct page_path)
    into n_sections, n_routes
    from public.page_sections;

  select count(*) into n_pages from public.pages;

  raise notice '--------------------------------------------------';
  raise notice 'SIRAJ BUILDERS — install complete';
  raise notice '  page_sections rows : %', n_sections;
  raise notice '  distinct routes    : %', n_routes;
  raise notice '  pages rows         : %', n_pages;
  raise notice '--------------------------------------------------';

  if n_sections = 0 then
    raise warning 'page_sections is EMPTY. The admin panel will show every page as "empty". Run database/repair-page-sections.sql.';
  end if;
end;
$$;

-- Tell PostgREST to re-read the schema. Without this a table created moments
-- ago can still 404 as "not found in the schema cache" until the API restarts.
notify pgrst, 'reload schema';`;

function buildInstall() {
  const steps = [
    ["1 OF 5 — SCHEMA", "schema.sql"],
    ["2 OF 5 — POLICIES", "policies.sql"],
    ["3 OF 5 — SEED", "seed.sql"],
    ["4 OF 5 — CMS STRUCTURE (media, SEO, storage)", "migration-02-cms.sql"],
    ["5 OF 5 — DOCUMENTED CONTENT", "migration-03-content.sql"],
  ];

  let out = INSTALL_HEADER;
  for (const [label, file] of steps) {
    out += `\n\n\n-- ##########################################################################\n`;
    out += `-- ##\n-- ##   STEP ${label}\n-- ##   (source file: database/${file})\n-- ##\n`;
    out += `-- ##########################################################################\n\n`;
    out += read(file);
  }
  out += INSTALL_FOOTER + "\n";

  fs.writeFileSync(path.join(DIR, "install.sql"), out);
  return out;
}

/* ==========================================================================
 * repair-page-sections.sql
 * ========================================================================== */

const REPAIR_HEADER = `-- ============================================================================
--  SIRAJ BUILDERS — PAGE SECTIONS REPAIR
--  ---------------------------------------------------------------------------
--  GENERATED FILE — do not edit by hand.
--  Source: the section-CMS blocks of schema.sql, policies.sql and seed.sql
--  Rebuild with: node database/build-sql.js
--
--  YEH FILE KAB CHALANI HAI
--  ------------------------
--  Jab admin panel ke "Pages" screen par yeh error aaye:
--
--      The page builder could not load
--      Could not find the table 'public.page_sections' in the schema cache
--
--  Matlab: page_sections table database se ghayab hai (delete ho gayi, ya
--  kabhi bani hi nahi).
--
--  CHALANE KA TAREEQA
--  ------------------
--    1. Supabase Dashboard -> SQL Editor -> New query
--    2. Yeh poori file copy kar ke paste karein
--    3. "Run" dabayein
--    4. Admin panel mein Pages screen refresh karein (Ctrl+Shift+R)
--
--  KYA YEH MEHFOOZ HAI?  Ji haan.
--  ------------------------------
--    - Sirf page_sections table ko haath lagati hai. Projects, services,
--      FAQs, submissions, admin users — kisi ko nahi chhoti.
--    - Agar table pehle se mojood ho to dobara nahi banati.
--    - Rows "on conflict do nothing" se aati hain, is liye aap ne jo text
--      admin panel se badla hai wo WAPIS NAHI BADLE GA.
--    - Dobara chalana bhi mehfooz hai.
--
--  ZAROORI: is file se pehle database mein schema.sql chal chuka hona
--  chahiye, kyunke yeh public.is_editor() aur public.is_admin() istemal
--  karti hai. Agar database bilkul khaali hai to iske bajaye poori
--  install.sql chalayein.
-- ============================================================================`;

const REPAIR_FOOTER = `


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
notify pgrst, 'reload schema';`;

function buildRepair() {
  const parts = [
    ["1 OF 3 — TABLE, INDEXES, TRIGGER, REORDER FUNCTION", "schema.sql"],
    ["2 OF 3 — ROW LEVEL SECURITY", "policies.sql"],
    ["3 OF 3 — THE 91 SECTIONS", "seed.sql"],
  ];

  let out = REPAIR_HEADER;
  for (const [label, file] of parts) {
    let block = sectionBlockOf(file);
    if (file === "schema.sql") {
      block = without(
        block,
        "--  3. EXPANDED PROJECT FIELDS",
        "--  5. REORDER HELPER",
        "schema.sql's section block"
      );
    }
    out += `\n\n\n-- ##########################################################################\n`;
    out += `-- ##\n-- ##   STEP ${label}\n-- ##   (source file: database/${file})\n-- ##\n`;
    out += `-- ##########################################################################\n\n`;
    out += block;
  }
  out += REPAIR_FOOTER + "\n";

  fs.writeFileSync(path.join(DIR, "repair-page-sections.sql"), out);
  return out;
}

/* ==========================================================================
 * RUN
 * ========================================================================== */

const install = buildInstall();
const repair = buildRepair();

/* A generated file that is missing the one table it was generated to create
   is worse than no generated file, because it looks like it worked. */
const requiredInBoth = [
  "create table if not exists public.page_sections",
  "create policy page_sections_public_read",
  "insert into public.page_sections",
  "notify pgrst, 'reload schema'",
];

let failed = false;

/* The repair file's header promises it touches one table. Prove it. */
const strayWrites = (repair.match(
  /^\s*(?:create table if not exists|alter table|insert into|update|delete from|truncate)\s+public\.([a-z_]+)/gim
) || [])
  .map((line) => line.trim().split(/\s+/).pop().replace("public.", ""))
  .filter((table) => table !== "page_sections");

if (strayWrites.length) {
  console.error(
    `  \u2717 repair-page-sections.sql writes to tables it says it does not touch: ${[
      ...new Set(strayWrites),
    ].join(", ")}`
  );
  failed = true;
}

for (const [name, text] of [["install.sql", install], ["repair-page-sections.sql", repair]]) {
  const rows = (text.match(/^\('\//gm) || []).length;
  for (const needle of requiredInBoth) {
    if (!text.includes(needle)) {
      console.error(`  ✗ ${name} is missing: ${needle}`);
      failed = true;
    }
  }
  const open = (text.match(/\(/g) || []).length;
  const close = (text.match(/\)/g) || []).length;
  if (open !== close) {
    console.error(`  ✗ ${name} has unbalanced parentheses (${open} open, ${close} close)`);
    failed = true;
  }
  console.log(
    `  ${name.padEnd(28)} ${String(text.split("\n").length).padStart(5)} lines, ${rows} seeded rows`
  );
}

if (failed) {
  console.error("\nBuild produced a file that would not work. Nothing was trusted.\n");
  process.exit(1);
}

console.log("\nSQL rebuilt.\n");
