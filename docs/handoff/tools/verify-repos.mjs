// Checks the /repos page (the repos as a code editor): the workspace README is open first; the
// Explorer opens a language folder, a repo folder and its README.md (a tab, breadcrumbs, the source
// and the rendered preview with its links) and repo.json (highlighted, the minimap); tabs close;
// Search filters; Timeline lists the git log and opens a repo; the terminal runs help, ls, open
// (with Tab completion), git log, a wrong command and clear; phone (the side bar is a drawer, the
// README shows its preview, the Source toggle); reduced motion; sketch mode; the header's Repos
// link; 0 console errors.
//   node verify-repos.mjs [desktop,mobile,reduced,sketch,nav | all]
// BASE picks the server (default http://localhost:4173); screenshots go to ./.out/repos unless OUT.
import { OUT_DIR } from './local-tmp.mjs';
import { chromium } from 'playwright-core';
import fs from 'node:fs';

const BASE = process.env.BASE || 'http://localhost:4173';
const OUT = process.env.OUT || `${OUT_DIR}/repos`;
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

async function open(opts, { sketch = false, reduced = false, path = '/repos/' } = {}) {
  const context = await browser.newContext({ ...opts, reducedMotion: reduced ? 'reduce' : 'no-preference' });
  await context.addInitScript((sk) => {
    try {
      sessionStorage.setItem('pmp:intro-seen', '1');
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

const ed = '[data-qa=repo-editor]';
const state = (page) =>
  page.evaluate((ed) => {
    const root = document.querySelector(ed);
    const panel = root?.querySelector('#editor-panel');
    const vis = (el) => !!el && el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    return {
      tabs: [...root.querySelectorAll('[data-qa=editor-tab]')].map((t) => t.textContent.trim() + (t.getAttribute('aria-selected') === 'true' ? ' *' : '')),
      crumbs: root.querySelector('[data-qa=crumbs]')?.textContent.replace(/\s+/g, ' ').trim(),
      h1: [...(panel?.querySelectorAll('article h1') ?? [])].filter(vis).map((h) => h.textContent)[0] ?? 'none',
      links: [...(panel?.querySelectorAll('article a') ?? [])].filter(vis).map((a) => a.textContent.replace(/:.*/, '').trim()),
      sourceLines: [...(panel?.querySelectorAll('pre') ?? [])].filter(vis).map((p) => p.children.length)[0] ?? 0,
      minimap: !!panel?.querySelector('[data-qa=minimap]'),
      sidebar: vis(root.querySelector('aside')),
      termLines: root.querySelectorAll('[data-qa=terminal] p').length,
      editorShown: vis(root.querySelector('#editor-panel')),
      // nothing in the window scrolls on its own (it grows; the page scrolls)
      innerScroll: [...root.querySelectorAll('*')].filter((el) => /auto|scroll/.test(getComputedStyle(el).overflowY) && el.scrollHeight > el.clientHeight + 1).map((el) => el.tagName + '.' + String(el.className).slice(0, 40)),
      width: Math.round(root.getBoundingClientRect().width),
    };
  }, ed);

const runState = (page) =>
  page.evaluate((ed) => {
    const root = document.querySelector(ed);
    const sel = root.querySelector('[data-qa=editor-tab][aria-selected=true]');
    const frame = root.querySelector('[data-qa=live-frame]');
    return {
      tab: sel?.textContent.replace(/^\W*/, '').trim(),
      frame: frame?.getAttribute('src') ?? null,
      loaded: !!frame && !frame.className.includes('opacity-0'),
      running: root.querySelector('[data-qa=running]')?.textContent.trim() ?? null,
      view: root.querySelector('aside')?.getAttribute('aria-label'),
      page: root.querySelector('[data-qa=browser]')?.textContent ?? '',
      tabInView: (() => {
        const strip = root.querySelector('[role=tablist]');
        if (!sel || !strip) return false;
        const a = sel.parentElement.getBoundingClientRect();
        const b = strip.getBoundingClientRect();
        return a.left >= b.left - 1 && a.right <= b.right + 1;
      })(),
      frameBox: frame ? (({ width, height }) => ({ w: Math.round(width), h: Math.round(height) }))(frame.getBoundingClientRect()) : null,
    };
  }, ed);
const shot = async (page, file) => (await page.$(ed)).screenshot({ path: `${OUT}/${file}.png` });
const term = async (page, text, { tab = false } = {}) => {
  await page.click('#repo-term');
  await page.fill('#repo-term', text);
  if (tab) await page.keyboard.press('Tab');
  const typed = await page.inputValue('#repo-term');
  await page.keyboard.press('Enter');
  await sleep(150);
  return typed;
};
const lastLines = (page, n) => page.evaluate(([ed, n]) => [...document.querySelectorAll(`${ed} [data-qa=terminal] p`)].slice(-n).map((p) => p.textContent), [ed, n]);
/** the files of the last open repo folder in the Explorer */
const repoFile = (page, name, i) =>
  page.evaluateHandle(
    ([ed, name, i]) => {
      const repo = [...document.querySelectorAll(`${ed} aside button[data-qa=tree-repo][aria-expanded="true"]`)].find((b) => b.textContent.trim() === name);
      return repo.closest('li').querySelectorAll('button[data-qa=tree-file]')[i];
    },
    [ed, name, i],
  );

for (const [name, opts] of [
  ['desktop', { viewport: { width: 1440, height: 900 } }],
  ['mobile', { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true }],
]) {
  if (!want(name)) continue;
  log(`== ${name.toUpperCase()}`);
  const { context, page, errs } = await open(opts);
  const mobile = name === 'mobile';
  await page.evaluate((ed) => window.scrollTo(0, document.querySelector(ed).getBoundingClientRect().top + window.scrollY - 88), ed);
  await sleep(600);
  let s = await state(page);
  log('  first', s);
  expect(s.tabs.length === 1 && /README\.md \*$/.test(s.tabs[0]) && !s.tabs[0].includes('/'), 'the workspace README is open first');
  expect(/Prajwal.s repos/.test(s.h1), 'its preview shows');
  expect(mobile ? !s.sidebar : s.sidebar, mobile ? 'the side bar is closed (a drawer)' : 'the Explorer shows');
  const vw = await page.evaluate(() => document.documentElement.clientWidth);
  const margin = await page.evaluate(() => parseFloat(getComputedStyle(document.querySelector('[data-qa=repo-editor]').parentElement).marginLeft));
  expect(Math.abs(s.width + 2 * margin - vw) <= 2, `the window uses the full width (${s.width} of ${vw})`);
  expect(!s.innerScroll.length, `nothing inside scrolls ${s.innerScroll.length ? JSON.stringify(s.innerScroll) : ''}`);
  await shot(page, `${name}-workspace`);

  if (mobile) {
    await page.click(`${ed} nav button[aria-label=Explorer]`);
    await sleep(250);
    s = await state(page);
    expect(s.sidebar && !s.editorShown, 'the Explorer button opens the side bar in place of the editor');
    await shot(page, `${name}-drawer`);
  }
  // the Explorer: a closed language folder, then a repo folder in it, then its files
  const lang = await page.$(`${ed} aside button[data-qa=tree-lang][aria-expanded="false"]`);
  const langName = lang ? (await lang.innerText()).split('\n')[0].trim() : null;
  if (lang) await lang.click();
  await sleep(150);
  const repo = await page.$(`${ed} aside button[data-qa=tree-repo][aria-expanded="false"]`);
  const repoName = repo ? (await repo.innerText()).trim() : null;
  if (repo) await repo.click();
  await sleep(150);
  log('  opened folders', langName, '›', repoName);
  await (await repoFile(page, repoName, 0)).click();
  await sleep(300);
  s = await state(page);
  log('  README', s);
  expect(s.tabs.length === 2 && s.tabs[1].endsWith('*'), 'a README opens in a new tab');
  expect(/README\.md$/.test(s.crumbs ?? ''), 'the breadcrumbs end at README.md');
  expect(s.links.includes('Open on GitHub'), 'the preview has the GitHub link');
  expect(mobile ? s.sourceLines === 0 : s.sourceLines > 5, mobile ? 'the phone shows the preview only' : 'the source shows beside the preview');
  expect(mobile ? !s.sidebar : s.sidebar, mobile ? 'opening a file closes the drawer' : 'the Explorer stays');
  await shot(page, `${name}-readme`);
  if (mobile) {
    await page.click(`${ed} button[aria-pressed]:text-is("Source")`);
    await sleep(200);
    s = await state(page);
    expect(s.sourceLines > 5 && s.h1 === 'none', 'the Source toggle shows the source');
    await shot(page, `${name}-source`);
    await page.click(`${ed} button[aria-pressed]:text-is("Preview")`);
    await page.click(`${ed} nav button[aria-label=Explorer]`);
    await sleep(250);
  }
  await (await repoFile(page, repoName, 1)).click();
  await sleep(300);
  s = await state(page);
  log('  repo.json', s);
  expect(/repo\.json$/.test(s.crumbs ?? '') && s.sourceLines >= 10, 'repo.json opens, highlighted');
  expect(s.minimap, 'with a minimap');
  await page.click(`${ed} [data-qa=source] [data-line="8"]`);
  await sleep(150);
  const cur = await page.evaluate((ed) => ({ pos: document.querySelector(`${ed} [data-qa=cursor-pos]`)?.textContent, blame: document.querySelector(`${ed} [data-qa=blame]`)?.closest('[data-line]')?.dataset.line, note: document.querySelector(`${ed} [data-qa=blame]`)?.textContent }), ed);
  log('  cursor', cur);
  expect(cur.pos === 'Ln 8, Col 1' && cur.blame === '8' && /^created \d{4}-\d\d-\d\d · pushed/.test(cur.note ?? ''), 'a click puts the cursor (and its note) on a line');
  await shot(page, `${name}-json`);

  // close a tab
  const before = s.tabs.length;
  await page.click(`${ed} [role=tablist] button[aria-label^="Close"] >> nth=-1`);
  await sleep(150);
  s = await state(page);
  expect(s.tabs.length === before - 1 && s.tabs.some((t) => t.endsWith('*')), 'closing a tab selects its neighbour');

  // Search
  await page.click(`${ed} nav button[aria-label=Search]`);
  await sleep(200);
  await page.fill('#repo-search', 'ai');
  await sleep(200);
  const results = await page.evaluate((ed) => document.querySelector(`${ed} aside [aria-live]`).textContent, ed);
  log('  search "ai":', results);
  expect(/\d+ results?/.test(results), 'Search filters');
  await shot(page, `${name}-search`);
  if (mobile) {
    await page.click(`${ed} nav button[aria-label=Search]`);
    await sleep(200);
  }

  // Timeline
  await page.click(`${ed} nav button[aria-label^=Timeline]`);
  await sleep(250);
  const commits = await page.$$(`${ed} aside ol button`);
  log('  timeline commits', commits.length);
  expect(!(await state(page)).innerScroll.length, 'the Timeline grows the window (no inner scroll)');
  expect(commits.length >= 20, 'the Timeline lists a commit per repo');
  await shot(page, `${name}-timeline`);
  await commits[3].click();
  await sleep(250);
  s = await state(page);
  expect(s.tabs.some((t) => t.endsWith('*')) && /README\.md$/.test(s.crumbs ?? ''), 'a commit opens its repo');

  // the terminal
  if (!mobile) {
    await term(page, 'help');
    expect((await lastLines(page, 14)).some((l) => l.includes('open <repo>')) && (await lastLines(page, 14)).some((l) => l.includes('npm run dev')), 'help lists the commands (with npm run dev)');
    await term(page, 'ls');
    expect((await lastLines(page, 3)).some((l) => l.includes('/')), 'ls lists the folders');
    await term(page, 'ls type');
    const typed = await term(page, 'open aud', { tab: true });
    log('  Tab completed to', typed);
    expect((await lastLines(page, 1))[0].startsWith('opened'), 'open <repo> opens it');
    await term(page, 'neofetch');
    expect((await lastLines(page, 9)).some((l) => l.startsWith('repos ')), 'neofetch sums up the workspace');
    await shot(page, `${name}-neofetch`);
    await term(page, 'git log');
    expect((await lastLines(page, 2)).some((l) => l.includes('feat: create')), 'git log prints commits');
    await term(page, 'rm -rf /');
    expect((await lastLines(page, 1))[0].includes('command not found'), 'a wrong command says so');
    await page.keyboard.press('ArrowUp');
    expect((await page.inputValue('#repo-term')) === 'rm -rf /', 'ArrowUp recalls history');
    await page.fill('#repo-term', '');
    await shot(page, `${name}-terminal`);
    s = await state(page);
    expect(!s.innerScroll.length, 'the terminal grows with its output (no inner scroll)');
    const prompt = await page.evaluate(() => { const r = document.getElementById('repo-term').getBoundingClientRect(); return r.bottom <= window.innerHeight && r.top >= 0; });
    expect(prompt, 'the prompt stays on screen');
    await term(page, 'clear');
    expect((await state(page)).termLines === 0, 'clear empties it');

    // run: cd into a repo, npm run dev, the browser opens its live page; Ctrl+C stops it
    await term(page, 'cd Livora');
    const label = await page.evaluate(() => document.querySelector('label[for=repo-term]').textContent.trim());
    expect(label === 'prajwal@repos ~/Livora $', `cd moves the prompt (${label})`);
    await term(page, 'npm run dev');
    await sleep(2400);
    let run = await runState(page);
    log('  cd Livora + npm run dev', run);
    expect(run.tab === 'Livora · live' && /github\.io\/Livora\/$/.test(run.frame ?? '') && run.running === 'running Livora', 'it runs Livora and opens its live page in a browser tab');
    for (let i = 0; i < 40 && !run.loaded; i++) {
      await sleep(250);
      run = await runState(page);
    }
    expect(run.loaded, 'the live page loads in the frame');
    await shot(page, `${name}-browser`);
    await page.click('#repo-term');
    await page.keyboard.press('Control+c');
    await sleep(300);
    run = await runState(page);
    expect(!run.tab?.endsWith('live') && !run.running, 'Ctrl+C stops it (the browser tab closes)');
    await term(page, 'cd ..');
    await term(page, 'npm start');
    await sleep(2400);
    run = await runState(page);
    log('  npm start from the workspace (with a README of a repo open)', run.tab);
    await term(page, 'stop');
    // the play button: a repo that is not deployed says so; from the workspace README it runs the portfolio
    await page.click(`${ed} nav button[aria-label=Explorer]`);
    await page.click(`${ed} [role=tablist] [data-qa=editor-tab] >> nth=0`);
    await sleep(200);
    await page.click(`${ed} nav button[aria-label^="Run"]`);
    await sleep(2400);
    run = await runState(page);
    log('  play from the workspace README', run);
    expect(run.tab === 'Portfolio · live' && /\/Portfolio\/$/.test(run.frame ?? ''), 'play from the workspace runs the portfolio');
    expect(run.view === 'Run and debug', 'the side bar shows Run and debug');
    await shot(page, `${name}-play`);
    await term(page, 'run AI-Resume-Builder');
    await sleep(2400);
    run = await runState(page);
    log('  run a repo that is not deployed', run);
    expect(run.tab === 'AI-Resume-Builder · live' && !run.frame && /isn.t deployed/.test(run.page) && !run.running, 'a repo with no live page opens a page that says so (and nothing is running)');
    await shot(page, `${name}-not-deployed`);
    expect(run.tabInView, 'the open tab is in sight in the tab strip');
  }
  if (mobile) {
    await page.click(`${ed} nav button[aria-label^="Run"]`);
    await sleep(2600);
    const run = await runState(page);
    s = await state(page);
    log('  play', run);
    expect(/· live$/.test(run.tab ?? '') && s.editorShown && !s.sidebar, 'play runs the open repo and shows the browser (no drawer)');
    expect(run.tabInView, 'the browser tab is in sight in the tab strip');
    expect(run.frameBox && run.frameBox.h >= 400, `the live page has room (${JSON.stringify(run.frameBox)})`);
    await page.evaluate((ed) => window.scrollTo(0, document.querySelector(ed).getBoundingClientRect().top + window.scrollY - 88), ed);
    await sleep(300);
    await shot(page, `${name}-browser`);
  }
  await page.screenshot({ path: `${OUT}/${name}-page.png`, fullPage: true });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 1);
  expect(!overflow, 'no sideways page scroll');
  log(`  [${name}] errors:`, errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

for (const mode of ['reduced', 'sketch']) {
  if (!want(mode)) continue;
  log(`== ${mode.toUpperCase()}`);
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } }, { reduced: mode === 'reduced', sketch: mode === 'sketch' });
  await page.evaluate((ed) => window.scrollTo(0, document.querySelector(ed).getBoundingClientRect().top + window.scrollY - 88), ed);
  await sleep(1200);
  const s = await state(page);
  log('  state', s);
  expect(s.h1 !== 'none', 'the workspace shows');
  await shot(page, mode);
  log(`  [${mode}] errors:`, errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

if (want('nav')) {
  log('== NAV (Repos in the header, from home)');
  const { context, page, errs } = await open({ viewport: { width: 1440, height: 900 } }, { path: '/' });
  await sleep(2500);
  const link = await page.$('header nav a[href$="/repos/"]');
  log('  header link', link ? await link.innerText() : 'missing');
  for (const w of [1440, 1024, 900]) {
    await page.setViewportSize({ width: w, height: 800 });
    await sleep(300);
    const fit = await page.evaluate(() => {
      const row = document.querySelector('header .wrap');
      return row ? row.scrollWidth <= row.clientWidth + 1 : null;
    });
    expect(fit !== false, `${w}px header fits`);
  }
  await page.setViewportSize({ width: 1440, height: 900 });
  await link.click();
  await page.waitForURL(/\/repos\/?$/, { timeout: 10000 });
  await sleep(1200);
  expect((await page.evaluate(() => document.querySelector('header nav a[href$="/repos/"]')?.getAttribute('aria-current'))) === 'page', 'the Repos link is current');
  expect(!!(await page.$(ed)), 'the editor is there');
  log('  [nav] errors:', errs.length ? errs : 'none');
  if (errs.length) failures++;
  await context.close();
}

await browser.close();
log(failures ? `done: ${failures} failure(s)` : 'done: all ok');
process.exitCode = failures ? 1 : 0;
