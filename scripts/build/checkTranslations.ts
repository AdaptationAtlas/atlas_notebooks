// Check per-locale notebook text under data/*/text/ against the content contract:
//  - every locale in LOCALES has a <locale>.json with the same leaf keys as en.json
//  - every prose block <id>.<locale>.md exists for every locale
//  - block ids (filenames) match [A-Za-z0-9_-]+
//  - every block's front matter is exactly `---\ntitle: <non-empty scalar>\n---`
//    (the narrow contract Lang.parseBlock relies on in the browser)
//  - every block referenced by a .qmd ({{< prose id >}} marker, sections.id,
//    sections["id"]) has a matching file, and every block file is referenced
//    by something — an unreferenced block usually means a typo'd id (which
//    would otherwise fail silently at render)
// Usage: deno run --allow-read scripts/build/checkTranslations.ts

import { expandGlob } from "https://deno.land/std@0.224.0/fs/expand_glob.ts";
import { dirname, relative } from "https://deno.land/std@0.224.0/path/mod.ts";
import { parse as parseYaml } from "https://deno.land/std@0.224.0/yaml/mod.ts";

const LOCALES = ["en", "fr"]; // keep in sync with admin/config.yml i18n.locales

function leafPaths(node: unknown, prefix = ""): string[] {
  if (typeof node !== "object" || node === null) return [prefix];
  return Object.entries(node).flatMap(([k, v]) =>
    leafPaths(v, prefix ? `${prefix}.${k}` : k)
  );
}

const problems: string[] = [];

async function readOr(path: string): Promise<string | null> {
  try {
    return await Deno.readTextFile(path);
  } catch {
    return null;
  }
}

// Front matter contract: exactly one single-line `title:` field, parsed with a
// real YAML parser. Anything richer is rejected so the small runtime parser
// (Lang.parseBlock) can never disagree with what ships.
function checkFrontMatter(path: string, raw: string) {
  const m = raw.match(/^---\r?\n(title:[^\r\n]*)\r?\n---\r?\n?/);
  if (!m) {
    problems.push(`${path}: front matter must be exactly \`---\\ntitle: ...\\n---\``);
    return;
  }
  let fm: unknown;
  try {
    fm = parseYaml(m[1]);
  } catch (e) {
    problems.push(`${path}: front matter is not valid YAML (${(e as Error).message})`);
    return;
  }
  const title = (fm as Record<string, unknown>)?.title;
  if (typeof title !== "string" || title.trim() === "") {
    problems.push(`${path}: \`title:\` must be a non-empty string`);
  }
}

const textDirs = new Set<string>();
for await (const f of expandGlob("data/*/text/en.json")) {
  textDirs.add(dirname(f.path));
}

const blocksByDir = new Map<string, Set<string>>();
const referencedByDir = new Map<string, Set<string>>();

for (const dir of textDirs) {
  const rel = relative(Deno.cwd(), dir);

  // JSON widget strings: key parity against en.json for every expected locale
  const en = new Set(
    leafPaths(JSON.parse(await Deno.readTextFile(`${dir}/en.json`))),
  );
  for (const loc of LOCALES.filter((l) => l !== "en")) {
    const raw = await readOr(`${dir}/${loc}.json`);
    if (raw === null) {
      problems.push(`${rel}/${loc}.json is missing`);
      continue;
    }
    const other = new Set(leafPaths(JSON.parse(raw)));
    for (const k of en) {
      if (!other.has(k)) problems.push(`${rel}/${loc}.json missing: ${k}`);
    }
    for (const k of other) {
      if (!en.has(k)) problems.push(`${rel}/${loc}.json has extra key (not in en.json): ${k}`);
    }
  }

  // Prose blocks: <id>.<locale>.md, valid id, all locales, valid front matter
  const ids = new Map<string, Set<string>>();
  for await (const e of Deno.readDir(dir)) {
    const m = e.name.match(/^(.+)\.([a-z]{2})\.md$/);
    if (!m) continue;
    const [, id, loc] = m;
    if (!/^[A-Za-z0-9_-]+$/.test(id)) {
      problems.push(`${rel}/${e.name}: block id must match [A-Za-z0-9_-]+`);
      continue;
    }
    if (!LOCALES.includes(loc)) {
      problems.push(`${rel}/${e.name}: unexpected locale '${loc}' (expected ${LOCALES.join(", ")})`);
      continue;
    }
    if (!ids.has(id)) ids.set(id, new Set());
    ids.get(id)!.add(loc);
    checkFrontMatter(`${rel}/${e.name}`, await Deno.readTextFile(`${dir}/${e.name}`));
  }
  for (const [id, present] of ids) {
    for (const loc of LOCALES) {
      if (!present.has(loc)) problems.push(`${rel}/${id}.${loc}.md is missing`);
    }
  }
  blocksByDir.set(rel, new Set(ids.keys()));
  referencedByDir.set(rel, new Set());

  console.log(`${rel}: ${en.size} keys, ${ids.size} prose blocks`);
}

// A notebook may be split across {{< include >}} fragments (which carry no front
// matter of their own, so they are not notebooks in their own right). Read the
// entry point together with everything it includes, so prose markers placed in a
// fragment count as references. One level deep — enough for the split notebooks
// we have; make it recursive if a fragment ever includes another.
async function readNotebook(path: string): Promise<string> {
  const entry = await Deno.readTextFile(path);
  const parts = [entry];

  for (const m of entry.matchAll(/\{\{<\s*include\s+(\S+?)\s*>\}\}/g)) {
    const target = m[1].startsWith("/")
      ? `.${m[1]}` // include paths starting with / are project-root relative
      : `${dirname(path)}/${m[1]}`;
    try {
      parts.push(await Deno.readTextFile(target));
    } catch {
      problems.push(`${relative(Deno.cwd(), path)}: cannot read include '${m[1]}'`);
    }
  }

  return parts.join("\n");
}

// QMD references: every block a notebook uses must exist
for await (const f of expandGlob("notebooks/**/*.qmd")) {
  const qmd = await readNotebook(f.path);
  const textDir = qmd.match(/^nb-text-dir:\s*(\S+)\s*$/m)?.[1];
  if (!textDir) continue;
  const rel = relative(Deno.cwd(), f.path);
  const blocks = blocksByDir.get(textDir);
  if (!blocks) {
    problems.push(`${rel}: nb-text-dir '${textDir}' has no en.json / prose blocks`);
    continue;
  }
  const refs = new Set<string>([
    // {{< prose <id> >}} markers (scripts/build/proseShortcode.lua) place
    // blocks on the page; sections.<id> / sections["<id>"] consume them in code
    ...[...qmd.matchAll(/\{\{<\s*prose\s+([A-Za-z0-9_-]+)/g)].map((m) => m[1]),
    ...[...qmd.matchAll(/\bsections\.([A-Za-z0-9_]+)/g)].map((m) => m[1]),
    ...[...qmd.matchAll(/\bsections\[["']([^"']+)["']\]/g)].map((m) => m[1]),
  ]);
  for (const id of refs) referencedByDir.get(textDir)?.add(id);

  // The notebook's runtime FileAttachment map (proseFiles) must cover every
  // referenced block in every locale — a missing entry passes the file checks
  // but silently breaks the client-side language toggle for that block.
  // (Delete this check if prose ever moves to build-time-only rendering.)
  const mapped = new Map<string, Set<string>>();
  const attachmentRe = new RegExp(
    `FileAttachment\\("/?${textDir}/([A-Za-z0-9_-]+)\\.([a-z]{2})\\.md"\\)`,
    "g",
  );
  for (const m of qmd.matchAll(attachmentRe)) {
    if (!mapped.has(m[1])) mapped.set(m[1], new Set());
    mapped.get(m[1])!.add(m[2]);
  }

  for (const id of refs) {
    if (!blocks.has(id)) {
      problems.push(`${rel} references block '${id}' but ${textDir}/${id}.en.md does not exist`);
      continue;
    }
    for (const loc of LOCALES) {
      if (!mapped.get(id)?.has(loc)) {
        problems.push(`${rel}: proseFiles map is missing FileAttachment for '${id}' (${loc})`);
      }
    }
  }
}

// Unreferenced block files: usually a typo'd id in a {{< prose >}} marker
// (a marker matching no block errors at render, but a block matching no
// marker would otherwise go unnoticed) or dead content
for (const [dir, ids] of blocksByDir) {
  const referenced = referencedByDir.get(dir)!;
  for (const id of ids) {
    if (!referenced.has(id)) {
      problems.push(`${dir}/${id}.*.md is referenced by no .qmd (typo'd {{< prose >}} id? dead content?)`);
    }
  }
}

if (problems.length) {
  console.error(`\n${problems.length} translation problem(s):`);
  for (const p of problems) console.error("  " + p);
  Deno.exit(1);
}
console.log("Translations OK");
