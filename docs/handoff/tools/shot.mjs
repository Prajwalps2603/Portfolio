// Headless Microsoft Edge screenshot / filmstrip tool (playwright-core, no browser download).
// Usage examples:
//   node shot.mjs --url http://localhost:3000 --name home --viewport desktop --wait 3000
//   node shot.mjs --url file:///C:/x/index.html --frames 0,400,900,1600,3000   (intro filmstrip)
//   node shot.mjs --url http://localhost:3000 --scroll 0,900,1800,2700 --settle 900 --wheel
//   node shot.mjs --url http://localhost:3000 --viewport mobile --reduced-motion --full
//   node shot.mjs --url ... --hover 700,400 --eval "window.__skipIntro=true"
// Flags:
//   --out dir           where to save (default docs/handoff/tools/.out, git-ignored)
//   --viewport desktop|laptop|tablet|mobile|WxH   (default desktop 1440x900)
//   --wait ms           wait after load before first capture (default 2500)
//   --frames a,b,c      capture at these ms offsets after DOMContentLoaded (overrides --wait capture)
//   --scroll y1,y2      scroll to each y (px) or "steps:N" (N evenly spaced to page bottom); capture after --settle ms
//   --wheel             use mouse-wheel scrolling (works with Lenis/smooth scroll) instead of window.scrollTo
//   --settle ms         wait after each scroll (default 1000)
//   --full              full-page screenshot (single capture)
//   --reduced-motion    emulate prefers-reduced-motion: reduce
//   --hover x,y         move mouse here before each capture
//   --eval "js"         run JS in page after load (before captures); an expression or statements,
//                       `await` allowed; a non-undefined result is printed as EVAL: <json>
//   --eval-after "js"   the same, after the clicks / keys / captures (read state after an action)
//   --selector css      screenshot only this element
//   --hover-selector css  scroll element into view and hover its centre before each capture
//   --click css         click this element after --wait (e.g. open the mobile menu); --after-click ms (default 1200)
//   --keys "Tab,Tab,Enter"  press keys after --wait (focus-visible / keyboard checks)
//   --dsf n             device scale factor (default 1)
// Prints: saved file paths, page console errors/warnings, failed requests, and basic metrics.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const get = (k, d) => { const i = args.indexOf(`--${k}`); return i >= 0 && args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : d; };
const has = (k) => args.includes(`--${k}`);

const url = get('url');
if (!url) { console.error('missing --url'); process.exit(2); }
const outDir = get('out', OUT_DIR);
const name = get('name', 'shot');
const vpArg = get('viewport', 'desktop');
const presets = {
  desktop: { width: 1440, height: 900 },
  laptop: { width: 1280, height: 800 },
  tablet: { width: 834, height: 1194, isMobile: true, hasTouch: true },
  'tablet-landscape': { width: 1194, height: 834, isMobile: true, hasTouch: true },
  mobile: { width: 390, height: 844, isMobile: true, hasTouch: true },
};
let vp = presets[vpArg];
if (!vp) { const [w, h] = vpArg.split('x').map(Number); vp = { width: w || 1440, height: h || 900 }; }
const wait = Number(get('wait', 2500));
const settle = Number(get('settle', 1000));
const dsf = Number(get('dsf', 1));
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl', '--autoplay-policy=no-user-gesture-required'],
});
const context = await browser.newContext({
  viewport: { width: vp.width, height: vp.height },
  deviceScaleFactor: dsf,
  isMobile: !!vp.isMobile,
  hasTouch: !!vp.hasTouch,
  reducedMotion: has('reduced-motion') ? 'reduce' : 'no-preference',
  userAgent: vp.isMobile
    ? 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1'
    : undefined,
});
const page = await context.newPage();
const logs = [];
page.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(`[console.${m.type()}] ${m.text()}`.slice(0, 400)); });
page.on('pageerror', (e) => logs.push(`[pageerror] ${String(e.message || e).slice(0, 400)}`));
page.on('requestfailed', (r) => logs.push(`[requestfailed] ${r.url().slice(0, 200)} ${r.failure()?.errorText || ''}`));
page.on('response', (r) => { if (r.status() >= 400) logs.push(`[http ${r.status()}] ${r.url().slice(0, 200)}`); });

const saved = [];
const snap = async (suffix) => {
  const hv = get('hover');
  if (hv) { const [x, y] = hv.split(',').map(Number); await page.mouse.move(x, y, { steps: 8 }); await page.waitForTimeout(250); }
  const hsel = get('hover-selector');
  if (hsel) {
    try {
      const loc = page.locator(hsel).first();
      const box0 = await loc.boundingBox();
      if (box0 && (box0.y < 0 || box0.y + box0.height > vp.height)) {
        await page.evaluate((y) => window.scrollTo(0, y), Math.max(0, (await page.evaluate(() => window.scrollY)) + box0.y - vp.height / 2 + box0.height / 2));
        await page.waitForTimeout(900);
      }
      const box = await loc.boundingBox();
      if (box) { await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 12 }); await page.waitForTimeout(700); }
      else logs.push(`[hover-selector] not visible: ${hsel}`);
    } catch (e) { logs.push(`[hover-selector] ${e.message}`); }
  }
  const file = path.join(outDir, `${name}-${vpArg}${has('reduced-motion') ? '-rm' : ''}-${suffix}.png`);
  const sel = get('selector');
  if (sel) await page.locator(sel).first().screenshot({ path: file });
  else await page.screenshot({ path: file, fullPage: has('full') });
  saved.push(file);
};

const t0 = Date.now();
try {
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 60000 });
} catch (e) { logs.push(`[goto] ${e.message}`); }
// Evaluate as an async expression first (so its value comes back), else as async statements.
const runEval = async (label, js) => {
  try {
    let r;
    try { r = await page.evaluate(`(async () => (${js}))()`); }
    catch (e) { if (!/SyntaxError|Unexpected/i.test(e.message)) throw e; r = await page.evaluate(`(async () => { ${js} })()`); }
    if (r !== undefined) console.log(`${label}:`, JSON.stringify(r));
  } catch (e) { logs.push(`[${label.toLowerCase()}] ${String(e.message).split(/\r?\n/)[0]}`); }
};
const evalJs = get('eval');
if (evalJs) await runEval('EVAL', evalJs);
const clickSel = get('click');
const keys = get('keys');
const preActions = async () => {
  if (clickSel) {
    try { await page.locator(clickSel).first().click({ timeout: 5000 }); await page.waitForTimeout(Number(get('after-click', 1200))); }
    catch (e) { logs.push(`[click] ${e.message.split('\n')[0]}`); }
  }
  if (keys) {
    for (const k of keys.split(',')) { await page.keyboard.press(k.trim()); await page.waitForTimeout(120); }
    await page.waitForTimeout(400);
  }
};

const frames = get('frames');
if (frames) {
  for (const f of frames.split(',').map(Number)) {
    const dt = f - (Date.now() - t0);
    if (dt > 0) await page.waitForTimeout(dt);
    await snap(`t${String(f).padStart(5, '0')}`);
  }
} else {
  await page.waitForTimeout(wait);
  await preActions();
  const scroll = get('scroll');
  if (scroll) {
    let ys;
    if (scroll.startsWith('steps:')) {
      const n = Number(scroll.split(':')[1]) || 5;
      const total = await page.evaluate(() => document.documentElement.scrollHeight - innerHeight);
      ys = Array.from({ length: n }, (_, i) => Math.round((total * i) / Math.max(1, n - 1)));
    } else ys = scroll.split(',').map(Number);
    let current = 0;
    for (const y of ys) {
      if (has('wheel')) {
        await page.mouse.move(vp.width / 2, vp.height / 2);
        let delta = y - current;
        while (Math.abs(delta) > 0) {
          const step = Math.sign(delta) * Math.min(Math.abs(delta), 120);
          await page.mouse.wheel(0, step);
          delta -= step;
          await page.waitForTimeout(16);
        }
        current = y;
      } else {
        await page.evaluate((yy) => window.scrollTo(0, yy), y);
      }
      await page.waitForTimeout(settle);
      await snap(`y${String(y).padStart(5, '0')}`);
    }
  } else {
    await snap('view');
  }
}

const evalAfter = get('eval-after');
if (evalAfter) await runEval('EVAL-AFTER', evalAfter);

const metrics = await page.evaluate(() => ({
  scrollHeight: document.documentElement.scrollHeight,
  scrollY: window.scrollY,
  webgl: (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })(),
  canvases: document.querySelectorAll('canvas').length,
  title: document.title,
  horizontalOverflow: document.documentElement.scrollWidth > innerWidth + 1 ? document.documentElement.scrollWidth : false,
})).catch(() => ({}));

console.log('SAVED:\n' + saved.join('\n'));
console.log('METRICS:', JSON.stringify(metrics));
console.log(logs.length ? 'LOGS:\n' + [...new Set(logs)].slice(0, 40).join('\n') : 'LOGS: none');
await browser.close();
