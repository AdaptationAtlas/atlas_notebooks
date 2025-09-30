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
  Development Server with Live Reload

  USAGE:
    quarto run dev-server.ts [OPTIONS]

  OPTIONS:
    -p, --port <NUM>     Port to listen on (default: 8000)
    -d, --dir <PATH>     Directory to serve (default: _site)
    -h, --help           Show this help message
  `);
  Deno.exit(0);
}

// Live reload script
const liveReloadScript = `
<script>
  // Live reload functionality
  let lastModified = null;
  
  function checkForChanges() {
    fetch('/__live_reload__')
      .then(response => response.json())
      .then(data => {
        if (lastModified && data.lastModified !== lastModified) {
          console.log('Changes detected, reloading...');
          window.location.reload();
        }
        lastModified = data.lastModified;
      })
      .catch(() => {
        // Ignore errors, server might not be ready
      });
  }
  
  // Check for changes every 1 second
  setInterval(checkForChanges, 1000);
  
  // Also listen for file system events if supported
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Ignore if service worker registration fails
    });
  }
</script>
`;

// Service worker for file watching
const serviceWorkerScript = `
self.addEventListener('install', () => {
  self.skipWaiting();
});

self.addEventListener('activate', () => {
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data.type === 'RELOAD') {
    self.clients.matchAll().then(clients => {
      clients.forEach(client => client.postMessage({ type: 'RELOAD' }));
    });
  }
});
`;

// Show server info
console.log(`
Development Server with Live Reload
----------------------------------
Serving: ${args.dir}
Port: ${args.port}
URL: http://localhost:${args.port}/
Live reload: Enabled
Press Ctrl+C to stop
`);

// Start server with live reload
Deno.serve(
  (req) => {
    const url = new URL(req.url);

    // Handle live reload endpoint
    if (url.pathname === "/__live_reload__") {
      return new Response(
        JSON.stringify({
          lastModified: Date.now(),
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    // Handle service worker
    if (url.pathname === "/sw.js") {
      return new Response(serviceWorkerScript, {
        headers: { "Content-Type": "application/javascript" },
      });
    }

    // Serve files with live reload script injection
    return serveDir(req, {
      fsRoot: args.dir,
      showDirListing: true,
      showIndex: true,
      showDotfiles: false,
      enableCors: true,
      quiet: false,
      urlRoot: "",
      notFoundFile: `${args.dir}/404.html`,
    }).then((response) => {
      // Inject live reload script into HTML files
      if (response.headers.get("content-type")?.includes("text/html")) {
        return response.text().then((html) => {
          const modifiedHtml = html.replace(
            "</body>",
            `${liveReloadScript}</body>`
          );
          return new Response(modifiedHtml, {
            headers: response.headers,
          });
        });
      }
      return response;
    });
  },
  { port: Number(args.port) }
);
