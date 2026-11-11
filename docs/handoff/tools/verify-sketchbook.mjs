// The sketchbook (sketch mode: draw anywhere on the page): a mouse drag draws (no text gets
// selected), a plain click leaves no mark, controls still work, the marker and the eraser, undo /
// redo (buttons and Ctrl+Z / Ctrl+Y), clear and undo it, kept across a reload and pinned to the page
// while scrolling, hidden when sketch mode is off and back when it is on, a drawing per page; on a
// phone a finger scrolls with the hand tool and draws with the pencil; the cursors; 0 errors.
//   node verify-sketchbook.mjs [desktop,mobile,cursor | all]     BASE defaults to http://localhost:4173
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = `${OUT_DIR}/sketchbook`;
fs.mkdirSync(OUT, { recursive: true });
const only = (process.argv[2] || 'all').split(',');
const want = (k) => only.includes('all') || only.includes(k);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(a.join(' '));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let failures = 0;
const expect = (ok, what) => {
  if (!ok) failures++;
  log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`);
};
const NO_DRAW =
  'a,button,input,textarea,select,label,summary,option,iframe,video,audio,canvas,[contenteditable=""],[contenteditable="true"],[role="button"],[role="link"],[role="tab"],[role="slider"],[role="radio"],[role="checkbox"],[role="switch"],[role="menuitem"],[role="option"],[role="dialog"],[aria-modal="true"],[draggable="true"],[tabindex]:not([tabindex="-1"]),[data-no-draw],[data-qa="hero-note"],header[data-boot]';
const paths = (p) => p.evaluate(() => document.querySelectorAll('[data-qa=sketchbook] path').length);
const stored = (p, key) => p.evaluate((k) => JSON.parse(localStorage.getItem(k) || '{"s":[]}').s.length, key);
/** a point (viewport) where a drag will draw: nothing interactive under it, a run of free space to its right */
const freeSpot = (p, minY = 120) =>
  p.evaluate(
    ([sel, minY]) => {
      for (let y = minY; y < innerHeight - 140; y += 23)
        for (let x = 30; x < innerWidth - 220; x += 37) {
          let ok = true;
          for (let k = 0; k <= 160 && ok; k += 40) {
            const el = document.elementFromPoint(x + k, y + k / 4);
            if (!el || el.closest(sel)) ok = false;
          }
          if (ok) return { x, y };
        }
      return null;
    },
    [NO_DRAW, minY],
  );
const drag = async (p, from, dx = 160, dy = 40, steps = 14) => {
  await p.mouse.move(from.x, from.y);
  await p.mouse.down();
  for (let i = 1; i <= steps; i++) await p.mouse.move(from.x + (dx * i) / steps, from.y + (dy * i) / steps + Math.sin(i) * 6);
  await p.mouse.up();
  await sleep(120);
};
/** the first stroke's box in page coordinates */
const firstBox = (p) =>
  p.evaluate(() => {
    const r = document.querySelector('[data-qa=sketchbook] path')?.getBoundingClientRect();
    return r ? { x: Math.round(r.left + scrollX), y: Math.round(r.top + scrollY), w: Math.round(r.width), h: Math.round(r.height) } : null;
  });
async function open(opts, { lite = '0', reduced = false } = {}) {
  const ctx = await browser.newContext({ ...opts, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await ctx.addInitScript((lite) => {
    if (sessionStorage.getItem('__init')) return;
    sessionStorage.setItem('__init', '1');
    sessionStorage.setItem('pmp:intro-seen', '1');
    sessionStorage.setItem('pmp:card-popup', '1');
    sessionStorage.setItem('pmp:sketch', '1');
    localStorage.setItem('pmp:lite', lite);
    localStorage.setItem('pmp:sketchbook-hint', '1');
  }, lite);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(`[pageerror] ${e.message}`));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  return { ctx, p, errs };
}

if (want('desktop')) {
  log('== DESKTOP');
  const { ctx, p, errs } = await open({ viewport: { width: 1440, height: 900 } });
  await p.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(1800);
  const tools = await p.$('[data-qa=sketchbook-tools]');
  expect(!!tools, 'sketch mode shows the sketchbook tools');
  expect((await p.getAttribute('[data-tool=pencil]', 'aria-pressed')) === 'true', 'the pencil is picked (mouse)');
  // a stroke over the hero's statement: drawn, and no text selected
  const st = await p.evaluate(() => { const r = document.querySelector('[data-hero=statement]').getBoundingClientRect(); return { x: r.left + 20, y: r.top + r.height / 2 }; });
  await drag(p, st, 260, 10);
  expect((await paths(p)) === 1, 'a drag over text draws a stroke');
  expect((await p.evaluate(() => getSelection().toString())) === '', 'and selects no text');
  await sleep(400);
  expect((await stored(p, 'pmp:sketchbook:wide:/')) === 1, 'it is kept for this page');
  // a plain click leaves no mark
  const spot = await freeSpot(p);
  await p.mouse.click(spot.x, spot.y);
  await sleep(150);
  expect((await paths(p)) === 1, 'a plain click leaves no mark');
  // controls still work: the palette button opens the palette
  await p.click('[data-qa=palette-trigger]');
  await sleep(500);
  const palette = await p.evaluate(() => !!document.querySelector('[aria-modal="true"]'));
  expect(palette, 'a button still does its job (the palette opens)');
  await p.keyboard.press('Escape');
  await sleep(500);
  // the marker
  await p.click('[data-tool=marker]');
  const spot2 = await freeSpot(p, 300);
  await drag(p, spot2, 180, 0);
  const mk = await p.evaluate(() => [...document.querySelectorAll('[data-qa=sketchbook] path')].at(-1)?.getAttribute('stroke-width'));
  expect((await paths(p)) === 2 && mk === '16', 'the marker draws a wide lime stroke');
  await p.screenshot({ path: `${OUT}/desktop-drawn.png` });
  // the eraser takes the first stroke
  await p.click('[data-tool=eraser]');
  const b = await p.evaluate(() => { const r = document.querySelector('[data-qa=sketchbook] path').getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; });
  await p.mouse.move(b.x - 30, b.y - 30);
  await p.mouse.down();
  for (let i = 0; i <= 12; i++) await p.mouse.move(b.x - 30 + i * 5, b.y - 30 + i * 5);
  await p.mouse.up();
  await sleep(200);
  expect((await paths(p)) === 1, 'the eraser takes a stroke away');
  await p.click('[data-qa=sketchbook-undo]');
  await sleep(150);
  expect((await paths(p)) === 2, 'undo brings it back');
  await p.keyboard.press('Control+z');
  await sleep(150);
  expect((await paths(p)) === 1, 'Ctrl+Z undoes (the marker stroke)');
  await p.keyboard.press('Control+y');
  await sleep(150);
  expect((await paths(p)) === 2, 'Ctrl+Y redoes');
  await p.click('[data-qa=sketchbook-clear]');
  await sleep(150);
  expect((await paths(p)) === 0, 'clear empties the page');
  await p.click('[data-qa=sketchbook-undo]');
  await sleep(150);
  expect((await paths(p)) === 2, 'and undo brings the drawing back');
  // kept across a reload, in the same place
  await p.click('[data-tool=pencil]');
  await sleep(500);
  const before = await firstBox(p);
  await p.reload({ waitUntil: 'load' });
  await sleep(1800);
  const after = await firstBox(p);
  expect((await paths(p)) === 2 && before && after && Math.abs(before.x - after.x) <= 2 && Math.abs(before.y - after.y) <= 2, `kept across a reload, in place (${JSON.stringify(before)} vs ${JSON.stringify(after)})`);
  // pinned to the page while scrolling
  await p.mouse.wheel(0, 700);
  await sleep(1200);
  const scrolled = await firstBox(p);
  expect(scrolled && Math.abs(scrolled.y - after.y) <= 2, 'it stays on the page while scrolling');
  // sketch mode off: hidden; on: back
  await p.evaluate(() => scrollTo(0, 0));
  await sleep(400);
  await p.click('button[aria-label="Sketch mode"]');
  await sleep(1600);
  expect(!(await p.$('[data-qa=sketchbook]')) && !(await p.$('[data-qa=sketchbook-tools]')), 'sketch mode off: drawings and tools hidden');
  await p.click('button[aria-label="Sketch mode"]');
  await sleep(1800);
  expect((await paths(p)) === 2, 'sketch mode on again: the drawing is back');
  // another page has its own drawing
  await p.click('header a[href$="/repos/"]');
  await p.waitForURL(/\/repos\/?$/, { timeout: 10000 });
  await sleep(1800);
  expect((await paths(p)) === 0, 'another page starts blank');
  const rs = await freeSpot(p, 140);
  await drag(p, rs, 120, 30);
  expect((await paths(p)) === 1, 'and takes its own drawing');
  await p.goBack({ waitUntil: 'load' });
  await sleep(1800);
  expect((await paths(p)) === 2, 'back on the home page, its drawing is there');
  const overflow = await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1);
  expect(!overflow, 'no sideways scroll');
  log(`  errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  if (errs.length) failures++;
  await ctx.close();
}

if (want('mobile')) {
  log('== PHONE (a finger)');
  const { ctx, p, errs } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await p.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(1800);
  const cdp = await ctx.newCDPSession(p);
  const swipe = async (x, y, dx, dy) => {
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let i = 1; i <= 10; i++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x + (dx * i) / 10, y: y + (dy * i) / 10 }] });
    await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    await sleep(400);
  };
  expect((await p.getAttribute('[data-tool=hand]', 'aria-pressed')) === 'true', 'the hand is picked (a finger scrolls)');
  const box = await (await p.$('[data-qa=sketchbook-tools]')).boundingBox();
  expect(box && box.x >= 0 && box.x + box.width <= 390, `the tools fit the phone (${Math.round(box?.width)}px)`);
  const y0 = await p.evaluate(() => scrollY);
  await swipe(200, 600, 0, -300);
  // let the swipe's momentum settle
  let y1 = await p.evaluate(() => scrollY);
  for (let k = 0; k < 20; k++) {
    await sleep(150);
    const y = await p.evaluate(() => scrollY);
    if (y === y1) break;
    y1 = y;
  }
  expect(y1 > y0 && (await paths(p)) === 0, `a swipe scrolls and draws nothing (${y0} -> ${y1})`);
  await p.tap('[data-tool=pencil]');
  await sleep(300);
  expect(await p.evaluate(() => document.documentElement.classList.contains('sk-drawing')), 'picking the pencil hands the finger to drawing');
  const spot = await freeSpot(p, 140);
  await swipe(spot.x, spot.y, 120, 60);
  const y2 = await p.evaluate(() => scrollY);
  const n = await paths(p);
  expect(n === 1 && Math.abs(y2 - y1) < 2, `a finger drag draws (and does not scroll) (${n} stroke, scroll ${y1} -> ${y2})`);
  await p.screenshot({ path: `${OUT}/phone-drawn.png` });
  await p.tap('[data-tool=hand]');
  await sleep(300);
  expect(!(await p.evaluate(() => document.documentElement.classList.contains('sk-drawing'))), 'the hand gives scrolling back');
  log(`  errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  if (errs.length) failures++;
  await ctx.close();
}

if (want('cursor')) {
  log('== CURSORS');
  {
    const { ctx, p } = await open({ viewport: { width: 1440, height: 900 } });
    await p.goto(`${BASE}/`, { waitUntil: 'load' });
    await sleep(1800);
    await p.mouse.move(400, 400);
    await sleep(300);
    await p.click('[data-tool=eraser]');
    await p.mouse.move(420, 420);
    await sleep(300);
    const rot = await p.evaluate(() => { const el = document.querySelector('.cursor-pencil'); return el ? getComputedStyle(el).rotate : 'none'; });
    expect(rot === '180deg', `the custom pencil turns over for the eraser (${rot})`);
    await ctx.close();
  }
  {
    const { ctx, p } = await open({ viewport: { width: 1440, height: 900 } }, { lite: '1' });
    await p.goto(`${BASE}/`, { waitUntil: 'load' });
    await sleep(1800);
    const cur = await p.evaluate(() => getComputedStyle(document.body).cursor);
    expect(/^url\(/.test(cur), 'lite mode (native cursor): a pencil cursor over the page');
    await ctx.close();
  }
}

await browser.close();
log(failures ? `done: ${failures} failure(s)` : 'done: all ok');
process.exitCode = failures ? 1 : 0;
