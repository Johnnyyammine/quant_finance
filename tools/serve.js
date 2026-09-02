#!/usr/bin/env node
'use strict';
/**
 * Optional static server: `npm run serve`.
 *
 * The knowledge base does NOT need this — index.html works from a double-click.
 * It exists for the two things file:// cannot do: `fetch()`-based experiments
 * in future interactive modules, and testing with a service worker.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 8123;
const TYPES = {
  '.html': 'text/html; charset=utf-8', '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8', '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.png': 'image/png', '.md': 'text/plain; charset=utf-8',
};

http.createServer((req, res) => {
  let url;
  try {
    // A malformed escape ("/%") makes this throw, and an uncaught throw in the
    // request handler takes the whole dev server down.
    url = decodeURIComponent(req.url.split('?')[0]);
  } catch (e) {
    res.writeHead(400, { 'Content-Type': 'text/plain' }).end('Bad request');
    return;
  }
  let file = path.join(ROOT, url === '/' ? 'index.html' : url);
  // Never serve outside the repository. The separator matters: a bare prefix
  // test also accepts a sibling directory whose name starts with ROOT's.
  if (file !== ROOT && !file.startsWith(ROOT + path.sep)) {
    res.writeHead(403, { 'Content-Type': 'text/plain' }).end('Forbidden');
    return;
  }
  if (fs.existsSync(file) && fs.statSync(file).isDirectory()) file = path.join(file, 'index.html');
  if (!fs.existsSync(file)) { res.writeHead(404, { 'Content-Type': 'text/plain' }).end('Not found: ' + url); return; }
  res.writeHead(200, {
    'Content-Type': TYPES[path.extname(file)] || 'application/octet-stream',
    'Cache-Control': 'no-cache',
  });
  fs.createReadStream(file).pipe(res);
}).listen(PORT, () => {
  console.log(`Quant Knowledge Base -> http://localhost:${PORT}`);
  console.log('(Only needed for tooling; index.html also opens directly from the filesystem.)');
});
