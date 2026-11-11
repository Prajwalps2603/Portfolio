// verify-release.mjs: the GitHub Pages build, served strictly under /Portfolio (the release check).
// First: `npm run build:pages`, then
//   `MSYS_NO_PATHCONV=1 NEXT_PUBLIC_BASE_PATH=/Portfolio PORT=4174 node scripts/serve.mjs`.
// Every page on desktop and phone: no console errors, no failed requests (the 404 page's own 404 and
// cancelled prefetches aside), no sideways scroll; every /Portfolio/_next asset in the HTML is 200;
// links stay under /Portfolio; og:image is the absolute Pages URL; the palette, sketch mode, the
// puzzle and the phone menu work through the base path. Afterwards run `npm run build` so `out/`
// holds the root export again (the :4173 preview). Exits 1 on a failure.
import { chromium } from 'playwright-core';
const ORIGIN = process.env.ORIGIN || 'http://localhost:4174';
const BP = '/Portfolio';
const PAGES = ['/', '/work/drone-intelligence/', '/work/audify-ai/', '/work/resumai/', '/resume/', '/repos/', '/pull-request/'];
let fails = 0;
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails++; };
const b = await chromium.launch({ channel: 'msedge', headless: true });

console.log('== assets and links in the HTML');
for (const path of PAGES) {
  const html = await (await fetch(`${ORIGIN}${BP}${path}`)).text();
  const assets = [...new Set([...html.matchAll(/(?:src|href)="(\/Portfolio\/_next\/[^"]+)"/g)].map((m) => m[1]))];
  const bad = [];
  for (const a of assets) { const r = await fetch(`${ORIGIN}${a}`); if (r.status !== 200) bad.push(`${r.status} ${a}`); }
  const rootLinks = [...html.matchAll(/href="(\/(?!Portfolio\/|Portfolio")[^"]*)"/g)].map((m) => m[1]).filter((h) => !h.startsWith('//'));
  const og = (/<meta property="og:image" content="([^"]+)"/.exec(html) || [])[1];
  check(!bad.length, `${path}: ${assets.length} assets, all 200${bad.length ? ' -- ' + bad.slice(0, 3).join(', ') : ''}`);
  check(!rootLinks.length, `${path}: every link stays under /Portfolio${rootLinks.length ? ' -- ' + rootLinks.slice(0, 4).join(', ') : ''}`);
  check(og === 'https://prajwalps2603.github.io/Portfolio/og.png', `${path}: og:image ${og}`);
}
{
  const r = await fetch(`${ORIGIN}${BP}/og.png`);
  check(r.status === 200 && (r.headers.get('content-type') || '').includes('image/png'), `og.png serves (${r.status})`);
}

console.log('== every page in a browser');
for (const [vp, mobile] of [[{ width: 1440, height: 900 }, false], [{ width: 390, height: 844 }, true]]) {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile });
  await ctx.addInitScript(() => { sessionStorage.setItem('pmp:intro-seen', '1'); sessionStorage.setItem('pmp:card-popup', '1'); });
  for (const path of [...PAGES, '/no-such-page/']) {
    const p = await ctx.newPage();
    const errs = [];
    const failed = [];
    p.on('pageerror', (e) => errs.push(e.message));
    p.on('console', (m) => { if (m.type() === 'error' && !/status of 404/.test(m.text())) errs.push(m.text()); });
    p.on('requestfailed', (r) => { const f = r.failure()?.errorText || ''; if (!/ERR_ABORTED/.test(f)) failed.push(`${f} ${r.url()}`); });
    p.on('response', (r) => { if (r.status() >= 400 && !r.url().endsWith('/no-such-page/')) failed.push(`${r.status()} ${r.url()}`); });
    const resp = await p.goto(`${ORIGIN}${BP}${path}`, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1200));
    const H = await p.evaluate(() => document.documentElement.scrollHeight);
    let over = 0;
    for (let y = 0; y < H; y += 900) {
      await p.evaluate((y) => scrollTo(0, y), y);
      await new Promise((r) => setTimeout(r, 150));
      over = Math.max(over, await p.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth));
    }
    await new Promise((r) => setTimeout(r, 600));
    const tag = `${mobile ? 'phone  ' : 'desktop'} ${path}`;
    if (path === '/no-such-page/') check(resp.status() === 404 && !errs.length, `${tag}: the 404 page (${resp.status()})`);
    else check(resp.status() === 200 && !errs.length && !failed.length && over <= 0, `${tag}: ${resp.status()}, ${errs.length} errors, ${failed.length} failed requests, ${over}px sideways${errs.length ? ' -- ' + errs[0].slice(0, 140) : ''}${failed.length ? ' -- ' + failed[0].slice(0, 140) : ''}`);
    await p.close();
  }
  await ctx.close();
}

console.log('== features through the base path');
{
  const ctx = await b.newContext({ viewport: { width: 1440, height: 900 } });
  await ctx.addInitScript(() => { sessionStorage.setItem('pmp:intro-seen', '1'); sessionStorage.setItem('pmp:card-popup', '1'); });
  const p = await ctx.newPage();
  const errs = [];
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${ORIGIN}${BP}/`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 1500));
  await p.keyboard.press('Control+k');
  await new Promise((r) => setTimeout(r, 1000));
  check(await p.evaluate(() => !!document.querySelector('[aria-modal="true"]')), 'the command palette opens (its lazy chunk loads through /Portfolio)');
  await p.keyboard.press('Escape');
  await new Promise((r) => setTimeout(r, 400));
  await p.click('[data-qa=sketch-toggle]');
  await new Promise((r) => setTimeout(r, 1800));
  check(await p.evaluate(() => document.documentElement.hasAttribute('data-sketch')), 'sketch mode turns on');
  await p.click('[data-qa=sketch-toggle]');
  await new Promise((r) => setTimeout(r, 1500));
  const times = await p.getAttribute('[data-qa=header-times]', 'href');
  check(times === '/Portfolio/resume/' || times === '/Portfolio/resume', `"Prajwal Times" points under /Portfolio (${times})`);
  await p.goto(`${ORIGIN}${BP}/resume/`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 1000));
  await p.$eval('[data-qa=times-puzzle]', (e) => e.scrollIntoView({ block: 'center' }));
  await p.click('[data-qa=times-solve]');
  await new Promise((r) => setTimeout(r, 300));
  check(/backtracking: \d+ tries/.test(await p.$eval('[data-qa=times-puzzle] [role=status]', (e) => e.textContent)), 'the puzzle solves');
  check(!errs.length, `no page errors${errs.length ? ': ' + errs[0] : ''}`);
  await ctx.close();
}
{
  const ctx = await b.newContext({ viewport: { width: 360, height: 760 }, isMobile: true, hasTouch: true });
  await ctx.addInitScript(() => { sessionStorage.setItem('pmp:intro-seen', '1'); sessionStorage.setItem('pmp:card-popup', '1'); });
  const p = await ctx.newPage();
  await p.goto(`${ORIGIN}${BP}/`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 1000));
  await p.tap('[data-qa=menu-toggle]');
  await new Promise((r) => setTimeout(r, 1000));
  check(await p.evaluate(() => !!document.querySelector('[data-qa=menu-terminal]')), 'the phone menu opens (its lazy panel loads through /Portfolio)');
  await ctx.close();
}
await b.close();
console.log(fails ? `FAIL: ${fails}` : 'ok: the Pages build');
process.exit(fails ? 1 : 0);
