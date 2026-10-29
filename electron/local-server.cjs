const http = require('node:http');
const fs = require('node:fs/promises');
const path = require('node:path');

const TYPES = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json', '.webmanifest': 'application/manifest+json', '.woff2': 'font/woff2' };

function createLocalServer(root, port = 23374) {
  return http.createServer(async (req, res) => {
    if (req.headers.host !== `127.0.0.1:${port}` || !['GET', 'HEAD'].includes(req.method)) {
      res.writeHead(403).end(); return;
    }
    try {
      const pathname = decodeURIComponent(new URL(req.url, `http://127.0.0.1:${port}`).pathname);
      const candidate = path.resolve(root, `.${pathname}`);
      if (candidate !== root && !candidate.startsWith(root + path.sep)) {
        res.writeHead(403).end(); return;
      }
      let file = candidate;
      const stat = await fs.stat(file).catch(() => null);
      if (!stat?.isFile()) {
        if (path.extname(pathname)) { res.writeHead(404).end(); return; }
        file = path.join(root, 'index.html');
      }
      const body = await fs.readFile(file);
      res.writeHead(200, { 'Content-Type': TYPES[path.extname(file)] ?? 'application/octet-stream', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : body);
    } catch { res.writeHead(500).end('Unable to load BryteInbox'); }
  });
}
module.exports = { createLocalServer };