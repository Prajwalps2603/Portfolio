// Checks "Also shipped" as a container port: the crane working on its own (no scrolling), the
// pause control, the SHIPPED stamp only while the ship is full, the yard tabs, a click on a
// container, the opened container (doors, cargo, bill of lading), reduced motion, sketch mode.
// The ship floats: it rides the waves, each container set down pushes it down and rocks it, the
// containers aboard ride with it; still in reduced motion and sketch mode.
//   node verify-port.mjs [desktop,laptop,tablet,mobile,reduced,sketch,float | all]
// BASE picks the server (default http://localhost:4173); screenshots go to ./.out/port unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || `${OUT_DIR}/port`;
fs.mkdirSync(OUT, { recursive: true });
const only = (process.argv[2] || 'all').split(',');
const want = (k) => only.includes('all') || only.includes(k);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
const browser = await chromium.launch({ channel: 'msedge', headless: true });

const VPS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  laptop: { viewport: { width: 1280, height: 800 } },
  tablet: { viewport: { width: 834, height: 1194 }, isMobile: true, hasTouch: true },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};

async function open(opts, { sketch = false, reduced = false } = {}) {
  const context = await browser.newContext({ ...opts, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await context.addInitScript((sk) => {
    try {
      sessionStorage.setItem('pmp:intro-seen', '1');
      if (sk) sessionStorage.setItem('pmp:sketch', '1');
    } catch {}
  }, sketch);
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(`[pageerror] ${String(e.message).slice(0, 220)}`));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errs.push(`[${m.type()}] ${m.text().slice(0, 220)}`));
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(2200);
  await page.addStyleTag({ content: 'header{visibility:hidden!important}a[href="#main"],[data-qa=cursor]{display:none!important}' });
  return { context, page, errs };
}

const state = (page) =>
  page.evaluate(() => {
    const tabs = [...document.querySelectorAll('[data-qa=port-tab]')];
    const panels = [...document.querySelectorAll('#work-port [data-port-panel]')];
    const vis = panels.filter((p) => getComputedStyle(p).visibility === 'visible').map((p) => p.querySelector('h4')?.textContent);
    const s = document.querySelector('[data-qa=port-scene] .stamp');
    return {
      ready: document.querySelector('[data-qa=port-scene]')?.dataset.ready ?? 'none',
      tabs: tabs.length,
      selected: tabs.findIndex((t) => t.getAttribute('aria-selected') === 'true'),
      visible: vis,
      crates: document.querySelectorAll('#work-port [data-port-box] svg [data-crate]').length,
      stamp: s ? Number(getComputedStyle(s).opacity).toFixed(2) : 'none',
    };
  });

const boxes = (page) => page.evaluate(() => [...document.querySelectorAll('[data-qa=port-scene] [data-box]')].map((g) => g.getAttribute('transform')).join('|'));
const trolley = (page) =>
  page.evaluate(() => {
    const el = document.querySelector('[data-qa=port-scene] svg > g:last-of-type');
    return el ? el.getAttribute('transform') : null;
  });

/** Put the port's top at `frac` of the viewport height. */
async function portAt(page, frac) {
  await page.evaluate((f) => {
    const el = document.querySelector('[data-qa=port]');
    const r = el.getBoundingClientRect();
    window.scrollTo(0, r.top + window.scrollY - window.innerHeight * f);
  }, frac);
}

async function shoot(page, sel, name) {
  const el = await page.$(sel);
  await el.screenshot({ path: `${OUT}/${name}.png` });
  log('  shot', name);
}

for (const name of ['desktop', 'laptop', 'tablet', 'mobile']) {
  if (!want(name)) continue;
  log(`== ${name.toUpperCase()} ${VPS[name].viewport.width}x${VPS[name].viewport.height}`);
  const { context, page, errs } = await open(VPS[name]);
  await portAt(page, 0.12);
  await sleep(1200);
  // no scrolling from here on: the crane must work by itself
  const a = await boxes(page);
  const ta = await trolley(page);
  await sleep(1600);
  const b = await boxes(page);
  const tb = await trolley(page);
  log('  works without scrolling:', a !== b || ta !== tb ? 'yes' : 'NO');
  if (name === 'desktop' || name === 'mobile') {
    for (let k = 0; k < 4; k++) {
      await page.screenshot({ path: `${OUT}/${name}-run-${k}.png` });
      await sleep(1300);
    }
  }
  // the pause control
  await page.click('[data-qa=port-pause]');
  await sleep(300);
  const p1 = await boxes(page);
  await sleep(1500);
  const p2 = await boxes(page);
  log('  paused holds still:', p1 === p2 ? 'yes' : 'NO', await page.getAttribute('[data-qa=port-pause]', 'aria-label'));
  await page.click('[data-qa=port-pause]');
  if (name === 'desktop') {
    // the stamp only while the ship is full (a full load takes ~22s)
    let at = -1;
    log('  stamp while loading:', (await state(page)).stamp);
    for (let s = 0; s < 34; s++) {
      await sleep(1000);
      if ((await state(page)).stamp === '1.00') {
        at = s;
        break;
      }
    }
    log('  stamp landed after', at, 's');
    await page.screenshot({ path: `${OUT}/${name}-full.png` });
  }
  log('  state', await state(page));
  await shoot(page, '[data-qa=port-hold]', `${name}-hold`);
  // a tab, then a container in the drawing, then the keyboard
  const tabs = await page.$$('[data-qa=port-tab]');
  await tabs[6].click();
  await sleep(160);
  await shoot(page, '[data-qa=port-hold]', `${name}-hold-shut`);
  await sleep(1300);
  log('  tab 07 ->', await state(page));
  await shoot(page, '[data-qa=port-hold]', `${name}-hold-07`);
  const box = await page.$('[data-qa=port-scene] [data-box="04"]');
  if (box) {
    await box.click({ force: true });
    await sleep(1400);
    log('  box 04 ->', await state(page));
    await shoot(page, '[data-qa=port-hold]', `${name}-hold-04`);
  }
  await page.focus('[data-qa=port-tab][aria-selected=true]');
  await page.keyboard.press('ArrowRight');
  await sleep(1400);
  log('  ArrowRight ->', await state(page));
  log(`  [${name}] errors:`, errs.length ? errs : 'none');
  await context.close();
}

for (const mode of ['reduced', 'sketch']) {
  if (!want(mode)) continue;
  log(`== ${mode.toUpperCase()} 1440x900`);
  const { context, page, errs } = await open(VPS.desktop, { reduced: mode === 'reduced', sketch: mode === 'sketch' });
  await portAt(page, 0.12);
  await sleep(1500);
  const a = await boxes(page);
  await sleep(1200);
  log('  still:', a === (await boxes(page)) ? 'yes' : 'NO', await state(page));
  await shoot(page, '#work-port', `${mode}-port`);
  log(`  [${mode}] errors:`, errs.length ? errs : 'none');
  await context.close();
}

// the ship floats: it rides the waves, dips and rocks when a container lands, the containers aboard
// and the mooring lines move with it (and in reduced motion / sketch mode it does not move at all)
let floatFails = 0;
const check = (ok, what) => {
  if (!ok) floatFails++;
  log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`);
};
const shipNow = (page) =>
  page.evaluate(() => {
    const svg = document.querySelector('[data-qa=port-scene] svg');
    const ship = [...(svg?.querySelectorAll('g[transform]') ?? [])].find((g) => /rotate\(/.test(g.getAttribute('transform')) && !g.hasAttribute('data-box'));
    return ship?.getAttribute('transform') ?? null;
  });
if (want('float')) {
  log('== THE SHIP FLOATS 1440x900');
  const { context, page, errs } = await open(VPS.desktop);
  await portAt(page, 0.12);
  await sleep(800);
  const run = await page.evaluate(
    () =>
      new Promise((done) => {
        const svg = document.querySelector('[data-qa=port-scene] svg');
        const ship = [...svg.querySelectorAll('g[transform]')].find((g) => /rotate\(/.test(g.getAttribute('transform')) && !g.hasAttribute('data-box'));
        const ch = svg.querySelector('[data-box] path').getBBox().height;
        const out = [];
        const t0 = performance.now();
        const tick = () => {
          const tr = ship.getAttribute('transform');
          const m = /translate\(0 (-?[\d.]+)\) rotate\((-?[\d.]+)/.exec(tr);
          const aboard = [...svg.querySelectorAll('[data-box]')].filter((g) => /rotate\(/.test(g.getAttribute('transform') || ''));
          out.push({ t: performance.now() - t0, h: +m[1], a: +m[2], n: aboard.length, ride: aboard.every((g) => g.getAttribute('transform').startsWith(tr)) });
          if (performance.now() - t0 < 8000) requestAnimationFrame(tick);
          else done({ ch, out });
        };
        requestAnimationFrame(tick);
      }),
  );
  const hs = run.out.map((x) => x.h);
  check(Math.max(...hs) - Math.min(...hs) > 1, `it moves in the water (heave ${Math.min(...hs).toFixed(1)}..${Math.max(...hs).toFixed(1)}px)`);
  const dips = [];
  for (let k = 1; k < run.out.length; k++) {
    if (run.out[k].n > run.out[k - 1].n) {
      const at = run.out[k];
      const win = run.out.filter((x) => x.t > at.t && x.t <= at.t + 700);
      dips.push(Math.max(...win.map((x) => x.h)) - at.h);
    }
  }
  check(dips.length >= 2 && dips.every((d) => d >= run.ch * 0.06), `each container set down pushes it down (${dips.map((d) => d.toFixed(1)).join(', ')}px; container ${run.ch.toFixed(0)}px tall)`);
  check(run.out.every((x) => x.ride), 'the containers aboard ride with it');
  log(`  [float] errors:`, errs.length ? errs : 'none');
  if (errs.length) floatFails++;
  await context.close();
}
for (const mode of ['reduced', 'sketch']) {
  if (!want(mode) && !want('float')) continue;
  const { context, page } = await open(VPS.desktop, { reduced: mode === 'reduced', sketch: mode === 'sketch' });
  await portAt(page, 0.12);
  await sleep(1200);
  const tr = await shipNow(page);
  check(/^translate\(0 0\) rotate\(0\.000 /.test(tr ?? ''), `${mode}: the ship does not move (${tr?.slice(0, 26)})`);
  await context.close();
}

await browser.close();
log(floatFails ? `done: ${floatFails} failure(s)` : 'done');
process.exitCode = floatFails ? 1 : 0;
