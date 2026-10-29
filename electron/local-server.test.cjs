const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs/promises');
const os = require('node:os');
const path = require('node:path');
const { createLocalServer } = require('./local-server.cjs');

test('local bundle serves assets and falls back for inbox/settings routes', async () => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'bryteinbox-server-test-'));
  await fs.writeFile(path.join(root, 'index.html'), '<h1>Local app</h1>');
  await fs.writeFile(path.join(root, 'app.js'), 'console.log("local")');
  const port = 23375;
  const server = createLocalServer(root, port);
  await new Promise((resolve, reject) => { server.once('error', reject); server.listen(port, '127.0.0.1', resolve); });
  try {
    assert.equal(await (await fetch(`http://127.0.0.1:${port}/settings`)).text(), '<h1>Local app</h1>');
    assert.equal((await fetch(`http://127.0.0.1:${port}/app.js`)).status, 200);
    assert.equal((await fetch(`http://127.0.0.1:${port}/missing.js`)).status, 404);
    assert.equal((await fetch(`http://127.0.0.1:${port}/`, { headers: { Host: 'untrusted.example' } })).status, 403);
    assert.equal((await fetch(`http://127.0.0.1:${port}/`, { method: 'POST' })).status, 403);
  } finally {
    await new Promise(resolve => server.close(resolve));
    await fs.rm(root, { recursive: true, force: true });
  }
});