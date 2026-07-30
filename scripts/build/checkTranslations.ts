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

async function readOr(path: string): Promise<string | null> {
  try {
    return await Deno.readTextFile(path);
  } catch {
    return null;
  }
}

// Keep prose metadata narrow so build-time and browser parsing stay aligned.
function checkFrontMatter(path: string, raw: string): boolean {
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?/);
  if (!m) {
    problems.push(`${path}: missing YAML front matter`);
    return false;
  }
  let fm: unknown;
  try {
    fm = parseYaml(m[1]);
  } catch (e) {
    problems.push(
      `${path}: front matter is not valid YAML (${(e as Error).message})`,
    );
    return false;
  }
  const fields = fm as Record<string, unknown>;
  for (const key of Object.keys(fields ?? {})) {
    if (!["title", "details"].includes(key)) {
      problems.push(`${path}: unsupported front matter field '${key}'`);
    }
  }
  const title = fields?.title;
  if (typeof title !== "string" || title.trim() === "") {
    problems.push(`${path}: \`title:\` must be a non-empty string`);
  }
  if (fields?.details === undefined || fields.details === null) return false;

  if (typeof fields.details !== "object" || Array.isArray(fields.details)) {
    problems.push(`${path}: \`details:\` must contain title and body fields`);
    return false;
  }
  const details = fields.details as Record<string, unknown>;
  for (const key of Object.keys(details)) {
    if (!["title", "body"].includes(key)) {
      problems.push(`${path}: unsupported details field '${key}'`);
    }
  }
  for (const key of ["title", "body"]) {
    if (typeof details[key] !== "string" || details[key].trim() === "") {
      problems.push(`${path}: \`details.${key}:\` must be a non-empty string`);
    }
  }
  if (!/^  body:\s*\|-\s*$/m.test(m[1])) {
    problems.push(
      `${path}: \`details.body\` must use the literal form \`body: |-\``,
    );
  }
  return true;
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
      if (!en.has(k)) {
        problems.push(
          `${rel}/${loc}.json has extra key (not in en.json): ${k}`,
        );
      }
    }
  }

  // Validate every localized prose block.
  const ids = new Map<string, Set<string>>();
  const detailsById = new Map<string, Set<string>>();
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
    const hasDetails = checkFrontMatter(path, raw);
    // The {{< prose >}} marker owns the section heading; an h1 in the body would
    // add a second top-level section. Indented details bodies can't match.
    if (/^#\s/m.test(raw)) {
      problems.push(
        `${path}: \`# \` heading in the body — use \`## \` or lower`,
      );
    }
    if (hasDetails) {
      if (!detailsById.has(id)) detailsById.set(id, new Set());
      detailsById.get(id)!.add(loc);
    }
  }
  for (const [id, present] of ids) {
    for (const loc of LOCALES) {
      if (!present.has(loc)) problems.push(`${rel}/${id}.${loc}.md is missing`);
    }
    const detailsLocales = detailsById.get(id);
    if (detailsLocales) {
      for (const loc of LOCALES) {
        if (!detailsLocales.has(loc)) {
          problems.push(
            `${rel}/${id}.${loc}.md is missing its \`details:\` content`,
          );
        }
      }
    }
  }
  blocksByDir.set(rel, new Set(ids.keys()));
  referencedByDir.set(rel, new Set());

  console.log(
    `${rel}: ${en.size} keys, ${ids.size} prose blocks, ${detailsById.size} with details`,
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
    textDir?: string;
    blocks?: string[];
    contributors?: Record<string, { type?: string; id?: string }[]>;
  };
  try {
    config = JSON.parse(configRaw);
  } catch {
    problems.push(`${configPath}: notebook config is not valid JSON`);
    continue;
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
  const declared = new Set(config.blocks ?? []);
  for (const id of ["overview", "methods"]) {
    if (!declared.has(id)) {
      problems.push(`${configPath}: blocks must include '${id}'`);
    }
  }
  const refs = new Set(
    [...qmd.matchAll(/\{\{<\s*prose\s+([A-Za-z0-9_-]+)/g)].map((m) => m[1]),
  );
  for (const id of refs) referencedByDir.get(textDir)?.add(id);

  for (const id of refs) {
    if (!blocks.has(id)) {
      problems.push(
        `${rel} references block '${id}' but ${textDir}/${id}.en.md does not exist`,
      );
      continue;
    }
    if (!declared.has(id)) {
      problems.push(
        `${rel} references block '${id}' but ${configPath} does not declare it`,
      );
    }
  }

  for (const id of declared) {
    if (!blocks.has(id)) {
      problems.push(
        `${configPath} declares '${id}' but ${textDir}/${id}.en.md does not exist`,
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
