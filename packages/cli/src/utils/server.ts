import http from "node:http";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { getPort } from "get-port-please";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const MIME_TYPES: Record<string, string> = {
  ".html": "text/html",
  ".js": "application/javascript",
  ".css": "text/css",
  ".json": "application/json",
  ".svg": "image/svg+xml",
  ".png": "image/png",
  ".ico": "image/x-icon",
};

export async function startServer(
  sessionData: object
): Promise<{ server: http.Server; url: string }> {
  const port = await getPort({ portRange: [3000, 3100] });

  // Path to renderer dist files
  // In development: ../../../renderer/dist (relative to dist/utils/server.js)
  // In published package: ../../renderer (relative to dist/index.js, files are at package/renderer)
  const distPath = path.resolve(__dirname, "../renderer");

  const server = http.createServer((req, res) => {
    const url = req.url || "/";

    // Handle session.json specially - return the dynamic session data
    if (url === "/session.json") {
      res.writeHead(200, { "Content-Type": "application/json" });
      res.end(JSON.stringify(sessionData));
      return;
    }

    // Serve static files from renderer dist
    let filePath = path.join(distPath, url === "/" ? "index.html" : url);

    // Check if file exists
    if (!fs.existsSync(filePath)) {
      // For SPA, return index.html for non-file routes
      filePath = path.join(distPath, "index.html");
    }

    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || "application/octet-stream";

    try {
      const content = fs.readFileSync(filePath);
      res.writeHead(200, { "Content-Type": contentType });
      res.end(content);
    } catch {
      res.writeHead(404);
      res.end("Not Found");
    }
  });

  return new Promise((resolve, reject) => {
    server.on("error", reject);
    server.listen(port, () => {
      resolve({ server, url: `http://localhost:${port}` });
    });
  });
}
