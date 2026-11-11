// Jump straight to the page bottom (and back) after the intro; report page errors. node repro-jump.mjs <url> [WxH] [--rm]
import { chromium } from 'playwright-core';
const [url = 'http://localhost:4173/', vp = '1440x900'] = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const rm = process.argv.includes('--rm');
const [w, h] = vp.split('x').map(Number);
const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: w, height: h }, reducedMotion: rm ? 'reduce' : 'no-preference' });
const logs = [];
p.on('console', (m) => { if (['error', 'warning'].includes(m.type()) && !m.text().includes('THREE.Clock')) logs.push(m.type() + ': ' + m.text().slice(0, 400)); });
p.on('pageerror', (e) => logs.push('pageerror: ' + String(e.stack || e.message).slice(0, 900)));
await p.goto(url, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4500);
for (const y of [99999, 0, 6000, 99999, 3000]) {
  await p.evaluate((yy) => window.scrollTo(0, yy), y);
  await p.waitForTimeout(1200);
}
await p.evaluate(() => { location.hash = ''; });
console.log(logs.length ? logs.join('\n') : 'no errors');
await b.close();
