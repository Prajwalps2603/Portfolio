/* Through-Line — Ch.01 The Stack: five paper plates, one red thread.
   Classic script: three.js is fetched lazily through the page's import map (no WebGL on the hero, nothing on the LCP path).
   Renders on demand only (scroll, thread, pointer orbit, hover); paused offscreen. */
window.TL_STACK = {
  async init(o) {
    const { gsap, RM, FINE, tier, data, cursor, openSheet, getState, onFail } = o;
    let THREE, RoundedBoxGeometry;
    try {
      THREE = await import('three');
      ({ RoundedBoxGeometry } = await import('three/addons/geometries/RoundedBoxGeometry.js'));
    } catch (e) { onFail && onFail(e); return null; }
    try {
      await Promise.all([
        document.fonts.load('800 100px "Sofia Sans Extra Condensed"'),
        document.fonts.load('400 24px "DM Mono"'),
        document.fonts.load('500 24px "DM Mono"'),
      ]);
    } catch (e) { /* draw with fallbacks */ }

    const $ = (s, r = document) => r.querySelector(s);
    const canvas = $('.stage'), wrap = $('.stage-wrap'), pin = $('.stack-pin');
    const leadersSvg = $('.leaders'), calloutsEl = $('.callouts'), tally = $('.tally');
    const PHONE = tier === 'phone', DESKTOP = tier === 'desktop';
    const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
    const ease = gsap.parseEase('power2.inOut');

    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: !PHONE, alpha: true, powerPreference: 'high-performance' });
    } catch (e) { onFail && onFail(e); return null; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, DESKTOP ? 1.5 : tier === 'tablet' ? 1.25 : 1));
    renderer.setClearColor(0x000000, 0);
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.NoToneMapping;
    const SHADOWS = !PHONE;
    renderer.shadowMap.enabled = SHADOWS;
    renderer.shadowMap.type = THREE.PCFShadowMap;

    const scene = new THREE.Scene();
    const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 100);
    scene.add(new THREE.HemisphereLight(0xfffcf6, 0xd6ccbc, 2.35));
    const key = new THREE.DirectionalLight(0xfff4e6, 0.9);
    key.castShadow = SHADOWS;
    if (SHADOWS) {
      key.shadow.mapSize.set(1024, 1024);
      Object.assign(key.shadow.camera, { left: -7, right: 7, top: 7, bottom: -7, near: 1, far: 40 });
      key.shadow.radius = 5; key.shadow.bias = -0.0006; key.shadow.normalBias = 0.02;
    }
    scene.add(key, key.target);
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(40, 40), new THREE.ShadowMaterial({ opacity: 0.075 }));
    floor.rotation.x = -Math.PI / 2; floor.position.y = -2.72; floor.receiveShadow = SHADOWS;
    scene.add(floor);

    /* plates: RoundedBox 3.6 × 0.07 × 2.2 with a printed top decal */
    const PW = 3.6, PT = 0.07, PD = 2.2;
    const decal = (i) => {
      const W = 1024, H = Math.round(W * PD / PW), c = document.createElement('canvas');
      c.width = W; c.height = H;
      const x = c.getContext('2d');
      x.fillStyle = '#F4EFE6'; x.fillRect(0, 0, W, H);
      x.strokeStyle = 'rgba(20,18,16,.16)'; x.lineWidth = 2; x.strokeRect(16, 16, W - 32, H - 32);
      x.fillStyle = '#B5341A'; x.font = '500 30px "DM Mono"'; x.fillText(`${data.layers[i].n} / 05`, 44, 66);
      x.fillStyle = '#5B554D'; x.font = '400 21px "DM Mono"';
      const words = data.plateTools[i].toUpperCase().split(' · '); let line = '', y = 118; const lines = [];
      for (const w of words) { const t = line ? `${line} · ${w}` : w; if (x.measureText(t).width > W - 110) { lines.push(line); line = w; } else line = t; }
      lines.push(line); lines.forEach((l, k) => x.fillText(l, 44, y + k * 32));
      x.fillStyle = '#141210'; x.font = '800 176px "Sofia Sans Extra Condensed"';
      x.fillText(data.layers[i].name.toUpperCase(), 36, H - 40);
      const t = new THREE.CanvasTexture(c);
      t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());
      return t;
    };
    const bodyGeo = new RoundedBoxGeometry(PW, PT, PD, 3, 0.025);
    const bodyMat = new THREE.MeshStandardMaterial({ color: 0xF4EFE6, roughness: 0.95, metalness: 0 });
    const topGeo = new THREE.PlaneGeometry(PW - 0.035, PD - 0.035);
    const plates = data.layers.map((_, i) => {
      const g = new THREE.Group();
      const body = new THREE.Mesh(bodyGeo, bodyMat);
      body.castShadow = body.receiveShadow = SHADOWS;
      const top = new THREE.Mesh(topGeo, new THREE.MeshStandardMaterial({ map: decal(i), roughness: 0.95 }));
      top.rotation.x = -Math.PI / 2; top.position.y = PT / 2 + 0.0015; top.receiveShadow = SHADOWS;
      body.userData.i = top.userData.i = i;
      g.add(body, top); g.userData = { i, lift: 0 };
      scene.add(g);
      return g;
    });
    const hitMeshes = plates.flatMap((g) => g.children.slice(0, 2));

    /* the thread: TubeGeometry along a centripetal Catmull-Rom, revealed with setDrawRange */
    const SEG = PHONE ? 120 : 220, RAD = PHONE ? 6 : 8;
    const threadMat = new THREE.MeshBasicMaterial({ color: 0xB5341A });
    const thread = new THREE.Mesh(new THREE.BufferGeometry(), threadMat);
    thread.castShadow = SHADOWS; thread.frustumCulled = false;
    scene.add(thread);
    const knotGeo = new THREE.SphereGeometry(0.042, 16, 12), knotMat = new THREE.MeshBasicMaterial({ color: 0xB5341A });
    const ringGeo = new THREE.TorusGeometry(0.06, 0.011, 10, 40), ringMat = new THREE.MeshStandardMaterial({ color: 0x5B554D, roughness: 0.6 });
    const knots = [];

    const st = { e: 0, orbit: 0, orbitT: 0, keyA: -0.9, keyAT: -0.9, sys: 'drone', th: 0, threaded: false, exiting: false, knotU: [], hovered: -1 };
    const yOf = (i, gap) => (2 - i) * gap;
    function layout() {
      const gap = 0.1 + 0.78 * st.e;
      plates.forEach((g, i) => { g.position.set(0, yOf(i, gap) + g.userData.lift, 0); g.rotation.y = (i - 2) * 0.05 * st.e; });
    }

    /* DOM callouts (+ SVG leaders on desktop) */
    const items = data.layers.map((Ld, i) => {
      const li = document.createElement('li'); li.className = 'callout';
      const b = document.createElement('button'); b.type = 'button'; b.dataset.cursor = 'OPEN LAYER';
      const k = document.createElement('span'); k.className = 'c-k';
      const v = document.createElement('span'); v.className = 'c-v';
      b.append(k, v); li.appendChild(b); calloutsEl.appendChild(li);
      b.addEventListener('click', () => openSheet(i, b));
      return { li, b, k, v, y: 0 };
    });
    const NS = 'http://www.w3.org/2000/svg';
    const leaders = data.layers.map(() => {
      const p = document.createElementNS(NS, 'path');
      leadersSvg.append(p);
      return { p, on: false };
    });

    function writeCallouts() {
      const S = data.systems[st.sys];
      items.forEach((it, i) => {
        const Ld = data.layers[i], label = S.layers[i];
        it.k.textContent = `${Ld.n} ${Ld.name}`;
        it.v.textContent = label || 'not part of this build';
        it.li.classList.toggle('unbuilt', !label);
        it.b.setAttribute('aria-label', `${Ld.n} ${Ld.name}: ${label || 'not part of this build'}. Open the ${Ld.name} layer.`);
        leaders[i].p.classList.toggle('unbuilt', !label);
      });
      const built = S.layers.filter(Boolean).length;
      tally.textContent = `${built} of 5 layers stitched · ${S.note}`;
    }

    function buildThread() {
      const keep = st.e; st.e = 1; layout(); scene.updateMatrixWorld(true);
      const S = data.systems[st.sys], P = S.pts;
      const v = (x, y, z, g) => g.localToWorld(new THREE.Vector3(x, y, z));
      const pts = [v(P[0][0] - 0.42, 1.32, P[0][1] - 0.2, plates[0])];
      P.forEach(([x, z], i) => { pts.push(v(x, PT / 2 + 0.014, z, plates[i])); pts.push(v(x, -PT / 2 - 0.014, z, plates[i])); });
      pts.push(v(P[4][0] + 0.36, -0.94, P[4][1] + 0.18, plates[4]));
      st.e = keep; layout();
      const curve = new THREE.CatmullRomCurve3(pts, false, 'centripetal');
      thread.geometry.dispose();
      thread.geometry = new THREE.TubeGeometry(curve, SEG, 0.012, RAD, false);
      const D = 600, lengths = curve.getLengths(D), total = lengths[D];
      st.knotU = P.map((_, i) => lengths[Math.round(((1 + 2 * i) / (pts.length - 1)) * D)] / total);
      knots.forEach((k) => k.parent && k.parent.remove(k)); knots.length = 0;
      S.layers.forEach((label, i) => {
        const m = new THREE.Mesh(label ? knotGeo : ringGeo, label ? knotMat : ringMat);
        m.position.set(P[i][0], PT / 2 + (label ? 0.022 : 0.008), P[i][1]);
        if (!label) m.rotation.x = Math.PI / 2;
        m.castShadow = SHADOWS; m.visible = false;
        plates[i].add(m); knots.push(m);
      });
      writeCallouts();
    }
    function setDraw() {
      const n = Math.floor(st.th * SEG) * RAD * 6;
      thread.geometry.setDrawRange(0, n);
      thread.visible = st.th > 0.001;
      knots.forEach((k, i) => {
        const on = st.th >= st.knotU[i] - 0.004;
        k.visible = on;
        items[i].li.classList.toggle('on', on);
        leaders[i].on = on;
      });
      invalidate();
    }
    let threadTween = null;
    function runThread() {
      buildThread(); st.th = 0; setDraw(); st.threaded = true;
      threadTween && threadTween.kill();
      threadTween = gsap.to(st, { th: 1, duration: RM ? 0 : 1.4, ease: 'power2.inOut', onUpdate: setDraw });
    }
    function retract(then, dur = 0.3) {
      threadTween && threadTween.kill();
      if (RM || st.th <= 0) { st.th = 0; setDraw(); then && then(); return; }
      threadTween = gsap.to(st, { th: 0, duration: dur, ease: 'power2.in', onUpdate: setDraw, onComplete: () => then && then() });
    }
    function select(sys) {
      st.sys = sys;
      if (st.threaded && st.e >= 0.999) retract(runThread);
      else { buildThread(); setDraw(); }
    }

    /* camera framing: the stack sits in columns 5–9, callouts hang in 10–12 */
    let W = 1, H = 1, colX = 0, offX = 0, centreX = 0;
    function size() {
      W = canvas.clientWidth || 1; H = canvas.clientHeight || 1;
      renderer.setSize(W, H, false);
      const g = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--g')) || 24;
      const pw = pin.clientWidth;
      offX = canvas.getBoundingClientRect().left - pin.getBoundingClientRect().left; // <= 0 when the canvas bleeds past the margins
      colX = ((pw - 11 * g) / 12 + g) * 9 + 12 - offX;   // callout column, in canvas px
      centreX = -offX + pw * 0.548;                        // stack centre between columns 5 and 9
      invalidate();
    }
    function placeCamera() {
      const aspect = W / H; cam.aspect = aspect;
      const az = 0.62 + st.orbit, el = 0.47;
      const t = Math.tan((cam.fov * Math.PI) / 360);
      const Dh = 6.3 / (2 * t * (DESKTOP ? 0.86 : 0.94));
      const Dw = (DESKTOP ? 4.9 : 4.7) / (2 * t * aspect * (DESKTOP ? 0.37 * (pin.clientWidth / W) : 0.94));
      const D = Math.max(Dh, Dw);
      cam.position.set(Math.sin(az) * Math.cos(el) * D, Math.sin(el) * D + 0.15, Math.cos(az) * Math.cos(el) * D);
      cam.lookAt(0, 0.15, 0);
      if (DESKTOP) cam.setViewOffset(W, H, W / 2 - centreX, H * 0.02, W, H); else cam.clearViewOffset();
      cam.updateProjectionMatrix();
      key.position.set(Math.sin(st.keyA) * 10.5, 9.5, Math.cos(st.keyA) * 10.5);
    }

    /* demand rendering */
    let dirty = true, visible = false;
    function invalidate() { dirty = true; }
    const v3 = new THREE.Vector3();
    function project(obj) {
      obj.getWorldPosition(v3); v3.project(cam);
      return [(v3.x * 0.5 + 0.5) * W, (-v3.y * 0.5 + 0.5) * H];
    }
    function placeCallouts() {
      if (!DESKTOP || !knots.length) return;
      const minGap = 54;
      const ys = knots.map((k) => project(k));
      let prev = -Infinity;
      const out = ys.map(([kx, ky], i) => { let y = Math.max(ky - 15, prev + minGap); prev = y; return [kx, ky, y]; });
      const over = out[4][2] + 50 - (H - 30);
      if (over > 0) out.forEach((o) => { o[2] -= over; });
      out.forEach(([kx, ky, y], i) => {
        const it = items[i], ld = leaders[i];
        it.li.style.transform = `translate3d(${(colX + offX).toFixed(1)}px, ${y.toFixed(1)}px, 0)`;
        const cy = y + 15, ex = colX - 44;
        ld.p.setAttribute('d', `M${(kx + 6).toFixed(1)} ${ky.toFixed(1)} L${ex.toFixed(1)} ${cy.toFixed(1)} L${(colX - 10).toFixed(1)} ${cy.toFixed(1)}`);
        ld.p.style.opacity = ld.on ? '' : '0';
      });
    }
    function render() {
      placeCamera();
      renderer.render(scene, cam);
      placeCallouts();
      dirty = false;
    }
    gsap.ticker.add(() => {
      if (!visible) return;
      let moving = false;
      if (Math.abs(st.orbitT - st.orbit) > 1e-4) { st.orbit += (st.orbitT - st.orbit) * 0.06; moving = true; }
      if (Math.abs(st.keyAT - st.keyA) > 1e-4) { st.keyA += (st.keyAT - st.keyA) * 0.06; moving = true; }
      if (moving || dirty) render();
    });
    new IntersectionObserver(([en]) => { visible = en.isIntersecting; if (visible) invalidate(); }, { rootMargin: '120px 0px' }).observe(wrap);
    new ResizeObserver(() => size()).observe(wrap);

    /* pointer: orbit ±0.12 rad, key light azimuth, raycast hover lifts a plate */
    const ray = new THREE.Raycaster(), ndc = new THREE.Vector2();
    function plateRect(i) {
      const g = plates[i], r = canvas.getBoundingClientRect();
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const sx of [-1, 1]) for (const sy of [-1, 1]) for (const sz of [-1, 1]) {
        v3.set((sx * PW) / 2, (sy * PT) / 2, (sz * PD) / 2); g.localToWorld(v3); v3.project(cam);
        const px = (v3.x * 0.5 + 0.5) * W, py = (-v3.y * 0.5 + 0.5) * H;
        x0 = Math.min(x0, px); y0 = Math.min(y0, py); x1 = Math.max(x1, px); y1 = Math.max(y1, py);
      }
      return { left: r.left + x0, top: r.top + y0, right: r.left + x1, bottom: r.top + y1, width: x1 - x0, height: y1 - y0 };
    }
    function hover(i) {
      if (i === st.hovered) return;
      if (st.hovered >= 0) gsap.to(plates[st.hovered].userData, { lift: 0, duration: 0.35, ease: 'power3.out', onUpdate: () => { layout(); invalidate(); } });
      st.hovered = i;
      if (i >= 0) {
        gsap.to(plates[i].userData, { lift: 0.06, duration: 0.35, ease: 'power3.out', onUpdate: () => { layout(); invalidate(); } });
        cursor.lock(() => plateRect(i), 'OPEN LAYER', true);
        canvas.style.cursor = 'pointer';
      } else { cursor.unlock(); canvas.style.cursor = ''; }
    }
    if (FINE) {
      addEventListener('pointermove', (e) => {
        if (!visible) return;
        if (DESKTOP && !RM) { st.orbitT = (e.clientX / innerWidth - 0.5) * 2 * 0.12; }
        st.keyAT = -0.9 + (e.clientX / innerWidth - 0.5) * 1.1;
        if (st.e < 0.98) { hover(-1); return; }
        const r = canvas.getBoundingClientRect();
        const under = document.elementFromPoint(e.clientX, e.clientY);
        if (under !== canvas) { hover(-1); return; }
        ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
        ray.setFromCamera(ndc, cam);
        const hit = ray.intersectObjects(hitMeshes, false)[0];
        hover(hit ? hit.object.userData.i : -1);
      }, { passive: true });
      canvas.addEventListener('pointerleave', () => hover(-1));
      canvas.addEventListener('click', () => { if (st.hovered >= 0) openSheet(st.hovered, items[st.hovered].b); });
    }

    /* picker: a native radio group */
    document.querySelectorAll('.picker input').forEach((r) => r.addEventListener('change', () => { if (r.checked) select(r.value); }));
    const checked = document.querySelector('.picker input:checked');
    st.sys = checked ? checked.value : 'drone';

    /* scroll-driven explode (0–35% of the pin on desktop; across the section's passage elsewhere) */
    function setProgress(p, mode) {
      const raw = mode === 'static' ? 1 : mode === 'pin' ? clamp(p / 0.35, 0, 1) : clamp(p, 0, 1);
      const e = mode === 'static' ? 1 : ease(raw);
      if (Math.abs(e - st.e) > 1e-5) { st.e = e; layout(); invalidate(); }
      if (st.e >= 0.999 && !st.threaded && !st.exiting) runThread();
      else if (st.e < 0.999 && st.threaded) { st.threaded = false; retract(null, 0.2); }
    }

    size(); layout(); buildThread(); setDraw();
    canvas.classList.add('ready');
    const s = getState();
    setProgress(s.mode === 'static' ? 1 : s.p, s.mode);
    invalidate();

    return {
      setProgress,
      select,
      highlight(i) {
        if (st.e < 0.98) return;
        gsap.timeline()
          .to(plates[i].userData, { lift: 0.08, duration: 0.35, ease: 'power3.out', onUpdate: () => { layout(); invalidate(); } })
          .to(plates[i].userData, { lift: 0, duration: 0.5, ease: 'power2.inOut', onUpdate: () => { layout(); invalidate(); } }, 1.1);
        items[i].b.focus({ preventScroll: true });
      },
      retractForExit() { st.exiting = true; if (st.threaded) { st.threaded = false; retract(null, 0.3); } },
      resumeAfterExit() { st.exiting = false; if (st.e >= 0.999 && !st.threaded) runThread(); },
    };
  },
};
