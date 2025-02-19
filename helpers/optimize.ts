import * as esbuild from "https://deno.land/x/esbuild@v0.19.2/mod.js";
import { walk } from "https://deno.land/std@0.224.0/fs/walk.ts";

// Directory to optimize
const SITE_DIR = "_site";

// Supported file types and their esbuild loaders
const LOADERS: Record<string, "js" | "css" | "html"> = {
  ".js": "js",
  ".css": "css",
  ".html": "html",
};

// Function to minify a file
async function minifyFile(filePath: string, loader: "js" | "css" | "html") {
  try {
    const content = await Deno.readTextFile(filePath);
    const result = await esbuild.transform(content, {
      minify: true,
      loader: loader as any,
    });
    await Deno.writeTextFile(filePath, result.code);
    console.log(`✅ Minified: ${filePath}`);
  } catch (err) {
    console.error(`❌ Failed to minify ${filePath}:`, err);
  }
}

// Recursively find and minify all JS, CSS, and HTML files
for await (const entry of walk(SITE_DIR, { includeDirs: false })) {
  const ext = entry.path.slice(entry.path.lastIndexOf("."));
  if (ext in LOADERS) {
    await minifyFile(entry.path, LOADERS[ext]);
  }
}

// Clean up esbuild resources
esbuild.stop();

console.log("🎉 Minification complete!");
