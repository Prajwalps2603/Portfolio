// Cycle through the bench systems by clicking the 01-06 nav and screenshot the board panel after each switch.
// node bench-cycle.mjs <url> <outDir> [WxH] [order e.g. 1,2,3,2]
import { chromium } from 'playwright-core';
const [url = 'http://localhost:4173/', out = '.', vp = '1440x900', order = '1,2,3,4,5,6,2'] = process.argv.slice(2);
const [w, h] = vp.split('x').map(Number);
const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: w, height: h } });
const logs = [];
p.on('console', (m) => { if (m.type() === 'error') logs.push('error: ' + m.text().slice(0, 300)); });
p.on('pageerror', (e) => logs.push('pageerror: ' + String(e.message).slice(0, 300)));
await p.goto(url, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4500);
const top = await p.evaluate(() => document.getElementById('work').getBoundingClientRect().top + scrollY);
await p.mouse.move(200, h / 2);
for (let y = 0; y < top + 200; y += 120) { await p.mouse.wheel(0, 120); await p.waitForTimeout(16); }
await p.waitForTimeout(3500);
const nav = p.locator('nav[aria-label="Systems on the bench"] button, nav[aria-label="Systems on the bench"] a');
console.log('nav items:', await nav.count());
const panel = p.locator('nav[aria-label="Systems on the bench"]').locator('xpath=ancestor::*[contains(@class,"sticky") or self::aside][1]');
for (const n of order.split(',').map(Number)) {
  await nav.nth(n - 1).click();
  await p.mouse.move(200, h / 2);
  await p.waitForTimeout(3500);
  const file = `${out}/cycle-${vp}-${String(n).padStart(2, '0')}-${Date.now() % 100000}.png`;
  const target = (await panel.count()) ? panel.first() : null;
  if (target) await target.screenshot({ path: file }); else await p.screenshot({ path: file });
  const st = await p.evaluate(() => ({ canvases: document.querySelectorAll('#work canvas').length, title: document.querySelector('nav[aria-label="Systems on the bench"]')?.closest('div,aside,section')?.querySelector('h3,h2')?.textContent }));
  console.log(n, file, JSON.stringify(st));
}
console.log(logs.length ? 'LOGS:\n' + logs.join('\n') : 'LOGS: none');
await b.close();
