// Light and dark mode: the header's sun/moon (desktop and phone) switches the theme and remembers
// it; a reload is already in the chosen theme when the page is parsed (no flash); with no choice the
// computer's setting decides (and a choice beats it); the palette's command switches it; sketch mode
// stays the paper drawing in dark; the newspaper keeps its cream paper; 0 console errors.
//   node verify-theme.mjs        BASE defaults to http://localhost:4173; screenshots in ./.out/theme
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = `${OUT_DIR}/theme`;
fs.mkdirSync(OUT, { recursive: true });
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(a.join(' '));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let failures = 0;
const expect = (ok, what) => {
  if (!ok) failures++;
  log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`);
};
const theme = (p) => p.evaluate(() => document.documentElement.getAttribute('data-theme') || 'light');
const pageBg = (p) => p.evaluate(() => getComputedStyle(document.documentElement).backgroundColor);
async function open({ scheme = 'light', mobile = false, init = '' } = {}) {
  const ctx = await browser.newContext({ viewport: mobile ? { width: 390, height: 844 } : { width: 1440, height: 900 }, isMobile: mobile, hasTouch: mobile, colorScheme: scheme, reducedMotion: 'reduce' });
  await ctx.addInitScript((init) => {
    if (sessionStorage.getItem('__init')) return;
    sessionStorage.setItem('__init', '1');
    sessionStorage.setItem('pmp:intro-seen', '1');
    sessionStorage.setItem('pmp:card-popup', '1');
    localStorage.setItem('pmp:lite', '0');
    if (init) eval(init);
  }, init);
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
  return { ctx, p, errs };
}

log('== THE SWITCH (desktop)');
{
  const { ctx, p, errs } = await open();
  await p.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(1200);
  expect((await theme(p)) === 'light', 'starts light (computer set to light)');
  const btn = await p.$('[data-qa=theme-toggle]');
  expect(!!btn && (await btn.getAttribute('aria-label')) === 'Dark mode' && (await btn.getAttribute('aria-pressed')) === 'false', 'the header has the switch (aria-pressed false)');
  await btn.click();
  await sleep(500);
  expect((await theme(p)) === 'dark' && (await btn.getAttribute('aria-pressed')) === 'true', 'a click turns dark mode on');
  expect((await p.evaluate(() => localStorage.getItem('pmp:theme'))) === 'dark', 'and remembers it');
  expect((await pageBg(p)) === 'rgb(17, 17, 15)', `the page is dark (${await pageBg(p)})`);
  expect((await p.evaluate(() => document.querySelector('meta[name="theme-color"]')?.content)) === '#11110f', 'the browser bar colour follows');
  await p.screenshot({ path: `${OUT}/dark.png` });
  // reload: dark when the document is parsed (the boot script), so no light flash
  await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  expect((await theme(p)) === 'dark', 'a reload is dark from the first paint');
  await sleep(800);
  await p.click('[data-qa=theme-toggle]');
  await sleep(500);
  expect((await theme(p)) === 'light' && (await p.evaluate(() => localStorage.getItem('pmp:theme'))) === 'light', 'clicking again: light, remembered');
  log(`  errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  if (errs.length) failures++;
  await ctx.close();
}

log('== THE COMPUTER\'S SETTING');
{
  const { ctx, p } = await open({ scheme: 'dark' });
  await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  expect((await theme(p)) === 'dark', 'computer set to dark, no choice: dark from the first paint');
  await sleep(800);
  await p.emulateMedia({ colorScheme: 'light' });
  await sleep(400);
  expect((await theme(p)) === 'light', 'it follows the computer live while there is no choice');
  await ctx.close();
}
{
  const { ctx, p } = await open({ scheme: 'dark', init: "localStorage.setItem('pmp:theme','light')" });
  await p.goto(`${BASE}/`, { waitUntil: 'domcontentloaded' });
  expect((await theme(p)) === 'light', 'a choice (light) beats the computer (dark)');
  await sleep(800);
  await p.emulateMedia({ colorScheme: 'dark' });
  await sleep(400);
  expect((await theme(p)) === 'light', 'and stays when the computer changes');
  await ctx.close();
}

log('== THE PALETTE, SKETCH MODE, THE NEWSPAPER');
{
  const { ctx, p, errs } = await open();
  await p.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(1200);
  await p.keyboard.press('Control+k');
  await sleep(500);
  await p.keyboard.type('dark mode');
  await sleep(300);
  await p.keyboard.press('Enter');
  await sleep(900);
  expect((await theme(p)) === 'dark', 'the palette turns dark mode on');
  // sketch mode in dark: the paper drawing
  await p.click('button[aria-label="Sketch mode"]');
  await sleep(1500);
  const sk = await p.evaluate(() => ({ sketch: document.documentElement.hasAttribute('data-sketch'), ink: getComputedStyle(document.body).color }));
  expect(sk.sketch && (await pageBg(p)) !== 'rgb(17, 17, 15)', `sketch mode stays paper in dark (${await pageBg(p)})`);
  await p.screenshot({ path: `${OUT}/dark-sketch.png` });
  await p.click('button[aria-label="Sketch mode"]');
  await sleep(1500);
  await p.goto(`${BASE}/resume/`, { waitUntil: 'load' });
  await sleep(1000);
  const paper = await p.evaluate(() => getComputedStyle(document.querySelector('.times-paper')).backgroundColor);
  expect(paper === 'rgb(245, 239, 225)', `the newspaper keeps its cream paper in dark (${paper})`);
  log(`  errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  if (errs.length) failures++;
  await ctx.close();
}

log('== PHONE');
{
  const { ctx, p, errs } = await open({ mobile: true });
  await p.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(1200);
  const box = await (await p.$('[data-qa=theme-toggle]'))?.boundingBox();
  expect(!!box && box.width >= 44 && box.height >= 44, 'the switch is in the phone header (44px)');
  await p.tap('[data-qa=theme-toggle]');
  await sleep(500);
  expect((await theme(p)) === 'dark', 'a tap turns dark mode on');
  const fits = await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 1);
  expect(fits, 'no sideways scroll');
  await p.screenshot({ path: `${OUT}/phone-dark.png` });
  log(`  errors: ${errs.length ? errs.join(' | ') : 'none'}`);
  if (errs.length) failures++;
  await ctx.close();
}

await browser.close();
log(failures ? `done: ${failures} failure(s)` : 'done: all ok');
process.exitCode = failures ? 1 : 0;
