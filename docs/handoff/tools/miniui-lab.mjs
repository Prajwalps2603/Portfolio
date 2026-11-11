// miniui-lab.mjs: project pictures at several widths, ship and sketch side by side (dev lab).
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';
const BASE = process.env.BASE || 'http://localhost:3000';
const WIDTHS = (process.env.WIDTHS || '340,440,560,700').split(',').map(Number);
const PROJECTS = (process.env.PROJECTS || 'drone-intelligence,audify-ai').split(',');
const THEME = process.env.THEME || 'light';
const out = `${OUT_DIR}/mui`; fs.mkdirSync(out, { recursive: true });
const b = await chromium.launch({ channel: 'msedge', headless: true });
const ctx = await b.newContext({ viewport: { width: 1600, height: 1000 }, deviceScaleFactor: 2 });
await ctx.addInitScript((theme) => { sessionStorage.setItem('pmp:intro-seen', '1'); sessionStorage.setItem('pmp:card-popup', '1'); localStorage.setItem('pmp:lite', '0'); localStorage.setItem('pmp:theme', theme); }, THEME);
const p = await ctx.newPage();
const errs = [];
p.on('pageerror', (e) => errs.push(e.message)); p.on('console', (m) => m.type() === 'error' && errs.push(m.text()));
await p.goto(`${BASE}/`, { waitUntil: 'load' });
await new Promise((r) => setTimeout(r, 2500));
for (const width of WIDTHS) {
  await p.evaluate(({ width, projects }) => { window.__MINIUI_LAB__ = { width, projects, pairs: true, cols: 2 }; window.dispatchEvent(new Event('miniui:lab')); }, { width, projects: PROJECTS });
  await new Promise((r) => setTimeout(r, 2500));
  const lab = await p.$('[data-miniui-lab]');
  if (!lab) { console.log('no lab'); break; }
  const f = `${out}/lab-${width}${THEME === 'dark' ? '-dark' : ''}.png`;
  await lab.screenshot({ path: f });
  console.log('saved', f);
}
console.log('errors', errs.length ? [...new Set(errs)] : 'none');
await b.close();
