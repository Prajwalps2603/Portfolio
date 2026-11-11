// Checks contact as a pull request: the contact section's "Create a pull request" button opens the
// /pull-request page; the branch follows the title; an empty title is refused; labels toggle; the
// milestone picks; Preview renders the description; "Create pull request" opens a mailto: to
// Prajwal with "[PR][labels] title", the description, the labels and the milestone; the ▾ menu
// (draft, copy as text); "Back to contact"; phone, reduced motion and sketch mode; 0 console errors.
//   node verify-pr.mjs [desktop,mobile,reduced,sketch | all]
// BASE picks the server (default http://localhost:4173); screenshots go to ./.out/pr unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || `${OUT_DIR}/pr`;
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

async function open(opts, { sketch = false, reduced = false, path = '/pull-request/' } = {}) {
  const context = await browser.newContext({ ...opts, reducedMotion: reduced ? 'reduce' : 'no-preference', permissions: ['clipboard-read', 'clipboard-write'] });
  await context.addInitScript((sk) => {
    try {
      sessionStorage.setItem('pmp:intro-seen', '1');
      if (sk) sessionStorage.setItem('pmp:sketch', '1');
    } catch {}
    // catch mailto: clicks instead of opening an email app
    document.addEventListener(
      'click',
      (e) => {
        const a = e.target instanceof Element ? e.target.closest('a[href^="mailto:"]') : null;
        if (a) {
          window.__mail = a.getAttribute('href');
          e.preventDefault();
        }
      },
      true,
    );
  }, sketch);
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(`[pageerror] ${String(e.message).slice(0, 220)}`));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errs.push(`[${m.type()}] ${m.text().slice(0, 220)}`));
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await page.addStyleTag({ content: '[data-qa=cursor]{display:none!important}' });
  return { context, page, errs };
}
const pr = '[data-qa=pull-request]';
const mail = async (page) => {
  const href = await page.evaluate(() => window.__mail ?? null);
  if (!href) return null;
  const u = new URL(href);
  return { to: decodeURIComponent(u.pathname), subject: u.searchParams.get('subject'), body: u.searchParams.get('body') };
};
const shot = async (page, file) => (await page.$(pr)).screenshot({ path: `${OUT}/${file}.png` });

for (const [name, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
]) {
  if (!want(name)) continue;
  log(`== ${name.toUpperCase()}`);
  // the way in: the contact section's button
  const { context, page, errs } = await open(opts, { path: '/' });
  await sleep(1500);
  await page.evaluate(() => document.querySelector('[data-qa=idea-pr]').scrollIntoView({ block: 'center' }));
  await sleep(600);
  const btn = await page.$('[data-qa=idea-pr]');
  expect(btn && /Create a pull request/.test(await btn.innerText()), 'the contact section has "Create a pull request"');
  await page.screenshot({ path: `${OUT}/${name}-contact.png` });
  await btn.click();
  await page.waitForURL(/\/pull-request\/?$/, { timeout: 10000 });
  await page.waitForSelector(pr);
  await sleep(1200);
  expect(true, `it opens ${new URL(page.url()).pathname}`);
  await page.screenshot({ path: `${OUT}/${name}-page.png`, fullPage: true });

  // an empty title is refused
  await page.click('[data-qa=pr-create]');
  await sleep(150);
  const invalid = await page.$eval('[data-qa=pr-title-input]', (el) => el.getAttribute('aria-invalid') === 'true' && document.activeElement === el);
  expect(invalid && !(await mail(page)), 'an empty title is refused (focus, message, no email)');

  // the title names the branch
  await page.fill('[data-qa=pr-title-input]', 'Full stack role on our booking product');
  const branch = await page.$eval('[data-qa=pr-branch]', (el) => el.textContent.trim());
  expect(branch === 'compare: you/full-stack-role-on-our-booking', `the branch follows the title (${branch})`);

  // description, labels, milestone
  await page.fill('[data-qa=pr-body]', '## What\nA booking app for our gyms.\n\n## Details\n- React, Node.js\n- Remote\n');
  await page.click('[data-qa=pr-label]:has-text("Full-time")');
  await page.click('[data-qa=pr-label]:has-text("Collab")');
  await page.click('[data-qa=pr-label]:has-text("Collab")');
  await page.click('[data-qa=pr-label]:has-text("Collab")');
  const pressed = await page.$$eval('[data-qa=pr-label][aria-pressed=true]', (els) => els.map((e) => e.textContent.replace('✓', '').trim()));
  expect(pressed.join(',') === 'Full-time,Collab', `labels toggle (${pressed})`);
  await page.check('input[type=radio][value="This month"]');
  await page.click('[role=tab]:has-text("Preview")');
  await sleep(150);
  const preview = await page.$eval('[data-qa=pr-preview]', (el) => ({ h: [...el.querySelectorAll('h3')].map((h) => h.textContent), li: el.querySelectorAll('li').length }));
  expect(preview.h.join('|') === 'What|Details' && preview.li === 2, `Preview renders it (${JSON.stringify(preview)})`);
  await shot(page, `${name}-preview`);
  await page.click('[role=tab]:has-text("Write")');

  // create: the email
  await page.click('[data-qa=pr-create]');
  await sleep(200);
  const m = await mail(page);
  log('  email', m);
  expect(m && m.to === 'prajwalnair2603@gmail.com', 'it opens an email to Prajwal');
  expect(m && m.subject === '[PR][Full-time][Collab] Full stack role on our booking product', 'the subject carries the labels and the title');
  expect(m && m.body.includes('A booking app for our gyms.') && m.body.includes('Labels: Full-time, Collab') && m.body.includes('When: This month'), 'the body has the description, labels and milestone');
  expect(await page.isVisible('text=Your email app should be open'), 'it says what happened (and how to copy instead)');
  await shot(page, `${name}-created`);

  // the ▾ menu: draft, copy
  await page.evaluate(() => (window.__mail = null));
  await page.click('button[aria-label="More ways to send"]');
  await sleep(150);
  await shot(page, `${name}-menu`);
  await page.click('text=Create draft pull request');
  await sleep(200);
  const d = await mail(page);
  expect(d && d.subject === '[Draft PR] Full stack role on our booking product', `draft (${d?.subject})`);
  await page.click('button[aria-label="More ways to send"]');
  await page.keyboard.press('Escape');
  await sleep(100);
  expect(!(await page.isVisible('[data-qa=pr-copy]')), 'Escape closes the menu');
  await page.click('button[aria-label="More ways to send"]');
  await page.click('[data-qa=pr-copy]');
  await sleep(300);
  const said = await page.evaluate((pr) => document.querySelector(`${pr} [aria-live]`)?.textContent ?? '', pr);
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch((e) => `(unreadable: ${e.message})`));
  log('  copy:', said.slice(-60), '| clipboard:', JSON.stringify(clip.slice(0, 70)));
  expect(/Copied/.test(said) && (clip.replace(/\r\n/g, '\n').startsWith('To: prajwalnair2603@gmail.com\nSubject: [PR][Full-time][Collab]') || clip.startsWith('(unreadable')), 'Copy as text copies the email');

  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(!overflow, 'no sideways page scroll');
  // back
  await page.click('text=Back to contact');
  await page.waitForURL((u) => u.pathname.replace(/\/Portfolio/, '') === '/' || u.pathname.endsWith('/Portfolio/'), { timeout: 10000 });
  await sleep(1500);
  const atContact = await page.evaluate(() => {
    const r = document.querySelector('#contact').getBoundingClientRect();
    return r.top < window.innerHeight && r.bottom > 0;
  });
  expect(atContact, 'Back to contact returns to the contact section');
  log(`  [${name}] errors:`, errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

for (const mode of ['reduced', 'sketch']) {
  if (!want(mode)) continue;
  log(`== ${mode.toUpperCase()}`);
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } }, { reduced: mode === 'reduced', sketch: mode === 'sketch' });
  await sleep(1200);
  expect(!!(await page.$(pr)), 'the form shows');
  await page.screenshot({ path: `${OUT}/${mode}.png`, fullPage: true });
  log(`  [${mode}] errors:`, errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

await browser.close();
log(failures ? `done: ${failures} failure(s)` : 'done: all ok');
process.exitCode = failures ? 1 : 0;
