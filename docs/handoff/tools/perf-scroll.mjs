// Scroll performance on THIS machine's real GPU (Edge headless with D3D11): scrolls the whole page
// with the mouse wheel (the site's smooth scroll), the pointer moving, and records every frame's
// time, then the same with one suspect switched off at a time, so the cost of each shows.
//   node perf-scroll.mjs [path=/] [variants=all]     BASE defaults to http://localhost:4173
import './local-tmp.mjs';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://localhost:4173';
const path = process.argv[2] || '/';
const pick = (process.argv[3] || 'all').split(',');
const OFF = {
  'header-blur': 'header *{backdrop-filter:none!important;-webkit-backdrop-filter:none!important}',
  cursor: '[data-qa=cursor]{display:none!important}',
  'paper-canvas': 'body canvas.fixed{display:none!important}',
  'blend-modes': '*{mix-blend-mode:normal!important}',
};
const VARIANTS = { baseline: [], ...Object.fromEntries(Object.keys(OFF).map((k) => [`no ${k}`, [k]])), 'all four off': Object.keys(OFF) };
const browser = await chromium.launch({ channel: 'msedge', headless: true, args: ['--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist', '--enable-gpu-rasterization'] });

async function run(name, off) {
  const ctx = await browser.newContext({ viewport: { width: 1366, height: 768 } });
  await ctx.addInitScript(() => {
    try {
      sessionStorage.setItem('pmp:intro-seen', '1');
      sessionStorage.setItem('pmp:card-popup', '1');
    } catch {}
  });
  const p = await ctx.newPage();
  await p.goto(`${BASE}${path}`, { waitUntil: 'load' });
  if (off.length) await p.addStyleTag({ content: off.map((k) => OFF[k]).join('\n') });
  await new Promise((r) => setTimeout(r, 2500));
  await p.mouse.move(600, 400);
  await p.evaluate(() => {
    window.__f = [];
    window.__lt = 0;
    let last = performance.now();
    const tick = (t) => {
      window.__f.push(t - last);
      last = t;
      if (!window.__stop) requestAnimationFrame(tick);
    };
    requestAnimationFrame(tick);
    try {
      new PerformanceObserver((l) => l.getEntries().forEach((e) => (window.__lt += e.duration))).observe({ type: 'longtask', buffered: false });
    } catch {}
  });
  const H = await p.evaluate(() => document.documentElement.scrollHeight - innerHeight);
  const steps = Math.min(220, Math.ceil(H / 120));
  for (let i = 0; i < steps; i++) {
    await p.mouse.move(500 + (i % 9) * 30, 300 + (i % 7) * 25);
    await p.mouse.wheel(0, 120);
    await new Promise((r) => setTimeout(r, 35));
  }
  await new Promise((r) => setTimeout(r, 800));
  const res = await p.evaluate(() => {
    window.__stop = true;
    const f = window.__f.slice(2).sort((a, b) => a - b);
    const n = f.length;
    const avg = f.reduce((a, b) => a + b, 0) / n;
    return { frames: n, avg: +avg.toFixed(1), p95: +f[Math.floor(n * 0.95)].toFixed(1), janky: +((100 * f.filter((x) => x > 33).length) / n).toFixed(1), longTasksMs: Math.round(window.__lt) };
  });
  await ctx.close();
  console.log(`${name.padEnd(16)} frames ${String(res.frames).padStart(4)}  avg ${String(res.avg).padStart(5)}ms  p95 ${String(res.p95).padStart(5)}ms  >33ms ${String(res.janky).padStart(5)}%  long tasks ${res.longTasksMs}ms`);
  return res;
}

const gpu = await (async () => {
  const p = await browser.newPage();
  const r = await p.evaluate(() => { const gl = document.createElement('canvas').getContext('webgl'); const d = gl && gl.getExtension('WEBGL_debug_renderer_info'); return d ? gl.getParameter(d.UNMASKED_RENDERER_WEBGL) : 'none'; });
  await p.close();
  return r;
})();
console.log(`GPU: ${gpu}\npage: ${path}`);
for (const [name, off] of Object.entries(VARIANTS)) {
  if (!pick.includes('all') && !pick.includes(name)) continue;
  await run(name, off);
}
await browser.close();
