// Browser wiring test with an in-memory API fixture. Does not prove PostgreSQL or Auth0 connectivity.
const { createServer } = require('node:http');
const { spawn } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const assert = require('node:assert/strict');
const wait = ms => new Promise(resolve => setTimeout(resolve, ms));
const origin = 'http://127.0.0.1:4197';
let profile = null, loggedIn = false, booking = null, shared = false, failure = false;
let isHost = false, table = {}, published = null;
let browser, web, ws;
const hostId = '11111111-1111-4111-8111-111111111111';
const contextId = '22222222-2222-4222-8222-222222222222';
const slotId = '33333333-3333-4333-8333-333333333333';
const bookingId = '44444444-4444-4444-8444-444444444444';
const startsAt = new Date(Date.now() + 86400000).toISOString();
const card = { hostId, contextId, contextTitle: 'Repas de test', firstName: 'Camille', city: 'Grenoble', kind: 'dîner', ambience: 'calme', contributionCents: 0, slots: [{ id: slotId, startsAt, remainingPlaces: 4 }] };
const backend = createServer(async (req, res) => {
  const url = new URL(req.url, origin), route = url.pathname;
  const send = (data, status = 200) => { res.writeHead(status, { 'Content-Type': 'application/json' }); res.end(JSON.stringify(data)); };
  let raw = ''; for await (const chunk of req) raw += chunk;
  const body = raw ? JSON.parse(raw) : {};
  if (route === '/auth/login') { loggedIn = true; res.writeHead(303, { Location: origin + '/#/mon-profil/invite', 'Set-Cookie': 'refresh=fixture; HttpOnly; SameSite=Strict; Path=/auth/refresh' }).end(); return; }
  if (route === '/auth/refresh') return send(loggedIn && req.headers.cookie?.includes('refresh=fixture') ? { accessToken: 'fixture-token' } : { error: 'unauthorized' }, loggedIn && req.headers.cookie?.includes('refresh=fixture') ? 200 : 401);
  if (failure) return send({ error: 'api_unavailable' }, 503);
  if (req.headers.authorization !== 'Bearer fixture-token' || !loggedIn) return send({ error: 'unauthorized' }, 401);
  if (route === '/auth/logout') { loggedIn = false; res.writeHead(204).end(); return; }
  if (route === '/me') return send({ id: 'fixture-user', email: 'test@example.invalid' });
  if (route === '/me/profile') { if (req.method === 'PUT') profile = body; return send({ profile }); }
  if (route === '/me/account-summary') return send({ isHost, email: 'test@example.invalid', hostsMet: 0, guestsMet: 0, mealsHosted: 0 });
  if (route === '/me/host') { isHost = true; return send({ hostId }, 201); }
  if (route === '/me/table') { if (req.method === 'PUT') table = body; return send({ table }); }
  if (route === '/me/contexts') { published = { slotId, title: body.title, startsAt: body.slots[0].startsAt, capacity: body.slots[0].capacity, confirmedPlaces: 0, pendingRequests: 0 }; return send({ id: contextId }, 201); }
  if (route === '/explorer') return send({ items: profile ? [card] : [], total: profile ? 1 : 0, nextOffset: null });
  if (route === `/profiles/${hostId}/contexts/${contextId}`) return send(card);
  if (route === '/bookings' && req.method === 'POST') { assert.equal(body.slotId, slotId); booking = { id: bookingId, slotId, status: 'pending', partySize: body.partySize, title: card.contextTitle, contextTitle: card.contextTitle, counterpartName: 'Camille', startsAt }; return send(booking, 201); }
  if (route === `/bookings/${bookingId}/status`) { booking.status = body.status; return send(booking); }
  if (route === `/bookings/${bookingId}/allergy-consent`) { if (req.method === 'PUT') shared = body.consent; return send({ consent: shared ? { allergies: [] } : null }); }
  if (route === '/me/meals') return send({ isHost, sections: { upcoming: url.searchParams.get('view') === 'host' ? (published ? [published] : []) : booking && booking.status !== 'cancelled' ? [booking] : [], past: [], cancelled: booking?.status === 'cancelled' ? [booking] : [] }, limit: 50, offset: 0 });
  if (route === '/me/bookings') return send({ items: booking ? [booking] : [] });
  send({ error: 'not_found' }, 404);
});

(async () => {
  await new Promise((resolve, reject) => { backend.once('error', reject); backend.listen(4198, '127.0.0.1', resolve); });
  web = spawn(process.execPath, ['server.mjs'], { cwd: path.resolve(__dirname, '..'), env: { ...process.env, PORT: '4197', API_UPSTREAM: 'http://127.0.0.1:4198' }, windowsHide: true, stdio: 'ignore' });
  let ready = false, lastError;
  for (let i = 0; i < 40; i++) {
    try { if ((await fetch(origin)).ok) { ready = true; break; } } catch (e) { lastError = e; }
    if (web.exitCode !== null) throw Error('Frontend server exited. Check port 4197.');
    await wait(100);
  }
  if (!ready) throw Error(`Local server unreachable: ${lastError?.cause?.code || lastError?.message}`);
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'pm-connected-'));
  browser = spawn(process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : 'google-chrome'), ['--headless=new','--no-first-run','--remote-debugging-port=0',`--user-data-dir=${dir}`,origin], { windowsHide: true, stdio: 'ignore' });
  let launchError; browser.on('error', e => { launchError = e; });
  const portFile = path.join(dir, 'DevToolsActivePort');
  for (let i = 0; !fs.existsSync(portFile) && i < 100; i++) { if (launchError) throw launchError; await wait(100); }
  if (!fs.existsSync(portFile)) throw Error('Chrome did not start. Set CHROME_PATH.');
  const targets = await (await fetch(`http://127.0.0.1:${parseInt(fs.readFileSync(portFile, 'utf8'))}/json/list`)).json();
  ws = new WebSocket(targets.find(t => t.type === 'page').webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { ws.onopen = resolve; ws.onerror = reject; });
  let seq = 0; const pending = new Map();
  ws.onmessage = event => { const message = JSON.parse(event.data); pending.get(message.id)?.(message); pending.delete(message.id); };
  const cmd = (method, params = {}) => new Promise((resolve, reject) => {
    const id = ++seq, timeout = setTimeout(() => { pending.delete(id); reject(Error(`Timeout: ${method}`)); }, 10000);
    pending.set(id, message => { clearTimeout(timeout); message.error ? reject(Error(message.error.message)) : resolve(message.result); });
    ws.send(JSON.stringify({ id, method, params }));
  });
  const ev = async expression => { const result = await cmd('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true }); if (result.exceptionDetails) throw Error(result.exceptionDetails.exception?.description); return result.result.value; };
  const until = async expression => { for (let i = 0; i < 100; i++) { if (await ev(expression)) return; await wait(50); } throw Error(`Condition failed: ${expression}`); };
  const go = hash => cmd('Page.navigate', { url: origin + '/#/' + hash });
  await go('mon-profil/invite');
  await until('document.body.textContent.includes("Connectez-vous pour continuer")');
  await ev('document.querySelector("a[href=\"/auth/login\"]").click()');
  await until('!!document.querySelector("input[name=firstName]")');
  await ev(`for (const [name,value] of Object.entries({firstName:'Alex',lastName:'Test',city:'Grenoble',languages:'français',affinities:'cuisine, musique, voyages',publicInterests:'cuisine',ambiences:'calme'})) document.querySelector('[name='+name+']').value=value; document.querySelector('form').requestSubmit();`);
  await until('document.body.textContent.includes("Profil enregistré sur le serveur")');
  assert.equal(profile.firstName, 'Alex'); assert.equal(profile.consent, false);
  await ev('window.__reloadMarker = true'); await cmd('Page.reload'); await until('!window.__reloadMarker && document.querySelector("[name=firstName]")?.value === "Alex"');
  await go('mon-profil/hote'); await until('document.querySelectorAll("form").length === 2');
  await ev('document.querySelectorAll("form")[1].requestSubmit()');
  await until('!!document.querySelector("[name=tableLanguages]")');
  await ev('document.querySelector("[name=tableLanguages]").value="français"; document.querySelector("[name=tableLanguages]").form.requestSubmit()');
  await until('document.body.textContent.includes("Enregistré.")');
  assert.deepEqual(table.languages, ['français']);
  await go('mes-repas/hote'); await until('!!document.querySelector("[name=title]")');
  await ev(`document.querySelector('details').open=true; for (const [name,value] of Object.entries({title:'Repas publié',kind:'dîner',ambience:'calme',languages:'français',startsAt:'2099-01-01T19:00'})) document.querySelector('[name='+name+']').value=value; document.querySelector('[name=title]').form.requestSubmit();`);
  await until('document.body.textContent.includes("Repas publié")');
  assert.equal(published.title, 'Repas publié');
  await go('explorer'); await until('document.body.textContent.includes("Repas de test")');
  await ev('document.querySelector("a[href^=\"#/experience/\"]").click()');
  await until('!!document.querySelector("[name=partySize]")');
  await ev('document.querySelector("form").requestSubmit()');
  await until('document.body.textContent.includes("Demande envoyée")');
  assert.equal(booking.partySize, 1);
  await go('mes-repas/invite'); await until('!!document.querySelector("[name=share]")');
  assert.equal(await ev('document.querySelector("[name=share]").checked'), false);
  await ev('const select=document.querySelector("[name=status]"); select.value="cancelled"; select.form.requestSubmit()');
  await until('!document.querySelector("[name=status]") && document.body.textContent.includes("Annulée")');
  assert.equal(booking.status, 'cancelled');
  for (const width of [1440,390]) { await cmd('Emulation.setDeviceMetricsOverride', { width,height:900,deviceScaleFactor:1,mobile:false }); assert.equal(await ev('document.documentElement.scrollWidth'), width); }
  failure = true; await go('explorer'); await until('!!document.querySelector("[role=alert]")');
  failure = false; await ev('[...document.querySelectorAll("button")].find(b=>b.textContent==="Réessayer").click()'); await until('document.body.textContent.includes("Repas de test")');
  await ev('[...document.querySelectorAll("button")].find(b=>b.textContent==="Se déconnecter").click()');
  await until('!!document.querySelector("a[href=\"/auth/login\"]")');
  await go('mes-repas/invite'); await until('document.body.textContent.includes("Connectez-vous pour continuer")');
  assert.equal(loggedIn, false);
  console.log('PASS: protected route, cookie refresh, profile persistence, explorer, booking, private consent, cancellation, responsive layout, error recovery, logout (API fixture).');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { ws?.close(); browser?.kill(); web?.kill(); backend.closeAllConnections(); backend.close(); });
