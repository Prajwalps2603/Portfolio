// verify-stamps.mjs: every page, scrolled through: which stamps exist and what they say (only the port's ship may say SHIPPED).
import { chromium } from 'playwright-core';
const BASE = process.env.BASE || 'http://localhost:4173';
const PAGES = ['/', '/work/drone-intelligence/', '/work/audify-ai/', '/resume/', '/repos/', '/pull-request/'];
const b = await chromium.launch({ channel: 'msedge', headless: true });
const errs = [];
let bad = 0;
for (const [vp, mobile] of [[{ width: 1440, height: 900 }, false], [{ width: 390, height: 844 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
  await ctx.addInitScript(() => { sessionStorage.setItem('pmp:intro-seen', '1'); sessionStorage.setItem('pmp:card-popup', '1'); localStorage.setItem('pmp:lite', '0'); });
  for (const path of PAGES) {
    const p = await ctx.newPage();
    p.on('pageerror', (e) => errs.push(`${path}: ${e.message}`));
    p.on('console', (m) => m.type() === 'error' && errs.push(`${path}: ${m.text()}`));
    await p.goto(`${BASE}${path}`, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1500));
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 450) { await p.evaluate((y) => scrollTo(0, y), y); await new Promise((r) => setTimeout(r, 220)); }
    await new Promise((r) => setTimeout(r, 1500));
    const found = await p.evaluate(() => {
      const stamps = [...document.querySelectorAll('[data-stamp]')].map((el) => ({
        label: (el.textContent || '').trim(),
        where: el.closest('[data-qa]')?.getAttribute('data-qa') || el.closest('section')?.id || '?',
      }));
      // any rendered text node saying SHIPPED (case-insensitive word "shipped" in a stamp-like uppercase form)
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const upper = [];
      for (let n = walker.nextNode(); n; n = walker.nextNode()) {
        const t = n.textContent || '';
        if (/\bSHIPPED\b/.test(t) || (/\bshipped\b/i.test(t) && n.parentElement && getComputedStyle(n.parentElement).textTransform === 'uppercase')) {
          upper.push({ text: t.trim().slice(0, 40), where: n.parentElement?.closest('[data-qa]')?.getAttribute('data-qa') || n.parentElement?.closest('section')?.id || '?' });
        }
      }
      return { stamps, upper };
    });
    const offending = found.stamps.filter((s) => /shipped/i.test(s.label) && !/port/.test(s.where));
    const offendingText = found.upper.filter((u) => !/port/.test(u.where));
    if (offending.length || offendingText.length) bad++;
    console.log(`${mobile ? 'mobile ' : 'desktop'} ${path}`, JSON.stringify(found), offending.length || offendingText.length ? '  <-- NOT ALLOWED' : '');
    await p.close();
  }
  await ctx.close();
}
console.log('errors', errs.length ? [...new Set(errs)].slice(0, 10) : 'none');
console.log(bad ? `FAIL: ${bad} page(s) with a SHIPPED stamp outside the port` : 'ok: SHIPPED only on the port ship');
await b.close();
process.exit(bad ? 1 : 0);
