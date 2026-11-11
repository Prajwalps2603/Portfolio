// Inspect what occupies the bench board area after selecting system N. node bench-dom.mjs <url> <N>
import { chromium } from 'playwright-core';
const [url = 'http://localhost:4173/', n = '2'] = process.argv.slice(2);
const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: 1440, height: 900 } });
await p.goto(url, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4500);
const top = await p.evaluate(() => document.getElementById('work').getBoundingClientRect().top + scrollY);
await p.mouse.move(200, 450);
for (let y = 0; y < top + 200; y += 120) { await p.mouse.wheel(0, 120); await p.waitForTimeout(16); }
await p.waitForTimeout(3000);
await p.locator('nav[aria-label="Systems on the bench"] button').nth(Number(n) - 1).click();
await p.mouse.move(200, 450);
await p.waitForTimeout(3500);
const r = await p.evaluate(() => {
  const nav = document.querySelector('nav[aria-label="Systems on the bench"]');
  let panel = nav; for (let i = 0; i < 6 && panel; i++) panel = panel.parentElement;
  const out = [];
  const rr = (el) => { const b = el.getBoundingClientRect(); return [Math.round(b.left), Math.round(b.top), Math.round(b.width), Math.round(b.height)]; };
  for (const c of document.querySelectorAll('#work canvas')) out.push({ kind: 'canvas', rect: rr(c), size: [c.width, c.height], opacity: getComputedStyle(c).opacity, parentRect: rr(c.parentElement) });
  for (const s of document.querySelectorAll('#work svg')) { const b = s.getBoundingClientRect(); if (b.height > 120 && b.top < innerHeight && b.bottom > 0) out.push({ kind: 'svg', rect: rr(s), cls: (s.getAttribute('class') || '').slice(0, 50), label: (s.getAttribute('aria-label') || '').slice(0, 40) }); }
  for (const d of document.querySelectorAll('#work [role="img"]')) { const b = d.getBoundingClientRect(); if (b.top < innerHeight && b.bottom > 0) out.push({ kind: 'role-img', rect: rr(d), tag: d.tagName, aspect: d.style.aspectRatio, kids: d.children.length, label: (d.getAttribute('aria-label') || '').slice(0, 50) }); }
  return out;
});
console.log(JSON.stringify(r, null, 1));
await b.close();
