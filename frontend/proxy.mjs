import { request as httpRequest } from 'node:http';
import { request as httpsRequest } from 'node:https';

// Keep /auth unchanged so the HttpOnly cookie paths also work in the browser.
export function apiPath(path) {
  if (path.startsWith('/api/')) return path.slice(4);
  if (path.startsWith('/auth/')) return path;
  return null;
}

export function proxy(req, res) {
  const path = apiPath(req.url || '/');
  if (!path) return false;
  const origin = req.headers.origin;
  if (!['GET', 'HEAD'].includes(req.method) && origin) {
    try {
      if (new URL(origin).host !== req.headers.host) throw new Error('Cross origin');
    } catch { res.writeHead(403).end(); return true; }
  }
  const target = new URL(process.env.API_UPSTREAM || 'http://127.0.0.1:3001');
  const headers = { ...req.headers, host: target.host };
  delete headers.connection;
  delete headers['proxy-authorization'];
  const outgoing = (target.protocol === 'https:' ? httpsRequest : httpRequest)({
    protocol: target.protocol, hostname: target.hostname, port: target.port,
    method: req.method, path, headers, timeout: 15000,
  }, upstream => {
    res.writeHead(upstream.statusCode || 502, { ...upstream.headers, 'cache-control': 'no-store' });
    upstream.pipe(res);
    upstream.on('error', () => res.destroy());
  });
  outgoing.on('timeout', () => outgoing.destroy(new Error('Upstream timeout')));
  outgoing.on('error', () => {
    if (res.headersSent) return res.destroy();
    res.writeHead(502, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' }).end(JSON.stringify({ error: 'api_unavailable' }));
  });
  req.on('aborted', () => outgoing.destroy());
  req.pipe(outgoing);
  return true;
}
