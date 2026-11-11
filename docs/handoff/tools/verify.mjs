// Final verification of the creative boost on the production export (npm run preview, :4173).
// node verify.mjs [desktop,case,mobile,reduced,tablet,laptop | all]   (the stack section: verify-stack.mjs)
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || OUT_DIR;
fs.mkdirSync(OUT, { recursive: true });
const only = (process.argv[2] || 'all').split(',');
const want = (k) => only.includes('all') || only.includes(k);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (...a) => console.log(a.map((x) => (typeof x === 'string' ? x : JSON.stringify(x))).join(' '));

const browser = await chromium.launch({
  channel: 'msedge',
  headless: true,
  args: ['--enable-unsafe-swiftshader', '--use-angle=swiftshader', '--ignore-gpu-blocklist', '--enable-webgl'],
});

const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1';
async function open(name, { width, height, mobile = false, reduced = false, dsf = 1 }) {
  const context = await browser.newContext({
    viewport: { width, height },
    deviceScaleFactor: dsf,
    isMobile: mobile,
    hasTouch: mobile,
    reducedMotion: reduced ? 'reduce' : 'no-preference',
    userAgent: mobile ? IPHONE : undefined,
  });
  // the opening already played in this tab: the short version
  await context.addInitScript(() => {
    try {
      sessionStorage.setItem('pmp:intro-seen', '1');
    } catch {}
  });
  const page = await context.newPage();
  const errs = [];
  page.on('console', (m) => m.type() === 'error' && errs.push(`[console] ${m.text().slice(0, 240)}`));
  page.on('pageerror', (e) => errs.push(`[pageerror] ${String(e.message || e).slice(0, 240)}`));
  page.on('response', (r) => r.status() >= 400 && errs.push(`[http ${r.status()}] ${r.url().slice(0, 140)}`));
  const shot = async (n, opts = {}) => {
    await page.screenshot({ path: `${OUT}/${name}-${n}.png`, ...opts });
    log('  shot', `${name}-${n}`);
  };
  const done = async () => {
    log(`  [${name}] errors: ${errs.length ? '\n    ' + errs.join('\n    ') : 'none'}`);
    await context.close();
  };
  return { context, page, shot, done, errs };
}

/** Scroll so `sel`'s top sits `offset` px below the viewport top (native jump, then let it settle). */
async function scrollTo(page, sel, offset = 120, settle = 1500) {
  const y = await page.evaluate(
    ([s, o]) => {
      const el = document.querySelector(s);
      if (!el) return null;
      const y = el.getBoundingClientRect().top + window.scrollY - o;
      window.scrollTo(0, y);
      return Math.round(y);
    },
    [sel, offset],
  );
  if (y === null) log(`  !! missing ${sel}`);
  await sleep(settle);
  return y;
}

async function wheelTo(page, sel, offset = 120) {
  // wheel in steps (Lenis / ScrollTrigger see a real scroll)
  for (let i = 0; i < 80; i++) {
    const d = await page.evaluate(([s, o]) => {
      const el = document.querySelector(s);
      return el ? el.getBoundingClientRect().top - o : 0;
    }, [sel, offset]);
    if (Math.abs(d) < 40) break;
    await page.mouse.wheel(0, Math.max(-500, Math.min(500, d)));
    await sleep(120);
  }
  await sleep(1200);
}

const attr = (page, sel, names) =>
  page.evaluate(
    ([s, n]) => {
      const el = document.querySelector(s);
      if (!el) return null;
      return Object.fromEntries(n.map((k) => [k, el.getAttribute(k)]));
    },
    [sel, names],
  );

// ---------------------------------------------------------------------------------------------
if (want('desktop')) {
  log('== DESKTOP 1440x900');
  const { page, shot, done } = await open('A', { width: 1440, height: 900 });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await sleep(4500);
  await shot('01-hero');
  await page.mouse.move(700, 450);

  // build: live stack map
  await wheelTo(page, '[data-qa=build-map]', 140);
  await sleep(2500);
  const row = await page.$('[data-qa^=build-row-]');
  if (row) {
    await row.hover();
    await sleep(1200);
  }
  await shot('02-build-map');

  // work: interface -> architecture
  await wheelTo(page, '[data-qa=work-stage-window]', 200);
  await sleep(1500);
  await shot('03-work-interface');
  await page.click('[data-qa=work-view-architecture]');
  await sleep(7500);
  await shot('04-work-architecture');
  log('  diagram', await attr(page, '[data-qa=diagram]', ['data-diagram', 'data-state', 'data-step', 'data-journeys', 'data-running']));
  const cursor = await attr(page, '[data-qa=cursor]', ['data-kind', 'data-state', 'class']);
  log('  cursor over checked tab', cursor);
  const node = await page.$$('[data-qa=diagram-node]');
  if (node[2]) {
    await node[2].hover();
    await sleep(900);
    await shot('05-diagram-hover');
    log('  note', await page.evaluate(() => document.querySelector('[data-qa=diagram-note]')?.textContent?.slice(0, 160) ?? null));
  }
  // next project while on Architecture
  const tab = await page.$('#work-tab-resumai');
  if (tab) {
    await tab.click();
    await sleep(6500);
    await shot('06-work-arch-resumai');
    log('  diagram', await attr(page, '[data-qa=diagram]', ['data-diagram', 'data-state', 'data-journeys']));
  }

  // stack (the iceberg dive; checked in depth by verify-stack.mjs)
  await wheelTo(page, '#stack', 0);
  await sleep(3500);
  await shot('07-stack');

  // about: the vault, locked until it is opened (detail: verify-about.mjs)
  await wheelTo(page, '#about', 0);
  await sleep(1500);
  await scrollTo(page, '[data-qa=vault]', 200, 2600);
  await shot('08-about-vault');
  log('  vault', await page.evaluate(() => { const v = document.querySelector('[data-qa=vault]'); return { phase: v?.dataset.phase, door: !!v?.querySelector('[data-qa=vault-door]'), boxes: v?.querySelectorAll('[data-box]').length ?? 0, verify: v?.querySelectorAll('[data-box] a[href]').length ?? 0 }; }));

  // contact: idea ticket
  await wheelTo(page, '#contact', 0);
  await sleep(1200);
  await page.click('[data-qa=idea-input]');
  await page.keyboard.type('A dashboard that tracks when my plants need water', { delay: 15 });
  await sleep(600);
  await shot('10-idea-typed');
  await page.click('[data-qa=idea-submit]').catch(() => page.keyboard.press('Enter'));
  await sleep(3000);
  await shot('11-idea-ticket');
  log('  ticket', await page.evaluate(() => document.querySelector('[data-qa=idea-ticket-title]')?.textContent ?? null), 'mailto:', await page.evaluate(() => document.querySelector('[data-qa=idea-open-mail]')?.getAttribute('href')?.slice(0, 120) ?? null));

  // palette
  await page.mouse.click(30, 500);
  await page.keyboard.press('Control+K');
  await sleep(1200);
  await shot('12-palette');
  await page.keyboard.type('npm run hire-prajwal', { delay: 10 });
  await page.keyboard.press('Enter');
  await sleep(4200);
  await shot('13-palette-hire');
  log('  palette output', await page.evaluate(() => document.querySelector('[data-qa=palette-output]')?.innerText?.slice(-300) ?? null));
  await page.keyboard.press('Escape');
  await sleep(600);

  // sketch mode
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1200);
  await page.click('[data-qa=sketch-toggle]');
  await sleep(700);
  await shot('14-sketch-mid');
  await sleep(2200);
  await shot('15-sketch-hero');
  log('  html data-sketch:', await page.evaluate(() => document.documentElement.hasAttribute('data-sketch')), 'toggles in header:', await page.evaluate(() => document.querySelectorAll('header [data-qa=sketch-toggle]').length));
  await wheelTo(page, '[data-qa=work-stage-window]', 200);
  await sleep(2500);
  await shot('16-sketch-work');
  await wheelTo(page, '#about', 0);
  await sleep(1500);
  await shot('17-sketch-about');
  // back to ship
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1000);
  await page.click('[data-qa=sketch-toggle]');
  await sleep(3000);
  await shot('18-ship-again');
  await done();
}

// ---------------------------------------------------------------------------------------------
if (want('case')) {
  log('== CASE STUDY desktop');
  const { page, shot, done } = await open('B', { width: 1440, height: 900 });
  await page.goto(BASE + '/work/drone-intelligence/', { waitUntil: 'load' });
  await sleep(3500);
  await shot('01-top');
  await wheelTo(page, '[data-qa=journey]', 80);
  await sleep(1200);
  for (let k = 0; k < 7; k++) {
    await page.mouse.wheel(0, 380);
    await sleep(900);
    if (k === 2 || k === 4 || k === 6) await shot(`02-journey-${k}`);
    log('  journey', await attr(page, '[data-qa=journey]', ['data-journey-mode', 'data-reached']));
  }
  await done();
}

// ---------------------------------------------------------------------------------------------
if (want('mobile')) {
  log('== MOBILE 390x844');
  const { context, page, shot, done } = await open('C', { width: 390, height: 844, mobile: true });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await sleep(4500);
  await shot('01-hero');
  log('  page height', await page.evaluate(() => document.documentElement.scrollHeight));
  // first work card -> architecture
  await scrollTo(page, '[data-qa=work-card-switch]', 90, 2500);
  await page.click('[data-qa=work-card-view-architecture]');
  await sleep(7000);
  await shot('02-card-architecture');
  log('  card', await attr(page, '[data-qa=work-card-visual]', ['data-project', 'data-view']));

  // about: the vault on a phone, the door above the boxes (detail: verify-about.mjs)
  await scrollTo(page, '[data-qa=vault]', 200, 2600);
  await shot('03-about-vault');
  log('  vault', await page.evaluate(() => { const v = document.querySelector('[data-qa=vault]'); return { phase: v?.dataset.phase, door: !!v?.querySelector('[data-qa=vault-door]'), boxes: v?.querySelectorAll('[data-box]').length ?? 0, verify: v?.querySelectorAll('[data-box] a[href]').length ?? 0 }; }));

  // contact
  await scrollTo(page, '#contact', 0, 1500);
  await shot('05-contact');

  // mobile menu -> Contact from the top: the smooth jump must land on the section
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1500);
  for (const target of ['contact', 'about', 'work']) {
    await page.click('[data-qa=menu-toggle]');
    await sleep(900);
    const link = await page.$(`[data-qa=menu-panel] a[href$="#${target}"]`);
    if (!link) {
      log(`  !! no menu link for #${target}`);
      await page.keyboard.press('Escape');
      continue;
    }
    await link.click();
    await sleep(3800);
    const top = await page.evaluate((t) => Math.round(document.getElementById(t).getBoundingClientRect().top), target);
    log(`  menu -> #${target}: section top at ${top}px (header ~64-80)`);
  }
  await shot('06-after-menu-jumps');

  // sketch mode on a phone
  await page.evaluate(() => window.scrollTo(0, 0));
  await sleep(1200);
  await page.click('[data-qa=sketch-toggle]');
  await sleep(2800);
  await shot('07-sketch');
  await page.click('[data-qa=sketch-toggle]');
  await sleep(1500);
  // case study on a phone
  await page.goto(BASE + '/work/resumai/', { waitUntil: 'load' });
  await sleep(3000);
  await scrollTo(page, '[data-qa=journey]', 80, 1500);
  for (let k = 0; k < 4; k++) {
    await page.evaluate(() => window.scrollBy(0, 420));
    await sleep(900);
  }
  await shot('08-case-journey');
  log('  journey', await attr(page, '[data-qa=journey]', ['data-journey-mode', 'data-reached']));
  await done();
}

// ---------------------------------------------------------------------------------------------
if (want('reduced')) {
  log('== REDUCED MOTION desktop');
  const { page, shot, done } = await open('D', { width: 1440, height: 900, reduced: true });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await sleep(2500);
  await scrollTo(page, '[data-qa=work-stage-window]', 200, 1500);
  await page.click('[data-qa=work-view-architecture]');
  await sleep(2500);
  await shot('01-work-architecture');
  log('  diagram', await attr(page, '[data-qa=diagram]', ['data-state', 'data-journeys', 'data-running']), 'packets:', await page.$$eval('[data-qa=diagram-packet]', (p) => p.length));
  // reduced motion: the vault stands open, no button
  await scrollTo(page, '[data-qa=vault]', 200, 800);
  await shot('02-vault');
  log('  vault', await page.evaluate(() => { const v = document.querySelector('[data-qa=vault]'); return { phase: v?.dataset.phase, door: !!v?.querySelector('[data-qa=vault-door]'), boxes: v?.querySelectorAll('[data-box]').length ?? 0, verify: v?.querySelectorAll('[data-box] a[href]').length ?? 0 }; }));
  await done();
}

// ---------------------------------------------------------------------------------------------
if (want('tablet')) {
  log('== TABLET 834x1194');
  const { page, shot, done } = await open('E', { width: 834, height: 1194, mobile: true });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await sleep(4500);
  await shot('01-hero');
  await scrollTo(page, '#work', 0, 2500);
  await shot('02-work');
  await scrollTo(page, '#stack', 0, 4000);
  await shot('03-stack');
  await done();
}

if (want('laptop')) {
  log('== LAPTOP 1280x800');
  const { page, shot, done } = await open('F', { width: 1280, height: 800 });
  await page.goto(BASE + '/', { waitUntil: 'load' });
  await sleep(4500);
  await shot('01-hero');
  await wheelTo(page, '[data-qa=work-stage-window]', 200);
  await sleep(1500);
  await page.click('[data-qa=work-view-architecture]').catch(() => log('  !! no stage switch at 1280x800'));
  await sleep(7000);
  await shot('02-work-architecture');
  await done();
}

await browser.close();
log('done');
