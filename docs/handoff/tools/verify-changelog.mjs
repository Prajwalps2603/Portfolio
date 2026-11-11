// Checks "Career, as a changelog" (each role card's figure: drawn, played once, finished) on a server.
//   node verify-changelog.mjs [desktop,laptop,tablet,mobile,small,reduced,sketch,film | all]
// BASE picks the server (default http://localhost:4173); screenshots go to ./.out/changelog unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || `${OUT_DIR}/changelog`;
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
  small: { viewport: { width: 360, height: 740 }, isMobile: true, hasTouch: true },
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
  page.evaluate(() =>
    [...document.querySelectorAll('#changelog [data-qa=role-panel]')].map((p) => {
      const f = p.querySelector('[data-qa=role-figure]');
      const svg = p.querySelector('svg');
      const r = p.getBoundingClientRect();
      // overflow: any label poking out of the panel
      const out = svg
        ? [...svg.querySelectorAll('text')].filter((t) => {
            const b = t.getBoundingClientRect();
            return b.left < r.left - 0.5 || b.right > r.right + 0.5 || b.top < r.top - 0.5 || b.bottom > r.bottom + 0.5;
          }).map((t) => t.textContent)
        : [];
      return {
        fig: f?.dataset.figure,
        rested: f?.dataset.rested,
        size: [Math.round(r.width), Math.round(r.height)],
        labels: svg ? svg.querySelectorAll('text').length : 0,
        out,
      };
    }),
  );

/** Scroll down through the section like a reader, then let the figures finish. */
async function readThrough(page, step = 260, pause = 260) {
  const box = await page.evaluate(() => {
    const s = document.querySelector('#changelog').getBoundingClientRect();
    return { top: s.top + window.scrollY, bottom: s.bottom + window.scrollY };
  });
  for (let y = box.top - 700; y <= box.bottom - 400; y += step) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(pause);
  }
  await sleep(4800);
}

async function shootCards(page, name) {
  const cards = await page.$$('#changelog [data-commit]');
  for (let i = 0; i < cards.length; i++) {
    const has = await cards[i].$('[data-qa=role-panel], [data-qa=medal-panel], [data-qa=college-panel]');
    if (!has) continue;
    await cards[i].scrollIntoViewIfNeeded();
    await sleep(350);
    await cards[i].screenshot({ path: `${OUT}/${name}-${i}.png` });
  }
  log('  shot', `${name}-*`);
}

for (const name of ['desktop', 'laptop', 'tablet', 'mobile', 'small']) {
  if (!want(name)) continue;
  log(`== ${name.toUpperCase()} ${VPS[name].viewport.width}x${VPS[name].viewport.height}`);
  const { context, page, errs } = await open(VPS[name]);
  await readThrough(page);
  log('  after reading', await state(page));
  await shootCards(page, name);
  log(`  [${name}] errors:`, errs.length ? errs : 'none');
  await context.close();
}

if (want('reduced')) {
  log('== REDUCED MOTION 1440x900');
  const { context, page, errs } = await open(VPS.desktop, { reduced: true });
  await readThrough(page, 400, 120);
  log('  state', await state(page));
  await shootCards(page, 'reduced');
  log('  [reduced] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('sketch')) {
  log('== SKETCH MODE 1440x900');
  const { context, page, errs } = await open(VPS.desktop, { sketch: true });
  await readThrough(page, 400, 120);
  log('  state', await state(page));
  await shootCards(page, 'sketch');
  log('  [sketch] errors:', errs.length ? errs : 'none');
  await context.close();
}

// A filmstrip of each figure playing (desktop): scroll its card in and capture over ~4.5s.
if (want('film')) {
  log('== FILM 1440x900');
  const { context, page, errs } = await open(VPS.desktop);
  const panels = await page.$$('#changelog [data-qa=role-panel], #changelog [data-qa=medal-panel], #changelog [data-qa=college-panel]');
  for (let i = 0; i < panels.length; i++) {
    const fig = await panels[i].evaluate((p) => p.closest('[data-commit]').querySelector('h3').textContent);
    await panels[i].evaluate((p) => {
      const r = p.getBoundingClientRect();
      window.scrollTo(0, r.top + window.scrollY - window.innerHeight * 0.3);
    });
    const t0 = Date.now();
    for (const ms of [300, 800, 1300, 1900, 2500, 3100, 3700, 5000]) {
      const wait = t0 + ms - Date.now();
      if (wait > 0) await sleep(wait);
      await panels[i].screenshot({ path: `${OUT}/film-${i}-${String(ms).padStart(4, '0')}.png` });
    }
    log('  film', i, fig);
  }
  log('  [film] errors:', errs.length ? errs : 'none');
  await context.close();
}

await browser.close();
log('done');
