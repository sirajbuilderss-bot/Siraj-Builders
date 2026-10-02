#!/usr/bin/env node
/**
 * STATIC VERIFICATION
 * ============================================================================
 * Checks that can be run without installing dependencies or starting a build.
 *
 * This is NOT a substitute for `npm run build`. It cannot type-check, it does
 * not evaluate anything, and it will not catch a runtime error. What it does
 * catch is the class of mistake that breaks a build loudly and is invisible
 * when reading a diff:
 *
 *   1. an import pointing at a file that does not exist
 *   2. a named import that the target file does not export
 *   3. unbalanced braces, brackets or parentheses
 *   4. a route referenced by the page builder that App.jsx does not register
 *   5. a dependency used in source but missing from package.json
 *
 * Run:  node scripts/verify-static.js
 * Exit: 0 clean, 1 problems found.
 */

const fs = require("fs");
const path = require("path");

const ROOT = path.join(__dirname, "..");
const SRC = path.join(ROOT, "src");

const problems = [];
const notes = [];

/* ---------------------------------------------------------------- helpers */

function walk(dir, out = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (/\.(js|jsx)$/.test(entry.name)) out.push(full);
  }
  return out;
}

const rel = (file) => path.relative(ROOT, file);

/**
 * Strips strings, template literals and comments so the delimiter counter is
 * not confused by a brace inside a string. Regex literals are detected by the
 * token that precedes them, which is the same heuristic a syntax highlighter
 * uses and is good enough here.
 */
function strip(source) {
  let out = "";
  let i = 0;
  let prev = "";

  const REGEX_OK = /[(,=:[!&|?{};+\-*%~^<>]$/;

  while (i < source.length) {
    const c = source[i];
    const next = source[i + 1];

    // line comment
    if (c === "/" && next === "/") {
      while (i < source.length && source[i] !== "\n") i += 1;
      continue;
    }
    // block comment
    if (c === "/" && next === "*") {
      i += 2;
      while (i < source.length && !(source[i] === "*" && source[i + 1] === "/")) i += 1;
      i += 2;
      continue;
    }
    // string or template literal
    if (c === '"' || c === "'" || c === "`") {
      const quote = c;
      i += 1;
      while (i < source.length) {
        if (source[i] === "\\") { i += 2; continue; }
        if (source[i] === quote) { i += 1; break; }
        // A ${ } inside a template literal holds real code, so its braces
        // must still be counted.
        if (quote === "`" && source[i] === "$" && source[i + 1] === "{") {
          let depth = 1;
          out += "{";
          i += 2;
          while (i < source.length && depth > 0) {
            if (source[i] === "{") depth += 1;
            if (source[i] === "}") depth -= 1;
            out += source[i];
            i += 1;
          }
          continue;
        }
        i += 1;
      }
      out += '""';
      prev = '"';
      continue;
    }
    // regex literal
    //
    // Two JSX shapes have to be excluded first, or the scanner swallows real
    // code: "/>" ends a self-closing tag, and "</" opens a closing tag. Both
    // sit after characters that otherwise look like a regex position.
    const isJsxSelfClose = c === "/" && next === ">";
    const isJsxCloseTag = c === "/" && prev === "<";
    if (
      c === "/" &&
      !isJsxSelfClose &&
      !isJsxCloseTag &&
      !/\s/.test(next || "") &&
      REGEX_OK.test(prev.trim() || prev)
    ) {
      let j = i + 1;
      let inClass = false;
      let closed = false;
      while (j < source.length) {
        if (source[j] === "\\") { j += 2; continue; }
        if (source[j] === "[") inClass = true;
        else if (source[j] === "]") inClass = false;
        else if (source[j] === "/" && !inClass) { closed = true; break; }
        else if (source[j] === "\n") break;
        j += 1;
      }
      if (closed) {
        i = j + 1;
        while (i < source.length && /[gimsuy]/.test(source[i])) i += 1;
        out += "R";
        prev = "R";
        continue;
      }
    }

    out += c;
    if (!/\s/.test(c)) prev = c;
    i += 1;
  }

  return out;
}

function checkBalance(file, source) {
  const code = strip(source);
  const stack = [];
  const pairs = { "}": "{", ")": "(", "]": "[" };
  let line = 1;

  for (let i = 0; i < code.length; i += 1) {
    const c = code[i];
    if (c === "\n") line += 1;
    if (c === "{" || c === "(" || c === "[") stack.push({ c, line });
    else if (pairs[c]) {
      const top = stack.pop();
      if (!top) {
        problems.push(`${rel(file)}:${line} — unexpected closing "${c}"`);
        return;
      }
      if (top.c !== pairs[c]) {
        problems.push(
          `${rel(file)}:${line} — "${c}" closes "${top.c}" opened on line ${top.line}`
        );
        return;
      }
    }
  }

  if (stack.length) {
    const top = stack[stack.length - 1];
    problems.push(`${rel(file)}:${top.line} — "${top.c}" is never closed`);
  }
}

/* -------------------------------------------------------- import checking */

function resolveImport(fromFile, spec) {
  const base = path.resolve(path.dirname(fromFile), spec);
  const candidates = [
    base,
    `${base}.js`,
    `${base}.jsx`,
    path.join(base, "index.js"),
    path.join(base, "index.jsx"),
  ];
  for (const candidate of candidates) {
    if (fs.existsSync(candidate) && fs.statSync(candidate).isFile()) return candidate;
  }
  return null;
}

function exportedNames(file) {
  const source = fs.readFileSync(file, "utf8");
  const names = new Set();

  const patterns = [
    /export\s+(?:async\s+)?function\s+([A-Za-z0-9_$]+)/g,
    /export\s+(?:const|let|var|class)\s+([A-Za-z0-9_$]+)/g,
  ];
  for (const re of patterns) {
    let m;
    while ((m = re.exec(source))) names.add(m[1]);
  }

  // export { a, b as c }
  const braceRe = /export\s*\{([^}]*)\}/g;
  let m;
  while ((m = braceRe.exec(source))) {
    for (const part of m[1].split(",")) {
      const piece = part.trim();
      if (!piece) continue;
      const as = piece.split(/\s+as\s+/);
      names.add((as[1] || as[0]).trim());
    }
  }

  if (/export\s+default/.test(source)) names.add("default");
  // A re-export means this file's surface is wider than it looks; skip the
  // named check rather than report a false positive.
  if (/export\s+\*/.test(source)) names.add("*");

  return names;
}

function parseImports(source) {
  const out = [];
  // [^;]*? rather than [\s\S]*? so a side-effect import — `import "./x.css";`
  // with no `from` — cannot scan forward past its own semicolon and match the
  // word "from" inside an unrelated string further down the file.
  const re = /^\s*import\s+([^;]*?)\s*from\s*["']([^"']+)["']/gm;
  let m;
  while ((m = re.exec(source))) {
    const clause = m[1].trim();
    const spec = m[2];
    const named = [];
    let hasDefault = false;

    const brace = clause.match(/\{([\s\S]*?)\}/);
    if (brace) {
      for (const part of brace[1].split(",")) {
        const piece = part.trim();
        if (!piece) continue;
        named.push(piece.split(/\s+as\s+/)[0].trim());
      }
    }
    const beforeBrace = clause.split("{")[0].replace(/,\s*$/, "").trim();
    if (beforeBrace && !beforeBrace.startsWith("*")) hasDefault = true;

    out.push({ spec, named, hasDefault });
  }
  return out;
}

/* ------------------------------------------------------------------- runs */

const files = walk(SRC);
const jsOnly = files.filter((f) => f.endsWith(".js"));
notes.push(`Scanned ${files.length} JavaScript/JSX files under src/`);
notes.push(`Delimiter-balanced ${jsOnly.length} .js files (JSX needs a real build)`);

const deps = new Set(
  Object.keys(JSON.parse(fs.readFileSync(path.join(ROOT, "package.json"), "utf8")).dependencies || {})
);
const usedPackages = new Set();

for (const file of files) {
  const source = fs.readFileSync(file, "utf8");

  // Balance checking is limited to plain .js files.
  //
  // In a .jsx file, an apostrophe inside JSX text — "we'll", "Don't" — is
  // ordinary prose, but to a tokenizer that has not parsed the JSX tree it
  // looks like the start of a string literal, and everything up to the next
  // apostrophe gets swallowed along with any braces inside it. Distinguishing
  // the two cases means actually parsing JSX, which is what Babel is for.
  // Reporting confident nonsense would be worse than reporting nothing.
  if (file.endsWith(".js")) checkBalance(file, source);

  for (const imp of parseImports(source)) {
    if (imp.spec.startsWith(".")) {
      // CSS and other assets are resolved by webpack, not checked here beyond
      // existence.
      if (/\.(css|svg|png|jpg|jpeg|webp|json)$/.test(imp.spec)) {
        const asset = path.resolve(path.dirname(file), imp.spec);
        if (!fs.existsSync(asset)) {
          problems.push(`${rel(file)} — imports missing asset "${imp.spec}"`);
        }
        continue;
      }

      const target = resolveImport(file, imp.spec);
      if (!target) {
        problems.push(`${rel(file)} — cannot resolve import "${imp.spec}"`);
        continue;
      }

      const exports = exportedNames(target);
      if (exports.has("*")) continue;

      if (imp.hasDefault && !exports.has("default")) {
        problems.push(
          `${rel(file)} — imports a default from "${imp.spec}", which has no default export`
        );
      }
      for (const name of imp.named) {
        if (!exports.has(name)) {
          problems.push(
            `${rel(file)} — imports { ${name} } from "${imp.spec}", which does not export it`
          );
        }
      }
    } else if (!imp.spec.startsWith("/")) {
      // "@scope/name" is the package; "name/sub/path" is a deep import of "name".
      const spec = imp.spec;
      usedPackages.add(
        spec.startsWith("@") ? spec.split("/").slice(0, 2).join("/") : spec.split("/")[0]
      );
    }
  }
}

/* ---- dependencies ---- */

for (const pkg of usedPackages) {
  const builtin = ["react", "react-dom"];
  if (!deps.has(pkg) && !builtin.includes(pkg)) {
    problems.push(`package.json — "${pkg}" is imported in src/ but not listed as a dependency`);
  }
}
notes.push(`Resolved ${usedPackages.size} external packages against package.json`);

/* ---- routes referenced by the page builder ---- */

const appSource = fs.readFileSync(path.join(SRC, "App.jsx"), "utf8");
const registered = new Set(
  Array.from(appSource.matchAll(/path="([^"]+)"/g)).map((m) => m[1])
);

// The registry is generated from database/content-source.cjs.
const registryPaths = JSON.parse(
  fs.readFileSync(path.join(SRC, "content", "defaults.json"), "utf8")
).registry.map((entry) => entry.path);

let missingRoutes = 0;
for (const p of registryPaths) {
  if (!registered.has(p)) {
    problems.push(
      `src/services/sections.js — PAGE_REGISTRY lists "${p}" but App.jsx registers no such route`
    );
    missingRoutes += 1;
  }
}
notes.push(
  `Checked ${registryPaths.length} page-builder routes against App.jsx (${missingRoutes} missing)`
);

/* ---- SQL sanity ---- */

const dbDir = path.join(ROOT, "database");
for (const name of ["schema.sql", "policies.sql", "seed.sql", "install.sql"]) {
  const sql = fs.readFileSync(path.join(dbDir, name), "utf8");
  if (!/page_sections/.test(sql)) {
    problems.push(`database/${name} — does not mention page_sections`);
  }
  const open = (sql.match(/\(/g) || []).length;
  const close = (sql.match(/\)/g) || []).length;
  if (open !== close) {
    problems.push(`database/${name} — unbalanced parentheses (${open} open, ${close} close)`);
  }
}
notes.push("Checked 4 SQL files for the sections table and balanced parentheses");

/* ------------------------------------------------------------------ report */

console.log("\nSTATIC VERIFICATION\n" + "=".repeat(60));
for (const note of notes) console.log("  ·", note);

if (problems.length === 0) {
  console.log("\n  No problems found.\n");
  console.log("  Note: this does not replace `npm install && npm run build`.");
  console.log("  JSX syntax in .jsx files is NOT verified here — only Babel can do that.");
  console.log("  Run that before deploying.\n");
  process.exit(0);
}

console.log(`\n  ${problems.length} problem(s):\n`);
for (const problem of problems) console.log("   ✗", problem);
console.log("");
process.exit(1);
