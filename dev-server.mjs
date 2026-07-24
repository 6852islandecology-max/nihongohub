// dev-server.mjs — LOCAL DEV ONLY (not deployed). Serves static files + routes /api/*
// to the real Vercel serverless handlers, with .env loaded, so the full game (live quiz
// generation, Supabase cache, rate limit) can be tested locally on one origin.
import http from "node:http";
import { readFile, stat } from "node:fs/promises";
import { extname, join, normalize } from "node:path";
import fs from "node:fs";

// load .env
for (const line of fs.readFileSync(new URL("./.env", import.meta.url), "utf8").split(/\r?\n/)) {
  const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*?)\s*$/);
  if (m && !process.env[m[1]]) process.env[m[1]] = m[2].replace(/^["']|["']$/g, "");
}
// allow the local page to call the local API
process.env.ALLOWED_ORIGIN = "*";

const PORT = process.env.PORT || 3031;
const ROOT = new URL("./", import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, "$1");
const MIME = { ".html":"text/html",".js":"text/javascript",".mjs":"text/javascript",".css":"text/css",
  ".json":"application/json",".png":"image/png",".jpg":"image/jpeg",".jpeg":"image/jpeg",".svg":"image/svg+xml",
  ".ico":"image/x-icon",".webp":"image/webp",".woff2":"font/woff2",".xml":"application/xml",".txt":"text/plain" };

function makeRes(nodeRes) {
  const res = {
    statusCode: 200,
    setHeader: (k, v) => nodeRes.setHeader(k, v),
    getHeader: (k) => nodeRes.getHeader(k),
    status(code) { this.statusCode = code; return this; },
    json(obj) { nodeRes.statusCode = this.statusCode; nodeRes.setHeader("Content-Type", "application/json"); nodeRes.end(JSON.stringify(obj)); },
    send(body) { nodeRes.statusCode = this.statusCode; nodeRes.end(body); },
    end(body) { nodeRes.statusCode = this.statusCode; nodeRes.end(body); },
  };
  return res;
}

const server = http.createServer(async (nodeReq, nodeRes) => {
  const url = new URL(nodeReq.url, `http://localhost:${PORT}`);
  // API routes
  if (url.pathname.startsWith("/api/")) {
    const name = url.pathname.slice(5).replace(/[^a-z0-9-]/gi, "");
    let chunks = [];
    for await (const c of nodeReq) chunks.push(c);
    let body = {};
    if (chunks.length) { try { body = JSON.parse(Buffer.concat(chunks).toString("utf8")); } catch {} }
    const req = { method: nodeReq.method, headers: nodeReq.headers, url: nodeReq.url,
      query: Object.fromEntries(url.searchParams), body, socket: nodeReq.socket };
    const res = makeRes(nodeRes);
    try {
      const mod = await import(`./api/${name}.js?t=${Date.now()}`);
      await mod.default(req, res);
    } catch (e) {
      console.error(`[api/${name}]`, e.message);
      if (!nodeRes.writableEnded) { nodeRes.statusCode = 500; nodeRes.end(JSON.stringify({ error: "dev shim error", detail: e.message })); }
    }
    return;
  }
  // Static files
  let p = decodeURIComponent(url.pathname);
  if (p === "/" || p.endsWith("/")) p += "index.html";
  const filePath = normalize(join(ROOT, p));
  if (!filePath.startsWith(normalize(ROOT))) { nodeRes.statusCode = 403; nodeRes.end("forbidden"); return; }
  try {
    const s = await stat(filePath);
    if (s.isDirectory()) throw new Error("dir");
    const data = await readFile(filePath);
    nodeRes.setHeader("Content-Type", MIME[extname(filePath).toLowerCase()] || "application/octet-stream");
    nodeRes.end(data);
  } catch {
    nodeRes.statusCode = 404; nodeRes.setHeader("Content-Type", "text/html"); nodeRes.end("404 Not Found: " + p);
  }
});
server.listen(PORT, () => console.log(`dev-server (static + /api) on http://localhost:${PORT}`));
