// Checks "Certifications & awards" (the vault: locked until the visitor opens it; a click, a tap,
// Enter or a wheel turned by hand unlocks it, the door swings open, the strongroom's lamp comes on,
// the deposit boxes open one by one; a second click locks it all again; the Verify links) on a
// server, plus a frame strip of the opening.
//   node verify-about.mjs [desktop,mobile,tablet,relock,drag,keys,persist,reduced,sketch,film | all]
// BASE picks the server (default http://localhost:4173); screenshots go to ./.out/about unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || `${OUT_DIR}/about`;
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

// rotateY from a computed transform (matrix3d: m[0] = cos, m[2] = -sin)
const state = (page) =>
  page.evaluate(() => {
    const v = document.querySelector('[data-qa=vault]');
    const rotY = (el) => {
      const t = el ? getComputedStyle(el).transform : 'none';
      if (!t || t === 'none') return 0;
      const m = t.match(/matrix(3d)?\(([^)]+)\)/);
      if (!m || !m[1]) return 0;
      const n = m[2].split(',').map(Number);
      return Math.round((Math.atan2(-n[2], n[0]) * 180) / Math.PI);
    };
    const hatches = [...(v?.querySelectorAll('[data-hatch]') ?? [])].map(rotY);
    const bolt = v?.querySelector('[data-bolt]');
    return {
      phase: v?.dataset.phase,
      button: v?.querySelector('[data-qa=vault-door]')?.getAttribute('aria-label') ?? 'none',
      door: rotY(v?.querySelector('[data-door]')),
      bolts: bolt ? (bolt.getAttribute('transform') ?? 'markup') : 'none',
      light: v ? Number(getComputedStyle(v.querySelector('[data-light]')).opacity).toFixed(2) : 'none',
      hatches,
      lamps: [...(v?.querySelectorAll('[data-lamp]') ?? [])].map((l) => Number(getComputedStyle(l).opacity).toFixed(1)).join(' '),
      verify: [...(v?.querySelectorAll('a[href]') ?? [])].map((a) => new URL(a.href).hostname),
    };
  });

async function arrive(page) {
  const top = await page.evaluate(() => document.querySelector('[data-qa=vault]').getBoundingClientRect().top + window.scrollY);
  for (let y = top - 1400; y <= top - 160; y += 220) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(160);
  }
}

// a click (or a tap) on the door, at its right side (clear of the hub)
async function press(page, touch = false) {
  const at = await page.evaluate(() => {
    const r = document.querySelector('[data-qa=vault-door]').getBoundingClientRect();
    return { x: r.left + r.width * 0.78, y: r.top + r.height * 0.5 };
  });
  if (touch) await page.touchscreen.tap(at.x, at.y);
  else await page.mouse.click(at.x, at.y);
}

async function shot(page, name) {
  const slab = await page.evaluateHandle(() => document.querySelector('[data-qa=vault]').closest('[data-tone="ink"]'));
  await slab.asElement().screenshot({ path: `${OUT}/${name}.png` });
  log('  shot', name);
}

for (const [name, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
  ['tablet', { viewport: { width: 834, height: 1194 }, isMobile: true, hasTouch: true }],
]) {
  if (!want(name)) continue;
  log(`== ${name.toUpperCase()}`);
  const { context, page, errs } = await open(opts);
  log('  before (below the fold)', await state(page));
  await arrive(page);
  await sleep(2600);
  log('  on screen, untouched (locked)', await state(page));
  if (name === 'desktop') await shot(page, `${name}-locked`);
  await press(page, Boolean(opts.hasTouch));
  await sleep(1500);
  log('  unlocking', await state(page));
  await sleep(3600);
  log('  opened', await state(page));
  if (name === 'mobile') {
    // the boxes below the fold open as each comes on screen
    await page.evaluate(() => document.querySelector('[data-wall]').scrollIntoView({ block: 'center' }));
    await sleep(1800);
    await page.evaluate(() => document.querySelector('[data-box]:last-child').scrollIntoView({ block: 'center' }));
    await sleep(1800);
    log('  scrolled to the boxes', await state(page));
    await page.evaluate(() => document.querySelector('[data-qa=vault]').scrollIntoView({ block: 'start' }));
    await sleep(400);
  }
  await shot(page, `${name}-vault`);
  log(`  [${name}] errors:`, errs.length ? errs : 'none');
  await context.close();
}

if (want('relock')) {
  log('== RELOCK (desktop: open, then a second click locks it all again, then open again)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  await arrive(page);
  await press(page);
  await sleep(5200);
  log('  open', await state(page));
  await press(page);
  await sleep(600);
  log('  locking', await state(page));
  await sleep(2400);
  log('  locked again', await state(page));
  await press(page);
  await sleep(5200);
  log('  open again', await state(page));
  log('  [relock] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('drag')) {
  log('== DRAG (desktop: the wheel turned by hand)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  await arrive(page);
  await sleep(1800);
  const c = await page.evaluate(() => {
    const r = document.querySelector('[data-stage]').getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2, r: r.width * 0.3 };
  });
  const at = (deg) => ({ x: c.x + Math.cos((deg * Math.PI) / 180) * c.r, y: c.y + Math.sin((deg * Math.PI) / 180) * c.r });
  // a short turn first: it springs back, still locked
  let p0 = at(-90);
  await page.mouse.move(p0.x, p0.y);
  await page.mouse.down();
  for (let d = -90; d <= -20; d += 10) {
    const q = at(d);
    await page.mouse.move(q.x, q.y);
    await sleep(16);
  }
  await page.mouse.up();
  await sleep(900);
  log('  a short turn (springs back)', await state(page));
  // then past half a turn: it gives
  p0 = at(-90);
  await page.mouse.move(p0.x, p0.y);
  await page.mouse.down();
  for (let d = -90; d <= 150; d += 10) {
    const q = at(d);
    await page.mouse.move(q.x, q.y);
    await sleep(16);
  }
  await page.mouse.up();
  await sleep(4000);
  log('  turned past half a turn (open)', await state(page));
  log('  [drag] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('keys')) {
  log('== KEYS (desktop: focus the door, Enter)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  await arrive(page);
  await page.focus('[data-qa=vault-door]');
  log('  focused', await page.evaluate(() => [document.activeElement?.getAttribute('aria-label'), getComputedStyle(document.activeElement).outlineStyle]));
  await page.keyboard.press('Enter');
  await sleep(5200);
  log('  after Enter', await state(page));
  log('  [keys] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('persist')) {
  log('== PERSIST (desktop: locked on every refresh until opened; opened, it stays open; no flash)');
  const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem('pmp:intro-seen', '1');
    } catch {}
  });
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(`[pageerror] ${String(e.message).slice(0, 220)}`));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errs.push(`[${m.type()}] ${m.text().slice(0, 220)}`));
  // every angle the door shows from the first moment it exists until the component has taken over
  const watch = async (load) => {
    await load();
    const seen = new Set();
    for (let k = 0; k < 400; k++) {
      const s = await page.evaluate(() => {
        const v = document.querySelector('[data-qa=vault]');
        const d = v?.querySelector('[data-door]');
        if (!d) return null;
        const t = getComputedStyle(d).transform;
        const m = t && t !== 'none' ? t.match(/matrix3d\(([^)]+)\)/) : null;
        const n = m ? m[1].split(',').map(Number) : null;
        return { angle: n ? Math.round((Math.atan2(-n[2], n[0]) * 180) / Math.PI) : 0, phase: v.dataset.phase };
      });
      if (s) {
        seen.add(s.angle);
        if (s.phase !== 'boot') break;
      }
      await sleep(10);
    }
    return [...seen];
  };
  const reload = () => page.reload({ waitUntil: 'commit' });
  log('  first visit: door angles while loading', await watch(() => page.goto(`${BASE}/`, { waitUntil: 'commit' })));
  await sleep(1500);
  await arrive(page);
  log('  first visit', await state(page));
  await page.evaluate(() => window.scrollBy(0, 1));
  log('  refreshed (never opened): door angles while loading', await watch(reload));
  await sleep(1500);
  await arrive(page);
  log('  refreshed (never opened)', await state(page));
  await press(page);
  await sleep(5200);
  log('  opened', await state(page), 'stored:', await page.evaluate(() => localStorage.getItem('pmp:vault')));
  log('  refreshed (left open): door angles while loading', await watch(reload));
  await sleep(1500);
  await arrive(page);
  log('  refreshed (left open)', await state(page));
  await press(page);
  await sleep(3200);
  log('  locked again', await state(page), 'stored:', await page.evaluate(() => localStorage.getItem('pmp:vault')));
  log('  refreshed (locked again): door angles while loading', await watch(reload));
  await sleep(1500);
  await arrive(page);
  log('  refreshed (locked again)', await state(page));
  log('  [persist] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('film')) {
  log('== FILM (desktop)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  const top = await page.evaluate(() => document.querySelector('[data-qa=vault]').getBoundingClientRect().top + window.scrollY);
  await page.evaluate((v) => window.scrollTo(0, v), top - 1200);
  await sleep(500);
  await page.evaluate((v) => window.scrollTo(0, v), top - 120);
  await sleep(1600);
  await press(page);
  const t0 = Date.now();
  for (const ms of [200, 700, 1300, 1900, 2400, 2800, 3200, 3700, 4400]) {
    const wait = t0 + ms - Date.now();
    if (wait > 0) await sleep(wait);
    const el = await page.$('[data-qa=vault]');
    await el.screenshot({ path: `${OUT}/film-${String(ms).padStart(4, '0')}.png` });
  }
  log('  [film] errors:', errs.length ? errs : 'none');
  await context.close();
}

for (const mode of ['reduced', 'sketch']) {
  if (!want(mode)) continue;
  log(`== ${mode.toUpperCase()}`);
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } }, { reduced: mode === 'reduced', sketch: mode === 'sketch' });
  await arrive(page);
  await sleep(1500);
  log('  state', await state(page));
  await shot(page, `${mode}-vault`);
  log(`  [${mode}] errors:`, errs.length ? errs : 'none');
  await context.close();
}

await browser.close();
log('done');
