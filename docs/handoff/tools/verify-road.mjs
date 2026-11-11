// NOTE: the road trip (RoadTrip.tsx) is kept but not mounted since Prajwal chose the first design
// back (RoadMap.tsx; its checks are in verify-readme.mjs). This script exits early when it is absent.
// Checks "The road so far" (the road trip: the bus drives Koppa -> Sullia -> Bengaluru in a window,
// the camera following, day into night; the signpost's boards light as it reaches each stop and the
// mynah hops along; Pause / Play / Drive it again) on a server, with a film of the trip.
//   node verify-road.mjs [desktop,mobile,pause,reduced,sketch | all]
// BASE picks the server (default http://localhost:4173); screenshots go to ./.out/road unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || `${OUT_DIR}/road`;
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
    const r = document.querySelector('[data-qa=roadtrip]');
    const bus = r?.querySelector('[data-bus]')?.getAttribute('transform') ?? '';
    const x = Number((bus.match(/translate\(([-\d.]+)/) ?? [])[1]);
    const bird = r?.querySelector('[data-bird]');
    return {
      phase: r?.dataset.phase,
      busX: Math.round(x),
      lit: [...(r?.querySelectorAll('[data-board]') ?? [])].map((b) => b.getAttribute('data-lit')).join(''),
      bird: bird ? getComputedStyle(bird).transform : 'none',
      night: r?.querySelector('[data-night]')?.getAttribute('opacity') ?? 'none',
      control: r?.querySelector('[data-qa=roadtrip-control]')?.getAttribute('aria-label') ?? 'none',
    };
  });

// the window at 20% from the top of the screen
async function arrive(page) {
  const top = await page.evaluate(() => document.querySelector('[data-qa=roadtrip] svg').getBoundingClientRect().top + window.scrollY);
  for (let y = top - 1200; y <= top - 160; y += 200) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(140);
  }
}

{
  const { context, page } = await open({ viewport: { width: 1440, height: 900 } });
  const mounted = await page.evaluate(() => !!document.querySelector('[data-qa=roadtrip]'));
  await context.close();
  if (!mounted) {
    log('the road trip is not mounted (RoadMap.tsx is): nothing to check');
    await browser.close();
    process.exit(0);
  }
}

for (const [name, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
]) {
  if (!want(name)) continue;
  log(`== ${name.toUpperCase()}`);
  const { context, page, errs } = await open(opts);
  log('  before (below the fold)', await state(page));
  await arrive(page);
  const t0 = Date.now();
  for (const ms of [400, 2200, 4000, 5800, 6800, 8400, 10000, 11600, 13200]) {
    const wait = t0 + ms - Date.now();
    if (wait > 0) await sleep(wait);
    const win = await page.$('[data-qa=roadtrip] svg');
    await win.screenshot({ path: `${OUT}/${name}-film-${String(ms).padStart(5, '0')}.png` });
    log(`  ${ms}ms`, await state(page));
  }
  await sleep(600);
  await (await page.$('[data-qa=roadtrip]')).screenshot({ path: `${OUT}/${name}-road.png` });
  log(`  [${name}] errors:`, errs.length ? errs : 'none');
  await context.close();
}

if (want('pause')) {
  log('== PAUSE / PLAY / DRIVE IT AGAIN (desktop)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  await arrive(page);
  await sleep(3000);
  await page.click('[data-qa=roadtrip-control]');
  const a = await state(page);
  await sleep(1500);
  const b = await state(page);
  log('  paused', a, '-> 1.5s later', b);
  await page.click('[data-qa=roadtrip-control]');
  await sleep(11500);
  log('  played to the end', await state(page));
  await page.click('[data-qa=roadtrip-control]');
  await sleep(2500);
  log('  driving again', await state(page));
  log('  [pause] errors:', errs.length ? errs : 'none');
  await context.close();
}

for (const mode of ['reduced', 'sketch']) {
  if (!want(mode)) continue;
  log(`== ${mode.toUpperCase()}`);
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } }, { reduced: mode === 'reduced', sketch: mode === 'sketch' });
  await arrive(page);
  await sleep(1500);
  log('  state', await state(page));
  await (await page.$('[data-qa=roadtrip]')).screenshot({ path: `${OUT}/${mode}-road.png` });
  log(`  [${mode}] errors:`, errs.length ? errs : 'none');
  await context.close();
}

await browser.close();
log('done');
