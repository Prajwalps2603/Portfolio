// Text contrast in light and dark mode: every visible text element is checked against the colour
// actually painted behind its middle (elementsFromPoint: the first opaque background, decorative
// layers included), and anything under 3:1 is listed (4.5:1 is the target for body text; 3:1 is the
// floor this flags, for large text and UI). Opens the states that change colours first: the first
// "What I build" row (its lime flood lights the stack map), a container tab, the README code view.
//   node verify-contrast.mjs [dark|light|both] [paths,comma,separated]
// BASE picks the server (default http://localhost:4173).
import './local-tmp.mjs';
import { chromium } from 'playwright-core';

const BASE = process.env.BASE || 'http://localhost:4173';
const themes = (process.argv[2] || 'both') === 'both' ? ['light', 'dark'] : [process.argv[2]];
const paths = (process.argv[3] || '/,/repos/,/pull-request/,/resume/,/work/bookmyvenue/,/work/drone-intelligence/').split(',');
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let total = 0;

const MIN = Number(process.env.MIN || 3);
const scan = async (page) => {
  // every layer takes part in hit testing while scanning (decorative layers ignore the pointer)
  const tag = await page.addStyleTag({ content: '*,*::before,*::after{pointer-events:auto!important}' });
  const res = await page.evaluate((MIN) => {
    // any CSS colour (rgb, oklab, color-mix results...) to rgba, through a 1x1 canvas
    const cv = document.createElement('canvas');
    cv.width = cv.height = 1;
    const cx = cv.getContext('2d', { willReadFrequently: true });
    const cache = new Map();
    const parse = (c) => {
      if (!c || c === 'transparent') return null;
      if (cache.has(c)) return cache.get(c);
      cx.clearRect(0, 0, 1, 1);
      cx.fillStyle = '#000';
      cx.fillStyle = c;
      cx.fillRect(0, 0, 1, 1);
      const [r, g, b, a] = cx.getImageData(0, 0, 1, 1).data;
      const v = a === 0 ? null : { r, g, b, a: a / 255 };
      cache.set(c, v);
      return v;
    };
    const lum = ({ r, g, b }) => {
      const f = (v) => {
        v /= 255;
        return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
      };
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const ratio = (a, b) => {
      const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m);
      return (x + 0.05) / (y + 0.05);
    };
    const out = [];
    const seen = new Set();
    const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
    while (walker.nextNode()) {
      const t = walker.currentNode;
      if (!t.textContent.trim()) continue;
      const el = t.parentElement;
      if (!el || seen.has(el)) continue;
      seen.add(el);
      if (el.closest('[aria-hidden="true"], svg, [data-qa=cursor], .sr-only, script, style, noscript, [inert]')) continue;
      const cs = getComputedStyle(el);
      if (cs.visibility === 'hidden' || +cs.opacity === 0) continue;
      const range = document.createRange();
      range.selectNodeContents(t);
      const rect = [...range.getClientRects()].find((r) => r.width > 2 && r.height > 2);
      if (!rect) continue;
      const x = rect.left + rect.width / 2;
      const y = rect.top + rect.height / 2;
      if (x < 0 || y < 0 || x > innerWidth || y > innerHeight) continue;
      // effective opacity of the text (ancestors' opacity multiplies)
      let op = 1;
      for (let a = el; a; a = a.parentElement) op *= +getComputedStyle(a).opacity;
      if (op < 0.35) continue;
      const fg = parse(cs.color);
      if (!fg || fg.a < 0.35) continue;
      const stack = document.elementsFromPoint(x, y);
      // text covered by the fixed header is not visible: skip it
      const header = document.querySelector('header[data-boot]');
      if (header && !header.contains(el) && stack[0] && header.contains(stack[0])) continue;
      const opacityOf = (n) => {
        let o = 1;
        for (let a = n; a; a = a.parentElement) o *= +getComputedStyle(a).opacity;
        return o;
      };
      let bg = null;
      for (const under of stack) {
        const b = parse(getComputedStyle(under).backgroundColor);
        if (b && b.a >= 0.6 && opacityOf(under) >= 0.5) {
          bg = b;
          break;
        }
      }
      if (!bg) bg = parse(getComputedStyle(document.documentElement).backgroundColor);
      // the highlighter paints its band as a background image: that band is the background
      const hl = el.closest('.hl');
      if (hl && +getComputedStyle(hl).getPropertyValue('--hl-p') >= 0.5) {
        const band = parse(getComputedStyle(hl).getPropertyValue('--hl-c').trim());
        if (band) bg = band;
      }
      // blend a translucent text colour over the background
      const mix = { r: fg.r * fg.a + bg.r * (1 - fg.a), g: fg.g * fg.a + bg.g * (1 - fg.a), b: fg.b * fg.a + bg.b * (1 - fg.a) };
      const r = ratio(mix, bg);
      if (r < MIN) out.push({ text: t.textContent.trim().slice(0, 40), ratio: +r.toFixed(2), fg: cs.color, bg: `rgb(${bg.r} ${bg.g} ${bg.b})`, where: `${el.tagName.toLowerCase()}.${String(el.className).slice(0, 60)}` });
    }
    return out;
  }, MIN);
  await tag.evaluate((n) => n.remove());
  return res;
};

for (const theme of themes) {
  for (const path of paths) {
    const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 }, reducedMotion: 'reduce' });
    await ctx.addInitScript((t) => {
      localStorage.setItem('pmp:theme', t);
      localStorage.setItem('pmp:lite', '0');
      sessionStorage.setItem('pmp:intro-seen', '1');
      sessionStorage.setItem('pmp:card-popup', '1');
    }, theme);
    const page = await ctx.newPage();
    await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
    await new Promise((r) => setTimeout(r, 1500));
    // open the states that recolour things
    if (path === '/') {
      await page.evaluate(() => document.querySelector('[data-qa^=build-row-] button[aria-expanded], [data-qa^=build-row-] button')?.click());
      await new Promise((r) => setTimeout(r, 600));
    }
    const found = [];
    const H = await page.evaluate(() => document.documentElement.scrollHeight);
    for (let y = 0; y < H; y += 800) {
      await page.evaluate((y) => window.scrollTo(0, y), y);
      await new Promise((r) => setTimeout(r, 250));
      for (const f of await scan(page)) if (!found.some((g) => g.text === f.text && g.where === f.where)) found.push(f);
    }
    total += found.length;
    console.log(`${theme.padEnd(5)} ${path.padEnd(28)} ${found.length ? `${found.length} under ${MIN}:1` : 'ok'}`);
    for (const f of found.slice(0, 14)) console.log(`      ${String(f.ratio).padStart(5)}  "${f.text}"  ${f.fg} on ${f.bg}  ${f.where}`);
    await ctx.close();
  }
}
await browser.close();
console.log(total ? `done: ${total} low-contrast text(s)` : 'done: all ok');
process.exitCode = total ? 1 : 0;
