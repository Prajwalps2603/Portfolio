/* ==========================================================================
   Cross-Section · motion sketch · Prajwal M P
   One instrument everywhere: a section plane drawn as a single blue laser line.
   Modules: smooth scroll · terrain (raw WebGL2) · hero plane · intro · chapter
   openers · the scan (specimen) · capabilities · experience profile · contact.
   ========================================================================== */
(() => {
  'use strict';
  window.__xsBooted = true;

  const d = document, root = d.documentElement;
  const $ = (s, r = d) => r.querySelector(s);
  const $$ = (s, r = d) => Array.from(r.querySelectorAll(s));
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const RM = root.classList.contains('rm');
  const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const small = () => innerWidth < 900;
  const T = window.TERRAIN || null;
  const EMAIL = 'prajwalnair2603@gmail.com';

  if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
  if (!window.gsap || !window.ScrollTrigger) { root.classList.remove('intro'); return; }
  gsap.registerPlugin(ScrollTrigger, CustomEase);
  if (window.SplitText) gsap.registerPlugin(SplitText);
  CustomEase.create('scan', '.37,0,.63,1');     // near-constant, like a scanner bed
  CustomEase.create('settle', '.16,1,.3,1');    // arrivals
  CustomEase.create('open', '.7,0,.2,1');       // cuts opening
  ScrollTrigger.config({ ignoreMobileResize: true });

  /* ------------------------------------------------------------------ 1. smooth scroll (fine pointers only) */
  let lenis = null;
  if (!RM && FINE && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true, wheelMultiplier: 1 });
    lenis.on('scroll', ScrollTrigger.update);
    gsap.ticker.add((t) => lenis.raf(t * 1000));
    gsap.ticker.lagSmoothing(0);
  }
  const quartOut = (x) => 1 - Math.pow(1 - x, 4);
  const scrollToEl = (el) => {
    if (lenis) lenis.scrollTo(el, { duration: 1.4, easing: quartOut });
    else el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth', block: 'start' });
  };

  /* ------------------------------------------------------------------ 2. the ground: SRTM contours, raw WebGL2, on demand */
  const terra = (() => {
    const canvas = $('#terrain');
    const S = { cx: 512, cy: 296, sc: 0.2, reveal: RM ? 9 : 0, cut: 790, on: RM ? 1 : 0, beam: 0.44, line: 1, dirty: true, ready: false, mode: 'none', view: 'hero' };
    const api = { S, K: [0, 0], project: () => [-999, -999], setView() {}, render() {}, resize() {}, boot: async () => {}, onRender: null, W: innerWidth, H: innerHeight };
    if (!T || !canvas) return api;

    const [TW, TH] = T.size;
    const conn = navigator.connection || {};
    const low = !!conn.saveData || (navigator.deviceMemory && navigator.deviceMemory <= 2);
    let cv = canvas, gl = null, ctx2d = null, prog = null, heights = null;
    const U = {};
    if (!low) {
      try { gl = cv.getContext('webgl2', { alpha: false, antialias: false, depth: false, stencil: false, premultipliedAlpha: false, powerPreference: 'low-power' }); } catch (e) { gl = null; }
    }
    S.mode = gl ? 'gl' : '2d';

    const town = (k) => [T.towns[k].uv[0] * TW, T.towns[k].uv[1] * TH];
    const K = town('Koppa'), SU = town('Sullia');
    api.K = K;
    let W = innerWidth, H = innerHeight;

    /* views: the background eases between waypoints along Koppa → Sullia on chapter entry */
    const fit = (tx, ty, ax, ay, span) => {
      const sc = span / W, hw = (W * sc) / 2, hh = (H * sc) / 2;
      let cx = tx - (ax - 0.5) * W * sc, cy = ty - (ay - 0.5) * H * sc;
      cx = hw * 2 >= TW ? TW / 2 : clamp(cx, hw, TW - hw);
      cy = hh * 2 >= TH ? TH / 2 : clamp(cy, hh, TH - hh);
      return { cx, cy, sc };
    };
    const along = (t) => [lerp(K[0], SU[0], t), lerp(K[1], SU[1], t)];
    const span0 = () => (small() ? 150 : 300);
    const views = {
      hero: () => fit(K[0], K[1], small() ? 0.3 : 0.3, small() ? 0.17 : 0.2, span0()),
      now: () => { const p = along(0.2); return fit(p[0], p[1], 0.5, 0.5, span0() * 1.07); },
      work: () => { const p = along(0.42); return fit(p[0], p[1], 0.5, 0.5, span0() * 1.14); },
      caps: () => { const p = along(0.66); return fit(p[0], p[1], 0.5, 0.5, span0() * 1.27); },
      exp: () => fit(SU[0], SU[1], 0.45, 0.5, span0() * 1.4),
    };

    const resize = () => {
      W = cv.clientWidth || innerWidth; H = cv.clientHeight || innerHeight;
      api.W = W; api.H = H;
      const dpr = gl ? Math.min(devicePixelRatio || 1, small() ? 1 : 1.5) : 1;
      const w = Math.round(W * dpr), h = Math.round(H * dpr);
      if (cv.width !== w || cv.height !== h) { cv.width = w; cv.height = h; }
      Object.assign(S, views[S.view]());
      S.dirty = true;
    };
    api.resize = resize;
    api.project = (p) => [(p[0] - S.cx) / S.sc + W / 2, (p[1] - S.cy) / S.sc + H / 2];

    const decode = async () => {
      let src;
      try {
        const blob = await (await fetch(T.png)).blob();
        src = await createImageBitmap(blob, { colorSpaceConversion: 'none', premultiplyAlpha: 'none' });
      } catch (e) {
        src = new Image(); src.src = T.png; await src.decode();
      }
      const c = d.createElement('canvas'); c.width = TW; c.height = TH;
      const x = c.getContext('2d', { willReadFrequently: true });
      x.drawImage(src, 0, 0);
      const px = x.getImageData(0, 0, TW, TH).data;
      heights = new Float32Array(TW * TH);
      for (let i = 0, j = 0; i < heights.length; i++, j += 4) heights[i] = T.hmin + (px[j] * 256 + px[j + 1]) * T.unit;
    };

    /* one fullscreen triangle; contours every 100 m, index every 500 m, NW hillshade ±4 %,
       the cut elevation as ONE blue contour and a 45° section hatch over land above it */
    const VS = `#version 300 es
void main(){vec2 p=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(p*2.0-1.0,0.0,1.0);}`;
    const FS = `#version 300 es
precision highp float;
uniform sampler2D uH;
uniform vec2 uRes; uniform float uDpr; uniform vec2 uC; uniform float uSc; uniform vec2 uTex;
uniform float uRev; uniform float uCut; uniform float uOn; uniform float uBeam; uniform float uLine;
out vec4 o;
const vec3 BG = vec3(0.905882, 0.909804, 0.894118);
const vec3 INK = vec3(0.070588, 0.074510, 0.066667);
const vec3 BLUE = vec3(0.113725, 0.305882, 0.847059);
const vec3 HATCH = vec3(0.678431, 0.682353, 0.654902);
float iso(float v, float stp, float hw){
  float f = v / stp; float fw = max(fwidth(f), 1e-5);
  float dd = abs(fract(f - 0.5) - 0.5) / fw;
  return (1.0 - smoothstep(hw - 0.5, hw + 0.5, dd)) * (1.0 - smoothstep(0.14, 0.4, fw));
}
void main(){
  vec2 res = uRes / uDpr;
  vec2 css = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y) / uDpr;
  vec2 uv = (uC + (css - 0.5 * res) * uSc) / uTex;
  float rv = 1.0 - smoothstep(uRev - 0.025, uRev, css.y / res.y);
  vec3 col = BG;
  if (rv > 0.001 && uv.x > 0.0 && uv.x < 1.0 && uv.y > 0.0 && uv.y < 1.0) {
    vec2 e = 1.0 / uTex;
    float h = texture(uH, uv).r;
    float hl = texture(uH, uv - vec2(e.x, 0.0)).r, hr = texture(uH, uv + vec2(e.x, 0.0)).r;
    float hu = texture(uH, uv - vec2(0.0, e.y)).r, hd = texture(uH, uv + vec2(0.0, e.y)).r;
    vec2 g = vec2(hr - hl, hd - hu) / 634.7;
    vec3 n = normalize(vec3(-g * 2.5, 1.0));
    vec3 L = normalize(vec3(-1.0, -1.0, 1.25));
    float shade = dot(n, L) - L.z;
    vec3 c = BG * (1.0 + clamp(shade * 0.16, -0.04, 0.04) * mix(0.55, 1.0, uLine));
    float land = step(1.0, h);
    float quiet = 1.0 - smoothstep(58.0, 104.0, css.y);            // HUD quiet zone
    float la = mix(1.0, 0.3, quiet) * uLine;
    c = mix(c, INK, 0.085 * iso(h, 100.0, 0.5 * uDpr) * land * la);
    c = mix(c, INK, 0.17 * iso(h, 500.0, 0.8 * uDpr) * land * la);
    float dy = css.y / res.y - uBeam;
    float beam = mix(0.2, 1.0, exp(-dy * dy / 0.045)) * (1.0 - 0.85 * quiet);  // the instrument's light falls off away from the plane
    float fh = max(fwidth(h), 1e-3);
    float above = smoothstep(-fh, fh, h - uCut) * land;
    float SP = 9.0 * uDpr;
    float hd2 = abs(fract((gl_FragCoord.x - gl_FragCoord.y) / SP) - 0.5) * SP * 0.70711;
    float hatch = 1.0 - smoothstep(0.3 * uDpr, 0.95 * uDpr, hd2);
    c = mix(c, HATCH, 0.2 * hatch * above * uOn * (1.0 - quiet) * mix(0.35, 1.0, beam));
    float dc = abs(h - uCut) / fh;
    float line = (1.0 - smoothstep(0.35 * uDpr, 1.1 * uDpr, dc)) * 0.9;
    float halo = exp(-dc * dc / (22.0 * uDpr * uDpr)) * 0.05;
    c = mix(c, BLUE, max(line, halo) * uOn * land * beam);
    col = mix(BG, c, rv);
  }
  o = vec4(col, 1.0);
}`;
    const initGL = () => {
      const sh = (type, src) => {
        const s = gl.createShader(type); gl.shaderSource(s, src); gl.compileShader(s);
        if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) || 'shader');
        return s;
      };
      prog = gl.createProgram();
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      if (!gl.getProgramParameter(prog, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(prog) || 'link');
      ['uH', 'uRes', 'uDpr', 'uC', 'uSc', 'uTex', 'uRev', 'uCut', 'uOn', 'uBeam', 'uLine'].forEach((k) => { U[k] = gl.getUniformLocation(prog, k); });
      const tex = gl.createTexture();
      gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, tex);
      gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.R16F, TW, TH, 0, gl.RED, gl.FLOAT, heights);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
      gl.useProgram(prog);
      gl.uniform1i(U.uH, 0);
      gl.uniform2f(U.uTex, TW, TH);
      gl.bindVertexArray(gl.createVertexArray());
    };
    const drawGL = () => {
      gl.viewport(0, 0, cv.width, cv.height);
      gl.uniform2f(U.uRes, cv.width, cv.height);
      gl.uniform1f(U.uDpr, cv.width / W);
      gl.uniform2f(U.uC, S.cx, S.cy);
      gl.uniform1f(U.uSc, S.sc);
      gl.uniform1f(U.uRev, S.reveal);
      gl.uniform1f(U.uCut, S.cut);
      gl.uniform1f(U.uOn, S.on * (small() ? 0.72 : 1));
      gl.uniform1f(U.uBeam, S.beam);
      gl.uniform1f(U.uLine, S.line);
      gl.drawArrays(gl.TRIANGLES, 0, 3);
    };

    /* fallback poster (no WebGL2, Save-Data, low memory): the same plan drawn once on the CPU */
    const sample = (tx, ty) => {
      tx = clamp(tx, 0, TW - 1.001); ty = clamp(ty, 0, TH - 1.001);
      const x0 = tx | 0, y0 = ty | 0, fx = tx - x0, fy = ty - y0, i = y0 * TW + x0;
      return (heights[i] * (1 - fx) + heights[i + 1] * fx) * (1 - fy) + (heights[i + TW] * (1 - fx) + heights[i + TW + 1] * fx) * fy;
    };
    const drawPoster = () => {
      ctx2d = ctx2d || cv.getContext('2d');
      const w = cv.width, h = cv.height; if (!w || !h || !ctx2d) return;
      const k = W / w, hv = new Float32Array(w * h);
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) hv[y * w + x] = sample(S.cx + (x * k - W / 2) * S.sc, S.cy + (y * k - H / 2) * S.sc);
      const img = ctx2d.createImageData(w, h), D = img.data;
      for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
        const i = y * w + x, v = hv[i];
        let r = 231, g = 232, b = 228;
        if (v >= 1 && x < w - 1 && y < h - 1) {
          const vr = hv[i + 1], vd = hv[i + w];
          const cr = (s) => Math.floor(v / s) !== Math.floor(vr / s) || Math.floor(v / s) !== Math.floor(vd / s);
          const a = cr(500) ? 0.15 : cr(100) ? 0.075 : 0;
          if (a) { r += (18 - r) * a; g += (19 - g) * a; b += (17 - b) * a; }
          if ((v - S.cut) * (vr - S.cut) < 0 || (v - S.cut) * (vd - S.cut) < 0) { const q = S.on; r += (29 - r) * q; g += (78 - g) * q; b += (216 - b) * q; }
        }
        const j = i * 4; D[j] = r; D[j + 1] = g; D[j + 2] = b; D[j + 3] = 255;
      }
      ctx2d.putImageData(img, 0, 0);
    };

    api.render = () => {
      if (!S.ready || !S.dirty) return;
      S.dirty = false;
      if (gl) drawGL();
      else {
        drawPoster();
        cv.style.clipPath = S.reveal < 1.5 ? `inset(0 0 ${Math.max(0, (1 - S.reveal) * 100).toFixed(2)}% 0)` : '';
      }
      if (api.onRender) api.onRender();
    };
    api.setView = (name, instant) => {
      if (RM || !views[name] || S.view === name) return;
      S.view = name;
      const v = views[name](), on = name === 'hero' ? 1 : 0, line = name === 'hero' ? 1 : 0.62;
      if (instant || !gl) { Object.assign(S, v); S.on = gl ? on : 1; S.line = line; S.dirty = true; return; }
      gsap.to(S, { cx: v.cx, cy: v.cy, sc: v.sc, on, line, duration: 1.2, ease: 'power2.inOut', overwrite: 'auto', onUpdate: () => { S.dirty = true; } });
    };
    api.boot = async () => {
      try {
        await decode();
        if (gl) {
          try { initGL(); } catch (err) {
            console.warn('[terrain] WebGL2 failed, drawing the poster instead:', err.message);
            const fresh = cv.cloneNode(false); cv.replaceWith(fresh); cv = fresh; gl = null; S.mode = '2d';
          }
        }
        resize();
        S.ready = true; S.dirty = true;
      } catch (err) {
        console.warn('[terrain] heightmap unavailable:', err.message);
      }
    };
    cv.addEventListener('webglcontextlost', (e) => { e.preventDefault(); S.ready = false; });
    cv.addEventListener('webglcontextrestored', () => { try { initGL(); S.ready = true; S.dirty = true; } catch (e) { /* stay plain plaster */ } });
    return api;
  })();

  /* ------------------------------------------------------------------ 3. hero: the name is a specimen, the plane is the instrument */
  const hero = $('#top'), wrap = $('#nameWrap'), nameEl = $('#name');
  const readout = $('#readout'), roE = $('#roE'), roP = $('#roP'), marker = $('#mkKoppa');
  const info = $('.hero-info'), plan = $('#plan');
  const G = { fs: 100, rest: 55, capTop: 7, base: 80, bandTop: 9, bandBot: 77, wrapTop: 300, heroH: 900, two: false };
  const measureHero = () => {
    G.two = small();
    if (!G.two) {
      const below = wrap.offsetHeight + parseFloat(getComputedStyle(info).marginTop) + info.offsetHeight + plan.offsetHeight + parseFloat(getComputedStyle(hero).paddingBottom);
      hero.style.setProperty('--below', Math.ceil(below) + 'px');
    }
    G.fs = parseFloat(getComputedStyle(nameEl).fontSize) || 100;
    G.rest = G.fs * (G.two ? 1.3957 : 0.5553);   // must match --plane in CSS
    G.capTop = G.fs * 0.0706;
    G.base = G.fs * (G.two ? 1.645 : 0.805);
    G.bandTop = G.capTop + 2;              // the plane always stays inside the letters,
    G.bandBot = G.base - 3;                // so the name always reads as a sectioned solid
    G.wrapTop = wrap.offsetTop;
    G.heroH = hero.offsetHeight;
  };

  const P = { y: 0, tgt: null, active: false, hold: 0, sx: 0, sv: 0, idle: true, intro: !RM };
  const IN = { line: 0, phase: 0 };
  const last = {};
  const setVar = (k, v) => { if (last[k] !== v) { wrap.style.setProperty(k, v); last[k] = v; } };

  const elevAt = (y) => (y <= G.rest
    ? lerp(1700, 790, clamp((y - G.bandTop) / Math.max(1, G.rest - G.bandTop), 0, 1))
    : lerp(790, 60, clamp((y - G.rest) / Math.max(1, G.bandBot - G.rest), 0, 1)));
  const placeAt = (e) => {
    if (Math.abs(e - 790) <= 30) return 'Koppa';
    if (Math.abs(e - 920) <= 30) return 'Bengaluru';
    if (Math.abs(e - 110) <= 40) return 'Sullia';
    if (e >= 1000) return 'Ghats';
    if (e >= 600) return 'Plateau';
    if (e >= 160) return 'Ghat slopes';
    return 'Coast';
  };
  const writeReadout = (y) => {
    const e = elevAt(y), er = Math.round(e / 10) * 10;
    if (er !== last.er) {
      last.er = er;
      roE.textContent = 'CUT ' + er.toLocaleString('en-IN') + ' m';
      roP.textContent = placeAt(e).toUpperCase();
    }
    if (terra.S.mode === 'gl' && Math.abs(terra.S.cut - e) > 0.25) { terra.S.cut = e; terra.S.dirty = true; }
  };
  const writeBeam = (y) => {
    const b = (G.wrapTop + y - scrollY) / (terra.H || innerHeight);
    if (Math.abs(terra.S.beam - b) > 0.0008) { terra.S.beam = b; terra.S.dirty = true; }
  };
  const writePlane = (y, sh) => {
    const dy = y - G.rest;
    setVar('--dy', dy.toFixed(2) + 'px');
    setVar('--cy', y.toFixed(2) + 'px');
    setVar('--by', y.toFixed(2) + 'px');
    setVar('--idy', dy.toFixed(2) + 'px');
    setVar('--shT', (sh * 0.5).toFixed(2) + 'px');
    setVar('--shB', (-sh * 0.5).toFixed(2) + 'px');
    writeReadout(y);
    writeBeam(y);
  };
  const writeIntro = () => {
    const yName = IN.line - G.wrapTop;
    setVar('--dy', (yName - G.rest).toFixed(2) + 'px');
    setVar('--by', yName.toFixed(2) + 'px');
    if (IN.phase === 0) { setVar('--cy', '9999px'); setVar('--idy', '120vh'); }
    else { setVar('--cy', yName.toFixed(2) + 'px'); setVar('--idy', (yName - G.rest).toFixed(2) + 'px'); }
    writeBeam(yName);
    const rev = (IN.line - scrollY) / innerHeight + 0.0125;
    if (IN.phase === 0 && Math.abs(terra.S.reveal - rev) > 0.0005) { terra.S.reveal = rev; terra.S.dirty = true; }
  };

  const heroTick = (dt) => {
    if (RM) return;
    if (P.intro) { writeIntro(); return; }
    if (P.idle) return;
    const now = performance.now();
    let tgt = G.rest;
    if (P.tgt != null && (P.active || P.hold > now)) tgt = P.tgt;
    P.y += (tgt - P.y) * (1 - Math.pow(1 - 0.14, dt * 60));
    // shear: horizontal pointer velocity slices the two halves apart along the cut
    const a = -190 * P.sx - 17 * P.sv;
    P.sv += a * dt; P.sx += P.sv * dt;
    if (P.sx > 11) { P.sx = 11; P.sv = Math.min(P.sv, 0); } else if (P.sx < -11) { P.sx = -11; P.sv = Math.max(P.sv, 0); }
    const inside = P.y > G.capTop + 1 && P.y < G.base - 1;
    writePlane(P.y, inside ? P.sx : 0);
    if (Math.abs(tgt - P.y) < 0.05 && Math.abs(P.sx) < 0.04 && Math.abs(P.sv) < 0.4 && !(P.hold > now)) {
      P.y = tgt; P.sx = 0; P.sv = 0; writePlane(P.y, 0); P.idle = true;
    }
  };

  if (!RM) {
    addEventListener('pointermove', (e) => {
      if (P.intro || e.pointerType === 'touch') return;
      const y = e.clientY + scrollY - G.wrapTop;
      const inZone = scrollY < G.heroH && y >= G.capTop - G.fs * 0.45 && y <= G.base + 40;
      if (inZone) {
        P.tgt = clamp(y, G.bandTop, G.bandBot);
        P.active = true;
        if (FINE) P.sv += (e.movementX || 0) * 9;
        P.idle = false;
      } else if (P.active) { P.active = false; P.idle = false; }
    }, { passive: true });
    root.addEventListener('mouseleave', () => { if (P.active) { P.active = false; P.idle = false; } });
    hero.addEventListener('pointerdown', (e) => {
      if (P.intro || e.pointerType !== 'touch' || e.target.closest('a, button')) return;
      const y = e.clientY + scrollY - G.wrapTop;
      if (y < G.capTop - G.fs * 0.6 || y > G.base + 90) return;
      P.tgt = clamp(y, G.bandTop, G.bandBot); P.hold = performance.now() + 2800; P.idle = false;
    });
  }

  /* the Koppa station marker sits on the ground; at rest the blue 790 m contour runs through it */
  let markerOn = false;
  terra.onRender = () => {
    const [x, y] = terra.project(terra.K);
    marker.style.transform = `translate3d(${x.toFixed(1)}px, ${y.toFixed(1)}px, 0) translateY(-50%)`;
    marker.dataset.y = y.toFixed(1);
  };
  const markerTick = () => {
    const my = +(marker.dataset.y || -1);
    const planeScreen = G.wrapTop + (RM || P.intro ? G.rest : P.y) - scrollY;
    const on = !P.intro && terra.S.ready && terra.S.view === 'hero' && my > 60 && my < planeScreen - 14;
    if (on !== markerOn) { markerOn = on; marker.classList.toggle('on', on); }
  };

  /* ------------------------------------------------------------------ 4. opening sequence (2.4 s, skippable) */
  let introTl = null;
  const endIntro = () => {
    P.intro = false; P.y = G.rest; P.idle = false;
    root.classList.remove('intro');
    hero.classList.add('settled');
    terra.S.reveal = 9; terra.S.on = terra.S.view === 'hero' ? 1 : 0; terra.S.dirty = true;
    gsap.set(['.hero-info .rise > *', readout, '#hud', '.plan a > *'], { clearProps: 'transform,opacity,visibility' });
    $$('.pl-l').forEach((l) => l.style.removeProperty('--pl'));
  };
  const runIntro = () => {
    const rises = $$('.hero-info .rise > *');
    const lines = $$('.plan .pl-l');
    const texts = $$('.plan a > :not(.pl-l)');
    const hud = $('#hud');
    gsap.set(rises, { y: 0, yPercent: 115 });
    gsap.set(texts, { opacity: 0 });
    gsap.set(lines, { '--pl': 0 });
    gsap.set([readout, hud], { opacity: 0 });
    IN.line = scrollY + 1; IN.phase = 0;
    introTl = gsap.timeline({ onComplete: endIntro })
      // beat 1 (CSS, from first paint): a hairline draws from the centre outward at the top edge
      .to({}, { duration: 0.3 }, 0)
      // beat 2: it sweeps the bed top to bottom; the ground resolves above it; glyph sections flash blue
      .to(IN, { line: () => scrollY + innerHeight - 1, duration: 1.0, ease: 'scan' }, 0.3)
      // beat 3: the plane rises back to rest and cuts; below it everything is interior
      .add(() => { IN.phase = 1; }, 1.3)
      .to(IN, { line: () => G.wrapTop + G.rest, duration: 0.6, ease: 'settle' }, 1.3)
      .to(terra.S, { on: 1, duration: 0.6, ease: 'power1.out', onUpdate: () => { terra.S.dirty = true; } }, 1.3)
      // beat 4: what is inside rises out of the cut
      .to(rises, { yPercent: 0, duration: 0.75, ease: 'settle', stagger: 0.08 }, 1.55)
      .to(readout, { opacity: 1, duration: 0.45, ease: 'power1.out' }, 1.6)
      // beat 5: slice-plan lines and the HUD
      .to(lines, { '--pl': 1, duration: 0.55, ease: 'settle', stagger: 0.07 }, 1.8)
      .to(texts, { opacity: 1, duration: 0.5, ease: 'power1.out', stagger: 0.035 }, 1.8)
      .to(hud, { opacity: 1, duration: 0.6, ease: 'power1.out' }, 1.8);
    // beat 1 already started in CSS at first paint; join it where it is, never skipping the sweep
    introTl.seek(clamp((performance.now() - (window.__t0 || 0)) / 1000, 0, 0.3), false);
    const skip = () => { if (introTl && introTl.progress() < 1) introTl.progress(1); };
    ['wheel', 'touchstart', 'keydown'].forEach((ev) => addEventListener(ev, skip, { once: true, passive: true }));
    addEventListener('pointerdown', skip, { once: true, passive: true });
  };

  /* ------------------------------------------------------------------ 5. chapter openers: a rule is cut across the grid, then the type rises */
  const setupOpeners = () => {
    $$('.opener').forEach((op) => {
      const rule = $('.cut-rule', op), kicker = $('.kicker', op), title = $('.op-title', op), body = $('.op-body', op);
      if (RM) return;
      let lines = [title];
      if (window.SplitText) { try { lines = SplitText.create(title, { type: 'lines', mask: 'lines' }).lines; } catch (e) { lines = [title]; } }
      if (rule.getBoundingClientRect().top < innerHeight * 0.82) return;   // already in view (restored scroll): leave it set
      gsap.set(rule, { scaleX: 0 });
      gsap.set(lines, { yPercent: 108 });
      gsap.set([kicker, body].filter(Boolean), { yPercent: 40, autoAlpha: 0 });
      ScrollTrigger.create({
        trigger: rule, start: 'top 82%', once: true,
        onEnter: () => {
          gsap.timeline()
            .to(rule, { scaleX: 1, duration: 0.9, ease: 'scan' }, 0)
            .to(kicker, { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'settle' }, 0.32)
            .to(lines, { yPercent: 0, duration: 0.8, ease: 'settle', stagger: 0.08 }, 0.4)
            .add(body ? gsap.to(body, { yPercent: 0, autoAlpha: 1, duration: 0.8, ease: 'settle' }) : () => {}, 0.56);
        },
      });
    });
  };

  /* ------------------------------------------------------------------ 6. THE SCAN: the specimen is cut 1:1 with scroll, surface → section */
  const spec = $('#drone'), body = $('#drone-body'), inner = $('#secInner'), svg = $('#wires');
  const bladeLbl = $('#bladeLabel'), toggle = $('#secToggle');
  const SP = { p: 0, forced: false, H: 1, tiers: [], nodes: {}, pulsed: false, spine: null, tl: null, last: -1, label: '' };
  const rel = (el, ref) => { const a = el.getBoundingClientRect(), b = ref.getBoundingClientRect(); return { x: a.left - b.left, y: a.top - b.top, w: a.width, h: a.height }; };

  const buildWires = () => {
    const N = SP.nodes;
    if (!N.ui || !N.api || !N.db || !N.llm) return;
    const W = inner.clientWidth, H = inner.clientHeight;
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`);
    const xs = Math.round(N.ui.x + Math.min(56, N.ui.w * 0.16)) + 0.5;
    const xw = Math.round(N.ui.x + N.ui.w * (small() ? 0.86 : 0.58)) + 0.5;
    const bot = (n) => n.y + n.h, mid = (n) => n.y + n.h / 2;
    const segs = [
      { a: 'ui', b: 'api', x1: xs, y1: bot(N.ui), x2: xs, y2: N.api.y, t: 'HTTP · JSON', req: 1 },
      { a: 'ui', b: 'api', x1: xw, y1: bot(N.ui), x2: xw, y2: N.api.y, t: 'WebSocket · /ws/kpi' },
      { a: 'api', b: 'db', x1: xs, y1: bot(N.api), x2: xs, y2: N.db.y, t: 'query · top 5', req: 1 },
      { a: 'db', b: 'llm', x1: xs, y1: bot(N.db), x2: xs, y2: N.llm.y, t: 'context → prompt', req: 1 },
    ];
    if (N.fb) segs.push({ a: 'llm', b: 'fb', x1: N.llm.x + N.llm.w, y1: Math.round(mid(N.llm)) + 0.5, x2: N.fb.x, y2: Math.round(mid(N.fb)) + 0.5, t: 'if it fails', dash: 1, h: 1 });
    let html = '';
    segs.forEach((s) => {
      html += `<line x1="${s.x1}" y1="${s.y1}" x2="${s.x2}" y2="${s.y2}" class="${s.dash ? 'dash ' : ''}${s.req ? 'req' : ''}" data-a="${s.a}" data-b="${s.b}" data-y1="${s.y1}" data-y2="${s.y2}"/>`;
      if (s.h) {
        const tx = (s.x1 + s.x2) / 2;
        if (s.x2 - s.x1 > 84) html += `<text x="${tx}" y="${s.y1 - 8}" text-anchor="middle">${s.t}</text>`;
      } else if (s.y2 - s.y1 > 26) {
        html += `<text x="${s.x1 + 10}" y="${(s.y1 + s.y2) / 2 + 4}">${s.t}</text>`;
      }
    });
    html += `<g class="pulse-g" opacity="0"><circle class="pulse-halo" cx="${xs}" cy="0" r="8"/><circle class="pulse" cx="${xs}" cy="0" r="3.5"/></g>`;
    svg.innerHTML = html;
    SP.spine = { x: xs, y0: bot(N.ui), y1: N.llm.y + N.llm.h * 0.5 };
  };

  const measureSpec = () => {
    SP.H = body.clientHeight || 1;
    SP.tiers = $$('.tier', inner).map((t) => { const r = rel(t, body); return { el: t, top: r.y, bot: r.y + r.h, name: t.dataset.tier }; });
    SP.nodes = {};
    $$('.node', inner).forEach((n) => {
      const r = rel(n, inner), rb = rel(n, body);
      SP.nodes[n.dataset.n] = { el: n, x: r.x, y: r.y, w: r.w, h: r.h, top: rb.y, bot: rb.y + rb.h };
    });
    buildWires();
    SP.last = -1;
    applyCut(SP.p);
  };

  const runPulse = () => {
    if (RM || !SP.spine) return;
    const g = $('.pulse-g', svg); if (!g) return;
    const dots = $$('circle', g);
    const reqs = $$('line.req', svg);
    const nodes = ['ui', 'api', 'db', 'llm'].map((k) => SP.nodes[k]).filter(Boolean);
    const { y0, y1 } = SP.spine;
    const dur = (y1 - y0) / 420;   // signals don't ease: constant 420 px/s
    const st = { y: y0 };
    const move = () => {
      dots.forEach((c) => c.setAttribute('cy', st.y.toFixed(1)));
      reqs.forEach((l) => l.classList.toggle('hot', st.y >= +l.dataset.y1 - 1 && st.y <= +l.dataset.y2 + 1));
      nodes.forEach((n) => n.el.classList.toggle('hot', st.y >= n.y - 1 && st.y <= n.y + n.h + 1));
    };
    if (SP.tl) SP.tl.kill();
    SP.tl = gsap.timeline({ onComplete: () => { reqs.forEach((l) => l.classList.remove('hot')); nodes.forEach((n) => n.el.classList.remove('hot')); } })
      .set(g, { attr: { opacity: 1 } })
      .to(st, { y: y1, duration: dur, ease: 'none', onUpdate: move })
      .to(st, { y: y0, duration: dur, ease: 'none', onUpdate: move }, '+=0.14')
      .to(g, { attr: { opacity: 0 }, duration: 0.25 });
  };

  function applyCut(p) {
    SP.p = p;
    const v = SP.forced ? 1 : p;
    if (Math.abs(v - SP.last) < 0.00025) return;
    SP.last = v;
    body.style.setProperty('--cutp', (v * 100).toFixed(3));
    const y = v * SP.H, done = v >= 0.999;
    let cur = null;
    SP.tiers.forEach((t) => {
      const isCur = !done && y > t.top && y <= t.bot;
      t.el.classList.toggle('cur', isCur);
      t.el.classList.toggle('past', done || y > t.bot);
      if (isCur) cur = t;
    });
    if (!SP.tl || !SP.tl.isActive()) Object.values(SP.nodes).forEach((n) => n.el.classList.toggle('hot', !done && y > n.top && y < n.bot + 2));
    const name = cur ? cur.name : (SP.tiers.length && y <= SP.tiers[0].top ? SP.tiers[0].name : (SP.tiers.length ? SP.tiers[SP.tiers.length - 1].name : ''));
    const label = done ? 'Section complete' : 'Cutting · ' + name;
    if (label !== SP.label) { SP.label = label; bladeLbl.textContent = label; }
    body.style.setProperty('--blo', v > 0.02 ? 1 : 0);
    if (done && !SP.pulsed) { SP.pulsed = true; runPulse(); } else if (v < 0.97) SP.pulsed = false;
  }

  toggle.addEventListener('click', () => {
    SP.forced = !SP.forced;
    toggle.setAttribute('aria-pressed', String(SP.forced));
    SP.last = -1; applyCut(SP.p);
  });
  // keyboard users never land on hidden content: focusing inside the section completes the cut
  inner.addEventListener('focusin', () => {
    if (!RM && !SP.forced && SP.last < 0.999) { SP.forced = true; toggle.setAttribute('aria-pressed', 'true'); SP.last = -1; applyCut(SP.p); }
  });
  // a probe: hovering a block lights the connections that touch it
  if (FINE) {
    $$('.node', inner).forEach((n) => {
      n.addEventListener('pointerenter', () => $$(`line[data-a="${n.dataset.n}"], line[data-b="${n.dataset.n}"]`, svg).forEach((l) => l.classList.add('hot')));
      n.addEventListener('pointerleave', () => $$('line', svg).forEach((l) => l.classList.remove('hot')));
    });
  }
  $$('.fnref').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault();
    const target = $('#fn1 a'); if (!target) return;
    if (!RM && !SP.forced && SP.last < 0.999) { SP.forced = true; toggle.setAttribute('aria-pressed', 'true'); SP.last = -1; applyCut(SP.p); }
    target.focus();
  }));

  /* ------------------------------------------------------------------ 7. capabilities: a vertical laser reads each row; evidence, not ratings */
  const R = 'https://github.com/Prajwalps2603/';
  const L = {
    drone: R + 'Drone-Intelligence-System', tumor: R + 'Human_Brain_Tumor_Detection', resumai: R + 'AI-Resume-Builder',
    audify: R + 'Audify-AI', bmv: R + 'BookMyVenue', bmvLive: 'https://prajwalps2603.github.io/BookMyVenue/', livora: 'https://prajwalps2603.github.io/Livora/',
    mcp: R + 'Custom-MCP-Server', markvault: R + 'MarkVault-Smart-BooKMark-App', lifesync: R + 'LifeSync', amb: R + 'smart-ambulance-traffic-clearance',
    ghf: 'https://www.credly.com/badges/a810b47b-11af-4dad-88f9-7ea37720f30d/linked_in_profile', gh: 'https://github.com/Prajwalps2603',
  };
  const MF = ['Maruti Flex Traders LLP', 'production, current role'];
  const DY = ['Dyashin Technosoft', 'Java Full Stack intern, 2025'];
  const EV = {
    'React 19': [['Drone Intelligence System', 'React 19 dashboard', L.drone], ['LifeSync AI', 'React 19 + TypeScript', L.lifesync], ['Livora', 'React 19 + Vite, live site', L.livora]],
    'Next.js': [MF, ['ResumAI', 'Next.js 14', L.resumai], ['MarkVault', 'Next.js 16', L.markvault]],
    'TypeScript': [['Audify AI', 'React Native + TypeScript', L.audify], ['Custom MCP Server', 'TypeScript', L.mcp], ['LifeSync AI', 'TypeScript', L.lifesync], ['ResumAI', 'TypeScript', L.resumai]],
    'Tailwind CSS': [['MarkVault', 'Tailwind CSS v4', L.markvault], ['ResumAI', 'Tailwind', L.resumai]],
    'Framer Motion': [['Livora', 'reveals and intro, live site', L.livora], ['ResumAI', 'studio UI', L.resumai]],
    'React Native': [['Audify AI', 'Android app for telecallers', L.audify], ['LifeVault AI', 'phase 1 UI']],
    'Flutter': [['Smart Ambulance Traffic Clearance', 'Flutter app streaming GPS', L.amb]],
    'Bootstrap': null,
    'Spring Boot': [DY], 'Spring MVC': null, 'Hibernate': [DY], 'JDBC': null,
    'Node.js / Express': [['Audify AI', 'hardened HTTPS backend', L.audify], ['BookMyVenue', 'Express API, JWT, bcrypt', L.bmv], ['LifeSync AI', 'Express 5', L.lifesync], ['Smart Ambulance Traffic Clearance', 'Express + Socket.IO', L.amb], ['Campus Connect', 'Node / Express / PostgreSQL']],
    'FastAPI': [['Drone Intelligence System', 'REST routes + WebSocket', L.drone], ['ResumAI', 'API service', L.resumai]],
    'Flask': [['Human Brain Tumor Detection', 'MRI upload web app', L.tumor]],
    'REST': [MF, ['Drone Intelligence System', 'FastAPI routes', L.drone], ['BookMyVenue', 'Express API', L.bmv]],
    'WebSockets': [['Drone Intelligence System', 'live KPI stream', L.drone]],
    'Socket.IO': [['Smart Ambulance Traffic Clearance', 'live missions', L.amb]],
    'JWT': [['BookMyVenue', 'JWT + bcrypt', L.bmv], ['ResumAI', 'JWT auth', L.resumai]],
    'Google Apps Script': [['Maruti Flex Traders LLP', 'business logic and automation, in production']],
    'PostgreSQL': [['MarkVault', 'Supabase Postgres with RLS', L.markvault], ['ResumAI', 'PostgreSQL', L.resumai], ['Campus Connect', 'PostgreSQL']],
    'MySQL': [['Dyashin Technosoft', 'Java, Spring Boot, React, MySQL']],
    'MongoDB': [MF],
    'Supabase': [['MarkVault', 'Auth, Realtime, Postgres RLS', L.markvault]],
    'Firebase': [['LifeSync AI', 'Firestore and Auth', L.lifesync]],
    'ChromaDB': [['Drone Intelligence System', 'vector store, top-5 retrieval', L.drone]],
    'Google Sheets': [['Maruti Flex Traders LLP', 'Google Sheets API, in production'], ['Audify AI', 'Sheets CRM sync', L.audify], ['Custom MCP Server', 'Sheets / Drive sync', L.mcp]],
    'RAG': [['Drone Intelligence System', 'ChromaDB + Gemini', L.drone], ['LifeSync AI', 'Gemini RAG over your own data', L.lifesync]],
    'Gemini': [['Drone Intelligence System', 'Gemini 2.0 Flash', L.drone], ['LifeSync AI', 'Gemini RAG', L.lifesync]],
    'OpenAI API': [['MarkVault', 'AI summaries (example endpoint)', L.markvault], ['ResumAI', 'service scaffolded', L.resumai]],
    'Claude / MCP': [['Drone Intelligence System', 'MCP server for Claude Desktop', L.drone], ['Custom MCP Server', 'Model Context Protocol server', L.mcp]],
    'TensorFlow': [['Human Brain Tumor Detection', 'CNN, ~97% accuracy', L.tumor]],
    'Keras': [['Human Brain Tumor Detection', 'CNN model', L.tumor]],
    'CNNs': [['Human Brain Tumor Detection', '12,000+ MRI images; 1st place, KVGCE 2025', L.tumor]],
    'Sentence Transformers': [['Drone Intelligence System', 'local all-MiniLM-L6-v2 embeddings', L.drone]],
    'Speech-to-text': [['Audify AI', 'Google STT v2, Whisper, Deepgram, AssemblyAI', L.audify]],
    'OpenCV': [['Human Brain Tumor Detection', 'preprocessing and augmentation', L.tumor], ['Road Accident Detection', 'OpenCV + Twilio']],
    'Docker': [['Drone Intelligence System', 'Docker Compose, 2 services', L.drone], ['Smart Ambulance Traffic Clearance', 'Docker', L.amb]],
    'AWS (EC2, S3, RDS)': [['Techbyheart', 'Cloud & Cybersecurity intern, 2023'], ['CloudScape', 'EC2 + S3 hosting']],
    'GitHub Actions': [['BookMyVenue', 'auto-deploys the live demo', L.bmvLive]],
    'Git / GitHub': [['GitHub Foundations', 'certified, 2025', L.ghf], ['github.com/Prajwalps2603', 'every repository above', L.gh]],
    'Linux': null, 'Maven': null, 'Postman': null,
    'MQTT': [['Smart Ambulance Traffic Clearance', 'Mosquitto broker', L.amb]],
    'ESP32 firmware': [['Smart Ambulance Traffic Clearance', 'smart poles, traffic-light preemption', L.amb]],
    'Java 21': [DY, ['Sudoku Solver', 'backtracking in Java']],
    'JavaScript': [MF, ['BookMyVenue', 'React 18 + Express', L.bmv]],
    'Python': [['Human Brain Tumor Detection', 'TensorFlow / Keras', L.tumor], ['Drone Intelligence System', 'FastAPI', L.drone], ['Rooman Technologies', 'ML intern, predictive models']],
    'SQL': null, 'HTML5': null, 'CSS3': null,
  };
  const evT = $('#evT'), evL = $('#evL');
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const showEvidence = (tok) => {
    $$('.tok[aria-pressed="true"]').forEach((t) => { if (t !== tok) t.setAttribute('aria-pressed', 'false'); });
    tok.setAttribute('aria-pressed', 'true');
    const k = tok.textContent.trim();
    if (evT.textContent === k) return;
    evT.textContent = k;
    const items = EV[k];
    evL.innerHTML = items
      ? items.map(([t, n, u]) => `<li><b>${esc(t)}</b>${n ? `<small>${esc(n)}</small>` : ''}${u ? `<a href="${u}" target="_blank" rel="noopener">${u.includes('github.io') ? 'Live' : u.includes('credly') ? 'Verify' : 'Repo'} <span aria-hidden="true">↗</span><span class="sr"> ${esc(t)}, opens in a new tab</span></a>` : ''}</li>`).join('')
      : '<li class="ev-note">Listed on résumé. No public project to point to yet.</li>';
    if (!RM) gsap.fromTo(evL.children, { yPercent: 30, opacity: 0 }, { yPercent: 0, opacity: 1, duration: 0.42, ease: 'settle', stagger: 0.04, overwrite: true });
  };
  $$('.tok').forEach((t) => {
    t.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') showEvidence(t); });
    t.addEventListener('focus', () => showEvidence(t));
    t.addEventListener('click', () => showEvidence(t));
  });
  const setupCaps = () => {
    $$('.cap-row').forEach((row, i) => {
      const toks = $$('.tok', row), lz = $('.cap-laser', row);
      if (RM) { toks.forEach((t) => t.classList.add('lit')); return; }
      ScrollTrigger.create({
        trigger: row, start: 'top 82%', once: true,
        onEnter: () => {
          const w = row.clientWidth, D = 0.9, d0 = (i % 3) * 0.06, ease = gsap.parseEase('scan');
          gsap.fromTo(lz, { x: 0, opacity: 1 }, { x: w, duration: D, ease: 'scan', delay: d0, onComplete: () => gsap.to(lz, { opacity: 0, duration: 0.2 }) });
          toks.forEach((t) => {
            const cx = t.offsetLeft + t.offsetWidth / 2;
            let at = 0; // when does the eased blade cross this token's centre?
            for (let s = 0; s <= 90; s++) { if (ease(s / 90) * w >= cx) { at = (s / 90) * D; break; } }
            gsap.delayedCall(d0 + at, () => {
              t.classList.add('hot');
              gsap.delayedCall(0.22, () => { t.classList.remove('hot'); t.classList.add('lit'); });
            });
          });
        },
      });
    });
  };

  /* ------------------------------------------------------------------ 8. experience: the section, flattened (real SRTM profile) */
  const prof = $('#profile'), profSvg = $('#profSvg'), profLabels = $('#profLabels'), profCur = $('#profCursor'), profRead = $('#profRead');
  const PR = T ? T.profile : [];
  const maxKm = PR.length ? PR[PR.length - 1][0] : 1;
  const legs = T ? T.legKm : [108, 244];
  const PV = { W: 1000, H: 240, top: 14, bot: 236, max: 1600 };
  const pY = (e) => PV.bot - (e / PV.max) * (PV.bot - PV.top);
  const pX = (km) => (km / maxKm) * PV.W;
  const buildProfile = () => {
    if (!PR.length) return;
    let line = '', area = `M0 ${PV.H} `;
    PR.forEach(([km, e], i) => { const x = pX(km).toFixed(2), y = pY(e).toFixed(2); line += `${i ? 'L' : 'M'}${x} ${y} `; area += `L${x} ${y} `; });
    area += `L${PV.W} ${PV.H} Z`;
    const guides = [500, 1000, 1500].map((e) => `<line x1="0" x2="${PV.W}" y1="${pY(e)}" y2="${pY(e)}" stroke="#ADAEA7" stroke-width="1" stroke-dasharray="2 5" vector-effect="non-scaling-stroke"/>`).join('');
    const st = [['Koppa', 0], ['Sullia', legs[0]], ['Bengaluru', maxKm]];
    const stLines = st.map(([k, km]) => { const x = pX(km), e = T.towns[k].elev; return `<line x1="${x}" x2="${x}" y1="${pY(e) - 26}" y2="${PV.H}" stroke="#121311" stroke-width="1" vector-effect="non-scaling-stroke"/>`; }).join('');
    profSvg.insertAdjacentHTML('beforeend', `<defs><clipPath id="profClip"><rect id="profClipR" x="-2" y="-40" width="${RM ? 1004 : 0}" height="320"/></clipPath></defs>${guides}<g clip-path="url(#profClip)"><path d="${area}" fill="#101214"/><path d="${line}" fill="none" stroke="#1D4ED8" stroke-width="2" vector-effect="non-scaling-stroke" stroke-linejoin="round"/></g>${stLines}`);
    const pct = (v, of) => ((v / of) * 100).toFixed(3) + '%';
    profLabels.innerHTML =
      [500, 1000, 1500].map((e) => `<span class="pguide" style="left:17%;top:${pct(pY(e), PV.H)}">${e.toLocaleString('en-IN')} m</span>`).join('') +
      st.map(([k, km], i) => { const e = T.towns[k].elev; return `<span class="plab ${i === 0 ? 'l' : i === 2 ? 'r' : ''}" style="left:${pct(pX(km), PV.W)};top:${pct(pY(e) - 26, PV.H)}">${k}<small>≈${(Math.round(e / 10) * 10).toLocaleString('en-IN')} m</small></span>`; }).join('') +
      `<span class="pleg" style="left:${pct(pX(legs[0] / 2), PV.W)}">≈${Math.round(legs[0])} km</span><span class="pleg" style="left:${pct(pX(legs[0] + legs[1] / 2), PV.W)}">≈${Math.round(legs[1])} km</span>`;
  };
  const profNote = () => {
    const r = prof.getBoundingClientRect(); if (!r.width) return;
    const ve = (((PV.bot - PV.top) / PV.max) * (r.height / PV.H)) / (r.width / (maxKm * 1000));
    $('#profNote').textContent = `Straight-line legs · vertical ×${Math.round(ve)}`;
  };
  const elevAtKm = (km) => {
    let lo = 0, hi = PR.length - 1;
    while (hi - lo > 1) { const m = (lo + hi) >> 1; if (PR[m][0] < km) lo = m; else hi = m; }
    const a = PR[lo], b = PR[hi], t = b[0] === a[0] ? 0 : (km - a[0]) / (b[0] - a[0]);
    return lerp(a[1], b[1], clamp(t, 0, 1));
  };
  const scrubAt = (clientX) => {
    const r = prof.getBoundingClientRect(), fx = clamp((clientX - r.left) / r.width, 0, 1), km = fx * maxKm;
    const e = elevAtKm(km), leg = km < legs[0] ? 'Koppa → Sullia' : 'Sullia → Bengaluru';
    profCur.style.transform = `translate3d(${(fx * r.width).toFixed(1)}px,0,0)`;
    profRead.textContent = `${Math.round(km)} km · ≈${(Math.round(e / 10) * 10).toLocaleString('en-IN')} m · ${leg}`;
    profRead.style.transform = fx < 0.16 ? 'translateX(0)' : fx > 0.84 ? 'translateX(-100%)' : 'translateX(-50%)';
    profCur.classList.add('on');
  };
  if (PR.length) {
    prof.addEventListener('pointermove', (e) => scrubAt(e.clientX));
    prof.addEventListener('pointerdown', (e) => scrubAt(e.clientX));
    prof.addEventListener('pointerleave', () => profCur.classList.remove('on'));
    prof.addEventListener('pointercancel', () => profCur.classList.remove('on'));
  }
  const setupProfile = () => {
    const stations = $$('#stations li');
    if (RM) { stations.forEach((li) => li.classList.add('on')); return; }
    const clipR = $('#profClipR');
    const draw = (s) => {
      const p = s.progress, km = p * maxKm;
      if (clipR) clipR.setAttribute('width', (p * 1004).toFixed(1));
      stations.forEach((li) => li.classList.toggle('on', p > 0.002 && km >= +li.dataset.km - 0.6));
    };
    ScrollTrigger.create({ trigger: prof, start: 'top 82%', end: 'bottom 42%', onUpdate: draw, onRefresh: draw });
  };

  /* ------------------------------------------------------------------ 9. contact: the interior rises through a scrubbed cut; copy with feedback */
  const contact = $('#contact');
  const setupContact = () => {
    if (RM) return;
    const set = (p) => {
      const ct = (1 - p) * innerHeight * 0.3;
      contact.style.setProperty('--ct', ct.toFixed(1) + 'px');
      contact.style.setProperty('--clo', p > 0 ? 1 : 0);
    };
    set(0);
    ScrollTrigger.create({ trigger: contact, start: 'top bottom', end: 'top 55%', onUpdate: (s) => set(s.progress), onRefresh: (s) => set(s.progress) });
  };
  const sweep = $('#cSweep');
  let statusTimers = {};
  const copyEmail = async (btn) => {
    const status = d.getElementById(btn.dataset.copy);
    let ok = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(EMAIL); ok = true; } } catch (e) { ok = false; }
    if (!ok) {
      try {
        const ta = d.createElement('textarea');
        ta.value = EMAIL; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;left:0;top:0;opacity:0;pointer-events:none';
        d.body.appendChild(ta); ta.select(); ok = d.execCommand('copy'); ta.remove(); btn.focus({ preventScroll: true });
      } catch (e) { ok = false; }
    }
    if (!ok) { const r = d.createRange(); r.selectNodeContents($('#email')); const s = getSelection(); s.removeAllRanges(); s.addRange(r); }
    status.textContent = ok ? (status.id === 'heroStatus' ? 'Copied: ' + EMAIL : 'Copied to clipboard') : 'Press Ctrl/⌘ + C to copy';
    if (ok && !RM && status.id === 'contactStatus') gsap.fromTo(sweep, { scaleX: 0, opacity: 1 }, { scaleX: 1, duration: 0.45, ease: 'scan', onComplete: () => gsap.to(sweep, { opacity: 0, duration: 0.3 }) });
    clearTimeout(statusTimers[status.id]);
    statusTimers[status.id] = setTimeout(() => { status.textContent = ''; }, 2600);
  };
  $$('[data-copy]').forEach((b) => b.addEventListener('click', () => copyEmail(b)));

  const clock = $('#clock');
  const fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hour12: false });
  const tickClock = () => { const n = new Date(); clock.textContent = fmt.format(n) + ' IST'; clock.dateTime = n.toISOString(); };
  tickClock(); setInterval(tickClock, 15000);

  const mt = $('#motionToggle');
  (() => {
    const osRM = matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stored = null; try { stored = localStorage.getItem('xs-motion'); } catch (e) {}
    mt.innerHTML = '<i aria-hidden="true"></i>Reduce motion';
    mt.classList.add('toggle');
    if (osRM) { mt.setAttribute('aria-pressed', 'true'); mt.disabled = true; mt.title = 'Reduced by your system setting'; mt.insertAdjacentHTML('beforeend', '<span class="sr"> (set by your system)</span>'); return; }
    mt.setAttribute('aria-pressed', String(stored === 'reduced'));
    mt.addEventListener('click', () => {
      try { if (stored === 'reduced') localStorage.removeItem('xs-motion'); else localStorage.setItem('xs-motion', 'reduced'); } catch (e) {}
      location.reload();
    });
  })();

  /* ------------------------------------------------------------------ 10. HUD: hides on the way down, returns on the way up; Bone over interiors */
  const hud = $('#hud');
  let lastY = scrollY;
  const onScrollHud = (y) => {
    const dy = y - lastY;
    if (Math.abs(dy) > 5) { hud.classList.toggle('away', dy > 0 && y > innerHeight * 0.5); lastY = y; }
  };
  if (lenis) lenis.on('scroll', (l) => onScrollHud(l.scroll)); else addEventListener('scroll', () => onScrollHud(scrollY), { passive: true });

  /* in-page links: Lenis glides (1.4 s, quartic out); focus follows for keyboard users */
  $$('a[href^="#"]:not(.fnref)').forEach((a) => a.addEventListener('click', (e) => {
    const id = a.getAttribute('href'); if (id.length < 2) return;
    const t = d.getElementById(id.slice(1)); if (!t) return;
    e.preventDefault();
    scrollToEl(t);
    if (id !== '#top') { if (!t.hasAttribute('tabindex')) t.setAttribute('tabindex', '-1'); t.focus({ preventScroll: true }); }
    hud.classList.remove('away');
    history.replaceState(null, '', id);
  }));

  /* ------------------------------------------------------------------ 11. boot */
  measureHero();
  terra.boot();
  if (RM) {
    P.intro = false; P.y = G.rest;
    root.classList.remove('intro');
    hero.classList.add('settled');
  } else if (scrollY > 24) {
    P.intro = false; P.y = G.rest; endIntro();
  } else {
    runIntro();
  }

  const mm = gsap.matchMedia();
  if (!RM) {
    mm.add('(min-width: 900px)', () => {
      const st = ScrollTrigger.create({ trigger: spec, start: 'top top', end: '+=90%', pin: true, anticipatePin: 1, onUpdate: (s) => applyCut(s.progress), onRefresh: (s) => { measureSpec(); applyCut(s.progress); } });
      return () => st.kill();
    });
    mm.add('(max-width: 899px)', () => {
      const st = ScrollTrigger.create({ trigger: body, start: 'top 66%', end: 'bottom 54%', onUpdate: (s) => applyCut(s.progress), onRefresh: (s) => { measureSpec(); applyCut(s.progress); } });
      return () => st.kill();
    });
    // the ground eases to the next waypoint along Koppa → Sullia on each chapter entry
    ScrollTrigger.create({ trigger: hero, start: 'top top', end: 'bottom 40%', onToggle: (s) => { if (s.isActive) terra.setView('hero'); } });
    $$('[data-view]').forEach((sec) => ScrollTrigger.create({ trigger: sec, start: 'top 60%', end: 'bottom 40%', onToggle: (s) => { if (s.isActive) terra.setView(sec.dataset.view); } }));
    // HUD turns Bone over interiors (the hero's lower zone and contact)
    ScrollTrigger.create({ trigger: hero, start: () => `top+=${Math.round(G.wrapTop + G.rest - 28)} top`, end: 'bottom top+=28', toggleClass: { targets: hud, className: 'on-dark' } });
  } else {
    body.style.setProperty('--cutp', 100);
  }
  ScrollTrigger.create({ trigger: contact, start: 'top top+=28', end: 'bottom top', toggleClass: { targets: hud, className: 'on-dark' } });

  buildProfile();
  setupContact();
  setupCaps();
  setupProfile();

  const afterFonts = () => {
    measureHero();
    if (!P.intro) { P.y = G.rest; P.idle = false; }
    setupOpeners();
    measureSpec();
    profNote();
    ScrollTrigger.refresh();
  };
  const fontsReady = d.fonts && d.fonts.ready ? Promise.race([d.fonts.ready, new Promise((r) => setTimeout(r, 2500))]) : Promise.resolve();
  fontsReady.then(afterFonts);

  // hero geometry follows the real type metrics: re-measure whenever the info block or plan change size (fonts landing, wraps)
  if (window.ResizeObserver) {
    let roT = 0;
    const ro = new ResizeObserver(() => { cancelAnimationFrame(roT); roT = requestAnimationFrame(() => { measureHero(); if (!P.intro) P.idle = false; }); });
    ro.observe(info); ro.observe(plan);
  }

  let lastW = innerWidth, rT = 0;
  addEventListener('resize', () => {
    clearTimeout(rT);
    rT = setTimeout(() => {
      const wChanged = innerWidth !== lastW; lastW = innerWidth;
      measureHero();
      if (!P.intro) { P.idle = false; }
      terra.resize();
      if (wChanged) { measureSpec(); profNote(); }
    }, 120);
  });
  d.addEventListener('visibilitychange', () => { if (!d.hidden) terra.S.dirty = true; });

  /* one ticker drives everything that moves; nothing draws while idle */
  let tPrev = performance.now();
  gsap.ticker.add(() => {
    const now = performance.now(), dt = Math.min(0.05, (now - tPrev) / 1000);
    tPrev = now;
    if (scrollY < G.heroH + 40 || P.intro) heroTick(dt);
    terra.render();
    markerTick();
  });

  window.__xs = { terra, G, P, SP, applyCut, measureSpec };
})();
