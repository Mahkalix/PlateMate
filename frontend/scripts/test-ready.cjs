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
(async () => {
  for (let i = 0; i < 80; i++) {
    try {
      if ((await fetch(url)).ok) break;
    } catch {}
    await wait(100);
  }
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
    { stdio: "ignore", windowsHide: true },
  );
  const file = path.join(dir, "DevToolsActivePort");
  for (let i = 0; i < 100 && !fs.existsSync(file); i++) await wait(100);
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
          'document.querySelector(".pm-confirmation").textContent.includes("aucune donnée")',
        ),
        label + " confirmation is explicitly simulated",
      );
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
        await ev('document.querySelector("summary").click()');
        assert(
          await ev(
            'document.querySelector("details").open && document.querySelector("details p").textContent.length > 0',
          ),
          `${width} FAQ opens with answer`,
        );
      }
      if (route === "connexion") {
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
        `document.querySelector('.pm-header a[href="#tables"]').click()`,
      );
      await wait(150);
      assert(
        await ev(
          '!!document.querySelector("#tables") && window.location.hash === "#tables"',
        ),
        `${width}/${route} returns to homepage tables`,
      );
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
