// Re-check of two fixes: the cursor over the checked view tab, and the phone journey rail on a
// case study. (The keycap check went with the 3D keyboard; the stack section is verify-stack.mjs.)
import fs from 'node:fs';
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || OUT_DIR;
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'] });

async function ctx(opts) {
  const context = await browser.newContext(opts);
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem('pmp:intro-seen', '1');
    } catch {}
  });
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(String(e.message).slice(0, 200)));
  page.on('console', (m) => m.type() === 'error' && errs.push(m.text().slice(0, 200)));
  return { context, page, errs };
}

// 1. cursor after clicking the Architecture tab (pointer stays on it)
{
  const { context, page, errs } = await ctx({ viewport: { width: 1440, height: 900 } });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await sleep(3500);
  await page.evaluate(() => {
    const el = document.querySelector('[data-qa=work-stage-window]');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 200);
  });
  await sleep(2000);
  const tab = await page.$('[data-qa=work-view-architecture]');
  const b = await tab.boundingBox();
  await page.mouse.move(b.x + b.width / 2 - 6, b.y + b.height / 2 - 2, { steps: 4 });
  await sleep(500);
  const before = await page.evaluate(() => document.querySelector('[data-qa=cursor]').dataset.mode);
  await page.mouse.down();
  await page.mouse.up();
  await sleep(900);
  const after = await page.evaluate(() => document.querySelector('[data-qa=cursor]').dataset.mode);
  log('cursor mode on the tab: before click', before, '-> after click', after, '(want hover -> hidden)');
  await page.screenshot({ path: `${OUT}/R-cursor-tab.png`, clip: { x: b.x - 260, y: b.y - 30, width: 420, height: 110 } });
  // and back on the other (unchecked) tab
  const other = await (await page.$('[data-qa=work-view-interface]')).boundingBox();
  await page.mouse.move(other.x + other.width / 2, other.y + other.height / 2, { steps: 4 });
  await sleep(500);
  log('cursor mode on the unchecked tab:', await page.evaluate(() => document.querySelector('[data-qa=cursor]').dataset.mode), '(want hover)');
  log('errors:', errs.length ? errs : 'none');
  await context.close();
}

// 2. phone: case-study journey rail mid-way
{
  const { context, page, errs } = await ctx({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1',
  });
  await page.goto(BASE + '/work/drone-intelligence/', { waitUntil: 'load' });
  await sleep(3000);
  const top = await page.evaluate(() => {
    const el = document.querySelector('[data-qa=journey]');
    return el.getBoundingClientRect().top + window.scrollY;
  });
  for (const [i, dy] of [[1, 250], [2, 900], [3, 1500]]) {
    await page.evaluate((y) => window.scrollTo(0, y), top + dy);
    await sleep(1500);
    const st = await page.evaluate(() => {
      const j = document.querySelector('[data-qa=journey]');
      return { mode: j.dataset.journeyMode, reached: j.dataset.reached };
    });
    log(`phone journey @+${dy}`, st);
    await page.screenshot({ path: `${OUT}/R-phone-journey-${i}.png` });
  }
  log('errors:', errs.length ? errs : 'none');
  await context.close();
}
await browser.close();
log('done');
