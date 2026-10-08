#!/usr/bin/env node
// Serves the gateway build (.federation/public) for local use and the gateway's checks:
//   PORT=3101 node .federation/server/index.mjs   →   http://localhost:3101/mf/remoteEntry.js
// Plain Node, no dependencies. Every file is readable from any origin (the gateway's page).
// Paths may also start with /prism-paw/, as on GitHub Pages.
import { createReadStream, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = fileURLToPath(new URL('../public/', import.meta.url));
const PORT = Number(process.env.PORT) || 3000;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8', '.mjs': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8', '.svg': 'image/svg+xml',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon',
  '.woff2': 'font/woff2', '.woff': 'font/woff', '.txt': 'text/plain; charset=utf-8',
};
const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, HEAD, OPTIONS', 'access-control-allow-headers': '*' };

createServer((req, res) => {
  if (req.method === 'OPTIONS') { res.writeHead(204, CORS).end(); return; }
  if (req.method !== 'GET' && req.method !== 'HEAD') { res.writeHead(405, CORS).end(); return; }
  let path;
  try { path = decodeURIComponent(new URL(req.url, 'http://x').pathname); } catch { res.writeHead(400, CORS).end(); return; }
  path = path.replace(/^\/prism-paw(?=\/)/, '');
  if (path.endsWith('/')) path += 'index.html';
  const file = join(ROOT, normalize(path));
  let size;
  try {
    if (!file.startsWith(ROOT)) throw new Error('outside');
    const stat = statSync(file);
    if (!stat.isFile()) throw new Error('not a file');
    size = stat.size;
  } catch {
    res.writeHead(404, { ...CORS, 'content-type': 'text/plain; charset=utf-8' }).end('Not found');
    return;
  }
  // hashed chunks never change; the entry and the JSON files point at the current build
  const cache = path.startsWith('/mf/assets/') ? 'public, max-age=31536000, immutable' : 'public, max-age=60';
  res.writeHead(200, { ...CORS, 'content-type': TYPES[extname(file)] ?? 'application/octet-stream', 'content-length': size, 'cache-control': cache });
  if (req.method === 'HEAD') res.end();
  else createReadStream(file).pipe(res);
}).listen(PORT, () => console.log(`Prism Paw gateway remote: http://localhost:${PORT}/mf/remoteEntry.js`));
