/* =========================================================================
   SIGNAL CHAIN · direction sketch for Prajwal M P
   Modules: prefs · smooth scroll · wave model · hero scope (raw WebGL2) · sampled name ·
   opening · probe cursor · record nav · statement · bench (one data object drives the
   3D board, the SVG board, the scope and the connection list) · record sheet · contact.
   Classic script on purpose: file:// pages cannot load local ES modules; three.js is
   imported dynamically from the CDN through the page's import map.
   ========================================================================= */
(() => {
'use strict';
const D = document, root = D.documentElement;
const $ = (s, el = D) => el.querySelector(s);
const $$ = (s, el = D) => Array.from(el.querySelectorAll(s));
const store = {
  get(k) { try { return localStorage.getItem(k); } catch (_) { return null; } },
  set(k, v) { try { localStorage.setItem(k, v); } catch (_) {} },
};
const savedMotion = store.get('pmp-motion');
const RM = savedMotion ? savedMotion === 'reduced' : matchMedia('(prefers-reduced-motion: reduce)').matches;
let signalsOn = store.get('pmp-signals') !== 'paused';
const FINE = matchMedia('(hover: hover) and (pointer: fine)').matches;
const SMALL = () => innerWidth <= 860;
const TAU = Math.PI * 2;
const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const fract = (x) => x - Math.floor(x);
const CHC = ['#F2B53D', '#4EC1BC', '#93CF63', '#7FA8F5', '#ECE8DF'];
let booted = false;
const bootDone = [];
function finishBoot() {
  if (booted) return;
  booted = true;
  root.classList.remove('booting', 'sampling');
  root.classList.add('booted');
  bootDone.splice(0).forEach((f) => f());
}
const afterBoot = (f) => (booted ? f() : bootDone.push(f));

const { gsap, ScrollTrigger, CustomEase } = window;
if (!gsap || !ScrollTrigger || !CustomEase) { finishBoot(); return; }
gsap.registerPlugin(ScrollTrigger, CustomEase);
CustomEase.create('beam', 'M0,0 C0.65,0 0.35,1 1,1');
CustomEase.create('lock', 'M0,0 C0.14,0.62 0.2,1.04 0.34,1.02 0.5,0.99 0.64,1 1,1');
CustomEase.create('panel', 'M0,0 C0.2,0.8 0.2,1 1,1');
CustomEase.create('wipe', 'M0,0 C0.7,0 0.2,1 1,1');
const easeBeam = gsap.parseEase('beam'), easeLock = gsap.parseEase('lock');
if (RM) root.classList.add('rm');
if (!signalsOn) root.classList.add('signals-off');

/* restore position after the Motion toggle reloads the page */
if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
let restoreY = 0;
try { restoreY = +(sessionStorage.getItem('pmp-restore') || 0); sessionStorage.removeItem('pmp-restore'); } catch (_) {}

/* ======================= smooth scroll + in-page links ======================= */
let lenis = null;
if (!RM && window.Lenis) {
  lenis = new window.Lenis({ lerp: 0.1, smoothWheel: true, syncTouch: false });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((t) => lenis.raf(t * 1000));
  gsap.ticker.lagSmoothing(0);
}
function goTo(hash) {
  const top = hash === '#source' || hash === '#main';
  const el = top ? null : D.querySelector(hash);
  if (!top && !el) return;
  if (lenis) lenis.scrollTo(top ? 0 : el, { duration: 1.2 });
  else if (top) window.scrollTo({ top: 0, behavior: RM ? 'auto' : 'smooth' });
  else el.scrollIntoView({ behavior: RM ? 'auto' : 'smooth' });
}
D.addEventListener('click', (e) => {
  const a = e.target.closest && e.target.closest('a[href^="#"]');
  if (!a) return;
  const h = a.getAttribute('href');
  if (h.length < 2 || !D.querySelector(h)) return;
  e.preventDefault();
  goTo(h);
  const target = D.querySelector(h);
  if (a.classList.contains('skip') || h === '#source') {
    target.setAttribute('tabindex', '-1');
    target.focus({ preventScroll: true });
  }
  history.replaceState(null, '', h);
});

/* ======================= wave model ======================= */
// Each layer has its own shape, and the legend says so: Interface = smooth sine,
// Services = square request/response, Data = staircase write ramp, Intelligence = AM carrier.
function wave(ch, x) {
  if (ch === 0) return Math.sin(TAU * 3 * x + 0.6);
  if (ch === 1) return clamp(Math.sin(TAU * 6 * x + 0.3) * 7, -1, 1) * 0.8;
  if (ch === 2) { const f = fract(3 * x + 0.05); return Math.floor(f * 6) / 5 * 1.6 - 0.8; }
  const env = 0.55 + 0.45 * Math.sin(TAU * x + 1.3);
  return Math.sin(TAU * 26 * x) * env * 0.85;
}
const sumW = (x, r) => (wave(0, x + r[0]) * 0.95 + wave(1, x + r[1]) * 0.55 + wave(2, x + r[2]) * 0.5 + wave(3, x + r[3]) * 0.4) / 1.75;

/* ======================= hero scope (raw WebGL2, about 6KB) ======================= */
const GLSL_WAVE = `
const float TAU = 6.28318530718;
float wave(int ch, float x){
  if (ch == 0) return sin(TAU*3.0*x + 0.6);
  if (ch == 1) return clamp(sin(TAU*6.0*x + 0.3)*7.0, -1.0, 1.0)*0.8;
  if (ch == 2) { float f = fract(3.0*x + 0.05); return floor(f*6.0)/5.0*1.6 - 0.8; }
  float env = 0.55 + 0.45*sin(TAU*x + 1.3);
  return sin(TAU*26.0*x)*env*0.85;
}`;
const VS_TRACE = `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
layout(location=1) in vec2 aInst;
uniform vec2 uRes; uniform float uN; uniform float uTime; uniform float uSplit; uniform float uNoise;
uniform vec4 uRoll; uniform float uReveal; uniform vec4 uLaneY; uniform float uSumY; uniform float uRawY;
uniform float uAmp; uniform vec3 uProbe; uniform float uHover; uniform float uSigma; uniform float uXS;
uniform float uSweep; uniform float uSweepAmt;
out vec2 vLocal; out float vLen; out vec3 vCol; out float vI;
${GLSL_WAVE}
float hash(float n){ return fract(sin(n)*43758.5453123); }
float laneOf(int c){ return c==0?uLaneY.x : c==1?uLaneY.y : c==2?uLaneY.z : uLaneY.w; }
float rollOf(int c){ return c==0?uRoll.x : c==1?uRoll.y : c==2?uRoll.z : uRoll.w; }
float sumW(float x){ return (wave(0,x+uRoll.x)*0.95 + wave(1,x+uRoll.y)*0.55 + wave(2,x+uRoll.z)*0.5 + wave(3,x+uRoll.w)*0.4)/1.75; }
vec2 P(int ch, float i){
  float x = i/uN; float xs = x*uXS;
  float comp = sumW(xs); float y; float lane;
  if (ch == 4){ y = comp; lane = mix(uRawY, uSumY, uSplit); }
  else { y = mix(comp, wave(ch, xs + rollOf(ch)), uSplit); lane = mix(uRawY, laneOf(ch), uSplit); }
  float amp = mix(uAmp*2.4, uAmp, uSplit);
  y += (hash(i*1.731 + float(ch)*91.7 + floor(uTime*30.0)*7.13) - 0.5) * 2.0 * uNoise;
  float px = x*uRes.x;
  float dx = (px - uProbe.x)/(uRes.x*0.028);
  float dl = (lane - uProbe.y)/(uAmp*1.7);
  y += uProbe.z * exp(-dx*dx) * exp(-dl*dl) * sin(dx*5.0 - uTime*16.0) * 0.5;
  return vec2(px, lane - y*amp);
}
void main(){
  int ch = int(aInst.y + 0.5); float i = aInst.x;
  vec2 p0 = P(ch, i), p1 = P(ch, i + 1.0);
  vec2 d = p1 - p0; float len = length(d);
  vec2 dir = len > 1e-4 ? d/len : vec2(1.0, 0.0);
  vec2 nrm = vec2(-dir.y, dir.x);
  float r = uSigma*3.0;
  vec2 pos = (aCorner.x < 0.5 ? p0 - dir*r : p1 + dir*r) + nrm*r*aCorner.y;
  vLocal = vec2(aCorner.x < 0.5 ? -r : len + r, r*aCorner.y);
  vLen = len;
  vec3 c = ch==0 ? vec3(0.949,0.710,0.239) : ch==1 ? vec3(0.306,0.757,0.737) : ch==2 ? vec3(0.576,0.812,0.388) : ch==3 ? vec3(0.498,0.659,0.961) : vec3(0.925,0.910,0.875);
  vCol = mix(vec3(0.925,0.910,0.875), c, smoothstep(0.0, 0.7, uSplit));
  float x = i/uN;
  float vis = step((i + 1.0)/uN, uReveal + 1e-4);
  float boost = uHover < -0.5 ? 1.0 : (abs(uHover - float(ch)) < 0.5 ? 1.75 : 0.45);
  float overlap = mix(0.34, 1.0, smoothstep(0.0, 0.4, uSplit));
  float sw = 1.0;
  if (uSweep > -0.5) { float ds = uSweep - x; sw += uSweepAmt * step(0.0, ds) * exp(-ds*7.0); }
  vI = vis*boost*overlap*sw;
  vec2 ndc = pos/uRes*2.0 - 1.0;
  gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}`;
const FS_TRACE = `#version 300 es
precision highp float;
in vec2 vLocal; in float vLen; in vec3 vCol; in float vI;
uniform float uCore; uniform float uSigma; uniform float uEnergy; uniform float uHalo;
out vec4 o;
float erf(float x){ float s = sign(x), a = abs(x); x = 1.0 + (0.278393 + (0.230389 + 0.078108*(a*a))*a)*a; x *= x; return s - s/(x*x); }
float beam(float s){
  float L = max(vLen, 0.001); float k = 0.70710678/s;
  float along = (erf((L - vLocal.x)*k) + erf(vLocal.x*k))*0.5;
  return exp(-vLocal.y*vLocal.y/(2.0*s*s))*along/L;
}
void main(){ float I = beam(uCore) + uHalo*beam(uSigma); o = vec4(vCol*I*uEnergy*vI, 1.0); }`;
const VS_QUAD = `#version 300 es
layout(location=0) in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;
const FS_DECAY = `#version 300 es
precision highp float;
uniform sampler2D uPrev; uniform float uDecay; out vec4 o;
void main(){ vec3 c = texelFetch(uPrev, ivec2(gl_FragCoord.xy), 0).rgb; o = vec4(max(c*uDecay - 0.002, 0.0), 1.0); }`;
const FS_COMP = `#version 300 es
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrat; uniform float uGratX; uniform vec3 uHead;
uniform vec3 uProbe; uniform float uProbeVis; uniform float uDpr; uniform vec4 uRect; uniform vec2 uDiv;
uniform float uTrigY; uniform float uTrigVis;
out vec4 o;
float line(float d, float w){ return 1.0 - smoothstep(w*0.5, w*0.5 + 1.0, abs(d)); }
float gridL(float c, float s, float w){ float f = (fract(c/s + 0.5) - 0.5)*s; return line(f, w); }
void main(){
  vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 col = vec3(0.0549, 0.0588, 0.0510);
  vec2 g0 = uRect.xy, g1 = uRect.zw; vec2 gs = (g1 - g0)/uDiv; vec2 q = fc - g0;
  float inside = step(-0.5, q.x)*step(-0.5, q.y)*step(fc.x, g1.x + 0.5)*step(fc.y, g1.y + 0.5);
  float grid = max(gridL(q.x, gs.x, uDpr), gridL(q.y, gs.y, uDpr))*inside;
  vec2 c = g0 + gs*floor(uDiv*0.5 + 0.01);
  float ax = max(line(fc.y - c.y, uDpr), line(fc.x - c.x, uDpr))*inside;
  float tk = max(gridL(q.x, gs.x/5.0, uDpr)*step(abs(fc.y - c.y), 4.0*uDpr), gridL(q.y, gs.y/5.0, uDpr)*step(abs(fc.x - c.x), 4.0*uDpr))*inside;
  float ga = uGrat*clamp((uGratX - fc.x)/(140.0*uDpr), 0.0, 1.0);
  col = mix(col, vec3(0.169, 0.176, 0.157), grid*ga);
  col = mix(col, vec3(0.235, 0.247, 0.220), max(ax, tk)*ga);
  vec3 acc = texelFetch(uAcc, ivec2(gl_FragCoord.xy), 0).rgb;
  vec3 tr = 1.0 - exp(-acc*1.7);
  float m = max(acc.r, max(acc.g, acc.b));
  tr = mix(tr, vec3(1.0, 0.985, 0.955), smoothstep(1.3, 4.0, m)*0.5);
  col += tr;
  float dh = length(fc - uHead.xy);
  col += vec3(1.0, 0.96, 0.9)*uHead.z*(exp(-dh*dh/(2.0*pow(2.6*uDpr, 2.0))) + 0.22*exp(-dh*dh/(2.0*pow(20.0*uDpr, 2.0))));
  float pl = line(fc.x - uProbe.x, uDpr)*step(0.5, fract(fc.y/(7.0*uDpr)));
  col = mix(col, vec3(0.925, 0.910, 0.875), pl*uProbeVis*0.42);
  float tl = line(fc.y - uTrigY, uDpr)*step(0.5, fract(fc.x/(9.0*uDpr)));
  col = mix(col, vec3(0.925, 0.910, 0.875), tl*uTrigVis*0.7);
  o = vec4(col, 1.0);
}`;

function Scope(canvas) {
  const gl = canvas.getContext('webgl2', { antialias: false, alpha: false, depth: false, stencil: false, powerPreference: 'high-performance' });
  if (!gl) return null;
  const floatOK = !!gl.getExtension('EXT_color_buffer_float');
  const mk = (t, s) => { const o = gl.createShader(t); gl.shaderSource(o, s); gl.compileShader(o); if (!gl.getShaderParameter(o, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(o)); return o; };
  const prog = (v, f) => {
    const p = gl.createProgram(); gl.attachShader(p, mk(gl.VERTEX_SHADER, v)); gl.attachShader(p, mk(gl.FRAGMENT_SHADER, f)); gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p));
    const u = {}; return { p, u: (n) => (n in u ? u[n] : (u[n] = gl.getUniformLocation(p, n))) };
  };
  const T = prog(VS_TRACE, FS_TRACE), Dk = prog(VS_QUAD, FS_DECAY), C = prog(VS_QUAD, FS_COMP);
  const quad = gl.createVertexArray(); gl.bindVertexArray(quad);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const tv = gl.createVertexArray(); gl.bindVertexArray(tv);
  gl.bindBuffer(gl.ARRAY_BUFFER, gl.createBuffer()); gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, -1, 0, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0); gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const ib = gl.createBuffer(); let N = 0;
  const setN = (n) => {
    N = n; const a = new Float32Array(n * 5 * 2); let k = 0;
    for (let c = 0; c < 5; c++) for (let i = 0; i < n; i++) { a[k++] = i; a[k++] = c; }
    gl.bindVertexArray(tv); gl.bindBuffer(gl.ARRAY_BUFFER, ib); gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1); gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0); gl.vertexAttribDivisor(1, 1);
  };
  let tg = [], cur = 0, W = 0, Hh = 0;
  const target = (w, h) => {
    const t = gl.createTexture(); gl.bindTexture(gl.TEXTURE_2D, t);
    if (floatOK) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    [[gl.TEXTURE_MIN_FILTER, gl.NEAREST], [gl.TEXTURE_MAG_FILTER, gl.NEAREST], [gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE], [gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE]].forEach(([k, v]) => gl.texParameteri(gl.TEXTURE_2D, k, v));
    const f = gl.createFramebuffer(); gl.bindFramebuffer(gl.FRAMEBUFFER, f); gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.clearColor(0, 0, 0, 1); gl.clear(gl.COLOR_BUFFER_BIT); return { f, t };
  };
  function resize(w, h, n) {
    W = canvas.width = w; Hh = canvas.height = h;
    tg.forEach((x) => { gl.deleteTexture(x.t); gl.deleteFramebuffer(x.f); });
    tg = [target(w, h), target(w, h)]; setN(n);
  }
  function frame(s) {
    const src = tg[cur], dst = tg[1 - cur];
    gl.bindFramebuffer(gl.FRAMEBUFFER, dst.f); gl.viewport(0, 0, W, Hh); gl.disable(gl.BLEND);
    gl.useProgram(Dk.p); gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, src.t); gl.uniform1i(Dk.u('uPrev'), 0); gl.uniform1f(Dk.u('uDecay'), s.decay);
    gl.bindVertexArray(quad); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    gl.enable(gl.BLEND); gl.blendFunc(gl.ONE, gl.ONE);
    gl.useProgram(T.p); const u = T.u;
    gl.uniform2f(u('uRes'), W, Hh); gl.uniform1f(u('uN'), N); gl.uniform1f(u('uTime'), s.time); gl.uniform1f(u('uSplit'), s.split); gl.uniform1f(u('uNoise'), s.noise);
    gl.uniform4f(u('uRoll'), s.roll[0], s.roll[1], s.roll[2], s.roll[3]); gl.uniform1f(u('uReveal'), s.reveal); gl.uniform4f(u('uLaneY'), s.lanes[0], s.lanes[1], s.lanes[2], s.lanes[3]);
    gl.uniform1f(u('uSumY'), s.sumY); gl.uniform1f(u('uRawY'), s.rawY); gl.uniform1f(u('uAmp'), s.amp); gl.uniform3f(u('uProbe'), s.probe[0], s.probe[1], s.probe[2]);
    gl.uniform1f(u('uHover'), s.hover); gl.uniform1f(u('uSigma'), s.sigma); gl.uniform1f(u('uXS'), s.xs); gl.uniform1f(u('uSweep'), s.sweep); gl.uniform1f(u('uSweepAmt'), s.sweepAmt);
    gl.uniform1f(u('uCore'), s.core); gl.uniform1f(u('uEnergy'), s.energy); gl.uniform1f(u('uHalo'), s.halo);
    gl.bindVertexArray(tv); gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, N * 5);
    gl.disable(gl.BLEND);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null); gl.viewport(0, 0, W, Hh);
    gl.useProgram(C.p); const c = C.u; gl.activeTexture(gl.TEXTURE0); gl.bindTexture(gl.TEXTURE_2D, dst.t); gl.uniform1i(c('uAcc'), 0);
    gl.uniform2f(c('uRes'), W, Hh); gl.uniform1f(c('uGrat'), s.grat); gl.uniform1f(c('uGratX'), s.gratX); gl.uniform3f(c('uHead'), s.head[0], s.head[1], s.head[2]);
    gl.uniform3f(c('uProbe'), s.probe[0], s.probe[1], s.probe[2]); gl.uniform1f(c('uProbeVis'), s.probeVis); gl.uniform1f(c('uDpr'), s.dpr);
    gl.uniform4f(c('uRect'), s.rect[0], s.rect[1], s.rect[2], s.rect[3]); gl.uniform2f(c('uDiv'), s.div[0], s.div[1]);
    gl.uniform1f(c('uTrigY'), s.trigY); gl.uniform1f(c('uTrigVis'), s.trigVis);
    gl.bindVertexArray(quad); gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
    cur = 1 - cur;
  }
  return { resize, frame };
}

/* ---------- hero state, layout cache, converge-then-stop loop ---------- */
const hero = $('.hero'), scopeCanvas = $('.scope', hero), nameEl = $('.name', hero), roleEl = $('.role', hero);
const trig = $('.trigger', hero), trigTxt = $('.trig-txt'), trigInd = $('.trig-ind');
const H = { reveal: 1, grat: 1, split: 1, noise: 0.006, roll: [0, 0, 0, 0], speed: [0, 0, 0, 0], head: 0, hover: -1, px: -9999, py: -9999, energy: 0, probeVis: 0, trigLvl: 0, trigVis: 0, locked: true, sweep: -1, sweepAmt: 0 };
const L = { W: 0, H: 0, dpr: 1, N: 720, laneY: [0, 0, 0, 0, 0], laneSp: 60, rect: [0, 0, 0, 0], div: [10, 8], q: 0, bar: 56, m: 64 };
let scope = null;
try { scope = Scope(scopeCanvas); } catch (_) { scope = null; }
let CAP = 0.705;
let heroRaf = 0, lastT = 0, idleFrames = 0, heroVisible = true, bootTL = null, dragging = false, relockT = 0, chipLatched = false;
const ft = [];

function measureCap() {
  try {
    const c = D.createElement('canvas').getContext('2d');
    c.font = '800 200px Archivo';
    const m = c.measureText('H');
    if (m.actualBoundingBoxAscent > 100 && m.actualBoundingBoxAscent < 170) CAP = m.actualBoundingBoxAscent / 200;
  } catch (_) {}
}
function layoutHero() {
  const r = hero.getBoundingClientRect();
  L.W = r.width; L.H = r.height;
  L.dpr = L.q >= 1 ? 1 : Math.min(devicePixelRatio || 1, SMALL() ? 1.5 : 1.75);
  L.N = (SMALL() ? 360 : 720) >> (L.q >= 1 ? 1 : 0);
  L.laneY = $$('.lane', hero).map((el) => { const b = el.getBoundingClientRect(); return b.top + b.height / 2 - r.top; });
  L.laneSp = L.laneY[1] - L.laneY[0];
  L.bar = $('#bar').offsetHeight;
  L.m = clamp(L.W * 0.04, 16, 64);
  // graticule drawn from the name: one division = the name's cap height, baseline on a line
  const fs = parseFloat(getComputedStyle(nameEl).fontSize);
  const w0 = $('.w', nameEl), mk = D.createElement('i');
  mk.style.cssText = 'display:inline-block;width:0;height:0;vertical-align:baseline';
  w0.appendChild(mk); const base = mk.getBoundingClientRect().top - r.top; mk.remove();
  const capH = fs * CAP, portrait = L.H > L.W * 1.05;
  const top0 = L.bar + 1, bot0 = L.H - (portrait ? 58 : 46);
  if (!portrait) {
    const capTop = base - capH;
    let k0 = Math.ceil((top0 - capTop) / capH);
    const k1 = Math.floor((bot0 - capTop) / capH);
    if ((k1 - k0) % 2) k0 += 1;
    L.rect = [L.m, capTop + k0 * capH, L.W - L.m, capTop + k1 * capH];
    L.div = [10, Math.max(2, k1 - k0)];
  } else {
    const d = (bot0 - top0) / 10, off = (((base - top0) % d) + d) % d;
    const rows = Math.floor((bot0 - top0 - off) / d);
    L.rect = [L.m, top0 + off, L.W - L.m, top0 + off + rows * d];
    L.div = [4, rows];
  }
  if (scope) scope.resize(Math.round(L.W * L.dpr), Math.round(L.H * L.dpr), L.N);
  else draw2D();
  placeTrigger();
  wake();
}
function heroUniforms(t, dt) {
  const dpr = L.dpr, W = L.W * dpr, amp = L.laneSp * 0.3 * dpr;
  const rawY = L.H * 0.5 * dpr, xs = clamp(L.W / 1440, 0.42, 1.25);
  const decay = Math.exp(-dt / 0.075);
  const headY = rawY - sumW(H.reveal * xs, H.roll) * amp * 2.4;
  return {
    time: t, split: H.split, noise: H.noise, roll: H.roll, reveal: H.reveal,
    lanes: [L.laneY[0] * dpr, L.laneY[1] * dpr, L.laneY[2] * dpr, L.laneY[3] * dpr], sumY: L.laneY[4] * dpr, rawY, amp,
    probe: [H.px * dpr, H.py * dpr, H.energy], hover: H.hover, sigma: 5.5 * dpr, core: 0.85 * dpr, halo: 0.16, xs,
    sweep: H.sweep, sweepAmt: H.sweepAmt, energy: (W / L.N) * 1.25 * (1 - decay), decay, grat: H.grat,
    gratX: H.grat >= 1 && H.reveal >= 1 ? 1e6 : H.reveal * W + 60 * dpr, head: [H.reveal * W, headY, H.head],
    probeVis: H.probeVis, dpr, rect: L.rect.map((v) => v * dpr), div: L.div,
    trigY: (L.laneY[4] - H.trigLvl * L.laneSp * 0.3) * dpr, trigVis: H.trigVis,
  };
}
function heroBusy() {
  return (bootTL && bootTL.isActive()) || gsap.isTweening(H) || gsap.isTweening(H.roll) || gsap.isTweening(H.speed) ||
    H.energy > 1e-3 || dragging || H.speed[0] !== 0 || H.speed[1] !== 0 || H.speed[2] !== 0 || H.speed[3] !== 0;
}
function wake() {
  idleFrames = 0;
  if (!heroRaf && scope && L.W > 0 && heroVisible && !D.hidden) { lastT = performance.now(); heroRaf = requestAnimationFrame(heroLoop); }
}
function heroLoop(now) {
  heroRaf = 0;
  const raw = now - lastT; lastT = now;
  const dt = clamp(raw / 1000, 1 / 240, 0.05);
  for (let c = 0; c < 4; c++) H.roll[c] += H.speed[c] * dt;
  H.energy *= Math.exp(-dt * 2.6);
  scope.frame(heroUniforms(now / 1000, dt));
  if (booted) adapt(raw);
  idleFrames = heroBusy() ? 0 : idleFrames + 1;
  // converge, then stop: once the persistence buffer has settled the hero costs 0 draws
  if (idleFrames < 36 && heroVisible && !D.hidden) heroRaf = requestAnimationFrame(heroLoop);
}
function adapt(ms) {
  if (L.q >= 2 || ms > 120 || ms <= 0) return;
  ft.push(ms); if (ft.length < 90) return;
  const med = ft.slice().sort((a, b) => a - b)[45]; ft.length = 0;
  if (L.q === 0 && med > 20) { L.q = 1; layoutHero(); }
  else if (L.q === 1 && med > 24) { L.q = 2; H.energy = 0; }
}
function draw2D() { // no WebGL2: a still, locked picture drawn once
  const c = scopeCanvas.getContext('2d'); if (!c) return;
  const d = Math.min(devicePixelRatio || 1, 2); scopeCanvas.width = L.W * d; scopeCanvas.height = L.H * d; c.setTransform(d, 0, 0, d, 0, 0);
  const amp = L.laneSp * 0.3, xs = clamp(L.W / 1440, 0.42, 1.25);
  for (let ch = 0; ch < 5; ch++) {
    c.beginPath();
    for (let x = 0; x <= L.W; x += 2) { const u = x / L.W * xs; const y = L.laneY[ch] - (ch === 4 ? sumW(u, [0, 0, 0, 0]) : wave(ch, u)) * amp; x ? c.lineTo(x, y) : c.moveTo(x, y); }
    c.strokeStyle = CHC[ch]; c.lineWidth = 1.4; c.stroke();
  }
}
new IntersectionObserver(([e]) => { heroVisible = e.isIntersecting; if (heroVisible) wake(); }).observe(hero);
D.addEventListener('visibilitychange', () => { if (!D.hidden) wake(); });

/* ---------- lane chips: hover = probe, focus = probe, tap = toggle ---------- */
const chips = $$('.chip', hero);
function setHover(i) {
  if (H.hover === i) return;
  H.hover = i; chips.forEach((c, k) => c.setAttribute('aria-expanded', String(k === i))); wake();
}
chips.forEach((c, i) => {
  c.addEventListener('click', () => { const on = H.hover !== i || !chipLatched; chipLatched = on; setHover(on ? i : -1); });
  c.addEventListener('focus', () => setHover(i));
  c.addEventListener('blur', () => { chipLatched = false; setHover(-1); });
});
hero.addEventListener('pointermove', (e) => {
  if (e.pointerType !== 'mouse' || !booted) return;
  const r = hero.getBoundingClientRect(), x = e.clientX - r.left, y = e.clientY - r.top;
  const dx = x - H.px, dy = y - H.py; H.px = x; H.py = y;
  if (L.q < 2 && Math.abs(dx) < 400) H.energy = Math.min(1, H.energy + Math.hypot(dx, dy) * 0.0035);
  let near = -1; L.laneY.forEach((ly, k) => { if (Math.abs(y - ly) < L.laneSp * 0.5) near = k; });
  if (!dragging && !chipLatched) setHover(near);
  gsap.to(H, { probeVis: near >= 0 ? 1 : 0.35, duration: 0.25, overwrite: 'auto' });
  wake();
});
hero.addEventListener('pointerleave', (e) => {
  if (e.pointerType !== 'mouse') return;
  if (!chipLatched) setHover(-1);
  gsap.to(H, { probeVis: 0, duration: 0.3, overwrite: 'auto' }); wake();
});

/* ---------- trigger: drag the level off the signal and the whole stack loses lock ---------- */
function placeTrigger() { trig.style.top = (L.laneY[4] - H.trigLvl * L.laneSp * 0.3) + 'px'; }
function setTrig(lvl) {
  H.trigLvl = clamp(lvl, -5, 5); placeTrigger();
  trig.setAttribute('aria-valuenow', String(Math.round(H.trigLvl * 20)));
  const locked = Math.abs(H.trigLvl) < 0.85;
  wake();
  if (locked === H.locked) return;
  H.locked = locked;
  trig.setAttribute('aria-valuetext', locked ? 'Locked' : 'Untriggered');
  trigTxt.textContent = locked ? "TRIG'D" : 'AUTO'; trigInd.classList.toggle('auto', !locked);
  if (!locked) {
    gsap.to(H.speed, { 0: 0.23, 1: -0.37, 2: 0.19, 3: 0.43, duration: 0.35, ease: 'power2.in' });
    gsap.to(H, { noise: 0.04, duration: 0.3 });
  } else {
    gsap.to(H.speed, { 0: 0, 1: 0, 2: 0, 3: 0, duration: 0.25 });
    gsap.to(H.roll, { 0: Math.round(H.roll[0] * 3) / 3, 1: Math.round(H.roll[1] * 6) / 6, 2: Math.round(H.roll[2] * 3) / 3, 3: Math.round(H.roll[3] * 26) / 26, duration: 0.55, ease: 'lock' });
    gsap.to(H, { noise: 0.006, duration: 0.45 });
  }
}
function relockLater() {
  clearTimeout(relockT);
  relockT = setTimeout(() => {
    const o = { v: H.trigLvl };
    gsap.to(o, { v: 0, duration: 0.6, ease: 'lock', onUpdate: () => setTrig(o.v) });
    gsap.to(H, { trigVis: 0, duration: 0.4, delay: 0.4 }); wake();
  }, 1200);
}
trig.addEventListener('pointerdown', (e) => { if (!booted) return; dragging = true; trig.setPointerCapture(e.pointerId); gsap.to(H, { trigVis: 1, duration: 0.2 }); clearTimeout(relockT); wake(); });
trig.addEventListener('pointermove', (e) => { if (!dragging) return; const r = hero.getBoundingClientRect(); setTrig((L.laneY[4] - (e.clientY - r.top)) / (L.laneSp * 0.3)); });
const endDrag = () => { if (!dragging) return; dragging = false; relockLater(); };
trig.addEventListener('pointerup', endDrag); trig.addEventListener('pointercancel', endDrag);
trig.addEventListener('keydown', (e) => {
  const k = { ArrowUp: 0.35, ArrowRight: 0.35, ArrowDown: -0.35, ArrowLeft: -0.35 }[e.key];
  if (k !== undefined) { e.preventDefault(); H.trigVis = 1; setTrig(H.trigLvl + k); relockLater(); }
  if (e.key === 'Home') { e.preventDefault(); setTrig(0); }
});

/* ---------- touch: no hover, so the scope re-sweeps gently (a real scope keeps refreshing) ---------- */
let sweepCall = null;
function idleSweep() {
  if (FINE || RM || !scope) return;
  if (sweepCall) sweepCall.kill();
  sweepCall = gsap.delayedCall(4.2, () => {
    if (signalsOn && heroVisible && !D.hidden && L.q < 2) {
      H.sweep = -0.05; H.sweepAmt = 0.6;
      gsap.to(H, { sweep: 1.15, duration: 2.6, ease: 'none', onComplete: () => { H.sweep = -1; } });
      wake();
    }
    idleSweep();
  });
}

/* ======================= sampled name + loupe ======================= */
const lo = { r: 0 };
const setLoupe = () => nameEl.style.setProperty('--lr', lo.r.toFixed(1) + 'px');
if (FINE && !RM) {
  nameEl.addEventListener('pointerenter', (e) => {
    if (e.pointerType !== 'mouse' || !booted) return;
    nameEl.classList.add('loupe');
    gsap.to(lo, { r: 48, duration: 0.22, ease: 'power3.out', overwrite: true, onUpdate: setLoupe });
  });
  nameEl.addEventListener('pointermove', (e) => {
    const r = nameEl.getBoundingClientRect();
    nameEl.style.setProperty('--lx', (e.clientX - r.left).toFixed(1) + 'px');
    nameEl.style.setProperty('--ly', (e.clientY - r.top).toFixed(1) + 'px');
  });
  nameEl.addEventListener('pointerleave', () => {
    gsap.to(lo, { r: 0, duration: 0.3, ease: 'power2.in', overwrite: true, onUpdate: setLoupe, onComplete: () => nameEl.classList.remove('loupe') });
  });
}

/* ======================= opening: THE LOCK (about 3.0s, skippable) ======================= */
function opening() {
  Object.assign(H, { reveal: 0, grat: 0, split: 0, noise: 0.16, head: 0, probeVis: 0, locked: false });
  H.speed = [0.32, 0.32, 0.32, 0.32];
  trigTxt.textContent = 'AUTO'; trigInd.classList.add('auto');
  root.classList.add('sampling');
  nameEl.style.setProperty('--sw', '0px'); nameEl.style.setProperty('--sp', '24px');
  roleEl.style.setProperty('--rp', '0');
  const chrome = $$('.hero .boot-in, .bar .boot-in');
  gsap.set(chrome, { autoAlpha: 0, x: -10 });
  root.classList.remove('booting');
  const tl = gsap.timeline({ onComplete: done });
  bootTL = tl;
  tl.to(H, { head: 1, duration: 0.15, ease: 'power2.out' }, 0)
    .to(H, { reveal: 1, grat: 1, duration: 0.9, ease: 'beam' }, 0.15)
    .to(H, { head: 0, duration: 0.3, ease: 'power1.out' }, 1.05)
    .call(() => { H.locked = true; trigTxt.textContent = "TRIG'D"; trigInd.classList.remove('auto'); }, null, 1.45)
    .to(H.speed, { 0: 0, 1: 0, 2: 0, 3: 0, duration: 0.18, ease: 'power2.out' }, 1.45)
    .add(() => {
      gsap.to(H.roll, { 0: Math.round(H.roll[0] * 3) / 3, 1: Math.round(H.roll[1] * 6) / 6, 2: Math.round(H.roll[2] * 3) / 3, 3: Math.round(H.roll[3] * 26) / 26, duration: 0.5 / tl.timeScale(), ease: 'lock', delay: 0.18 / tl.timeScale() });
    }, 1.45)
    .to(H, { noise: 0.006, duration: 0.5, ease: 'lock' }, 1.45)
    .to(H, { split: 1, duration: 0.6, ease: 'lock' }, 1.5);
  // sample-and-hold: hard steps, no tweens (sampling is discrete)
  [24, 12, 6, 3].forEach((p, k) => tl.call(() => { nameEl.style.setProperty('--sp', p + 'px'); nameEl.style.setProperty('--sw', '2px'); }, null, 1.72 + k * 0.17));
  tl.call(() => { root.classList.remove('sampling'); nameEl.style.removeProperty('--sp'); nameEl.style.removeProperty('--sw'); }, null, 1.72 + 4 * 0.17);
  tl.to(roleEl, { '--rp': 1, duration: 0.7, ease: 'beam' }, 2.1)
    .to(chrome, { autoAlpha: 1, x: 0, duration: 0.5, ease: 'panel', stagger: 0.035, clearProps: 'transform,visibility' }, 2.45);
  if (SMALL()) tl.timeScale(1.15); // phones: a touch quicker (about 2.6s)
  const evs = ['keydown', 'pointerdown', 'wheel', 'touchstart'];
  const skip = () => { if (tl.progress() < 1) tl.timeScale(9); off(); };
  const off = () => evs.forEach((ev) => removeEventListener(ev, skip, { capture: true }));
  evs.forEach((ev) => addEventListener(ev, skip, { passive: true, capture: true }));
  function done() { off(); bootTL = null; finishBoot(); wake(); }
  wake();
}
function lockedFrame() {
  Object.assign(H, { reveal: 1, grat: 1, split: 1, noise: 0.006, head: 0, locked: true });
  root.classList.remove('booting', 'sampling');
  finishBoot();
  wake();
}

/* ======================= probe cursor (fine pointers, inside instrument screens) ======================= */
const Probe = (() => {
  const el = $('.probe');
  if (!FINE || RM) { el.remove(); return { virtual() {} }; }
  root.classList.add('probe-on');
  const xh = $('.xh', el), read = $('.read', el), brs = $$('.br', el);
  let mx = -100, my = -100, inScreen = false, domT = null, virt = null;
  function to(r, text) {
    const p = 5, pts = [[r.left - p, r.top - p], [r.right + p - 9, r.top - p], [r.left - p, r.bottom + p - 9], [r.right + p - 9, r.bottom + p - 9]];
    brs.forEach((b, i) => gsap.to(b, { x: pts[i][0], y: pts[i][1], opacity: 1, duration: 0.22, ease: 'power3.out', overwrite: true }));
    read.textContent = text;
    gsap.to(read, { x: r.left - p, y: r.bottom + p + 7, duration: 0.22, ease: 'power3.out', overwrite: true });
    el.classList.add('has-read');
  }
  function release() {
    brs.forEach((b) => gsap.to(b, { x: mx - 4, y: my - 4, opacity: 0, duration: 0.18, ease: 'power3.out', overwrite: true }));
    el.classList.remove('has-read');
  }
  addEventListener('pointermove', (e) => {
    if (e.pointerType !== 'mouse') return;
    mx = e.clientX; my = e.clientY;
    xh.style.transform = `translate3d(${mx}px,${my}px,0)`; // 1:1, no easing
    const scr = !!(e.target.closest && e.target.closest('[data-screen]'));
    if (scr !== inScreen) { inScreen = scr; el.classList.toggle('on', scr); }
    if (!inScreen) { if (domT || virt) { domT = null; virt = null; release(); } return; }
    if (virt) return;
    const t = e.target.closest('[data-probe]');
    if (t !== domT) { domT = t; if (t) to(t.getBoundingClientRect(), t.dataset.probe); else release(); }
  }, { passive: true });
  addEventListener('scroll', () => { if (domT && !virt) to(domT.getBoundingClientRect(), domT.dataset.probe); }, { passive: true });
  D.documentElement.addEventListener('pointerleave', () => { inScreen = false; el.classList.remove('on'); });
  return {
    virtual(r, text) {
      if (r) { virt = { r, text }; to(r, text); }
      else if (virt) { virt = null; domT = null; release(); }
    },
  };
})();

/* ======================= record-view nav + top bar ======================= */
const bar = $('#bar'), recWin = $('.rec-win'), recTrack = $('.rec-track'), recItems = $$('.rec-list li');
const secs = ['source', 'signal', 'work', 'experience', 'contact'].map((id) => D.getElementById(id));
const sheetEl = D.getElementById('experience');
function layoutRecord() {
  $$('.tick', recTrack).forEach((t) => t.remove());
  const total = root.scrollHeight;
  secs.forEach((s) => { const t = D.createElement('i'); t.className = 'tick'; t.style.left = (s.offsetTop / total * 100) + '%'; recTrack.appendChild(t); });
  recItems.forEach((li) => { const s = D.querySelector(li.firstElementChild.getAttribute('href')); li.style.left = (s.offsetTop / total * 100) + '%'; });
  updRecord();
}
function updRecord() {
  const total = root.scrollHeight, y = window.scrollY;
  recWin.style.left = (y / total * 100) + '%';
  recWin.style.width = Math.max(2, innerHeight / total * 100) + '%';
  let a = -1;
  recItems.forEach((li, i) => { const s = D.querySelector(li.firstElementChild.getAttribute('href')); if (y + innerHeight * 0.45 >= s.offsetTop) a = i; });
  recItems.forEach((li, i) => li.firstElementChild.setAttribute('aria-current', String(i === a)));
  const hb = sheetEl.getBoundingClientRect(), bh = bar.offsetHeight;
  bar.classList.toggle('light', hb.top <= bh * 0.5 && hb.bottom >= bh * 0.5);
}
addEventListener('scroll', updRecord, { passive: true });

/* hero exit: the screen dims and the copy drifts a little slower than the page (parallax) */
if (!RM) {
  gsap.to(scopeCanvas, { opacity: 0.22, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true } });
  gsap.to('.hero-copy', { y: () => -0.07 * innerHeight, ease: 'none', scrollTrigger: { trigger: hero, start: 'top top', end: 'bottom top', scrub: true, invalidateOnRefresh: true } });
}

/* ======================= 01 statement: scrubbed words + channel underlines ======================= */
$$('[data-split]').forEach((p) => {
  const wrap = (node) => {
    [...node.childNodes].forEach((n) => {
      if (n.nodeType === 3) {
        const frag = D.createDocumentFragment();
        n.textContent.split(/(\s+)/).forEach((tok) => {
          if (!tok) return;
          if (/^\s+$/.test(tok)) frag.appendChild(D.createTextNode(tok));
          else { const s = D.createElement('span'); s.className = 'wd'; s.textContent = tok; frag.appendChild(s); }
        });
        n.replaceWith(frag);
      } else if (n.nodeType === 1) wrap(n);
    });
  };
  wrap(p);
  p.querySelectorAll('.tag').forEach((t) => {
    const sup = D.createElement('sup'); sup.className = 'chref'; sup.setAttribute('aria-hidden', 'true');
    sup.textContent = t.dataset.t; sup.style.setProperty('--c', t.style.getPropertyValue('--c'));
    // a channel mark follows its punctuation, like a footnote: "databases,³" not "databases³ ,"
    const nx = t.nextSibling;
    (nx && nx.nodeType === 1 && nx.classList.contains('wd') && /^[,.;:]/.test(nx.textContent) ? nx : t).after(sup);
    t._sup = sup;
  });
  const words = [...p.querySelectorAll('.wd')];
  if (RM) { words.forEach((w) => { w.style.opacity = 1; }); p.querySelectorAll('.tag,.chref').forEach((t) => t.style.setProperty('--u', 1)); return; }
  const tl = gsap.timeline({ scrollTrigger: { trigger: p, start: 'top 85%', end: () => 'bottom ' + (p.classList.contains('say2') ? '55%' : '45%'), scrub: 0.6 } });
  tl.to(words, { opacity: 1, stagger: 0.08, duration: 0.3, ease: 'none' }, 0);
  p.querySelectorAll('.tag').forEach((t) => {
    const idx = words.indexOf(t.querySelector('.wd'));
    const n = t.querySelectorAll('.wd').length;
    tl.to([t, t._sup], { '--u': 1, duration: Math.max(0.3, n * 0.08), ease: 'none' }, idx * 0.08 + 0.05);
  });
});

/* =========================================================================
   02 THE BENCH
   One data object (data/systems.ts in the real build) drives the 3D board, the SVG board,
   the connection list and the scope, so nothing can drift. Facts: dossier + public README.
   ========================================================================= */
const SYS = {
  part: 'PMP-ACQ-01', name: 'Drone Intelligence System',
  source: 'https://github.com/Prajwalps2603/Drone-Intelligence-System#readme',
  // grid: land = [column (layer), row], port = phone layout [column, row]
  blocks: [
    { id: 'react', ref: 'U101', layer: 0, label: 'React 19 UI', name: 'React 19 dashboard', role: 'Dashboard, AI chat, calculators and live notifications; a useWebSocket hook with auto-reconnect.', tech: 'React 19 · services layer · context', land: [0, 0], port: [0, 0] },
    { id: 'claude', ref: 'J101', layer: 0, ext: true, label: 'Claude Desktop', name: 'Claude Desktop', role: 'External MCP client that calls the drone tools during a conversation.', tech: 'MCP client · not part of the repo', land: [0, 3], port: [2, 0] },
    { id: 'api', ref: 'U201', layer: 1, label: 'FastAPI', name: 'FastAPI backend', role: 'Eight routers: RAG chat, drones, regulations, compliance, flight time, ROI, upload, analytics.', tech: 'FastAPI 0.104 · uvicorn · CORS', land: [1, 0], port: [0, 1] },
    { id: 'ws', ref: 'U202', layer: 1, label: 'WS manager', name: 'WebSocket manager', role: 'Accepts /ws/kpi and broadcasts KPI updates every 3 to 8 s (simulated mission data).', tech: 'FastAPI WebSocket · ConnectionManager', land: [1, 1], port: [1, 0] },
    { id: 'chroma', ref: 'U301', layer: 2, label: 'ChromaDB', name: 'ChromaDB', role: 'Persistent vector store, collection drone_intelligence (74 documents); returns the 5 closest chunks.', tech: 'PersistentClient · SQLite', land: [2, 0], port: [0, 2] },
    { id: 'csv', ref: 'U302', layer: 2, label: 'CSV datasets', name: 'CSV datasets', role: 'Drones, regulations and companies, served by the REST routes.', tech: './data/processed', land: [2, 1], port: [1, 1] },
    { id: 'minilm', ref: 'U401', layer: 3, label: 'MiniLM-L6-v2', name: 'all-MiniLM-L6-v2', role: 'Local embedding model: 384-dim vectors for documents and queries, no API call.', tech: 'sentence-transformers 2.2.2', land: [3, 0], port: [0, 3] },
    { id: 'gemini', ref: 'U402', layer: 3, label: 'Gemini 2.0 Flash', name: 'Gemini 2.0 Flash', role: 'Writes the answer from the top 5 chunks (temperature 0.7, up to 1,500 tokens).', tech: 'google-generativeai', land: [3, 1], port: [1, 3] },
    { id: 'fallback', ref: 'U403', layer: 3, label: 'Context fallback', name: 'Context fallback', role: 'If Gemini fails or the quota is exceeded (HTTP 429), the answer is extracted from the retrieved documents.', tech: 'RAGService · no LLM call', land: [3, 2], port: [1, 4] },
    { id: 'mcp', ref: 'U404', layer: 3, label: 'MCP server', name: 'MCP server', role: 'Separate process over stdio: calculate_flight_time, calculate_roi, check_compliance, select_drone.', tech: 'Model Context Protocol · Python', land: [3, 3], port: [2, 3] },
    { id: 'compose', ref: 'U501', layer: 4, label: 'Docker Compose', name: 'Docker Compose', role: 'Two services: the FastAPI backend (Python 3.10) and the Nginx frontend.', tech: 'docker-compose.yml', land: [4, 0], port: [0, 5] },
    { id: 'nginx', ref: 'U502', layer: 4, label: 'Nginx', name: 'Nginx', role: 'Serves the production frontend as a reverse proxy (port 80 in Docker).', tech: 'Dockerfile.frontend · nginx.conf', land: [4, 1], port: [1, 5] },
  ],
  conns: [
    { id: 'chat', from: 'react', to: 'api', layer: 0, label: 'POST /api/chat/message', proto: 'HTTP · JSON', kind: 'reqres', kindLabel: 'request / response', note: 'The chat page sends { "message": "…" }; the answer comes back with its sources.', land: [], port: [] },
    { id: 'kpi', from: 'ws', to: 'react', layer: 1, label: '/ws/kpi', proto: 'WebSocket', kind: 'push', kindLabel: 'server push, every 3–8 s', note: 'Pushes { "type": "kpi_update", "data": { missions, active_drones, compliance, alerts[] } } every 3–8 s (simulated mission data).', land: [[0.2, 1], [0.2, 0]], port: [] },
    { id: 'query', from: 'api', to: 'chroma', layer: 2, label: 'query · n_results = 5', proto: 'in-process', kind: 'query', kindLabel: 'query, then top 5', note: 'Semantic search over the knowledge base; returns the 5 closest chunks.', land: [], port: [] },
    { id: 'csvr', from: 'api', to: 'csv', layer: 2, label: '/drones · /regulations', proto: 'HTTP · CSV', kind: 'rows', kindLabel: 'request, then rows', note: 'REST routes read the processed CSV datasets.', land: [[0.95, 0], [0.95, 0.7], [1.8, 0.7], [1.8, 1]], port: [] },
    { id: 'embed', from: 'chroma', to: 'minilm', layer: 3, label: 'embed query', proto: 'in-process', kind: 'embed', kindLabel: 'call, then 384-dim vector', note: 'The same local model embeds documents at ingestion and queries at search time.', land: [], port: [] },
    { id: 'gen', from: 'api', to: 'gemini', layer: 3, label: 'generate_content', proto: 'HTTPS · Gemini API', kind: 'gen', kindLabel: 'prompt, then answer', note: 'Prompt = the top 5 chunks + the question; returns { answer, sources[] }.', land: [[1.32, 0], [1.32, 0.42], [2.8, 0.42], [2.8, 1]], port: [[0.3, 1], [0.3, 1.6], [1, 1.6]] },
    { id: 'fb', from: 'api', to: 'fallback', layer: 3, label: 'context-only answer', proto: 'in-process', kind: 'fallback', kindLabel: 'runs only on failure', note: 'Used only when Gemini fails or the quota is exceeded (HTTP 429).', land: [[1.15, 0], [1.15, 0.6], [2.5, 0.6], [2.5, 2]], port: [[-0.62, 1], [-0.62, 4]] },
    { id: 'mcp', from: 'claude', to: 'mcp', layer: 3, label: 'stdio · 4 tools', proto: 'MCP · JSON-RPC', kind: 'stdio', kindLabel: 'tool call, then result', note: 'Claude Desktop calls calculate_flight_time, calculate_roi, check_compliance and select_drone.', land: [], port: [] },
  ],
  // Σ delivery: drawn dashed, not probe-able (deployment, not traffic)
  rails: [
    { from: 'compose', to: 'react', land: [[4, -0.62], [0, -0.62]], port: [[-0.82, 5], [-0.82, 0]] },
    { p0: { land: [1, -0.62], port: [-0.82, 0.85] }, to: 'api', land: [], port: [[0, 0.85]] },
    { from: 'compose', to: 'nginx', land: [], port: [] },
  ],
  probes: ['chat', 'kpi', 'query', 'gen'],
};
const blockById = Object.fromEntries(SYS.blocks.map((b, i) => [b.id, Object.assign(b, { i })]));
const connById = Object.fromEntries(SYS.conns.map((c) => [c.id, c]));
const EXT = { land: [0.39, 0.224], port: [0.43, 0.23] };

/* ---------- route geometry: grid polylines clipped at chip edges, chamfered like copper ---------- */
function gridRoute(item, lay) {
  const ext = EXT[lay], B = blockById[item.to], b = B[lay];
  const A = item.from ? blockById[item.from] : null, a = A ? A[lay] : item.p0[lay];
  const pts = [[a[0], a[1]], ...item[lay].map((p) => [p[0], p[1]]), [b[0], b[1]]];
  const inR = (p, c) => Math.abs(p[0] - c[0]) <= ext[0] + 1e-6 && Math.abs(p[1] - c[1]) <= ext[1] + 1e-6;
  const edge = (p, q, c) => (Math.abs(p[1] - q[1]) < 1e-9 ? [q[0] > p[0] ? c[0] + ext[0] : c[0] - ext[0], p[1]] : [p[0], q[1] > p[1] ? c[1] + ext[1] : c[1] - ext[1]]);
  let i = 0, start = pts[0];
  if (A) { while (i < pts.length - 2 && inR(pts[i + 1], a)) i++; start = edge(pts[i], pts[i + 1], a); }
  let j = pts.length - 1;
  while (j > i + 1 && inR(pts[j - 1], b)) j--;
  const end = edge(pts[j], pts[j - 1], b);
  return [start, ...pts.slice(i + 1, j), end];
}
function chamfer(pts, r) {
  if (pts.length < 3) return pts;
  const out = [pts[0]];
  for (let k = 1; k < pts.length - 1; k++) {
    const p = pts[k], a = pts[k - 1], b = pts[k + 1];
    const la = Math.hypot(p[0] - a[0], p[1] - a[1]), lb = Math.hypot(b[0] - p[0], b[1] - p[1]);
    const rr = Math.min(r, la * 0.45, lb * 0.45);
    if (rr < 1e-6) { out.push(p); continue; }
    out.push([p[0] + (a[0] - p[0]) / la * rr, p[1] + (a[1] - p[1]) / la * rr]);
    out.push([p[0] + (b[0] - p[0]) / lb * rr, p[1] + (b[1] - p[1]) / lb * rr]);
  }
  out.push(pts[pts.length - 1]);
  return out;
}
function poly(pts) {
  const cum = [0];
  for (let k = 1; k < pts.length; k++) cum.push(cum[k - 1] + Math.hypot(pts[k][0] - pts[k - 1][0], pts[k][1] - pts[k - 1][1]));
  let best = 0, bl = -1;
  for (let k = 1; k < pts.length; k++) { const l = cum[k] - cum[k - 1]; if (l > bl) { bl = l; best = k; } }
  const clip = [(pts[best][0] + pts[best - 1][0]) / 2, (pts[best][1] + pts[best - 1][1]) / 2];
  return { pts, cum, len: cum[cum.length - 1], clip };
}
function pointAt(P, s) {
  s = clamp(s, 0, P.len);
  let k = 1; while (k < P.cum.length - 1 && P.cum[k] < s) k++;
  const t = (s - P.cum[k - 1]) / Math.max(1e-9, P.cum[k] - P.cum[k - 1]);
  return [P.pts[k - 1][0] + (P.pts[k][0] - P.pts[k - 1][0]) * t, P.pts[k - 1][1] + (P.pts[k][1] - P.pts[k - 1][1]) * t];
}
function distTo(P, x, y) {
  let d = Infinity;
  for (let k = 1; k < P.pts.length; k++) {
    const a = P.pts[k - 1], b = P.pts[k], vx = b[0] - a[0], vy = b[1] - a[1], l2 = vx * vx + vy * vy;
    const t = l2 ? clamp(((x - a[0]) * vx + (y - a[1]) * vy) / l2, 0, 1) : 0;
    d = Math.min(d, Math.hypot(x - a[0] - vx * t, y - a[1] - vy * t));
  }
  return d;
}

/* ---------- bench state ---------- */
const B = { probes: SYS.probes.slice(), preview: null, gemini: true, acquired: false, visible: false };
const probed = (ch) => (B.preview && B.preview.ch === ch ? B.preview.id : B.probes[ch]);
function requestRoute() {
  const r = [['chat', 1], ['query', 1], ['embed', 1], ['embed', -1], ['query', -1], ['gen', 1]];
  if (B.gemini) r.push(['gen', -1]);
  else r.push(['gen', -1, '429'], ['fb', 1], ['fb', -1]);
  r.push(['chat', -1]);
  return r;
}

/* ---------- traffic shapes for the bench scope (kinds of traffic, never measured data) ---------- */
const pulseF = (u, a, w) => u >= a && u < a + w;
const trainF = (u, a, b, per, duty) => u >= a && u < b && fract((u - a) / per) < duty;
const hash1 = (n) => fract(Math.sin(n * 127.1 + 11.7) * 43758.5453);
const SHAPES = {
  reqres: (u) => (pulseF(u, 0.36, 0.014) || trainF(u, 0.44, 0.55, 0.0105, 0.55) || pulseF(u, 0.7, 0.014) || trainF(u, 0.78, 0.89, 0.0105, 0.55) ? 1 : 0),
  rows: (u) => (pulseF(u, 0.36, 0.014) || trainF(u, 0.42, 0.62, 0.008, 0.5) || pulseF(u, 0.76, 0.014) || trainF(u, 0.82, 0.97, 0.008, 0.5) ? 1 : 0),
  query: (u) => {
    if (pulseF(u, 0.36, 0.014) || pulseF(u, 0.7, 0.014)) return 1;
    for (let k = 0; k < 5; k++) { if (pulseF(u, 0.43 + k * 0.03, 0.012) || pulseF(u, 0.77 + k * 0.03, 0.012)) return [1, 0.86, 0.74, 0.64, 0.56][k]; }
    return 0;
  },
  embed: (u) => {
    if (pulseF(u, 0.36, 0.014) || pulseF(u, 0.72, 0.014)) return 1;
    if ((u >= 0.42 && u < 0.6) || (u >= 0.78 && u < 0.96)) return 0.25 + 0.75 * hash1(Math.floor(u * 420));
    return 0;
  },
  gen: (u, o) => {
    if (trainF(u, 0.34, 0.47, 0.006, 0.6)) return 1;
    if (o.gemini) { if (u >= 0.6 && u < 0.86) return (trainF(u, 0.6, 0.86, 0.009, 0.55) ? 1 : 0) * (0.5 + 0.5 * Math.sin((u - 0.6) / 0.26 * Math.PI)); return 0; }
    return pulseF(u, 0.58, 0.012) ? -0.55 : 0;
  },
  fallback: (u, o) => {
    if (o.gemini) return 0;
    if (pulseF(u, 0.4, 0.012)) return -0.55;
    return trainF(u, 0.48, 0.68, 0.009, 0.55) ? 0.8 : 0;
  },
  stdio: (u) => (pulseF(u, 0.36, 0.012) || pulseF(u, 0.41, 0.03) || pulseF(u, 0.6, 0.012) || pulseF(u, 0.65, 0.03) || pulseF(u, 0.83, 0.012) || pulseF(u, 0.88, 0.03) ? 1 : 0),
  push: (u) => ([0.36, 0.58, 0.83].some((b) => u >= b && u < b + 0.02 && fract((u - b) / 0.0065) < 0.55) ? 1 : 0),
};
const MARKS = { // a few instrument annotations, drawn above the trace
  query: () => [[0.43, 'top 5, ranked']],
  embed: () => [[0.42, '384-dim']],
  gen: (o) => (o.gemini ? [[0.6, 'answer + sources']] : [[0.58, 'HTTP 429']]),
  fallback: (o) => (o.gemini ? [[0.36, 'idle until Gemini fails']] : [[0.48, 'answer from retrieved context']]),
  push: () => [],
};

function createScope2(box) {
  const body = $('.s2-body', box), canvas = $('canvas', body), ctx = canvas.getContext('2d');
  const rowsEl = $('.s2-ch', box), read = $('.s2-read', box);
  rowsEl.innerHTML = [0, 1, 2, 3].map((ch) => `<li style="--c:var(--ch${ch + 1})"><span class="lb"><b>${ch + 1}</b><span class="t"></span><em class="k"></em></span></li>`).join('');
  const lbT = $$('.t', rowsEl), lbK = $$('.k', rowsEl);
  let W = 0, Hh = 0, raf = 0, rolling = false;
  const st = [0, 1, 2, 3].map(() => ({ id: null, prev: null, t0: -1e9, g: true }));
  const bursts = [];
  const opts = { gemini: true };
  function resize() {
    const r = body.getBoundingClientRect(); if (!r.width) return;
    const d = Math.min(devicePixelRatio || 1, 1.5);
    W = r.width; Hh = r.height; canvas.width = Math.round(W * d); canvas.height = Math.round(Hh * d);
    ctx.setTransform(d, 0, 0, d, 0, 0); kick();
  }
  function burstLevel(tau) {
    for (let k = bursts.length - 1; k >= 0; k--) { const dd = tau - bursts[k]; if (dd >= 0 && dd < 0.4) return fract(dd / 0.13) < 0.55 ? 1 : 0; }
    return 0;
  }
  function level(id, u, now) {
    const c = connById[id];
    if (c.kind === 'push' && rolling) return burstLevel(now / 1000 - (1 - u) * 20);
    return SHAPES[c.kind](u, opts);
  }
  function trace(k, id, base, amp, reveal, alpha, now) {
    const col = CHC[k], xm = W * reveal;
    ctx.beginPath();
    for (let x = 0; x <= xm; x += 1.25) { const y = base - level(id, x / W, now) * amp; x ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }
    ctx.strokeStyle = col; ctx.lineJoin = 'round';
    ctx.globalAlpha = alpha * 0.16; ctx.lineWidth = 4; ctx.stroke();
    ctx.globalAlpha = alpha * 0.95; ctx.lineWidth = 1.35; ctx.stroke();
    ctx.globalAlpha = 1;
    if (reveal >= 1 && alpha >= 1) {
      const m = MARKS[connById[id].kind]; if (!m) return;
      ctx.font = '500 9.5px "Martian Mono", ui-monospace, monospace'; ctx.fillStyle = '#85827A'; ctx.textBaseline = 'alphabetic';
      m(opts).forEach(([u, t]) => ctx.fillText(t.toUpperCase(), u * W, base - amp - 6));
    }
  }
  function draw(now) {
    ctx.clearRect(0, 0, W, Hh);
    const rh = Hh / 4;
    ctx.lineWidth = 1;
    for (let i = 1; i < 10; i++) { const x = Math.round(W * i / 10) + 0.5; ctx.strokeStyle = i === 5 ? '#2B2D28' : '#1C1D19'; ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, Hh); ctx.stroke(); }
    for (let k = 0; k < 4; k++) {
      const s = st[k], base = rh * k + rh * 0.82, amp = rh * 0.42;
      if (k) { ctx.strokeStyle = '#2B2D28'; ctx.beginPath(); ctx.moveTo(0, Math.round(rh * k) + 0.5); ctx.lineTo(W, Math.round(rh * k) + 0.5); ctx.stroke(); }
      ctx.strokeStyle = '#26282299'; ctx.setLineDash([2, 4]); ctx.beginPath(); ctx.moveTo(0, base + 0.5); ctx.lineTo(W, base + 0.5); ctx.stroke(); ctx.setLineDash([]);
      const e = now - s.t0;
      const fade = clamp(e / 220, 0, 1), rev = easeBeam(clamp(e / 380, 0, 1)), am = easeLock(clamp(e / 480, 0, 1));
      if (s.prev && fade < 1) trace(k, s.prev, base, amp, 1, 1 - fade, now);
      if (s.id) trace(k, s.id, base, amp * am, rev, 1, now);
    }
  }
  function busy(now) { return st.some((s) => now - s.t0 < 560) || (rolling && st[1].id === 'kpi'); }
  function loop(now) { raf = 0; if (!W) return; draw(now); if (busy(now)) raf = requestAnimationFrame(loop); }
  function kick() { if (!raf) raf = requestAnimationFrame(loop); }
  function setChannel(k, id, instant) {
    const s = st[k];
    if (s.id === id && s.g === opts.gemini) return;
    s.prev = instant ? null : s.id; s.id = id; s.g = opts.gemini; s.t0 = instant || RM ? -1e9 : performance.now();
    const c = connById[id];
    lbT[k].textContent = c.label; lbK[k].textContent = c.kindLabel;
    kick();
  }
  function say(k) {
    const c = connById[probed(k)], f = blockById[c.from], t = blockById[c.to];
    read.innerHTML = `<b>CH${k + 1} · ${c.label}</b> · ${f.name} → ${t.name} · ${c.proto}. ${c.note}`;
  }
  function setRolling(on) {
    if (on === rolling) return;
    rolling = on;
    if (on && !bursts.length) { const t = performance.now() / 1000; [18, 11.6, 7.6, 2.4].forEach((a) => bursts.push(t - a)); }
    kick();
  }
  function push() { bursts.push(performance.now() / 1000); while (bursts.length > 8) bursts.shift(); kick(); }
  function setGemini(on) { opts.gemini = on; st[3].g = !on; }
  function label(k, id) { const c = connById[id]; lbT[k].textContent = c.label; lbK[k].textContent = c.kindLabel; }
  function summary() {
    read.innerHTML = '<b>4 probes clipped</b> · ' + [0, 1, 2, 3].map((k) => `CH${k + 1} ${connById[probed(k)].label}`).join(' · ') + '. Hover a connection to preview a probe; click to clip it.';
  }
  new ResizeObserver(resize).observe(body);
  return { setChannel, say, label, summary, setRolling, push, setGemini, kick, resize };
}

/* ---------- connection list (keyboard and touch path to every probe) ---------- */
const benchSec = $('#work'), boardEl = $('.board', benchSec), panel = $('.panel', benchSec);
const listEl = $('.conns', benchSec), wiBtn = $('.wi-btn', benchSec), wiNote = $('.wi-note', benchSec);
const NOTE_OK = 'Normal path: the top 5 chunks and the question go to Gemini 2.0 Flash, which answers with sources.';
const NOTE_FAIL = 'Gemini returns HTTP 429, so the RAG service answers from the top 5 retrieved chunks instead, with no LLM call. That fallback is documented in the README. Watch the request re-route on the board.';
listEl.innerHTML = SYS.conns.map((c) => `<li><button type="button" data-id="${c.id}" aria-pressed="false" style="--c:${CHC[c.layer]}"><span class="k">CH${c.layer + 1}</span><span class="cl">${c.label}<span class="pin">probed</span></span><span class="cf">${blockById[c.from].label} → ${blockById[c.to].label}</span></button></li>`).join('');
const listBtns = $$('button', listEl);
$$('.pin', listEl).forEach((p) => p.setAttribute('aria-hidden', 'true'));
let view = null, scope2 = null, previewT = 0;
function syncList() {
  listBtns.forEach((b) => {
    const c = connById[b.dataset.id];
    b.setAttribute('aria-pressed', String(B.probes[c.layer] === c.id));
    b.classList.toggle('pv', !!(B.preview && B.preview.id === c.id));
  });
}
function sync(chs) {
  chs.forEach((ch) => { if (ch != null && scope2) scope2.setChannel(ch, probed(ch)); });
  if (view) view.update();
  syncList();
}
function preview(id) {
  clearTimeout(previewT);
  const c = connById[id]; if (!c) return;
  if (B.preview && B.preview.id === id) return;
  const prevCh = B.preview ? B.preview.ch : null;
  B.preview = { ch: c.layer, id };
  sync([prevCh, c.layer]);
  if (scope2) scope2.say(c.layer);
}
function endPreview(delay = 320) {
  clearTimeout(previewT);
  previewT = setTimeout(() => {
    if (!B.preview) return;
    const ch = B.preview.ch; B.preview = null; sync([ch]);
    if (scope2) scope2.say(ch);
  }, delay);
}
function pin(id) {
  clearTimeout(previewT);
  const c = connById[id]; const prevCh = B.preview ? B.preview.ch : null;
  B.preview = null; B.probes[c.layer] = id;
  sync([prevCh, c.layer]);
  if (scope2) scope2.say(c.layer);
}
listBtns.forEach((b) => {
  b.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse') preview(b.dataset.id); });
  b.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') endPreview(); });
  b.addEventListener('focus', () => preview(b.dataset.id));
  b.addEventListener('blur', () => endPreview(120));
  b.addEventListener('click', () => pin(b.dataset.id));
});
syncList();
wiBtn.addEventListener('click', () => {
  B.gemini = !B.gemini;
  wiBtn.setAttribute('aria-pressed', String(!B.gemini));
  if (!B.gemini && B.probes[3] === 'gen') B.probes[3] = 'fb';
  else if (B.gemini && B.probes[3] === 'fb') B.probes[3] = 'gen';
  wiNote.textContent = B.gemini ? NOTE_OK : NOTE_FAIL;
  if (scope2) { scope2.setGemini(B.gemini); scope2.say(3); }
  if (view) view.setGemini(B.gemini);
  sync([2, 3]);
  if (B.acquired && view && !RM) view.pulse(requestRoute());
});

/* ---------- 3D board (three.js, lazy): a single-layer circuit board generated from SYS ---------- */
async function createBoard3D(el) {
  const [THREE, mLS, mLG, mLM, mRB, mBU] = await Promise.all([
    import('three'),
    import('three/addons/lines/LineSegments2.js'),
    import('three/addons/lines/LineSegmentsGeometry.js'),
    import('three/addons/lines/LineMaterial.js'),
    import('three/addons/geometries/RoundedBoxGeometry.js'),
    import('three/addons/utils/BufferGeometryUtils.js'),
  ]);
  const { LineSegments2 } = mLS, { LineSegmentsGeometry } = mLG, { LineMaterial } = mLM, { RoundedBoxGeometry } = mRB, { mergeGeometries } = mBU;
  try { await Promise.all([D.fonts.load('600 32px Archivo'), D.fonts.load('600 20px "Martian Mono"'), D.fonts.load('500 20px "Martian Mono"')]); } catch (_) {}
  const canvas = $('.board-gl', el), tip = $('.tip', el), tag = $('.tag429', el);
  let renderer;
  try { renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' }); }
  catch (_) { return null; }
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;

  const COL = 2.0, ROW = 1.25, Z0 = -1.5, BW = 10.4, BD = 6.3, CW = 1.56, CD = 0.56, CHT = 0.14, TRY = 0.012;
  const gx = (c) => (c - 2) * COL, gz = (r) => Z0 + r * ROW;
  const W3 = {}; // world polylines (x, z)
  SYS.conns.forEach((c) => { W3[c.id] = poly(chamfer(gridRoute(c, 'land').map(([a, b]) => [gx(a), gz(b)]), 0.13)); });
  const RAILS = SYS.rails.map((r) => poly(chamfer(gridRoute(r, 'land').map(([a, b]) => [gx(a), gz(b)]), 0.13)));

  /* silkscreen + chip tops: one CanvasTexture per system, drawn once per acquisition */
  const TW = 2048, TH = Math.round(TW * BD / BW), S = TW / BW;
  const tx = (x) => (x + BW / 2) * S, tz = (z) => (z + BD / 2) * S;
  const cv = D.createElement('canvas'); cv.width = TW; cv.height = TH;
  const c = cv.getContext('2d');
  const font = (w, px, fam, stretch) => { c.font = `${w} ${px}px ${fam}`; try { c.fontStretch = stretch || 'normal'; } catch (_) {} };
  c.fillStyle = '#161713'; c.fillRect(0, 0, TW, TH);
  c.fillStyle = '#23251F';
  for (let x = 0.2 * S; x < TW; x += 0.25 * S) for (let y = 0.2 * S; y < TH; y += 0.25 * S) c.fillRect(x - 1.5, y - 1.5, 3, 3);
  c.strokeStyle = '#33352E'; c.lineWidth = 3; c.strokeRect(0.1 * S, 0.1 * S, TW - 0.2 * S, TH - 0.2 * S);
  [[-4.98, -2.97], [4.98, -2.97], [-4.98, 2.97], [4.98, 2.97]].forEach(([x, z]) => { c.beginPath(); c.arc(tx(x), tz(z), 0.075 * S, 0, TAU); c.strokeStyle = '#4A4B44'; c.lineWidth = 5; c.stroke(); });
  c.setLineDash([10, 12]); c.strokeStyle = '#25272099'; c.lineWidth = 2;
  [-3, -1, 1, 3].forEach((x) => { c.beginPath(); c.moveTo(tx(x), tz(-2.62)); c.lineTo(tx(x), tz(2.62)); c.stroke(); });
  c.setLineDash([]);
  const heads = ['Interface', 'Services', 'Data', 'Intelligence', 'Delivery'];
  heads.forEach((h, k) => {
    const x0 = tx(gx(k) - CW / 2), y0 = tz(-2.84);
    c.fillStyle = CHC[k]; c.fillRect(x0, y0 - 32, 36, 36);
    font(700, 24, '"Martian Mono"', 'semi-condensed'); c.fillStyle = '#0E0F0D'; c.textAlign = 'center'; c.fillText(k < 4 ? String(k + 1) : 'Σ', x0 + 18, y0 - 5);
    font(600, 29, '"Martian Mono"', 'semi-condensed'); c.fillStyle = '#B9B5AA'; c.textAlign = 'left'; c.fillText(h.toUpperCase(), x0 + 50, y0 - 5);
  });
  font(500, 21, '"Martian Mono"', 'semi-condensed'); c.fillStyle = '#77746C'; c.textAlign = 'left';
  c.fillText('Σ  DOCKER COMPOSE UP  ·  BACKEND :8000  +  FRONTEND (NGINX) :80', tx(-4.75), tz(-2.4));
  c.setLineDash([12, 10]); c.strokeStyle = '#3A3C36'; c.lineWidth = 2;
  c.strokeRect(tx(-4.95), tz(gz(3) - 0.5), tx(2.95) - tx(-4.95), 1.0 * S);
  c.setLineDash([]);
  c.fillStyle = '#77746C'; c.textAlign = 'center';
  c.fillText('SEPARATE PROCESS  ·  STDIO', (tx(gx(0) + CW / 2) + tx(gx(3) - CW / 2)) / 2, tz(gz(3) - 0.13));
  c.textAlign = 'left';
  font(500, 21, '"Martian Mono"', 'semi-condensed'); c.fillStyle = '#85827A';
  c.fillText('PMP-ACQ-01  ·  DRONE INTELLIGENCE SYSTEM  ·  WIRED AS DOCUMENTED IN THE PUBLIC README', tx(-4.75), tz(2.98));
  // chips: shadows, leads, bodies (the chip tops sample this same texture), labels, refdes
  SYS.blocks.forEach((b) => {
    const x = gx(b.land[0]), z = gz(b.land[1]), x0 = tx(x - CW / 2), z0 = tz(z - CD / 2), w = CW * S, h = CD * S;
    c.save(); c.shadowColor = 'rgba(0,0,0,0.75)'; c.shadowBlur = 26; c.shadowOffsetY = 14; c.fillStyle = '#0B0C0A'; c.fillRect(x0, z0, w, h); c.restore();
    c.fillStyle = '#4A4B44';
    for (let k = 0; k < 7; k++) { const lx = x0 + w * 0.09 + k * (w * 0.82 / 6) - 6; c.fillRect(lx, z0 - 12, 12, 14); c.fillRect(lx, z0 + h - 2, 12, 14); }
    c.fillStyle = '#1D1E1A'; c.fillRect(x0, z0, w, h);
    const col = CHC[b.layer];
    c.strokeStyle = col; c.lineWidth = 3.2;
    if (b.ext) c.setLineDash([12, 8]);
    c.strokeRect(x0 + 8, z0 + 8, w - 16, h - 16); c.setLineDash([]);
    c.beginPath(); c.arc(x0 + 22, z0 + 22, 4.5, 0, TAU); c.fillStyle = col; c.fill();
    let px = 33; font(600, px, 'Archivo', 'semi-condensed');
    while (c.measureText(b.label).width > w - 54 && px > 20) { px -= 1; font(600, px, 'Archivo', 'semi-condensed'); }
    c.fillStyle = '#ECE8DF'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(b.label, x0 + w / 2 + 6, z0 + h / 2 + 1);
    c.textBaseline = 'alphabetic'; c.textAlign = 'left';
    font(500, 20, '"Martian Mono"', 'semi-condensed'); c.fillStyle = '#77746C'; c.fillText(b.ref + (b.ext ? '  EXT' : ''), x0, z0 - 20);
  });
  // pads where copper meets a chip
  c.fillStyle = '#5A5B53';
  SYS.conns.forEach((cn) => { const P = W3[cn.id]; [P.pts[0], P.pts[P.pts.length - 1]].forEach(([x, z]) => c.fillRect(tx(x) - 9, tz(z) - 9, 18, 18)); });
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = Math.min(8, renderer.capabilities.getMaxAnisotropy());

  /* board slab + chips: one merged geometry, one draw call; per-chip state lives in a uniform array */
  const NB = SYS.blocks.length;
  const geos = [];
  const prep = (g, idx, cx, cy, cz) => {
    g = g.toNonIndexed ? g : g;
    const pos = g.attributes.position, nrm = g.attributes.normal, n = pos.count;
    const uv = new Float32Array(n * 2), top = new Float32Array(n), id = new Float32Array(n), ctr = new Float32Array(n * 3);
    for (let k = 0; k < n; k++) {
      const x = pos.getX(k), z = pos.getZ(k);
      uv[k * 2] = (x + BW / 2) / BW; uv[k * 2 + 1] = 1 - (z + BD / 2) / BD;
      top[k] = nrm.getY(k) > 0.9 ? 1 : 0; id[k] = idx; ctr[k * 3] = cx; ctr[k * 3 + 1] = cy; ctr[k * 3 + 2] = cz;
    }
    g.setAttribute('uv', new THREE.BufferAttribute(uv, 2)); g.setAttribute('aTop', new THREE.BufferAttribute(top, 1));
    g.setAttribute('aIdx', new THREE.BufferAttribute(id, 1)); g.setAttribute('aCenter', new THREE.BufferAttribute(ctr, 3));
    return g;
  };
  const slab = new RoundedBoxGeometry(BW, 0.18, BD, 2, 0.05); slab.translate(0, -0.09, 0);
  geos.push(prep(slab, NB, 0, -0.09, 0));
  SYS.blocks.forEach((b, i) => { const g = new RoundedBoxGeometry(CW, CHT, CD, 2, 0.025); const x = gx(b.land[0]), z = gz(b.land[1]); g.translate(x, CHT / 2 + 0.002, z); geos.push(prep(g, i, x, CHT / 2, z)); });
  const merged = mergeGeometries(geos, false);
  const uS = []; for (let i = 0; i <= NB; i++) uS.push(new THREE.Vector4(0, 0, 0, i === NB ? 1 : 0));
  const boardMat = new THREE.ShaderMaterial({
    uniforms: { uMap: { value: tex }, uS: { value: uS }, uSide: { value: new THREE.Color('#1C1D19') }, uEdge: { value: new THREE.Color('#0C0D0B') } },
    vertexShader: `
      attribute float aIdx; attribute float aTop; attribute vec3 aCenter;
      uniform vec4 uS[${NB + 1}];
      varying vec2 vUv; varying float vTop; varying vec3 vN; varying vec4 vS; varying float vBoard;
      void main(){
        int i = int(aIdx + 0.5); vec4 s = uS[i];
        vec3 p = aCenter + (position - aCenter) * max(s.w, 0.0001);
        p.y += s.x + (1.0 - s.w) * 0.55;
        vUv = uv; vTop = aTop; vN = normal; vS = s; vBoard = i == ${NB} ? 1.0 : 0.0;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
      }`,
    fragmentShader: `
      uniform sampler2D uMap; uniform vec3 uSide; uniform vec3 uEdge;
      varying vec2 vUv; varying float vTop; varying vec3 vN; varying vec4 vS; varying float vBoard;
      void main(){
        vec3 col;
        if (vTop > 0.5) col = texture2D(uMap, vUv).rgb;
        else { float sh = 0.5 + 0.38*clamp(vN.z, 0.0, 1.0) + 0.14*abs(vN.x); col = mix(uSide, uEdge, vBoard) * sh; }
        col *= 1.0 - 0.55*vS.z;
        col += vec3(0.93, 0.91, 0.86) * vS.y * 0.16 * (0.4 + 0.6*vTop);
        gl_FragColor = vec4(col, 1.0);
        #include <colorspace_fragment>
      }`,
  });
  const scene = new THREE.Scene();
  const group = new THREE.Group(); scene.add(group);
  group.add(new THREE.Mesh(merged, boardMat));
  scene.add(new THREE.HemisphereLight(0xf4f1ea, 0x1a1b17, 2.2));
  const dl = new THREE.DirectionalLight(0xffffff, 1.6); dl.position.set(-3, 8, 6); scene.add(dl);

  /* copper: one batch for every trace, one for the probed ones; constant-speed draw-in via dashes */
  const tint = (hex, k) => new THREE.Color(hex).lerp(new THREE.Color('#161713'), k);
  function segs(items) {
    const pos = [], col = [], dist = [];
    items.forEach(({ P, color }) => {
      for (let k = 1; k < P.pts.length; k++) {
        const a = P.pts[k - 1], b = P.pts[k];
        pos.push(a[0], TRY, a[1], b[0], TRY, b[1]);
        col.push(color.r, color.g, color.b, color.r, color.g, color.b);
        dist.push(P.cum[k - 1], P.cum[k]);
      }
    });
    const g = new LineSegmentsGeometry();
    if (!pos.length) { pos.push(0, -5, 0, 0, -5, 0); col.push(0, 0, 0, 0, 0, 0); dist.push(0, 0); }
    g.setPositions(pos); g.setColors(col);
    const ib = new THREE.InstancedInterleavedBuffer(new Float32Array(dist), 2, 1);
    g.setAttribute('instanceDistanceStart', new THREE.InterleavedBufferAttribute(ib, 1, 0));
    g.setAttribute('instanceDistanceEnd', new THREE.InterleavedBufferAttribute(ib, 1, 1));
    return g;
  }
  const lineMat = (w) => new LineMaterial({ color: 0xffffff, linewidth: w, vertexColors: true, dashed: true, dashSize: 0, gapSize: 1e4, dashScale: 1 });
  const matIdle = lineMat(1.7), matAct = lineMat(2.6);
  const idle = new LineSegments2(segs([]), matIdle), act = new LineSegments2(segs([]), matAct);
  act.renderOrder = 2; group.add(idle, act);
  const railMat = new LineMaterial({ color: 0x8C897F, linewidth: 1.25, dashed: true, dashSize: 0.1, gapSize: 0.075, dashScale: 1, transparent: true, opacity: 0 });
  const railGeo = new LineSegmentsGeometry();
  { const pos = [], dist = []; RAILS.forEach((P) => { for (let k = 1; k < P.pts.length; k++) { const a = P.pts[k - 1], b = P.pts[k]; pos.push(a[0], TRY, a[1], b[0], TRY, b[1]); dist.push(P.cum[k - 1], P.cum[k]); } });
    railGeo.setPositions(pos); const ib = new THREE.InstancedInterleavedBuffer(new Float32Array(dist), 2, 1);
    railGeo.setAttribute('instanceDistanceStart', new THREE.InterleavedBufferAttribute(ib, 1, 0)); railGeo.setAttribute('instanceDistanceEnd', new THREE.InterleavedBufferAttribute(ib, 1, 1)); }
  group.add(new LineSegments2(railGeo, railMat));
  const draw = { p: 0 };
  const setDraw = (p) => { draw.p = p; matIdle.dashSize = p; matAct.dashSize = p; };

  /* probes: four grabber clips in the channel colours, each with a DOM badge that matches its scope row */
  const probeMat = new THREE.MeshLambertMaterial({ vertexColors: true });
  function colorize(g, hex) { const col = new THREE.Color(hex), n = g.attributes.position.count, a = new Float32Array(n * 3); for (let k = 0; k < n; k++) { a[k * 3] = col.r; a[k * 3 + 1] = col.g; a[k * 3 + 2] = col.b; } g.setAttribute('color', new THREE.BufferAttribute(a, 3)); g.deleteAttribute('uv'); return g.toNonIndexed(); }
  function grabber(ch) {
    const dark = '#' + new THREE.Color(CHC[ch]).lerp(new THREE.Color('#0E0F0D'), 0.55).getHexString();
    const body = colorize(new THREE.CylinderGeometry(0.068, 0.082, 0.34, 16, 1), CHC[ch]); body.translate(0, 0.27, 0);
    const cap = colorize(new THREE.SphereGeometry(0.068, 16, 8, 0, TAU, 0, Math.PI / 2), CHC[ch]); cap.translate(0, 0.44, 0);
    const collar = colorize(new THREE.CylinderGeometry(0.092, 0.092, 0.06, 16, 1), dark); collar.translate(0, 0.1, 0);
    const hook = colorize(new THREE.CylinderGeometry(0.017, 0.017, 0.1, 6, 1), '#ECE8DF'); hook.translate(0, 0.04, 0);
    return mergeGeometries([body, cap, collar, hook], false);
  }
  const probeMesh = [0, 1, 2, 3].map((ch) => { const m = new THREE.Mesh(grabber(ch), probeMat); m.visible = false; m.renderOrder = 3; group.add(m); return m; });
  const badges = [0, 1, 2, 3].map((ch) => { const b = D.createElement('span'); b.className = 'pbadge'; b.style.setProperty('--c', CHC[ch]); b.textContent = String(ch + 1); b.setAttribute('aria-hidden', 'true'); el.appendChild(b); return b; });
  const clipNow = [0, 1, 2, 3].map(() => [0, 0]);
  const lift = [0, 0, 0, 0];
  const clipTo = [null, null, null, null];
  function buildProbe(ch) { const m = probeMesh[ch]; m.position.set(clipNow[ch][0], TRY + lift[ch], clipNow[ch][1]); }
  function hop(ch, from, to, dur, h) {
    const o = { t: 0 };
    gsap.to(o, { t: 1, duration: dur, ease: 'power3.out', overwrite: 'auto', onUpdate: () => {
      clipNow[ch] = [from[0] + (to[0] - from[0]) * o.t, from[1] + (to[1] - from[1]) * o.t];
      lift[ch] = Math.sin(Math.PI * Math.min(1, o.t * 1.15)) * h; buildProbe(ch); invalidate();
    }, onComplete: () => { lift[ch] = 0; buildProbe(ch); invalidate(); } });
  }

  /* request pulses: bone dots that travel the copper at constant speed (signals don't ease) */
  const spr = D.createElement('canvas'); spr.width = spr.height = 64;
  { const g = spr.getContext('2d'), gr = g.createRadialGradient(32, 32, 0, 32, 32, 32); gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.22, 'rgba(255,250,240,0.9)'); gr.addColorStop(1, 'rgba(255,245,230,0)'); g.fillStyle = gr; g.fillRect(0, 0, 64, 64); }
  const ptsGeo = new THREE.BufferGeometry(); ptsGeo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(12), 3)); ptsGeo.setDrawRange(0, 0);
  const ptsMat = new THREE.PointsMaterial({ size: 17, sizeAttenuation: false, map: new THREE.CanvasTexture(spr), transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, color: 0xffffff });
  const dots = new THREE.Points(ptsGeo, ptsMat); dots.renderOrder = 5; dots.frustumCulled = false; group.add(dots);
  const pulses = [];
  const SPEED = 6.2;

  /* camera: orthographic 3/4 view, 35° tilt, damped pointer tilt of ±4° */
  const camera = new THREE.OrthographicCamera(-5, 5, 3, -3, 0.1, 100);
  const TILT = 35 * Math.PI / 180, dir = new THREE.Vector3(0, Math.cos(TILT), Math.sin(TILT)), upS = new THREE.Vector3(0, Math.sin(TILT), -Math.cos(TILT));
  let k2px = 0.01, cw = 0, chh = 0;
  const tilt = { x: 0, y: 0 };
  const qx = gsap.quickTo(tilt, 'x', { duration: 0.6, ease: 'power3.out', onUpdate: () => invalidate() });
  const qy = gsap.quickTo(tilt, 'y', { duration: 0.6, ease: 'power3.out', onUpdate: () => invalidate() });
  function fit() {
    const r = el.getBoundingClientRect(); cw = r.width; chh = r.height; if (!cw || !chh) return;
    renderer.setPixelRatio(Math.min(devicePixelRatio || 1, innerWidth >= 1100 ? 1.75 : 1.25));
    renderer.setSize(cw, chh, false);
    const head = 46, foot = 14, availH = chh - head - foot;
    k2px = Math.max((BW + 0.45) / cw, (BD * Math.cos(TILT) + 0.55) / availH);
    const hw = cw * k2px / 2, hh = chh * k2px / 2;
    Object.assign(camera, { left: -hw, right: hw, top: hh, bottom: -hh });
    const T = new THREE.Vector3(0, 0, 0).addScaledVector(upS, (head - foot) / 2 * k2px);
    camera.position.copy(T).addScaledVector(dir, 20); camera.up.set(0, 1, 0); camera.lookAt(T);
    camera.updateProjectionMatrix();
    [matIdle, matAct, railMat].forEach((m) => m.resolution.set(cw, chh));
    invalidate();
  }

  /* render on demand */
  let rafR = 0, busyUntil = 0;
  function invalidate() { if (!rafR) rafR = requestAnimationFrame(frame); }
  function kick(ms) { busyUntil = Math.max(busyUntil, performance.now() + ms); invalidate(); }
  const v3 = new THREE.Vector3();
  function project(x, y, z) { v3.set(x, y, z).applyMatrix4(group.matrixWorld).project(camera); return [(v3.x * 0.5 + 0.5) * cw, (-v3.y * 0.5 + 0.5) * chh]; }
  function frame(now) {
    rafR = 0;
    group.rotation.set(tilt.y * 0.035, tilt.x * 0.07, 0);
    stepPulses(now);
    renderer.render(scene, camera);
    overlays();
    if (now < busyUntil || pulses.length) invalidate();
  }
  function stepPulses(now) {
    const arr = ptsGeo.attributes.position.array;
    for (let k = pulses.length - 1; k >= 0; k--) {
      const p = pulses[k]; const dt = Math.min(0.05, (now - p.last) / 1000); p.last = now;
      p.s += SPEED * dt;
      let hop = p.hops[p.i];
      while (hop && p.s >= hop.P.len) { p.s -= hop.P.len; flash(hop.end, hop.flag); p.i++; hop = p.hops[p.i]; }
      if (!hop) { pulses.splice(k, 1); continue; }
      p.pt = pointAt(hop.P, hop.dir > 0 ? p.s : hop.P.len - p.s);
    }
    pulses.forEach((p, k) => { arr[k * 3] = p.pt[0]; arr[k * 3 + 1] = 0.05; arr[k * 3 + 2] = p.pt[1]; });
    ptsGeo.attributes.position.needsUpdate = true; ptsGeo.setDrawRange(0, Math.min(4, pulses.length));
  }
  function flash(id, flag) {
    const b = blockById[id]; if (!b) return;
    gsap.fromTo(uS[b.i], { y: 1 }, { y: hoverId === id ? 0.55 : 0, duration: 0.55, ease: 'power2.out', overwrite: 'auto', onUpdate: invalidate });
    if (flag === '429') { tag.classList.remove('bump'); void tag.offsetWidth; tag.classList.add('bump'); }
  }

  /* overlays: chip info and the 429 tag stay DOM (crisp, selectable, translatable) */
  let hoverId = null, hoverConn = null, tipPinned = false;
  function chipRect(b) {
    const x = gx(b.land[0]), z = gz(b.land[1]);
    const ps = [[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([sx, sz]) => project(x + sx * CW / 2, CHT, z + sz * CD / 2));
    return { l: Math.min(...ps.map((p) => p[0])), r: Math.max(...ps.map((p) => p[0])), t: Math.min(...ps.map((p) => p[1])), b: Math.max(...ps.map((p) => p[1])) };
  }
  function overlays() {
    if (hoverId) {
      const b = blockById[hoverId], rc = chipRect(b), w = tip.offsetWidth || 240;
      const x = clamp((rc.l + rc.r) / 2, w / 2 + 8, cw - w / 2 - 8);
      const below = rc.t < 150;
      tip.style.transform = `translate(${x}px, ${below ? rc.b + 10 : rc.t - 10}px) translate(-50%, ${below ? '0' : '-100%'})`;
    }
    const g = blockById.gemini, rg = chipRect(g);
    tag.style.left = (rg.r - 6) + 'px'; tag.style.top = (rg.t - 2) + 'px';
    probeMesh.forEach((m, ch) => {
      const b = badges[ch];
      if (!m.visible) { b.style.opacity = '0'; return; }
      const [x, y] = project(m.position.x, m.position.y + 0.52, m.position.z);
      b.style.opacity = '1'; b.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px) translate(-50%, -100%)`;
    });
  }
  function showTip(id) {
    const b = blockById[id];
    tip.style.setProperty('--tc', CHC[b.layer]);
    $('.tip-ref', tip).textContent = `${b.ref} · ${b.layer < 4 ? 'CH' + (b.layer + 1) : 'Σ'} ${['Interface', 'Services', 'Data', 'Intelligence', 'Delivery'][b.layer]}`;
    $('.tip-name', tip).textContent = b.name; $('.tip-role', tip).textContent = b.role; $('.tip-tech', tip).textContent = b.tech;
    tip.classList.add('on');
  }
  function setHoverChip(id) {
    if (hoverId === id) return;
    if (hoverId) gsap.to(uS[blockById[hoverId].i], { y: 0, duration: 0.25, overwrite: 'auto', onUpdate: invalidate });
    hoverId = id;
    if (id) { showTip(id); gsap.to(uS[blockById[id].i], { y: 0.55, duration: 0.2, overwrite: 'auto', onUpdate: invalidate }); }
    else tip.classList.remove('on');
    invalidate();
  }

  /* picking: ray onto the board plane, then exact tests in board space */
  const ray = new THREE.Raycaster(), ndc = new THREE.Vector2(), inv = new THREE.Matrix4();
  const planeTop = new THREE.Plane(new THREE.Vector3(0, 1, 0), -CHT), plane0 = new THREE.Plane(new THREE.Vector3(0, 1, 0), -TRY), hitP = new THREE.Vector3();
  function pick(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    ndc.set((clientX - r.left) / r.width * 2 - 1, -((clientY - r.top) / r.height * 2 - 1));
    ray.setFromCamera(ndc, camera);
    inv.copy(group.matrixWorld).invert();
    const lr = ray.ray.clone().applyMatrix4(inv);
    if (lr.intersectPlane(planeTop, hitP)) {
      for (const b of SYS.blocks) if (Math.abs(hitP.x - gx(b.land[0])) <= CW / 2 && Math.abs(hitP.z - gz(b.land[1])) <= CD / 2) return { chip: b.id };
    }
    if (!lr.intersectPlane(plane0, hitP)) return null;
    let best = null, bd = 10 * k2px;
    SYS.conns.forEach((cn) => { const d = distTo(W3[cn.id], hitP.x, hitP.z); if (d < bd) { bd = d; best = cn.id; } });
    return best ? { conn: best } : null;
  }
  function connRect(id) {
    const ps = W3[id].pts.map(([x, z]) => project(x, TRY, z)), r = canvas.getBoundingClientRect();
    const l = Math.min(...ps.map((p) => p[0])), rr = Math.max(...ps.map((p) => p[0])), t = Math.min(...ps.map((p) => p[1])), b = Math.max(...ps.map((p) => p[1]));
    const cx = (l + rr) / 2, cy = (t + b) / 2, hw = Math.max(8, (rr - l) / 2 + 2), hh = Math.max(7, (b - t) / 2 + 2);
    return { left: r.left + cx - hw, right: r.left + cx + hw, top: r.top + cy - hh, bottom: r.top + cy + hh };
  }
  function chipClientRect(id) { const rc = chipRect(blockById[id]), r = canvas.getBoundingClientRect(); return { left: r.left + rc.l, right: r.left + rc.r, top: r.top + rc.t, bottom: r.top + rc.b }; }
  el.addEventListener('pointermove', (e) => {
    if (!B.acquired) return;
    if (e.pointerType === 'mouse') { const r = el.getBoundingClientRect(); qx((e.clientX - r.left) / r.width * 2 - 1); qy((e.clientY - r.top) / r.height * 2 - 1); }
    if (e.pointerType !== 'mouse') return;
    const h = pick(e.clientX, e.clientY);
    if (h && h.chip) {
      if (hoverConn) { hoverConn = null; endPreview(); }
      setHoverChip(h.chip); Probe.virtual(chipClientRect(h.chip), 'Inspect ' + blockById[h.chip].ref);
    } else if (h && h.conn) {
      setHoverChip(null);
      if (hoverConn !== h.conn) { hoverConn = h.conn; preview(h.conn); Probe.virtual(connRect(h.conn), 'Probe ' + connById[h.conn].label); }
    } else {
      if (!tipPinned) setHoverChip(null);
      if (hoverConn) { hoverConn = null; endPreview(); }
      Probe.virtual(null);
    }
  });
  el.addEventListener('pointerleave', () => { qx(0); qy(0); if (!tipPinned) setHoverChip(null); if (hoverConn) { hoverConn = null; endPreview(); } Probe.virtual(null); });
  el.addEventListener('click', (e) => {
    if (!B.acquired) return;
    const h = pick(e.clientX, e.clientY);
    if (h && h.conn) { pin(h.conn); tipPinned = false; setHoverChip(null); }
    else if (h && h.chip) { tipPinned = !(tipPinned && hoverId === h.chip); setHoverChip(tipPinned || e.pointerType === 'mouse' ? h.chip : null); }
    else { tipPinned = false; setHoverChip(null); }
  });

  /* state → visuals */
  let gem = true;
  function update() {
    const active = new Set([0, 1, 2, 3].map(probed));
    const idleItems = [], actItems = [];
    SYS.conns.forEach((cn) => {
      const P = W3[cn.id];
      const dimmer = (!gem && cn.id === 'gen') || (gem && cn.id === 'fb') ? 0.84 : 0.66;
      if (active.has(cn.id)) actItems.push({ P, color: new THREE.Color(CHC[cn.layer]) });
      else idleItems.push({ P, color: tint(CHC[cn.layer], dimmer) });
    });
    idle.geometry.dispose(); idle.geometry = segs(idleItems);
    act.geometry.dispose(); act.geometry = segs(actItems);
    [0, 1, 2, 3].forEach((ch) => {
      const t = W3[probed(ch)].clip;
      if (!clipTo[ch] || clipTo[ch][0] !== t[0] || clipTo[ch][1] !== t[1]) {
        clipTo[ch] = t;
        if (!probeMesh[ch].visible) return;
        if (RM) { clipNow[ch] = t.slice(); buildProbe(ch); return; }
        hop(ch, clipNow[ch].slice(), t, 0.3, 0.32); // the clip re-seats in 300ms
      }
    });
    invalidate();
  }
  function setGemini(on) {
    gem = on;
    gsap.to(uS[blockById.gemini.i], { z: on ? 0 : 0.62, duration: RM ? 0 : 0.35, onUpdate: invalidate });
    tag.classList.toggle('on', !on);
    update();
  }
  function pulse(route) {
    if (RM || pulses.length >= 4) return;
    pulses.push({ hops: route.map(([id, d, flag]) => ({ P: W3[id], dir: d, flag, end: d > 0 ? connById[id].to : connById[id].from })), i: 0, s: 0, last: performance.now(), pt: [0, 0] });
    invalidate();
  }

  /* acquisition: slide in on the rail, chips seat, copper draws, probes clip, scope re-triggers */
  function acquire(onProbes) {
    const maxLen = Math.max(...SYS.conns.map((cn) => W3[cn.id].len));
    update();
    if (RM) {
      uS.forEach((v) => { v.w = 1; }); setDraw(1e4); railMat.opacity = 1;
      [0, 1, 2, 3].forEach((ch) => { clipNow[ch] = W3[probed(ch)].clip.slice(); clipTo[ch] = clipNow[ch]; probeMesh[ch].visible = true; buildProbe(ch); });
      el.classList.add('gl-on'); invalidate(); onProbes(); return;
    }
    el.classList.add('gl-on');
    group.position.x = 11.5;
    gsap.to(group.position, { x: 0, duration: 0.5, ease: 'power3.out', onUpdate: invalidate });
    SYS.blocks.forEach((b, i) => gsap.to(uS[i], { w: 1, duration: 0.42, ease: 'lock', delay: 0.3 + i * 0.06, onUpdate: invalidate }));
    const t0 = 0.3 + NB * 0.06;
    gsap.to(draw, { p: maxLen, duration: maxLen / 7.5, ease: 'none', delay: t0, onUpdate: () => { setDraw(draw.p); invalidate(); }, onComplete: () => setDraw(1e4) });
    gsap.to(railMat, { opacity: 1, duration: 0.5, delay: t0 + 0.2, onUpdate: invalidate });
    const t1 = t0 + maxLen / 7.5;
    gsap.delayedCall(t1, () => {
      [0, 1, 2, 3].forEach((ch, k) => {
        const t = W3[probed(ch)].clip; clipTo[ch] = t; clipNow[ch] = t.slice(); lift[ch] = 1.1;
        probeMesh[ch].visible = true; buildProbe(ch);
        const o = { y: 1.1 };
        gsap.to(o, { y: 0, duration: 0.42, ease: 'lock', delay: k * 0.06, onUpdate: () => { lift[ch] = o.y; buildProbe(ch); invalidate(); } });
      });
      onProbes();
    });
    kick((t1 + 0.6) * 1000);
  }
  const ro = new ResizeObserver(fit); ro.observe(el);
  fit();
  renderer.compile(scene, camera);
  return { kind: '3d', acquire, update, setGemini, pulse, invalidate };
}

/* ---------- SVG board: phones, portrait tablets, and any device without WebGL2 ---------- */
function createBoardSVG(el, lay) {
  const host = $('.board-svg', el), tip = $('.tip', el), tag = $('.tag429', el);
  const port = lay === 'port';
  const G = port ? { px: 104, py: 70, x0: 94, y0: 34, w: 360, h: 410, fs: 10.5, sw: 2 } : { px: 196, py: 108, x0: 108, y0: 122, w: 1000, h: 488, fs: 15.5, sw: 2.4 };
  const ext = EXT[lay], X = (c) => G.x0 + c * G.px, Y = (r) => G.y0 + r * G.py;
  const hw = ext[0] * G.px, hh = ext[1] * G.py;
  const P2 = {}; SYS.conns.forEach((c) => { P2[c.id] = poly(chamfer(gridRoute(c, lay).map(([a, b]) => [X(a), Y(b)]), port ? 7 : 12)); });
  const RP = SYS.rails.map((r) => poly(chamfer(gridRoute(r, lay).map(([a, b]) => [X(a), Y(b)]), port ? 7 : 12)));
  const dPath = (P) => 'M' + P.pts.map((p) => p[0].toFixed(1) + ' ' + p[1].toFixed(1)).join(' L');
  const heads = port ? '' : ['Interface', 'Services', 'Data', 'Intelligence', 'Delivery'].map((h, k) => `<g transform="translate(${X(k) - hw} 22)"><rect width="16" height="16" fill="${CHC[k]}"/><text x="8" y="12.2" text-anchor="middle" font-size="10" font-weight="700" fill="#0E0F0D" class="m">${k < 4 ? k + 1 : 'Σ'}</text><text x="24" y="12.5" font-size="11.5" fill="#A29E93" class="m">${h.toUpperCase()}</text></g>`).join('');
  const chipsSvg = SYS.blocks.map((b) => {
    const x = X(b[lay][0]) - hw, y = Y(b[lay][1]) - hh;
    return `<g class="chp" data-id="${b.id}"><rect x="${x}" y="${y}" width="${hw * 2}" height="${hh * 2}" rx="2" fill="#1D1E1A" stroke="${CHC[b.layer]}" stroke-width="1.5" ${b.ext ? 'stroke-dasharray="5 4"' : ''}/><circle cx="${x + 7}" cy="${y + 7}" r="1.8" fill="${CHC[b.layer]}"/><text x="${x + hw}" y="${y + hh + G.fs * 0.36}" text-anchor="middle" font-size="${G.fs}" fill="#ECE8DF" class="d">${b.label}</text></g>`;
  }).join('');
  host.innerHTML = `<svg viewBox="0 0 ${G.w} ${G.h}" preserveAspectRatio="xMidYMid meet">
    <defs><pattern id="dots-${lay}" width="${port ? 12 : 18}" height="${port ? 12 : 18}" patternUnits="userSpaceOnUse"><rect x="5" y="5" width="1.6" height="1.6" fill="#24261F"/></pattern></defs>
    <rect width="${G.w}" height="${G.h}" fill="url(#dots-${lay})"/>
    ${heads}
    ${RP.map((P) => `<path d="${dPath(P)}" fill="none" stroke="#8C897F" stroke-width="1.2" stroke-dasharray="5 4" class="rail"/>`).join('')}
    ${SYS.conns.map((c) => `<path class="tr" data-id="${c.id}" d="${dPath(P2[c.id])}" fill="none" stroke-width="${G.sw}" stroke-linejoin="round"/>`).join('')}
    ${SYS.conns.map((c) => `<path class="hit" data-id="${c.id}" d="${dPath(P2[c.id])}" fill="none" stroke="transparent" stroke-width="${port ? 16 : 20}" style="cursor:pointer"/>`).join('')}
    ${chipsSvg}
    ${[0, 1, 2, 3].map((ch) => `<g class="pm" data-ch="${ch}" style="transition:transform .3s cubic-bezier(.2,.8,.2,1)"><circle r="${port ? 6.5 : 8}" fill="${CHC[ch]}" stroke="#0E0F0D" stroke-width="2"/><text y="${port ? 3.2 : 3.6}" text-anchor="middle" font-size="${port ? 8.5 : 10}" font-weight="700" fill="#0E0F0D" class="m">${ch + 1}</text></g>`).join('')}
    <circle class="pulse" r="${port ? 4 : 5}" fill="#fff" opacity="0" style="filter:drop-shadow(0 0 4px #fff)"/>
  </svg>`;
  const svg = $('svg', host);
  svg.querySelectorAll('.m').forEach((t) => { t.style.fontFamily = 'var(--f-m)'; t.style.fontStretch = '87.5%'; });
  svg.querySelectorAll('.d').forEach((t) => { t.style.fontFamily = 'var(--f-d)'; t.style.fontWeight = '600'; t.style.fontStretch = '87.5%'; });
  const trs = Object.fromEntries($$('.tr', svg).map((p) => [p.dataset.id, p]));
  const pms = $$('.pm', svg), dot = $('.pulse', svg);
  el.classList.add('svg-on');
  function sizeHost() {
    if (!SMALL()) return;
    const w = el.getBoundingClientRect().width - 16;
    el.style.height = Math.round(w * G.h / G.w + 52) + 'px';
  }
  sizeHost(); new ResizeObserver(sizeHost).observe(el);
  let gem = true;
  function update() {
    const active = new Set([0, 1, 2, 3].map(probed));
    SYS.conns.forEach((c) => {
      const p = trs[c.id], on = active.has(c.id), dim = (!gem && c.id === 'gen') || (gem && c.id === 'fb');
      p.setAttribute('stroke', on ? CHC[c.layer] : mixHex(CHC[c.layer], '#161713', dim ? 0.84 : 0.66));
      p.setAttribute('stroke-width', on ? G.sw * 1.35 : G.sw);
    });
    pms.forEach((m, ch) => { const t = P2[probed(ch)].clip; m.style.transform = `translate(${t[0]}px, ${t[1]}px)`; });
  }
  function setGemini(on) {
    gem = on;
    const g = $('.chp[data-id="gemini"]', svg); g.style.opacity = on ? 1 : 0.45; g.style.transition = 'opacity .3s';
    const r = $('rect', g).getBoundingClientRect(), br = el.getBoundingClientRect();
    tag.style.left = (r.right - br.left - 4) + 'px'; tag.style.top = (r.top - br.top) + 'px';
    tag.classList.toggle('on', !on); update();
  }
  let pulseRaf = 0;
  function pulse(route) {
    if (RM) return;
    cancelAnimationFrame(pulseRaf);
    const hops = route.map(([id, d]) => ({ P: P2[id], dir: d }));
    let i = 0, s = 0, last = performance.now(); const sp = port ? 240 : 520;
    dot.setAttribute('opacity', '1');
    const step = (now) => {
      s += sp * Math.min(0.05, (now - last) / 1000); last = now;
      while (hops[i] && s >= hops[i].P.len) { s -= hops[i].P.len; i++; }
      if (!hops[i]) { dot.setAttribute('opacity', '0'); return; }
      const pt = pointAt(hops[i].P, hops[i].dir > 0 ? s : hops[i].P.len - s);
      dot.setAttribute('cx', pt[0]); dot.setAttribute('cy', pt[1]);
      pulseRaf = requestAnimationFrame(step);
    };
    pulseRaf = requestAnimationFrame(step);
  }
  $$('.hit', svg).forEach((h) => {
    h.addEventListener('pointerenter', (e) => { if (e.pointerType === 'mouse' && B.acquired) preview(h.dataset.id); });
    h.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') endPreview(); });
    h.addEventListener('click', () => { if (B.acquired) pin(h.dataset.id); });
  });
  $$('.chp', svg).forEach((g) => g.addEventListener('click', () => {
    const b = blockById[g.dataset.id], r = $('rect', g).getBoundingClientRect(), br = el.getBoundingClientRect();
    const on = !(tip.classList.contains('on') && tip.dataset.id === b.id);
    tip.dataset.id = b.id; tip.style.setProperty('--tc', CHC[b.layer]);
    $('.tip-ref', tip).textContent = b.ref; $('.tip-name', tip).textContent = b.name; $('.tip-role', tip).textContent = b.role; $('.tip-tech', tip).textContent = b.tech;
    const w = Math.min(260, br.width - 24); tip.style.maxWidth = w + 'px';
    const x = clamp(r.left + r.width / 2 - br.left, w / 2 + 8, br.width - w / 2 - 8);
    tip.style.transform = `translate(${x}px, ${r.bottom - br.top + 8}px) translate(-50%, 0)`;
    tip.classList.toggle('on', on);
  }));
  function acquire(onProbes) {
    update();
    const paths = Object.values(trs);
    if (RM) { onProbes(); return; }
    paths.forEach((p) => { const l = p.getTotalLength(); p.style.strokeDasharray = l; p.style.strokeDashoffset = l; });
    gsap.from($$('.chp', svg), { opacity: 0, y: -6, duration: 0.4, ease: 'lock', stagger: 0.06 });
    const maxL = Math.max(...paths.map((p) => p.getTotalLength()));
    paths.forEach((p) => gsap.to(p.style, { strokeDashoffset: 0, duration: p.getTotalLength() / (port ? 260 : 600), ease: 'none', delay: 0.45, onComplete: () => { p.style.strokeDasharray = ''; } }));
    gsap.from(pms, { opacity: 0, duration: 0.3, ease: 'power3.out', stagger: 0.05, delay: 0.45 + maxL / (port ? 260 : 600) });
    gsap.delayedCall(0.45 + maxL / (port ? 260 : 600), onProbes);
  }
  return { kind: 'svg', acquire, update, setGemini, pulse, invalidate() {} };
}
function mixHex(a, b, k) {
  const pa = parseInt(a.slice(1), 16), pb = parseInt(b.slice(1), 16);
  const ch = (s) => Math.round(((pa >> s) & 255) * (1 - k) + ((pb >> s) & 255) * k);
  return '#' + [16, 8, 0].map((s) => ch(s).toString(16).padStart(2, '0')).join('');
}

/* ---------- bench controller: lazy init, acquisition, live /ws/kpi pushes ---------- */
let wsTimer = 0, benchInit = false, wantAcquire = false;
function webgl2OK() { try { return !!D.createElement('canvas').getContext('webgl2'); } catch (_) { return false; } }
async function initBench() {
  if (benchInit) return; benchInit = true;
  scope2 = createScope2($('.scope2', benchSec));
  SYS.probes.forEach((id, ch) => scope2.label(ch, id));
  const lowEnd = (navigator.deviceMemory && navigator.deviceMemory <= 2) || (navigator.connection && navigator.connection.saveData);
  const use3D = !SMALL() && webgl2OK() && !lowEnd;
  if (use3D) { try { view = await createBoard3D(boardEl); } catch (_) { view = null; } }
  if (!view) view = createBoardSVG(boardEl, panel.getBoundingClientRect().width < 600 ? 'port' : 'land');
  syncList();
  if (wantAcquire) acquire();
  ScrollTrigger.refresh();
}
function acquire() {
  if (!view) { wantAcquire = true; return; }
  if (B.acquired) return;
  B.acquired = true; wantAcquire = false;
  view.acquire(() => {
    [0, 1, 2, 3].forEach((ch) => scope2.setChannel(ch, probed(ch)));
    scope2.summary();
    boardEl.classList.add('live'); $('.bh-st em', boardEl).textContent = 'Running';
    updateRolling();
    if (!RM && signalsOn) gsap.delayedCall(0.55, () => view.pulse(requestRoute()));
    scheduleWs();
  });
}
function updateRolling() { if (scope2) scope2.setRolling(!RM && signalsOn && !SMALL() && B.visible); }
function scheduleWs() {
  clearTimeout(wsTimer);
  if (RM) return;
  wsTimer = setTimeout(() => {
    if (signalsOn && B.visible && !D.hidden && B.acquired) {
      if (!SMALL()) scope2.push();
      view.pulse([['kpi', 1]]);
    }
    scheduleWs();
  }, 3000 + Math.random() * 5000); // the README's cadence: every 3-8 s
}
new IntersectionObserver((es) => { if (es[0].isIntersecting) initBench(); }, { rootMargin: '120% 0px 120% 0px' }).observe(benchSec);
new IntersectionObserver((es) => { B.visible = es[0].isIntersecting; updateRolling(); if (B.visible && scope2) scope2.kick(); }).observe(panel);
ScrollTrigger.create({ trigger: SMALL() ? panel : '.entry', start: SMALL() ? 'top 82%' : 'top 70%', onEnter: acquire, onEnterBack: acquire });
if (!RM && FINE) afterBoot(() => { (window.requestIdleCallback || setTimeout)(() => { import('three').catch(() => {}); }, { timeout: 2500 }); });

/* parts table: rows rise 12px with a 50ms stagger, once */
if (!RM) gsap.from('.parts tbody tr', { y: 12, autoAlpha: 0, duration: 0.5, ease: 'panel', stagger: 0.05, scrollTrigger: { trigger: '.parts', start: 'top 85%', once: true } });

/* ======================= 03 record sheet ======================= */
if (!RM) {
  gsap.from('.rev tbody tr', { y: 14, autoAlpha: 0, duration: 0.55, ease: 'panel', stagger: 0.07, scrollTrigger: { trigger: '.rev', start: 'top 82%', once: true } });
  gsap.from('.rec-col li, .studying', { y: 14, autoAlpha: 0, duration: 0.55, ease: 'panel', stagger: 0.05, scrollTrigger: { trigger: '.records', start: 'top 86%', once: true } });
}

/* ======================= 04 contact ======================= */
(function contact() {
  const term = $('.term'), svg = $('svg', term), path = $('.term-path', svg), pulse = $('.term-pulse', svg), email = $('.email', term);
  const status = $('.copy-status'), btn = $('.copy'), ADDR = 'prajwalnair2603@gmail.com';
  let len = 1, drawn = RM, t = 0;
  function geo() {
    const sr = svg.getBoundingClientRect(), er = email.getBoundingClientRect();
    const rects = [...email.getClientRects()], last = rects[rects.length - 1] || er;
    const y = last.bottom - sr.top - 3, x1 = er.left - sr.left - 14;
    const d = `M0 ${y - 44} H${Math.max(12, x1 - 64)} L${x1 - 20} ${y} H${sr.width}`;
    path.setAttribute('d', d); pulse.setAttribute('d', d);
    len = path.getTotalLength();
    path.style.strokeDasharray = len; pulse.style.strokeDasharray = `70 ${len + 70}`; pulse.style.strokeDashoffset = 70;
    path.style.strokeDashoffset = drawn ? 0 : len;
  }
  geo(); addEventListener('resize', geo); D.fonts.ready.then(geo);
  if (!RM) ScrollTrigger.create({ trigger: term, start: 'top 80%', once: true, onEnter: () => { gsap.fromTo(path, { strokeDashoffset: len }, { strokeDashoffset: 0, duration: 1.0, ease: 'beam', onComplete: () => { drawn = true; } }); } });
  const sendPulse = () => { if (!RM) gsap.fromTo(pulse, { strokeDashoffset: 70 }, { strokeDashoffset: -len, duration: 0.7, ease: 'power2.in' }); };
  btn.addEventListener('click', async () => {
    clearTimeout(t);
    let ok = false;
    try { if (navigator.clipboard && window.isSecureContext) { await navigator.clipboard.writeText(ADDR); ok = true; } } catch (_) { ok = false; }
    if (!ok) {
      try {
        const ta = D.createElement('textarea'); ta.value = ADDR; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:-200px;opacity:0';
        D.body.appendChild(ta); ta.select(); ok = D.execCommand('copy'); ta.remove(); btn.focus();
      } catch (_) { ok = false; }
    }
    if (ok) { btn.textContent = 'Copied'; status.textContent = 'Address copied to clipboard'; sendPulse(); }
    else { const r = D.createRange(); r.selectNodeContents(email); const s = getSelection(); s.removeAllRanges(); s.addRange(r); status.textContent = 'Selected: press Ctrl+C / ⌘C'; }
    t = setTimeout(() => { btn.textContent = 'Copy address'; status.textContent = ''; }, 2400);
  });
  const ist = $('.ist'), fmt = new Intl.DateTimeFormat('en-GB', { timeZone: 'Asia/Kolkata', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' });
  const tick = () => { const now = new Date(); ist.textContent = fmt.format(now) + ' IST'; ist.setAttribute('datetime', now.toISOString()); setTimeout(tick, 60000 - (now.getSeconds() * 1000 + now.getMilliseconds()) + 50); };
  tick();
})();

/* ======================= footer: real motion and signal controls ======================= */
const tgM = $('.tg-motion'), tgS = $('.tg-signals');
tgM.innerHTML = `Motion: ${RM ? 'reduced' : 'full'}<span class="sr"> (switch to ${RM ? 'full' : 'reduced'} motion; the page reloads in place)</span>`;
tgM.setAttribute('aria-pressed', String(RM));
tgM.addEventListener('click', () => {
  store.set('pmp-motion', RM ? 'full' : 'reduced');
  try { sessionStorage.setItem('pmp-restore', String(Math.round(window.scrollY))); } catch (_) {}
  location.reload();
});
function paintSignals() {
  tgS.innerHTML = `Signals: ${signalsOn ? 'on' : 'paused'}<span class="sr"> (${signalsOn ? 'pause' : 'resume'} looping signals)</span>`;
  tgS.setAttribute('aria-pressed', String(signalsOn));
  root.classList.toggle('signals-off', !signalsOn);
}
paintSignals();
tgS.addEventListener('click', () => {
  signalsOn = !signalsOn; store.set('pmp-signals', signalsOn ? 'on' : 'paused'); paintSignals();
  updateRolling(); if (signalsOn) scheduleWs();
});

/* ======================= start ======================= */
function start() {
  measureCap();
  layoutHero();
  layoutRecord();
  ScrollTrigger.refresh();
  if (restoreY > 0) {
    lockedFrame();
    if (lenis) lenis.scrollTo(restoreY, { immediate: true, force: true }); else window.scrollTo(0, restoreY);
  } else if (RM || !scope) lockedFrame();
  else opening();
  afterBoot(idleSweep);
}
let started = false;
const go = () => { if (!started) { started = true; start(); } };
// start on fonts (so the graticule is measured from the real name) but never wait more than 600ms
D.fonts.ready.then(go); setTimeout(go, 600);
D.fonts.ready.then(() => { measureCap(); layoutHero(); layoutRecord(); ScrollTrigger.refresh(); });
let rzT = 0;
addEventListener('resize', () => { clearTimeout(rzT); rzT = setTimeout(() => { layoutHero(); layoutRecord(); }, 140); });
addEventListener('load', () => { layoutRecord(); ScrollTrigger.refresh(); });
})();
