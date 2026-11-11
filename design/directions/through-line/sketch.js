/* Through-Line — live motion sketch (classic script; three.js is lazy-loaded by stack.js via the import map). */
(() => {
  'use strict';
  const html = document.documentElement;
  const { gsap, ScrollTrigger, SplitText, CustomEase } = window;
  if (!gsap || !ScrollTrigger) { html.classList.remove('intro'); return; }
  gsap.registerPlugin(ScrollTrigger, SplitText, CustomEase);
  CustomEase.create('cine', '.7,0,.2,1');

  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const DATA = window.TL_DATA;
  const RM = html.classList.contains('rm');
  const FINE = matchMedia('(pointer: fine)').matches && matchMedia('(hover: hover)').matches;
  const DESK = () => innerWidth >= 1024;
  const SAVE = !!(navigator.connection && navigator.connection.saveData) || (navigator.deviceMemory && navigator.deviceMemory <= 2);
  let restoring = false;
  try { restoring = sessionStorage.getItem('tl-restore') === 'contact'; sessionStorage.removeItem('tl-restore'); } catch (e) { /* private mode */ }
  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

  /* ------------------------------------------------------------------ elements */
  const hdr = $('[data-hdr]');
  const hero = $('.hero'), heroInner = $('.hero-inner'), title = $('.title'), nameEl = $('.name'), probe = $('.probe');
  const chars = $$('.name .ch');
  const lead = $('.lead'), layersNav = $('.layers');
  const thr = $('.thr'), thrShadow = $('.thr-shadow'), thrDrop = $('.thr-drop');
  const texEls = { n: $('.set-tex[data-dir="n"]'), e: $('.set-tex[data-dir="e"]'), s: $('.set-tex[data-dir="s"]'), w: $('.set-tex[data-dir="w"]') };
  const projection = $('.projection');
  const contact = $('.contact');
  const work = $('.work');
  const stageWrap = $('.stage-wrap');

  /* ------------------------------------------------------------------ Lenis (desktop wheel only) */
  let lenis = null;
  if (!RM && FINE && window.Lenis) {
    lenis = new window.Lenis({ lerp: 0.1, wheelMultiplier: 1, autoRaf: false });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }

  /* ------------------------------------------------------------------ title fit (glyph bounds, edge to edge) */
  let FS = parseFloat(getComputedStyle(title).fontSize) || 200;
  const mctx = document.createElement('canvas').getContext('2d');
  function fitTitle() {
    const measure = heroInner.clientWidth;
    if (!measure) return;
    const cur = parseFloat(getComputedStyle(title).fontSize);
    const w = nameEl.getBoundingClientRect().width;
    mctx.font = '900 100px "Sofia Sans Extra Condensed"';
    const m = mctx.measureText('P');
    const lsb = -m.actualBoundingBoxLeft / 100, rsb = (m.width - m.actualBoundingBoxRight) / 100;
    const inkEm = w / cur - lsb - rsb + 0.005;
    FS = Math.floor((measure / inkEm) * 0.998 * 100) / 100;
    heroInner.style.setProperty('--fs', FS + 'px');
    nameEl.style.marginLeft = (-lsb * FS).toFixed(2) + 'px';
  }
  function measureLetters() {
    const hr = hero.getBoundingClientRect();
    chars.forEach((c) => {
      const r = c.getBoundingClientRect();
      c.style.setProperty('--cx', (r.left + r.width / 2 - hr.left).toFixed(1));
    });
    const pr = probe.getBoundingClientRect();
    title.style.setProperty('--cy', (pr.top - hr.top - T.titleDY - FS * 0.33).toFixed(1));
  }

  /* ------------------------------------------------------------------ the thread (SVG, one continuous stroke) */
  const T = {
    x0: 0, x1: 0, ruleY: 0, spineBottom: 0, innerH: 0, r: 8,
    foot: 12, drop: 0, titleDY: 0, leadDY: 0,
    d: 0, v: 0, target: 0, bumpX: 0,
    draw: RM ? 1 : 0, len: 0, f1: 0.8, dashed: !RM,
    sx: 1, sy: 1, dirty: true, ready: false, padL: 0, top: 0,
  };
  function measureThread() {
    const ir = heroInner.getBoundingClientRect();
    const pr = probe.getBoundingClientRect();
    const lr = layersNav.getBoundingClientRect();
    T.x0 = 0; T.x1 = ir.width; T.innerH = ir.height;
    T.ruleY = pr.top - ir.top - T.titleDY + FS * 0.06;
    T.spineBottom = lr.bottom - ir.top - T.leadDY - 6;
    const straight = `M${T.x0} ${T.ruleY} L${T.x1 - T.r} ${T.ruleY} Q${T.x1} ${T.ruleY} ${T.x1} ${T.ruleY + T.r} L${T.x1} ${T.spineBottom} L${T.x1 - 12} ${T.spineBottom}`;
    thr.setAttribute('d', straight);
    T.len = thr.getTotalLength();
    T.f1 = (T.x1 - T.r - T.x0) / T.len;
    T.padL = heroInner.offsetLeft; T.top = heroInner.offsetTop;
    const pinEl = document.querySelector('.stack-pin');
    T.dropTail = pinEl ? parseFloat(getComputedStyle(pinEl).paddingTop) || 72 : 72;
    T.ready = true; T.dirty = true;
  }
  function threadD() {
    const y = T.ruleY + T.titleDY, x0 = T.x0, x1 = T.x1, r = T.r;
    const yb = Math.max(y + r + 2, T.spineBottom + T.leadDY);
    let d = `M${x0.toFixed(1)} ${y.toFixed(2)}`;
    if (Math.abs(T.d) > 0.04) {
      const w = 130, bx = clamp(T.bumpX, x0 + w + 4, x1 - r - w - 4), yy = (y + T.d).toFixed(2);
      d += ` L${(bx - w).toFixed(1)} ${y.toFixed(2)} C${(bx - w * 0.5).toFixed(1)} ${y.toFixed(2)} ${(bx - w * 0.38).toFixed(1)} ${yy} ${bx.toFixed(1)} ${yy} C${(bx + w * 0.38).toFixed(1)} ${yy} ${(bx + w * 0.5).toFixed(1)} ${y.toFixed(2)} ${(bx + w).toFixed(1)} ${y.toFixed(2)}`;
    }
    d += ` L${(x1 - r).toFixed(1)} ${y.toFixed(2)} Q${x1.toFixed(1)} ${y.toFixed(2)} ${x1.toFixed(1)} ${(y + r).toFixed(2)} L${x1.toFixed(1)} ${yb.toFixed(2)}`;
    if (T.foot > 0.3) d += ` L${(x1 - T.foot).toFixed(1)} ${yb.toFixed(2)}`;
    return { d, yb };
  }
  function renderThread() {
    if (!T.ready) return;
    const { d, yb } = threadD();
    thr.setAttribute('d', d);
    thrShadow.setAttribute('d', d);
    thrShadow.setAttribute('transform', `translate(${T.sx.toFixed(2)} ${T.sy.toFixed(2)})`);
    if (T.dashed) {
      const L = T.len, off = (L * (1 - T.draw)).toFixed(2);
      thr.style.strokeDasharray = thrShadow.style.strokeDasharray = `${L.toFixed(2)} ${L.toFixed(2)}`;
      thr.style.strokeDashoffset = thrShadow.style.strokeDashoffset = off;
    }
    if (T.drop > 0.5) thrDrop.setAttribute('d', `M${T.x1.toFixed(1)} ${yb.toFixed(2)} L${T.x1.toFixed(1)} ${(yb + T.drop).toFixed(2)}`);
    else thrDrop.setAttribute('d', '');
    T.dirty = false;
  }

  /* ------------------------------------------------------------------ the lit set: one key light = the pointer */
  const L = { x: 0, y: 0, tx: 0, ty: 0, li: RM ? 1 : 0, dim: RM ? 0 : 0.42, imp: RM ? 1 : 0, iris: 1, follow: false, dirty: true, pointerSeen: false };
  const restLight = () => ({ x: hero.clientWidth * (RM ? 0.2 : 0.64), y: hero.clientHeight * (RM ? 0.16 : 0.24) });
  function applyLight() {
    const li = L.li * L.iris;
    const s = hero.style;
    s.setProperty('--lx', L.x.toFixed(1));
    s.setProperty('--ly', L.y.toFixed(1));
    s.setProperty('--li', li.toFixed(3));
    s.setProperty('--dim', L.dim.toFixed(3));
    s.setProperty('--imp', L.imp.toFixed(3));
    const cx = hero.clientWidth / 2, cy = hero.clientHeight * 0.42;
    let dx = L.x - cx, dy = L.y - cy;
    const len = Math.hypot(dx, dy) || 1; dx /= len; dy /= len;
    const k = li * (0.6 + 0.4 * Math.min(1, len / (hero.clientWidth * 0.3)));
    texEls.e.style.opacity = (Math.max(0, dx) * k).toFixed(3);
    texEls.w.style.opacity = (Math.max(0, -dx) * k).toFixed(3);
    texEls.s.style.opacity = (Math.max(0, dy) * k).toFixed(3);
    texEls.n.style.opacity = (Math.max(0, -dy) * k).toFixed(3);
    // the thread's 1px shadow falls away from the light
    const mx = (T.x0 + T.x1) / 2 + T.padL, my = T.ruleY + T.top;
    let sx = mx - L.x, sy = my - L.y; const sl = Math.hypot(sx, sy) || 1;
    T.sx = (sx / sl) * 1.6; T.sy = Math.max(0.6, (sy / sl) * 1.6 + 0.6);
    T.dirty = true;
    L.dirty = false;
  }

  /* paper: procedural laid-paper height field, baked under four raking lights (N, E, S, W) */
  function makePaper(done) {
    if (SAVE || matchMedia('(prefers-contrast: more)').matches) { done && done(); return; }
    const S = 512;
    let seed = 20251205;
    const rnd = () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
    const c = document.createElement('canvas'); c.width = c.height = S;
    const x = c.getContext('2d', { willReadFrequently: true });
    x.fillStyle = '#000'; x.fillRect(0, 0, S, S);
    x.globalCompositeOperation = 'lighter'; x.lineCap = 'round';
    for (let i = 0; i < 1500; i++) {
      const px = rnd() * S, py = rnd() * S, len = 4 + rnd() * rnd() * 34, ang = rnd() * Math.PI * 2, bend = (rnd() - 0.5) * 0.8;
      x.lineWidth = 0.4 + rnd() * 0.7;
      x.strokeStyle = `rgba(255,255,255,${(0.04 + rnd() * 0.08).toFixed(3)})`;
      const ex = Math.cos(ang) * len, ey = Math.sin(ang) * len, mx = Math.cos(ang + bend) * len * 0.5, my = Math.sin(ang + bend) * len * 0.5;
      for (let ox = -S; ox <= S; ox += S) for (let oy = -S; oy <= S; oy += S) {
        const sx = px + ox, sy = py + oy;
        if (sx < -80 || sx > S + 80 || sy < -80 || sy > S + 80) continue;
        x.beginPath(); x.moveTo(sx, sy); x.quadraticCurveTo(sx + mx, sy + my, sx + ex, sy + ey); x.stroke();
      }
    }
    const fib = x.getImageData(0, 0, S, S).data;
    const grid = (n) => { const g = new Float32Array(n * n); for (let i = 0; i < g.length; i++) g[i] = rnd(); return g; };
    const g1 = grid(16), g2 = grid(64);
    const vn = (g, n, u, v) => {
      const fx = u * n, fy = v * n, ix = Math.floor(fx), iy = Math.floor(fy), tx = fx - ix, ty = fy - iy;
      const sx = tx * tx * (3 - 2 * tx), sy = ty * ty * (3 - 2 * ty);
      const i0 = ix % n, i1 = (ix + 1) % n, j0 = iy % n, j1 = (iy + 1) % n;
      const a = g[j0 * n + i0], b = g[j0 * n + i1], cc = g[j1 * n + i0], d = g[j1 * n + i1];
      return a + (b - a) * sx + (cc - a) * sy + (a - b - cc + d) * sx * sy;
    };
    const H = new Float32Array(S * S), chain = S / 5;
    for (let y = 0; y < S; y++) {
      const laid = 0.012 * Math.cos((2 * Math.PI * y) / 4);
      for (let xx = 0; xx < S; xx++) {
        const i = y * S + xx;
        const cd = Math.abs(((xx + chain / 2) % chain) - chain / 2);
        H[i] = fib[i * 4] / 255 + 0.5 * vn(g1, 16, xx / S, y / S) + 0.22 * vn(g2, 64, xx / S, y / S) + laid - 0.1 * Math.exp(-(cd * cd) / 18);
      }
    }
    const dirs = { n: [0, -1], e: [1, 0], s: [0, 1], w: [-1, 0] };
    let encoded = 0;
    const out = document.createElement('canvas'); out.width = out.height = S;
    const ox = out.getContext('2d');
    for (const key of Object.keys(dirs)) {
      const [lx, ly] = dirs[key], lz = 0.42, ln = Math.hypot(lx, ly, lz), Lx = lx / ln, Ly = ly / ln, Lz = lz / ln;
      const img = ox.createImageData(S, S), o = img.data;
      for (let y = 0; y < S; y++) {
        const yu = ((y - 1 + S) % S) * S, yd = ((y + 1) % S) * S, yr = y * S;
        for (let xx = 0; xx < S; xx++) {
          const xl = (xx - 1 + S) % S, xr = (xx + 1) % S;
          const gx = (H[yr + xr] - H[yr + xl]) * 1.5, gy = (H[yd + xx] - H[yu + xx]) * 1.5;
          const sh = (-gx * Lx - gy * Ly + Lz) / Math.hypot(gx, gy, 1) - Lz;
          const j = (yr + xx) * 4;
          if (sh > 0) { o[j] = 255; o[j + 1] = 252; o[j + 2] = 242; o[j + 3] = Math.min(64, sh * 150); }
          else { o[j] = 70; o[j + 1] = 56; o[j + 2] = 40; o[j + 3] = Math.min(52, -sh * 120); }
        }
      }
      ox.putImageData(img, 0, 0);
      out.toBlob((b) => {
        if (b) texEls[key].style.backgroundImage = `url(${URL.createObjectURL(b)})`;
        if (++encoded === 4 && done) done();
      }, 'image/png');
    }
  }

  /* ------------------------------------------------------------------ pointer: key light + thread tension */
  const P = { x: -999, y: -999, inHero: false };
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
    P.x = e.clientX; P.y = e.clientY;
    const hr = hero.getBoundingClientRect();
    P.inHero = e.clientY >= hr.top && e.clientY <= hr.bottom;
    if (P.inHero) { L.tx = e.clientX - hr.left; L.ty = e.clientY - hr.top; L.pointerSeen = true; }
    if (RM) return;
    const ir = heroInner.getBoundingClientRect();
    const ry = ir.top + T.ruleY + T.titleDY, rx = e.clientX - ir.left;
    const dy = e.clientY - ry;
    if (T.draw >= 1 && Math.abs(dy) < 70 && rx > T.x0 + 20 && rx < T.x1 - 30) {
      T.target = (dy < 0 ? 1 : -1) * 4 * (1 - Math.abs(dy) / 70);
      T.bumpX += (rx - T.bumpX) * (Math.abs(T.d) < 0.1 ? 1 : 0.35);
    } else T.target = 0;
  }, { passive: true });
  addEventListener('pointerleave', () => { T.target = 0; }, { passive: true });

  // touch: a tap moves the light and plucks the thread once
  if (!FINE && !RM) {
    hero.addEventListener('pointerdown', (e) => {
      if (introTl && introTl.progress() < 1) return;
      const hr = hero.getBoundingClientRect(), ir = heroInner.getBoundingClientRect();
      gsap.killTweensOf(L, 'x,y');
      gsap.to(L, { x: e.clientX - hr.left, y: e.clientY - hr.top, duration: 0.7, ease: 'power3.out', onUpdate: () => { L.dirty = true; } });
      T.bumpX = clamp(e.clientX - ir.left, 140, T.x1 - 150); T.v = -150;
    }, { passive: true });
  }

  let lastT = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now(), dt = Math.min(1 / 30, (now - lastT) / 1000); lastT = now;
    if (L.follow && L.pointerSeen) {
      const dx = L.tx - L.x, dy = L.ty - L.y;
      if (Math.abs(dx) + Math.abs(dy) > 0.3) { L.x += dx * 0.08; L.y += dy * 0.08; L.dirty = true; }
    }
    if (L.dirty && heroVisible) applyLight();
    if (!RM && T.draw >= 1) {
      const a = -180 * (T.d - T.target) - 14 * T.v;
      T.v += a * dt; T.d += T.v * dt;
      if (Math.abs(T.d) > 0.02 || Math.abs(T.v) > 0.05 || Math.abs(T.target) > 0) T.dirty = true;
      else if (T.d !== 0) { T.d = 0; T.v = 0; T.dirty = true; }
    }
    if (T.dirty && heroVisible) renderThread();
    cursorFrame();
  });
  let heroVisible = true;
  new IntersectionObserver(([en]) => { heroVisible = en.isIntersecting; if (heroVisible) { L.dirty = true; T.dirty = true; } }, { rootMargin: '0px 0px 200px 0px' }).observe(hero);

  /* ------------------------------------------------------------------ cinematic cursor: viewfinder brackets (fine pointers) */
  const vf = $('.vf'), vfLabel = $('.vf-label'), ring = $('.ring');
  const bk = { tl: $('.vf-b.tl'), tr: $('.vf-b.tr'), bl: $('.vf-b.bl'), br: $('.vf-b.br') };
  const C = { el: null, lockFn: null, label: '', atPointer: false, on: false, pos: { tl: [0, 0], tr: [0, 0], bl: [0, 0], br: [0, 0], lab: [0, 0] }, init: false };
  const TARGETS = 'a[href], button, label.pick, [data-cursor]';
  const cursor = {
    lock(fn, label, atPointer) { C.lockFn = fn; C.label = label; C.atPointer = !!atPointer; vfLabel.textContent = label; },
    unlock() { C.lockFn = null; C.atPointer = false; if (!C.el) vfLabel.textContent = ''; },
  };
  if (FINE) {
    document.addEventListener('pointerover', (e) => {
      if (e.pointerType !== 'mouse' && e.pointerType !== 'pen') return;
      const t = e.target.closest(TARGETS);
      if (t === C.el) return;
      C.el = t && !t.closest('dialog') ? t : null;
      if (C.el) vfLabel.textContent = C.el.dataset.cursor || '';
    }, { passive: true });
    html.addEventListener('mouseleave', () => { C.el = null; P.x = -999; P.inHero = false; }, { passive: true });
  }
  function cursorFrame() {
    if (!FINE) return;
    let r = null;
    if (C.lockFn) r = C.lockFn();
    else if (C.el && C.el.isConnected) r = C.el.getBoundingClientRect();
    const on = !!(r && r.width);
    if (on !== C.on) { C.on = on; vf.classList.toggle('on', on); if (!on) vfLabel.textContent = ''; else if (C.lockFn) vfLabel.textContent = C.label; }
    const pad = 6, k = RM ? 1 : 0.26;
    let tgt;
    if (on) {
      tgt = { tl: [r.left - pad, r.top - pad], tr: [r.right + pad, r.top - pad], bl: [r.left - pad, r.bottom + pad], br: [r.right + pad, r.bottom + pad] };
      const lw = vfLabel.offsetWidth || 80;
      // the label hangs just outside the bracket's bottom-right corner (above it near the viewport floor),
      // so it never lands on a neighbouring link in a row
      const below = r.bottom + pad + 30 < innerHeight;
      tgt.lab = C.lockFn && C.atPointer ? [P.x + 18, P.y + 14]
        : [Math.max(8, Math.min(innerWidth - lw - 8, r.right + pad - lw)), below ? r.bottom + pad + 6 : r.top - pad - 24];
      const dark = (contact.classList.contains('inv') && (C.el ? !!C.el.closest('.contact') : false)) || (hdr.classList.contains('on-dark') && C.el && !!C.el.closest('.hdr'));
      vf.classList.toggle('dark', dark || html.classList.contains('rm') && C.el && !!C.el.closest('.contact'));
    } else {
      tgt = { tl: [P.x - 4, P.y - 4], tr: [P.x + 4, P.y - 4], bl: [P.x - 4, P.y + 4], br: [P.x + 4, P.y + 4], lab: [P.x + 16, P.y - 9] };
    }
    if (!C.init) { for (const key in tgt) C.pos[key] = tgt[key].slice(); C.init = true; }
    for (const key in tgt) {
      const p = C.pos[key], t = tgt[key];
      p[0] += (t[0] - p[0]) * k; p[1] += (t[1] - p[1]) * k;
      if (key === 'lab') vfLabel.style.transform = `translate3d(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px, 0)`;
      else bk[key].style.transform = `translate3d(${p[0].toFixed(1)}px, ${p[1].toFixed(1)}px, 0)`;
    }
    const ringOn = P.inHero && !on && P.x > 0 && heroVisible;
    ring.classList.toggle('on', ringOn);
    if (ringOn) ring.style.transform = `translate3d(${P.x}px, ${P.y}px, 0)`;
  }

  /* ------------------------------------------------------------------ dialogs (index + layer sheet) */
  function openDialog(dlg, opener, fromSide) {
    if (dlg.open) return;
    lenis && lenis.stop();
    dlg.showModal();
    const inner = dlg.firstElementChild;
    if (!RM) {
      if (fromSide) gsap.fromTo(inner, { xPercent: 100 }, { xPercent: 0, duration: 0.5, ease: 'expo.out' });
      else gsap.fromTo(inner, { clipPath: 'inset(0% 0% 100% 0%)' }, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.5, ease: 'expo.out' });
    }
    dlg.addEventListener('close', () => { lenis && lenis.start(); if (opener && opener.isConnected && dlg.dataset.noReturn !== '1') opener.focus({ preventScroll: true }); dlg.dataset.noReturn = ''; }, { once: true });
  }
  $$('dialog').forEach((dlg) => {
    dlg.addEventListener('click', (e) => { if (e.target === dlg) dlg.close(); });
    $$('[data-close]', dlg).forEach((b) => b.addEventListener('click', () => dlg.close()));
  });
  const sheet = $('.sheet');
  function openSheet(i, opener) {
    const Ld = DATA.layers[i];
    $('[data-sheet-k]', sheet).textContent = `Layer ${Ld.n} / 05`;
    $('#sheet-title').textContent = Ld.name;
    const list = $('[data-sheet-list]', sheet);
    list.replaceChildren();
    DATA.tools[i].forEach(([tool, proof]) => {
      const row = document.createElement('div');
      const dt = document.createElement('dt'); dt.textContent = tool;
      const dd = document.createElement('dd'); dd.textContent = proof;
      if (proof === 'Listed on résumé') dd.className = 'unproven';
      row.append(dt, dd); list.appendChild(row);
    });
    openDialog(sheet, opener || document.activeElement, true);
  }

  /* ------------------------------------------------------------------ smooth anchors */
  let stackST = null;
  function yFor(el) {
    if (!el || el === hero) return 0;
    if (el.id === 'stack' && stackST && stackST.pin) return Math.round(stackST.start + (stackST.end - stackST.start) * 0.42);
    return Math.max(0, Math.round(el.getBoundingClientRect().top + scrollY - (el.matches('section') ? 0 : 96)));
  }
  function goTo(el, after) {
    const y = yFor(el);
    const done = () => { if (el && el.focus) el.focus({ preventScroll: true }); after && after(); };
    if (lenis) lenis.scrollTo(y, { duration: 1.2, easing: (t) => 1 - Math.pow(1 - t, 3), onComplete: done });
    else { scrollTo({ top: y, behavior: RM ? 'auto' : 'smooth' }); setTimeout(done, RM ? 0 : 900); }
  }
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a[href^="#"]');
    if (!a || e.defaultPrevented || e.metaKey || e.ctrlKey || e.shiftKey || e.button !== 0) return;
    const id = a.getAttribute('href');
    const el = id === '#top' ? hero : document.getElementById(id.slice(1));
    if (!el) return;
    e.preventDefault();
    const dlg = a.closest('dialog');
    if (dlg) { dlg.dataset.noReturn = '1'; dlg.close(); }
    if (introTl && introTl.progress() < 1) skipIntro();
    const layer = a.dataset.layer;
    goTo(el, layer != null ? () => stackApi && stackApi.highlight(+layer) : null);
  });

  /* ------------------------------------------------------------------ opening sequence (2.6s, one timeline) */
  let introTl = null, synSplit = null;
  function skipIntro() {
    if (!introTl || introTl.progress() >= 1) return;
    const remain = introTl.duration() - introTl.time();
    introTl.timeScale(Math.max(6, remain / 0.24));
  }
  function setFinalState() {
    L.li = 1; L.dim = 0; L.imp = 1; T.draw = 1; T.dashed = false;
    const rest = restLight(); L.x = rest.x; L.y = rest.y; L.dirty = true;
    thr.style.strokeDasharray = thrShadow.style.strokeDasharray = 'none';
    html.classList.remove('intro');
  }
  function introDone() {
    html.classList.remove('intro-running');
    if (document.activeElement === $('[data-skip-titles]')) $('.skip:not(.skip-titles)').focus();
    if (synSplit) { synSplit.revert(); synSplit = null; }
    T.dashed = false; thr.style.strokeDasharray = thrShadow.style.strokeDasharray = 'none';
    gsap.set('.layers a, .role-in, .stop, [data-intro], .vf-corner', { clearProps: 'transform,opacity,visibility' });
    if (FINE) { L.follow = true; }
    else if (!RM) lightCue();
    scheduleStack();
  }
  function lightCue() { // touch: one 6s lighting cue, then hold; nothing runs at idle
    const w = hero.clientWidth, h = hero.clientHeight, o = { a: 0 };
    gsap.to(o, { a: 1, duration: 6, ease: 'sine.inOut', onUpdate: () => {
      const t = o.a; L.x = w * (0.12 + 0.76 * t); L.y = h * (0.3 - 0.16 * Math.sin(Math.PI * t)); L.dirty = true;
    } });
  }
  function buildIntro() {
    const rest = restLight();
    const corners = $$('.vf-corner');
    const layerLinks = $$('.layers a');
    const navLinks = $$('.nav a');
    const late = [...$$('.ctas a'), $('.now'), $('.loc'), $('.cue')];
    L.x = -hero.clientWidth * 0.12; L.y = rest.y + hero.clientHeight * 0.06; L.li = 0; L.dim = 0.42; L.imp = 0; applyLight();
    T.draw = 0; T.dashed = true;
    gsap.set(corners, { scale: 0, opacity: 0 });
    gsap.set(layerLinks, { yPercent: 110, opacity: 1 });
    gsap.set('.role-in', { yPercent: 135, opacity: 1 });
    gsap.set('.stop', { scale: 1.8, opacity: 0 });
    synSplit = SplitText.create('.synopsis', { type: 'lines', mask: 'lines' });
    gsap.set('.synopsis', { opacity: 1 });
    gsap.set(synSplit.lines, { yPercent: 115 });
    gsap.set(navLinks, { y: -8, opacity: 0 });
    gsap.set(late, { opacity: 0 });
    renderThread();
    html.classList.remove('intro');
    html.classList.add('intro-running');

    const tl = gsap.timeline({ onComplete: introDone, paused: true });
    // 0.00–0.60 lights up: the key light fades up and sweeps left to right; letters take their impression
    tl.to(L, { x: rest.x, y: rest.y, li: 1, dim: 0, imp: 1, duration: 0.6, ease: 'power2.out', onUpdate: () => { L.dirty = true; } }, 0)
      .to(corners, { scale: 1, opacity: 0.55, duration: 0.45, ease: 'power3.out', stagger: 0.04 }, 0.05)
    // 0.25–1.15 the thread draws under the name: the first credit
      .to(T, { draw: T.f1, duration: 0.9, ease: 'power4.inOut', onUpdate: () => { T.dirty = true; } }, 0.25)
    // 0.90–1.60 the five layers build, in the thread's order
      .to(layerLinks, { yPercent: 0, duration: 0.38, ease: 'power3.out', stagger: 0.1 }, 0.9)
    // 1.45–1.85 the same path turns the corner and binds the stack
      .to(T, { draw: 1, duration: 0.4, ease: 'power2.inOut', onUpdate: () => { T.dirty = true; } }, 1.45)
    // 1.70–2.30 the role slides up; the Laterite full stop lands last
      .to('.role-in', { yPercent: 0, duration: 0.6, ease: 'expo.out' }, 1.7)
      .to('.stop', { scale: 1, opacity: 1, duration: 0.3, ease: 'back.out(3)' }, 2.0)
    // 2.10–2.60 synopsis lines rise, nav drops in, the Now line fades in
      .to(synSplit.lines, { yPercent: 0, duration: 0.6, ease: 'expo.out', stagger: 0.07 }, 2.1)
      .to(navLinks, { y: 0, opacity: 1, duration: 0.5, ease: 'power3.out', stagger: 0.04 }, 2.1)
      .to(late, { opacity: 1, duration: 0.5, ease: 'power2.out', stagger: 0.05 }, 2.15);
    introTl = tl;
    const ts = parseFloat(new URLSearchParams(location.search).get('ts'));
    if (ts > 0 && ts <= 4) tl.timeScale(ts);
    ['wheel', 'keydown', 'pointerdown', 'touchstart'].forEach((t) => addEventListener(t, skipIntro, { passive: true }));
    $('[data-skip-titles]').addEventListener('click', skipIntro);
    tl.play();
  }

  /* ------------------------------------------------------------------ hero scroll: dolly-out + bracket drops into Ch.01 */
  function heroScroll(p) {
    if (RM) return;
    T.titleDY = -0.18 * title.offsetHeight * p;
    T.leadDY = -0.15 * innerHeight * p;
    title.style.transform = p ? `translate3d(0, ${T.titleDY.toFixed(2)}px, 0)` : '';
    const t2 = p ? `translate3d(0, ${T.leadDY.toFixed(2)}px, 0)` : '';
    lead.style.transform = t2; layersNav.style.transform = t2;
    L.iris = 1 - 0.3 * p; L.dirty = true;
    T.foot = 12 * clamp(1 - p * 5, 0, 1);
    const yb = T.spineBottom + T.leadDY;
    const dp = clamp((p - 0.03) / 0.9, 0, 1);
    T.drop = dp * Math.max(0, T.innerH + T.dropTail - yb);
    T.dirty = true;
  }

  /* ------------------------------------------------------------------ boot */
  const fontsReady = Promise.race([
    Promise.all([
      document.fonts.load('900 100px "Sofia Sans Extra Condensed"'),
      document.fonts.load('800 100px "Sofia Sans Extra Condensed"'),
      document.fonts.load('italic 400 40px Newsreader'),
      document.fonts.load('400 20px Newsreader'),
      document.fonts.load('400 12px "DM Mono"'),
    ]),
    new Promise((r) => setTimeout(r, 500)),
  ]);

  let stackApi = null;
  const stackState = { p: 0, mode: 'pin' };

  function layoutAll() {
    fitTitle();
    measureThread();
    measureLetters();
    fitFeatureTitle();
    fitEmail();
    L.dirty = true; T.dirty = true;
  }

  const paperReady = new Promise((res) => { requestAnimationFrame(() => { try { makePaper(res); } catch (e) { res(); } }); setTimeout(res, 900); });
  Promise.all([fontsReady, paperReady]).then(() => {
    layoutAll();
    setupScroll();
    setupWork();
    setupContact();
    setupHud();
    buildTable();
    if (RM || restoring) {
      setFinalState(); applyLight(); renderThread();
      introDone();
      if (restoring) requestAnimationFrame(() => { const y = contact.getBoundingClientRect().top + scrollY; lenis ? lenis.scrollTo(y, { immediate: true }) : scrollTo(0, y); });
    } else {
      buildIntro();
    }
    document.fonts.ready.then(() => { layoutAll(); ScrollTrigger.refresh(); });
  });

  let rsz = 0, lastW = innerWidth;
  addEventListener('resize', () => {
    clearTimeout(rsz);
    rsz = setTimeout(() => {
      const wChanged = innerWidth !== lastW; lastW = innerWidth;
      if (!wChanged && !FINE) return; // mobile URL-bar resizes: keep layout
      layoutAll(); ScrollTrigger.refresh();
    }, 120);
  });

  /* ------------------------------------------------------------------ scroll choreography */
  function setupScroll() {
    // hero exit (scrubbed); the header wordmark fades in as the title leaves
    ScrollTrigger.create({
      trigger: hero, start: 'top top', end: 'bottom top', scrub: true,
      onUpdate: (s) => { heroScroll(s.progress); },
      onRefresh: (s) => { heroScroll(s.progress); measureThread(); },
    });
    ScrollTrigger.create({ trigger: hero, start: 'top top', end: '42% top', onLeave: () => hdr.classList.add('show-mark'), onEnterBack: () => hdr.classList.remove('show-mark') });
    ScrollTrigger.create({ trigger: hero, start: 'top top', end: '88% top', onLeave: () => hdr.classList.add('solid'), onEnterBack: () => hdr.classList.remove('solid') });

    const mm = gsap.matchMedia();
    mm.add({ desk: '(min-width: 1024px)', small: '(max-width: 1023px)' }, (ctx) => {
      const { desk } = ctx.conditions;
      if (RM) { stackState.mode = 'static'; return; }
      if (desk) {
        stackState.mode = 'pin';
        stackST = ScrollTrigger.create({
          trigger: '.stack', start: 'top top', end: () => '+=' + Math.round(innerHeight * 0.8),
          pin: '.stack-pin', pinSpacing: true, scrub: true, anticipatePin: 1,
          onUpdate: (s) => { stackState.p = s.progress; stackApi && stackApi.setProgress(s.progress, 'pin'); },
          onLeave: () => stackApi && stackApi.retractForExit(),
          onEnterBack: () => stackApi && stackApi.resumeAfterExit(),
        });
        // focus pull: the title plane blurs as the paper studio sharpens (40svh)
        if (FINE) {
          ScrollTrigger.create({
            trigger: '.stack', start: 'top bottom', end: 'top 60%', scrub: true,
            onUpdate: (s) => {
              const p = s.progress;
              heroInner.style.filter = p > 0.002 ? `blur(${(8 * p).toFixed(2)}px)` : '';
              stageWrap.style.filter = p < 0.998 ? `blur(${(8 * (1 - p)).toFixed(2)}px)` : '';
            },
          });
        }
      } else {
        stackState.mode = 'pass';
        stackST = ScrollTrigger.create({
          trigger: '.stage-wrap', start: 'top 88%', end: 'center 52%', scrub: true,
          onUpdate: (s) => { stackState.p = s.progress; stackApi && stackApi.setProgress(s.progress, 'pass'); },
        });
      }
      return () => { heroInner.style.filter = ''; stageWrap.style.filter = ''; stackST = null; };
    });

    // load the paper studio early if the visitor heads there before idle time
    ScrollTrigger.create({ trigger: '.stack', start: 'top 180%', once: true, onEnter: () => loadStack() });

    // slug hairlines draw as each chapter arrives
    $$('.slugbar').forEach((s) => {
      if (RM) return;
      s.style.setProperty('--rule', '0');
      ScrollTrigger.create({ trigger: s, start: 'top 92%', once: true, onEnter: () => gsap.to(s, { '--rule': 1, duration: 0.9, ease: 'cine' }) });
    });
  }

  function scheduleStack() {
    const go = () => loadStack();
    if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 1500 }); else setTimeout(go, 400);
  }
  let stackLoading = false;
  function loadStack() {
    if (stackLoading || !window.TL_STACK) return;
    stackLoading = true;
    const tier = innerWidth < 600 ? 'phone' : (!FINE || innerWidth < 1024 ? 'tablet' : 'desktop');
    window.TL_STACK.init({
      gsap, RM, FINE, tier, data: DATA, cursor, openSheet,
      getState: () => stackState,
      onFail: () => { const n = $('.stage-note'); if (n) n.textContent = 'The 3D stack needs WebGL. The same threads are listed below.'; },
    }).then((api) => {
      if (!api) return;
      stackApi = api;
      api.setProgress(stackState.mode === 'static' ? 1 : stackState.p, stackState.mode);
    }).catch(() => {});
  }

  /* ------------------------------------------------------------------ CH.02 selected work */
  function fitFeatureTitle() {
    const t = $('.f-title'), meta = $('.f-meta');
    if (!t || !meta) return;
    mctx.font = '800 100px "Sofia Sans Extra Condensed"';
    const widest = Math.max(...$$('.f-title .ln > span').map((s) => mctx.measureText(s.textContent.toUpperCase()).width)) / 100;
    const avail = meta.clientWidth - 8;
    const fs = clamp(avail / (widest * 1.0 - 0.005 * 12), 44, innerWidth < 1024 ? 132 : 118);
    t.style.setProperty('--ffs', fs.toFixed(1) + 'px');
  }
  function setupWork() {
    const count = $('[data-work-count]'); if (count) count.textContent = `Now + ${DATA.features} features`;
    $$('[data-feature-total]').forEach((n) => { n.textContent = String(DATA.features).padStart(2, '0'); });
    if (RM) return;
    // Now one-sheet rises in
    const rise = $$('.now-sheet [data-rise]');
    gsap.set(rise, { y: 16, opacity: 0 });
    ScrollTrigger.create({ trigger: '.now-sheet', start: 'top 82%', once: true, onEnter: () => gsap.to(rise, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.06 }) });

    // Feature 01: a thread-led clip-path cut, then the title rises and the still draws along its red line
    const frame = $('.feature-frame'), edge = $('.wipe-edge');
    const lines = $$('.f-title .ln > span');
    const rest = [$('.logline'), $('.f-links'), $('.still-cap'), $('.built-wrap')];
    const vis = $$('.rag').find((s) => getComputedStyle(s).display !== 'none') || $('.rag-wide');
    const line = $('.rag-line', vis), nodes = $$('.node', vis), dock = $('.dock', vis), edgePrint = $('.edge', vis);
    const len = line.getTotalLength();
    gsap.set(frame, { clipPath: 'inset(0% 100% 0% 0%)' });
    gsap.set(lines, { yPercent: 106 });
    gsap.set(rest, { y: 16, opacity: 0 });
    gsap.set(line, { strokeDasharray: len, strokeDashoffset: len });
    gsap.set(nodes, { opacity: 0, y: 6 });
    gsap.set([dock, edgePrint], { opacity: 0 });
    gsap.set('.f-num', { yPercent: 100 });
    ScrollTrigger.create({
      trigger: '.feature', start: 'top 60%', once: true,
      onEnter: () => {
        const w = frame.offsetWidth;
        gsap.timeline({ onComplete: () => gsap.set(frame, { clipPath: 'none' }) })
          .set(edge, { opacity: 1, x: 0 })
          .to(frame, { clipPath: 'inset(0% 0% 0% 0%)', duration: 0.7, ease: 'cine' }, 0)
          .to(edge, { x: w, duration: 0.7, ease: 'cine' }, 0)
          .to(edge, { opacity: 0, duration: 0.3, ease: 'power1.out' }, 0.66)
          .to('.f-num', { yPercent: 0, duration: 0.4, ease: 'power3.out' }, 0.3)
          .to(lines, { yPercent: 0, duration: 0.8, ease: 'expo.out', stagger: 0.08 }, 0.4)
          .to(rest, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.07 }, 0.62)
          .to(edgePrint, { opacity: 1, duration: 0.6 }, 0.5)
          .to(line, { strokeDashoffset: 0, duration: 1.2, ease: 'power2.inOut' }, 0.55)
          .to(nodes, { opacity: 1, y: 0, duration: 0.45, ease: 'power2.out', stagger: 0.22 }, 0.6)
          .to(dock, { opacity: 1, duration: 0.6, ease: 'power2.out' }, 1.6);
      },
    });
  }

  /* ------------------------------------------------------------------ CH.05 correspondence */
  function fitEmail() {
    const e = $('.email'), wrap = $('.email-wrap');
    if (!e || !wrap) return;
    mctx.font = '800 100px "Sofia Sans Extra Condensed"';
    const em = mctx.measureText('prajwalnair2603@gmail.com').width / 100;
    const avail = wrap.clientWidth;
    const fs = clamp((avail * (innerWidth < 600 ? 1 : 0.9)) / (em - 0.004 * 25), 30, 136);
    e.style.setProperty('--efs', fs.toFixed(1) + 'px');
  }
  function setupContact() {
    // the email as the closing title: letters rise; the Safelight thread draws under it
    const et = $('.email-t');
    const text = et.textContent;
    et.textContent = '';
    for (const ch of text) { const s = document.createElement('span'); s.className = 'c'; s.textContent = ch; et.appendChild(s); }
    const cs = $$('.email-t .c');
    const thread = $('.email-thread');
    if (!RM) {
      gsap.set(et, { overflow: 'hidden', paddingBottom: '0.14em', marginBottom: '-0.14em', verticalAlign: 'bottom' });
      gsap.set(cs, { yPercent: 115 });
      gsap.set(thread, { '--th': 0 });
      ScrollTrigger.create({ trigger: '.email-wrap', start: 'top 82%', once: true, onEnter: () => {
        gsap.timeline()
          .to(cs, { yPercent: 0, duration: 0.7, ease: 'expo.out', stagger: 0.018 })
          .to(thread, { '--th': 1, duration: 0.9, ease: 'cine' }, 0.35)
          .add(() => gsap.set(et, { overflow: 'visible' }));
      } });
      const lines = [$('.c-client'), $('.c-recruit'), $('.c-actions'), $('.social')];
      gsap.set(lines, { y: 16, opacity: 0 });
      ScrollTrigger.create({ trigger: '.c-lines', start: 'top 85%', once: true, onEnter: () => gsap.to(lines, { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out', stagger: 0.08 }) });

      // fade to black over 40svh; type inverts at the midpoint
      const setFade = (p) => {
        html.style.setProperty('--fade', p.toFixed(3));
        work.style.opacity = (1 - clamp(p * 1.3, 0, 1)).toFixed(3);
        const inv = p >= 0.5;
        contact.classList.toggle('inv', inv);
        hdr.classList.toggle('on-dark', inv);
        $('[data-hud]').classList.toggle('on-dark', inv);
      };
      ScrollTrigger.create({ trigger: contact, start: 'top bottom', end: 'top 60%', scrub: true, onUpdate: (s) => setFade(s.progress), onRefresh: (s) => setFade(s.progress) });
    } else {
      contact.classList.add('inv');
      ScrollTrigger.create({ trigger: contact, start: 'top 64px', end: 'bottom top', toggleClass: { targets: hdr, className: 'on-dark' } });
    }

    // copy address: Clipboard API, textarea fallback, then a select-and-hint fallback
    const btn = $('.copy'), label = $('.copy-l'), hint = $('.copy-hint');
    let tmr = 0;
    btn.addEventListener('click', async () => {
      const addr = btn.dataset.copy;
      let ok = false;
      try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(addr); ok = true; } } catch (e) { ok = false; }
      if (!ok) {
        try {
          const ta = document.createElement('textarea');
          ta.value = addr; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0;pointer-events:none';
          document.body.appendChild(ta); ta.select(); ok = document.execCommand('copy'); ta.remove();
          btn.focus({ preventScroll: true });
        } catch (e) { ok = false; }
      }
      clearTimeout(tmr);
      if (ok) {
        label.textContent = 'Copied';
        hint.textContent = 'Address copied to clipboard';
        if (!RM) gsap.fromTo(thread, { '--th': 0 }, { '--th': 1, duration: 0.4, ease: 'power3.out' });
        tmr = setTimeout(() => { label.textContent = 'Copy address'; hint.textContent = ''; }, 2200);
      } else {
        const r = document.createRange(); r.selectNodeContents(et);
        const sel = getSelection(); sel.removeAllRanges(); sel.addRange(r);
        hint.textContent = 'Press Ctrl/⌘ + C to copy';
      }
    });
    // magnetic within 80px (≤6px pull)
    if (FINE && !RM) {
      const qx = gsap.quickTo(btn, 'x', { duration: 0.4, ease: 'power3.out' }), qy = gsap.quickTo(btn, 'y', { duration: 0.4, ease: 'power3.out' });
      addEventListener('pointermove', (e) => {
        const r = btn.getBoundingClientRect();
        if (r.bottom < 0 || r.top > innerHeight) return;
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy;
        const nx = Math.max(0, Math.abs(dx) - r.width / 2), ny = Math.max(0, Math.abs(dy) - r.height / 2);
        if (Math.hypot(nx, ny) < 80) { qx(clamp(dx * 0.08, -6, 6)); qy(clamp(dy * 0.12, -6, 6)); } else { qx(0); qy(0); }
      }, { passive: true });
    }

    // live local time in Bengaluru
    const clock = $('[data-clock]');
    const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
    const full = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', weekday: 'long', hour: 'numeric', minute: '2-digit', hour12: true });
    const tick = () => { const d = new Date(); clock.textContent = `Bengaluru · ${fmt.format(d)} IST`; clock.setAttribute('aria-label', `Local time in Bengaluru: ${full.format(d)}, India Standard Time`); };
    tick(); setInterval(tick, 30000);

    // back to the top
    $('[data-top]').addEventListener('click', (e) => { e.preventDefault(); e.stopPropagation(); goTo(hero); });

    // motion toggle: persists, then reloads into the chosen mode at this chapter
    const mt = $('[data-motion]');
    mt.setAttribute('aria-pressed', RM ? 'true' : 'false');
    mt.setAttribute('aria-label', RM ? 'Motion is reduced. Switch to full motion' : 'Motion is full. Switch to reduced motion');
    mt.addEventListener('click', () => {
      try { localStorage.setItem('tl-motion', RM ? 'full' : 'reduced'); sessionStorage.setItem('tl-restore', 'contact'); } catch (e) { /* ignore */ }
      location.reload();
    });
  }

  /* ------------------------------------------------------------------ chapter HUD + index */
  function setupHud() {
    const hud = $('[data-hud]'), lab = $('[data-hud-label]'), bar = $('[data-hud-bar]');
    const chapters = [[hero, 'CH.00 / 05 — Title'], [$('.stack'), 'CH.01 / 05 — The Stack'], [work, 'CH.02 / 05 — Selected work'], [contact, 'CH.05 / 05 — Correspondence']];
    chapters.forEach(([el, text]) => {
      ScrollTrigger.create({
        trigger: el, start: 'top 55%', end: 'bottom 55%',
        onToggle: (s) => { if (s.isActive) lab.textContent = text; },
        onUpdate: (s) => { bar.style.setProperty('--p', s.progress.toFixed(3)); },
      });
    });
    ScrollTrigger.create({ trigger: hero, start: '60% top', endTrigger: contact, end: 'top 70%', onToggle: (s) => hud.classList.toggle('show', s.isActive) });
    hud.addEventListener('click', () => openDialog($('.index'), hud, false));
  }

  /* ------------------------------------------------------------------ the system × layer table for assistive tech */
  function buildTable() {
    const tb = $('[data-sys-table]');
    Object.values(DATA.systems).forEach((s) => {
      const tr = document.createElement('tr');
      const th = document.createElement('th'); th.scope = 'row'; th.textContent = s.name; tr.appendChild(th);
      s.layers.forEach((v) => { const td = document.createElement('td'); td.textContent = v || 'Not part of this build'; tr.appendChild(td); });
      tb.appendChild(tr);
    });
  }
})();
