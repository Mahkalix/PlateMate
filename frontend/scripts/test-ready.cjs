const fs = require("fs"),
  path = require("path"),
  os = require("os"),
  { spawn } = require("child_process");
const wait = (ms) => new Promise((r) => setTimeout(r, ms));
const dir = fs.mkdtempSync(path.join(os.tmpdir(), "pm-local-qa-"));
const port = 4197,
  url = "http://127.0.0.1:" + port;
const vite = spawn(
  process.execPath,
  [
    "node_modules/vite/bin/vite.js",
    "preview",
    "--host",
    "127.0.0.1",
    "--port",
    String(port),
    "--strictPort",
  ],
  { cwd: path.resolve(__dirname, ".."), windowsHide: true, stdio: "ignore" },
);
let c, ws;
let startupError;
vite.on("error", (error) => {
  startupError = error;
});
(async () => {
  let ready = false;
  for (let i = 0; i < 80; i++) {
    if (startupError) throw startupError;
    if (vite.exitCode !== null)
      throw Error("Vite preview did not start (check port 4197).");
    try {
      if ((await fetch(url)).ok) {
        ready = true;
        break;
      }
    } catch {}
    await wait(100);
  }
  if (!ready) throw Error("Local preview did not become ready.");
  await wait(150);
  if (vite.exitCode !== null)
    throw Error("Port 4197 is already used by another server.");
  c = spawn(
    process.env.CHROME_PATH ||
      (process.platform === "win32"
        ? "C:/Program Files/Google/Chrome/Application/chrome.exe"
        : "google-chrome"),
    [
      "--headless=new",
      "--hide-scrollbars",
      "--no-first-run",
      "--remote-debugging-port=0",
      "--user-data-dir=" + dir,
      url,
    ],
    { stdio: ["ignore", "ignore", "pipe"], windowsHide: true },
  );
  let chromeError = "";
  c.stderr.on("data", (chunk) => {
    chromeError = (chromeError + chunk.toString()).slice(-8000);
  });
  c.on("error", (error) => {
    startupError = error;
  });
  const file = path.join(dir, "DevToolsActivePort");
  for (let i = 0; i < 100 && !fs.existsSync(file); i++) {
    if (startupError) throw startupError;
    if (c.exitCode !== null || c.signalCode !== null)
      throw Error(`Chrome exited (${c.exitCode ?? c.signalCode}): ${chromeError}`);
    await wait(100);
  }
  if (!fs.existsSync(file))
    throw Error(`Chrome did not start. Set CHROME_PATH to its executable. ${chromeError}`);
  const targets = await (
    await fetch(
      "http://127.0.0.1:" +
        parseInt(fs.readFileSync(file, "utf8")) +
        "/json/list",
    )
  ).json();
  ws = new WebSocket(
    targets.find((x) => x.type === "page").webSocketDebuggerUrl,
  );
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pending = new Map();
  ws.onmessage = (e) => {
    let m = JSON.parse(e.data);
    if (pending.has(m.id)) {
      pending.get(m.id)(m);
      pending.delete(m.id);
    }
  };
  const cmd = (method, params = {}) =>
    new Promise((res, rej) => {
      pending.set(++id, (m) =>
        m.error ? rej(Error(m.error.message)) : res(m.result),
      );
      ws.send(JSON.stringify({ id, method, params }));
    });
  const ev = async (expression) => {
    let v = await cmd("Runtime.evaluate", {
      expression,
      awaitPromise: true,
      returnByValue: true,
    });
    if (v.exceptionDetails)
      throw Error(
        v.exceptionDetails.exception?.description || v.exceptionDetails.text,
      );
    return v.result.value;
  };
  const assert = (ok, msg) => {
    if (!ok) throw Error(msg);
    checks.push(msg);
  };
  const checks = [],
    measurements = [];
  for (const width of [1440, 390]) {
    await cmd("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    for (const host of [false, true]) {
      await cmd("Page.navigate", {
        url: url + "/#/" + (host ? "candidature" : "profil"),
      });
      for (
        let i = 0;
        i < 100 && !(await ev('!!document.querySelector(".pm-wizard")'));
        i++
      )
        await wait(50);
      await ev("document.fonts.ready");
      await ev(
        "Promise.all([...document.images].map(image => image.decode()))",
      );
      const label = `${width}/${host ? "host" : "profile"}`;
      const measureStep = async (step) => {
        measurements.push({
          label: `${label}/step${step}`,
          rect: await ev(
            "(()=>{const r=document.querySelector('.pm-form-card').getBoundingClientRect();return [r.width,r.height]})()",
          ),
        });
        assert(
          await ev(`document.documentElement.scrollWidth === ${width}`),
          `${label}/step${step} no overflow`,
        );
        if (width === 1440) {
          const expectedHeight = host
            ? [654, 554][step - 1]
            : [562, 628][step - 1];
          assert(
            await ev(
              `Math.abs(document.querySelector('.pm-form-card').getBoundingClientRect().height - ${expectedHeight}) <= 1`,
            ),
            `${label}/step${step} Figma height`,
          );
        }
      };
      await measureStep(1);
      assert(
        await ev(
          `getComputedStyle(document.querySelector('[name=firstName]'), '::placeholder').color === 'rgb(109, 113, 127)'`,
        ),
        label + " Figma placeholder color",
      );
      assert(
        await ev(
          `getComputedStyle(document.querySelector('.pm-field label')).fontWeight === '600'`,
        ),
        label + " Figma field label weight",
      );
      assert(
        await ev(
          'getComputedStyle(document.documentElement).fontSize==="10px"',
        ),
        label + " rem base",
      );
      await ev('document.querySelector("form.pm-form-card").requestSubmit()');
      assert(
        await ev('!!document.querySelector("input[name=firstName]:invalid")'),
        label + " rejects missing name",
      );
      await ev(
        `document.querySelector('[name=firstName]').value='Test';document.querySelector('[name=lastName]').value='Preview';${host ? "document.querySelector('[name=city]').value='Grenoble';document.querySelector('[name=bio]').value='Une présentation fictive de cuisine et de rencontres. '.repeat(3);" : ""}document.querySelector('form.pm-form-card').requestSubmit()`,
      );
      assert(
        await ev('!!document.querySelector("[role=alert]")'),
        label + " requires language",
      );
      await ev(
        'document.querySelector("[name=languages]").click();document.querySelector("form.pm-form-card").requestSubmit()',
      );
      await wait(60);
      assert(
        await ev(
          'document.querySelector("h2").textContent.includes("' +
            (host ? "Informations" : "Préférences") +
            '")',
        ),
        label + " step2",
      );
      await measureStep(2);
      await ev(
        'document.querySelector(".pm-form-actions button[type=button]").click()',
      );
      await wait(60);
      assert(
        await ev(
          'document.querySelector("[name=firstName]").value==="Test"&&document.querySelector("[name=languages]").checked',
        ),
        label + " back preserves data",
      );
      await ev('document.querySelector("form.pm-form-card").requestSubmit()');
      await wait(60);
      await ev(
        host
          ? "document.querySelector('[name=capacity]').value='4';document.querySelector('[name=price]').value='25';document.querySelector('[name=days]').click();document.querySelector('form.pm-form-card').requestSubmit()"
          : "document.querySelector('[name=diet]').click();document.querySelector('[name=cuisines]').click();document.querySelector('form.pm-form-card').requestSubmit()",
      );
      await wait(60);
      assert(
        await ev(
          'document.querySelector("h2").textContent.includes("' +
            (host ? "Vérification" : "expérience") +
            '")',
        ),
        label + " step3",
      );
      measurements.push({
        label,
        geometry: await ev(
          `({root:document.documentElement.scrollWidth,form:(()=>{const r=document.querySelector('.pm-form-card').getBoundingClientRect();return [r.x,r.y,r.width,r.height]})(),padding:getComputedStyle(document.querySelector('.pm-form-card')).padding})`,
        ),
      });
      assert(
        await ev(`document.documentElement.scrollWidth===${width}`),
        label + " step3 no overflow",
      );
      if (width === 1440)
        assert(
          await ev(
            `Math.abs(document.querySelector('.pm-form-card').getBoundingClientRect().height - ${host ? 872 : 484}) <= 1`,
          ),
          label + " Figma step3 height",
        );
      if (host) {
        if (width === 1440) {
          assert(
            await ev(
              "document.querySelector('.pm-form-card').getBoundingClientRect().width === 736",
            ),
            "Figma host verification width",
          );
          assert(
            await ev(
              "Math.abs(document.querySelector('.pm-fees').getBoundingClientRect().height - 212.5) <= 1",
            ),
            "Figma fees summary height",
          );
        }
        if (width === 1440)
          assert(
            await ev(
              "document.querySelector('.pm-upload').getBoundingClientRect().height === 152",
            ),
            "Figma upload area height",
          );
        await ev("document.querySelector('[name=identity]').focus()");
        assert(
          await ev(
            "getComputedStyle(document.querySelector('.pm-upload')).outlineStyle === 'solid'",
          ),
          label + " upload keyboard focus visible",
        );
        await ev(
          "(()=>{const selection = new DataTransfer();selection.items.add(new File(['fiction'], 'preview-fictive.pdf', {type:'application/pdf'}));const input = document.querySelector('[name=identity]');input.files=selection.files;input.dispatchEvent(new Event('change',{bubbles:true}));})()",
        );
        assert(
          await ev(
            "document.querySelector('.pm-upload strong').textContent === 'preview-fictive.pdf'",
          ),
          label + " selected document name visible",
        );
        await ev('document.querySelector("form.pm-form-card").requestSubmit()');
        assert(
          await ev(
            '!!document.querySelector("[name=terms]:invalid") && !document.querySelector(".pm-confirmation")',
          ),
          label + " consents required",
        );
      }
      await ev(
        host
          ? "document.querySelector('[name=terms]').click();document.querySelector('[name=charter]').click();document.querySelector('form.pm-form-card').requestSubmit()"
          : "document.querySelector('[name=experiences]').click();document.querySelector('[name=atmospheres]').click();document.querySelector('form.pm-form-card').requestSubmit()",
      );
      await wait(60);
      assert(
        await ev('!!document.querySelector(".pm-confirmation")'),
        label + " confirmation",
      );
      assert(
        await ev(
          'document.querySelector(".pm-confirmation-notice").textContent.includes("aucune donnée")',
        ),
        label + " confirmation is explicitly simulated",
      );
      measurements.push({
        label: `${label}/confirmation`,
        geometry: await ev(
          `(()=>{const node=document.querySelector('.pm-confirmation'),r=node.getBoundingClientRect();return {rect:[r.x,r.y,r.width,r.height],padding:getComputedStyle(node).padding,icon:getComputedStyle(document.querySelector('.pm-confirmation__icon')).backgroundColor,overflow:document.documentElement.scrollWidth}})()`,
        ),
      });
      assert(
        await ev(`document.documentElement.scrollWidth === ${width}`),
        label + " confirmation no overflow",
      );
      if (width === 1440) {
        assert(
          await ev(
            `Math.abs(document.querySelector('.pm-confirmation').getBoundingClientRect().height - ${host ? 723 : 384}) <= 1`,
          ),
          label + " Figma confirmation height",
        );
        assert(
          await ev(
            `document.querySelector('.pm-confirmation').getBoundingClientRect().width === 600 && getComputedStyle(document.querySelector('.pm-confirmation')).padding === '32px'`,
          ),
          label + " Figma confirmation width and padding",
        );
      }
    }
  }
  for (const width of [1440, 390]) {
    await cmd("Emulation.setDeviceMetricsOverride", {
      width,
      height: 900,
      deviceScaleFactor: 1,
      mobile: false,
    });
    for (const route of ["a-propos", "devenir-hote", "connexion"]) {
      await cmd("Page.navigate", { url: `${url}/#/${route}` });
      for (
        let i = 0;
        i < 100 && !(await ev('!!document.querySelector("main")'));
        i++
      )
        await wait(50);
      await ev("document.fonts.ready");
      await ev(
        "Promise.all([...document.images].map(image => image.decode()))",
      );
      assert(
        await ev(`document.documentElement.scrollWidth === ${width}`),
        `${width}/${route} no overflow`,
      );
      assert(
        await ev(
          'getComputedStyle(document.documentElement).fontSize === "10px" && getComputedStyle(document.body).fontSize === "16px"',
        ),
        `${width}/${route} rem and body`,
      );
      if (width === 390) {
        await ev('document.querySelector(".pm-menu-toggle").click()');
        assert(
          await ev(
            'document.querySelector(".pm-menu-toggle").getAttribute("aria-expanded") === "true" && getComputedStyle(document.querySelector(".pm-nav")).display === "flex"',
          ),
          `${route} mobile menu`,
        );
      }
      if (route === "devenir-hote") {
        if (width === 1440) {
          assert(
            await ev(
              "Math.abs(document.querySelector('.pm-host__faq').getBoundingClientRect().height - 618) <= 1",
            ),
            "Figma FAQ collapsed height",
          );
          assert(
            await ev(
              "Math.abs(document.querySelector('.pm-host__join').getBoundingClientRect().height - 317) <= 1",
            ),
            "Figma host invitation height",
          );
        }
        await ev('document.querySelector("summary").click()');
        assert(
          await ev(
            'document.querySelector("details").open && document.querySelector("details p").textContent.length > 0',
          ),
          `${width} FAQ opens with answer`,
        );
      }
      if (route === "connexion") {
        if (width === 1440) {
          assert(
            await ev(
              "Math.abs(document.querySelector('.pm-login .pm-form-card').getBoundingClientRect().height - 554) <= 1",
            ),
            "Figma login card height",
          );
        }
        await ev('document.querySelector(".pm-login form").requestSubmit()');
        assert(
          await ev(
            '!!document.querySelector("[name=email]:invalid") && !document.querySelector("dialog").open',
          ),
          `${width} login rejects empty email`,
        );
        await ev(
          'document.querySelector("[name=email]").value="preview@example.com";document.querySelector("[name=password]").value="FictitiousPassword";document.querySelector(".pm-login form").requestSubmit()',
        );
        assert(
          await ev('document.querySelector("dialog").open'),
          `${width} login explains preview limit`,
        );
        await ev('document.querySelector("dialog").close()');
      }
      await ev(
        `document.querySelector('.pm-header a[href="#/explorer"]').click()`,
      );
      await wait(150);
      assert(
        await ev(
          'document.querySelectorAll(".pm-explorer .pm-table-card").length === 4 && window.location.hash === "#/explorer"',
        ),
        `${width}/${route} opens Explorer`,
      );
    }
  }
  for (const width of [1440, 390]) {
    await cmd("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
    await cmd("Page.navigate", { url: `${url}/#/mes-repas/invite/vide` });
    for (let i = 0; i < 100 && !(await ev('!!document.querySelector(".pm-meals__sections")')); i++) await wait(50);
    await ev("document.fonts.ready");
    await ev("Promise.all([...document.images].map(image => image.decode()))");
    assert(await ev('getComputedStyle(document.documentElement).fontSize === "10px"'), `${width} account rem base`);
    assert(await ev('document.querySelectorAll(".pm-meals__empty").length === 3'), `${width} guest has three empty histories`);
    assert(await ev(`document.documentElement.scrollWidth === ${width}`), `${width} guest meals fits viewport`);
    assert(await ev('document.querySelector(".pm-meals__empty a").getAttribute("href") === "#/explorer"'), `${width} empty meals leads to Explorer`);
    await ev('document.querySelector(".pm-account__role a:last-child").click()');
    await wait(100);
    await ev("Promise.all([...document.images].map(image => image.decode()))");
    assert(await ev('document.querySelector(".pm-meals__empty h2").textContent === "Devenez hôte"'), `${width} host toggle explains missing host profile`);
    assert(await ev('document.querySelector(".pm-meals__empty a").getAttribute("href") === "#/devenir-hote"'), `${width} host empty state leads to host journey`);
    assert(await ev(`document.documentElement.scrollWidth === ${width}`), `${width} host meals fits viewport`);
  }
  for (const width of [1440, 390]) {
    await cmd("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const role of ["hote", "invite"]) {
      await cmd("Page.navigate", { url: `${url}/#/mon-profil/${role}` });
      for (let i = 0; i < 100 && !(await ev('!!document.querySelector(".pm-profile__card")')); i++) await wait(50);
      await ev("document.fonts.ready");
      await ev("Promise.all([...document.images].map(image => image.decode()))");
      assert(await ev(`document.documentElement.scrollWidth === ${width}`), `${width}/${role} account profile fits viewport`);
      assert(await ev('document.querySelectorAll(".pm-profile__card").length === 3'), `${width}/${role} three profile sections`);
      assert(await ev('document.querySelector(".pm-profile__card input").readOnly'), `${width}/${role} personal data starts read-only`);
      await ev('document.querySelector(".pm-profile__edit").click()');
      await wait(50);
      assert(await ev('!document.querySelector(".pm-profile__card input").readOnly'), `${width}/${role} edit unlocks personal fields`);
      await ev('document.querySelector(".pm-profile__card").requestSubmit()');
      await wait(50);
      assert(await ev('document.querySelector(".pm-profile__card input").readOnly && document.querySelector(".pm-profile__message").textContent.includes("Aucun envoi")'), `${width}/${role} saving locks fields and states local-only persistence`);
      await ev('document.querySelectorAll(".pm-profile__edit")[1].click()');
      await wait(50);
      await ev('document.querySelector(".pm-profile__choices [aria-pressed=true]").click()');
      await wait(50);
      await ev('document.querySelectorAll(".pm-profile__card")[1].requestSubmit()');
      await wait(50);
      assert(await ev('document.querySelectorAll(".pm-profile__card")[1].textContent.includes("Choisissez au moins trois")'), `${width}/${role} rejects fewer than three interests`);
    }
  }
  for (const width of [1440, 390]) {
    await cmd("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const route of ["mes-repas/hote", "mes-repas/invite"]) {
      await cmd("Page.navigate", { url: `${url}/#/${route}` });
      const selector = ".pm-history";
      for (let i = 0; i < 100 && !(await ev(`!!document.querySelector('${selector}')`)); i++) await wait(50);
      await ev("document.fonts.ready");
      await ev("Promise.all([...document.images].map(image => image.decode()))");
      if (width === 1440) {
        const geometry = await ev('({lists:[...document.querySelectorAll(".pm-history__list")].map(el=>({width:el.getBoundingClientRect().width,height:el.getBoundingClientRect().height})),booking:document.querySelector(".pm-history__booking")?.getBoundingClientRect().height})');
        measurements.push({ label: route, geometry });
        const expected = route.endsWith("hote") ? [210, 146] : [142, 58];
        geometry.lists.forEach((rect, index) => assert(Math.abs(rect.height - expected[index]) <= 1 && rect.width === 1320, `Figma ${route.endsWith("hote") ? "815:2783" : "793:2402"} list ${index + 1} geometry`));
        if (geometry.booking !== undefined) assert(Math.abs(geometry.booking - 268) <= 1, "Figma 793:2402 confirmed booking height");
      }
      assert(await ev(`document.documentElement.scrollWidth === ${width}`), `${width}/${route} fits viewport`);
      assert(await ev('getComputedStyle(document.documentElement).fontSize === "10px"'), `${width}/${route} rem base`);
      {
        assert(await ev('document.querySelectorAll(".pm-history__row").length >= 3'), `${width}/${route} shows meal history`);
        await ev('document.querySelector(".pm-history__link").click()');
        assert(await ev('document.querySelector("dialog[open]").textContent.includes("aucun message")'), `${width}/${route} action does not claim an API mutation`);
        await ev('document.querySelector("dialog[open]").close()');
      }
    }
  }
  await cmd("DOM.enable");
  await cmd("CSS.enable");
  for (const width of [1440, 390]) {
    await cmd("Emulation.setDeviceMetricsOverride", { width, height: 900, deviceScaleFactor: 1, mobile: false });
    for (const route of ["mon-profil/hote", "mon-profil/invite", "mes-repas/hote", "mes-repas/invite", "mes-repas/hote/vide", "mes-repas/invite/vide"]) {
      await cmd("Page.navigate", { url: `${url}/#/${route}` });
      for (let i = 0; i < 100 && !(await ev('!!document.querySelector(".pm-account")')); i++) await wait(50);
      await ev("document.fonts.ready");
      await ev("Promise.all([...document.images].map(image => image.decode()))");
      if (width === 1440 && route === "mes-repas/invite/vide") {
        const top = await ev('document.querySelector(".pm-meals__sections").getBoundingClientRect().top');
        measurements.push({ label: "Figma 942:5367 section position", top });
        assert(Math.abs(top - 401) <= 1, "Figma 942:5367 empty guest sections start at y=401");
      }
      const assets = await ev('[...document.querySelectorAll("main img")].filter(img=>img.getAttribute("src").startsWith("/account/")).map(img=>({src:img.getAttribute("src"),width:img.getBoundingClientRect().width,height:img.getBoundingClientRect().height,naturalWidth:img.naturalWidth,naturalHeight:img.naturalHeight}))');
      assert(assets.length > 0 && assets.every(asset => asset.width === asset.naturalWidth && asset.height === asset.naturalHeight && asset.width > 0), `${width}/${route} Figma SVG assets retain native dimensions`);
      const {root} = await cmd("DOM.getDocument");
      const fonts = {};
      for (const selector of [".pm-account h1", ".pm-account__tabs a"]) {
        const {nodeId} = await cmd("DOM.querySelector", {nodeId:root.nodeId, selector});
        fonts[selector] = (await cmd("CSS.getPlatformFontsForNode", {nodeId})).fonts;
      }
      assert(fonts[".pm-account h1"].some(font => font.familyName === "BBB ReadMe" && font.isCustomFont && font.glyphCount > 0), `${width}/${route} heading uses loaded BBB ReadMe`);
      assert(fonts[".pm-account__tabs a"].some(font => font.familyName.includes("DM Sans") && font.isCustomFont && font.glyphCount > 0), `${width}/${route} body uses loaded DM Sans`);
      measurements.push({label:`${width}/${route}/assets-and-fonts`, assets, fonts});
    }
  }
  console.log(JSON.stringify({ passed: checks.length, measurements }));
})()
  .catch((e) => {
    console.error(e);
    process.exitCode = 1;
  })
  .finally(() => {
    ws?.close();
    c?.kill();
    vite.kill();
  });
