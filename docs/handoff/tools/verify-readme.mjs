// Checks About's README (Preview | Code, the render sweep) and "The road so far" (the bus, the
// tickets): desktop, phone, reduced motion, sketch mode.
//   node verify-readme.mjs [desktop,mobile,reduced,sketch | all]
// BASE picks the server (default http://localhost:4173); screenshots go to ./.out/readme unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || `${OUT_DIR}/readme`;
fs.mkdirSync(OUT, { recursive: true });
const only = (process.argv[2] || 'all').split(',');
const want = (k) => only.includes('all') || only.includes(k);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
const browser = await chromium.launch({ channel: 'msedge', headless: true });

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
    const bus = document.querySelector('[data-qa=roadmap] [data-bus]');
    const punches = [...document.querySelectorAll('[data-qa=roadmap] [data-punch]')].map((p) => Number(getComputedStyle(p).opacity).toFixed(1));
    const tabs = [...document.querySelectorAll('[data-qa=readme] [role=tab]')].map((t) => `${t.textContent}:${t.getAttribute('aria-selected')}`);
    return { bus: bus?.getAttribute('transform'), punches, tabs };
  });

async function aboutAt(page, frac) {
  await page.evaluate((f) => {
    const el = document.querySelector('#about');
    const r = el.getBoundingClientRect();
    window.scrollTo(0, r.top + window.scrollY - window.innerHeight * f);
  }, frac);
}

for (const [name, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
]) {
  if (!want(name)) continue;
  log(`== ${name.toUpperCase()}`);
  const { context, page, errs } = await open(opts);
  await aboutAt(page, 0.55);
  await sleep(400);
  await aboutAt(page, 0.25);
  // the README renders, the bus drives: frames
  const t0 = Date.now();
  for (const ms of [500, 1100, 1700, 2600, 3600, 5200]) {
    const wait = t0 + ms - Date.now();
    if (wait > 0) await sleep(wait);
    await page.screenshot({ path: `${OUT}/${name}-${String(ms).padStart(4, '0')}.png` });
  }
  log('  after', await state(page));
  if (name === 'mobile') {
    const map = await page.$('[data-qa=roadmap]');
    await map.screenshot({ path: `${OUT}/${name}-roadmap.png` });
  }
  // the Code tab, then back
  await page.click('[data-qa=readme] [role=tab]:nth-child(2)');
  await sleep(300);
  await (await page.$('[data-qa=readme]')).screenshot({ path: `${OUT}/${name}-code.png` });
  log('  code tab', await state(page));
  await page.click('[data-qa=readme] [role=tab]:nth-child(1)');
  // drive again
  await page.click('[data-qa=roadmap] [aria-hidden=true]');
  await sleep(1500);
  log('  replay mid', (await state(page)).bus);
  await sleep(3500);
  log('  replay end', (await state(page)).bus);
  log(`  [${name}] errors:`, errs.length ? errs : 'none');
  await context.close();
}

for (const mode of ['reduced', 'sketch']) {
  if (!want(mode)) continue;
  log(`== ${mode.toUpperCase()}`);
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } }, { reduced: mode === 'reduced', sketch: mode === 'sketch' });
  await aboutAt(page, 0.25);
  await sleep(1500);
  log('  state', await state(page));
  await page.screenshot({ path: `${OUT}/${mode}.png` });
  log(`  [${mode}] errors:`, errs.length ? errs : 'none');
  await context.close();
}

await browser.close();
log('done');
