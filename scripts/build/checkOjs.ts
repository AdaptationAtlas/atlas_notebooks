import { CellParser } from "npm:@observablehq/parser@6.1.0";

const { tokTypes } = CellParser.acorn;

class ModuleParser extends CellParser {
  parseTopLevel(node) {
    node.cells = [];
    while (this.type !== tokTypes.eof) {
      node.cells.push(this.parseCell(this.startNode()));
    }
    this.next();
    return this.finishNode(node, "Program");
  }
}

const DEFAULT_DIRS = ["components", "docs", "notebooks"];
const files: string[] = [];

async function collect(path: string): Promise<void> {
  const stat = await Deno.stat(path);
  if (stat.isFile) {
    if (path.endsWith(".qmd")) files.push(path);
    return;
  }

  for await (const entry of Deno.readDir(path)) {
    if (entry.name.startsWith(".") || entry.name === "node_modules" || entry.name === "_site") {
      continue;
    }
    await collect(`${path}/${entry.name}`);
  }
}

if (Deno.args.length) {
  for (const path of Deno.args) await collect(path);
} else {
  for await (const entry of Deno.readDir(".")) {
    if (entry.isFile && entry.name.endsWith(".qmd")) files.push(entry.name);
  }
  for (const path of DEFAULT_DIRS) await collect(path);
}

const problems: string[] = [];
let cells = 0;
let blocks = 0;
const ojsFiles = new Set<string>();

for (const path of files.sort()) {
  const lines = (await Deno.readTextFile(path)).split(/\r?\n/);

  for (let i = 0; i < lines.length; i++) {
    const opening = lines[i].match(/^\s*(`{3,}|~{3,})\s*(?:\{\s*)?ojs(?:\s*[,}]|\s*$)/i);
    if (!opening) continue;

    const fence = opening[1];
    const closing = new RegExp(`^\\s*${fence[0]}{${fence.length},}\\s*$`);
    const start = i + 1;
    let end = start;
    while (end < lines.length && !closing.test(lines[end])) end++;

    if (end === lines.length) {
      problems.push(`${path}:${i + 1}: unclosed OJS code fence`);
      break;
    }

    const source = lines.slice(start, end).join("\n");
    blocks++;
    ojsFiles.add(path);
    try {
      const module = ModuleParser.parse(source);
      cells += module.cells.length;
    } catch (error) {
      const syntaxError = error as SyntaxError & {
        loc?: { line: number; column: number };
      };
      const line = start + (syntaxError.loc?.line ?? 1);
      const column = (syntaxError.loc?.column ?? 0) + 1;
      const message = syntaxError.message.replace(/ \(\d+:\d+\)$/, "");
      problems.push(`${path}:${line}:${column}: ${message}`);
    }

    i = end;
  }
}

if (problems.length) {
  console.error(problems.join("\n"));
  Deno.exit(1);
}

console.log(`Checked ${cells} OJS cells in ${blocks} blocks across ${ojsFiles.size} files`);
