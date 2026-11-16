import test from 'node:test';
import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import ts from 'typescript';
import { apiPath } from '../proxy.mjs';

const source = await readFile(new URL('../src/app/api.ts', import.meta.url), 'utf8');
let version = 0;
async function client() {
  globalThis.window = new EventTarget();
  const { outputText } = ts.transpileModule(source, { compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ES2022 } });
  return import(`data:text/javascript;base64,${Buffer.from(outputText + `\n// ${version++}`).toString('base64')}`);
}
const reply = (body, status = 200) => new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

test('parallel protected requests share one refresh and carry the bearer token', async () => {
  const { api } = await client();
  let refreshes = 0, requests = 0;
  globalThis.fetch = async (url, options) => {
    assert.equal(options.credentials, 'same-origin');
    if (url === '/auth/refresh') { refreshes++; await new Promise(r => setTimeout(r, 5)); return reply({ accessToken: 'test-token' }); }
    assert.equal(options.headers.Authorization, 'Bearer test-token');
    assert.ok(url.startsWith('/api/')); requests++;
    return reply({ ok: true });
  };
  await Promise.all([api('/me'), api('/me/profile'), api('/me/meals')]);
  assert.equal(refreshes, 1); assert.equal(requests, 3);
});
test('expired access token is renewed once and request retried', async () => {
  const { api } = await client();
  let refreshes = 0, calls = 0;
  globalThis.fetch = async url => url === '/auth/refresh' ? reply({ accessToken: `token-${++refreshes}` }) : ++calls === 1 ? reply({ error: 'expired' }, 401) : reply({ id: 'user' });
  assert.deepEqual(await api('/me'), { id: 'user' });
  assert.equal(refreshes, 2); assert.equal(calls, 2);
});
test('missing session rejects without calling a protected endpoint', async () => {
  const { api, ApiError } = await client();
  let calls = 0, ended = 0;
  window.addEventListener('session-ended', () => ended++);
  globalThis.fetch = async url => { assert.equal(url, '/auth/refresh'); calls++; return reply({}, 401); };
  await assert.rejects(api('/me'), e => e instanceof ApiError && e.status === 401);
  assert.equal(calls, 1); assert.equal(ended, 1);
});
test('server validation errors do not retry mutations or clear a session', async () => {
  const { api, json } = await client();
  let writes = 0;
  globalThis.fetch = async (url, options) => {
    if (url === '/auth/refresh') return reply({ accessToken: 'test-token' });
    assert.equal(options.method, 'PUT'); assert.deepEqual(JSON.parse(options.body), { firstName: '' });
    writes++; return reply({ error: 'invalid_input' }, 422);
  };
  await assert.rejects(api('/me/profile', json('PUT', { firstName: '' })), e => e.code === 'invalid_input');
  assert.equal(writes, 1);
});
test('outage is distinct from an unauthenticated session and refresh can recover', async () => {
  const { refreshSession } = await client();
  globalThis.fetch = async () => reply({}, 502);
  await assert.rejects(refreshSession(), e => e.status === 502);
  globalThis.fetch = async () => reply({ accessToken: 'recovered' });
  assert.equal(await refreshSession(), true);
});
test('logout clears session and handles an empty 204 response', async () => {
  const { api, clearSession } = await client();
  let refreshes = 0;
  globalThis.fetch = async url => url === '/auth/refresh' ? (++refreshes === 1 ? reply({ accessToken: 'test-token' }) : reply({}, 401)) : new Response(null, { status: 204 });
  assert.equal(await api('/auth/logout', { method: 'POST' }), undefined);
  clearSession();
  await assert.rejects(api('/me'), e => e.status === 401);
});
test('late refresh cannot restore a cleared session', async () => {
  const { refreshSession, clearSession } = await client();
  let finish;
  globalThis.fetch = () => new Promise(resolve => { finish = resolve; });
  const pending = refreshSession(); clearSession(); finish(reply({ accessToken: 'stale' }));
  assert.equal(await pending, false);
});
test('proxy preserves authentication cookie paths, API queries and static assets', () => {
  assert.equal(apiPath('/auth/callback?code=abc&state=xyz'), '/auth/callback?code=abc&state=xyz');
  assert.equal(apiPath('/auth/refresh'), '/auth/refresh');
  assert.equal(apiPath('/api/me/meals?view=host'), '/me/meals?view=host');
  assert.equal(apiPath('/assets/app.js'), null);
  assert.equal(apiPath('/authenticate'), null);
});
