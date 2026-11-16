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
let emptyCatalogue = false;
let paginatedCatalogue = false;
let explorerDate;
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
  if (route === '/public/explorer') return send({ items: [card], total: 1, nextOffset: null });
  if (req.headers.authorization !== 'Bearer fixture-token' || !loggedIn) return send({ error: 'unauthorized' }, 401);
  if (route === '/auth/logout') { loggedIn = false; res.writeHead(204).end(); return; }
  if (route === '/me') return send({ id: 'fixture-user', email: 'test@example.invalid' });
  if (route === '/me/profile') { if (req.method === 'PUT') profile = body; return send({ profile }); }
  if (route === '/me/account-summary') return send({ isHost, email: 'test@example.invalid', hostsMet: 0, guestsMet: 0, mealsHosted: 0 });
  if (route === '/me/host') { isHost = true; return send({ hostId }, 201); }
  if (route === '/me/table') { if (req.method === 'PUT') table = body; return send({ table }); }
  if (route === '/me/contexts') { published = { slotId, title: body.title, startsAt: body.slots[0].startsAt, capacity: body.slots[0].capacity, confirmedPlaces: 0, pendingRequests: 0 }; return send({ id: contextId }, 201); }
  if (route === '/explorer') {
    explorerDate = url.searchParams.get('date');
    if (paginatedCatalogue) {
      const firstPage = url.searchParams.get('offset') === '0';
      return send({
        items: [firstPage ? card : { ...card, contextTitle: 'Repas page suivante' }],
        total: 9,
        nextOffset: firstPage ? 8 : null,
      });
    }
    return send({ items: profile && !emptyCatalogue ? [card] : [], total: profile && !emptyCatalogue ? 1 : 0, nextOffset: null });
  }
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
  browser = spawn(process.env.CHROME_PATH || (process.platform === 'win32' ? 'C:/Program Files/Google/Chrome/Application/chrome.exe' : 'google-chrome'), ['--headless=new',...(process.env.GITHUB_ACTIONS === 'true' ? ['--no-sandbox'] : []),'--no-first-run','--remote-debugging-port=0',`--user-data-dir=${dir}`,origin], { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
  let browserLog = '';
  browser.stderr.on('data', chunk => { browserLog = (browserLog + chunk.toString()).slice(-4000); });
  let launchError; browser.on('error', e => { launchError = e; });
  const portFile = path.join(dir, 'DevToolsActivePort');
  for (let i = 0; !fs.existsSync(portFile) && i < 100; i++) { if (launchError) throw launchError; await wait(100); }
  if (!fs.existsSync(portFile)) throw Error(`Chrome did not start (exit ${browser.exitCode}). Check CHROME_PATH. ${browserLog}`);
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
  await go('explorer');
  await until('document.body.textContent.includes("Repas de test")');
  assert.equal(loggedIn, false);
  assert.equal(await ev('document.querySelector(".pm-header__login").getAttribute("href")'), '/auth/login');
  assert.equal(await ev('document.querySelector(".pm-explorer__banner").getAttribute("href")'), '/auth/login');
  await go('mon-profil/invite');
  await until('document.body.textContent.includes("Connectez-vous pour continuer")');
  await go('explorer');
  await until('!!document.querySelector(".pm-explorer__banner")');
  await ev('document.querySelector(".pm-explorer__banner").click()');
  await until('!!document.querySelector("input[name=firstName]")');
  for (const [name, value] of Object.entries({firstName:'Alex',lastName:'Test',city:'Grenoble'})) {
    await ev(`{ const input = document.querySelector('[name=${name}]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,${JSON.stringify(value)}); input.dispatchEvent(new Event('input',{bubbles:true})); }`);
  }
  assert.equal(await ev('document.querySelector("[aria-controls=account-navigation]").textContent.trim()'), 'Alex');
  const choose = text => ev(`[...document.querySelectorAll('.pm-preference-choices button')].find(b => b.textContent === ${JSON.stringify(text)}).click()`);
  await choose('Français');
  await ev('document.querySelector("form").requestSubmit()');
  await until('document.body.textContent.includes("Préférences culinaires")');
  await ev('document.querySelector("form").requestSubmit()');
  await until('document.body.textContent.includes("Vos préférences d\'expérience")');
  await choose('Rencontrer des locaux'); await choose('Randonnée'); await choose('Calme et détendue');
  failure = true;
  await ev('document.querySelector("form").requestSubmit()');
  await until('!!document.querySelector("[role=alert]")');
  assert.equal(profile, null);
  failure = false;
  await ev('document.querySelector("form").requestSubmit()');
  await until('document.body.textContent.includes("Profil créé !")');
  assert.equal(profile.firstName, 'Alex'); assert.equal(profile.consent, false);
  assert.deepEqual(profile.languages, ['français']); assert.deepEqual(profile.affinities, ['randonnée']);
  await go('mon-profil/invite');
  await until('document.querySelector("[name=firstName]")?.value === "Alex"');
  assert.equal(await ev('document.querySelector("[name=firstName]").matches(":disabled")'), true);
  await ev('window.__reloadMarker = true'); await cmd('Page.reload');
  await until('!window.__reloadMarker && document.querySelector("[name=firstName]")?.value === "Alex"');
  assert.equal(await ev('document.querySelector("[aria-controls=account-navigation]").textContent.trim()'), 'Alex');
  await ev('document.querySelector("[aria-label=\\\"Modifier Informations personnelles\\\"]").click()');
  await until('document.activeElement?.name === "firstName"');
  await ev(`{ const input = document.querySelector('[name=firstName]'); Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(input,'Max'); input.dispatchEvent(new Event('input',{bubbles:true})); }`);
  await ev('document.querySelector("[name=firstName]").form.requestSubmit()');
  await until('document.body.textContent.includes("Modifications enregistrées.")');
  assert.equal(profile.firstName, 'Max');
  for (const width of [1440, 390]) {
    await cmd('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    assert.equal(await ev('document.querySelector(".pm-consent input").getBoundingClientRect().height'), 16);
    assert.equal(await ev('document.querySelector(".pm-consent input").getBoundingClientRect().width'), 16);
    assert.equal(await ev('document.querySelector("[aria-controls=account-navigation]").getBoundingClientRect().width < 165'), true);
    assert.equal(await ev('document.documentElement.scrollWidth - document.documentElement.clientWidth'), 0);
  }
  await cmd('Page.reload'); await until('document.querySelector("[name=firstName]")?.value === "Max"');
  emptyCatalogue = true;
  for (const route of ['', 'explorer']) {
    await go(route);
    const selector = route ? '.pm-discovery-cards' : '.pm-featured__cards';
    const count = route ? 8 : 5;
    await until(`document.querySelectorAll('${selector} .pm-table-card').length === ${count}`);
    assert.equal(await ev('document.body.textContent.includes("Des suggestions classées")'), false);
    await ev(`[...document.querySelectorAll('${selector} img')].forEach(image => { image.loading = "eager"; })`);
    await until(`[...document.querySelectorAll('${selector} img')].every(image => image.complete && image.naturalWidth > 0)`);
    assert.equal(await ev(`[...document.querySelectorAll('${selector} .pm-table-card')].every(card => Math.abs(card.getBoundingClientRect().height / card.getBoundingClientRect().width - 427 / 296) < 0.01)`), true);
    if (!route) {
      await cmd('Emulation.setDeviceMetricsOverride', { width: 1440, height: 900, deviceScaleFactor: 1, mobile: false });
      assert.equal(await ev(`(() => {
        const cards = [...document.querySelectorAll('.pm-featured__cards .pm-table-card')];
        const boxes = cards.map(card => card.getBoundingClientRect());
        return cards[2].textContent.includes('Amina') && boxes[2].top < boxes[1].top && boxes[2].top < boxes[3].top && boxes[0].right > boxes[1].left && boxes[1].right > boxes[2].left;
      })()`), true);
    }
  }
  for (const route of ['', 'explorer', 'mon-profil/invite']) {
    await go(route);
    await until('!!document.querySelector(".pm-header")');
    for (const width of [1440, 390]) {
      await cmd('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
      if (width === 1440) {
        assert.equal(await ev('Math.abs((document.querySelector("#home-nav").getBoundingClientRect().left + document.querySelector("#home-nav").getBoundingClientRect().right) / 2 - document.documentElement.clientWidth / 2) < 1'), true);
      }
      assert.equal(await ev('document.documentElement.scrollWidth - document.documentElement.clientWidth'), 0);
    }
  }
  await go('explorer');
  await until('document.querySelectorAll(".pm-discovery-cards .pm-table-card").length === 8');
  assert.equal(await ev('!!document.querySelector(".pm-explorer__search")'), true);
  assert.equal(await ev('getComputedStyle(document.querySelector(\'[aria-label="Catégories suivantes"] img\')).transform'), 'matrix(-1, 0, 0, -1, 0, 0)');
  assert.equal(await ev('document.querySelector(".pm-explorer__more").open'), false);
  await ev('document.querySelector(".pm-explorer__more summary").click()');
  assert.equal(await ev('document.querySelector(".pm-explorer__more").open'), true);
  assert.equal(await ev('document.querySelector(".pm-explorer__date-placeholder").textContent.trim()'), 'jj/mm/aaaa');
  for (const width of [1440, 390]) {
    await cmd('Emulation.setDeviceMetricsOverride', { width, height: 900, deviceScaleFactor: 1, mobile: false });
    assert.equal(await ev('(() => { const row = document.querySelector(".pm-explorer__cuisines"); return row.scrollWidth > row.clientWidth; })()'), width === 390);
  }
  await ev('document.querySelector(\'[aria-label="Catégories suivantes"]\').click()');
  await until('document.querySelector(".pm-explorer__cuisines").scrollLeft > 100');
  await ev('document.querySelector(\'[aria-label="Catégories précédentes"]\').click()');
  await until('document.querySelector(".pm-explorer__cuisines").scrollLeft <= 1');
  await ev(`{
    const input = document.querySelector('[name="date"]');
    Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(input, '2099-01-02');
    input.dispatchEvent(new Event('input', { bubbles: true }));
    input.form.requestSubmit();
  }`);
  await until('document.body.textContent.includes("Aucun repas ne correspond")');
  assert.equal(explorerDate, '2099-01-02');
  assert.equal(await ev('!!document.querySelector(".pm-explorer__date-placeholder")'), false);
  await ev('[...document.querySelectorAll(".pm-explorer__categories img")].forEach(i=>i.loading="eager")');
  await until('[...document.querySelectorAll(".pm-explorer__categories img")].every(i=>i.complete && i.naturalWidth>0)');
  await ev('document.querySelector(".pm-cuisine").click()');
  await until('document.body.textContent.includes("Aucun repas ne correspond")');
  await ev('document.querySelector(".pm-explorer__filter-toggle").click()');
  await ev('document.querySelector("[type=reset]").click()');
  await until('document.querySelectorAll(".pm-discovery-cards .pm-table-card").length === 8');
  assert.equal(await ev('document.querySelector("[name=date]").value'), '');
  emptyCatalogue = false;
  await go('mon-profil/hote'); await until('document.querySelectorAll("form").length === 4');
  await ev('document.querySelectorAll("form")[3].requestSubmit()');
  await until('!!document.querySelector("[name=tableLanguages]")');
  await ev('document.querySelector("[name=tableLanguages]").value="français"; document.querySelector("[name=tableLanguages]").form.requestSubmit()');
  await until('document.body.textContent.includes("Enregistré.")');
  assert.deepEqual(table.languages, ['français']);
  await go('mes-repas/hote'); await until('!!document.querySelector("[name=title]")');
  await ev(`document.querySelector('details').open=true; for (const [name,value] of Object.entries({title:'Repas publié',kind:'dîner',ambience:'calme',languages:'français',startsAt:'2099-01-01T19:00'})) document.querySelector('[name='+name+']').value=value; document.querySelector('[name=title]').form.requestSubmit();`);
  await until('document.body.textContent.includes("Repas publié")');
  assert.equal(published.title, 'Repas publié');
  await go('explorer'); await until('document.body.textContent.includes("Repas de test")');
  paginatedCatalogue = true;
  await ev('location.reload()');
  await until('!!document.querySelector(".pm-explorer__pagination .pm-button")');
  await ev('document.querySelector(".pm-explorer__pagination .pm-button").click()');
  await until('document.body.textContent.includes("Repas page suivante")');
  assert.equal(await ev('!!document.querySelector(".pm-explorer__pagination .pm-button")'), false);
  await ev('document.querySelector(".pm-explorer__pagination button").click()');
  await until('document.body.textContent.includes("Repas de test")');
  paginatedCatalogue = false;
  await ev(`document.querySelector('a[href^="#/experience/"]').click()`);
  await until('!!document.querySelector("[name=partySize]")');
  await ev('document.querySelector("form").requestSubmit()');
  await until('document.body.textContent.includes("Demande envoyée")');
  assert.equal(booking.partySize, 1);
  await go('mes-repas/invite'); await until('!!document.querySelector("[name=share]")');
  assert.equal(await ev('document.querySelector("[name=share]").checked'), false);
  await ev('const select=document.querySelector("[name=status]"); select.value="cancelled"; select.form.requestSubmit()');
  await until('!document.querySelector("[name=status]") && document.body.textContent.includes("Annulée")');
  assert.equal(booking.status, 'cancelled');
  for (const width of [1440,390]) { await cmd('Emulation.setDeviceMetricsOverride', { width,height:900,deviceScaleFactor:1,mobile:false }); assert.equal(await ev('document.documentElement.scrollWidth - document.documentElement.clientWidth'), 0); }
  failure = true; await go('explorer'); await until('!!document.querySelector("[role=alert]")');
  failure = false; await ev('[...document.querySelectorAll("button")].find(b=>b.textContent==="Réessayer").click()'); await until('document.body.textContent.includes("Repas de test")');
  assert.equal(await ev('document.querySelector("#account-navigation").hidden'), true);
  await ev('document.querySelector("[aria-controls=account-navigation]").click()');
  assert.equal(await ev('document.querySelector("#account-navigation").hidden'), false);
  await ev('document.dispatchEvent(new KeyboardEvent("keydown", {key:"Escape",bubbles:true}))');
  assert.equal(await ev('document.querySelector("#account-navigation").hidden'), true);
  await ev('document.querySelector("[aria-controls=account-navigation]").click()');
  await ev('[...document.querySelectorAll("button")].find(b=>b.textContent==="Se déconnecter").click()');
  await until(`!!document.querySelector('a[href="/auth/login"]')`);
  await go('mes-repas/invite'); await until('document.body.textContent.includes("Connectez-vous pour continuer")');
  assert.equal(loggedIn, false);
  console.log('PASS: protected route, cookie refresh, profile persistence, explorer, booking, private consent, cancellation, responsive layout, error recovery, logout (API fixture).');
})().catch(error => { console.error(error); process.exitCode = 1; }).finally(() => { ws?.close(); browser?.kill(); web?.kill(); backend.closeAllConnections(); backend.close(); });

