// Checks the visiting card: in the contact section (front: name, role, the live time, availability;
// Flip turns it, the back has the QR of the site's address; Save contact downloads a .vcf with no
// phone number; Share falls back to copying the link) and the "before you go" popup (exit intent:
// not in the first seconds, then once per visit when the pointer leaves through the top; focus,
// Tab stays inside, Esc closes and focus returns; never on touch screens; the palette's "Take my
// card" opens it any time); reduced motion; sketch mode; 0 console errors.
//   node verify-card.mjs [desktop,popup,palette,mobile,reduced,sketch | all]
// BASE picks the server (default http://localhost:4173); screenshots go to ./.out/card unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || `${OUT_DIR}/card`;
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
const qrFile = fs.readFileSync(new URL('../../../src/content/cardQr.ts', import.meta.url), 'utf8');
const siteFile = fs.readFileSync(new URL('../../../src/content/index.ts', import.meta.url), 'utf8');
const SITE = /url:\s*"([^"]+)"/.exec(siteFile)[1];

async function open(opts, { sketch = false, reduced = false, path = '/', noShare = true } = {}) {
  const context = await browser.newContext({ ...opts, acceptDownloads: true, reducedMotion: reduced ? 'reduce' : 'no-preference', permissions: ['clipboard-read', 'clipboard-write'] });
  await context.addInitScript(
    ([sk, ns]) => {
      try {
        sessionStorage.setItem('pmp:intro-seen', '1');
        if (sk) sessionStorage.setItem('pmp:sketch', '1');
      } catch {}
      if (ns) Object.defineProperty(Navigator.prototype, 'share', { value: undefined, configurable: true });
    },
    [sketch, noShare],
  );
  const page = await context.newPage();
  const errs = [];
  page.on('pageerror', (e) => errs.push(`[pageerror] ${String(e.message).slice(0, 220)}`));
  page.on('console', (m) => (m.type() === 'error' || m.type() === 'warning') && errs.push(`[${m.type()}] ${m.text().slice(0, 220)}`));
  await page.goto(`${BASE}${path}`, { waitUntil: 'load' });
  await page.addStyleTag({ content: '[data-qa=cursor]{display:none!important}' });
  return { context, page, errs };
}
const card = (scope = '#contact') => `${scope} [data-qa=visiting-card]`;
const cardState = (page, scope = '#contact') =>
  page.evaluate((sel) => {
    const root = document.querySelector(sel);
    if (!root) return null;
    const front = root.querySelector('[data-qa=card-front]');
    const back = root.querySelector('[data-qa=card-back]');
    return {
      flipped: root.querySelector('[data-qa=card-inner]').hasAttribute('data-flipped'),
      frontHidden: front.getAttribute('aria-hidden') === 'true' && front.inert,
      backHidden: back.getAttribute('aria-hidden') === 'true' && back.inert,
      name: front.querySelector('p:nth-of-type(2)')?.textContent,
      time: front.querySelector('time')?.textContent ?? null,
      text: front.textContent,
      qr: !!back.querySelector('[data-qa=card-qr] path'),
      status: root.querySelector('[data-qa=card-status]')?.textContent ?? '',
      // flat at rest: nothing in the card drawn in 3D (old graphics cards smear 3D groups)
      three: [...root.querySelectorAll('*')].filter((el) => { const cs = getComputedStyle(el); return el.getClientRects().length && (cs.transform.startsWith('matrix3d') || cs.transformStyle === 'preserve-3d'); }).length,
    };
  }, card(scope));
const toContact = async (page) => {
  await page.evaluate(() => {
    const el = document.querySelector('#contact [data-qa=visiting-card]');
    window.scrollTo(0, el.getBoundingClientRect().top + window.scrollY - 160);
  });
  await sleep(900);
};
const leaveTop = async (page) => {
  // the pointer leaves the page through the top edge (toward the tabs)
  await page.mouse.move(700, 200);
  await page.mouse.move(700, 2);
  await page.evaluate(() => document.documentElement.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientX: 700, clientY: -2, relatedTarget: null })));
  await sleep(450);
};
/** decode a PNG (base64) with jsQR inside the page */
const decode = async (page, png) => {
  if (!(await page.evaluate(() => typeof window.jsQR === 'function'))) await page.addScriptTag({ path: new URL('./node_modules/jsqr/dist/jsQR.js', import.meta.url).pathname.replace(/^\/([A-Z]:)/, '$1') });
  return page.evaluate(async (b64) => {
    const img = new Image();
    img.src = `data:image/png;base64,${b64}`;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = img.width;
    c.height = img.height;
    const x = c.getContext('2d');
    x.fillStyle = '#fff';
    x.fillRect(0, 0, c.width, c.height);
    x.drawImage(img, 0, 0);
    const d = x.getImageData(0, 0, c.width, c.height);
    return window.jsQR(d.data, d.width, d.height)?.data ?? null;
  }, png.toString('base64'));
};
const popupOpen = (page) => page.evaluate(() => !!document.querySelector('[data-qa=card-popup] [role=dialog]'));

expect(qrFile.includes(`url: ${JSON.stringify(SITE)}`), `the QR encodes the site's address (${SITE})`);

if (want('desktop')) {
  log('== DESKTOP (the contact section)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  await toContact(page);
  let s = await cardState(page);
  log('  front', { name: s.name });
  expect(s && s.name === 'Prajwal M P' && /Bengaluru, India/.test(s.text) && /Full Stack Developer/.test(s.text) && /Open to new opportunities/.test(s.text), 'the front: Bengaluru, name, role, availability');
  expect(!s.flipped && s.backHidden && !s.frontHidden, 'front first; the back is hidden from assistive tech');
  expect(s.three === 0, `flat at rest (${s.three} 3D parts)`);
  const lay = await page.evaluate(() => {
    const c = document.querySelector('#contact [data-qa=visiting-card]').getBoundingClientRect();
    const now = document.querySelector('#contact [aria-labelledby="now-title"]');
    const n = now?.getBoundingClientRect();
    const h = document.querySelector('#contact-title').getBoundingClientRect();
    const tilt = getComputedStyle(document.querySelector('#contact [data-tilt]')).rotate;
    return { now: !!now, time: now?.querySelector('time')?.textContent ?? null, cardAboveNow: n ? c.bottom <= n.top : false, besideTitle: Math.abs(c.top - h.top) < 140 && c.left > h.left + 300, tilt };
  });
  log('  layout', lay);
  expect(lay.now && lay.time && /\d{1,2}:\d{2}/.test(lay.time), `the Now card is back with the live time (${lay.time})`);
  expect(lay.cardAboveNow && lay.besideTitle, 'the card sits at the top beside the heading, the Now card under it');
  expect(/-9deg/.test(lay.tilt), `the card lies tilted (${lay.tilt})`);
  await page.hover('#contact [data-tilt]');
  await sleep(400);
  const still = await page.evaluate(() => getComputedStyle(document.querySelector('#contact [data-tilt]')).rotate);
  expect(still === lay.tilt, `hovering doesn't move it (${still})`);
  await page.screenshot({ path: `${OUT}/desktop-contact.png` });
  await page.click(`${card()} [data-qa=card-flip]`);
  await sleep(800);
  s = await cardState(page);
  expect(s.flipped && s.frontHidden && !s.backHidden && s.qr, 'Flip shows the back with the QR');
  expect(s.three === 0, `flat at rest on the back too (${s.three} 3D parts)`);
  await page.screenshot({ path: `${OUT}/desktop-back.png` });
  // it scans: the code on its own, and the card as it lies (tilted, taped) on screen
  await page.evaluate(() => {
    const box = document.createElement('div');
    box.id = 'qr-probe';
    box.style.cssText = 'position:fixed;left:0;top:0;z-index:99999;background:#fff;padding:24px';
    const svg = document.querySelector('#contact [data-qa=card-qr]').cloneNode(true);
    svg.style.width = '300px';
    svg.style.height = '300px';
    box.appendChild(svg);
    document.body.appendChild(box);
  });
  const alone = await decode(page, await (await page.$('#qr-probe')).screenshot());
  await page.evaluate(() => document.getElementById('qr-probe').remove());
  const asShown = await decode(page, await (await page.$('#contact [data-qa=card-back]')).screenshot({ scale: 'device' }));
  log('  QR decodes to', { alone, asShown });
  expect(alone === SITE, 'the QR scans (on its own)');
  expect(asShown === SITE, 'the QR scans as it lies on the card (tilted, taped)');
  const [dl] = await Promise.all([page.waitForEvent('download'), page.click(`${card()} [data-qa=card-save]`)]);
  const vcf = fs.readFileSync(await dl.path(), 'utf8');
  log('  vcf', dl.suggestedFilename(), vcf.split(/\r?\n/).length, 'lines');
  expect(dl.suggestedFilename() === 'Prajwal-M-P.vcf', 'Save contact downloads Prajwal-M-P.vcf');
  expect(/BEGIN:VCARD/.test(vcf) && /FN:Prajwal M P/.test(vcf) && /EMAIL;TYPE=INTERNET:prajwalnair2603@gmail.com/.test(vcf) && vcf.includes(`URL:${SITE}`) && /linkedin\.com/.test(vcf), 'the .vcf has the name, email, site and LinkedIn');
  expect(!/^TEL/m.test(vcf), 'and no phone number');
  await sleep(200);
  expect(/Saved Prajwal-M-P\.vcf/.test((await cardState(page)).status), 'it says it saved');
  await page.click(`${card()} [data-qa=card-share]`);
  await sleep(300);
  const clip = await page.evaluate(() => navigator.clipboard.readText().catch(() => ''));
  expect(clip === SITE && /Link copied/.test((await cardState(page)).status), 'Share (no share sheet) copies the link');
  await page.click(`${card()} [data-qa=card-flip]`);
  await sleep(800);
  expect(!(await cardState(page)).flipped, 'Flip back');
  log('  [desktop] errors:', errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

if (want('popup')) {
  log('== POPUP (exit intent, desktop)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  await sleep(1500);
  await leaveTop(page);
  expect(!(await popupOpen(page)), 'not in the first seconds');
  await sleep(5200);
  await page.focus('a[href*="#work"]').catch(() => {});
  const before = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 60));
  await leaveTop(page);
  await sleep(400);
  expect(await popupOpen(page), 'leaving through the top opens it');
  const focus = await page.evaluate(() => document.activeElement?.textContent);
  expect(focus === 'Take my card with you.', 'focus moves to its heading');
  await page.screenshot({ path: `${OUT}/popup.png` });
  // Tab stays inside
  let inside = true;
  for (let i = 0; i < 9; i++) {
    await page.keyboard.press('Tab');
    inside = inside && (await page.evaluate(() => !!document.activeElement?.closest('[data-qa=card-popup]')));
  }
  expect(inside, 'Tab stays inside the popup');
  await page.click('[data-qa=card-popup] [data-qa=card-flip]');
  await sleep(800);
  expect((await cardState(page, '[data-qa=card-popup]')).flipped, 'its card flips too');
  await page.screenshot({ path: `${OUT}/popup-back.png` });
  await page.keyboard.press('Escape');
  await sleep(400);
  const after = await page.evaluate(() => document.activeElement?.outerHTML.slice(0, 60));
  expect(!(await popupOpen(page)) && after === before, 'Esc closes it and focus goes back');
  await leaveTop(page);
  expect(!(await popupOpen(page)), 'only once per visit');
  log('  [popup] errors:', errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

if (want('palette')) {
  log('== PALETTE (Take my card, Save my contact)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } });
  await sleep(1500);
  await page.keyboard.press('Control+k');
  await sleep(400);
  await page.keyboard.type('Take my card');
  await sleep(250);
  await page.keyboard.press('Enter');
  await sleep(900);
  expect(await popupOpen(page), '"Take my card" opens the popup');
  await page.click('[data-qa=card-popup-close]');
  await sleep(400);
  expect(!(await popupOpen(page)), 'the close button closes it');
  await page.keyboard.press('Control+k');
  await sleep(400);
  await page.keyboard.type('Save my contact');
  await sleep(250);
  const [dl] = await Promise.all([page.waitForEvent('download', { timeout: 5000 }).catch(() => null), page.keyboard.press('Enter')]);
  expect(dl && dl.suggestedFilename() === 'Prajwal-M-P.vcf', '"Save my contact" downloads the card');
  log('  [palette] errors:', errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

if (want('mobile')) {
  log('== MOBILE');
  const { context, page, errs } = await open({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await sleep(6800);
  await page.evaluate(() => document.documentElement.dispatchEvent(new MouseEvent('mouseout', { bubbles: true, clientX: 100, clientY: -2, relatedTarget: null })));
  await sleep(400);
  expect(!(await popupOpen(page)), 'no exit popup on a touch screen');
  await toContact(page);
  const s = await cardState(page);
  expect(s && s.name === 'Prajwal M P', 'the card is in the contact section');
  await page.screenshot({ path: `${OUT}/mobile-contact.png` });
  await page.tap(`${card()} [data-qa=card-flip]`);
  await sleep(800);
  expect((await cardState(page)).flipped, 'a tap flips it');
  await page.screenshot({ path: `${OUT}/mobile-back.png` });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(!overflow, 'no sideways page scroll');
  log('  [mobile] errors:', errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

for (const mode of ['reduced', 'sketch']) {
  if (!want(mode)) continue;
  log(`== ${mode.toUpperCase()}`);
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } }, { reduced: mode === 'reduced', sketch: mode === 'sketch' });
  await toContact(page);
  await page.click(`${card()} [data-qa=card-flip]`);
  await sleep(mode === 'reduced' ? 100 : 900);
  const s = await cardState(page);
  if (mode === 'reduced') expect(s.flipped, 'reduced motion: the sides swap at once');
  else expect(s.flipped, 'sketch: it flips');
  await page.screenshot({ path: `${OUT}/${mode}.png` });
  log(`  [${mode}] errors:`, errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

await browser.close();
log(failures ? `done: ${failures} failure(s)` : 'done: all ok');
process.exitCode = failures ? 1 : 0;
