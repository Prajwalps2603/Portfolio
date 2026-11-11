// Checks the "My stack, all the way down" section (the iceberg dive) on the production export.
//   node verify-stack.mjs [desktop,mobile,reduced,sketch | all]
// BASE picks the server (default http://localhost:4173); screenshots go to ./.out/stack unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || `${OUT_DIR}/stack`;
const REVIEW = process.env.REVIEW || null; // also copy desktop.png / mobile.png here (the design review)
fs.mkdirSync(OUT, { recursive: true });
if (REVIEW) fs.mkdirSync(REVIEW, { recursive: true });
const only = (process.argv[2] || 'all').split(',');
const want = (k) => only.includes('all') || only.includes(k);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';

async function open(opts, { sketch = false } = {}) {
  const context = await browser.newContext(opts);
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
  page.on('requestfailed', (r) => {
    const t = r.failure()?.errorText || '';
    if (!t.includes('ABORTED')) errs.push(`[failed] ${r.url()} ${t}`);
  });
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(2500);
  return { context, page, errs };
}

const stackTop = (page) => page.evaluate(() => document.getElementById('stack').getBoundingClientRect().top + window.scrollY);

/** Scroll down through the section the way a reader would, so every layer's dive plays. */
async function dive(page, step) {
  const top = await stackTop(page);
  const h = await page.evaluate(() => document.getElementById('stack').offsetHeight);
  for (let y = top - 200; y <= top + h; y += step) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(380);
  }
  await sleep(2200);
}

const state = (page) =>
  page.evaluate(() => {
    const art = document.querySelector('[data-qa=stack-art]');
    const groups = [...document.querySelectorAll('[data-art-layer]')].map((g) => `${g.getAttribute('data-art-layer')}:${g.getAttribute('data-shipped') || '-'}`);
    const tools = [...document.querySelectorAll('[data-qa=stack-tool]')];
    const hidden = tools.filter((t) => parseFloat(getComputedStyle(t).opacity) < 0.99).length;
    return { artReady: art?.getAttribute('data-ready'), groups, tools: tools.length, hiddenTools: hidden, cards: [...document.querySelectorAll('[data-qa=stack-card]')].map((c) => c.getAttribute('data-tool')) };
  });

async function shotSection(page, name, review) {
  // a tall element capture would paint the fixed header (and the skip link) mid-section: hide both
  await page.addStyleTag({ content: 'header{visibility:hidden!important}a[href="#main"],[data-qa=cursor]{display:none!important}', }).then((h) => h.evaluate((n) => n.setAttribute('data-capture', '')));
  const el = await page.$('#stack');
  await el.screenshot({ path: `${OUT}/${name}.png` });
  await page.evaluate(() => document.querySelectorAll('style[data-capture]').forEach((n) => n.remove()));
  if (REVIEW && review) fs.copyFileSync(`${OUT}/${name}.png`, `${REVIEW}/${review}`);
  log('  shot', name);
}

async function clickTool(page, id) {
  const b = await page.$(`[data-tool="${id}"][data-qa=stack-tool]`);
  await b.scrollIntoViewIfNeeded();
  await sleep(300);
  await b.click();
  await sleep(700);
  return page.evaluate((t) => {
    const card = document.querySelector(`[data-qa=stack-card][data-tool="${t}"]`);
    const btn = document.querySelector(`[data-qa=stack-tool][data-tool="${t}"]`);
    return { open: !!card, expanded: btn?.getAttribute('aria-expanded'), rows: card ? card.querySelectorAll('li').length : 0, text: card ? card.innerText.replace(/\s+/g, ' ').slice(0, 160) : null };
  }, id);
}

if (want('desktop')) {
  log('== DESKTOP 1440x900');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  const top = await stackTop(page);
  await page.evaluate((v) => window.scrollTo(0, v), top);
  await sleep(3200);
  await page.screenshot({ path: `${OUT}/D-01-first-viewport.png` });
  log('  first viewport', await state(page));
  await dive(page, 320);
  log('  after the dive', await state(page));
  await shotSection(page, 'D-02-section', 'desktop.png');
  log('  React 19', await clickTool(page, 'react-19'));
  log('  Spring Boot', await clickTool(page, 'spring-boot'));
  await page.screenshot({ path: `${OUT}/D-03-card-spring.png` });
  log('  Python', await clickTool(page, 'python'));
  await page.screenshot({ path: `${OUT}/D-04-card-python.png` });
  log('  Bootstrap (no project)', await clickTool(page, 'bootstrap'));
  // Esc closes the open card of the focused layer and returns focus to its tool
  await page.focus('[data-qa=stack-tool][data-tool="bootstrap"]');
  await page.keyboard.press('Escape');
  await sleep(500);
  log('  after Esc', await page.evaluate(() => ({ focus: document.activeElement?.getAttribute('data-tool'), bootstrapCard: !!document.querySelector('[data-qa=stack-card][data-tool="bootstrap"]') })));
  // type-ahead (focus is still inside the dive, on Bootstrap): F opens + focuses Framer Motion,
  // F again FastAPI; Esc then closes FastAPI's card and keeps focus on it. Outside the dive a
  // letter does nothing (WCAG 2.1.4).
  const cards = () => page.evaluate(() => ({ focus: document.activeElement?.getAttribute('data-tool'), open: [...document.querySelectorAll('[data-qa=stack-card]')].map((c) => c.getAttribute('data-tool')) }));
  await page.keyboard.press('f');
  await sleep(1400);
  const f1 = await cards();
  await page.keyboard.press('f');
  await sleep(1400);
  const f2 = await cards();
  await page.keyboard.press('Escape');
  await sleep(600);
  const f3 = await cards();
  log('  type-ahead F, F, Esc ->', f1, f2, f3);
  await page.evaluate(() => document.activeElement?.blur());
  await page.keyboard.press('j');
  await sleep(600);
  log('  a letter with focus outside the dive opens nothing:', (await cards()).open);
  await shotSection(page, 'D-05-section-cards-open', null);
  log('  [desktop] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('mobile')) {
  log('== MOBILE 390x844');
  const { context, page, errs } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, userAgent: IPHONE });
  const top = await stackTop(page);
  await page.evaluate((v) => window.scrollTo(0, v), top);
  await sleep(3000);
  await page.screenshot({ path: `${OUT}/M-01-first-viewport.png` });
  await dive(page, 260);
  log('  after the dive', await state(page));
  log('  section height', await page.evaluate(() => document.getElementById('stack').offsetHeight), 'page height', await page.evaluate(() => document.documentElement.scrollHeight));
  await shotSection(page, 'M-02-section', 'mobile.png');
  const b = await page.$('[data-tool="fastapi"][data-qa=stack-tool]');
  await b.scrollIntoViewIfNeeded();
  await sleep(300);
  await b.tap();
  await sleep(800);
  await page.screenshot({ path: `${OUT}/M-03-card-fastapi.png` });
  log('  FastAPI tap', await page.evaluate(() => !!document.querySelector('[data-qa=stack-card][data-tool="fastapi"]')));
  log('  [mobile] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('tablet')) {
  log('== TABLET 834x1194');
  const { context, page, errs } = await open({ viewport: { width: 834, height: 1194 }, isMobile: true, hasTouch: true });
  const top = await stackTop(page);
  await page.evaluate((v) => window.scrollTo(0, v), top);
  await sleep(3000);
  await page.screenshot({ path: `${OUT}/T-01-first-viewport.png` });
  await dive(page, 320);
  log('  after the dive', await state(page));
  await shotSection(page, 'T-02-section', null);
  log('  [tablet] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('reduced')) {
  log('== REDUCED MOTION 1440x900');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
  const top = await stackTop(page);
  await page.evaluate((v) => window.scrollTo(0, v + 400), top);
  await sleep(1500);
  await page.screenshot({ path: `${OUT}/R-01-viewport.png` });
  log('  state', await state(page));
  log('  [reduced] errors:', errs.length ? errs : 'none');
  await context.close();
}

if (want('sketch')) {
  log('== SKETCH MODE 1440x900');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } }, { sketch: true });
  const top = await stackTop(page);
  await page.evaluate((v) => window.scrollTo(0, v), top);
  await sleep(1800);
  await page.screenshot({ path: `${OUT}/K-01-first-viewport.png` });
  await page.evaluate((v) => window.scrollTo(0, v + 900), top);
  await sleep(1200);
  await page.screenshot({ path: `${OUT}/K-02-sea.png` });
  log('  sketch on:', await page.evaluate(() => document.documentElement.hasAttribute('data-sketch')), await state(page));
  log('  [sketch] errors:', errs.length ? errs : 'none');
  await context.close();
}

await browser.close();
log('done');
