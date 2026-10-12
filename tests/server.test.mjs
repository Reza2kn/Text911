import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';

let child;
let origin;
before(async () => {
  child = spawn(process.execPath, ['scripts/server.mjs'], {
    env: { ...process.env, HOST: '127.0.0.1', PORT: '0' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('Server startup timed out')), 10_000);
    child.once('error', reject);
    child.once('exit', code => reject(new Error(`Server exited before startup: ${code}`)));
    child.stdout.on('data', data => {
      const match = data.toString().match(/listening on 127\.0\.0\.1:(\d+)/);
      if (match) {
        origin = `http://127.0.0.1:${match[1]}`;
        clearTimeout(timer);
        resolve();
      }
    });
  });
});
after(() => child?.kill('SIGTERM'));

test('production server serves the app with Hugging Face iframe support', async () => {
  const response = await fetch(origin);
  assert.equal(response.status, 200);
  assert.match(await response.text(), /Can I text 911 here\?/);
  assert.match(response.headers.get('content-security-policy'), /frame-ancestors 'self' https:\/\/huggingface.co/);
});
test('production static responses support gzip and return the same document', async () => {
  const response = await fetch(origin, { headers: { 'Accept-Encoding': 'gzip' } });
  assert.equal(response.headers.get('content-encoding'), 'gzip');
  assert.match(await response.text(), /id="search-form"/);
});
test('production runtime has a health endpoint and excludes local QA routes', async () => {
  assert.deepEqual(await (await fetch(origin + '/healthz')).json(), { status: 'ok' });
  assert.equal((await fetch(origin + '/qa/axe.js')).status, 404);
  assert.doesNotMatch(await (await fetch(origin + '/?qa=audit')).text(), /\/qa\/run.js/);
});
test('production runtime bounds bodies and preserves API validation', async () => {
  assert.equal((await fetch(origin + '/api/address', { method: 'POST', body: 'x'.repeat(4097) })).status, 413);
  assert.equal((await fetch(origin + '/api/location', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ latitude: 91, longitude: 0 }) })).status, 400);
});
