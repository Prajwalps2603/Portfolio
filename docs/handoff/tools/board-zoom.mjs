// 2x crop of the bench board's bottom edge after selecting system N.  node board-zoom.mjs <url> <N> <out.png>
import { chromium } from 'playwright-core';
const [url, n, out] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 2 });
await p.goto(url, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4500);
const top = await p.evaluate(() => document.getElementById('work').getBoundingClientRect().top + scrollY);
await p.mouse.move(200, 450);
for (let y = 0; y < top + 200; y += 120) { await p.mouse.wheel(0, 120); await p.waitForTimeout(16); }
await p.waitForTimeout(3000);
await p.locator('nav[aria-label="Systems on the bench"] button').nth(Number(n) - 1).click();
await p.mouse.move(200, 450);
await p.waitForTimeout(3500);
const box = await p.locator('#work [role="img"]:has(canvas)').first().boundingBox();
await p.screenshot({ path: out, clip: { x: box.x, y: box.y + box.height - 70, width: box.width / 2, height: 90 } });
console.log('saved', out, JSON.stringify(box));
await b.close();
