// Servidor local para testar o site + API sem o Netlify.
// Uso: node scripts/servidor-local.mjs [porta]   (dados ficam em .dados-locais/)
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { BlobsServer } from '@netlify/blobs/server';

const raiz = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const porta = Number(process.argv[2] || 8888);
const blobs = new BlobsServer({ directory: path.join(raiz, '.dados-locais'), token: 'local' });
const { port } = await blobs.start();
process.env.JCR_BLOBS_LOCAL = `http://localhost:${port}|local`;
const { default: api } = await import('../netlify/functions/api.mjs');

const tipos = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.css': 'text/css', '.svg': 'image/svg+xml', '.png': 'image/png', '.json': 'application/json', '.txt': 'text/plain', '.xml': 'application/xml', '.ico': 'image/x-icon', '.webp': 'image/webp' };
const spa = [['/gestao', '/gestao/index.html'], ['/testes', '/testes/index.html']];

http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${porta}`);
  if (url.pathname.startsWith('/api/')) {
    const chunks = []; for await (const c of req) chunks.push(c);
    const r = await api(new Request(url, { method: req.method, headers: req.headers, body: ['GET', 'HEAD'].includes(req.method) ? undefined : Buffer.concat(chunks) }), { ip: req.socket.remoteAddress });
    const h = Object.fromEntries(r.headers); res.writeHead(r.status, h); res.end(Buffer.from(await r.arrayBuffer())); return;
  }
  if (url.pathname === '/avaliacoes') { res.writeHead(302, { Location: '/gestao/#avaliacoes' }); return res.end(); }
  let p = decodeURIComponent(url.pathname);
  let arq = path.join(raiz, 'site', p);
  if (fs.existsSync(arq) && fs.statSync(arq).isDirectory()) {
    if (!p.endsWith('/')) { res.writeHead(301, { Location: p + '/' + url.search }); return res.end(); }
    arq = path.join(arq, 'index.html');
  }
  if (!fs.existsSync(arq)) {
    const s = spa.find(([pre]) => p.startsWith(pre + '/'));
    arq = s ? path.join(raiz, 'site', s[1]) : path.join(raiz, 'site', '404.html');
    if (!s) res.statusCode = 404;
  }
  res.setHeader('Content-Type', tipos[path.extname(arq)] || 'application/octet-stream');
  fs.createReadStream(arq).pipe(res);
}).listen(porta, () => console.log(`Site local em http://localhost:${porta}`));
