// verify-mobile.mjs: phones (his ask, 2026-11-10 "fix the mobile view").
//  1. header: every action (theme, sketch, terminal, menu) is inside the screen at 320-600px, with
//     the same margin as the left (the row used to run off the right edge at 320-375 and 400-430);
//  2. the newspaper (/resume): the paper is straight and centred from top to bottom on phones (its
//     0.35deg tilt pushed a ~6000px paper onto the screen's edges), and its fold line is off there;
//  3. the phone menu's "Open the terminal" closes the menu and opens the palette;
//  4. no page scrolls sideways at 330px.
// Exits 1 on a failure.
import { chromium } from 'playwright-core';
const BASE = process.env.BASE || 'http://localhost:4173';
const b = await chromium.launch({ channel: 'msedge', headless: true });
let fails = 0;
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails++; };
const open = async (w, h = 760) => {
  const ctx = await b.newContext({ viewport: { width: w, height: h }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { sessionStorage.setItem('pmp:intro-seen', '1'); sessionStorage.setItem('pmp:card-popup', '1'); });
  return { ctx, p: await ctx.newPage() };
};

console.log('== header');
for (const path of ['/', '/resume/']) {
  for (const w of [320, 340, 360, 375, 390, 400, 414, 430, 480, 600]) {
    const { ctx, p } = await open(w);
    await p.goto(`${BASE}${path}`, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 900));
    const m = await p.evaluate(() => {
      const vw = document.documentElement.clientWidth;
      const items = [...document.querySelectorAll('header a, header button')].filter((e) => { const r = e.getBoundingClientRect(); return r.width > 0 && r.height > 0; });
      const L = Math.min(...items.map((e) => e.getBoundingClientRect().left));
      const R = Math.max(...items.map((e) => e.getBoundingClientRect().right));
      const small = items.filter((e) => e.matches('[data-qa=theme-toggle],[data-qa=sketch-toggle],[data-qa=palette-trigger],[data-qa=menu-toggle]') && e.getBoundingClientRect().height < 43.5);
      return { vw, left: Math.round(L), right: Math.round(vw - R), small: small.length };
    });
    check(m.right >= m.left - 1 && m.right <= m.left + 1 && m.small === 0, `${path} ${w}px: actions inside, margins ${m.left}|${m.right}${m.small ? `, ${m.small} button(s) under 44px` : ''}`);
    await ctx.close();
  }
}

console.log('== newspaper on phones');
for (const w of [330, 360, 390, 430]) {
  const { ctx, p } = await open(w);
  await p.goto(`${BASE}/resume/`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 900));
  const gaps = [];
  for (const f of [0, 0.5, 0.92]) {
    await p.evaluate((f) => scrollTo(0, Math.round((document.documentElement.scrollHeight - innerHeight) * f)), f);
    await new Promise((r) => setTimeout(r, 300));
    gaps.push(await p.evaluate(() => {
      const el = document.querySelector('.times-paper');
      const vw = document.documentElement.clientWidth, y = innerHeight / 2;
      let L = null, R = null;
      for (let x = 0; x < vw; x++) { const t = document.elementFromPoint(x, y); if (t && el.contains(t)) { L = x; break; } }
      for (let x = vw - 1; x >= 0; x--) { const t = document.elementFromPoint(x, y); if (t && el.contains(t)) { R = vw - 1 - x; break; } }
      return [L, R];
    }));
  }
  const fold = await p.evaluate(() => [...document.querySelectorAll('.times-paper > span[aria-hidden]')].filter((s) => getComputedStyle(s).display !== 'none' && s.getBoundingClientRect().height <= 1.5).length);
  check(gaps.every(([l, r]) => l != null && r != null && Math.abs(l - r) <= 2 && l >= 8), `${w}px: paper centred top/middle/bottom (${gaps.map((g) => g.join('|')).join('  ')})`);
  check(fold === 0, `${w}px: no fold line across the text`);
  await ctx.close();
}

console.log('== phone menu');
{
  const { ctx, p } = await open(360);
  await p.goto(`${BASE}/`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 900));
  await p.tap('[data-qa=menu-toggle]');
  await new Promise((r) => setTimeout(r, 800));
  await p.tap('[data-qa=menu-terminal]');
  await new Promise((r) => setTimeout(r, 1000));
  const st = await p.evaluate(() => ({ menu: document.querySelector('[data-qa=menu-toggle]')?.getAttribute('aria-expanded'), dialog: !!document.querySelector('[aria-modal="true"]') }));
  check(st.menu === 'false' && st.dialog, `"Open the terminal" closes the menu and opens the palette (${JSON.stringify(st)})`);
  await ctx.close();
}

console.log('== no sideways scroll at 330px');
for (const path of ['/', '/work/drone-intelligence/', '/work/audify-ai/', '/resume/', '/repos/', '/pull-request/']) {
  const { ctx, p } = await open(330);
  await p.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 900));
  let worst = 0;
  const H = await p.evaluate(() => document.documentElement.scrollHeight);
  for (let y = 0; y < H; y += 1400) {
    await p.evaluate((y) => scrollTo(0, y), y);
    await new Promise((r) => setTimeout(r, 120));
    worst = Math.max(worst, await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
  }
  check(worst <= 0, `${path}: page width fits (${worst}px over)`);
  await ctx.close();
}

await b.close();
console.log(fails ? `FAIL: ${fails}` : 'ok: phones');
process.exit(fails ? 1 : 0);
