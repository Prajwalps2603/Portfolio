// Checks the /garden page (his GitHub activity as a garden): the time-lapse (plants grow week by
// week, the gardener walks and waters, the butterflies come last), Pause / Play / Grow it again, a
// plant's tag on hover and with the arrow keys, the seasons, the garden signs, the seed shelf, the
// header's Garden link, reduced motion and sketch mode, 0 console errors.
//   node verify-garden.mjs [desktop,mobile,keys,seasons,nav,reduced,sketch | all]
// BASE picks the server (default http://localhost:4173); screenshots go to ./.out/garden unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || `${OUT_DIR}/garden`;
fs.mkdirSync(OUT, { recursive: true });
const only = (process.argv[2] || 'all').split(',');
const want = (k) => only.includes('all') || only.includes(k);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
// software WebGL (SwiftShader), so the 3D forest renders headless
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });

async function open(opts, { sketch = false, reduced = false, path = '/garden/' } = {}) {
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
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await page.addStyleTag({ content: '[data-qa=cursor]{display:none!important}' });
  return { context, page, errs };
}

const state = (page) =>
  page.evaluate(() => {
    const g = document.querySelector('[data-qa=garden]');
    const g3 = document.querySelector('[data-qa=garden3d]');
    const grown = g3 ? Number(g3.dataset.grown) : [...(g?.querySelectorAll('[data-grow]') ?? [])].filter((p) => {
      const t = getComputedStyle(p).transform;
      return t === 'none' || !/matrix\(0(\.0+)?, /.test(t);
    }).length;
    const man = (g?.querySelector('[data-spray]') ?? g?.querySelector('[data-gardener]'))?.getAttribute('transform') ?? '';
    return {
      phase: g?.dataset.phase,
      plants: g3 ? Number(g3.dataset.plants) : g?.querySelectorAll('[data-grow]').length,
      grown,
      gardenerX: Math.round(Number((man.match(/translate\(([-\d.]+)/) ?? [])[1])),
      flies: [...(g?.querySelectorAll('[data-butterfly]') ?? [])].map((b) => Number(getComputedStyle(b).opacity).toFixed(1)).join(' '),
      control: [g?.querySelector('[data-qa=garden-replay]')?.getAttribute('aria-label'), g?.querySelector('[data-qa=garden-control]')?.getAttribute('aria-label')].filter(Boolean).join(' + ') || 'none',
      painted: !!g?.querySelector('[data-spray]'),
      three: !!g?.querySelector('canvas'),
      season: g?.querySelector('[role=tab][aria-selected=true]')?.textContent,
      signs: [...(document.querySelectorAll('[data-qa=garden-signs] li') ?? [])].map((li) => li.innerText.replace(/\s+/g, ' ').trim()),
      packets: document.querySelectorAll('[data-qa=seed-shelf] li').length,
    };
  });

for (const [name, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
]) {
  if (!want(name)) continue;
  log(`== ${name.toUpperCase()}`);
  const { context, page, errs } = await open(opts);
  const t0 = Date.now();
  for (const ms of [300, 1500, 3000, 4500, 6500]) {
    const wait = t0 + ms - Date.now();
    if (wait > 0) await sleep(wait);
    await (await page.$('#garden-plot')).screenshot({ path: `${OUT}/${name}-film-${String(ms).padStart(4, '0')}.png` });
    log(`  ${ms}ms`, await state(page));
  }
  await sleep(1200);
  log('  grown', await state(page));
  await page.screenshot({ path: `${OUT}/${name}-top.png` });
  await page.screenshot({ path: `${OUT}/${name}-full.png`, fullPage: true });
  log(`  [${name}] errors:`, errs.length ? errs : 'none');
  await context.close();
}

if (want('keys')) {
  log('== HOVER + KEYS + PAUSE (desktop)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  await sleep(1500);
  await page.click('[data-qa=garden-control]');
  const a = await state(page);
  await sleep(1200);
  log('  paused', a.gardenerX, '-> 1.2s later', (await state(page)).gardenerX, (await state(page)).control);
  await page.click('[data-qa=garden-control]');
  await sleep(6500);
  log('  played to the end', await state(page));
  // hover the tallest plant (scrolled into view first: a mouse move does not scroll)
  await page.evaluate(() => document.querySelector('#garden-plot').scrollIntoView({ block: 'center' }));
  await sleep(400);
  const pos = await page.evaluate(() => {
    const p = [...document.querySelectorAll('[data-qa=garden] [data-grow]')].map((g) => g.getBoundingClientRect()).sort((x, y) => y.height - x.height)[0];
    return p ? { x: p.left + p.width / 2, y: p.top + p.height * 0.6 } : null;
  });
  const three = await page.evaluate(() => !!document.querySelector('#garden-plot canvas'));
  if (three) {
    // 3D: sweep the pointer over the forest until a plant's tag comes up
    const r = await page.evaluate(() => { const b = document.querySelector('#garden-plot canvas').getBoundingClientRect(); return { x: b.left, y: b.top, w: b.width, h: b.height }; });
    let found = '';
    for (let yy = 0.35; yy < 0.98 && !found.includes('contribution '); yy += 0.04) {
      for (let xx = 0.3; xx < 0.98 && !found.includes('contribution '); xx += 0.03) {
        await page.mouse.move(r.x + r.w * xx, r.y + r.h * yy);
        found = (await page.evaluate(() => { const t = document.querySelector('[data-qa=garden3d] + div'); return t && getComputedStyle(t).opacity === '1' ? t.innerText.replace(/\s+/g, ' ') : ''; })) || '';
        if (found && !/^\d+ contribution/.test(found)) found = found + ' ';
      }
    }
    log('  hover tag (3D sweep)', found.trim() || 'none');
    await (await page.$('#garden-plot')).screenshot({ path: `${OUT}/hover.png` });
  } else if (pos) {
    await page.mouse.move(pos.x, pos.y);
    await sleep(300);
    log('  hover tag', await page.evaluate(() => document.querySelector('#garden-plot .-translate-y-full')?.innerText.replace(/\s+/g, ' ')));
    await (await page.$('#garden-plot')).screenshot({ path: `${OUT}/hover.png` });
  }
  await page.mouse.move(5, 5);
  await page.focus('[data-qa=garden] [role=group]');
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowUp');
  await sleep(200);
  log('  key tag', await page.evaluate(() => document.querySelector('#garden-plot .-translate-y-full')?.innerText.replace(/\s+/g, ' ')), '| live:', await page.evaluate(() => document.querySelector('#garden-plot [aria-live]')?.textContent));
  await page.click('[data-qa=garden-replay]');
  await sleep(1500);
  log('  grow it again', await state(page));
  log('  [keys] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('seasons')) {
  log('== SEASONS (desktop)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  await sleep(7500);
  const tabs = await page.$$('[data-qa=garden-season]');
  for (const t of tabs) {
    await t.click();
    await sleep(7200);
    const s = await state(page);
    log(`  ${s.season}`, { plants: s.plants, grown: s.grown, phase: s.phase, signs: s.signs });
    await (await page.$('#garden-plot')).screenshot({ path: `${OUT}/season-${s.season.replace(/\s+/g, '-')}.png` });
  }
  log('  [seasons] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('nav')) {
  log('== NAV (Garden in the header, from home)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } }, { path: '/' });
  await sleep(2500);
  const link = await page.$('header nav a[href$="/garden/"]');
  log('  header link', link ? await link.innerText() : 'missing');
  for (const w of [1440, 1280, 1024, 900]) {
    await page.setViewportSize({ width: w, height: 800 });
    await sleep(300);
    const fit = await page.evaluate(() => {
      const row = document.querySelector('header .wrap');
      return row ? { scroll: row.scrollWidth, client: row.clientWidth } : null;
    });
    await page.screenshot({ path: `${OUT}/nav-${w}.png`, clip: { x: 0, y: 0, width: w, height: 90 } });
    log(`  ${w}px header fits:`, fit && fit.scroll <= fit.client + 1, fit);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await link.click();
  await page.waitForURL(/\/garden\/?$/, { timeout: 10000 });
  await sleep(1500);
  log('  arrived', page.url(), 'current:', await page.evaluate(() => document.querySelector('header nav a[href$="/garden/"]')?.getAttribute('aria-current')));
  log('  [nav] errors:', errs.length ? errs : 'none');
  await context.close();
}

for (const mode of ['reduced', 'sketch']) {
  if (!want(mode)) continue;
  log(`== ${mode.toUpperCase()}`);
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } }, { reduced: mode === 'reduced', sketch: mode === 'sketch' });
  await sleep(2000);
  log('  state', await state(page));
  await page.screenshot({ path: `${OUT}/${mode}.png` });
  log(`  [${mode}] errors:`, errs.length ? errs : 'none');
  await context.close();
}

await browser.close();
log('done');
