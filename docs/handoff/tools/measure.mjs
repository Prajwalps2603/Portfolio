// Prints section offsets and 3D-board state for a URL: node measure.mjs <url> [WxH]
import { chromium } from 'playwright-core';
const url = process.argv[2] || 'http://localhost:4173/';
const [w, h] = (process.argv[3] || '1440x900').split('x').map(Number);
const b = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist'] });
const p = await b.newPage({ viewport: { width: w, height: h } });
const logs = [];
p.on('console', (m) => { if (['error', 'warning'].includes(m.type())) logs.push(m.type() + ': ' + m.text().slice(0, 300)); });
p.on('pageerror', (e) => logs.push('pageerror: ' + String(e.message).slice(0, 300)));
await p.goto(url, { waitUntil: 'domcontentloaded' });
await p.waitForTimeout(4500);
const info = await p.evaluate(() => {
  const ids = [...document.querySelectorAll('main section[id], main [id]')].filter((e) => e.tagName === 'SECTION').map((e) => ({ id: e.id, top: Math.round(e.getBoundingClientRect().top + scrollY), h: Math.round(e.offsetHeight) }));
  return { scrollHeight: document.documentElement.scrollHeight, sections: ids };
});
console.log(JSON.stringify(info));
const work = info.sections.find((s) => s.id === 'work');
if (work) {
  await p.mouse.move(w / 2, h / 2);
  let y = 0; const target = work.top + 300;
  while (y < target) { await p.mouse.wheel(0, 120); y += 120; await p.waitForTimeout(16); }
  await p.waitForTimeout(4000);
  const board = await p.evaluate(() => ({ canvases: [...document.querySelectorAll('canvas')].map((c) => ({ w: c.width, h: c.height, cls: c.className.slice(0, 60), parent: c.parentElement?.className?.slice?.(0, 60) })), svgBoards: document.querySelectorAll('#work svg').length }));
  console.log('BOARD', JSON.stringify(board));
}
console.log(logs.length ? 'LOGS:\n' + logs.join('\n') : 'LOGS: none');
await b.close();
