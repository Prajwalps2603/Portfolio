import { CHANNELS, PALETTE, hexToRgb01 } from "@/lib/channels";
import { MAX_QUIET, QUIET_PAPER, QUIET_TRACE } from "./pageMap";
import { FS_COMP, FS_DECAY, FS_TRACE, VS_QUAD, VS_TRACE } from "./shaders";

/**
 * The scope renderer (one fixed, viewport-sized canvas behind the page): raw WebGL2, no three.js (the spec keeps the critical path at about
 * 6KB gz; three/R3F belong to the lazily loaded bench). Three passes per frame:
 *   1. decay   previous accumulation x exp(-dt/tau) into the other ping-pong target
 *   2. trace   additive instanced beam segments into that target
 *   3. comp    graticule + tone-mapped accumulation + head/probe/trigger to the canvas
 * Half-float targets when the GPU can render to them, RGBA8 otherwise.
 */

export type FrameInput = {
  time: number;
  split: number;
  noise: number;
  roll: readonly number[];
  reveal: number;
  /** CH1..CH4 lane centres, device px. */
  lanes: readonly number[];
  sumY: number;
  rawY: number;
  amp: number;
  /** [x, y, energy] in device px. */
  probe: readonly [number, number, number];
  hover: number;
  sigma: number;
  core: number;
  halo: number;
  xs: number;
  energy: number;
  decay: number;
  grat: number;
  gratX: number;
  head: readonly [number, number, number];
  probeVis: number;
  dpr: number;
  rect: readonly number[];
  div: readonly number[];
  trigY: number;
  trigVis: number;
  gain: number;
  /** Section edge trace: [y device px, reveal 0..1, intensity (pre-gain), channel 0..4]. */
  edge: readonly [number, number, number, number];
  edgeAmp: number;
  /** Viewport y (device px) below which the plain page graticule continues (the hero's bottom). */
  ambTop: number;
  /** Strength of that page graticule, 0..1. */
  ambGrat: number;
  /** Quiet zones in view (./pageMap), [x0, y0, x1, y1] device px each, MAX_QUIET * 4 floats. */
  quiet: Float32Array;
  quietN: number;
  /** Soft edge of a quiet zone, device px. */
  quietF: number;
};

export type ScopeRenderer = {
  resize(width: number, height: number, segments: number): void;
  frame(input: FrameInput): void;
  dispose(): void;
  readonly gl: WebGL2RenderingContext;
};

type Program = { p: WebGLProgram; u: (name: string) => WebGLUniformLocation | null };
type Target = { f: WebGLFramebuffer; t: WebGLTexture };

/** CH1..CH4, Σ, then the section edge trace. */
const LANES = 6;

export function createScopeRenderer(canvas: HTMLCanvasElement): ScopeRenderer | null {
  const gl = canvas.getContext("webgl2", {
    antialias: false,
    alpha: false,
    depth: false,
    stencil: false,
    premultipliedAlpha: false,
    preserveDrawingBuffer: false,
    powerPreference: "high-performance",
  });
  if (!gl) return null;

  const floatOK = !!(gl.getExtension("EXT_color_buffer_float") || gl.getExtension("EXT_color_buffer_half_float"));
  const shaders: WebGLShader[] = [];
  const programs: WebGLProgram[] = [];

  const compile = (type: number, src: string) => {
    const s = gl.createShader(type);
    if (!s) throw new Error("scope: shader alloc failed");
    gl.shaderSource(s, src);
    gl.compileShader(s);
    if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "scope: compile failed");
    shaders.push(s);
    return s;
  };
  const program = (vs: string, fs: string): Program => {
    const p = gl.createProgram();
    if (!p) throw new Error("scope: program alloc failed");
    gl.attachShader(p, compile(gl.VERTEX_SHADER, vs));
    gl.attachShader(p, compile(gl.FRAGMENT_SHADER, fs));
    gl.linkProgram(p);
    if (!gl.getProgramParameter(p, gl.LINK_STATUS)) throw new Error(gl.getProgramInfoLog(p) ?? "scope: link failed");
    programs.push(p);
    const cache = new Map<string, WebGLUniformLocation | null>();
    return {
      p,
      u: (n) => {
        if (!cache.has(n)) cache.set(n, gl.getUniformLocation(p, n));
        return cache.get(n) ?? null;
      },
    };
  };

  const T = program(VS_TRACE, FS_TRACE);
  const Dk = program(VS_QUAD, FS_DECAY);
  const C = program(VS_QUAD, FS_COMP);

  // static colour uniforms (the palette lives in src/lib/channels.ts)
  gl.useProgram(T.p);
  gl.uniform3fv(T.u("uCol"), new Float32Array(CHANNELS.flatMap((c) => hexToRgb01(c.hex))));
  gl.useProgram(C.p);
  gl.uniform3fv(C.u("uBg"), hexToRgb01(PALETTE.graphite));
  gl.uniform3fv(C.u("uGrid"), hexToRgb01(PALETTE.graticule));
  gl.uniform3fv(C.u("uAxis"), hexToRgb01(PALETTE.graticuleStrong));
  gl.uniform3fv(C.u("uBone"), hexToRgb01(PALETTE.bone));
  gl.uniform1f(C.u("uQuietTrace"), QUIET_TRACE);
  gl.uniform1f(C.u("uQuietPaper"), QUIET_PAPER);
  gl.useProgram(T.p);
  gl.uniform1f(T.u("uQuietAmp"), QUIET_TRACE);
  const setQuiet = (P: Program, s: FrameInput) => {
    gl.uniform4fv(P.u("uQuiet"), s.quiet, 0, MAX_QUIET * 4);
    gl.uniform1i(P.u("uQuietN"), Math.min(s.quietN, MAX_QUIET));
    gl.uniform1f(P.u("uQuietF"), s.quietF);
  };

  const buffers: WebGLBuffer[] = [];
  const buffer = () => {
    const b = gl.createBuffer();
    if (!b) throw new Error("scope: buffer alloc failed");
    buffers.push(b);
    return b;
  };

  const quad = gl.createVertexArray();
  gl.bindVertexArray(quad);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);

  const traceVao = gl.createVertexArray();
  gl.bindVertexArray(traceVao);
  gl.bindBuffer(gl.ARRAY_BUFFER, buffer());
  gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([0, -1, 0, 1, 1, -1, 1, 1]), gl.STATIC_DRAW);
  gl.enableVertexAttribArray(0);
  gl.vertexAttribPointer(0, 2, gl.FLOAT, false, 0, 0);
  const instances = buffer();
  gl.bindVertexArray(null);

  let N = 0;
  let W = 0;
  let H = 0;
  let targets: Target[] = [];
  let cur = 0;

  const setSegments = (n: number) => {
    if (n === N) return;
    N = n;
    const a = new Float32Array(n * LANES * 2);
    let k = 0;
    for (let c = 0; c < LANES; c++)
      for (let i = 0; i < n; i++) {
        a[k++] = i;
        a[k++] = c;
      }
    gl.bindVertexArray(traceVao);
    gl.bindBuffer(gl.ARRAY_BUFFER, instances);
    gl.bufferData(gl.ARRAY_BUFFER, a, gl.STATIC_DRAW);
    gl.enableVertexAttribArray(1);
    gl.vertexAttribPointer(1, 2, gl.FLOAT, false, 0, 0);
    gl.vertexAttribDivisor(1, 1);
    gl.bindVertexArray(null);
  };

  const makeTarget = (w: number, h: number): Target => {
    const t = gl.createTexture();
    const f = gl.createFramebuffer();
    if (!t || !f) throw new Error("scope: target alloc failed");
    gl.bindTexture(gl.TEXTURE_2D, t);
    if (floatOK) gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA16F, w, h, 0, gl.RGBA, gl.HALF_FLOAT, null);
    else gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA8, w, h, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.NEAREST);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
    gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    gl.bindFramebuffer(gl.FRAMEBUFFER, f);
    gl.framebufferTexture2D(gl.FRAMEBUFFER, gl.COLOR_ATTACHMENT0, gl.TEXTURE_2D, t, 0);
    gl.clearColor(0, 0, 0, 1);
    gl.clear(gl.COLOR_BUFFER_BIT);
    return { f, t };
  };
  const dropTargets = () => {
    targets.forEach((x) => {
      gl.deleteTexture(x.t);
      gl.deleteFramebuffer(x.f);
    });
    targets = [];
  };

  return {
    gl,
    resize(width, height, segments) {
      const w = Math.max(1, Math.round(width));
      const h = Math.max(1, Math.round(height));
      if (w !== W || h !== H || !targets.length) {
        W = canvas.width = w;
        H = canvas.height = h;
        dropTargets();
        targets = [makeTarget(w, h), makeTarget(w, h)];
        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      }
      setSegments(segments);
    },
    frame(s) {
      if (!targets.length || !N) return;
      const src = targets[cur];
      const dst = targets[1 - cur];

      // 1. persistence
      gl.bindFramebuffer(gl.FRAMEBUFFER, dst.f);
      gl.viewport(0, 0, W, H);
      gl.disable(gl.BLEND);
      gl.useProgram(Dk.p);
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, src.t);
      gl.uniform1i(Dk.u("uPrev"), 0);
      gl.uniform1f(Dk.u("uDecay"), s.decay);
      gl.bindVertexArray(quad);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);

      // 2. beam segments, additive
      gl.enable(gl.BLEND);
      gl.blendFunc(gl.ONE, gl.ONE);
      gl.useProgram(T.p);
      const u = T.u;
      gl.uniform2f(u("uRes"), W, H);
      gl.uniform1f(u("uN"), N);
      gl.uniform1f(u("uTime"), s.time);
      gl.uniform1f(u("uSplit"), s.split);
      gl.uniform1f(u("uNoise"), s.noise);
      gl.uniform4f(u("uRoll"), s.roll[0], s.roll[1], s.roll[2], s.roll[3]);
      gl.uniform1f(u("uReveal"), s.reveal);
      gl.uniform4f(u("uLaneY"), s.lanes[0], s.lanes[1], s.lanes[2], s.lanes[3]);
      gl.uniform1f(u("uSumY"), s.sumY);
      gl.uniform1f(u("uRawY"), s.rawY);
      gl.uniform1f(u("uAmp"), s.amp);
      gl.uniform3f(u("uProbe"), s.probe[0], s.probe[1], s.probe[2]);
      gl.uniform1f(u("uHover"), s.hover);
      gl.uniform1f(u("uSigma"), s.sigma);
      gl.uniform1f(u("uXS"), s.xs);
      gl.uniform1f(u("uCore"), s.core);
      gl.uniform1f(u("uEnergy"), s.energy);
      gl.uniform1f(u("uHalo"), s.halo);
      gl.uniform4f(u("uEdge"), s.edge[0], s.edge[1], s.edge[2], s.edge[3]);
      gl.uniform1f(u("uEdgeAmp"), s.edgeAmp);
      setQuiet(T, s);
      gl.bindVertexArray(traceVao);
      gl.drawArraysInstanced(gl.TRIANGLE_STRIP, 0, 4, N * (s.edge[2] > 0 ? LANES : LANES - 1));
      gl.disable(gl.BLEND);

      // 3. composite to the canvas
      gl.bindFramebuffer(gl.FRAMEBUFFER, null);
      gl.viewport(0, 0, W, H);
      gl.useProgram(C.p);
      const c = C.u;
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, dst.t);
      gl.uniform1i(c("uAcc"), 0);
      gl.uniform2f(c("uRes"), W, H);
      gl.uniform1f(c("uGrat"), s.grat);
      gl.uniform1f(c("uGratX"), s.gratX);
      gl.uniform3f(c("uHead"), s.head[0], s.head[1], s.head[2]);
      gl.uniform3f(c("uProbe"), s.probe[0], s.probe[1], s.probe[2]);
      gl.uniform1f(c("uProbeVis"), s.probeVis);
      gl.uniform1f(c("uDpr"), s.dpr);
      gl.uniform4f(c("uRect"), s.rect[0], s.rect[1], s.rect[2], s.rect[3]);
      gl.uniform2f(c("uDiv"), s.div[0], s.div[1]);
      gl.uniform1f(c("uTrigY"), s.trigY);
      gl.uniform1f(c("uTrigVis"), s.trigVis);
      gl.uniform1f(c("uGain"), s.gain);
      gl.uniform1f(c("uAmbTop"), s.ambTop);
      gl.uniform1f(c("uAmbGrat"), s.ambGrat);
      setQuiet(C, s);
      gl.bindVertexArray(quad);
      gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
      gl.bindVertexArray(null);
      cur = 1 - cur;
    },
    dispose() {
      if (gl.isContextLost()) return;
      dropTargets();
      buffers.forEach((b) => gl.deleteBuffer(b));
      gl.deleteVertexArray(quad);
      gl.deleteVertexArray(traceVao);
      programs.forEach((p) => gl.deleteProgram(p));
      shaders.forEach((s) => gl.deleteShader(s));
    },
  };
}
