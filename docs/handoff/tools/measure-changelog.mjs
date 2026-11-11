// Measures the changelog cards (the free space under the highlights in each role card) and shoots them.
//   node measure-changelog.mjs [desktop,laptop,tablet,mobile | all]
// BASE picks the server (default http://localhost:3000); screenshots go to ./.out/changelog unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:3000';
const OUT = process.env.OUT || `${OUT_DIR}/changelog`;
fs.mkdirSync(OUT, { recursive: true });
const only = (process.argv[2] || 'all').split(',');
const want = (k) => only.includes('all') || only.includes(k);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
const browser = await chromium.launch({ channel: 'msedge', headless: true });

const VPS = {
  desktop: { viewport: { width: 1440, height: 900 } },
  laptop: { viewport: { width: 1280, height: 800 } },
  tablet: { viewport: { width: 834, height: 1194 }, isMobile: true, hasTouch: true },
  mobile: { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true },
};

for (const [name, opts] of Object.entries(VPS)) {
  if (!want(name)) continue;
  const context = await browser.newContext(opts);
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem('pmp:intro-seen', '1');
    } catch {}
  });
  const page = await context.newPage();
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(2000);
  const top = await page.evaluate(() => document.querySelector('#changelog').getBoundingClientRect().top + window.scrollY);
  const bottom = await page.evaluate(() => document.querySelector('#changelog').getBoundingClientRect().bottom + window.scrollY);
  for (let y = top - 900; y <= bottom; y += 300) {
    await page.evaluate((v) => window.scrollTo(0, v), y);
    await sleep(120);
  }
  await sleep(1200);
  const info = await page.evaluate(() =>
    [...document.querySelectorAll('#changelog [data-card]')].map((card) => {
      const r = card.getBoundingClientRect();
      const grid = card.querySelector('.grid');
      const cols = grid ? [...grid.children].map((c) => Math.round(c.getBoundingClientRect().height)) : [];
      const colW = grid ? [...grid.children].map((c) => Math.round(c.getBoundingClientRect().width)) : [];
      const h3 = card.querySelector('h3')?.textContent;
      return { h3, w: Math.round(r.width), h: Math.round(r.height), cols, colW };
    }),
  );
  log(`== ${name}`, JSON.stringify(info));
  await page.addStyleTag({ content: 'header{visibility:hidden!important}a[href="#main"],[data-qa=cursor]{display:none!important}' });
  const cards = await page.$$('#changelog [data-commit]');
  for (let i = 0; i < cards.length; i++) {
    await cards[i].scrollIntoViewIfNeeded();
    await sleep(250);
    await cards[i].screenshot({ path: `${OUT}/${name}-${i}.png` });
  }
  await context.close();
}
await browser.close();
