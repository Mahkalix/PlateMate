import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = resolve(fileURLToPath(new URL('./public/', import.meta.url)));
const types = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.woff2': 'font/woff2',
};

createServer(async (req, res) => {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    res.writeHead(405, { Allow: 'GET, HEAD' }).end();
    return;
  }
  let filename;
  try {
    const pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
    filename = resolve(root, `.${pathname}`);
    if (filename !== root && !filename.startsWith(root + sep)) throw new Error('Invalid path');
    const info = await stat(filename);
    if (info.isDirectory()) filename = resolve(filename, 'index.html');
    const file = await stat(filename);
    if (!file.isFile()) throw new Error('Invalid file');
    res.writeHead(200, {
      'Content-Type': types[extname(filename).toLowerCase()] || 'application/octet-stream',
      'Content-Length': file.size,
      'X-Content-Type-Options': 'nosniff',
    });
    if (req.method === 'HEAD') res.end();
    else createReadStream(filename).pipe(res);
  } catch {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' }).end('Page introuvable');
  }
}).listen(Number(process.env.PORT || 8080), '0.0.0.0', () => {
  console.log(`PlateMate frontend :${process.env.PORT || 8080}`);
});
