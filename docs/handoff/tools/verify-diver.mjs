// Filmstrip of the stack's diver and waves on the production export: he stands on the ledge, dives
// in as the waterline rises past mid-screen, follows the scroll down the ice, rests at the seabed.
//   node verify-diver.mjs [desktop,mobile,reduced | all]
// BASE picks the server (default http://localhost:4173); frames go to ./.out/diver unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || `${OUT_DIR}/diver`;
fs.mkdirSync(OUT, { recursive: true });
const only = (process.argv[2] || 'all').split(',');
const want = (k) => only.includes('all') || only.includes(k);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

async function open(opts) {
  const context = await browser.newContext(opts);
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem('pmp:intro-seen', '1');
    } catch {}
  });
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(`[pageerror] ${String(e.message).slice(0, 220)}`));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errs.push(`[${m.type()}] ${m.text().slice(0, 220)}`));
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(2500);
  await page.addStyleTag({ content: '[data-qa=cursor]{display:none!important}' });
  return { context, page, errs };
}

/** Diver state: his parts' bounding box (viewport), whether the beam is on, under water or not. */
const diver = (page) =>
  page.evaluate(() => {
    const g = document.querySelector('[data-qa=stack-diver]');
    if (!g) return null;
    const b = g.getBoundingClientRect();
    const ps = [...g.querySelectorAll(':scope > path')];
    const body = ps[7];
    const mask = ps[17]?.getBoundingClientRect();
    const fin = ps[12]?.getBoundingClientRect();
    const headUp = mask && fin ? mask.y + mask.height / 2 < fin.y + fin.height / 2 : null;
    return { box: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)], look: body?.getAttribute('class'), headUp, beam: ps[0]?.getAttribute('opacity'), bubbles: g.querySelectorAll('circle').length };
  });

async function filmstrip(page, tag, waterFracs, extra) {
  const top = await page.evaluate(() => document.querySelector('[data-qa=stack-dive]').getBoundingClientRect().top + window.scrollY);
  const waterY = await page.evaluate(() => document.querySelector('[data-sea]').getBoundingClientRect().top - document.querySelector('[data-qa=stack-dive]').getBoundingClientRect().top);
  const vh = await page.evaluate(() => window.innerHeight);
  // walk there in small steps (as a reader would), so the dive has played and bubbles have run
  const steps = [...waterFracs.map((f) => top + waterY - f * vh), ...extra.map((e) => top + e)];
  let i = 0;
  for (const target of steps) {
    const from = await page.evaluate(() => window.scrollY);
    for (let k = 1; k <= 6; k++) {
      await page.evaluate((y) => window.scrollTo(0, y), from + ((target - from) * k) / 6);
      await sleep(70);
    }
    await sleep(900);
    i++;
    await page.screenshot({ path: `${OUT}/${tag}-${String(i).padStart(2, '0')}.png` });
    log(`  ${tag}-${i}`, await diver(page));
  }
}

if (want('desktop')) {
  log('== DESKTOP 1440x900');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  // waterline at 70% (ready), 60% (the stride), 52% (the drop), 44% (under: turning), 34% (head down),
  // then the descent, then back up a little (he should turn and swim up head first)
  await filmstrip(page, 'D', [0.7, 0.6, 0.52, 0.44, 0.34], [900, 1150, 1450, 1650, 1850]);
  await page.evaluate(() => window.scrollBy(0, -60));
  await sleep(120);
  for (let k = 0; k < 6; k++) {
    await page.evaluate(() => window.scrollBy(0, -50));
    await sleep(90);
  }
  await sleep(700);
  await page.screenshot({ path: `${OUT}/D-up.png` });
  log('  D-up (after scrolling up)', await diver(page));
  log('  [desktop] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('bed')) {
  log('== THE SEABED 1440x900');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  // walk down until the seabed line sits at 42%, 50% and 60% of the viewport (he should be standing)
  for (const [i, frac] of [0.6, 0.5, 0.42].entries()) {
    for (let k = 0; k < 80; k++) {
      const y = await page.evaluate(() => document.querySelector('[data-seabed]').getBoundingClientRect().top);
      const delta = y - frac * 900;
      if (Math.abs(delta) < 10) break;
      await page.evaluate((d) => window.scrollBy(0, d), Math.sign(delta) * Math.min(Math.abs(delta), 160));
      await sleep(50);
    }
    await sleep(1100);
    log(`  B-${i + 1} seabed at ${frac}`, await diver(page));
    await page.screenshot({ path: `${OUT}/B-${String(i + 1).padStart(2, '0')}.png` });
  }
  log('  [bed] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('sub')) {
  log('== SUBMARINE 1440x900');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  const sub = () =>
    page.evaluate(() => {
      const g = document.querySelector('[data-qa=stack-sub]');
      const b = g.getBoundingClientRect();
      const lights = g.querySelector('g');
      return { box: [Math.round(b.x), Math.round(b.y), Math.round(b.width), Math.round(b.height)], lights: lights ? getComputedStyle(lights).opacity : 'none' };
    });
  // the drawing is lazy: come near the section first
  await page.evaluate(() => document.querySelector('[data-qa=stack-dive]').scrollIntoView());
  await page.waitForSelector('[data-qa=stack-sub]', { state: 'attached', timeout: 10000 });
  await sleep(1500);
  // walk the page until the sub's lane sits at 95%, 75%, 55% and 35% of the viewport
  for (const [i, frac] of [0.95, 0.75, 0.55, 0.35].entries()) {
    for (let k = 0; k < 40; k++) {
      const b = await sub();
      const want = frac * 900;
      const delta = b.box[1] + b.box[3] / 2 - want;
      if (Math.abs(delta) < 12) break;
      await page.evaluate((d) => window.scrollBy(0, d), Math.sign(delta) * Math.min(Math.abs(delta), 140));
      await sleep(60);
    }
    await sleep(900);
    const b = await sub();
    log(`  S-${i + 1} lane at ${frac}`, b);
    await page.screenshot({ path: `${OUT}/S-${String(i + 1).padStart(2, '0')}.png` });
  }
  log('  [sub] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('mobile')) {
  log('== MOBILE 390x844');
  const { context, page, errs } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: IPHONE });
  await filmstrip(page, 'M', [0.7, 0.5, 0.38], [1200, 1800]);
  log('  [mobile] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('reduced')) {
  log('== REDUCED MOTION 1440x900');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  await filmstrip(page, 'R', [0.6, 0.3], []);
  log('  [reduced] errors:', errs.length ? errs : 'none');
  await context.close();
}

await browser.close();
log('done');
