// @ts-nocheck
import { parse } from "https://deno.land/std@0.154.0/flags/mod.ts";
import { serveDir } from "https://deno.land/std@0.154.0/http/file_server.ts";

// Parse named args
const args = parse(Deno.args, {
  default: { port: 8000, dir: "_site", help: false },
  alias: { p: "port", d: "dir", h: "help" },
  boolean: ["help"],
});

// Show help text
if (args.help) {
  console.log(`
  Simple Deno Static Server

  USAGE:
    quarto run testServer.ts [OPTIONS]

  OPTIONS:
    -p, --port <NUM>     Port to listen on (default: 8000)
    -d, --dir <PATH>     Directory to serve (default: _site)
    -h, --help           Show this help message
  `);
  Deno.exit(0);
}

// Show server info
console.log(`
Deno Static Server
-----------------
Serving: ${args.dir}
Port: ${args.port}
URL: http://localhost:${args.port}/
Press Ctrl+C to stop
`);

// Start server
Deno.serve(
  (req) =>
    serveDir(req, {
      fsRoot: args.dir,
      showDirListing: true,
      showIndex: true,
      showDotfiles: false,
      enableCors: true,
      quiet: false,
      urlRoot: "",
      notFoundFile: `${args.dir}/404.html`
    }),
  { port: Number(args.port) }
);