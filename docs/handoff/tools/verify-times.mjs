// Checks The Prajwal Times (/resume, the résumé as a newspaper): the header's "Prajwal Times"
// button (where Résumé was; "Times" where the row is tight, the header still fits) opens the page;
// the masthead, today's date, the markets ticker, the lead story, the four roles and their chart,
// education, certifications, the newsletter link, the WANTED ad's tear-off tabs (copy the email),
// the puzzle (solved by backtracking, givens kept, every row/column/box 1..4), print (A4 pages),
// phone, reduced motion, sketch mode; 0 console errors.
//   node verify-times.mjs [desktop,header,print,mobile,reduced,sketch | all]
// BASE picks the server (default http://localhost:4173); screenshots go to ./.out/times unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || `${OUT_DIR}/times`;
fs.mkdirSync(OUT, { recursive: true });
const only = (process.argv[2] || 'all').split(',');
const want = (k) => only.includes('all') || only.includes(k);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));
const browser = await chromium.launch({ channel: 'msedge', headless: true });
let failures = 0;
const expect = (ok, what) => {
  if (!ok) failures++;
  log(`  ${ok ? 'ok  ' : 'FAIL'} ${what}`);
};
async function open(opts, { sketch = false, reduced = false, path = '/resume/' } = {}) {
  const context = await browser.newContext({ ...opts, reducedMotion: reduced ? 'reduce' : 'no-preference', permissions: ['clipboard-read', 'clipboard-write'] });
  await context.addInitScript((sk) => {
    try {
      sessionStorage.setItem('pmp:intro-seen', '1');
      sessionStorage.setItem('pmp:card-popup', '1');
      if (sk) sessionStorage.setItem('pmp:sketch', '1');
    } catch {}
  }, sketch);
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(`[pageerror] ${String(e.message).slice(0, 220)}`));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errs.push(`[${m.type()}] ${m.text().slice(0, 220)}`));
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await page.addStyleTag({ content: '[data-qa=cursor]{display:none!important}' });
  return { context, page, errs };
}
const T = '[data-qa=times]';

if (want('header')) {
  log('== HEADER (the button, and the row still fits)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } }, { path: '/' });
  await sleep(1500);
  for (const w of [1440, 1280, 1200, 1024, 900]) {
    await page.setViewportSize({ width: w, height: 800 });
    await sleep(250);
    const r = await page.evaluate(() => {
      const b = document.querySelector('[data-qa=header-times]');
      const row = document.querySelector('header .wrap');
      return { text: b ? b.innerText.replace(/ /g, ' ').trim() : null, fits: row ? row.scrollWidth <= row.clientWidth + 1 : null, resume: !!document.querySelector('header a[href*="drive.google.com"]') };
    });
    expect(r.fits !== false && !r.resume && r.text && (w >= 1440 ? r.text === 'Prajwal Times' : r.text === 'Times'), `${w}px: "${r.text}", the header fits, no Résumé button`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.click('[data-qa=header-times]');
  await page.waitForURL(/\/resume\/?$/, { timeout: 10000 });
  await page.waitForSelector(T);
  expect(true, `it opens ${new URL(page.url()).pathname}`);
  log('  [header] errors:', errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

if (want('desktop')) {
  log('== DESKTOP');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  await sleep(1200);
  const s = await page.evaluate((T) => {
    const t = document.querySelector(T);
    return {
      title: t.querySelector('#times-title')?.textContent,
      date: t.querySelector('[data-qa=times-date]')?.textContent,
      ticker: t.querySelectorAll('[aria-label^="Skills, with"] > span').length - 1,
      lead: t.querySelector('#times-lead')?.textContent,
      roles: t.querySelectorAll('#times-business ~ ol li, section[aria-labelledby=times-business] ol li').length,
      newsletter: t.querySelector('[data-qa=times-newsletter]')?.getAttribute('href'),
      certs: t.querySelectorAll('section[aria-labelledby=times-classifieds] ul li').length,
      more: t.querySelectorAll('ul[aria-labelledby=times-more] li').length,
      edition: t.querySelector('[data-qa=times-date]').parentElement.lastElementChild.textContent,
      photos: [...t.querySelectorAll('img')].map((i) => ({ src: i.getAttribute('src'), ok: i.complete && i.naturalWidth > 0, alt: !!i.alt })),
    };
  }, T);
  log('  page', s);
  expect(s.title === 'The Prajwal Times', 'the masthead');
  expect(/^[A-Z][a-z]+day, \d{1,2} [A-Z][a-z]+ \d{4}$/.test(s.date ?? ''), `today's date (${s.date})`);
  expect(s.ticker >= 10, `the markets ticker (${s.ticker} skills)`);
  expect(/^Livora/.test(s.lead ?? ''), 'the lead story is Livora');
  expect(s.roles === 4, 'the four roles');
  expect(s.certs >= 4, 'certifications');
  expect(s.more === 9, `more stories: six case studies and three more (${s.more})`);
  const tabs = await page.evaluate(() => {
    const row = document.querySelector('[data-qa=times-tabs]');
    const ad = row.parentElement.parentElement.getBoundingClientRect();
    const fit = [...row.querySelectorAll('button')].every((b) => { const r = b.getBoundingClientRect(); const t = b.firstElementChild.getBoundingClientRect(); return t.top >= r.top - 1 && t.bottom <= r.bottom + 1 && t.left >= r.left - 1 && t.right <= r.right + 1; });
    return { fit, inside: row.getBoundingClientRect().bottom <= ad.bottom + 1 };
  });
  expect(tabs.fit && tabs.inside, 'the tear-off tabs hold their text, inside the ad');
  const gaps = await page.evaluate(() => {
    const cols = [...document.querySelectorAll('[data-qa=times] > div.grid')].at(-1).querySelectorAll(':scope > section');
    return [...cols].map((c) => { const r = c.getBoundingClientRect(); const last = [...c.children].at(-1).getBoundingClientRect(); return Math.round(r.bottom - last.bottom); });
  });
  log('  empty space at the foot of the bottom columns', gaps);
  const top = await page.evaluate(() => {
    const row = document.querySelectorAll('[data-qa=times] > div.grid')[0];
    const r = row.getBoundingClientRect();
    return [...row.querySelectorAll(':scope > section')].map((c) => Math.round(r.bottom - [...c.children].at(-1).getBoundingClientRect().bottom));
  });
  log('  empty space at the foot of the top columns', top);
  expect(Math.max(...top, ...gaps) <= 60, `no empty space at the foot of any column (${[...top, ...gaps].join(', ')} px)`);
  expect(s.edition === 'Indian edition', `the dateline says "${s.edition}"`);
  const wanted = await page.evaluate(() => [...document.querySelectorAll('[data-qa=times] p')].find((p) => p.textContent.trim() === 'WANTED').parentElement.textContent);
  expect(/anywhere on the map/.test(wanted) && /any city or time zone, ready for any software development role/.test(wanted) && /Apply within/.test(wanted), 'the WANTED ad: anywhere on the map, any software development role');
  const also = await page.$$eval('[data-qa=times-also-built]', (els) => els.map((e) => e.querySelector('h3').textContent.trim()));
  expect(also.join('|') === 'HRMS|SRMS|Support Ticket System', `also built, as briefs like the rest (${also.join(', ')})`);
  expect(s.photos.length === 3 && s.photos.every((p) => p.ok && p.alt), `three real photos load, with alt text (${s.photos.map((p) => p.src).join(', ')})`);
  expect(s.newsletter === 'https://www.linkedin.com/build-relation/newsletter-follow?entityUrn=7473321654379499520', 'the newsletter links to LinkedIn');
  await page.screenshot({ path: `${OUT}/desktop.png`, fullPage: true });
  // tear a tab
  await page.click('[data-qa=times-tabs] button >> nth=2');
  await sleep(500);
  const tab = await page.evaluate(() => ({ dis: document.querySelectorAll('[data-qa=times-tabs] button')[2].disabled, said: document.querySelector('[data-qa=times-tabs]').previousElementSibling.textContent }));
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  expect(tab.dis && /Taken/.test(tab.said) && clip === 'prajwalnair2603@gmail.com', 'tearing a tab copies the email and takes the tab');
  // the puzzle
  const before = await page.$$eval('[data-qa=times-puzzle] [role=gridcell]', (c) => c.map((x) => x.textContent));
  await page.click('[data-qa=times-solve]');
  await sleep(150);
  const after = await page.$$eval('[data-qa=times-puzzle] [role=gridcell]', (c) => c.map((x) => Number(x.textContent)));
  const ok = (() => {
    const ok4 = (a) => [...a].sort().join('') === '1234';
    for (let i = 0; i < 4; i++) {
      if (!ok4(after.slice(i * 4, i * 4 + 4))) return false;
      if (!ok4([0, 1, 2, 3].map((r) => after[r * 4 + i]))) return false;
    }
    for (const [br, bc] of [[0, 0], [0, 2], [2, 0], [2, 2]]) if (!ok4([after[br * 4 + bc], after[br * 4 + bc + 1], after[(br + 1) * 4 + bc], after[(br + 1) * 4 + bc + 1]])) return false;
    return before.every((v, i) => !v || Number(v) === after[i]);
  })();
  const steps = await page.$eval('[data-qa=times-puzzle] [role=status]', (e) => e.textContent);
  expect(ok && /backtracking: \d+ tries/.test(steps), `the puzzle solves (${steps})`);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(!overflow, 'no sideways page scroll');
  log('  [desktop] errors:', errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

if (want('print')) {
  log('== PRINT (Save as PDF)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  await sleep(1200);
  await page.emulateMedia({ media: 'print' });
  const hidden = await page.evaluate(() => ({ header: getComputedStyle(document.querySelector('header[data-boot]')).display, toolbar: getComputedStyle(document.querySelector('[data-qa=times-print]').closest('div.wrap')).display }));
  expect(hidden.header === 'none' && hidden.toolbar === 'none', 'print: the site header and the toolbar are left off');
  const pdf = await page.pdf({ format: 'A4', printBackground: true, preferCSSPageSize: true });
  fs.writeFileSync(`${OUT}/the-prajwal-times.pdf`, pdf);
  const pages = (pdf.toString('latin1').match(/\/Type\s*\/Page[^s]/g) || []).length;
  log('  pdf pages', pages);
  expect(pages === 1, `prints on one A4 sheet (${pages} page${pages === 1 ? '' : 's'})`);
  log('  [print] errors:', errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

if (want('mobile')) {
  log('== MOBILE');
  const { context, page, errs } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await sleep(1200);
  await page.screenshot({ path: `${OUT}/mobile.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(!overflow, 'no sideways page scroll');
  // the phone menu has the newspaper instead of Résumé
  await page.goto(`${BASE}/`, { waitUntil: 'load' });
  await sleep(1200);
  await page.click('header button[aria-expanded]');
  await sleep(700);
  const menu = await page.evaluate(() => [...document.querySelectorAll('a')].some((a) => /\/resume\/?$/.test(a.getAttribute('href') || '') && /Prajwal Times/.test(a.textContent)));
  expect(menu, 'the phone menu links to The Prajwal Times');
  log('  [mobile] errors:', errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

for (const mode of ['reduced', 'sketch']) {
  if (!want(mode)) continue;
  log(`== ${mode.toUpperCase()}`);
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } }, { reduced: mode === 'reduced', sketch: mode === 'sketch' });
  await sleep(1200);
  expect(!!(await page.$(T)), 'the paper shows');
  if (mode === 'sketch') {
    const ad = await page.evaluate(() => { const box = [...document.querySelectorAll('[data-qa=times] p')].find((x) => x.textContent.trim() === 'WANTED').closest('.bg-ink'); const cs = getComputedStyle(box); return { bg: cs.backgroundColor, ink: getComputedStyle(box.querySelector('p')).color }; });
    expect(ad.bg === 'rgba(0, 0, 0, 0)' && ad.ink !== 'rgb(244, 244, 239)', `sketch: the WANTED ad is a pencil outline, its text dark (${ad.bg}, ${ad.ink})`);
  }
  await page.screenshot({ path: `${OUT}/${mode}.png` });
  log(`  [${mode}] errors:`, errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

await browser.close();
log(failures ? `done: ${failures} failure(s)` : 'done: all ok');
process.exitCode = failures ? 1 : 0;
