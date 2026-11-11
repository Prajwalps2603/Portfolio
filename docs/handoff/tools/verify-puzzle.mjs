// verify-puzzle.mjs: the newspaper's 4x4 sudoku can be solved by hand (his ask, 2026-11-10).
// Phone: tap a square, tap a number on the pad; a repeat turns tangerine and says so; the full,
// correct grid is solved. Desktop: keys only (Tab into the grid, 1-4, Backspace, arrows). "Solve it"
// still backtracks, "Clear" starts over. Screenshots in .out/puzzle/. Exits 1 on a failure.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:4173';
const out = `${OUT_DIR}/puzzle`; fs.mkdirSync(out, { recursive: true });
const SOLUTION = [1, 2, 3, 4, 3, 4, 1, 2, 2, 1, 4, 3, 4, 3, 2, 1];
const OPEN = [2, 4, 7, 8, 11, 13, 14];
let fails = 0;
const check = (ok, msg) => { console.log(`  ${ok ? 'ok  ' : 'FAIL'} ${msg}`); if (!ok) fails++; };
const b = await chromium.launch({ channel: 'msedge', headless: true });
const errs = [];
const open = async (vp, mobile) => {
  const ctx = await b.newContext({ viewport: vp, isMobile: mobile, hasTouch: mobile, deviceScaleFactor: 2 });
  await ctx.addInitScript(() => { sessionStorage.setItem('pmp:intro-seen', '1'); sessionStorage.setItem('pmp:card-popup', '1'); });
  const p = await ctx.newPage();
  p.on('pageerror', (e) => errs.push(e.message));
  await p.goto(`${BASE}/resume/`, { waitUntil: 'load' });
  await new Promise((r) => setTimeout(r, 1200));
  await p.$eval('[data-qa=times-puzzle]', (e) => e.scrollIntoView({ block: 'center' }));
  await new Promise((r) => setTimeout(r, 500));
  return { ctx, p };
};
const cells = (p) => p.$$eval('[data-qa=times-puzzle] [role=gridcell]', (c) => c.map((x) => Number(x.textContent) || 0));
const status = (p) => p.$eval('[data-qa=times-puzzle] [role=status]', (e) => e.textContent.trim());
const cellBtn = (p, i) => p.$$('[data-qa=times-puzzle] [role=gridcell]').then((c) => c[i].$('button'));
const shot = (p, name) => p.$eval('[data-qa=times-puzzle]', (e) => e.closest('section')?.scrollIntoView({ block: 'center' })).then(() => p.locator('[data-qa=times-puzzle]').screenshot({ path: `${out}/${name}.png` }));

console.log('== phone: tap a square, tap a number');
{
  const { ctx, p } = await open({ width: 390, height: 844 }, true);
  check((await status(p)) === 'Tap a square, then a number.', `hint first (${await status(p)})`);
  const padOff = await p.$eval('[data-qa=times-pad-1]', (e) => e.disabled);
  check(padOff, 'the pad waits for a square');
  await (await cellBtn(p, 2)).tap();
  await new Promise((r) => setTimeout(r, 150));
  const selected = await p.$$eval('[data-qa=times-puzzle] [role=gridcell]', (c) => c[2].getAttribute('aria-selected'));
  check(selected === 'true', 'the tapped square is selected');
  await shot(p, 'phone-selected');
  await p.tap('[data-qa=times-pad-4]');
  await new Promise((r) => setTimeout(r, 150));
  check((await cells(p))[2] === 4, 'the pad puts the number in it');
  check(/repeat/i.test(await status(p)), `a repeat is called out (${await status(p)})`);
  const clashBg = await p.$$eval('[data-qa=times-puzzle] [role=gridcell]', (c) => [c[2].className.includes('bg-tangerine-soft'), c[3].className.includes('bg-tangerine-soft')]);
  check(clashBg[0] && clashBg[1], 'both repeating squares turn tangerine (the 4 typed and the given 4)');
  await shot(p, 'phone-clash');
  await p.tap('[data-qa=times-pad-0]');
  await new Promise((r) => setTimeout(r, 150));
  check((await cells(p))[2] === 0, 'the x empties it');
  for (const i of OPEN) {
    await (await cellBtn(p, i)).tap();
    await p.tap(`[data-qa=times-pad-${SOLUTION[i]}]`);
  }
  await new Promise((r) => setTimeout(r, 400));
  const g = await cells(p);
  check(g.every((v, i) => v === SOLUTION[i]), 'the grid is filled');
  check(/^Solved!/.test(await status(p)), `solved by hand (${await status(p)})`);
  check(await p.$eval('[data-qa=times-puzzle]', (e) => e.hasAttribute('data-solved')), 'marked solved (squares go lime)');
  check(!(await p.isVisible('[data-qa=times-pad-1]')), 'the pad steps away once solved (its place kept)');
  await shot(p, 'phone-solved');
  await p.tap('[data-qa=times-clear]');
  await new Promise((r) => setTimeout(r, 200));
  check((await cells(p)).every((v, i) => v === [1, 2, 0, 4, 0, 4, 1, 0, 0, 1, 4, 0, 4, 0, 0, 1][i]), '"Play again" starts over');
  await ctx.close();
}

console.log('== desktop: keys only');
{
  const { ctx, p } = await open({ width: 1440, height: 900 }, false);
  // Tab into the grid: one tab stop, the first open square
  await p.$eval('[data-qa=times-puzzle]', (e) => { const prev = e.closest('section').querySelector('p'); prev.setAttribute('tabindex', '-1'); prev.focus(); });
  await p.keyboard.press('Tab');
  const at = await p.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  check(/^Row 1, column 3/.test(at || ''), `Tab lands on the first open square (${at})`);
  await p.keyboard.press('3');
  check((await cells(p))[2] === 3, 'typing 3 fills it');
  await p.keyboard.press('ArrowDown'); // row 2, column 3 is given -> skips to row 3? no: column 3 below is given (1), then 4 (given), then 2 (open)
  const at2 = await p.evaluate(() => document.activeElement?.getAttribute('aria-label'));
  check(/^Row 4, column 3/.test(at2 || ''), `ArrowDown skips the given squares (${at2})`);
  await p.keyboard.press('2');
  await p.keyboard.press('ArrowLeft');
  await p.keyboard.press('3');
  await p.keyboard.press('Backspace');
  check((await cells(p))[13] === 0, 'Backspace empties');
  await p.keyboard.press('3');
  // the rest by keys
  for (const i of [4, 7, 8, 11]) {
    await (await cellBtn(p, i)).focus();
    await p.keyboard.press(String(SOLUTION[i]));
  }
  await new Promise((r) => setTimeout(r, 300));
  check(/^Solved!/.test(await status(p)), `solved with the keyboard (${await status(p)})`);
  await shot(p, 'desktop-solved');
  await p.click('[data-qa=times-clear]');
  await p.click('[data-qa=times-solve]');
  await new Promise((r) => setTimeout(r, 200));
  check(/backtracking: \d+ tries/.test(await status(p)) && (await cells(p)).every((v, i) => v === SOLUTION[i]), `"Solve it" still backtracks (${await status(p)})`);
  await ctx.close();
}
await b.close();
check(!errs.length, `no page errors${errs.length ? ': ' + errs.join(' | ') : ''}`);
console.log(fails ? `FAIL: ${fails}` : 'ok: the puzzle can be solved by hand');
process.exit(fails ? 1 : 0);
