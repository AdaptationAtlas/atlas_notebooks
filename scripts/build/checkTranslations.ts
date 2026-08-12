// Validate locale parity, prose front matter, manifests, and QMD↔block references.
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

function checkLeafValues(path: string, node: unknown, prefix = ""): void {
  if (typeof node === "object" && node !== null) {
    for (const [key, value] of Object.entries(node)) {
      checkLeafValues(path, value, prefix ? `${prefix}.${key}` : key);
    }
    return;
  }
  if (typeof node !== "string" || node.trim() === "") {
    problems.push(`${path}: '${prefix}' must be a non-empty string`);
  }
}

async function readOr(path: string): Promise<string | null> {
  try {
    return await Deno.readTextFile(path);
  } catch {
    return null;
  }
}

// Front matter is exactly `title:` — a collapsed note is its own block, marked
// with {{< prose id details=true >}}, so nothing is nested here.
function checkFrontMatter(path: string, raw: string): void {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) {
    problems.push(`${path}: missing YAML front matter`);
    return;
  }
  let fm: unknown;
  try {
    fm = parseYaml(m[1]);
  } catch (e) {
    problems.push(
      `${path}: front matter is not valid YAML (${(e as Error).message})`,
    );
    return;
  }
  const fields = fm as Record<string, unknown>;
  for (const key of Object.keys(fields ?? {})) {
    if (key !== "title") {
      problems.push(`${path}: unsupported front matter field '${key}'`);
    }
  }
  const title = fields?.title;
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

  // Require widget-string key parity with English.
  const enPath = `${rel}/en.json`;
  const enText = JSON.parse(await Deno.readTextFile(`${dir}/en.json`));
  checkLeafValues(enPath, enText);
  const en = new Set(leafPaths(enText));
  for (const loc of LOCALES.filter((l) => l !== "en")) {
    const raw = await readOr(`${dir}/${loc}.json`);
    if (raw === null) {
      problems.push(`${rel}/${loc}.json is missing`);
      continue;
    }
    const localePath = `${rel}/${loc}.json`;
    const localeText = JSON.parse(raw);
    checkLeafValues(localePath, localeText);
    const other = new Set(leafPaths(localeText));
    for (const k of en) {
      if (!other.has(k)) problems.push(`${rel}/${loc}.json missing: ${k}`);
    }
    for (const k of other) {
      if (!en.has(k)) {
        problems.push(
          `${rel}/${loc}.json has extra key (not in en.json): ${k}`,
        );
      }
    }
  }

  // Validate every localized prose block.
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
      problems.push(
        `${rel}/${e.name}: unexpected locale '${loc}' (expected ${
          LOCALES.join(", ")
        })`,
      );
      continue;
    }
    if (!ids.has(id)) ids.set(id, new Set());
    ids.get(id)!.add(loc);
    const path = `${rel}/${e.name}`;
    const raw = await Deno.readTextFile(`${dir}/${e.name}`);
    checkFrontMatter(path, raw);
    // The {{< prose >}} marker owns the section heading; an h1 in the body would
    // add a second top-level section.
    if (/^#\s/m.test(raw)) {
      problems.push(
        `${path}: \`# \` heading in the body — use \`## \` or lower`,
      );
    }
  }
  for (const [id, present] of ids) {
    for (const loc of LOCALES) {
      if (!present.has(loc)) problems.push(`${rel}/${id}.${loc}.md is missing`);
    }
  }
  blocksByDir.set(rel, new Set(ids.keys()));
  referencedByDir.set(rel, new Set());

  console.log(
    `${rel}: ${en.size} keys, ${ids.size} prose blocks`,
  );
}

// Include one fragment level so split-notebook prose markers count as references.
async function readIncludes(path: string, entry: string): Promise<string> {
  const parts = [entry];

  for (const m of entry.matchAll(/\{\{<\s*include\s+(\S+?)\s*>\}\}/g)) {
    const target = m[1].startsWith("/")
      ? `.${m[1]}` // include paths starting with / are project-root relative
      : `${dirname(path)}/${m[1]}`;
    try {
      parts.push(await Deno.readTextFile(target));
    } catch {
      problems.push(
        `${relative(Deno.cwd(), path)}: cannot read include '${m[1]}'`,
      );
    }
  }

  return parts.join("\n");
}

// A `common` contributor id that no longer resolves throws in resolveContributors()
// and takes the whole notebook down in the browser, so catch it at build.
const commonContributors = new Set<string>(
  (JSON.parse(await readOr("data/shared/contributors.json") ?? "{}")
    .contributors ?? []).map((c: { id: string }) => c.id),
);

// Require every referenced prose block to exist.
for await (const f of expandGlob("notebooks/**/*.qmd")) {
  const entry = await Deno.readTextFile(f.path);
  const configPath = entry.match(/^nb-config:\s*(\S+)\s*$/m)?.[1];
  if (!configPath) continue;
  const configRaw = await readOr(configPath);
  if (configRaw === null) {
    problems.push(
      `${relative(Deno.cwd(), f.path)}: cannot read nb-config '${configPath}'`,
    );
    continue;
  }
  let config: {
    title?: Record<string, unknown>;
    textDir?: string;
    contributors?: Record<string, { type?: string; id?: string }[]>;
  };
  try {
    config = JSON.parse(configRaw);
  } catch {
    problems.push(`${configPath}: notebook config is not valid JSON`);
    continue;
  }
  for (const locale of LOCALES) {
    if (
      typeof config.title?.[locale] !== "string" ||
      config.title[locale].trim() === ""
    ) {
      problems.push(`${configPath}: title.${locale} must be a non-empty string`);
    }
  }
  const textDir = config.textDir;
  if (!textDir) {
    problems.push(`${configPath}: notebook config is missing textDir`);
    continue;
  }
  for (const group of ["authors", "developers"]) {
    if (!config.contributors?.[group]?.length) {
      problems.push(
        `${configPath}: contributors.${group} must list at least one person`,
      );
    }
  }
  for (const [group, list] of Object.entries(config.contributors ?? {})) {
    for (const c of list ?? []) {
      if (c?.type === "common" && !commonContributors.has(c.id!)) {
        problems.push(
          `${configPath}: contributors.${group} references unknown common contributor '${c.id}'`,
        );
      }
    }
  }

  const qmd = await readIncludes(f.path, entry);
  const rel = relative(Deno.cwd(), f.path);
  const blocks = blocksByDir.get(textDir);
  if (!blocks) {
    problems.push(`${rel}: textDir '${textDir}' has no en.json / prose blocks`);
    continue;
  }
  const refs = new Set(
    [...qmd.matchAll(/\{\{<\s*prose\s+([A-Za-z0-9_-]+)/g)].map((m) => m[1]),
  );
  for (const id of refs) referencedByDir.get(textDir)?.add(id);

  for (const id of ["overview", "methods"]) {
    if (!refs.has(id)) {
      problems.push(`${rel}: must place a '${id}' prose block`);
    }
  }

  for (const id of refs) {
    if (!blocks.has(id)) {
      problems.push(
        `${rel} references block '${id}' but ${textDir}/${id}.en.md does not exist`,
      );
    }
  }
}

// Flag dead blocks and misspelled marker IDs.
for (const [dir, ids] of blocksByDir) {
  const referenced = referencedByDir.get(dir)!;
  for (const id of ids) {
    if (!referenced.has(id)) {
      problems.push(
        `${dir}/${id}.*.md is referenced by no .qmd (typo'd {{< prose >}} id? dead content?)`,
      );
    }
  }
}

if (problems.length) {
  console.error(`\n${problems.length} translation problem(s):`);
  for (const p of problems) console.error("  " + p);
  Deno.exit(1);
}
console.log("Translations OK");
