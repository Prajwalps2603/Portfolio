import { MAX_QUIET } from "./pageMap";
import { GLSL_WAVE } from "./wave";

/**
 * Ambient level (./pageMap): the quiet zones behind dense copy, viewport device px, and the
 * factor at a point: 1 in the open, `lvl` inside a zone, a soft edge `uQuietF` wide centred on
 * the zone's border.
 */
const GLSL_QUIET = /* glsl */ `
uniform vec4 uQuiet[${MAX_QUIET}]; uniform int uQuietN; uniform float uQuietF;
float quietMask(vec2 p){
  float q = 0.0;
  for (int i = 0; i < ${MAX_QUIET}; i++){
    if (i >= uQuietN) break;
    vec4 r = uQuiet[i];
    vec2 d = max(r.xy - p, p - r.zw);
    q = max(q, 1.0 - smoothstep(-0.5*uQuietF, 0.5*uQuietF, max(d.x, d.y)));
  }
  return q;
}
float ambient(vec2 p, float lvl){ return mix(1.0, lvl, quietMask(p)); }`;

/**
 * The hero scope's shaders (raw WebGL2, GLSL ES 3.00). Ported from the approved sketch.
 *
 * TRACE  one instanced quad per beam segment (5 channels + the section edge trace, x N segments). The waveform is
 *        evaluated in the vertex shader from uniforms, so the CPU does no per-frame geometry.
 *        The fragment shader integrates a Gaussian beam along the segment analytically (two erf
 *        calls, after m1el's woscope), so steep edges render dimmer, like a real CRT.
 * DECAY  multiplies the previous accumulation by exp(-dt / tau): frame-rate independent
 *        phosphor persistence (tau = 75ms).
 * COMP   draws the procedural graticule (divisions, centre axes, minor ticks; below the hero it
 *        continues as plain divisions, the page's graph paper), tone-maps the
 *        accumulation with 1 - e^(-1.7x) (bloom capped so traces read as phosphor, not neon),
 *        then the beam head, the probe's dashed measurement cursor and the trigger level line.
 *
 * The canvas is a fixed, viewport-sized layer behind the whole page. All geometry is in device
 * pixels of the viewport, y down (the DOM's convention); the CPU converts hero coordinates
 * (layout cache) to viewport coordinates with the scroll offset. The vertex shader flips.
 */

export const VS_TRACE = /* glsl */ `#version 300 es
precision highp float;
layout(location=0) in vec2 aCorner;
layout(location=1) in vec2 aInst;
uniform vec2 uRes; uniform float uN; uniform float uTime; uniform float uSplit; uniform float uNoise;
uniform vec4 uRoll; uniform float uReveal; uniform vec4 uLaneY; uniform float uSumY; uniform float uRawY;
uniform float uAmp; uniform vec3 uProbe; uniform float uHover; uniform float uSigma; uniform float uXS;
uniform vec3 uCol[5];
// section edge trace: [y, reveal 0..1, intensity, channel 0..4] and its amplitude (device px)
uniform vec4 uEdge; uniform float uEdgeAmp;
// ambient level: amplitude behind dense copy (alpha is applied in COMP, after the persistence)
uniform float uQuietAmp;
out vec2 vLocal; out float vLen; out vec3 vCol; out float vI;
${GLSL_WAVE}
${GLSL_QUIET}
float hash(float n){ return fract(sin(n)*43758.5453123); }
float laneOf(int c){ return c==0?uLaneY.x : c==1?uLaneY.y : c==2?uLaneY.z : uLaneY.w; }
float rollOf(int c){ return c==0?uRoll.x : c==1?uRoll.y : c==2?uRoll.z : uRoll.w; }
float sumW(float x){ return (wave(0,x+uRoll.x)*0.95 + wave(1,x+uRoll.y)*0.55 + wave(2,x+uRoll.z)*0.5 + wave(3,x+uRoll.w)*0.4)/1.75; }
vec2 P(int ch, float i){
  float x = i/uN; float xs = x*uXS;
  if (ch == 5){
    int ec = int(uEdge.w + 0.5);
    float e = ec == 4 ? sumW(xs) : wave(ec, xs + rollOf(ec));
    float ex = x*uRes.x;
    return vec2(ex, uEdge.x - e*uEdgeAmp*ambient(vec2(ex, uEdge.x), uQuietAmp));
  }
  float comp = sumW(xs); float y; float lane;
  if (ch == 4){ y = comp; lane = mix(uRawY, uSumY, uSplit); }
  else { y = mix(comp, wave(ch, xs + rollOf(ch)), uSplit); lane = mix(uRawY, laneOf(ch), uSplit); }
  float px = x*uRes.x;
  float amp = mix(uAmp*2.4, uAmp, uSplit)*ambient(vec2(px, lane), uQuietAmp);
  y += (hash(i*1.731 + float(ch)*91.7 + floor(uTime*30.0)*7.13) - 0.5) * 2.0 * uNoise;
  // probe ripple: a Gaussian-windowed damped sine whose energy comes from pointer speed
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
  if (ch == 5){
    // the section's channel runs along its top edge, swept in by scroll
    vCol = uCol[int(uEdge.w + 0.5)];
    vI = step((i + 1.0)/uN, uEdge.y + 1e-4)*uEdge.z;
    vec2 e = pos/uRes*2.0 - 1.0;
    gl_Position = vec4(e.x, -e.y, 0.0, 1.0);
    return;
  }
  // the raw composite is bone; the split fades each lane into its channel colour
  vCol = mix(uCol[4], uCol[ch], smoothstep(0.0, 0.7, uSplit));
  float vis = step((i + 1.0)/uN, uReveal + 1e-4);
  float boost = uHover < -0.5 ? 1.0 : (abs(uHover - float(ch)) < 0.5 ? 1.75 : 0.45);
  float overlap = mix(0.34, 1.0, smoothstep(0.0, 0.4, uSplit));
  vI = vis*boost*overlap;
  vec2 ndc = pos/uRes*2.0 - 1.0;
  gl_Position = vec4(ndc.x, -ndc.y, 0.0, 1.0);
}`;

export const FS_TRACE = /* glsl */ `#version 300 es
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

export const VS_QUAD = /* glsl */ `#version 300 es
layout(location=0) in vec2 p; void main(){ gl_Position = vec4(p, 0.0, 1.0); }`;

export const FS_DECAY = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uPrev; uniform float uDecay; out vec4 o;
void main(){ vec3 c = texelFetch(uPrev, ivec2(gl_FragCoord.xy), 0).rgb; o = vec4(max(c*uDecay - 0.002, 0.0), 1.0); }`;

export const FS_COMP = /* glsl */ `#version 300 es
precision highp float;
uniform sampler2D uAcc; uniform vec2 uRes; uniform float uGrat; uniform float uGratX; uniform vec3 uHead;
uniform vec3 uProbe; uniform float uProbeVis; uniform float uDpr; uniform vec4 uRect; uniform vec2 uDiv;
uniform float uTrigY; uniform float uTrigVis; uniform float uGain;
uniform float uAmbTop; uniform float uAmbGrat;
uniform vec3 uBg; uniform vec3 uGrid; uniform vec3 uAxis; uniform vec3 uBone;
uniform float uQuietTrace; uniform float uQuietPaper;
out vec4 o;
${GLSL_QUIET}
float line(float d, float w){ return 1.0 - smoothstep(w*0.5, w*0.5 + 1.0, abs(d)); }
float gridL(float c, float s, float w){ float f = (fract(c/s + 0.5) - 0.5)*s; return line(f, w); }
void main(){
  vec2 fc = vec2(gl_FragCoord.x, uRes.y - gl_FragCoord.y);
  vec3 col = uBg;
  vec2 g0 = uRect.xy, g1 = uRect.zw; vec2 gs = (g1 - g0)/uDiv; vec2 q = fc - g0;
  float inside = step(-0.5, q.x)*step(-0.5, q.y)*step(fc.x, g1.x + 0.5)*step(fc.y, g1.y + 0.5);
  float grid = max(gridL(q.x, gs.x, uDpr), gridL(q.y, gs.y, uDpr))*inside;
  vec2 c = g0 + gs*floor(uDiv*0.5 + 0.01);
  float ax = max(line(fc.y - c.y, uDpr), line(fc.x - c.x, uDpr))*inside;
  float tk = max(gridL(q.x, gs.x/5.0, uDpr)*step(abs(fc.y - c.y), 4.0*uDpr), gridL(q.y, gs.y/5.0, uDpr)*step(abs(fc.x - c.x), 4.0*uDpr))*inside;
  // the graticule materialises 140px behind the beam
  float ga = uGrat*clamp((uGratX - fc.x)/(140.0*uDpr), 0.0, 1.0);
  col = mix(col, uGrid, grid*ga);
  col = mix(col, uAxis, max(ax, tk)*ga);
  // below the hero: the same divisions, rows continuing from the hero's, scrolling with the page
  float amb = step(g0.x - 0.5, fc.x)*step(fc.x, g1.x + 0.5)*step(uAmbTop, fc.y);
  float ag = max(gridL(q.x, gs.x, uDpr), gridL(q.y, gs.y, uDpr))*amb;
  float qm = quietMask(fc);
  col = mix(col, uGrid, ag*uAmbGrat*uGrat*mix(1.0, uQuietPaper, qm));
  vec3 acc = texelFetch(uAcc, ivec2(gl_FragCoord.xy), 0).rgb;
  vec3 tr = 1.0 - exp(-acc*1.7);
  float m = max(acc.r, max(acc.g, acc.b));
  tr = mix(tr, vec3(1.0, 0.985, 0.955), smoothstep(1.3, 4.0, m)*0.5);
  // gain < 1 as the hero scrolls away: the traces recede behind the next section
  // and behind dense copy (bench, parts list) they step down again, so the text stays foreground
  col += tr*uGain*mix(1.0, uQuietTrace, qm);
  float dh = length(fc - uHead.xy);
  col += vec3(1.0, 0.96, 0.9)*uHead.z*(exp(-dh*dh/(2.0*pow(2.6*uDpr, 2.0))) + 0.22*exp(-dh*dh/(2.0*pow(20.0*uDpr, 2.0))));
  // probe: a bone dashed measurement cursor at the pointer's x
  float pl = line(fc.x - uProbe.x, uDpr)*step(0.5, fract(fc.y/(7.0*uDpr)));
  col = mix(col, uBone, pl*uProbeVis*0.42);
  // trigger level while it is being dragged
  float tl = line(fc.y - uTrigY, uDpr)*step(0.5, fract(fc.x/(9.0*uDpr)));
  col = mix(col, uBone, tl*uTrigVis*0.7);
  o = vec4(col, 1.0);
}`;
