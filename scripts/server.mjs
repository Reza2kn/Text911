import http from 'node:http';
import { gzipSync } from 'node:zlib';
import worker from '../dist/server/index.js';

const port = Number(process.env.PORT || 7860);
const host = process.env.HOST || '0.0.0.0';
const compressedAssets = new Map();

const server = http.createServer(async (req, res) => {
  try {
    const url = new URL(req.url, `http://localhost:${port}`);
    if (url.pathname === '/healthz' && req.method === 'GET') {
      res.writeHead(200, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
      res.end(JSON.stringify({ status: 'ok' }));
      return;
    }
    const chunks = [];
    let length = 0;
    for await (const chunk of req) {
      length += chunk.length;
      if (length > 4096) {
        res.writeHead(413, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
        res.end(JSON.stringify({ error: 'Request too large.' }));
        return;
      }
      chunks.push(chunk);
    }
    const body = Buffer.concat(chunks);
    const request = new Request(url, {
      method: req.method,
      headers: req.headers,
      ...(body.length ? { body, duplex: 'half' } : {}),
    });
    const response = await worker.fetch(request);
    const headers = Object.fromEntries(response.headers);
    let output = Buffer.from(await response.arrayBuffer());
    const isStatic = !url.pathname.startsWith('/api/');
    if (req.method === 'GET' && isStatic && output.length > 1024 && /\bgzip\b/.test(req.headers['accept-encoding'] || '')) {
      const cacheKey = url.pathname;
      if (!compressedAssets.has(cacheKey)) compressedAssets.set(cacheKey, gzipSync(output));
      output = compressedAssets.get(cacheKey);
      headers['Content-Encoding'] = 'gzip';
      headers.Vary = 'Accept-Encoding';
    }
    res.writeHead(response.status, headers);
    res.end(output);
  } catch {
    res.writeHead(500, { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' });
    res.end(JSON.stringify({ error: 'The service could not complete this request.' }));
  }
});

server.requestTimeout = 25_000;
server.headersTimeout = 10_000;
server.listen(port, host, () => console.log(`Text911 listening on ${host}:${server.address().port}`));
for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => server.close(() => process.exit(0)));
}
