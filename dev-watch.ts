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
  Development Server with File Watching and Auto-rebuild

  USAGE:
    quarto run dev-watch.ts [OPTIONS]

  OPTIONS:
    -p, --port <NUM>     Port to listen on (default: 8000)
    -d, --dir <PATH>     Directory to serve (default: _site)
    -h, --help           Show this help message
  `);
  Deno.exit(0);
}

// Live reload script with WebSocket connection
const liveReloadScript = `
<script>
  // WebSocket connection for live reload
  let ws;
  let reconnectInterval;
  
  function connectWebSocket() {
    ws = new WebSocket('ws://localhost:${args.port}/__live_reload__');
    
    ws.onopen = () => {
      console.log('Live reload connected');
      clearInterval(reconnectInterval);
    };
    
    ws.onmessage = (event) => {
      if (event.data === 'reload') {
        console.log('Changes detected, reloading...');
        window.location.reload();
      }
    };
    
    ws.onclose = () => {
      console.log('Live reload disconnected, reconnecting...');
      reconnectInterval = setInterval(connectWebSocket, 1000);
    };
    
    ws.onerror = () => {
      console.log('Live reload connection error');
    };
  }
  
  // Start connection when page loads
  connectWebSocket();
</script>
`;

// Show server info
console.log(`
Development Server with File Watching
------------------------------------
Serving: ${args.dir}
Port: ${args.port}
URL: http://localhost:${args.port}/
Live reload: WebSocket enabled
Press Ctrl+C to stop
`);

// WebSocket connections for live reload
const connections = new Set();

// Start server with WebSocket support
Deno.serve(
  (req) => {
    const url = new URL(req.url);

    // Handle WebSocket upgrade for live reload
    if (
      url.pathname === "/__live_reload__" &&
      req.headers.get("upgrade") === "websocket"
    ) {
      const { socket, response } = Deno.upgradeWebSocket(req);

      socket.onopen = () => {
        connections.add(socket);
        console.log("Live reload client connected");
      };

      socket.onclose = () => {
        connections.delete(socket);
        console.log("Live reload client disconnected");
      };

      socket.onerror = () => {
        connections.delete(socket);
      };

      return response;
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

// File watching functionality
async function watchFiles() {
  const watcher = Deno.watchFs([
    "./notebooks",
    "./helpers",
    "./data",
    "./images",
    "./styles.css",
    "./_quarto.yml",
  ]);

  for await (const event of watcher) {
    if (
      event.kind === "modify" ||
      event.kind === "create" ||
      event.kind === "remove"
    ) {
      console.log(`File change detected: ${event.paths[0]}`);

      // Trigger rebuild
      try {
        const process = new Deno.Command("quarto", {
          args: ["render"],
          stdout: "piped",
          stderr: "piped",
        });

        const { code, stdout, stderr } = await process.output();

        if (code === 0) {
          console.log("Site rebuilt successfully");

          // Notify all connected clients to reload
          connections.forEach((ws) => {
            if (ws.readyState === WebSocket.OPEN) {
              ws.send("reload");
            }
          });
        } else {
          console.error("Build failed:", new TextDecoder().decode(stderr));
        }
      } catch (error) {
        console.error("Error during rebuild:", error);
      }
    }
  }
}

// Start file watching
watchFiles().catch(console.error);
