// @ts-nocheck
import * as esbuild from "https://deno.land/x/esbuild@v0.25.5/mod.js";
import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";
import { extname } from "https://deno.land/std@0.224.0/path/extname.ts";
import { minify as minifyHtml } from "npm:html-minifier-terser@7.2.0";

if (!Deno.env.get("QUARTO_PROJECT_RENDER_ALL")) {
  Deno.exit();
}

const SITE_DIR = "_site";
const CONCURRENCY = 5;
const loaders = { ".js": "js", ".css": "css" } as const;

// Quarto always links an alternate colour-scheme stylesheet for its dark-mode
// toggle, and the browser downloads it even when no dark theme is configured —
// where it is byte-identical to the light one. Drop the link in that case only,
// so configuring a real dark theme makes the files differ and revives it.
const ALTERNATE_LINK = /<link[^>]*quarto-color-alternate[^>]*>/g;

async function alternateIsRedundant(): Promise<boolean> {
  const dir = `${SITE_DIR}/site_libs/bootstrap`;
  const digest = async (name: string) =>
    [...new Uint8Array(
      await crypto.subtle.digest("SHA-256", await Deno.readFile(`${dir}/${name}`)),
    )].map((b) => b.toString(16).padStart(2, "0")).join("");
  try {
    const names = [];
    for await (const e of Deno.readDir(dir)) {
      if (e.name.startsWith("bootstrap-") && e.name.endsWith(".min.css")) names.push(e.name);
    }
    const light = names.find((n) => !n.startsWith("bootstrap-dark-"));
    const dark = names.find((n) => n.startsWith("bootstrap-dark-"));
    if (!light || !dark) return false;
    return (await digest(light)) === (await digest(dark));
  } catch {
    return false;
  }
}

const dropAlternate = await alternateIsRedundant();
if (dropAlternate) {
  console.log("Dropping the alternate colour-scheme stylesheet (identical to light)");
}

const getSize = async (path: string) =>
  (await Deno.stat(path).catch(() => ({ size: 0 }))).size;
const formatSize = (bytes: number) =>
  bytes > 1e6 ? `${(bytes / 1e6).toFixed(2)}MB` : `${bytes}B`;

async function processFile(
  path: string,
  originalSize: number,
): Promise<number> {
  const ext = extname(path);
  try {
    let content = await Deno.readTextFile(path);
    let minified: string;

    if (ext === ".html") {
      if (dropAlternate) content = content.replace(ALTERNATE_LINK, "");
      minified = await minifyHtml(content, {
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeEmptyAttributes: true,
        useShortDoctype: true,
      });
    } else if (loaders[ext]) {
      minified = (
        await esbuild.transform(content, {
          minify: true,
          loader: loaders[ext],
        })
      ).code;
    } else return originalSize;

    await Deno.writeTextFile(path, minified);
    const newSize = await getSize(path);
    const reduction = ((originalSize - newSize) / originalSize) * 100;
    console.log(
      `${path}: ${formatSize(originalSize)} → ${formatSize(newSize)} (${reduction.toFixed(1)}%)`,
    );
    return newSize;
  } catch (err) {
    console.error(`Failed: ${path}`, err.message);
    return originalSize;
  }
}

async function main() {
  try {
    const files: { path: string; size: number }[] = [];

    // Collect files
    for await (const entry of walk(SITE_DIR, { includeDirs: false })) {
      const ext = extname(entry.path);
      if ([".css", ".js", ".html"].includes(ext)) {
        const size = await getSize(entry.path);
        if (size > 0) files.push({ path: entry.path, size });
      }
    }

    let originalTotal = 0,
      newTotal = 0;

    // Process in batches
    for (let i = 0; i < files.length; i += CONCURRENCY) {
      const batch = files.slice(i, i + CONCURRENCY);
      const results = await Promise.all(
        batch.map((f) => {
          originalTotal += f.size;
          return processFile(f.path, f.size);
        }),
      );
      newTotal += results.reduce((sum, size) => sum + size, 0);
    }

    const reduction = ((originalTotal - newTotal) / originalTotal) * 100;
    console.log(
      `\nOptimized: ${formatSize(originalTotal)} → ${formatSize(newTotal)} (${reduction.toFixed(1)}%)`,
    );
  } finally {
    esbuild.stop();
  }
}

await main();
