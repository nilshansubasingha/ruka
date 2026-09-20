// Local emulation of the Netlify site: serves dist/ with the headers from dist/_headers and routes /api/ai to the function.
// Usage: MISTRAL_API_KEY=... node scripts/dev.mjs   (set MOCK=1 to use the offline fake Mistral)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
export async function startDev(port = 8888) {
  let mock = null;
  if (process.env.MOCK) { const { startMock } = await import('./mock-mistral.mjs'); mock = await startMock(); process.env.MISTRAL_API_BASE = mock.url; process.env.MISTRAL_API_KEY ||= 'test-key'; }
  const fn = (await import('../netlify/functions/ruka-ai.mjs')).default;
  const headers = {}; try { fs.readFileSync(path.join(root, 'dist/_headers'), 'utf8').split('\n').slice(1).forEach((l) => { const m = l.match(/^\s+([\w-]+):\s*(.*)$/); if (m) headers[m[1]] = m[2]; }); } catch { /* run build first */ }
  const server = http.createServer(async (req, res) => {
    if (req.url === '/api/ai') {
      const chunks = []; for await (const c of req) chunks.push(c);
      const request = new Request('http://' + req.headers.host + req.url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) });
      const r = await fn(request, { ip: req.socket.remoteAddress }); res.writeHead(r.status, Object.fromEntries(r.headers)); return res.end(await r.text());
    }
    const file = path.join(root, 'dist', req.url === '/' ? 'index.html' : req.url.split('?')[0]);
    if (!file.startsWith(path.join(root, 'dist')) || !fs.existsSync(file)) { res.writeHead(404); return res.end('not found'); }
    res.writeHead(200, { ...headers, 'content-type': file.endsWith('.html') ? 'text/html; charset=utf-8' : 'text/plain' }); res.end(fs.readFileSync(file));
  });
  await new Promise((r) => server.listen(port, '127.0.0.1', r));
  return { server, mock, url: `http://127.0.0.1:${server.address().port}` };
}
if (process.argv[1] === fileURLToPath(import.meta.url)) startDev(Number(process.env.PORT) || 8888).then((d) => console.log('RUKA dev server:', d.url, d.mock ? '(mock Mistral)' : ''));
