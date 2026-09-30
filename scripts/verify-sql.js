#!/usr/bin/env node
/**
 * SQL SANITY CHECK
 * ============================================================================
 * The SQL in database/ is pasted into Supabase's editor by hand and runs in a
 * single transaction: one bad statement and the whole install rolls back with
 * a message that points at a line number in a 1,600-line file. Catching the
 * mechanical errors here is a great deal cheaper.
 *
 * What this checks:
 *
 *   1. dollar-quoted function bodies ($$ … $$) are closed
 *   2. single quotes are balanced, allowing for '' escapes
 *   3. parentheses balance across each file
 *   4. every INSERT's value tuples have exactly as many values as the
 *      statement named columns  ← the one that actually catches bugs
 *   5. page_sections is seeded for every route the page builder offers
 *   6. install.sql and repair-page-sections.sql are in step with their sources
 *
 * What it cannot check: anything requiring a real PostgreSQL — types,
 * constraints, whether a function body compiles. Run the SQL against a
 * database before trusting it.
 *
 * Run:  node scripts/verify-sql.js
 * Exit: 0 clean, 1 problems found.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const DB = path.join(ROOT, "database");

const problems = [];
const notes = [];

/* -------------------------------------------------------------- helpers */

/**
 * Removes `-- line comments` that are not inside a string literal, so the
 * quote and paren counters are not thrown off by prose. Block comments are
 * not used in these files.
 */
function stripComments(sql) {
  let out = "";
  let inSingle = false;
  let inDollar = false;

  for (let i = 0; i < sql.length; i += 1) {
    const two = sql.slice(i, i + 2);

    if (!inSingle && two === "$$") {
      inDollar = !inDollar;
      out += two;
      i += 1;
      continue;
    }

    if (!inDollar && sql[i] === "'") {
      // '' inside a literal is an escaped quote, not a close-then-open.
      if (inSingle && sql[i + 1] === "'") {
        out += "''";
        i += 1;
        continue;
      }
      inSingle = !inSingle;
      out += "'";
      continue;
    }

    if (!inSingle && !inDollar && two === "--") {
      const nl = sql.indexOf("\n", i);
      i = nl === -1 ? sql.length : nl - 1;
      out += " ";
      continue;
    }

    out += sql[i];
  }

  return out;
}

/** Splits a value tuple on top-level commas only, ignoring nested () and ''. */
function splitTopLevel(tuple) {
  const parts = [];
  let depth = 0;
  let inSingle = false;
  let current = "";

  for (let i = 0; i < tuple.length; i += 1) {
    const ch = tuple[i];

    if (ch === "'") {
      if (inSingle && tuple[i + 1] === "'") {
        current += "''";
        i += 1;
        continue;
      }
      inSingle = !inSingle;
      current += ch;
      continue;
    }

    if (!inSingle) {
      if (ch === "(" || ch === "[") depth += 1;
      else if (ch === ")" || ch === "]") depth -= 1;
      else if (ch === "," && depth === 0) {
        parts.push(current.trim());
        current = "";
        continue;
      }
    }

    current += ch;
  }

  if (current.trim()) parts.push(current.trim());
  return parts;
}

/* ------------------------------------------------------------ the checks */

function checkQuoting(file, sql) {
  const dollars = (sql.match(/\$\$/g) || []).length;
  if (dollars % 2 !== 0) {
    problems.push(`${file}: odd number of $$ markers (${dollars}) — a function body is not closed`);
  }

  const clean = stripComments(sql);

  // Count quotes outside $$ bodies; '' pairs already collapsed by stripComments.
  let inDollar = false;
  let quotes = 0;
  for (let i = 0; i < clean.length; i += 1) {
    if (clean.slice(i, i + 2) === "$$") {
      inDollar = !inDollar;
      i += 1;
      continue;
    }
    if (inDollar) continue;
    if (clean[i] === "'") {
      if (clean[i + 1] === "'") {
        i += 1;
        continue;
      }
      quotes += 1;
    }
  }
  if (quotes % 2 !== 0) {
    problems.push(`${file}: unbalanced single quotes (${quotes} found outside function bodies)`);
  }

  let open = 0;
  let close = 0;
  let inSingle = false;
  inDollar = false;
  for (let i = 0; i < clean.length; i += 1) {
    if (clean.slice(i, i + 2) === "$$") {
      inDollar = !inDollar;
      i += 1;
      continue;
    }
    if (inDollar) continue;
    if (clean[i] === "'") {
      if (clean[i + 1] === "'") {
        i += 1;
        continue;
      }
      inSingle = !inSingle;
      continue;
    }
    if (inSingle) continue;
    if (clean[i] === "(") open += 1;
    if (clean[i] === ")") close += 1;
  }
  if (open !== close) {
    problems.push(`${file}: unbalanced parentheses — ${open} open, ${close} close`);
  }
}

/**
 * For every `insert into … (cols) values (…), (…)`, checks each tuple has as
 * many values as there are columns. A seed row one value short is the single
 * most likely hand-editing mistake in these files, and PostgreSQL reports it
 * as a type error somewhere else entirely.
 */
function checkInsertArity(file, sql) {
  const clean = stripComments(sql);
  const re = /insert\s+into\s+(public\.\w+)\s*\(([^)]*)\)\s*values/gi;

  let match;
  while ((match = re.exec(clean)) !== null) {
    const table = match[1];
    const columns = splitTopLevel(match[2]).length;

    // Walk forward tuple by tuple until the statement ends.
    let i = re.lastIndex;
    let tupleIndex = 0;

    while (i < clean.length) {
      while (i < clean.length && /[\s,]/.test(clean[i])) i += 1;
      if (clean[i] !== "(") break;

      let depth = 0;
      let inSingle = false;
      const start = i;
      for (; i < clean.length; i += 1) {
        const ch = clean[i];
        if (ch === "'") {
          if (inSingle && clean[i + 1] === "'") {
            i += 1;
            continue;
          }
          inSingle = !inSingle;
          continue;
        }
        if (inSingle) continue;
        if (ch === "(") depth += 1;
        else if (ch === ")") {
          depth -= 1;
          if (depth === 0) {
            i += 1;
            break;
          }
        }
      }

      const tuple = clean.slice(start + 1, i - 1);
      const values = splitTopLevel(tuple).length;
      tupleIndex += 1;

      if (values !== columns) {
        const line = sql.slice(0, sql.indexOf(tuple.slice(0, 40))).split("\n").length;
        problems.push(
          `${file}: ${table} insert, tuple ${tupleIndex} (~line ${line}) has ${values} values but ${columns} columns were named`
        );
      }
    }
  }
}

/** Every route the page builder offers must have at least one seeded section. */
function checkRouteCoverage(file, sql) {
  const registry = fs.readFileSync(path.join(ROOT, "src/services/sections.js"), "utf8");
  const routes = [...registry.matchAll(/\{\s*path:\s*"([^"]+)"/g)].map((m) => m[1]);
  const seeded = new Set([...sql.matchAll(/^\('(\/[a-z0-9-]*)',/gm)].map((m) => m[1]));

  const missing = routes.filter((route) => !seeded.has(route));
  if (missing.length) {
    problems.push(
      `${file}: no sections seeded for ${missing.length} route(s) the page builder lists: ${missing.join(", ")}`
    );
  }

  const orphan = [...seeded].filter((route) => !routes.includes(route));
  if (orphan.length) {
    problems.push(`${file}: seeds sections for route(s) with no page: ${orphan.join(", ")}`);
  }

  return { routes: routes.length, seeded: seeded.size };
}

/** A generated file that has drifted from its sources is worse than none. */
function checkGeneratedInStep() {
  const install = fs.readFileSync(path.join(DB, "install.sql"), "utf8");
  const repair = fs.readFileSync(path.join(DB, "repair-page-sections.sql"), "utf8");

  for (const source of ["schema.sql", "policies.sql", "seed.sql"]) {
    const text = fs.readFileSync(path.join(DB, source), "utf8");
    // A distinctive line from each source that must survive concatenation.
    const probe = text
      .split("\n")
      .find((line) => line.trim().startsWith("create ") || line.trim().startsWith("insert "));
    if (probe && !install.includes(probe.trim())) {
      problems.push(`install.sql is out of date with ${source} — run node database/build-sql.js`);
    }
  }

  const essentials = [
    "create table if not exists public.page_sections",
    "create policy page_sections_public_read",
    "create or replace function public.reorder_page_sections",
    "notify pgrst, 'reload schema'",
  ];
  for (const needle of essentials) {
    if (!install.includes(needle)) problems.push(`install.sql is missing: ${needle}`);
    if (!repair.includes(needle)) problems.push(`repair-page-sections.sql is missing: ${needle}`);
  }

  // The repair file must not write to anything except page_sections.
  const writes = [
    ...repair.matchAll(
      /^\s*(?:create table if not exists|alter table|insert into|update|delete from|truncate)\s+(public\.\w+)/gim
    ),
  ].map((m) => m[1]);
  const stray = [...new Set(writes)].filter((t) => t !== "public.page_sections");
  if (stray.length) {
    problems.push(`repair-page-sections.sql writes to ${stray.join(", ")} — it claims to touch only page_sections`);
  }
}

/* ------------------------------------------------------------------- run */

console.log("\nSQL SANITY CHECK");
console.log("=".repeat(60));

const files = fs
  .readdirSync(DB)
  .filter((name) => name.endsWith(".sql"))
  .sort();

for (const name of files) {
  const sql = fs.readFileSync(path.join(DB, name), "utf8");
  checkQuoting(name, sql);
  checkInsertArity(name, sql);
}

const coverage = checkRouteCoverage("install.sql", fs.readFileSync(path.join(DB, "install.sql"), "utf8"));
checkRouteCoverage("repair-page-sections.sql", fs.readFileSync(path.join(DB, "repair-page-sections.sql"), "utf8"));
checkGeneratedInStep();

notes.push(`Checked ${files.length} SQL files in database/`);
notes.push(`Page builder lists ${coverage.routes} routes; all are seeded`);

for (const note of notes) console.log(`  · ${note}`);

if (problems.length) {
  console.log(`\n  ${problems.length} problem(s):\n`);
  for (const problem of problems) console.log(`    ✗ ${problem}`);
  console.log("");
  process.exit(1);
}

console.log("\n  No problems found.");
console.log("\n  Note: this cannot replace running the SQL against PostgreSQL.");
console.log("  It checks structure, not semantics.\n");
